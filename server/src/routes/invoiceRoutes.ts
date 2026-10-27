import { Router, Request, Response } from 'express';
import { invoiceService } from '../services/invoiceService.js';

export const invoiceRoutes = Router();

// GET /api/invoices - Lấy danh sách toàn bộ hóa đơn
invoiceRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const invoices = await invoiceService.getAllInvoices();
    res.json({ success: true, data: invoices });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi tải danh sách hóa đơn.' });
  }
});

// GET /api/invoices/:id - Lấy chi tiết hóa đơn
invoiceRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });
    }
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi lấy thông tin hóa đơn.' });
  }
});

// POST /api/invoices - Tạo hoặc cập nhật hóa đơn đầy đủ (kèm danh sách thuốc và chi phí)
invoiceRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { batchId, invoiceNumber, invoiceDate, items, expenses, notes } = req.body;
    if (!batchId) {
      return res.status(400).json({ success: false, message: 'Thiếu mã lô thuốc liên kết (batchId).' });
    }
    if (!invoiceNumber || !invoiceNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Mã hóa đơn là bắt buộc.' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Hóa đơn phải có ít nhất 1 loại thuốc.' });
    }

    const saved = await invoiceService.saveInvoice({
      batchId,
      invoiceNumber,
      invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
      items,
      expenses: expenses || [],
      notes,
    });

    res.status(200).json({
      success: true,
      message: `Đã lưu thành công hóa đơn ${saved.invoiceNumber}!`,
      data: saved,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Không thể lưu hóa đơn.' });
  }
});

// DELETE /api/invoices/:id - Hủy hóa đơn (đưa lô về Chưa có hóa đơn)
invoiceRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await invoiceService.deleteInvoice(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Không thể hủy hóa đơn.' });
  }
});

// POST /api/invoices/items - Thêm hoặc cập nhật một loại thuốc trong hóa đơn của lô
invoiceRoutes.post('/items', async (req: Request, res: Response) => {
  try {
    const { batchId, id, medicineName, specification, unit, quantity, unitPrice, notes } = req.body;
    if (!batchId) {
      return res.status(400).json({ success: false, message: 'Thiếu batchId.' });
    }
    if (!medicineName || !medicineName.trim()) {
      return res.status(400).json({ success: false, message: 'Tên thuốc là bắt buộc.' });
    }

    const result = await invoiceService.upsertItem(batchId, {
      id,
      medicineName,
      specification,
      unit,
      quantity,
      unitPrice,
      notes,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Không thể lưu thuốc.' });
  }
});

// DELETE /api/invoices/items/:itemId - Xóa một loại thuốc khỏi hóa đơn
invoiceRoutes.delete('/items/:itemId', async (req: Request, res: Response) => {
  try {
    const result = await invoiceService.deleteItem(req.params.itemId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Không thể xóa loại thuốc.' });
  }
});
