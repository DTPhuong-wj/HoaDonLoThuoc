import { getPool } from '../db.js';
import { sheetsSyncService } from './sheetsSyncService.js';

export class ExpenseService {
  /**
   * Thêm hoặc sửa một khoản chi phí phát sinh
   */
  async upsertExpense(batchId: string, expenseData: {
    id?: string;
    expenseName: string;
    category?: string;
    amount: number;
    notes?: string;
  }) {
    const pool = getPool();
    const [invRows]: any = await pool.query('SELECT id FROM invoices WHERE batch_id = ?', [batchId]);
    if (invRows.length === 0) {
      throw new Error('Lô thuốc chưa có hóa đơn. Vui lòng tạo hóa đơn trước khi thêm chi phí.');
    }
    const invoiceId = invRows[0].id;

    const amount = Math.max(0, Math.round(Number(expenseData.amount) || 0));
    const id = expenseData.id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const category = expenseData.category || 'other';

    if (expenseData.id) {
      await pool.query(
        `UPDATE expenses 
         SET expense_name = ?, category = ?, amount = ?, notes = ?, updated_at = NOW()
         WHERE id = ? AND invoice_id = ?`,
        [expenseData.expenseName.trim(), category, amount, expenseData.notes?.trim() || null, id, invoiceId]
      );
    } else {
      await pool.query(
        `INSERT INTO expenses (id, invoice_id, expense_name, category, amount, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, invoiceId, expenseData.expenseName.trim(), category, amount, expenseData.notes?.trim() || null]
      );
    }

    // Tự động tính lại tổng tiền hóa đơn
    await sheetsSyncService.recalculateInvoiceTotals(invoiceId);

    return { success: true, message: 'Đã lưu chi phí phát sinh thành công.' };
  }

  /**
   * Xóa một khoản chi phí phát sinh
   */
  async deleteExpense(expenseId: string) {
    const pool = getPool();
    const [expRows]: any = await pool.query('SELECT invoice_id FROM expenses WHERE id = ?', [expenseId]);
    if (expRows.length === 0) {
      throw new Error('Khoản chi phí không tồn tại.');
    }
    const invoiceId = expRows[0].invoice_id;

    await pool.query('DELETE FROM expenses WHERE id = ?', [expenseId]);
    await sheetsSyncService.recalculateInvoiceTotals(invoiceId);

    return { success: true, message: 'Đã xóa chi phí phát sinh thành công.' };
  }
}

export const expenseService = new ExpenseService();
