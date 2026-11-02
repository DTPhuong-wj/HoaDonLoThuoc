import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Edit2,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  Circle,
  RotateCcw,
  Link2,
} from 'lucide-react';
import type { Batch, BatchFilterType } from '../../types/pharmacy';
import { LabelColorBadge } from '../common/StatusBadge';
import { formatDateVN } from '../../utils/formatters';
import { storageService } from '../../services/storageService';

interface BatchesListPageProps {
  batches: Batch[];
  onSelectBatch: (batchId: string) => void;
  onEditBatch: (batch: Batch) => void;
  onDeleteBatch: (batch: Batch) => void;
  onOpenCreateBatch: () => void;
  onOpenSheetLink: () => void;
  isSheetConnected: boolean;
  initialFilter?: BatchFilterType;
}

export const BatchesListPage: React.FC<BatchesListPageProps> = ({
  batches,
  onSelectBatch,
  onEditBatch,
  onDeleteBatch,
  onOpenCreateBatch,
  onOpenSheetLink,
  isSheetConnected,
  initialFilter = 'all',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLabel, setFilterLabel] = useState<BatchFilterType>(initialFilter);
  const [filterBatchNumber, setFilterBatchNumber] = useState<string>('all');

  // Đếm số lượng theo nhãn
  const greenCount = batches.filter((b) => b.labelColor === 'green').length;
  const whiteCount = batches.filter((b) => b.labelColor === 'white').length;

  // Danh sách các mã lô thuốc độc nhất để lọc theo lô
  const uniqueBatchNumbers = useMemo(() => {
    const set = new Set<string>();
    batches.forEach((b) => {
      if (b.batchNumber && b.batchNumber.trim()) {
        set.add(b.batchNumber.trim());
      }
    });
    return Array.from(set).sort();
  }, [batches]);

  // Lọc dữ liệu kết hợp đa tiêu chí: Lọc theo Lô + Lọc theo Nhãn + Tìm kiếm
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      // 1. Lọc theo nhãn màu
      if (filterLabel === 'green' && batch.labelColor !== 'green') return false;
      if (filterLabel === 'white' && batch.labelColor !== 'white') return false;

      // 2. Lọc theo lô thuốc
      if (filterBatchNumber !== 'all' && batch.batchNumber !== filterBatchNumber) return false;

      // 3. Tìm kiếm theo Lô thuốc hoặc Tên thuốc
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchBatchNum = batch.batchNumber.toLowerCase().includes(q);
        const matchName = batch.batchName.toLowerCase().includes(q);
        if (!matchBatchNum && !matchName) return false;
      }

      return true;
    });
  }, [batches, filterLabel, filterBatchNumber, searchTerm]);

  const isFiltering = filterLabel !== 'all' || filterBatchNumber !== 'all' || searchTerm.trim().length > 0;

  const handleResetFilter = () => {
    setFilterLabel('all');
    setFilterBatchNumber('all');
    setSearchTerm('');
  };

  const handleExportCSV = () => {
    const csvStr = storageService.exportBatchesAsCSV();
    const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DanhSach_LoThuoc_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Banner nhắc liên kết Sheet nếu chưa liên kết */}
      {!isSheetConnected && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Link2 size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-900">
                Chưa liên kết với Google Sheet
              </div>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Vui lòng liên kết với Google Sheet trước khi thêm lô thuốc để dữ liệu được lưu trữ tự động.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSheetLink}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors shrink-0"
          >
            Liên kết với Sheet ngay
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3 THẺ THỐNG KÊ NHÃN (BẤM VÀO THẺ ĐỂ LỌC TRỰC TIẾP)      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Tổng số lô thuốc */}
        <div
          onClick={() => setFilterLabel('all')}
          className={`cursor-pointer p-5 rounded-3xl border transition-all shadow-2xs group ${
            filterLabel === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                filterLabel === 'all' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Tổng số lô thuốc
            </span>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                filterLabel === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
              }`}
            >
              <Package size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{batches.length}</span>
            <span
              className={`text-xs font-medium ${
                filterLabel === 'all' ? 'text-slate-300' : 'text-slate-400'
              }`}
            >
              lô thuốc
            </span>
          </div>
          <div
            className={`mt-3 pt-3 border-t text-xs flex items-center justify-between ${
              filterLabel === 'all' ? 'border-slate-800 text-emerald-400 font-semibold' : 'border-slate-100 text-slate-500'
            }`}
          >
            <span>{filterLabel === 'all' ? '✓ Đang xem tất cả nhãn' : 'Bấm để xem tất cả'}</span>
          </div>
        </div>

        {/* 2. Tổng lô có nhãn xanh */}
        <div
          onClick={() => setFilterLabel('green')}
          className={`cursor-pointer p-5 rounded-3xl border transition-all shadow-2xs group ${
            filterLabel === 'green'
              ? 'bg-emerald-800 text-white border-emerald-800 shadow-md ring-2 ring-emerald-700/20'
              : 'bg-white text-slate-800 border-emerald-200/90 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                filterLabel === 'green' ? 'text-emerald-100' : 'text-emerald-800'
              }`}
            >
              Tổng lô có nhãn xanh
            </span>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                filterLabel === 'green'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{greenCount}</span>
            <span
              className={`text-xs font-medium ${
                filterLabel === 'green' ? 'text-emerald-100' : 'text-emerald-600'
              }`}
            >
              lô (Nhãn xanh)
            </span>
          </div>
          <div
            className={`mt-3 pt-3 border-t text-xs flex items-center justify-between ${
              filterLabel === 'green'
                ? 'border-emerald-700 text-emerald-200 font-semibold'
                : 'border-emerald-100/60 text-emerald-700'
            }`}
          >
            <span>{filterLabel === 'green' ? '✓ Đang lọc nhãn xanh' : 'Bấm để lọc nhãn xanh'}</span>
          </div>
        </div>

        {/* 3. Tổng lô có nhãn trắng */}
        <div
          onClick={() => setFilterLabel('white')}
          className={`cursor-pointer p-5 rounded-3xl border transition-all shadow-2xs group ${
            filterLabel === 'white'
              ? 'bg-slate-700 text-white border-slate-700 shadow-md ring-2 ring-slate-700/20'
              : 'bg-white text-slate-800 border-slate-300 hover:border-slate-500'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                filterLabel === 'white' ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              Tổng lô có nhãn trắng
            </span>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                filterLabel === 'white'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
              }`}
            >
              <Circle size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{whiteCount}</span>
            <span
              className={`text-xs font-medium ${
                filterLabel === 'white' ? 'text-slate-200' : 'text-slate-500'
              }`}
            >
              lô (Nhãn trắng)
            </span>
          </div>
          <div
            className={`mt-3 pt-3 border-t text-xs flex items-center justify-between ${
              filterLabel === 'white'
                ? 'border-slate-600 text-slate-200 font-semibold'
                : 'border-slate-100 text-slate-600'
            }`}
          >
            <span>{filterLabel === 'white' ? '✓ Đang lọc nhãn trắng' : 'Bấm để lọc nhãn trắng'}</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BỘ LỌC THEO LÔ & THEO NHÃN & TÌM KIẾM                    */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* 1. Lọc theo Lô thuốc (Dropdown chọn lô) */}
          <div className="flex items-center gap-2 sm:w-64">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Lọc theo lô:</span>
            <select
              value={filterBatchNumber}
              onChange={(e) => setFilterBatchNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold text-slate-800 bg-white"
            >
              <option value="all">Tất cả các lô ({uniqueBatchNumbers.length})</option>
              {uniqueBatchNumbers.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Lọc theo Nhãn (Dropdown hoặc nút chọn nhãn) */}
          <div className="flex items-center gap-2 sm:w-56">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Lọc theo nhãn:</span>
            <select
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value as BatchFilterType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold text-slate-800 bg-white"
            >
              <option value="all">Tất cả nhãn</option>
              <option value="green">Nhãn xanh ({greenCount})</option>
              <option value="white">Nhãn trắng ({whiteCount})</option>
            </select>
          </div>

          {/* 3. Ô tìm kiếm tức thì */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Lô thuốc hoặc Tên thuốc..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm font-medium"
            />
          </div>

          {/* Nút đặt lại bộ lọc */}
          {isFiltering && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors shrink-0"
              title="Đặt lại toàn bộ điều kiện lọc"
            >
              <RotateCcw size={14} />
              <span>Xóa bộ lọc</span>
            </button>
          )}

          {/* Nút Xuất CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs shrink-0"
            title="Tải tệp CSV danh sách chuẩn 5 cột"
          >
            <Download size={14} />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table: Chuẩn 5 cột */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4 text-center w-16">stt</th>
                <th className="py-3.5 px-4">lô thuốc</th>
                <th className="py-3.5 px-4">tên thuốc</th>
                <th className="py-3.5 px-4 text-center">nhãn</th>
                <th className="py-3.5 px-4 text-center">ngày nhập</th>
                <th className="py-3.5 px-4 text-right">thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <Package size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-700 text-sm">
                          {batches.length === 0
                            ? 'Chưa có lô thuốc nào'
                            : 'Không tìm thấy lô thuốc nào phù hợp với bộ lọc'}
                        </p>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          {batches.length === 0
                            ? 'Hãy liên kết với Google Sheet và nhấn "+ Thêm lô thuốc" để bắt đầu ghi nhận.'
                            : 'Hãy thử đổi điều kiện lọc theo lô hoặc nhãn để hiển thị kết quả.'}
                        </p>
                      </div>
                      {batches.length === 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          {!isSheetConnected && (
                            <button
                              type="button"
                              onClick={onOpenSheetLink}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
                            >
                              Liên kết Google Sheet
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={onOpenCreateBatch}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            + Thêm lô thuốc
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch, index) => (
                  <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* 1. STT */}
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-500">
                      {index + 1}
                    </td>

                    {/* 2. Lô thuốc */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectBatch(batch.id)}
                        className="font-mono font-bold text-slate-900 hover:text-emerald-700 hover:underline text-left text-xs sm:text-sm"
                      >
                        {batch.batchNumber}
                      </button>
                    </td>

                    {/* 3. Tên thuốc thuộc lô đó */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs sm:text-sm">
                      {batch.batchName}
                    </td>

                    {/* 4. Nhãn xanh hay trắng */}
                    <td className="py-3.5 px-4 text-center">
                      <LabelColorBadge color={batch.labelColor} size="sm" />
                    </td>

                    {/* 5. Ngày nhập */}
                    <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                      {formatDateVN(batch.importDate)}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectBatch(batch.id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditBatch(batch)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteBatch(batch)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa lô thuốc"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
