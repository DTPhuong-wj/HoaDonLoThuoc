import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { env } from '../src/config/env.js';

const execFileAsync = promisify(execFile);

async function runBackup() {
  console.log('================================================================');
  console.log('   TIỆN ÍCH SAO LƯU (BACKUP) MYSQL DATABASE HoaDonLoThuoc');
  console.log('================================================================');

  const backupDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `HoaDonLoThuoc_backup_${timestamp}.sql`;
  const latestFileName = 'HoaDonLoThuoc_latest.sql';
  const backupPath = path.join(backupDir, backupFileName);
  const latestPath = path.join(backupDir, latestFileName);

  // Đường dẫn mysqldump mặc định trên Windows MySQL Server 8.4
  const mysqldumpPath = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe';

  console.log(`[Backup] Đang sao lưu database \`${env.DB_NAME}\` từ ${env.DB_HOST}:${env.DB_PORT}...`);

  const args = [
    `--host=${env.DB_HOST}`,
    `--port=${env.DB_PORT}`,
    `--user=${env.DB_USER}`,
    `--password=${env.DB_PASSWORD}`,
    '--default-character-set=utf8mb4',
    '--single-transaction',
    '--routines',
    '--triggers',
    '--databases',
    env.DB_NAME,
  ];

  try {
    const { stdout, stderr } = await execFileAsync(mysqldumpPath, args, { maxBuffer: 100 * 1024 * 1024 });

    fs.writeFileSync(backupPath, stdout, 'utf8');
    fs.writeFileSync(latestPath, stdout, 'utf8');

    console.log(`[Backup Thành công] File sao lưu đã được lưu tại:`);
    console.log(`  -> ${backupPath} (${(stdout.length / 1024).toFixed(2)} KB)`);
    console.log(`  -> ${latestPath}`);

    // Xác minh nội dung file backup
    const content = fs.readFileSync(latestPath, 'utf8');
    const tableChecks = ['batches', 'invoices', 'invoice_items', 'expenses', 'sheets_sync_queue', 'sheets_sync_log'];
    const missingTables = tableChecks.filter(t => !content.includes(`\`${t}\``));

    if (missingTables.length === 0) {
      console.log(`[Xác minh Backup] HOÀN TOÀN ĐẦY ĐỦ 6 BẢNG DỮ LIỆU CHUẨN!`);
    } else {
      console.warn(`[Cảnh báo] File backup thiếu bảng: ${missingTables.join(', ')}`);
    }

    console.log('================================================================');
  } catch (err: any) {
    console.error(`[Backup Lỗi]:`, err.message);
    process.exit(1);
  }
}

runBackup();
