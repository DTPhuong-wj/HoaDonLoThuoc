import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

async function runRestore() {
  console.log('================================================================');
  console.log('   TIỆN ÍCH PHỤC HỒI (RESTORE) MYSQL DATABASE HoaDonLoThuoc');
  console.log('================================================================');

  const sqlFilePath = process.argv[2] || path.resolve(process.cwd(), 'backups', 'HoaDonLoThuoc_latest.sql');

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`[Restore Lỗi] Không tìm thấy file sao lưu tại: ${sqlFilePath}`);
    process.exit(1);
  }

  console.log(`[Restore] Đọc file SQL: ${sqlFilePath}`);
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log(`[Restore] Đang kết nối tới ${env.DB_HOST}:${env.DB_PORT} (User: ${env.DB_USER})...`);
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    console.log(`[Restore] Đang thực thi nạp dữ liệu vào database...`);
    await conn.query(sqlContent);
    console.log(`[Restore Thành công] Đã phục hồi dữ liệu từ file backup vào database thành công!`);
    console.log('================================================================');
  } catch (err: any) {
    console.error(`[Restore Lỗi]:`, err.message);
  } finally {
    await conn.end();
  }
}

runRestore();
