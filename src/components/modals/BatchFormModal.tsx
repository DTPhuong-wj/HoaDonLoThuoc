import React, { useState, useEffect } from 'react';
import { X, Package, CheckCircle2, Circle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import type { Batch, LabelColor } from '../../types/pharmacy';
import { getTodayDateString } from '../../utils/formatters';

interface BatchFormModalProps {
  isOpen: boolean;
  batchToEdit?: Batch | null;
  onSave: (data: {
    batchNumber: string;
    batchNames: string[];
    labelColor: LabelColor;
    importDate: string;
  }) => void;
  onClose: () => void;
}

export const BatchFormModal: React.FC<BatchFormModalProps> = ({
  isOpen,
  batchToEdit,
  onSave,
  onClose,
}) => {
  const [batchNumber, setBatchNumber] = useState('');
  // Danh sách các tên thuốc tách riêng (mỗi tên 1 ô)
  const [medicineNames, setMedicineNames] = useState<string[]>(['']);
  const [labelColor, setLabelColor] = useState<LabelColor>('green');
  const [importDate, setImportDate] = useState(getTodayDateString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batchToEdit) {
      setBatchNumber(batchToEdit.batchNumber);
      setMedicineNames([batchToEdit.batchName]);
      setLabelColor(batchToEdit.labelColor || 'green');
      setImportDate(batchToEdit.importDate || getTodayDateString());
      setError(null);
    } else {
      setBatchNumber('');
      setMedicineNames(['']);
      setLabelColor('green');
      setImportDate(getTodayDateString());
      setError(null);
    }
  }, [batchToEdit, isOpen]);

  if (!isOpen) return null;

  // Thêm một ô tên thuốc mới
  const handleAddMedicineRow = () => {
    setMedicineNames((prev) => [...prev, '']);
  };

  // Cập nhật tên thuốc tại dòng index
  const handleMedicineChange = (index: number, value: string) => {
    setMedicineNames((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
    if (error) setError(null);
  };

  // Xóa một ô tên thuốc
  const handleRemoveMedicineRow = (index: number) => {
    if (medicineNames.length <= 1) {
      setMedicineNames(['']);
      return;
    }
    setMedicineNames((prev) => prev.filter((_, i) => i !== index));
  };

  // Hỗ trợ người dùng dán danh sách nhiều tên thuốc cách nhau bằng xuống dòng hoặc phẩy
  const handlePasteMedicine = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.includes('\n') || text.includes(',')) {
      e.preventDefault();
      const items = text
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (items.length > 0) {
        setMedicineNames((prev) => {
          const updated = [...prev];
          updated.splice(index, 1, ...items);
          return updated;
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!batchNumber.trim()) {
      setError('Vui lòng nhập Lô');
      return;
    }

    const validNames = medicineNames.map((n) => n.trim()).filter((n) => n.length > 0);
    if (validNames.length === 0) {
      setError('Vui lòng nhập ít nhất 1 Tên');
      return;
    }

    if (!importDate) {
      setError('Vui lòng chọn Ngày nhập');
      return;
    }

    onSave({
      batchNumber: batchNumber.trim(),
      batchNames: validNames,
      labelColor,
      importDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {batchToEdit ? 'Chỉnh sửa dòng ' : 'Thêm Lô  Mới'}
              </h3>
              <p className="text-xs text-emerald-100">
                {batchToEdit
                  ? 'Cập nhật thông tin dòng '
                  : 'Tên được tách riêng từng dòng trên Sheet để dễ quản lý'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Lô thuốc */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>Lô</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => {
                setBatchNumber(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ví dụ: LO-DHG-01, LO-2026-02..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm font-mono font-semibold"
              autoFocus
            />
          </div>

          {/* 2. Danh sách Tên thuốc (TÁCH RIÊNG TỪNG CÁI ĐỂ LƯU TỪNG DÒNG TRÊN SHEET) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Tên (tách riêng từng dòng)</span>
                <span className="text-rose-500">*</span>
              </label>
              {!batchToEdit && (
                <button
                  type="button"
                  onClick={handleAddMedicineRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <Plus size={14} />
                  <span>+ Thêm tên</span>
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {medicineNames.map((name, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleMedicineChange(index, e.target.value)}
                    onPaste={(e) => handlePasteMedicine(index, e)}
                    placeholder={index === 0 ? "Ví dụ: Hapacol 650mg" : "Tên thuốc tiếp theo..."}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm font-semibold"
                  />
                  {!batchToEdit && medicineNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicineRow(index)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa dòng thuốc này"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!batchToEdit && (
              <p className="text-[11px] text-slate-400">
                Mỗi tên sẽ được lưu thành <strong>1 dòng riêng biệt</strong> trên Google Sheet với cùng lô thuốc này.
              </p>
            )}
          </div>

          {/* 3. Phân loại: Nhãn */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>Nhãn</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLabelColor('green')}
                className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${labelColor === 'green'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${labelColor === 'green' ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                >
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-900">Nhãn xanh</div>
                  <div className="text-[11px] text-emerald-700/80">Lô nhãn xanh</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLabelColor('white')}
                className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${labelColor === 'white'
                    ? 'border-slate-800 bg-slate-50 text-slate-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${labelColor === 'white' ? 'text-slate-800' : 'text-slate-300'
                    }`}
                >
                  <Circle size={20} />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800">Nhãn trắng</div>
                  <div className="text-[11px] text-slate-500">Lô nhãn trắng</div>
                </div>
              </button>
            </div>
          </div>

          {/* 4. Ngày nhập */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>Ngày nhập</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={importDate}
              onChange={(e) => setImportDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm font-semibold text-slate-800"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              {batchToEdit ? 'Lưu thay đổi' : `Lưu (${medicineNames.filter((n) => n.trim().length > 0).length || 1} thuốc)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
