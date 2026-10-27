import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

async function clearAllMockData() {
  console.log(`[Database Cleanup] Đang kết nối tới MySQL Server tại ${env.DB_HOST}:${env.DB_PORT} (Database: ${env.DB_NAME})...`);
  
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  try {
    console.log('[Database Cleanup] Đang xóa toàn bộ dữ liệu mẫu trong các bảng...');

    // Xóa theo thứ tự ràng buộc khóa ngoại
    await conn.query('DELETE FROM expenses;');
    console.log(' - Đã xóa bảng expenses');

    await conn.query('DELETE FROM invoice_items;');
    console.log(' - Đã xóa bảng invoice_items');

    await conn.query('DELETE FROM invoices;');
    console.log(' - Đã xóa bảng invoices');

    await conn.query('DELETE FROM batches;');
    console.log(' - Đã xóa bảng batches');

    await conn.query('DELETE FROM sheets_sync_queue;');
    console.log(' - Đã xóa bảng sheets_sync_queue');

    await conn.query('DELETE FROM sheets_sync_log;');
    console.log(' - Đã xóa bảng sheets_sync_log');

    console.log('================================================================');
    console.log('[HOÀN TẤT] Toàn bộ dữ liệu ảo đã được xóa sạch 100% khỏi MySQL!');
    console.log('Cơ sở dữ liệu hiện tại hoàn toàn trống, sẵn sàng để bạn nhập dữ liệu thật.');
    console.log('================================================================');
  } catch (err: any) {
    console.error('[Database Cleanup Lỗi]:', err.message);
  } finally {
    await conn.end();
  }
}

clearAllMockData();
