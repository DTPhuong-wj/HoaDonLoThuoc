import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { env } from './config/env.js';

let pool: Pool;

/**
 * Kiểm tra kết nối và khởi tạo database HoaDonLoThuoc
 */
export async function initializeDatabase(): Promise<Pool> {
  console.log(`[Database] Đang kết nối tới MySQL Server tại ${env.DB_HOST}:${env.DB_PORT} (User: ${env.DB_USER})...`);

  // Bước 1: Kết nối ban đầu để kiểm tra và tạo database nếu chưa có
  try {
    const rootConn = await mysql.createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    });

    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConn.end();
    console.log(`[Database] Đã xác nhận cơ sở dữ liệu \`${env.DB_NAME}\` sẵn sàng.`);
  } catch (err: any) {
    console.error(`[Database Lỗi] Không thể kết nối tới MySQL Server:`, err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error(`[Database Hướng dẫn] Sai thông tin tài khoản hoặc mật khẩu MySQL. Vui lòng kiểm tra lại file .env (DB_USER, DB_PASSWORD).`);
    } else if (err.code === 'ECONNREFUSED') {
      console.error(`[Database Hướng dẫn] MySQL Server chưa được bật hoặc sai cổng ${env.DB_PORT}. Vui lòng kiểm tra dịch vụ MySQL84 trên máy tính.`);
    }
    throw err;
  }

  // Bước 2: Tạo connection pool gắn liền với database HoaDonLoThuoc
  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    decimalNumbers: true,
    timezone: '+07:00',
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

  // Nạp dữ liệu mẫu ban đầu nếu database hoàn toàn trống
  const [rows]: any = await conn.query('SELECT COUNT(*) as cnt FROM `batches`');
  if (rows[0].cnt === 0) {
    console.log('[Database] Chưa có dữ liệu trong bảng `batches`. Đang nạp bộ dữ liệu mẫu dược phẩm...');
    await seedInitialData(conn);
    console.log('[Database] Đã nạp thành công bộ dữ liệu mẫu ban đầu vào MySQL.');
  }
}

/**
 * Nạp dữ liệu dược phẩm mẫu ban đầu vào MySQL
 */
async function seedInitialData(conn: PoolConnection): Promise<void> {
  // Lô 1: DHG
  await conn.query(`
    INSERT INTO batches (id, batch_number, batch_name, supplier, import_date, notes, has_invoice, invoice_id, invoice_number)
    VALUES ('batch_dhg_01', 'LO-DHG-202601', 'Hapacol 650mg & Kháng sinh Klamentin', 'Dược Hậu Giang (DHG Pharma)', '2026-10-15', 'Nhập kho lô bảo quản nhiệt độ thường dưới 30°C. Đã kiểm tra cảm quan đạt chuẩn.', 1, 'inv_dhg_01', 'HD-DHG-88219');
  `);
  await conn.query(`
    INSERT INTO invoices (id, invoice_number, invoice_date, batch_id, batch_number, pre_expense_total, expenses_total, post_expense_total, notes)
    VALUES ('inv_dhg_01', 'HD-DHG-88219', '2026-10-15', 'batch_dhg_01', 'LO-DHG-202601', 28700000, 330000, 29030000, 'Hóa đơn đã đối chiếu trùng khớp với số lượng thực nhập kho.');
  `);
  await conn.query(`
    INSERT INTO invoice_items (id, invoice_id, medicine_name, specification, unit, quantity, unit_price, amount, notes)
    VALUES 
    ('item_1_1', 'inv_dhg_01', 'Hapacol 650mg', 'Hộp 10 vỉ x 10 viên', 'Hộp', 200, 45000, 9000000, 'Hạ sốt, giảm đau nhanh'),
    ('item_1_2', 'inv_dhg_01', 'Klamentin 500/125', 'Hộp 2 vỉ x 7 viên', 'Hộp', 150, 110000, 16500000, 'Kháng sinh Amoxicillin + Acid Clavulanic'),
    ('item_1_3', 'inv_dhg_01', 'Bocalex C 1000mg', 'Tuýp 10 viên sủi', 'Tuýp', 100, 32000, 3200000, 'Vitamin C tăng cường sức đề kháng');
  `);
  await conn.query(`
    INSERT INTO expenses (id, invoice_id, expense_name, category, amount, notes)
    VALUES
    ('exp_1_1', 'inv_dhg_01', 'Phí vận chuyển xe lạnh liên tỉnh', 'shipping', 250000, 'Chuyến xe giao tận kho dược'),
    ('exp_1_2', 'inv_dhg_01', 'Phí bốc xếp kho nhập hàng', 'handling', 80000, 'Công bốc xếp 3 nhân công');
  `);

  // Lô 2: SANOFI
  await conn.query(`
    INSERT INTO batches (id, batch_number, batch_name, supplier, import_date, notes, has_invoice, invoice_id, invoice_number)
    VALUES ('batch_sanofi_02', 'LO-SANOFI-202602', 'Nexium Mups 40mg & Dị ứng Telfast', 'Sanofi-Aventis Việt Nam', '2026-10-20', 'Lô hàng kèm chứng chỉ CO/CQ chuẩn châu Âu. Yêu cầu vận chuyển thùng xốp lạnh.', 1, 'inv_sanofi_02', 'HD-SNF-9941');
  `);
  await conn.query(`
    INSERT INTO invoices (id, invoice_number, invoice_date, batch_id, batch_number, pre_expense_total, expenses_total, post_expense_total, notes)
    VALUES ('inv_sanofi_02', 'HD-SNF-9941', '2026-10-20', 'batch_sanofi_02', 'LO-SANOFI-202602', 56400000, 550000, 56950000, 'Đã hoàn tất thanh toán chuyển khoản qua ngân hàng.');
  `);
  await conn.query(`
    INSERT INTO invoice_items (id, invoice_id, medicine_name, specification, unit, quantity, unit_price, amount, notes)
    VALUES
    ('item_2_1', 'inv_sanofi_02', 'Nexium Mups 40mg', 'Hộp 2 vỉ x 7 viên', 'Hộp', 120, 340000, 40800000, 'Esomeprazole chính hãng Astra/Sanofi'),
    ('item_2_2', 'inv_sanofi_02', 'Telfast HD 180mg', 'Hộp 1 vỉ x 10 viên', 'Hộp', 80, 105000, 8400000, 'Thuốc chống dị ứng Fexofenadine'),
    ('item_2_3', 'inv_sanofi_02', 'Magne-B6 Corbiere', 'Hộp 5 vỉ x 10 viên', 'Hộp', 150, 48000, 7200000, 'Khoáng chất Magnesi & Vitamin B6');
  `);
  await conn.query(`
    INSERT INTO expenses (id, invoice_id, expense_name, category, amount, notes)
    VALUES
    ('exp_2_1', 'inv_sanofi_02', 'Phí bảo quản kho lạnh đặc biệt', 'storage', 400000, 'Lưu kho nhiệt độ 15-25°C độ ẩm <60%'),
    ('exp_2_2', 'inv_sanofi_02', 'Phí vận chuyển giao hàng nội thành', 'shipping', 150000, 'Xe tải thùng kín');
  `);

  // Lô 3: IMEXPHARM (Chưa có hóa đơn)
  await conn.query(`
    INSERT INTO batches (id, batch_number, batch_name, supplier, import_date, notes, has_invoice)
    VALUES ('batch_imex_03', 'LO-IMEX-202603', 'Ceftriaxone 1g & Kháng sinh tiêm', 'Công ty CP Dược phẩm Imexpharm', '2026-10-24', 'Hàng đã kiểm đếm đủ số lượng tại kho 2. Đang chờ kế toán nhà cung cấp gửi hóa đơn điện tử.', 0);
  `);

  // Lô 4: TRAPHACO (0đ chi phí phát sinh)
  await conn.query(`
    INSERT INTO batches (id, batch_number, batch_name, supplier, import_date, notes, has_invoice, invoice_id, invoice_number)
    VALUES ('batch_traphaco_04', 'LO-TRAPHACO-202604', 'Boganic Forte & Hoạt huyết dưỡng não', 'Công ty Cổ phần Traphaco', '2026-10-25', 'Đông dược thảo dược nguồn gốc GACP-WHO. Hợp đồng miễn phí toàn bộ vận chuyển.', 1, 'inv_trp_04', 'HD-TRP-4512');
  `);
  await conn.query(`
    INSERT INTO invoices (id, invoice_number, invoice_date, batch_id, batch_number, pre_expense_total, expenses_total, post_expense_total, notes)
    VALUES ('inv_trp_04', 'HD-TRP-4512', '2026-10-25', 'batch_traphaco_04', 'LO-TRAPHACO-202604', 51150000, 0, 51150000, 'Miễn phí chi phí phát sinh theo chính sách đại lý cấp 1.');
  `);
  await conn.query(`
    INSERT INTO invoice_items (id, invoice_id, medicine_name, specification, unit, quantity, unit_price, amount, notes)
    VALUES
    ('item_4_1', 'inv_trp_04', 'Boganic Forte', 'Hộp 5 vỉ x 10 viên nang mềm', 'Hộp', 250, 85000, 21250000, 'Cao Actiso, Rau đắng đất, Bìm bìm'),
    ('item_4_2', 'inv_trp_04', 'Hoạt Huyết Dưỡng Não Traphaco', 'Hộp 5 vỉ x 20 viên bao phim', 'Hộp', 200, 92000, 18400000, 'Cao Đinh lăng & Bạch quả'),
    ('item_4_3', 'inv_trp_04', 'Ampelop Trị Viêm Loét Dạ Dày', 'Hộp 9 vỉ x 10 viên', 'Hộp', 100, 115000, 11500000, 'Chiết xuất cao Chè dây chuẩn hóa');
  `);

  // Lô 5: STELLAPHARM (Chưa có hóa đơn)
  await conn.query(`
    INSERT INTO batches (id, batch_number, batch_name, supplier, import_date, notes, has_invoice)
    VALUES ('batch_stella_05', 'LO-STELLA-202605', 'Amlodipine 5mg & Thuốc Tim Mạch', 'Công ty TNHH LD Stellapharm', '2026-10-26', 'Hàng mới nhập sáng nay, 500 hộp Amlodipine nguyên đai nguyên kiện, chưa có hóa đơn tài chính.', 0);
  `);
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database chưa được khởi tạo. Hãy gọi initializeDatabase() trước.');
  }
  return pool;
}
