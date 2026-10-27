import React from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Search,
  ChevronRight,
  Receipt,
  FileText,
} from 'lucide-react';
import type { BatchWithInvoice, BatchStatistics } from '../../types/pharmacy';
import { StatusBadge } from '../common/StatusBadge';
import { formatVND, formatDateVN } from '../../utils/formatters';

interface OverviewPageProps {
  stats: BatchStatistics;
  recentBatches: BatchWithInvoice[];
  onSelectBatch: (batchId: string) => void;
  onNavigateSearch: () => void;
  onNavigateBatches: () => void;
  onOpenCreateBatch: () => void;
  onOpenCreateInvoice: (batch: BatchWithInvoice) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  stats,
  recentBatches,
  onSelectBatch,
  onNavigateSearch,
  onNavigateBatches,
  onOpenCreateBatch,
  onOpenCreateInvoice,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        {/* Soft decorative background circles */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-24 -bottom-16 w-48 h-48 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/50 border border-emerald-500/30 text-emerald-200 text-xs font-medium mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Hệ thống Quản lý Dược GPP • Kho Trung Tâm
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Tổng quan Hóa đơn & Lô thuốc Nhập kho
          </h2>
          <p className="text-sm text-emerald-100/90 leading-relaxed mb-6 font-normal">
            Kiểm tra đối chiếu hóa đơn nhà cung cấp, chi phí vận chuyển phát sinh và rà soát các lô thuốc chưa cập nhật hóa đơn.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNavigateSearch}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all"
            >
              <Search size={16} />
              <span>Tra cứu số lô ngay</span>
            </button>
            <button
              type="button"
              onClick={onOpenCreateBatch}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700/80 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm rounded-xl border border-emerald-500/40 transition-colors"
            >
              <Plus size={16} />
              <span>Thêm lô thuốc mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Tổng số lô */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">1. Tổng số lô thuốc</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {stats.totalBatches}
            </span>
            <span className="text-xs text-slate-500 font-medium">lô đã nhập</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tất cả nhà cung cấp</span>
            <button
              type="button"
              onClick={onNavigateBatches}
              className="text-emerald-700 font-medium hover:underline flex items-center gap-0.5"
            >
              <span>Xem danh sách</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* 2. Lô đã có hóa đơn */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-2xs hover:border-emerald-300 transition-all bg-emerald-50/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-800">2. Đã có hóa đơn</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800">
              {stats.withInvoiceCount}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              ({stats.totalBatches > 0 ? Math.round((stats.withInvoiceCount / stats.totalBatches) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-100/70 flex items-center justify-between text-xs text-emerald-800 font-medium">
            <span>Đã đối chiếu chứng từ</span>
            <span className="text-emerald-700">Hợp lệ</span>
          </div>
        </div>

        {/* 3. Lô chưa có hóa đơn */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs hover:border-amber-300 transition-all bg-amber-50/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-800">3. Chưa có hóa đơn</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-800">
              {stats.withoutInvoiceCount}
            </span>
            <span className="text-xs text-amber-700 font-medium">lô đang chờ</span>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between text-xs text-amber-800">
            <span>Cần tạo hoặc bổ sung HĐ</span>
            {stats.withoutInvoiceCount > 0 ? (
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Cần xử lý
              </span>
            ) : (
              <span className="text-xs text-emerald-700 font-medium">Đã đủ</span>
            )}
          </div>
        </div>

        {/* 4. Tổng chi phí nhập hàng */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">4. Tổng chi phí nhập hàng</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Receipt size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-800 truncate">
              {formatVND(stats.totalLandedExpense)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Phụ phí: +{formatVND(stats.totalExpenses)}</span>
            <span className="text-emerald-700 font-medium">Sau chi phí</span>
          </div>
        </div>
      </div>

      {/* Notice if any batches are missing invoices */}
      {stats.withoutInvoiceCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-amber-900">
                Có {stats.withoutInvoiceCount} lô thuốc nhập kho chưa có hóa đơn
              </p>
              <p className="text-xs text-amber-700">
                Hãy kiểm tra chứng từ từ nhà cung cấp và tạo hóa đơn để hạch toán giá vốn chính xác.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateBatches}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors shrink-0"
          >
            Xem các lô chưa có HĐ
          </button>
        </div>
      )}

      {/* Recent Batches Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-emerald-600" />
              <span>Lô thuốc gần đây</span>
            </h3>
            <p className="text-xs text-slate-500">
              Danh sách các lô thuốc mới được thêm hoặc cập nhật gần nhất
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateBatches}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Xem tất cả lô thuốc</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                <th className="py-3 px-4">Số lô</th>
                <th className="py-3 px-4">Tên thuốc / Số loại</th>
                <th className="py-3 px-4">Ngày nhập</th>
                <th className="py-3 px-4">Trạng thái HĐ</th>
                <th className="py-3 px-4 text-right">Tiền trước chi phí</th>
                <th className="py-3 px-4 text-right">Tiền sau chi phí</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentBatches.map((batch) => (
                <tr
                  key={batch.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Số lô */}
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 font-mono text-xs">
                      {batch.batchNumber}
                    </span>
                  </td>

                  {/* Tên thuốc */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-800 truncate">
                      {batch.batchName}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {batch.supplier} • {batch.itemCount > 0 ? `${batch.itemCount} loại thuốc` : 'Chưa có chi tiết thuốc'}
                    </div>
                  </td>

                  {/* Ngày nhập */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                    {formatDateVN(batch.importDate)}
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge hasInvoice={batch.hasInvoice} />
                    {batch.hasInvoice && batch.invoiceNumber && (
                      <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                        {batch.invoiceNumber}
                      </span>
                    )}
                  </td>

                  {/* Tổng tiền trước chi phí */}
                  <td className="py-3.5 px-4 text-right font-medium text-slate-700 whitespace-nowrap">
                    {batch.hasInvoice ? formatVND(batch.preExpenseTotal) : '—'}
                  </td>

                  {/* Tổng tiền sau chi phí */}
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-800 whitespace-nowrap">
                    {batch.hasInvoice ? (
                      <div>
                        <span>{formatVND(batch.postExpenseTotal)}</span>
                        {batch.expensesTotal > 0 && (
                          <span className="block text-[10px] text-amber-700 font-medium">
                            (+{formatVND(batch.expensesTotal)} CP)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal">Chưa có HĐ</span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectBatch(batch.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200 transition-colors"
                      >
                        Xem chi tiết
                      </button>
                      {!batch.hasInvoice && (
                        <button
                          type="button"
                          onClick={() => onOpenCreateInvoice(batch)}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-200 transition-colors"
                        >
                          Tạo HĐ
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (No horizontal scrolling!) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {recentBatches.map((batch) => (
            <div key={batch.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 font-mono text-xs font-bold text-slate-800">
                    {batch.batchNumber}
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm mt-1">
                    {batch.batchName}
                  </h4>
                  <p className="text-xs text-slate-500">{batch.supplier}</p>
                </div>
                <StatusBadge hasInvoice={batch.hasInvoice} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Ngày nhập:</span>
                  <span className="font-medium text-slate-700">
                    {formatDateVN(batch.importDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Mã hóa đơn:</span>
                  <span className="font-medium font-mono text-slate-700">
                    {batch.invoiceNumber || 'Chưa có'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Trước chi phí:</span>
                  <span className="font-medium text-slate-700">
                    {batch.hasInvoice ? formatVND(batch.preExpenseTotal) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Sau chi phí:</span>
                  <span className="font-bold text-emerald-800">
                    {batch.hasInvoice ? formatVND(batch.postExpenseTotal) : 'Chưa có HĐ'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectBatch(batch.id)}
                  className="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200 text-center transition-colors"
                >
                  Xem chi tiết lô
                </button>
                {!batch.hasInvoice && (
                  <button
                    type="button"
                    onClick={() => onOpenCreateInvoice(batch)}
                    className="flex-1 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-200 text-center transition-colors"
                  >
                    Tạo hóa đơn
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
