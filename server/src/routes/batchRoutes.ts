import { Router, Request, Response } from 'express';
import { batchService } from '../services/batchService.js';

export const batchRoutes = Router();

// GET /api/batches - Lấy danh sách toàn bộ lô thuốc
batchRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const batches = await batchService.getAllBatches();
    res.json({ success: true, data: batches });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi tải danh sách lô thuốc.' });
  }
});

// GET /api/batches/search?q=... - Tra cứu lô thuốc
batchRoutes.get('/search', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '');
    const results = await batchService.searchBatches(q);
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi tra cứu lô thuốc.' });
  }
});

// GET /api/batches/:id - Lấy chi tiết lô thuốc kèm hóa đơn, thuốc và chi phí
batchRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const batch = await batchService.getBatchById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lô thuốc yêu cầu.' });
    }
    res.json({ success: true, data: batch });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi lấy thông tin chi tiết lô thuốc.' });
  }
});

// POST /api/batches - Tạo mới lô thuốc
batchRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { batchNumber, batchName, supplier, importDate, notes } = req.body;
    if (!batchNumber || !batchNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Số lô thuốc là bắt buộc.' });
    }
    if (!supplier || !supplier.trim()) {
      return res.status(400).json({ success: false, message: 'Nhà cung cấp là bắt buộc.' });
    }

    const newBatch = await batchService.createBatch({
      batchNumber,
      batchName,
      supplier,
      importDate,
      notes,
    });

    res.status(201).json({
      success: true,
      message: `Đã tạo thành công lô thuốc ${newBatch.batchNumber}`,
      data: newBatch,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Không thể tạo lô thuốc.' });
  }
});

// PUT /api/batches/:id - Cập nhật thông tin lô thuốc
batchRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await batchService.updateBatch(req.params.id, req.body);
    res.json({
      success: true,
      message: `Đã cập nhật thông tin lô thuốc ${updated.batchNumber}`,
      data: updated,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Không thể cập nhật lô thuốc.' });
  }
});

// DELETE /api/batches/:id - Xóa lô thuốc
batchRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await batchService.deleteBatch(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Không thể xóa lô thuốc.' });
  }
});
