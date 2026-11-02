export type LabelColor = 'green' | 'white';

/**
 * Thực thể Lô thuốc chính (Khớp chính xác 5 cột trên Google Sheets)
 * 1. stt
 * 2. lô thuốc (batchNumber)
 * 3. tên thuốc (batchName) - tách riêng từng dòng
 * 4. nhãn (labelColor: 'green' -> Nhãn xanh, 'white' -> Nhãn trắng)
 * 5. ngày nhập (importDate)
 */
export interface Batch {
  id: string; // ID hệ thống duy nhất (batch_...)
  batchNumber: string; // Lô thuốc
  batchName: string; // Tên thuốc (tách riêng từng cái)
  labelColor: LabelColor; // 'green' -> Nhãn xanh | 'white' -> Nhãn trắng
  importDate: string; // Ngày nhập (YYYY-MM-DD)
  status: 'active' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export type BatchWithInvoice = Batch;

/**
 * Thống kê:
 * 1. Tổng số dòng thuốc / lô thuốc
 * 2. Tổng có nhãn xanh
 * 3. Tổng có nhãn trắng
 */
export interface BatchStatistics {
  totalBatches: number;
  greenLabelCount: number;
  whiteLabelCount: number;
}

export type BatchFilterType = 'all' | 'green' | 'white';

export type SyncAction = 'CREATE_LOT' | 'UPDATE_LOT' | 'DELETE_LOT';

export interface SyncEvent {
  id: string;
  eventId: string;
  action: SyncAction;
  lotId: string;
  timestamp: string;
  payload: {
    stt?: number;
    batchNumber: string;
    batchName?: string;
    batchNames?: string[]; // Hỗ trợ lưu danh sách tên thuốc tách dòng
    labelColor: string;
    importDate: string;
    oldBatchNumber?: string;
    oldBatchName?: string;
  };
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  lastAttempt?: string;
  errorMessage?: string;
}

export interface SystemSettings {
  googleAppsScriptUrl: string;
  sheetsSyncSecret: string;
  defaultUser: string;
}
