import type { Batch, BatchWithInvoice, BatchStatistics, Invoice, InvoiceItem, ExpenseItem } from '../types/pharmacy';

// Tự động sử dụng biến môi trường VITE_API_URL khi build production hoặc dùng proxy /api mặc định
const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiService {
  /**
   * Kiểm tra tình trạng kết nối tới Backend API & MySQL
   */
  async checkHealth(): Promise<{ connected: boolean; message?: string; database?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        return { connected: true, database: data.database, message: 'Đã kết nối MySQL thành công' };
      }
      return { connected: false, message: 'Backend phản hồi mã lỗi: ' + res.status };
    } catch (err: any) {
      return {
        connected: false,
        message: 'Chưa kết nối được Backend. Vui lòng chạy lệnh: npm run server',
      };
    }
  }

  /**
   * Lấy danh sách toàn bộ lô thuốc từ MySQL
   */
  async getBatches(): Promise<BatchWithInvoice[]> {
    const res = await fetch(`${API_BASE_URL}/batches`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Lỗi khi tải danh sách lô thuốc (${res.status})`);
    }
    const json = await res.json();
    return json.data || [];
  }

  /**
   * Lấy chi tiết một lô thuốc từ MySQL
   */
  async getBatchById(id: string): Promise<BatchWithInvoice> {
    const res = await fetch(`${API_BASE_URL}/batches/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Không thể lấy chi tiết lô thuốc (${res.status})`);
    }
    const json = await res.json();
    return json.data;
  }

  /**
   * Tra cứu lô thuốc trực tiếp từ MySQL
   */
  async searchBatches(query: string): Promise<BatchWithInvoice[]> {
    const res = await fetch(`${API_BASE_URL}/batches/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi tra cứu lô thuốc');
    }
    const json = await res.json();
    return json.data || [];
  }

  /**
   * Tạo lô thuốc mới và lưu vào MySQL
   */
  async createBatch(data: {
    batchNumber: string;
    batchName: string;
    supplier: string;
    importDate: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; batch?: BatchWithInvoice }> {
    const res = await fetch(`${API_BASE_URL}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Không thể tạo lô thuốc trên MySQL.');
    }
    return { success: true, message: json.message, batch: json.data };
  }

  /**
   * Cập nhật thông tin lô thuốc trong MySQL
   */
  async updateBatch(id: string, updates: Partial<Batch>): Promise<{ success: boolean; message: string; batch?: BatchWithInvoice }> {
    const res = await fetch(`${API_BASE_URL}/batches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Không thể cập nhật lô thuốc trên MySQL.');
    }
    return { success: true, message: json.message, batch: json.data };
  }

  /**
   * Xóa lô thuốc khỏi MySQL
   */
  async deleteBatch(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/batches/${id}`, {
      method: 'DELETE',
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Không thể xóa lô thuốc trên MySQL.');
    }
    return { success: true, message: json.message };
  }

  /**
   * Lưu hóa đơn đầy đủ vào MySQL
   */
  async saveInvoice(data: {
    batchId: string;
    invoiceNumber: string;
    invoiceDate: string;
    items: InvoiceItem[];
    expenses: ExpenseItem[];
    notes?: string;
  }): Promise<{ success: boolean; message: string; invoice?: Invoice }> {
    const res = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Không thể lưu hóa đơn vào MySQL.');
    }
    return { success: true, message: json.message, invoice: json.data };
  }

  /**
   * Hủy bỏ hóa đơn trong MySQL
   */
  async deleteInvoice(invoiceId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
      method: 'DELETE',
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Không thể hủy hóa đơn trên MySQL.');
    }
    return { success: true, message: json.message };
  }

  /**
   * Thêm hoặc sửa một loại thuốc trực tiếp trong hóa đơn của lô
   */
  async upsertInvoiceItem(batchId: string, itemData: Omit<InvoiceItem, 'id' | 'amount'> & { id?: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/invoices/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId, ...itemData }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Không thể lưu loại thuốc vào MySQL.');
    }
    return { success: true, message: json.message };
  }

  /**
   * Xóa một loại thuốc khỏi hóa đơn trong MySQL
   */
  async deleteInvoiceItem(itemId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/invoices/items/${itemId}`, {
      method: 'DELETE',
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Không thể xóa loại thuốc trên MySQL.');
    }
    return { success: true, message: json.message };
  }

  /**
   * Thêm hoặc sửa một khoản chi phí trong MySQL
   */
  async upsertExpenseItem(batchId: string, expenseData: Omit<ExpenseItem, 'id'> & { id?: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId, ...expenseData }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Không thể lưu khoản chi phí vào MySQL.');
    }
    return { success: true, message: json.message };
  }

  /**
   * Xóa một khoản chi phí trong MySQL
   */
  async deleteExpenseItem(expenseId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
      method: 'DELETE',
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Không thể xóa chi phí trên MySQL.');
    }
    return { success: true, message: json.message };
  }

  /**
   * Lấy số liệu thống kê tổng quan từ MySQL
   */
  async getStatistics(): Promise<BatchStatistics> {
    const res = await fetch(`${API_BASE_URL}/stats`);
    if (!res.ok) {
      throw new Error('Lỗi khi lấy số liệu thống kê.');
    }
    const json = await res.json();
    return json.data;
  }
}

export const apiService = new ApiService();
