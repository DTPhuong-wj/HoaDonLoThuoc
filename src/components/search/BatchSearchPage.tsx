import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  FileText,
  DollarSign,
  Package,
  Calendar,
  Building2,
  Sparkles,
} from 'lucide-react';
import type { BatchWithInvoice } from '../../types/pharmacy';
import { StatusBadge } from '../common/StatusBadge';
import { formatVND, formatDateVN } from '../../utils/formatters';

interface BatchSearchPageProps {
  initialQuery?: string;
  onSearch: (query: string) => Promise<BatchWithInvoice[]> | BatchWithInvoice[];
  onSelectBatch: (batchId: string) => void;
  onOpenCreateBatchWithNumber?: (batchNumber: string) => void;
  onOpenCreateInvoice: (batch: BatchWithInvoice) => void;
  allBatches: BatchWithInvoice[];
}

export const BatchSearchPage: React.FC<BatchSearchPageProps> = ({
  initialQuery = '',
  onSearch,
  onSelectBatch,
  onOpenCreateBatchWithNumber,
  onOpenCreateInvoice,
  allBatches,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery));
  const [results, setResults] = useState<BatchWithInvoice[]>([]);

  // Sample quick chips
  const sampleChips = [
    { label: 'LO-DHG-202601', desc: 'Đã có HĐ' },
    { label: 'LO-IMEX-202603', desc: 'Chưa có HĐ' },
    { label: 'LO-SANOFI-202602', desc: 'Đã có HĐ' },
    { label: 'LO-STELLA-202605', desc: 'Chưa có HĐ' },
    { label: 'Paracetamol', desc: 'Tìm theo thuốc' },
    { label: 'HD-DHG-88219', desc: 'Tìm theo mã HĐ' },
    { label: 'LO-TEST-999', desc: 'Thử lô chưa có' },
  ];

  const executeSearch = React.useCallback(async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) {
      setHasSearched(false);
      setResults([]);
      return;
    }
    const found = await Promise.resolve(onSearch(q));
    setResults(found);
    setHasSearched(true);
  }, [onSearch]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      executeSearch(initialQuery);
    }
  }, [initialQuery, executeSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleChipClick = (chipQuery: string) => {
    setQuery(chipQuery);
    executeSearch(chipQuery);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Search Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100/90 shadow-2xs">
        <div className="max-w-2xl mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200/60">
            <Sparkles size={14} className="text-emerald-600" />
            <span>Tra cứu tức thì • Dữ liệu nội bộ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Kiểm tra trạng thái Hóa đơn Lô thuốc
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Nhập số lô để kiểm tra ngay lô thuốc đã có hóa đơn tài chính hay chưa, xem bảng giá thuốc và tổng chi phí thực tế sau phụ phí.
          </p>
        </div>

        {/* Large Search Bar */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search size={22} className="text-emerald-600" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập số lô thuốc cần kiểm tra… (VD: LO-DHG-202601 hoặc Paracetamol)"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all shadow-2xs"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Search size={18} strokeWidth={2.5} />
              <span>Tra cứu</span>
            </button>
          </div>

          {/* Quick Search Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Gợi ý thử nhanh:</span>
            {sampleChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChipClick(chip.label)}
                className={`text-xs px-2.5 py-1 rounded-xl transition-colors border flex items-center gap-1.5 ${
                  query === chip.label
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border-slate-200'
                }`}
              >
                <span className="font-mono">{chip.label}</span>
                <span className="text-[10px] text-slate-400">({chip.desc})</span>
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Search Results Area */}
      {hasSearched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-700">
              Kết quả tra cứu cho: <span className="text-emerald-800 font-mono">"{query}"</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Tìm thấy {results.length} lô phù hợp
            </span>
          </div>

          {/* CASE 3: Không tìm thấy lô thuốc */}
          {results.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 text-center shadow-2xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle size={32} />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-lg font-bold text-slate-800">
                  Không tìm thấy lô thuốc phù hợp
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  Không có lô thuốc nào mang số lô, tên thuốc hoặc mã hóa đơn trùng khớp với{' '}
                  <strong className="text-slate-700 font-mono">"{query}"</strong> trong kho.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCreateBatchWithNumber) {
                      onOpenCreateBatchWithNumber(query.toUpperCase());
                    }
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center gap-2"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Thêm lô thuốc mới với mã "{query.toUpperCase()}"</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              </div>
            </div>
          ) : (
            /* Results List */
            <div className="space-y-4">
              {results.map((batch) => {
                if (batch.hasInvoice) {
                  /* CASE 1: Đã có hóa đơn */
                  return (
                    <div
                      key={batch.id}
                      className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-xs hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                    >
                      {/* Top banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-0.5 rounded-lg">
                                {batch.batchNumber}
                              </span>
                              <StatusBadge hasInvoice={true} size="md" />
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-800 mt-1">
                              {batch.batchName}
                            </h4>
                          </div>
                        </div>

                        {/* Invoice reference pill */}
                        <div className="sm:text-right bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200/80">
                          <span className="text-[11px] text-emerald-700 font-medium block">
                            Mã hóa đơn:
                          </span>
                          <span className="text-sm font-bold font-mono text-emerald-950">
                            {batch.invoiceNumber || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-400 block mb-0.5">Nhà cung cấp</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                            <Building2 size={13} className="text-slate-500 shrink-0" />
                            {batch.supplier}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-400 block mb-0.5">Ngày nhập kho</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <Calendar size={13} className="text-slate-500 shrink-0" />
                            {formatDateVN(batch.importDate)}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-400 block mb-0.5">Số loại thuốc</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <Package size={13} className="text-slate-500 shrink-0" />
                            {batch.itemCount} loại thuốc
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-400 block mb-0.5">Chi phí phát sinh</span>
                          <span className="font-semibold text-amber-800 flex items-center gap-1">
                            <DollarSign size={13} className="text-amber-600 shrink-0" />
                            +{formatVND(batch.expensesTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Highlighted financial breakdown */}
                      <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                        <div>
                          <span className="text-[11px] text-slate-500 block">
                            Tiền hàng trước chi phí:
                          </span>
                          <span className="text-sm sm:text-base font-bold text-slate-800">
                            {formatVND(batch.preExpenseTotal)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-amber-700 block">
                            Tổng chi phí ngoài hóa đơn:
                          </span>
                          <span className="text-sm sm:text-base font-bold text-amber-800">
                            +{formatVND(batch.expensesTotal)}
                          </span>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-[11px] text-emerald-800 block font-medium">
                            Tổng tiền sau chi phí (Thực tế):
                          </span>
                          <span className="text-lg sm:text-xl font-black text-emerald-800">
                            {formatVND(batch.postExpenseTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Medicines in batch preview */}
                      {batch.invoice?.items && batch.invoice.items.length > 0 && (
                        <div className="text-xs space-y-1.5">
                          <span className="text-slate-500 font-medium">Danh mục thuốc trong lô:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {batch.invoice.items.map((med) => (
                              <span
                                key={med.id}
                                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700"
                              >
                                {med.medicineName} ({med.quantity} {med.unit})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => onSelectBatch(batch.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <FileText size={15} />
                          <span>Xem chi tiết & hóa đơn đầy đủ</span>
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  /* CASE 2: Chưa có hóa đơn */
                  return (
                    <div
                      key={batch.id}
                      className="bg-white rounded-3xl p-6 border-2 border-amber-300 shadow-xs hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                    >
                      {/* Top banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                            <Clock size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-0.5 rounded-lg">
                                {batch.batchNumber}
                              </span>
                              <StatusBadge hasInvoice={false} size="md" />
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-800 mt-1">
                              {batch.batchName}
                            </h4>
                          </div>
                        </div>

                        <div className="bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200 text-xs text-amber-800 font-semibold flex items-center gap-1.5 self-start sm:self-auto">
                          <AlertCircle size={15} />
                          <span>Cần cập nhật hóa đơn</span>
                        </div>
                      </div>

                      {/* Alert notice */}
                      <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-xs text-amber-900 leading-relaxed">
                        <strong>Lưu ý:</strong> Lô thuốc này đã được tạo hồ sơ nhập kho nhưng{' '}
                        <strong>CHƯA CÓ HÓA ĐƠN HỢP LỆ</strong> hoặc chưa được nhập danh sách thuốc & chi phí. Hãy bấm nút "Tạo hóa đơn" bên dưới để hoàn tất chứng từ kế toán.
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-400 block mb-0.5">Nhà cung cấp</span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {batch.supplier}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-400 block mb-0.5">Ngày nhập kho</span>
                          <span className="font-semibold text-slate-800 block">
                            {formatDateVN(batch.importDate)}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl col-span-2 sm:col-span-1">
                          <span className="text-slate-400 block mb-0.5">Ghi chú</span>
                          <span className="font-medium text-slate-600 truncate block">
                            {batch.notes || 'Không có ghi chú'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => onSelectBatch(batch.id)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Xem hồ sơ lô
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenCreateInvoice(batch)}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                          <span>+ Tạo hóa đơn cho lô này</span>
                        </button>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      ) : (
        /* Initial State before user searches */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-5">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Package size={18} className="text-emerald-600" />
            <span>Tất cả các lô thuốc đang có trong kho</span>
          </h3>
          <p className="text-xs text-slate-500">
            Bạn có thể nhấp trực tiếp vào bất kỳ lô nào dưới đây để xem trạng thái hoặc điền số lô vào thanh tra cứu phía trên.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allBatches.map((b) => (
              <div
                key={b.id}
                onClick={() => onSelectBatch(b.id)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 cursor-pointer transition-all flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 group-hover:bg-emerald-100 text-slate-800 group-hover:text-emerald-900 px-2 py-0.5 rounded-md transition-colors">
                      {b.batchNumber}
                    </span>
                    <StatusBadge hasInvoice={b.hasInvoice} size="sm" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 truncate">
                    {b.batchName}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">
                    {b.supplier} • {formatDateVN(b.importDate)}
                  </p>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-600 shrink-0 mt-2 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
