export interface InvoiceItem {
  id: string;
  medicineName: string;
  specification: string; // Hàm lượng hoặc quy cách đóng gói (vd: Hộp 10 vỉ x 10 viên, Lọ 100ml)
  unit: string; // Đơn vị tính (Hộp, Lọ, Vỉ, Ống, Chai, Gói)
  quantity: number;
  unitPrice: number; // Đơn giá (VNĐ)
  amount: number; // Thành tiền = quantity * unitPrice
  notes?: string;
}

export type ExpenseCategory = 'shipping' | 'handling' | 'storage' | 'inspection' | 'other';

export interface ExpenseItem {
  id: string;
  expenseName: string; // Phí vận chuyển, Phí bốc xếp, Phí bảo quản lạnh, Phụ phí khác...
  category: ExpenseCategory;
  amount: number; // Số tiền (VNĐ >= 0)
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // Mã hóa đơn (vd: HD-2026-0012)
  invoiceDate: string; // Ngày lập hóa đơn (YYYY-MM-DD)
  batchId: string; // ID lô thuốc liên kết
  batchNumber: string; // Số lô thuốc liên kết
  items: InvoiceItem[];
  expenses: ExpenseItem[];
  preExpenseTotal: number; // Tổng tiền trước chi phí (= tổng thành tiền các loại thuốc)
  expensesTotal: number; // Tổng chi phí phát sinh
  postExpenseTotal: number; // Tổng tiền sau chi phí (= trước chi phí + chi phí phát sinh)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  batchNumber: string; // Số lô thuốc (Duy nhất, bắt buộc, vd: LO-DHG-202601)
  batchName: string; // Tên thuốc chính hoặc mô tả lô thuốc
  supplier: string; // Nhà cung cấp (DHG, Sanofi, Imexpharm...)
  importDate: string; // Ngày nhập kho (YYYY-MM-DD)
  notes?: string;
  hasInvoice: boolean; // Trạng thái: true = Đã có hóa đơn, false = Chưa có hóa đơn
  invoiceId?: string; // ID hóa đơn liên kết (nếu có)
  invoiceNumber?: string; // Mã hóa đơn (nếu có)
  createdAt: string;
  updatedAt: string;
}

export interface BatchWithInvoice extends Batch {
  invoice?: Invoice;
  itemCount: number;
  preExpenseTotal: number;
  expensesTotal: number;
  postExpenseTotal: number;
}

export interface BatchStatistics {
  totalBatches: number;
  withInvoiceCount: number;
  withoutInvoiceCount: number;
  totalLandedExpense: number; // Tổng tiền sau chi phí của tất cả lô đã có hóa đơn
  totalPreExpense: number;
  totalExpenses: number;
}

export type InvoiceStatusFilter = 'all' | 'has_invoice' | 'no_invoice';
