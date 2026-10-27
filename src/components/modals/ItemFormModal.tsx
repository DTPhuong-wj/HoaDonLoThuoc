import React, { useState, useEffect } from 'react';
import { X, Pill, Check, AlertCircle } from 'lucide-react';
import type { InvoiceItem } from '../../types/pharmacy';
import { calculateItemAmount, formatVND } from '../../utils/formatters';

interface ItemFormModalProps {
  isOpen: boolean;
  itemToEdit?: InvoiceItem | null;
  onSave: (data: Omit<InvoiceItem, 'id' | 'amount'> & { id?: string }) => void;
  onClose: () => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  itemToEdit,
  onSave,
  onClose,
}) => {
  const [medicineName, setMedicineName] = useState('');
  const [specification, setSpecification] = useState('');
  const [unit, setUnit] = useState('Hộp');
  const [quantity, setQuantity] = useState<number>(100);
  const [unitPrice, setUnitPrice] = useState<number>(50000);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (itemToEdit) {
      setMedicineName(itemToEdit.medicineName);
      setSpecification(itemToEdit.specification);
      setUnit(itemToEdit.unit);
      setQuantity(itemToEdit.quantity);
      setUnitPrice(itemToEdit.unitPrice);
      setNotes(itemToEdit.notes || '');
      setError(null);
    } else {
      setMedicineName('');
      setSpecification('');
      setUnit('Hộp');
      setQuantity(100);
      setUnitPrice(50000);
      setNotes('');
      setError(null);
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const calculatedAmount = calculateItemAmount(quantity, unitPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) {
      setError('Vui lòng nhập tên thuốc.');
      return;
    }
    if (quantity <= 0) {
      setError('Số lượng thuốc phải lớn hơn 0.');
      return;
    }
    if (unitPrice < 0) {
      setError('Đơn giá thuốc không thể âm.');
      return;
    }

    onSave({
      id: itemToEdit?.id,
      medicineName: medicineName.trim(),
      specification: specification.trim(),
      unit: unit.trim() || 'Hộp',
      quantity,
      unitPrice,
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Pill size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {itemToEdit ? 'Chỉnh sửa loại thuốc' : 'Thêm loại thuốc vào hóa đơn'}
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
                Tên thuốc <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                placeholder="VD: Paracetamol 500mg, Augmentin 1g..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Quy cách / Hàm lượng
                </label>
                <input
                  type="text"
                  value={specification}
                  onChange={(e) => setSpecification(e.target.value)}
                  placeholder="Hộp 10 vỉ x 10 viên"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Đơn vị tính (ĐVT)
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="Hộp">Hộp</option>
                  <option value="Lọ">Lọ</option>
                  <option value="Chai">Chai</option>
                  <option value="Vỉ">Vỉ</option>
                  <option value="Tuýp">Tuýp</option>
                  <option value="Ống">Ống</option>
                  <option value="Gói">Gói</option>
                  <option value="Viên">Viên</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Số lượng nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 text-right focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Đơn giá nhập (₫) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={unitPrice || ''}
                  onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 text-right focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>
            </div>

            {/* Thành tiền tính toán */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
              <span className="font-medium text-emerald-900">Thành tiền = SL × Đơn giá:</span>
              <span className="text-base font-bold text-emerald-800">
                {formatVND(calculatedAmount)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ghi chú thêm
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Chỉ định, số đăng ký..."
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>{itemToEdit ? 'Lưu thay đổi' : 'Thêm vào hóa đơn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
