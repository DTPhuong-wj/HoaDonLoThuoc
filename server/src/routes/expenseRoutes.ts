import { Router, Request, Response } from 'express';
import { expenseService } from '../services/expenseService.js';

export const expenseRoutes = Router();

// POST /api/expenses - Thêm hoặc cập nhật một khoản chi phí phát sinh
expenseRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { batchId, id, expenseName, category, amount, notes } = req.body;
    if (!batchId) {
      return res.status(400).json({ success: false, message: 'Thiếu batchId.' });
    }
    if (!expenseName || !expenseName.trim()) {
      return res.status(400).json({ success: false, message: 'Tên khoản chi phí là bắt buộc.' });
    }

    const result = await expenseService.upsertExpense(batchId, {
      id,
      expenseName,
      category,
      amount,
      notes,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Không thể lưu chi phí.' });
  }
});

// DELETE /api/expenses/:id - Xóa một khoản chi phí
expenseRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await expenseService.deleteExpense(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Không thể xóa chi phí.' });
  }
});
