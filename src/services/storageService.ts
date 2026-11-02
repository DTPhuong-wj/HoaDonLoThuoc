import type {
  Batch,
  BatchStatistics,
  SystemSettings,
  SyncEvent,
  SyncAction,
  LabelColor,
} from '../types/pharmacy';
import { generateUniqueId, getTodayDateString } from '../utils/formatters';

const STORAGE_KEYS = {
  BATCHES: 'mint_pharma_batches_simple',
  SYNC_QUEUE: 'mint_pharma_sync_queue_simple',
  SETTINGS: 'mint_pharma_settings_simple',
};

const DEFAULT_SETTINGS: SystemSettings = {
  googleAppsScriptUrl: 'https://script.google.com/macros/s/AKfycbzohYVvWBSw_VqAmmdCMZvqjyqryq7nKmTMdh-rvlQQi85vQXK3AoFq-ow7KgmjyZyK/exec',
  sheetsSyncSecret: 'mint_pharma_secure_sync_secret_token_2026',
  defaultUser: 'Dược sĩ quản lý kho',
};

export class StorageService {
  private isProcessingQueue = false;

  constructor() {
    this.initLocalStorage();
    this.setupNetworkListener();
  }

  private initLocalStorage(): void {
    try {
      if (typeof window === 'undefined') return;

      const existingRaw = localStorage.getItem(STORAGE_KEYS.BATCHES);
      if (existingRaw) {
        try {
          const list = JSON.parse(existingRaw);
          const hasMockData = Array.isArray(list) && list.some((b: any) =>
            b.batchNumber && (
              b.batchNumber.includes('LO-DHG-202601') ||
              b.batchNumber.includes('LO-SANOFI-202602') ||
              b.batchNumber.includes('LO-IMEX-202603') ||
              b.batchNumber.includes('LO-TRAPHACO-202604') ||
              b.batchNumber.includes('LO-STELLA-202605')
            )
          );
          if (hasMockData) {
            localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify([]));
          }
        } catch {
          localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify([]));
      }

      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE)) {
        localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
      }
    } catch (e) {
      console.error('[StorageService] Lỗi khởi tạo LocalStorage:', e);
    }
  }

  private setupNetworkListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processSyncQueue();
      });
    }
  }

  getSettings(): SystemSettings {
    try {
      if (typeof window === 'undefined') return DEFAULT_SETTINGS;
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch { }
    return DEFAULT_SETTINGS;
  }

  saveSettings(newSettings: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    }
    return updated;
  }

  isSheetConnected(): boolean {
    const s = this.getSettings();
    return Boolean(s.googleAppsScriptUrl && s.googleAppsScriptUrl.trim().length > 0);
  }

  private getRawBatches(): Batch[] {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem(STORAGE_KEYS.BATCHES);
      if (!raw) return [];
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      return list.map((b) => ({
        id: b.id,
        batchNumber: b.batchNumber || '',
        batchName: b.batchName || '',
        labelColor: (b.labelColor === 'white' ? 'white' : 'green') as LabelColor,
        importDate: b.importDate || getTodayDateString(),
        status: b.status === 'deleted' ? 'deleted' : 'active',
        createdAt: b.createdAt || new Date().toISOString(),
        updatedAt: b.updatedAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  private saveRawBatches(batches: Batch[]): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
      }
    } catch (e) {
      console.error('[StorageService] Lỗi lưu lô thuốc:', e);
    }
  }

  getBatches(includeDeleted = false): Batch[] {
    const list = this.getRawBatches();
    return includeDeleted ? list : list.filter((b) => b.status !== 'deleted');
  }

  getBatchById(id: string): Batch | null {
    const all = this.getBatches(true);
    return all.find((b) => b.id === id) || null;
  }

  getStatistics(): BatchStatistics {
    const batches = this.getBatches(false);
    let greenLabelCount = 0;
    let whiteLabelCount = 0;

    batches.forEach((b) => {
      if (b.labelColor === 'green') {
        greenLabelCount++;
      } else {
        whiteLabelCount++;
      }
    });

    return {
      totalBatches: batches.length,
      greenLabelCount,
      whiteLabelCount,
    };
  }

  /**
   * Thêm mới Lô thuốc: HỖ TRỢ TÁCH TỪNG TÊN THUỐC THÀNH TỪNG DÒNG RIÊNG BIỆT
   */
  async createBatches(data: {
    batchNumber: string;
    batchNames: string[]; // Danh sách các tên thuốc tách riêng
    labelColor: LabelColor;
    importDate: string;
  }): Promise<{ success: boolean; message: string; count: number; batches: Batch[] }> {
    const now = new Date().toISOString();
    const batchNumber = data.batchNumber.trim();
    const labelColor = data.labelColor || 'green';
    const importDate = data.importDate || getTodayDateString();

    // Lọc danh sách tên thuốc, loại bỏ dòng trống
    const names = data.batchNames
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) {
      throw new Error('Vui lòng nhập ít nhất 1 tên thuốc');
    }

    const createdBatches: Batch[] = [];
    const currentBatches = this.getRawBatches();

    names.forEach((medName) => {
      const newBatch: Batch = {
        id: generateUniqueId('med'),
        batchNumber,
        batchName: medName,
        labelColor,
        importDate,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      createdBatches.push(newBatch);
      currentBatches.unshift(newBatch);
    });

    this.saveRawBatches(currentBatches);

    // Gửi sự kiện CREATE_LOT sang Google Sheet để lưu từng dòng riêng biệt
    const labelColorText = labelColor === 'green' ? 'Nhãn xanh' : 'Nhãn trắng';
    this.enqueueSyncEvent('CREATE_LOT', createdBatches[0].id, {
      batchNumber,
      batchNames: names,
      labelColor: labelColorText,
      importDate,
    });

    this.processSyncQueue();

    return {
      success: true,
      message: `Đã thêm ${names.length} tên thuốc tách riêng vào lô ${batchNumber}.`,
      count: names.length,
      batches: createdBatches,
    };
  }

  // Tương thích ngược nếu gọi đơn lẻ
  async createBatch(data: {
    batchNumber: string;
    batchName: string;
    labelColor: LabelColor;
    importDate: string;
  }): Promise<{ success: boolean; message: string; batch: Batch }> {
    const res = await this.createBatches({
      batchNumber: data.batchNumber,
      batchNames: [data.batchName],
      labelColor: data.labelColor,
      importDate: data.importDate,
    });
    return {
      success: res.success,
      message: res.message,
      batch: res.batches[0],
    };
  }

  /**
   * Cập nhật thông tin dòng thuốc
   */
  async updateBatch(
    id: string,
    updates: Partial<Batch>
  ): Promise<{ success: boolean; message: string; batch: Batch }> {
    const batches = this.getRawBatches();
    const index = batches.findIndex((b) => b.id === id);

    if (index === -1) {
      throw new Error(`Không tìm thấy dòng thuốc có ID: ${id}`);
    }

    const current = batches[index];
    const now = new Date().toISOString();

    const updated: Batch = {
      ...current,
      ...updates,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: now,
    };

    batches[index] = updated;
    this.saveRawBatches(batches);

    const labelColorText = updated.labelColor === 'green' ? 'Nhãn xanh' : 'Nhãn trắng';
    this.enqueueSyncEvent('UPDATE_LOT', id, {
      batchNumber: updated.batchNumber,
      batchName: updated.batchName,
      labelColor: labelColorText,
      importDate: updated.importDate,
      oldBatchNumber: current.batchNumber,
      oldBatchName: current.batchName,
    });

    this.processSyncQueue();

    return {
      success: true,
      message: 'Đã cập nhật thông tin thành công.',
      batch: updated,
    };
  }

  /**
   * Xóa dòng thuốc trên Website (KHÔNG CẬP NHẬT HOẶC XÓA TRÊN GOOGLE SHEET)
   * Sheet chỉ lưu khi thêm mới và sửa.
   */
  async deleteBatch(id: string): Promise<{ success: boolean; message: string }> {
    const batches = this.getRawBatches();
    const index = batches.findIndex((b) => b.id === id);

    if (index === -1) {
      throw new Error(`Không tìm thấy dòng thuốc để xóa: ${id}`);
    }

    const current = batches[index];
    current.status = 'deleted';
    current.updatedAt = new Date().toISOString();

    batches[index] = current;
    this.saveRawBatches(batches);

    // Lưu ý: Theo yêu cầu, khi xóa trên web thì KHÔNG cập nhật hay gửi lệnh xóa sang Google Sheet
    // Dữ liệu trên Google Sheet được giữ nguyên an toàn tuyệt đối.

    return {
      success: true,
      message: 'Đã xóa trên website (Dữ liệu trên Google Sheet được giữ nguyên).',
    };
  }

  getSyncQueue(): SyncEvent[] {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveSyncQueue(queue: SyncEvent[]): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      }
    } catch (e) {
      console.error('[StorageService] Lỗi lưu hàng đợi:', e);
    }
  }

  enqueueSyncEvent(action: SyncAction, lotId: string, payload: any): SyncEvent {
    const queue = this.getSyncQueue();
    const event: SyncEvent = {
      id: generateUniqueId('sq'),
      eventId: generateUniqueId('evt_' + action.toLowerCase()),
      action,
      lotId,
      timestamp: new Date().toISOString(),
      payload,
      status: 'pending',
      retryCount: 0,
    };

    queue.push(event);
    this.saveSyncQueue(queue);
    return event;
  }

  async processSyncQueue(): Promise<{ total: number; successCount: number; failedCount: number }> {
    if (this.isProcessingQueue) {
      return { total: 0, successCount: 0, failedCount: 0 };
    }

    const settings = this.getSettings();
    const gasUrl = settings.googleAppsScriptUrl?.trim();

    if (!gasUrl) {
      return { total: 0, successCount: 0, failedCount: 0 };
    }

    this.isProcessingQueue = true;
    const queue = this.getSyncQueue();
    const pendingEvents = queue.filter((e) => e.status === 'pending' || e.status === 'failed');

    let successCount = 0;
    let failedCount = 0;

    for (const event of pendingEvents) {
      try {
        event.lastAttempt = new Date().toISOString();
        event.retryCount = (event.retryCount || 0) + 1;

        const requestBody = {
          token: settings.sheetsSyncSecret,
          eventId: event.eventId,
          action: event.action,
          lotId: event.lotId,
          timestamp: event.timestamp,
          payload: event.payload,
        };

        const response = await fetch(gasUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok || response.type === 'opaque') {
          let isSuccess = true;
          try {
            const resJson = await response.json();
            if (resJson && resJson.success === false) {
              isSuccess = false;
              event.errorMessage = resJson.message || 'Lỗi xử lý';
            }
          } catch {
            isSuccess = true;
          }

          if (isSuccess) {
            event.status = 'synced';
            event.errorMessage = undefined;
            successCount++;
          } else {
            event.status = 'failed';
            failedCount++;
          }
        } else {
          event.status = 'failed';
          event.errorMessage = `Lỗi HTTP ${response.status}`;
          failedCount++;
        }
      } catch (err: any) {
        event.status = 'failed';
        event.errorMessage = err.message || 'Lỗi kết nối';
        failedCount++;
      }
    }

    this.saveSyncQueue(queue);
    this.isProcessingQueue = false;

    return {
      total: pendingEvents.length,
      successCount,
      failedCount,
    };
  }

  async fetchBatchesFromSheet(): Promise<{ success: boolean; count: number; message: string }> {
    const settings = this.getSettings();
    const gasUrl = settings.googleAppsScriptUrl?.trim();

    if (!gasUrl) {
      return { success: false, count: 0, message: 'Chưa nhập URL Google Sheet' };
    }

    try {
      const response = await fetch(gasUrl, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Máy chủ Google phản hồi mã lỗi HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Không thể đọc dữ liệu từ Sheet');
      }

      const batchesFromSheet: Batch[] = (data.batches || []).map((b: any, index: number) => ({
        id: b.id || `batch_sheet_${index + 1}`,
        batchNumber: b.batchNumber || '',
        batchName: b.batchName || '',
        labelColor: b.labelColor === 'white' ? 'white' : 'green',
        importDate: b.importDate || getTodayDateString(),
        status: 'active',
        createdAt: b.createdAt || new Date().toISOString(),
        updatedAt: b.updatedAt || new Date().toISOString(),
      }));

      this.saveRawBatches(batchesFromSheet);

      return {
        success: true,
        count: batchesFromSheet.length,
        message: `Đã kết nối thành công! Đã nạp ${batchesFromSheet.length} dòng thuốc từ Sheet về Web.`,
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        message: err.message || 'Lỗi kết nối tới URL Google Sheet',
      };
    }
  }

  exportBatchesAsCSV(): string {
    const batches = this.getBatches(false);
    const headers = ['stt', 'lô thuốc', 'tên thuốc', 'nhãn', 'ngày nhập'];

    const rows = batches.map((b, index) => {
      const stt = index + 1;
      const loThuoc = `"${(b.batchNumber || '').replace(/"/g, '""')}"`;
      const tenThuoc = `"${(b.batchName || '').replace(/"/g, '""')}"`;
      const nhanMau = b.labelColor === 'green' ? 'Nhãn xanh' : 'Nhãn trắng';
      const ngayNhap = b.importDate || '';
      return [stt, loThuoc, tenThuoc, nhanMau, ngayNhap].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }
}

export const storageService = new StorageService();
