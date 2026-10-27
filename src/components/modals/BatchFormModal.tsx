import React, { useState, useEffect } from 'react';
import { X, Package, Check, AlertCircle } from 'lucide-react';
import type { Batch } from '../../types/pharmacy';
import { getTodayDateString } from '../../utils/formatters';

interface BatchFormModalProps {
  isOpen: boolean;
  batchToEdit?: Batch | null;
  initialBatchNumber?: string;
  onSave: (data: {
    batchNumber: string;
    batchName: string;
    supplier: string;
    importDate: string;
    notes?: string;
    createInvoiceImmediately?: boolean;
  }) => void;
  onClose: () => void;
}

const COMMON_SUPPLIERS = [
  'Dược Hậu Giang (DHG Pharma)',
  'Sanofi-Aventis Việt Nam',
  'Công ty CP Dược phẩm Imexpharm',
  'Công ty Cổ phần Traphaco',
  'Công ty TNHH LD Stellapharm',
  'Công ty CP Dược phẩm Nam Hà',
];

export const BatchFormModal: React.FC<BatchFormModalProps> = ({
  isOpen,
  batchToEdit,
  initialBatchNumber = '',
  onSave,
  onClose,
}) => {
  const [batchNumber, setBatchNumber] = useState('');
  const [batchName, setBatchName] = useState('');
  const [supplier, setSupplier] = useState('');
  const [importDate, setImportDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [createInvoiceImmediately, setCreateInvoiceImmediately] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batchToEdit) {
      setBatchNumber(batchToEdit.batchNumber);
      setBatchName(batchToEdit.batchName);
      setSupplier(batchToEdit.supplier);
      setImportDate(batchToEdit.importDate);
      setNotes(batchToEdit.notes || '');
      setCreateInvoiceImmediately(false);
      setError(null);
    } else {
      setBatchNumber(initialBatchNumber || '');
      setBatchName('');
      setSupplier('');
      setImportDate(getTodayDateString());
      setNotes('');
      setCreateInvoiceImmediately(false);
      setError(null);
    }
  }, [batchToEdit, initialBatchNumber, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedNumber = batchNumber.trim();
    if (!trimmedNumber) {
      setError('Vui lòng nhập số lô thuốc.');
      return;
    }

    if (!supplier.trim()) {
      setError('Vui lòng nhập hoặc chọn nhà cung cấp.');
      return;
    }

    onSave({
      batchNumber: trimmedNumber,
      batchName: batchName.trim() || `Lô ${trimmedNumber}`,
      supplier: supplier.trim(),
      importDate,
      notes: notes.trim(),
      createInvoiceImmediately: !batchToEdit && createInvoiceImmediately,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {batchToEdit ? 'Chỉnh sửa Lô thuốc' : 'Thêm Lô thuốc Mới'}
              </h3>
              <p className="text-xs text-slate-500">
                {batchToEdit ? `Cập nhật thông tin lô: ${batchToEdit.batchNumber}` : 'Nhập thông tin lô thuốc vừa nhập kho'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Số lô */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Số lô thuốc <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                placeholder="VD: LO-DHG-202601 hoặc LO-PARA-24"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold tracking-wide text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-colors uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                autoFocus
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Mỗi lô thuốc phải có số lô duy nhất để phục vụ tra cứu và kiểm định.
              </p>
            </div>

            {/* Tên lô / Mô tả */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tên thuốc chính hoặc mô tả lô
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="VD: Hapacol 650mg & Kháng sinh Klamentin"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* Nhà cung cấp */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nhà cung cấp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="VD: Dược Hậu Giang (DHG Pharma)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-colors"
              />
              {/* Quick Supplier Chips */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {COMMON_SUPPLIERS.slice(0, 4).map((sup) => (
                  <button
                    key={sup}
                    type="button"
                    onClick={() => setSupplier(sup)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    + {sup.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Ngày nhập kho */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ngày nhập kho <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={importDate}
                onChange={(e) => setImportDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ghi chú tình trạng / bảo quản
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="VD: Hàng bảo quản nhiệt độ thường, thùng nguyên niêm phong..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-colors resize-none"
              />
            </div>

            {/* Option to create invoice immediately (only when creating new batch) */}
            {!batchToEdit && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 cursor-pointer hover:bg-emerald-50 transition-colors">
                <input
                  type="checkbox"
                  checked={createInvoiceImmediately}
                  onChange={(e) => setCreateInvoiceImmediately(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-emerald-900 block">
                    Tạo ngay hóa đơn cho lô này sau khi lưu
                  </span>
                  <span className="text-slate-500">
                    Hệ thống sẽ mở form nhập chi tiết danh sách thuốc và giá tiền ngay sau đó.
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white hover:border-slate-300 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{batchToEdit ? 'Lưu thay đổi' : 'Thêm lô thuốc'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
