import type {
  Batch,
  BatchWithInvoice,
  BatchStatistics,
  LabelColor,
} from '../types/pharmacy';
import { storageService } from './storageService';

/**
 * ApiService - Tầng giao tiếp dữ liệu chính của hệ thống.
 * Quản lý lô thuốc và tự động đồng bộ sang Google Sheets
 */
export class ApiService {
  async checkHealth(): Promise<{ connected: boolean; message: string; database?: string; pendingSyncCount?: number }> {
    try {
      const settings = storageService.getSettings();
      const queue = storageService.getSyncQueue();
      const pendingCount = queue.filter((e) => e.status === 'pending' || e.status === 'failed').length;

      const isGasConfigured = Boolean(settings.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().length > 0);

      return {
        connected: isGasConfigured,
        message: isGasConfigured
          ? 'Đồng bộ Google Sheets đang hoạt động'
          : 'Chưa cấu hình URL Google Apps Script',
        database: 'Google Sheets',
        pendingSyncCount: pendingCount,
      };
    } catch (err: any) {
      return {
        connected: false,
        message: 'Lỗi kiểm tra trạng thái: ' + err.message,
        database: 'Google Sheets',
        pendingSyncCount: 0,
      };
    }
  }

  async getBatches(): Promise<BatchWithInvoice[]> {
    return storageService.getBatches(false);
  }

  async getBatchById(id: string): Promise<BatchWithInvoice> {
    const batch = storageService.getBatchById(id);
    if (!batch) {
      throw new Error(`Không tìm thấy lô thuốc với ID: ${id}`);
    }
    return batch;
  }

  async searchBatches(query: string): Promise<BatchWithInvoice[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const all = storageService.getBatches(false);
    return all.filter((b) => {
      const matchBatchNum = b.batchNumber.toLowerCase().includes(q);
      const matchName = b.batchName.toLowerCase().includes(q);
      return matchBatchNum || matchName;
    });
  }

  async createBatch(data: {
    batchNumber: string;
    batchName: string;
    labelColor: LabelColor;
    importDate: string;
  }): Promise<{ success: boolean; message: string; batch: Batch }> {
    return storageService.createBatch(data);
  }

  async updateBatch(
    id: string,
    updates: Partial<Batch>
  ): Promise<{ success: boolean; message: string; batch: Batch }> {
    return storageService.updateBatch(id, updates);
  }

  async deleteBatch(id: string): Promise<{ success: boolean; message: string }> {
    return storageService.deleteBatch(id);
  }

  async getStatistics(): Promise<BatchStatistics> {
    return storageService.getStatistics();
  }
}

export const apiService = new ApiService();
