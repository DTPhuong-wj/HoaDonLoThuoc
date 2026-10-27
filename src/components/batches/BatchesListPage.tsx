import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  FilePlus,
  Eye,
  Building2,
} from 'lucide-react';
import type { BatchWithInvoice, InvoiceStatusFilter } from '../../types/pharmacy';
import { StatusBadge } from '../common/StatusBadge';
import { formatVND, formatDateVN } from '../../utils/formatters';

interface BatchesListPageProps {
  batches: BatchWithInvoice[];
  onSelectBatch: (batchId: string) => void;
  onEditBatch: (batch: BatchWithInvoice) => void;
  onDeleteBatch: (batch: BatchWithInvoice) => void;
  onOpenCreateInvoice: (batch: BatchWithInvoice) => void;
  onOpenCreateBatch: () => void;
}

export const BatchesListPage: React.FC<BatchesListPageProps> = ({
  batches,
  onSelectBatch,
  onEditBatch,
  onDeleteBatch,
  onOpenCreateInvoice,
  onOpenCreateBatch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');

  // Unique suppliers for filter
  const suppliers = Array.from(new Set(batches.map((b) => b.supplier)));

  // Filter logic
  const filteredBatches = batches.filter((batch) => {
    // 1. Status Filter
    if (statusFilter === 'has_invoice' && !batch.hasInvoice) return false;
    if (statusFilter === 'no_invoice' && batch.hasInvoice) return false;

    // 2. Supplier Filter
    if (selectedSupplier !== 'all' && batch.supplier !== selectedSupplier) return false;

    // 3. Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchBatchNum = batch.batchNumber.toLowerCase().includes(q);
      const matchName = batch.batchName.toLowerCase().includes(q);
      const matchSup = batch.supplier.toLowerCase().includes(q);
      const matchInv = batch.invoiceNumber && batch.invoiceNumber.toLowerCase().includes(q);
      const matchMed = batch.invoice?.items?.some((m) => m.medicineName.toLowerCase().includes(q));
      if (!matchBatchNum && !matchName && !matchSup && !matchInv && !matchMed) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Action & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Package size={22} className="text-emerald-600" />
            <span>Danh sách Lô thuốc Nhập kho</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý và kiểm tra chứng từ hóa đơn theo từng lô hàng
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateBatch}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>+ Thêm lô thuốc mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={17} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo số lô, tên thuốc, nhà cung cấp, mã HĐ..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-colors"
            />
          </div>

          {/* Status Tabs */}
          <div className="sm:col-span-3 flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
                statusFilter === 'all'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({batches.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('has_invoice')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
                statusFilter === 'has_invoice'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã có HĐ
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('no_invoice')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
                statusFilter === 'no_invoice'
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chưa có
            </button>
          </div>

          {/* Supplier Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-colors"
            >
              <option value="all">Tất cả nhà cung cấp</option>
              {suppliers.map((sup) => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Batches Content Area */}
      {filteredBatches.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <Package size={40} className="mx-auto text-slate-300" />
          <h4 className="text-base font-bold text-slate-700">
            Không tìm thấy lô thuốc phù hợp
          </h4>
          <p className="text-xs text-slate-400">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setSelectedSupplier('all');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-3 text-center w-12">STT</th>
                  <th className="py-3.5 px-4">Số lô</th>
                  <th className="py-3.5 px-4">Tên thuốc / Mô tả</th>
                  <th className="py-3.5 px-4">Nhà cung cấp</th>
                  <th className="py-3.5 px-4">Ngày nhập</th>
                  <th className="py-3.5 px-4 text-center">Số loại</th>
                  <th className="py-3.5 px-4">Trạng thái HĐ</th>
                  <th className="py-3.5 px-4 text-right">Tiền trước CP</th>
                  <th className="py-3.5 px-4 text-right">Tiền sau CP</th>
                  <th className="py-3.5 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBatches.map((batch, index) => (
                  <tr
                    key={batch.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* STT */}
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-500 whitespace-nowrap">
                      {index + 1}
                    </td>

                    {/* Số lô */}
                    <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 group-hover:bg-emerald-50 rounded-lg border border-slate-200 group-hover:border-emerald-200 font-mono text-xs transition-colors">
                        {batch.batchNumber}
                      </span>
                    </td>

                    {/* Tên thuốc */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 truncate" title={batch.batchName}>
                        {batch.batchName}
                      </div>
                      {batch.notes && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {batch.notes}
                        </div>
                      )}
                    </td>

                    {/* Nhà cung cấp */}
                    <td className="py-3.5 px-4 text-slate-600 max-w-[180px] truncate" title={batch.supplier}>
                      {batch.supplier}
                    </td>

                    {/* Ngày nhập */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {formatDateVN(batch.importDate)}
                    </td>

                    {/* Số loại thuốc trong lô */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {batch.itemCount > 0 ? (
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                          {batch.itemCount} loại
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">0</span>
                      )}
                    </td>

                    {/* Trạng thái hóa đơn */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge hasInvoice={batch.hasInvoice} />
                      {batch.hasInvoice && batch.invoiceNumber && (
                        <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                          {batch.invoiceNumber}
                        </span>
                      )}
                    </td>

                    {/* Tổng tiền trước chi phí */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-medium text-slate-700">
                      {batch.hasInvoice ? formatVND(batch.preExpenseTotal) : '—'}
                    </td>

                    {/* Tổng tiền sau chi phí */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {batch.hasInvoice ? (
                        <div>
                          <span className="font-bold text-emerald-800">
                            {formatVND(batch.postExpenseTotal)}
                          </span>
                          {batch.expensesTotal > 0 && (
                            <span className="block text-[10px] text-amber-700 font-medium">
                              (+{formatVND(batch.expensesTotal)} CP)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa lập HĐ</span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Xem chi tiết */}
                        <button
                          type="button"
                          onClick={() => onSelectBatch(batch.id)}
                          className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Xem chi tiết lô thuốc & hóa đơn"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Tạo hóa đơn nếu chưa có */}
                        {!batch.hasInvoice && (
                          <button
                            type="button"
                            onClick={() => onOpenCreateInvoice(batch)}
                            className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Tạo hóa đơn cho lô này"
                          >
                            <FilePlus size={16} />
                          </button>
                        )}

                        {/* Chỉnh sửa lô */}
                        <button
                          type="button"
                          onClick={() => onEditBatch(batch)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Chỉnh sửa thông tin lô"
                        >
                          <Edit2 size={16} />
                        </button>

                        {/* Xóa lô */}
                        <button
                          type="button"
                          onClick={() => onDeleteBatch(batch)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa lô thuốc"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Card View (Strictly Responsive, No horizontal overflow!) */}
          <div className="block lg:hidden space-y-3.5">
            {filteredBatches.map((batch, index) => (
              <div
                key={batch.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        #{index + 1}
                      </span>
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 text-slate-800">
                        {batch.batchNumber}
                      </span>
                      <StatusBadge hasInvoice={batch.hasInvoice} size="sm" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                      {batch.batchName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Building2 size={13} className="text-slate-400" />
                      {batch.supplier}
                    </p>
                  </div>
                </div>

                {/* Card Details Grid */}
                <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Ngày nhập:</span>
                    <span className="font-medium text-slate-700">
                      {formatDateVN(batch.importDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Số loại thuốc:</span>
                    <span className="font-medium text-slate-700">
                      {batch.itemCount} loại
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Mã hóa đơn:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {batch.invoiceNumber || 'Chưa có'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Chi phí phát sinh:</span>
                    <span className="font-medium text-amber-700">
                      +{formatVND(batch.expensesTotal)}
                    </span>
                  </div>
                </div>

                {/* Price highlight */}
                <div className="flex items-center justify-between p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Tiền trước CP:</span>
                    <span className="font-semibold text-slate-700">
                      {batch.hasInvoice ? formatVND(batch.preExpenseTotal) : '—'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-emerald-800 block font-medium">Tổng tiền sau CP:</span>
                    <span className="font-extrabold text-sm text-emerald-800">
                      {batch.hasInvoice ? formatVND(batch.postExpenseTotal) : 'Chưa có HĐ'}
                    </span>
                  </div>
                </div>

                {/* Action buttons with large touch targets */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectBatch(batch.id)}
                    className="flex-1 min-w-[130px] py-2.5 px-3 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-2xs hover:bg-emerald-700 text-center transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye size={15} />
                    <span>Xem chi tiết</span>
                  </button>

                  {!batch.hasInvoice && (
                    <button
                      type="button"
                      onClick={() => onOpenCreateInvoice(batch)}
                      className="py-2.5 px-3 bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-2xs hover:bg-amber-700 transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={15} />
                      <span>Tạo HĐ</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onEditBatch(batch)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    title="Chỉnh sửa lô"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteBatch(batch)}
                    className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa lô"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
