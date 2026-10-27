import { getPool } from '../db.js';
import { sheetsSyncService } from './sheetsSyncService.js';

export class InvoiceService {
  /**
   * Lấy toàn bộ danh sách hóa đơn
   */
  async getAllInvoices() {
    const pool = getPool();
    const [rows]: any = await pool.query(`
      SELECT 
        i.id,
        i.invoice_number AS invoiceNumber,
        DATE_FORMAT(i.invoice_date, '%Y-%m-%d') AS invoiceDate,
        i.batch_id AS batchId,
        i.batch_number AS batchNumber,
        i.pre_expense_total AS preExpenseTotal,
        i.expenses_total AS expensesTotal,
        i.post_expense_total AS postExpenseTotal,
        i.notes,
        b.batch_name AS batchName,
        b.supplier,
        DATE_FORMAT(b.import_date, '%Y-%m-%d') AS importDate,
        (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) AS itemCount
      FROM invoices i
      JOIN batches b ON i.batch_id = b.id
      ORDER BY i.invoice_date DESC, i.created_at DESC
    `);

    // Gắn thêm items tóm tắt
    for (const inv of rows) {
      inv.preExpenseTotal = Number(inv.preExpenseTotal) || 0;
      inv.expensesTotal = Number(inv.expensesTotal) || 0;
      inv.postExpenseTotal = Number(inv.postExpenseTotal) || 0;
      inv.itemCount = Number(inv.itemCount) || 0;

      const [items]: any = await pool.query(
        `SELECT id, medicine_name AS medicineName, unit, quantity, unit_price AS unitPrice, amount 
         FROM invoice_items WHERE invoice_id = ? LIMIT 5`,
        [inv.id]
      );
      inv.items = items.map((it: any) => ({
        ...it,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        amount: Number(it.amount),
      }));
    }

    return rows;
  }

  /**
   * Lấy chi tiết một hóa đơn theo ID
   */
  async getInvoiceById(id: string) {
    const pool = getPool();
    const [rows]: any = await pool.query(
      `SELECT 
        id,
        invoice_number AS invoiceNumber,
        DATE_FORMAT(invoice_date, '%Y-%m-%d') AS invoiceDate,
        batch_id AS batchId,
        batch_number AS batchNumber,
        pre_expense_total AS preExpenseTotal,
        expenses_total AS expensesTotal,
        post_expense_total AS postExpenseTotal,
        notes
       FROM invoices WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    const inv = rows[0];
    inv.preExpenseTotal = Number(inv.preExpenseTotal) || 0;
    inv.expensesTotal = Number(inv.expensesTotal) || 0;
    inv.postExpenseTotal = Number(inv.postExpenseTotal) || 0;

    const [items]: any = await pool.query(
      `SELECT id, invoice_id AS invoiceId, medicine_name AS medicineName, specification, unit, quantity, unit_price AS unitPrice, amount, notes
       FROM invoice_items WHERE invoice_id = ? ORDER BY created_at ASC`,
      [id]
    );
    inv.items = items.map((it: any) => ({
      ...it,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      amount: Number(it.amount),
    }));

    const [expenses]: any = await pool.query(
      `SELECT id, invoice_id AS invoiceId, expense_name AS expenseName, category, amount, notes
       FROM expenses WHERE invoice_id = ? ORDER BY created_at ASC`,
      [id]
    );
    inv.expenses = expenses.map((e: any) => ({
      ...e,
      amount: Number(e.amount),
    }));

    return inv;
  }

  /**
   * Tạo hoặc cập nhật toàn bộ hóa đơn cho lô thuốc trong một Transaction
   */
  async saveInvoice(data: {
    batchId: string;
    invoiceNumber: string;
    invoiceDate: string;
    items: Array<{
      id?: string;
      medicineName: string;
      specification?: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }>;
    expenses?: Array<{
      id?: string;
      expenseName: string;
      category?: string;
      amount: number;
      notes?: string;
    }>;
    notes?: string;
  }) {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Kiểm tra lô thuốc
      const [batchRows]: any = await conn.query('SELECT * FROM batches WHERE id = ?', [data.batchId]);
      if (batchRows.length === 0) {
        throw new Error('Lô thuốc liên kết không tồn tại.');
      }
      const batch = batchRows[0];
      const trimmedInvNum = data.invoiceNumber.trim().toUpperCase();

      // Kiểm tra trùng mã hóa đơn với lô khác
      const [duplicate]: any = await conn.query(
        'SELECT id FROM invoices WHERE LOWER(invoice_number) = LOWER(?) AND batch_id != ?',
        [trimmedInvNum, data.batchId]
      );
      if (duplicate.length > 0) {
        throw new Error(`Mã hóa đơn "${trimmedInvNum}" đã được sử dụng cho một lô khác.`);
      }

      // Tính toán thành tiền từng loại thuốc và tổng
      let preExpenseTotal = 0;
      const sanitizedItems = (data.items || []).map((it) => {
        const q = Math.max(1, Number(it.quantity) || 1);
        const p = Math.max(0, Number(it.unitPrice) || 0);
        const amt = Math.round(q * p);
        preExpenseTotal += amt;
        return {
          id: it.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          medicineName: it.medicineName.trim(),
          specification: it.specification?.trim() || null,
          unit: it.unit?.trim() || 'Hộp',
          quantity: q,
          unitPrice: p,
          amount: amt,
          notes: it.notes?.trim() || null,
        };
      });

      let expensesTotal = 0;
      const sanitizedExpenses = (data.expenses || []).map((exp) => {
        const amt = Math.max(0, Math.round(Number(exp.amount) || 0));
        expensesTotal += amt;
        return {
          id: exp.id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          expenseName: exp.expenseName.trim(),
          category: exp.category || 'other',
          amount: amt,
          notes: exp.notes?.trim() || null,
        };
      });

      const postExpenseTotal = preExpenseTotal + expensesTotal;

      // Kiểm tra hóa đơn hiện tại của lô
      const [existingInv]: any = await conn.query('SELECT id FROM invoices WHERE batch_id = ?', [data.batchId]);
      let invoiceId = existingInv.length > 0 ? existingInv[0].id : `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (existingInv.length > 0) {
        // Cập nhật
        await conn.query(
          `UPDATE invoices 
           SET invoice_number = ?, invoice_date = ?, batch_number = ?, 
               pre_expense_total = ?, expenses_total = ?, post_expense_total = ?, notes = ?, updated_at = NOW()
           WHERE id = ?`,
          [trimmedInvNum, data.invoiceDate, batch.batch_number, preExpenseTotal, expensesTotal, postExpenseTotal, data.notes || null, invoiceId]
        );
      } else {
        // Tạo mới
        await conn.query(
          `INSERT INTO invoices (id, invoice_number, invoice_date, batch_id, batch_number, pre_expense_total, expenses_total, post_expense_total, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [invoiceId, trimmedInvNum, data.invoiceDate, data.batchId, batch.batch_number, preExpenseTotal, expensesTotal, postExpenseTotal, data.notes || null]
        );
      }

      // Xóa các items cũ và chèn lại danh sách mới
      await conn.query('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
      for (const item of sanitizedItems) {
        await conn.query(
          `INSERT INTO invoice_items (id, invoice_id, medicine_name, specification, unit, quantity, unit_price, amount, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.id, invoiceId, item.medicineName, item.specification, item.unit, item.quantity, item.unitPrice, item.amount, item.notes]
        );
      }

      // Xóa các chi phí cũ và chèn lại
      await conn.query('DELETE FROM expenses WHERE invoice_id = ?', [invoiceId]);
      for (const exp of sanitizedExpenses) {
        await conn.query(
          `INSERT INTO expenses (id, invoice_id, expense_name, category, amount, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [exp.id, invoiceId, exp.expenseName, exp.category, exp.amount, exp.notes]
        );
      }

      // Cập nhật bảng batches: đánh dấu has_invoice = 1
      await conn.query(
        `UPDATE batches 
         SET has_invoice = 1, invoice_id = ?, invoice_number = ?, updated_at = NOW() 
         WHERE id = ?`,
        [invoiceId, trimmedInvNum, data.batchId]
      );

      await conn.commit();

      const saved = await this.getInvoiceById(invoiceId);

      // Đưa vào hàng đợi đồng bộ Google Sheets
      await sheetsSyncService.enqueue({
        entityType: 'invoice',
        entityId: invoiceId,
        action: 'UPSERT',
        payload: saved,
      });

      return saved;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Xóa hóa đơn của một lô thuốc (đưa lô về trạng thái Chưa có hóa đơn)
   */
  async deleteInvoice(invoiceId: string) {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [invRows]: any = await conn.query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
      if (invRows.length === 0) {
        throw new Error('Hóa đơn không tồn tại.');
      }
      const inv = invRows[0];

      // Xóa hóa đơn (cascade sẽ xóa items và expenses)
      await conn.query('DELETE FROM invoices WHERE id = ?', [invoiceId]);

      // Cập nhật batch
      await conn.query(
        `UPDATE batches 
         SET has_invoice = 0, invoice_id = NULL, invoice_number = NULL, updated_at = NOW() 
         WHERE id = ?`,
        [inv.batch_id]
      );

      await conn.commit();

      // Đồng bộ xóa sang Google Sheets
      await sheetsSyncService.enqueue({
        entityType: 'invoice',
        entityId: invoiceId,
        action: 'DELETE',
        payload: { id: invoiceId, batchId: inv.batch_id },
      });

      return { success: true, message: `Đã hủy hóa đơn ${inv.invoice_number} thành công.` };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Thêm hoặc sửa một loại thuốc trực tiếp trong hóa đơn
   */
  async upsertItem(batchId: string, itemData: {
    id?: string;
    medicineName: string;
    specification?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }) {
    const pool = getPool();
    const [invRows]: any = await pool.query('SELECT id FROM invoices WHERE batch_id = ?', [batchId]);
    if (invRows.length === 0) {
      throw new Error('Lô thuốc chưa có hóa đơn. Vui lòng tạo hóa đơn trước khi thêm thuốc.');
    }
    const invoiceId = invRows[0].id;

    const q = Math.max(1, Number(itemData.quantity) || 1);
    const p = Math.max(0, Number(itemData.unitPrice) || 0);
    const amount = Math.round(q * p);
    const id = itemData.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (itemData.id) {
      await pool.query(
        `UPDATE invoice_items 
         SET medicine_name = ?, specification = ?, unit = ?, quantity = ?, unit_price = ?, amount = ?, notes = ?, updated_at = NOW()
         WHERE id = ? AND invoice_id = ?`,
        [itemData.medicineName.trim(), itemData.specification?.trim() || null, itemData.unit.trim(), q, p, amount, itemData.notes?.trim() || null, id, invoiceId]
      );
    } else {
      await pool.query(
        `INSERT INTO invoice_items (id, invoice_id, medicine_name, specification, unit, quantity, unit_price, amount, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, invoiceId, itemData.medicineName.trim(), itemData.specification?.trim() || null, itemData.unit.trim(), q, p, amount, itemData.notes?.trim() || null]
      );
    }

    // Tính toán lại tổng tiền hóa đơn
    await sheetsSyncService.recalculateInvoiceTotals(invoiceId);

    return { success: true, message: 'Đã lưu loại thuốc thành công.' };
  }

  /**
   * Xóa một loại thuốc khỏi hóa đơn
   */
  async deleteItem(itemId: string) {
    const pool = getPool();
    const [itemRows]: any = await pool.query('SELECT invoice_id FROM invoice_items WHERE id = ?', [itemId]);
    if (itemRows.length === 0) {
      throw new Error('Loại thuốc không tồn tại.');
    }
    const invoiceId = itemRows[0].invoice_id;

    await pool.query('DELETE FROM invoice_items WHERE id = ?', [itemId]);
    await sheetsSyncService.recalculateInvoiceTotals(invoiceId);

    return { success: true, message: 'Đã xóa loại thuốc khỏi danh sách.' };
  }
}

export const invoiceService = new InvoiceService();
