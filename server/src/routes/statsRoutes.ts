import { Router, Request, Response } from 'express';
import { getPool } from '../db.js';

export const statsRoutes = Router();

// GET /api/stats - Thống kê tổng quan hóa đơn & lô thuốc
statsRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const pool = getPool();

    // 1. Số lô
    const [batchCountRows]: any = await pool.query(`
      SELECT 
        COUNT(*) AS totalBatches,
        SUM(CASE WHEN has_invoice = 1 THEN 1 ELSE 0 END) AS withInvoiceCount,
        SUM(CASE WHEN has_invoice = 0 THEN 1 ELSE 0 END) AS withoutInvoiceCount
      FROM batches
    `);

    // 2. Tổng chi phí
    const [totalRows]: any = await pool.query(`
      SELECT 
        COALESCE(SUM(pre_expense_total), 0) AS totalPreExpense,
        COALESCE(SUM(expenses_total), 0) AS totalExpenses,
        COALESCE(SUM(post_expense_total), 0) AS totalLandedExpense
      FROM invoices
    `);

    const batchStats = batchCountRows[0] || {};
    const moneyStats = totalRows[0] || {};

    res.json({
      success: true,
      data: {
        totalBatches: Number(batchStats.totalBatches) || 0,
        withInvoiceCount: Number(batchStats.withInvoiceCount) || 0,
        withoutInvoiceCount: Number(batchStats.withoutInvoiceCount) || 0,
        totalLandedExpense: Number(moneyStats.totalLandedExpense) || 0,
        totalPreExpense: Number(moneyStats.totalPreExpense) || 0,
        totalExpenses: Number(moneyStats.totalExpenses) || 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi lấy thống kê.' });
  }
});
