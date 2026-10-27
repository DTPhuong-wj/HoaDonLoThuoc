import { Router, Request, Response } from 'express';
import { sheetsSyncService } from '../services/sheetsSyncService.js';
import { getPool } from '../db.js';
import { env } from '../config/env.js';

export const syncRoutes = Router();

// POST /api/sync/from-sheets - Webhook nhận dữ liệu từ Google Apps Script
syncRoutes.post('/from-sheets', async (req: Request, res: Response) => {
  try {
    const tokenHeader = req.headers['x-sync-token'] as string;
    const result = await sheetsSyncService.handleIncomingFromSheets(req.body, tokenHeader);
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi xử lý webhook từ Google Sheets.' });
  }
});

// GET /api/sync/status - Trạng thái đồng bộ Google Sheets
syncRoutes.get('/status', async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const [queueRows]: any = await pool.query(`
      SELECT 
        status, 
        COUNT(*) AS count 
      FROM sheets_sync_queue 
      GROUP BY status
    `);

    const [recentLogs]: any = await pool.query(`
      SELECT id, direction, entity_type, entity_id, action, status, details, created_at
      FROM sheets_sync_log 
      ORDER BY id DESC LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        enabled: env.GOOGLE_SHEETS_SYNC_ENABLED,
        hasScriptUrl: Boolean(env.GOOGLE_APPS_SCRIPT_URL),
        queue: queueRows,
        recentLogs,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
