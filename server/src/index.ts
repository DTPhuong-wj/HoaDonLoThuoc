import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { initializeDatabase, getPool } from './db.js';
import { batchRoutes } from './routes/batchRoutes.js';
import { invoiceRoutes } from './routes/invoiceRoutes.js';
import { expenseRoutes } from './routes/expenseRoutes.js';
import { statsRoutes } from './routes/statsRoutes.js';
import { syncRoutes } from './routes/syncRoutes.js';
import { sheetsSyncService } from './services/sheetsSyncService.js';

const app = express();

// 1. Middlewares cơ bản
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map(s => s.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Sync-Token'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging request middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// 2. Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    res.json({
      status: 'ONLINE',
      connected: true,
      service: 'MintPharma API Backend',
      database: env.DB_NAME,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[/api/health check error]:', err.message);
    res.status(503).json({
      status: 'DEGRADED',
      connected: false,
      service: 'MintPharma API Backend',
      database: env.DB_NAME,
      message: 'Chưa kết nối được MySQL: ' + err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 3. Đăng ký các Route API
app.use('/api/batches', batchRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/sync', syncRoutes);

// 4. Xử lý 404 cho API
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy endpoint API: ${req.method} ${req.originalUrl}`,
  });
});

// 5. Global Error Handler bảo mật (không rò rỉ mật khẩu hay stack trace nội bộ)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  const clientMessage = err.message || 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
  res.status(err.status || 500).json({
    success: false,
    message: clientMessage,
  });
});

// 6. Khởi chạy Server và kiểm tra Database
async function startServer() {
  console.log('================================================================');
  console.log('   MINTPHARMA BACKEND API SERVER - KHỞI ĐỘNG HỆ THỐNG');
  console.log('================================================================');

  let dbConnected = false;
  try {
    // Khởi tạo và kiểm tra kết nối MySQL database HoaDonLoThuoc
    await initializeDatabase();
    dbConnected = true;

    // Khởi động background worker Google Sheets
    sheetsSyncService.startWorker();
  } catch (err: any) {
    console.error('================================================================');
    console.error('[CẢNH BÁO KẾT NỐI DATABASE] Không thể kết nối tới MySQL!');
    console.error(`Chi tiết lỗi: ${err.message}`);
    console.error('Vui lòng kiểm tra lại:');
    console.error(' 1. File `.env` đã có đúng DB_USER và DB_PASSWORD chưa?');
    console.error(' 2. Dịch vụ MySQL84 trên Windows Services đã được bật chưa?');
    console.error('================================================================');
  }

  if (process.env.VERCEL !== '1') {
    app.listen(env.PORT, env.HOST, () => {
      console.log(`[Server] Backend API đang chạy tại: http://${env.HOST}:${env.PORT}`);
      console.log(`[Server] Trạng thái Database: ${dbConnected ? 'ĐÃ KẾT NỐI MySQL (' + env.DB_NAME + ')' : 'CHƯA KẾT NỐI (Chờ cập nhật .env)'}`);
      console.log(`[Server] Khách trong mạng LAN / Tailscale có thể truy cập qua cổng: ${env.PORT}`);
      console.log(`[Server] Health check: http://localhost:${env.PORT}/api/health`);
      console.log('================================================================');
    });
  }
}

startServer();

export { app };
