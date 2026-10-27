import type { InvoiceItem, ExpenseItem } from '../types/pharmacy';

/**
 * Định dạng tiền tệ VNĐ theo chuẩn Việt Nam (vd: 3.650.000 ₫)
 */
export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Định dạng số với dấu phân cách hàng nghìn (vd: 3.650.000)
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('vi-VN').format(value);
}

/**
 * Định dạng ngày YYYY-MM-DD sang định dạng hiển thị Việt Nam DD/MM/YYYY
 */
export function formatDateVN(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Lấy ngày hôm nay định dạng YYYY-MM-DD cho input date
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Tính thành tiền của một loại thuốc: Số lượng * Đơn giá
 */
export function calculateItemAmount(quantity: number, unitPrice: number): number {
  const q = Math.max(0, Number(quantity) || 0);
  const p = Math.max(0, Number(unitPrice) || 0);
  return Math.round(q * p);
}

/**
 * Tính toán tổng tiền hóa đơn:
 * 1. Tổng tiền hàng trước chi phí = Tổng thành tiền các loại thuốc
 * 2. Tổng chi phí phát sinh = Tổng các khoản chi phí
 * 3. Tổng tiền sau chi phí = (1) + (2)
 */
export function calculateInvoiceTotals(items: InvoiceItem[] = [], expenses: ExpenseItem[] = []) {
  const preExpenseTotal = items.reduce((sum, item) => {
    const amount = item.amount !== undefined ? item.amount : calculateItemAmount(item.quantity, item.unitPrice);
    return sum + amount;
  }, 0);

  const expensesTotal = expenses.reduce((sum, exp) => {
    return sum + Math.max(0, Number(exp.amount) || 0);
  }, 0);

  const postExpenseTotal = preExpenseTotal + expensesTotal;

  return {
    preExpenseTotal,
    expensesTotal,
    postExpenseTotal,
  };
}

/**
 * Sinh ID duy nhất
 */
export function generateUniqueId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
