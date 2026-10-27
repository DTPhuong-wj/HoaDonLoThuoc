import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Plus,
  Trash2,
  DollarSign,
  AlertCircle,
  Receipt,
  Check,
} from 'lucide-react';
import type { Batch, Invoice, InvoiceItem, ExpenseItem, ExpenseCategory } from '../../types/pharmacy';
import { formatVND, getTodayDateString, calculateInvoiceTotals, generateUniqueId } from '../../utils/formatters';

interface InvoiceFormModalProps {
  isOpen: boolean;
  batch: Batch | null;
  invoiceToEdit?: Invoice | null;
  onSave: (data: {
    batchId: string;
    invoiceNumber: string;
    invoiceDate: string;
    items: InvoiceItem[];
    expenses: ExpenseItem[];
    notes?: string;
  }) => void;
  onClose: () => void;
}

const COMMON_EXPENSE_PRESETS = [
  { name: 'Phí vận chuyển xe chuyên dụng', category: 'shipping' as ExpenseCategory, amount: 200000 },
  { name: 'Phí bốc xếp kho', category: 'handling' as ExpenseCategory, amount: 80000 },
  { name: 'Phí bảo quản nhiệt độ lạnh', category: 'storage' as ExpenseCategory, amount: 350000 },
  { name: 'Phí kiểm nghiệm COA/CQ', category: 'inspection' as ExpenseCategory, amount: 250000 },
];

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  batch,
  invoiceToEdit,
  onSave,
  onClose,
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceToEdit) {
      setInvoiceNumber(invoiceToEdit.invoiceNumber);
      setInvoiceDate(invoiceToEdit.invoiceDate);
      setNotes(invoiceToEdit.notes || '');
      setItems(invoiceToEdit.items || []);
      setExpenses(invoiceToEdit.expenses || []);
      setError(null);
    } else if (batch) {
      // Default invoice code suggestion based on batch
      const cleanBatch = batch.batchNumber.replace(/[^A-Za-z0-9]/g, '');
      setInvoiceNumber(`HD-${cleanBatch}`);
      setInvoiceDate(getTodayDateString());
      setNotes('');
      // 1 empty initial row for convenience
      setItems([
        {
          id: generateUniqueId('it'),
          medicineName: batch.batchName || '',
          specification: 'Hộp 10 vỉ x 10 viên',
          unit: 'Hộp',
          quantity: 100,
          unitPrice: 50000,
          amount: 5000000,
        },
      ]);
      setExpenses([]);
      setError(null);
    }
  }, [invoiceToEdit, batch, isOpen]);

  if (!isOpen || !batch) return null;

  // Medicine Item row handlers
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const next = [...items];
    const current = { ...next[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = Math.max(0, Number(field === 'quantity' ? value : current.quantity) || 0);
      const p = Math.max(0, Number(field === 'unitPrice' ? value : current.unitPrice) || 0);
      current.quantity = q;
      current.unitPrice = p;
      current.amount = Math.round(q * p);
    }

    next[index] = current;
    setItems(next);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: generateUniqueId('it'),
        medicineName: '',
        specification: '',
        unit: 'Hộp',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Expense row handlers
  const handleExpenseChange = (index: number, field: keyof ExpenseItem, value: any) => {
    const next = [...expenses];
    const current = { ...next[index], [field]: value };
    if (field === 'amount') {
      current.amount = Math.max(0, Math.round(Number(value) || 0));
    }
    next[index] = current;
    setExpenses(next);
  };

  const handleAddExpense = (preset?: typeof COMMON_EXPENSE_PRESETS[0]) => {
    if (preset) {
      setExpenses([
        ...expenses,
        {
          id: generateUniqueId('exp'),
          expenseName: preset.name,
          category: preset.category,
          amount: preset.amount,
          notes: '',
        },
      ]);
    } else {
      setExpenses([
        ...expenses,
        {
          id: generateUniqueId('exp'),
          expenseName: '',
          category: 'other',
          amount: 0,
          notes: '',
        },
      ]);
    }
  };

  const handleRemoveExpense = (index: number) => {
    setExpenses(expenses.filter((_, idx) => idx !== index));
  };

  // Live calculation
  const totals = calculateInvoiceTotals(items, expenses);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedInv = invoiceNumber.trim();
    if (!trimmedInv) {
      setError('Vui lòng nhập mã hóa đơn.');
      return;
    }

    if (items.length === 0) {
      setError('Hóa đơn cần có ít nhất 1 loại thuốc.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].medicineName.trim()) {
        setError(`Loại thuốc ở dòng ${i + 1} chưa có tên thuốc.`);
        return;
      }
      if (items[i].quantity <= 0) {
        setError(`Số lượng thuốc "${items[i].medicineName}" phải lớn hơn 0.`);
        return;
      }
    }

    onSave({
      batchId: batch.id,
      invoiceNumber: trimmedInv,
      invoiceDate,
      items,
      expenses,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Receipt size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                {invoiceToEdit ? 'Chỉnh sửa Hóa đơn' : 'Tạo Hóa đơn Mới'}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Gắn với Lô thuốc:{' '}
                <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  {batch.batchNumber}
                </span>{' '}
                — {batch.supplier}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: General Invoice Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mã hóa đơn <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                placeholder="VD: HD-DHG-88219"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold tracking-wide text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 uppercase placeholder:normal-case placeholder:font-normal"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ngày lập hóa đơn <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                required
              />
            </div>
          </div>

          {/* Section 1: Medicines List in Invoice */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={16} className="text-emerald-600" />
                  <span>Danh sách thuốc trong hóa đơn</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Thành tiền mỗi loại thuốc = Số lượng × Đơn giá
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
              >
                <Plus size={14} />
                <span>+ Thêm thuốc</span>
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500">
                      Thuốc #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Xóa loại thuốc này"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    {/* Tên thuốc */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Tên thuốc <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.medicineName}
                        onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)}
                        placeholder="VD: Paracetamol 500mg"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    {/* Hàm lượng / Quy cách */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Quy cách / Hàm lượng
                      </label>
                      <input
                        type="text"
                        value={item.specification}
                        onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                        placeholder="Hộp 10 vỉ x 10 viên"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* ĐVT */}
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        ĐVT
                      </label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        placeholder="Hộp"
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                      />
                    </div>

                    {/* Số lượng */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
                      />
                    </div>

                    {/* Đơn giá */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Đơn giá (₫)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={item.unitPrice || ''}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
                      />
                    </div>
                  </div>

                  {/* Row footer: line total calculation */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {item.quantity || 0} {item.unit} × {formatVND(item.unitPrice || 0)}
                    </span>
                    <span className="font-bold text-emerald-800">
                      = {formatVND(item.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Incurred Expenses */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <DollarSign size={16} className="text-amber-600" />
                  <span>Chi phí phát sinh (Vận chuyển, bốc xếp, bảo quản...)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Không bắt buộc. Nếu không có chi phí, tổng tiền sau chi phí sẽ bằng tổng tiền hóa đơn gốc.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAddExpense()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
              >
                <Plus size={14} />
                <span>+ Thêm chi phí</span>
              </button>
            </div>

            {/* Preset quick buttons */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-slate-400 mr-1">Thêm nhanh:</span>
              {COMMON_EXPENSE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddExpense(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-600 border border-slate-200 transition-colors"
                >
                  + {preset.name} ({formatVND(preset.amount)})
                </button>
              ))}
            </div>

            {/* Expenses List */}
            {expenses.length === 0 ? (
              <div className="p-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Chưa có chi phí phát sinh nào. Lô hàng không chịu chi phí ngoài hóa đơn.
              </div>
            ) : (
              <div className="space-y-2.5">
                {expenses.map((exp, index) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-amber-50/30 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
                  >
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        value={exp.expenseName}
                        onChange={(e) => handleExpenseChange(index, 'expenseName', e.target.value)}
                        placeholder="Tên chi phí (VD: Phí vận chuyển, bốc xếp...)"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div className="w-full sm:w-44">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="10000"
                          value={exp.amount || ''}
                          onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                          placeholder="Số tiền (₫)"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 text-right pr-6 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          required
                        />
                        <span className="absolute right-2.5 top-1.5 text-xs text-slate-400">₫</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpense(index)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors self-end sm:self-center"
                      title="Xóa chi phí"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Financial Summary Highlight Box (Soft Mint Card) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <Receipt size={16} className="text-emerald-700" />
              <span>Bảng tổng kết tài chính lô thuốc</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Pre-expense total */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100/90 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                  1. Tổng tiền hóa đơn gốc (Trước chi phí)
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-800 block">
                  {formatVND(totals.preExpenseTotal)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {items.length} loại thuốc
                </span>
              </div>

              {/* Card 2: Expenses total */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100/90 shadow-2xs">
                <span className="text-[11px] font-semibold text-amber-700 block mb-0.5">
                  2. Tổng chi phí phát sinh
                </span>
                <span className="text-base sm:text-lg font-bold text-amber-800 block">
                  + {formatVND(totals.expensesTotal)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {expenses.length} khoản chi phí
                </span>
              </div>

              {/* Card 3: Post-expense total */}
              <div className="bg-emerald-800 p-3.5 rounded-xl border border-emerald-900 text-white shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-100 block mb-0.5">
                  3. Tổng tiền thực tế (Sau chi phí)
                </span>
                <span className="text-base sm:text-lg font-black text-white block">
                  {formatVND(totals.postExpenseTotal)}
                </span>
                <span className="text-[10px] text-emerald-200 block mt-0.5">
                  Giá vốn thực tế nhập kho
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              * Lưu ý nghiệp vụ: Chi phí phát sinh là các khoản chi phí thực tế phụ thu ngoài hóa đơn (như vận chuyển, bốc xếp). Hệ thống không tự động ghi nhận các khoản này thuộc về hóa đơn gốc của nhà cung cấp.
            </p>
          </div>

          {/* Ghi chú hóa đơn */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ghi chú hóa đơn / điều khoản thanh toán
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đã thanh toán qua chuyển khoản Vietcombank, đối chiếu hóa đơn điện tử hợp lệ..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <div className="text-xs text-slate-500">
            Tổng thanh toán: <strong className="text-emerald-800 font-bold">{formatVND(totals.postExpenseTotal)}</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white hover:border-slate-300 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{invoiceToEdit ? 'Cập nhật hóa đơn' : 'Lưu hóa đơn'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
