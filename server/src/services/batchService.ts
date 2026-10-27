import { getPool } from '../db.js';
import { sheetsSyncService } from './sheetsSyncService.js';

export class BatchService {
  /**
   * Lấy danh sách tất cả các lô thuốc cùng đầy đủ danh mục thuốc và chi phí phát sinh
   */
  async getAllBatches() {
    const pool = getPool();
    const [rows]: any = await pool.query(`
      SELECT 
        b.id,
        b.batch_number AS batchNumber,
        b.batch_name AS batchName,
        b.supplier,
        DATE_FORMAT(b.import_date, '%Y-%m-%d') AS importDate,
        b.notes,
        b.has_invoice AS hasInvoice,
        b.invoice_id AS invoiceId,
        b.invoice_number AS invoiceNumber,
        b.created_at AS createdAt,
        b.updated_at AS updatedAt,
        i.id AS inv_id,
        i.invoice_number AS inv_number,
        DATE_FORMAT(i.invoice_date, '%Y-%m-%d') AS inv_date,
        COALESCE(i.pre_expense_total, 0) AS preExpenseTotal,
        COALESCE(i.expenses_total, 0) AS expensesTotal,
        COALESCE(i.post_expense_total, 0) AS postExpenseTotal,
        i.notes AS inv_notes
      FROM batches b
      LEFT JOIN invoices i ON b.id = i.batch_id
      ORDER BY b.import_date DESC, b.created_at DESC
    `);

    const invIds = rows.map((r: any) => r.inv_id).filter(Boolean);
    const itemsByInv: Record<string, any[]> = {};
    const expensesByInv: Record<string, any[]> = {};

    if (invIds.length > 0) {
      const [itemRows]: any = await pool.query(
        `SELECT 
          id,
          invoice_id AS invoiceId,
          medicine_name AS medicineName,
          specification,
          unit,
          quantity,
          unit_price AS unitPrice,
          amount,
          notes
         FROM invoice_items 
         WHERE invoice_id IN (?) 
         ORDER BY created_at ASC`,
        [invIds]
      );
      for (const it of itemRows) {
        if (!itemsByInv[it.invoiceId]) itemsByInv[it.invoiceId] = [];
        itemsByInv[it.invoiceId].push({
          ...it,
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          amount: Number(it.amount) || 0,
        });
      }

      const [expRows]: any = await pool.query(
        `SELECT 
          id,
          invoice_id AS invoiceId,
          expense_name AS expenseName,
          category,
          amount,
          notes
         FROM expenses 
         WHERE invoice_id IN (?) 
         ORDER BY created_at ASC`,
        [invIds]
      );
      for (const e of expRows) {
        if (!expensesByInv[e.invoiceId]) expensesByInv[e.invoiceId] = [];
        expensesByInv[e.invoiceId].push({
          ...e,
          amount: Number(e.amount) || 0,
        });
      }
    }

    return rows.map((r: any) => {
      const invItems = r.inv_id ? (itemsByInv[r.inv_id] || []) : [];
      const invExpenses = r.inv_id ? (expensesByInv[r.inv_id] || []) : [];

      return {
        id: r.id,
        batchNumber: r.batchNumber,
        batchName: r.batchName,
        supplier: r.supplier,
        importDate: r.importDate,
        notes: r.notes || '',
        hasInvoice: Boolean(r.hasInvoice),
        invoiceId: r.invoiceId,
        invoiceNumber: r.invoiceNumber,
        itemCount: invItems.length,
        preExpenseTotal: Number(r.preExpenseTotal) || 0,
        expensesTotal: Number(r.expensesTotal) || 0,
        postExpenseTotal: Number(r.postExpenseTotal) || 0,
        invoice: r.inv_id
          ? {
              id: r.inv_id,
              invoiceNumber: r.inv_number,
              invoiceDate: r.inv_date,
              batchId: r.id,
              batchNumber: r.batchNumber,
              preExpenseTotal: Number(r.preExpenseTotal) || 0,
              expensesTotal: Number(r.expensesTotal) || 0,
              postExpenseTotal: Number(r.postExpenseTotal) || 0,
              notes: r.inv_notes || '',
              items: invItems,
              expenses: invExpenses,
            }
          : undefined,
      };
    });
  }

  /**
   * Lấy chi tiết một lô thuốc gồm toàn bộ thuốc và chi phí phát sinh
   */
  async getBatchById(id: string) {
    const pool = getPool();
    const [batchRows]: any = await pool.query(
      `SELECT 
        b.id,
        b.batch_number AS batchNumber,
        b.batch_name AS batchName,
        b.supplier,
        DATE_FORMAT(b.import_date, '%Y-%m-%d') AS importDate,
        b.notes,
        b.has_invoice AS hasInvoice,
        b.invoice_id AS invoiceId,
        b.invoice_number AS invoiceNumber,
        b.created_at AS createdAt,
        b.updated_at AS updatedAt
       FROM batches b WHERE b.id = ?`,
      [id]
    );

    if (batchRows.length === 0) return null;
    const batch = batchRows[0];
    batch.hasInvoice = Boolean(batch.hasInvoice);

    // Lấy thông tin hóa đơn nếu có
    const [invRows]: any = await pool.query(
      `SELECT 
        id,
        invoice_number AS invoiceNumber,
        DATE_FORMAT(invoice_date, '%Y-%m-%d') AS invoiceDate,
        batch_id AS batchId,
        batch_number AS batchNumber,
        pre_expense_total AS preExpenseTotal,
        expenses_total AS expensesTotal,
        post_expense_total AS postExpenseTotal,
        notes,
        created_at AS createdAt,
        updated_at AS updatedAt
       FROM invoices WHERE batch_id = ?`,
      [id]
    );

    if (invRows.length > 0) {
      const invoice = invRows[0];
      invoice.preExpenseTotal = Number(invoice.preExpenseTotal) || 0;
      invoice.expensesTotal = Number(invoice.expensesTotal) || 0;
      invoice.postExpenseTotal = Number(invoice.postExpenseTotal) || 0;

      // Lấy danh sách thuốc
      const [itemRows]: any = await pool.query(
        `SELECT 
          id,
          invoice_id AS invoiceId,
          medicine_name AS medicineName,
          specification,
          unit,
          quantity,
          unit_price AS unitPrice,
          amount,
          notes
         FROM invoice_items WHERE invoice_id = ? ORDER BY created_at ASC`,
        [invoice.id]
      );

      invoice.items = itemRows.map((it: any) => ({
        ...it,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        amount: Number(it.amount),
      }));

      // Lấy danh sách chi phí
      const [expRows]: any = await pool.query(
        `SELECT 
          id,
          invoice_id AS invoiceId,
          expense_name AS expenseName,
          category,
          amount,
          notes
         FROM expenses WHERE invoice_id = ? ORDER BY created_at ASC`,
        [invoice.id]
      );

      invoice.expenses = expRows.map((e: any) => ({
        ...e,
        amount: Number(e.amount),
      }));

      batch.invoice = invoice;
      batch.itemCount = invoice.items.length;
      batch.preExpenseTotal = invoice.preExpenseTotal;
      batch.expensesTotal = invoice.expensesTotal;
      batch.postExpenseTotal = invoice.postExpenseTotal;
    } else {
      batch.itemCount = 0;
      batch.preExpenseTotal = 0;
      batch.expensesTotal = 0;
      batch.postExpenseTotal = 0;
    }

    return batch;
  }

  /**
   * Tra cứu lô thuốc theo số lô, tên thuốc hoặc mã hóa đơn
   */
  async searchBatches(queryStr: string) {
    const q = queryStr.trim().toLowerCase();
    if (!q) return [];

    const allBatches = await this.getAllBatches();
    // Đọc chi tiết để tìm cả tên thuốc bên trong
    const pool = getPool();
    const [matchingItems]: any = await pool.query(
      `SELECT DISTINCT i.batch_id 
       FROM invoice_items it
       JOIN invoices i ON it.invoice_id = i.id
       WHERE LOWER(it.medicine_name) LIKE ?`,
      [`%${q}%`]
    );
    const batchIdsWithMatchingDrug = new Set(matchingItems.map((m: any) => m.batch_id));

    return allBatches.filter((b: any) => {
      if (b.batchNumber.toLowerCase().includes(q)) return true;
      if (b.batchName.toLowerCase().includes(q)) return true;
      if (b.supplier.toLowerCase().includes(q)) return true;
      if (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(q)) return true;
      if (batchIdsWithMatchingDrug.has(b.id)) return true;
      return false;
    });
  }

  /**
   * Thêm một lô thuốc mới
   */
  async createBatch(data: {
    batchNumber: string;
    batchName: string;
    supplier: string;
    importDate: string;
    notes?: string;
  }) {
    const pool = getPool();
    const trimmedNumber = data.batchNumber.trim().toUpperCase();

    // Kiểm tra trùng số lô
    const [existing]: any = await pool.query(
      'SELECT id FROM batches WHERE LOWER(batch_number) = LOWER(?)',
      [trimmedNumber]
    );

    if (existing.length > 0) {
      throw new Error(`Số lô "${trimmedNumber}" đã tồn tại trong hệ thống. Vui lòng chọn số lô khác.`);
    }

    const id = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const batchName = data.batchName?.trim() || `Lô ${trimmedNumber}`;
    const supplier = data.supplier?.trim() || 'Chưa xác định';
    const importDate = data.importDate || new Date().toISOString().split('T')[0];
    const notes = data.notes?.trim() || null;

    await pool.query(
      `INSERT INTO batches (id, batch_number, batch_name, supplier, import_date, notes, has_invoice)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [id, trimmedNumber, batchName, supplier, importDate, notes]
    );

    const newBatch = await this.getBatchById(id);

    // Đồng bộ sang Google Sheets (Section 9)
    await sheetsSyncService.enqueue({
      entityType: 'batch',
      entityId: id,
      action: 'UPSERT',
      payload: newBatch,
    });

    return newBatch;
  }

  /**
   * Chỉnh sửa thông tin lô thuốc
   */
  async updateBatch(id: string, updates: Partial<{
    batchNumber: string;
    batchName: string;
    supplier: string;
    importDate: string;
    notes?: string;
  }>) {
    const pool = getPool();
    const existing = await this.getBatchById(id);
    if (!existing) {
      throw new Error('Lô thuốc không tồn tại.');
    }

    // Nếu đổi số lô, kiểm tra trùng lặp với lô khác
    if (updates.batchNumber && updates.batchNumber.trim().toLowerCase() !== existing.batchNumber.toLowerCase()) {
      const [duplicate]: any = await pool.query(
        'SELECT id FROM batches WHERE LOWER(batch_number) = LOWER(?) AND id != ?',
        [updates.batchNumber.trim(), id]
      );
      if (duplicate.length > 0) {
        throw new Error(`Số lô "${updates.batchNumber}" đã được sử dụng cho một lô khác.`);
      }
    }

    const batchNumber = updates.batchNumber ? updates.batchNumber.trim().toUpperCase() : existing.batchNumber;
    const batchName = updates.batchName !== undefined ? updates.batchName.trim() : existing.batchName;
    const supplier = updates.supplier !== undefined ? updates.supplier.trim() : existing.supplier;
    const importDate = updates.importDate || existing.importDate;
    const notes = updates.notes !== undefined ? updates.notes.trim() : existing.notes;

    await pool.query(
      `UPDATE batches 
       SET batch_number = ?, batch_name = ?, supplier = ?, import_date = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [batchNumber, batchName, supplier, importDate, notes, id]
    );

    // Đồng bộ sang bảng invoices nếu batch_number thay đổi
    if (batchNumber !== existing.batchNumber) {
      await pool.query(
        'UPDATE invoices SET batch_number = ?, updated_at = NOW() WHERE batch_id = ?',
        [batchNumber, id]
      );
    }

    const updated = await this.getBatchById(id);

    // Đồng bộ Google Sheets
    await sheetsSyncService.enqueue({
      entityType: 'batch',
      entityId: id,
      action: 'UPSERT',
      payload: updated,
    });

    return updated;
  }

  /**
   * Xóa một lô thuốc
   */
  async deleteBatch(id: string) {
    const pool = getPool();
    const existing = await this.getBatchById(id);
    if (!existing) {
      throw new Error('Lô thuốc không tồn tại.');
    }

    await pool.query('DELETE FROM batches WHERE id = ?', [id]);

    // Đồng bộ xóa sang Google Sheets
    await sheetsSyncService.enqueue({
      entityType: 'batch',
      entityId: id,
      action: 'DELETE',
      payload: { id, batchNumber: existing.batchNumber },
    });

    return { success: true, message: `Đã xóa thành công lô thuốc ${existing.batchNumber}` };
  }
}

export const batchService = new BatchService();
