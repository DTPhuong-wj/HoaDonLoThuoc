import React, { useState, useEffect } from 'react';
import { X, DollarSign, Check, AlertCircle } from 'lucide-react';
import type { ExpenseItem, ExpenseCategory } from '../../types/pharmacy';
import { formatVND } from '../../utils/formatters';

interface ExpenseFormModalProps {
  isOpen: boolean;
  expenseToEdit?: ExpenseItem | null;
  onSave: (data: Omit<ExpenseItem, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'shipping', label: 'Vận chuyển (Xe lạnh / Chuyển phát)' },
  { value: 'handling', label: 'Bốc xếp / Bốc dỡ kho' },
  { value: 'storage', label: 'Bảo quản nhiệt độ đặc biệt' },
  { value: 'inspection', label: 'Kiểm nghiệm / Phí COA' },
  { value: 'other', label: 'Phụ phí khác' },
];

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  expenseToEdit,
  onSave,
  onClose,
}) => {
  const [expenseName, setExpenseName] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('shipping');
  const [amount, setAmount] = useState<number>(100000);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expenseToEdit) {
      setExpenseName(expenseToEdit.expenseName);
      setCategory(expenseToEdit.category);
      setAmount(expenseToEdit.amount);
      setNotes(expenseToEdit.notes || '');
      setError(null);
    } else {
      setExpenseName('');
      setCategory('shipping');
      setAmount(100000);
      setNotes('');
      setError(null);
    }
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseName.trim()) {
      setError('Vui lòng nhập tên khoản chi phí.');
      return;
    }
    if (amount < 0) {
      setError('Số tiền chi phí không được âm.');
      return;
    }

    onSave({
      id: expenseToEdit?.id,
      expenseName: expenseName.trim(),
      category,
      amount,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {expenseToEdit ? 'Chỉnh sửa khoản chi phí' : 'Thêm chi phí phát sinh'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tên khoản chi phí <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="VD: Phí vận chuyển xe lạnh, Phí bốc dỡ..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phân loại chi phí
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Số tiền chi phí (₫) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={amount || ''}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 pr-10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-medium text-slate-400">₫</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Hiển thị: <strong className="text-amber-800">{formatVND(amount)}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ghi chú chi phí
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Thuộc hóa đơn dịch vụ vận chuyển #108..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>{expenseToEdit ? 'Lưu thay đổi' : 'Thêm khoản chi phí'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
