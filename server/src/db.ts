import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { env } from './config/env.js';

let pool: Pool;

/**
 * Kiểm tra kết nối và khởi tạo database HoaDonLoThuoc
 */
export async function initializeDatabase(): Promise<Pool> {
  console.log(`[Database] Đang kết nối tới MySQL Server tại ${env.DB_HOST}:${env.DB_PORT} (User: ${env.DB_USER})...`);

  const sslOption = env.DB_SSL ? { rejectUnauthorized: false } : undefined;

  // Bước 1: Thử kiểm tra và tạo database nếu có quyền root/admin
  try {
    const rootConn = await mysql.createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ssl: sslOption,
      connectTimeout: 15000,
    });

    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConn.end();
    console.log(`[Database] Đã xác nhận cơ sở dữ liệu \`${env.DB_NAME}\` sẵn sàng.`);
  } catch (err: any) {
    // Trên Cloud MySQL (Aiven, TiDB, Railway), database thường được tạo sẵn và tài khoản không có quyền CREATE DATABASE
    console.log(`[Database Thông báo] Tiếp tục kết nối trực tiếp vào database \`${env.DB_NAME}\` (Lưu ý: ${err.message})`);
  }

  // Bước 2: Tạo connection pool gắn liền với database HoaDonLoThuoc
  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: sslOption,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    timezone: '+07:00',
    connectTimeout: 20000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });

  // Bước 3: Kiểm tra lấy kết nối từ pool
  const testConn: PoolConnection = await pool.getConnection();
  try {
    console.log(`[Database] Kết nối thành công vào database \`${env.DB_NAME}\` qua Connection Pool.`);

    // Bước 4: Tạo các bảng cần thiết an toàn (không xóa hoặc làm mất dữ liệu hiện có)
    await runSafeMigrations(testConn);
  } finally {
    testConn.release();
  }

  return pool;
}

/**
 * Tạo bảng an toàn bằng CREATE TABLE IF NOT EXISTS
 */
async function runSafeMigrations(conn: PoolConnection): Promise<void> {
  // 1. batches
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`batches\` (
      \`id\` VARCHAR(50) NOT NULL,
      \`batch_number\` VARCHAR(100) NOT NULL,
      \`batch_name\` VARCHAR(255) NOT NULL,
      \`supplier\` VARCHAR(255) NOT NULL,
      \`import_date\` DATE NOT NULL,
      \`notes\` TEXT NULL,
      \`has_invoice\` TINYINT(1) NOT NULL DEFAULT 0,
      \`invoice_id\` VARCHAR(50) NULL,
      \`invoice_number\` VARCHAR(100) NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_batch_number\` (\`batch_number\`),
      INDEX \`idx_supplier\` (\`supplier\`),
      INDEX \`idx_import_date\` (\`import_date\`),
      INDEX \`idx_has_invoice\` (\`has_invoice\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. invoices
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`invoices\` (
      \`id\` VARCHAR(50) NOT NULL,
      \`invoice_number\` VARCHAR(100) NOT NULL,
      \`invoice_date\` DATE NOT NULL,
      \`batch_id\` VARCHAR(50) NOT NULL,
      \`batch_number\` VARCHAR(100) NOT NULL,
      \`pre_expense_total\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      \`expenses_total\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      \`post_expense_total\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      \`notes\` TEXT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_invoice_number\` (\`invoice_number\`),
      UNIQUE KEY \`uk_invoice_batch_id\` (\`batch_id\`),
      INDEX \`idx_invoice_date\` (\`invoice_date\`),
      CONSTRAINT \`fk_invoices_batch\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. invoice_items
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`invoice_items\` (
      \`id\` VARCHAR(50) NOT NULL,
      \`invoice_id\` VARCHAR(50) NOT NULL,
      \`medicine_name\` VARCHAR(255) NOT NULL,
      \`specification\` VARCHAR(255) NULL,
      \`unit\` VARCHAR(50) NOT NULL DEFAULT 'Hộp',
      \`quantity\` INT NOT NULL DEFAULT 1,
      \`unit_price\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      \`amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      \`notes\` TEXT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      INDEX \`idx_item_invoice\` (\`invoice_id\`),
      INDEX \`idx_item_medicine_name\` (\`medicine_name\`),
      CONSTRAINT \`fk_items_invoice\` FOREIGN KEY (\`invoice_id\`) REFERENCES \`invoices\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. expenses
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`expenses\` (
      \`id\` VARCHAR(50) NOT NULL,
      \`invoice_id\` VARCHAR(50) NOT NULL,
      \`expense_name\` VARCHAR(255) NOT NULL,
      \`category\` VARCHAR(50) NOT NULL DEFAULT 'other',
      \`amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      \`notes\` TEXT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      INDEX \`idx_expense_invoice\` (\`invoice_id\`),
      INDEX \`idx_expense_category\` (\`category\`),
      CONSTRAINT \`fk_expenses_invoice\` FOREIGN KEY (\`invoice_id\`) REFERENCES \`invoices\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. sheets_sync_queue (Section 9)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`sheets_sync_queue\` (
      \`id\` BIGINT NOT NULL AUTO_INCREMENT,
      \`entity_type\` VARCHAR(50) NOT NULL,
      \`entity_id\` VARCHAR(50) NOT NULL,
      \`action\` VARCHAR(20) NOT NULL,
      \`payload\` JSON NOT NULL,
      \`status\` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      \`attempts\` INT NOT NULL DEFAULT 0,
      \`last_error\` TEXT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`synced_at\` TIMESTAMP NULL,
      PRIMARY KEY (\`id\`),
      INDEX \`idx_queue_status\` (\`status\`),
      INDEX \`idx_queue_created\` (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 6. sheets_sync_log (Section 9)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`sheets_sync_log\` (
      \`id\` BIGINT NOT NULL AUTO_INCREMENT,
      \`direction\` VARCHAR(30) NOT NULL,
      \`entity_type\` VARCHAR(50) NOT NULL,
      \`entity_id\` VARCHAR(50) NOT NULL,
      \`action\` VARCHAR(20) NOT NULL,
      \`status\` VARCHAR(20) NOT NULL,
      \`details\` TEXT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      INDEX \`idx_log_created\` (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database chưa được khởi tạo. Hãy gọi initializeDatabase() trước.');
  }
  return pool;
}
