import React, { useState } from 'react';
import {
  FileText,
  Search,
  Building2,
  Eye,
  Plus,
  Trash2,
  Receipt,
} from 'lucide-react';
import type { BatchWithInvoice } from '../../types/pharmacy';
import { formatVND, formatDateVN } from '../../utils/formatters';

interface InvoicesListPageProps {
  batchesWithInvoices: BatchWithInvoice[];
  onSelectBatch: (batchId: string) => void;
  onOpenCreateInvoiceForPendingBatch: () => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

export const InvoicesListPage: React.FC<InvoicesListPageProps> = ({
  batchesWithInvoices,
  onSelectBatch,
  onOpenCreateInvoiceForPendingBatch,
  onDeleteInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Batches that actually have an invoice
  const invoicedBatches = batchesWithInvoices.filter((b) => b.hasInvoice && b.invoice);
  // Batches waiting for invoice
  const pendingBatches = batchesWithInvoices.filter((b) => !b.hasInvoice);

  const filteredInvoices = invoicedBatches.filter((b) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const inv = b.invoice!;
    const matchInvNum = inv.invoiceNumber.toLowerCase().includes(q);
    const matchBatchNum = b.batchNumber.toLowerCase().includes(q);
    const matchSupplier = b.supplier.toLowerCase().includes(q);
    const matchItem = inv.items.some((it) => it.medicineName.toLowerCase().includes(q));
    return matchInvNum || matchBatchNum || matchSupplier || matchItem;
  });

  const totalInvoicedPre = invoicedBatches.reduce((acc, b) => acc + b.preExpenseTotal, 0);
  const totalInvoicedPost = invoicedBatches.reduce((acc, b) => acc + b.postExpenseTotal, 0);
  const totalInvoicedExpenses = invoicedBatches.reduce((acc, b) => acc + b.expensesTotal, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText size={22} className="text-emerald-600" />
            <span>Quản lý Hóa đơn Nhập hàng</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi danh sách các hóa đơn đã được lập và đối soát chi phí
          </p>
        </div>
        {pendingBatches.length > 0 && (
          <button
            type="button"
            onClick={onOpenCreateInvoiceForPendingBatch}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Tạo HĐ cho lô đang chờ ({pendingBatches.length})</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">
            Tổng tiền hàng trước chi phí
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 block">
            {formatVND(totalInvoicedPre)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Từ {invoicedBatches.length} hóa đơn đã lưu
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-xs text-amber-700 font-semibold uppercase block mb-1">
            Tổng chi phí phát sinh
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-800 block">
            +{formatVND(totalInvoicedExpenses)}
          </span>
          <span className="text-[11px] text-amber-700/80 block mt-1">
            Vận chuyển, bốc xếp, bảo quản
          </span>
        </div>

        <div className="bg-emerald-800 text-white p-4 sm:p-5 rounded-2xl border border-emerald-900 shadow-xs">
          <span className="text-xs text-emerald-200 font-semibold uppercase block mb-1">
            Tổng giá trị sau chi phí
          </span>
          <span className="text-xl sm:text-2xl font-black text-white block">
            {formatVND(totalInvoicedPost)}
          </span>
          <span className="text-[11px] text-emerald-300 block mt-1">
            Giá vốn thực nhập toàn kho
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã hóa đơn, số lô, nhà cung cấp hoặc tên thuốc..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-colors"
          />
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <Receipt size={40} className="mx-auto text-slate-300" />
          <h4 className="text-base font-bold text-slate-700">
            Không tìm thấy hóa đơn nào
          </h4>
          <p className="text-xs text-slate-400">
            {invoicedBatches.length === 0
              ? 'Chưa có hóa đơn nào được lưu trong hệ thống.'
              : 'Không có hóa đơn nào khớp với từ khóa tìm kiếm.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInvoices.map((batch) => {
            const inv = batch.invoice!;
            return (
              <div
                key={inv.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Lô: {batch.batchNumber}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {batch.batchName}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 size={13} className="text-slate-400" />
                      {batch.supplier}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Ngày lập:</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {formatDateVN(inv.invoiceDate)}
                    </span>
                  </div>
                </div>

                {/* Medicines preview */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Thuốc trong hóa đơn ({inv.items.length} loại):
                  </span>
                  <div className="space-y-1">
                    {inv.items.slice(0, 3).map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <span className="truncate max-w-[200px] font-medium">
                          {it.medicineName} ({it.quantity} {it.unit})
                        </span>
                        <span className="font-semibold text-slate-800 shrink-0">
                          {formatVND(it.amount)}
                        </span>
                      </div>
                    ))}
                    {inv.items.length > 3 && (
                      <span className="text-[11px] text-slate-400 italic block pl-1">
                        + thêm {inv.items.length - 3} loại thuốc khác...
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial bar */}
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Tiền trước CP:</span>
                    <span className="font-semibold text-slate-800">
                      {formatVND(inv.preExpenseTotal)}
                    </span>
                  </div>
                  {inv.expensesTotal > 0 && (
                    <div className="text-center">
                      <span className="text-[11px] text-amber-700 block">Phụ phí:</span>
                      <span className="font-semibold text-amber-800">
                        +{formatVND(inv.expensesTotal)}
                      </span>
                    </div>
                  )}
                  <div className="text-right">
                    <span className="text-[11px] text-emerald-800 block font-medium">Sau chi phí:</span>
                    <span className="font-black text-sm text-emerald-800">
                      {formatVND(inv.postExpenseTotal)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectBatch(batch.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200 transition-colors"
                  >
                    <Eye size={14} />
                    <span>Xem chi tiết lô</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteInvoice(inv.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Xóa hóa đơn"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
