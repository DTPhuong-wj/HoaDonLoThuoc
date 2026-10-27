import { getPool } from '../db.js';
import { env } from '../config/env.js';

interface SyncPayload {
  entityType: 'batch' | 'invoice' | 'item' | 'expense';
  entityId: string;
  action: 'UPSERT' | 'DELETE';
  payload: any;
}

class SheetsSyncService {
  private isProcessing = false;
  private workerTimer: NodeJS.Timeout | null = null;

  /**
   * Khởi động background worker đồng bộ dữ liệu sang Google Sheets
   */
  public startWorker(): void {
    if (!env.GOOGLE_SHEETS_SYNC_ENABLED) {
      console.log('[Google Sheets Sync] Tính năng đồng bộ Google Sheets đang TẮT (GOOGLE_SHEETS_SYNC_ENABLED=false).');
      return;
    }

    if (!env.GOOGLE_APPS_SCRIPT_URL) {
      console.warn('[Google Sheets Sync Cảnh báo] GOOGLE_SHEETS_SYNC_ENABLED=true nhưng chưa cấu hình GOOGLE_APPS_SCRIPT_URL trong .env');
      return;
    }

    console.log('[Google Sheets Sync] Khởi động background worker đồng bộ hai chiều với Google Sheets...');

    // Chạy worker mỗi 5 giây
    this.workerTimer = setInterval(() => {
      this.processQueue().catch((err) => {
        console.error('[Google Sheets Sync Worker Lỗi]:', err.message);
      });
    }, 5000);

    // Chạy ngay lần đầu
    this.processQueue().catch(() => {});
  }

  public stopWorker(): void {
    if (this.workerTimer) {
      clearInterval(this.workerTimer);
      this.workerTimer = null;
    }
  }

  /**
   * Đưa một thay đổi từ MySQL vào hàng đợi đồng bộ sang Google Sheets
   * (Được gọi SAU KHI giao dịch MySQL đã hoàn tất thành công)
   */
  public async enqueue(item: SyncPayload): Promise<void> {
    if (!env.GOOGLE_SHEETS_SYNC_ENABLED) return;

    try {
      const pool = getPool();
      await pool.query(
        `INSERT INTO sheets_sync_queue (entity_type, entity_id, action, payload, status)
         VALUES (?, ?, ?, ?, 'PENDING')`,
        [item.entityType, item.entityId, item.action, JSON.stringify(item.payload)]
      );
      // Kích hoạt xử lý ngay
      setImmediate(() => this.processQueue().catch(() => {}));
    } catch (err: any) {
      console.error('[Google Sheets Sync] Lỗi khi thêm vào hàng đợi:', err.message);
    }
  }

  /**
   * Xử lý hàng đợi đồng bộ sang Google Sheets
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || !env.GOOGLE_SHEETS_SYNC_ENABLED || !env.GOOGLE_APPS_SCRIPT_URL) {
      return;
    }

    this.isProcessing = true;
    try {
      const pool = getPool();
      const [rows]: any = await pool.query(
        `SELECT * FROM sheets_sync_queue 
         WHERE status = 'PENDING' AND attempts < 5 
         ORDER BY id ASC LIMIT 20`
      );

      if (!rows || rows.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`[Google Sheets Sync] Đang đồng bộ ${rows.length} mục sang Google Sheets...`);

      for (const row of rows) {
        try {
          const parsedPayload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;

          const response = await fetch(env.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Sync-Token': env.SHEETS_SYNC_SECRET,
            },
            body: JSON.stringify({
              action: 'SYNC_FROM_MYSQL',
              token: env.SHEETS_SYNC_SECRET,
              entityType: row.entity_type,
              entityId: row.entity_id,
              mutation: row.action,
              data: parsedPayload,
              timestamp: new Date().toISOString(),
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
          }

          const resJson: any = await response.json();
          if (resJson.success === false) {
            throw new Error(resJson.message || 'Google Apps Script trả về lỗi thất bại.');
          }

          // Cập nhật queue thành SYNCED
          await pool.query(
            `UPDATE sheets_sync_queue 
             SET status = 'SYNCED', synced_at = NOW() 
             WHERE id = ?`,
            [row.id]
          );

          // Ghi nhật ký log
          await pool.query(
            `INSERT INTO sheets_sync_log (direction, entity_type, entity_id, action, status, details)
             VALUES ('MYSQL_TO_SHEETS', ?, ?, ?, 'SUCCESS', ?)`,
            [row.entity_type, row.entity_id, row.action, `Đồng bộ thành công bản ghi ${row.entity_id}`]
          );
        } catch (itemErr: any) {
          console.error(`[Google Sheets Sync] Lỗi đồng bộ item ID ${row.id}:`, itemErr.message);

          await pool.query(
            `UPDATE sheets_sync_queue 
             SET attempts = attempts + 1, last_error = ?, status = IF(attempts + 1 >= 5, 'FAILED', 'PENDING')
             WHERE id = ?`,
            [itemErr.message.substring(0, 500), row.id]
          );

          await pool.query(
            `INSERT INTO sheets_sync_log (direction, entity_type, entity_id, action, status, details)
             VALUES ('MYSQL_TO_SHEETS', ?, ?, ?, 'FAILED', ?)`,
            [row.entity_type, row.entity_id, row.action, `Lỗi: ${itemErr.message}`]
          );
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Xử lý webhook nhận dữ liệu chỉnh sửa từ Google Sheets gửi về MySQL
   * Có cơ chế chống vòng lặp (Anti-loop): không enqueue ngược lại Sheets
   */
  public async handleIncomingFromSheets(reqBody: any, tokenHeader?: string): Promise<{ success: boolean; message: string }> {
    const token = tokenHeader || reqBody.token;
    if (token !== env.SHEETS_SYNC_SECRET) {
      return { success: false, message: 'Xác thực không hợp lệ: Sai hoặc thiếu X-Sync-Token.' };
    }

    const { entityType, entityId, mutation, data } = reqBody;
    if (!entityType || !entityId || !mutation || !data) {
      return { success: false, message: 'Dữ liệu webhook không đầy đủ tham số.' };
    }

    const pool = getPool();
    console.log(`[Google Sheets -> MySQL] Nhận cập nhật từ Sheets: ${entityType} ID=${entityId} Action=${mutation}`);

    try {
      if (entityType === 'batch') {
        if (mutation === 'UPSERT') {
          await pool.query(
            `INSERT INTO batches (id, batch_number, batch_name, supplier, import_date, notes)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
               batch_name = VALUES(batch_name),
               supplier = VALUES(supplier),
               import_date = VALUES(import_date),
               notes = VALUES(notes),
               updated_at = NOW()`,
            [
              entityId,
              data.batch_number || data.batchNumber || entityId,
              data.batch_name || data.batchName || 'Lô thuốc đồng bộ từ Sheets',
              data.supplier || 'Chưa xác định',
              data.import_date || data.importDate || new Date().toISOString().split('T')[0],
              data.notes || '',
            ]
          );
        } else if (mutation === 'DELETE') {
          await pool.query('DELETE FROM batches WHERE id = ?', [entityId]);
        }
      } else if (entityType === 'item') {
        if (mutation === 'UPSERT') {
          const q = Math.max(0, Number(data.quantity) || 0);
          const p = Math.max(0, Number(data.unit_price || data.unitPrice) || 0);
          const amount = Math.round(q * p);

          await pool.query(
            `INSERT INTO invoice_items (id, invoice_id, medicine_name, specification, unit, quantity, unit_price, amount, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               medicine_name = VALUES(medicine_name),
               specification = VALUES(specification),
               unit = VALUES(unit),
               quantity = VALUES(quantity),
               unit_price = VALUES(unit_price),
               amount = VALUES(amount),
               notes = VALUES(notes),
               updated_at = NOW()`,
            [
              entityId,
              data.invoice_id || data.invoiceId,
              data.medicine_name || data.medicineName,
              data.specification || '',
              data.unit || 'Hộp',
              q,
              p,
              amount,
              data.notes || '',
            ]
          );

          // Cập nhật lại tổng tiền hóa đơn
          if (data.invoice_id || data.invoiceId) {
            await this.recalculateInvoiceTotals(data.invoice_id || data.invoiceId);
          }
        } else if (mutation === 'DELETE') {
          const [itemRow]: any = await pool.query('SELECT invoice_id FROM invoice_items WHERE id = ?', [entityId]);
          await pool.query('DELETE FROM invoice_items WHERE id = ?', [entityId]);
          if (itemRow.length > 0 && itemRow[0].invoice_id) {
            await this.recalculateInvoiceTotals(itemRow[0].invoice_id);
          }
        }
      } else if (entityType === 'expense') {
        if (mutation === 'UPSERT') {
          const amt = Math.max(0, Number(data.amount) || 0);
          await pool.query(
            `INSERT INTO expenses (id, invoice_id, expense_name, category, amount, notes)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               expense_name = VALUES(expense_name),
               category = VALUES(category),
               amount = VALUES(amount),
               notes = VALUES(notes),
               updated_at = NOW()`,
            [
              entityId,
              data.invoice_id || data.invoiceId,
              data.expense_name || data.expenseName || data.title || 'Chi phí phát sinh',
              data.category || 'other',
              amt,
              data.notes || '',
            ]
          );

          if (data.invoice_id || data.invoiceId) {
            await this.recalculateInvoiceTotals(data.invoice_id || data.invoiceId);
          }
        } else if (mutation === 'DELETE') {
          await pool.query('DELETE FROM expenses WHERE id = ?', [entityId]);
          if (data.invoice_id || data.invoiceId) {
            await this.recalculateInvoiceTotals(data.invoice_id || data.invoiceId);
          }
        }
      } else if (entityType === 'invoice') {
        if (mutation === 'UPSERT') {
          await pool.query(
            `UPDATE invoices 
             SET invoice_number = COALESCE(?, invoice_number),
                 invoice_date = COALESCE(?, invoice_date),
                 notes = COALESCE(?, notes),
                 updated_at = NOW()
             WHERE id = ?`,
            [
              data.invoice_number || data.invoiceNumber || null,
              data.invoice_date || data.invoiceDate || null,
              data.notes || null,
              entityId,
            ]
          );
        }
      }

      // Ghi log thành công
      await pool.query(
        `INSERT INTO sheets_sync_log (direction, entity_type, entity_id, action, status, details)
         VALUES ('SHEETS_TO_MYSQL', ?, ?, ?, 'SUCCESS', 'Đã cập nhật thành công từ Google Sheets')`,
        [entityType, entityId, mutation]
      );

      return { success: true, message: `Đã cập nhật ${entityType} vào MySQL thành công.` };
    } catch (err: any) {
      console.error('[Google Sheets -> MySQL Lỗi]:', err.message);

      await pool.query(
        `INSERT INTO sheets_sync_log (direction, entity_type, entity_id, action, status, details)
         VALUES ('SHEETS_TO_MYSQL', ?, ?, ?, 'FAILED', ?)`,
        [entityType, entityId, mutation, err.message]
      );

      return { success: false, message: `Lỗi cập nhật MySQL: ${err.message}` };
    }
  }

  /**
   * Tính toán lại tổng tiền của hóa đơn sau khi thêm/sửa/xóa thuốc hoặc chi phí
   */
  public async recalculateInvoiceTotals(invoiceId: string): Promise<void> {
    const pool = getPool();

    // 1. Tổng tiền hàng trước chi phí
    const [itemRows]: any = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS pre_total FROM invoice_items WHERE invoice_id = ?`,
      [invoiceId]
    );
    const preTotal = Number(itemRows[0]?.pre_total) || 0;

    // 2. Tổng chi phí phát sinh
    const [expRows]: any = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS exp_total FROM expenses WHERE invoice_id = ?`,
      [invoiceId]
    );
    const expTotal = Number(expRows[0]?.exp_total) || 0;

    // 3. Tổng sau chi phí
    const postTotal = preTotal + expTotal;

    await pool.query(
      `UPDATE invoices 
       SET pre_expense_total = ?, expenses_total = ?, post_expense_total = ?, updated_at = NOW() 
       WHERE id = ?`,
      [preTotal, expTotal, postTotal, invoiceId]
    );
  }
}

export const sheetsSyncService = new SheetsSyncService();
