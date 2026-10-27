-- ====================================================================
-- CƠ SỞ DỮ LIỆU: HoaDonLoThuoc
-- HỆ THỐNG QUẢN LÝ VÀ KIỂM TRA HÓA ĐƠN LÔ THUỐC (MintPharma)
-- ====================================================================

-- 1. Tạo Database nếu chưa tồn tại (Hỗ trợ tiếng Việt đầy đủ với UTF-8 MB4)
CREATE DATABASE IF NOT EXISTS `HoaDonLoThuoc`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `HoaDonLoThuoc`;

-- ====================================================================
-- 2. BẢNG batches (Quản lý các Lô thuốc nhập kho)
-- ====================================================================
CREATE TABLE IF NOT EXISTS `batches` (
  `id` VARCHAR(50) NOT NULL,
  `batch_number` VARCHAR(100) NOT NULL,
  `batch_name` VARCHAR(255) NOT NULL,
  `supplier` VARCHAR(255) NOT NULL,
  `import_date` DATE NOT NULL,
  `notes` TEXT NULL,
  `has_invoice` TINYINT(1) NOT NULL DEFAULT 0,
  `invoice_id` VARCHAR(50) NULL,
  `invoice_number` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_batch_number` (`batch_number`),
  INDEX `idx_supplier` (`supplier`),
  INDEX `idx_import_date` (`import_date`),
  INDEX `idx_has_invoice` (`has_invoice`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 3. BẢNG invoices (Hóa đơn tài chính gắn liền với lô thuốc)
-- ====================================================================
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` VARCHAR(50) NOT NULL,
  `invoice_number` VARCHAR(100) NOT NULL,
  `invoice_date` DATE NOT NULL,
  `batch_id` VARCHAR(50) NOT NULL,
  `batch_number` VARCHAR(100) NOT NULL,
  `pre_expense_total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `expenses_total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `post_expense_total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invoice_number` (`invoice_number`),
  UNIQUE KEY `uk_invoice_batch_id` (`batch_id`),
  INDEX `idx_invoice_date` (`invoice_date`),
  CONSTRAINT `fk_invoices_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 4. BẢNG invoice_items (Danh sách thuốc trong hóa đơn)
-- ====================================================================
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` VARCHAR(50) NOT NULL,
  `invoice_id` VARCHAR(50) NOT NULL,
  `medicine_name` VARCHAR(255) NOT NULL,
  `specification` VARCHAR(255) NULL,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'Hộp',
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_item_invoice` (`invoice_id`),
  INDEX `idx_item_medicine_name` (`medicine_name`),
  CONSTRAINT `fk_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 5. BẢNG expenses (Chi phí phát sinh ngoài hóa đơn: vận chuyển, bốc xếp...)
-- ====================================================================
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(50) NOT NULL,
  `invoice_id` VARCHAR(50) NOT NULL,
  `expense_name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'other',
  `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_expense_invoice` (`invoice_id`),
  INDEX `idx_expense_category` (`category`),
  CONSTRAINT `fk_expenses_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 6. BẢNG sheets_sync_queue (Hàng đợi đồng bộ bền vững sang Google Sheets)
-- ====================================================================
CREATE TABLE IF NOT EXISTS `sheets_sync_queue` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `entity_type` VARCHAR(50) NOT NULL, -- 'batch', 'invoice', 'item', 'expense'
  `entity_id` VARCHAR(50) NOT NULL,
  `action` VARCHAR(20) NOT NULL,      -- 'UPSERT', 'DELETE'
  `payload` JSON NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SYNCED', 'FAILED'
  `attempts` INT NOT NULL DEFAULT 0,
  `last_error` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `synced_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_queue_status` (`status`),
  INDEX `idx_queue_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 7. BẢNG sheets_sync_log (Nhật ký đồng bộ hai chiều)
-- ====================================================================
CREATE TABLE IF NOT EXISTS `sheets_sync_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `direction` VARCHAR(30) NOT NULL, -- 'MYSQL_TO_SHEETS', 'SHEETS_TO_MYSQL'
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(50) NOT NULL,
  `action` VARCHAR(20) NOT NULL,
  `status` VARCHAR(20) NOT NULL,    -- 'SUCCESS', 'FAILED', 'CONFLICT_RESOLVED'
  `details` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_log_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
