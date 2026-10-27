import React from 'react';
import {
  ArrowLeft,
  Package,
  FileText,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Receipt,
  FilePlus,
  Tag,
  Info,
} from 'lucide-react';
import type { BatchWithInvoice, InvoiceItem, ExpenseItem } from '../../types/pharmacy';
import { StatusBadge } from '../common/StatusBadge';
import { formatVND, formatDateVN } from '../../utils/formatters';

interface BatchDetailViewProps {
  batch: BatchWithInvoice;
  onBack: () => void;
  onEditBatch: (batch: BatchWithInvoice) => void;
  onDeleteBatch: (batch: BatchWithInvoice) => void;
  onOpenCreateInvoice: (batch: BatchWithInvoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onOpenAddItem: () => void;
  onOpenEditItem: (item: InvoiceItem) => void;
  onDeleteItem: (itemId: string) => void;
  onOpenAddExpense: () => void;
  onOpenEditExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const BatchDetailView: React.FC<BatchDetailViewProps> = ({
  batch,
  onBack,
  onEditBatch,
  onDeleteBatch,
  onOpenCreateInvoice,
  onDeleteInvoice,
  onOpenAddItem,
  onOpenEditItem,
  onDeleteItem,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
}) => {

  const invoice = batch.invoice;
  const items = invoice?.items || [];
  const expenses = invoice?.expenses || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 print:p-0">
      {/* Top Back & Action Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-800 transition-colors self-start"
        >
          <ArrowLeft size={16} />
          <span>Quay lại danh sách</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {batch.hasInvoice && (
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Printer size={15} />
              <span>In phiếu đối chiếu</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEditBatch(batch)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Edit2 size={15} />
            <span>Sửa thông tin lô</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteBatch(batch)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Trash2 size={15} />
            <span>Xóa lô thuốc</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PHẦN 1: THÔNG TIN LÔ THUỐC                               */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Package size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono font-bold text-sm bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200">
                  {batch.batchNumber}
                </span>
                <StatusBadge hasInvoice={batch.hasInvoice} size="md" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                {batch.batchName}
              </h2>
            </div>
          </div>

          {!batch.hasInvoice && (
            <button
              type="button"
              onClick={() => onOpenCreateInvoice(batch)}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors self-start sm:self-auto"
            >
              <FilePlus size={17} strokeWidth={2.5} />
              <span>+ Tạo hóa đơn cho lô này</span>
            </button>
          )}
        </div>

        {/* 7 Key Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {/* 1. Số lô */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">1. Số lô thuốc</span>
            <span className="font-mono font-bold text-slate-800 text-sm block truncate">
              {batch.batchNumber}
            </span>
          </div>

          {/* 2. Nhà cung cấp */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">2. Nhà cung cấp</span>
            <span className="font-semibold text-slate-800 block truncate" title={batch.supplier}>
              {batch.supplier}
            </span>
          </div>

          {/* 3. Ngày nhập */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">3. Ngày nhập kho</span>
            <span className="font-semibold text-slate-800 block">
              {formatDateVN(batch.importDate)}
            </span>
          </div>

          {/* 4. Mã hóa đơn */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">4. Mã hóa đơn</span>
            {batch.hasInvoice && batch.invoiceNumber ? (
              <span className="font-mono font-bold text-emerald-800 block">
                {batch.invoiceNumber}
              </span>
            ) : (
              <span className="text-amber-700 italic font-medium block">
                Chưa có hóa đơn
              </span>
            )}
          </div>

          {/* 5. Ngày lập hóa đơn */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">5. Ngày lập hóa đơn</span>
            <span className="font-semibold text-slate-800 block">
              {invoice?.invoiceDate ? formatDateVN(invoice.invoiceDate) : '—'}
            </span>
          </div>

          {/* 6. Trạng thái */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">6. Trạng thái</span>
            <span className="font-semibold block">
              {batch.hasInvoice ? (
                <span className="text-emerald-700">Đã lưu hợp lệ</span>
              ) : (
                <span className="text-amber-700">Chờ bổ sung</span>
              )}
            </span>
          </div>

          {/* 7. Ghi chú */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
            <span className="text-slate-400 font-medium block mb-1">7. Ghi chú lô / Bảo quản</span>
            <span className="text-slate-600 block line-clamp-2">
              {batch.notes || 'Không có ghi chú thêm.'}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CASE A: LÔ CHƯA CÓ HÓA ĐƠN                              */}
      {/* ======================================================== */}
      {!batch.hasInvoice ? (
        <div className="bg-amber-50/70 rounded-3xl p-8 border-2 border-dashed border-amber-300 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Receipt size={28} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-amber-900">
              Lô thuốc này chưa có hóa đơn nhập hàng
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
              Để quản lý danh sách từng loại thuốc, tính thành tiền và cộng chi phí phát sinh (vận chuyển, bốc dỡ), vui lòng tạo hóa đơn cho lô.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenCreateInvoice(batch)}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors inline-flex items-center gap-2"
          >
            <FilePlus size={18} strokeWidth={2.5} />
            <span>+ Tạo hóa đơn ngay</span>
          </button>
        </div>
      ) : (
        /* ======================================================== */
        /* CASE B: LÔ ĐÃ CÓ HÓA ĐƠN                                 */
        /* ======================================================== */
        <div className="space-y-6">
          {/* ======================================================== */}
          {/* PHẦN 4: BẢNG TỔNG KẾT TIỀN (NỔI BẬT NỀN XANH MINT NHẠT)   */}
          {/* ======================================================== */}
          <div className="bg-[#ebf8f2] rounded-3xl p-6 sm:p-7 border-2 border-emerald-300/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/70 pb-3">
              <div className="flex items-center gap-2 text-emerald-950">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Receipt size={16} />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                  Bảng tổng kết tài chính lô thuốc
                </h3>
              </div>
              <span className="text-xs text-emerald-800 font-semibold bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                Hóa đơn: {batch.invoiceNumber}
              </span>
            </div>

            {/* Side-by-side on laptop, separate cards on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Tổng tiền hóa đơn trước chi phí */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      1. Tiền hàng trước chi phí
                    </span>
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    = Tổng thành tiền tất cả {items.length} loại thuốc trên hóa đơn gốc
                  </p>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-slate-800 block">
                    {formatVND(batch.preExpenseTotal)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                    Gốc từ NCC {batch.supplier.split('(')[0]}
                  </span>
                </div>
              </div>

              {/* Card 2: Tổng chi phí phát sinh */}
              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      2. Tổng chi phí phát sinh
                    </span>
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    = Vận chuyển, bốc dỡ, lưu kho lạnh ngoài hóa đơn
                  </p>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-amber-800 block">
                    + {formatVND(batch.expensesTotal)}
                  </span>
                  <span className="text-[10px] text-amber-700 block mt-1 font-medium">
                    {expenses.length > 0
                      ? `${expenses.length} khoản chi phí được cộng thêm`
                      : 'Không có chi phí phát sinh (0 ₫)'}
                  </span>
                </div>
              </div>

              {/* Card 3: Tổng tiền sau chi phí */}
              <div className="bg-emerald-800 text-white p-5 rounded-2xl border border-emerald-900 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                      3. Tổng tiền sau chi phí
                    </span>
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-emerald-100 text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 mb-2">
                    = Tiền hàng gốc (1) + Tổng phụ phí (2)
                  </p>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-white block">
                    {formatVND(batch.postExpenseTotal)}
                  </span>
                  <span className="text-[11px] text-emerald-300 block mt-1 font-medium">
                    Giá vốn thực tế nhập kho Dược
                  </span>
                </div>
              </div>
            </div>

            {/* Differentiating disclaimer note */}
            <div className="p-3.5 bg-emerald-100/60 rounded-xl border border-emerald-200/70 text-xs text-emerald-950 flex items-start gap-2.5">
              <Info size={17} className="text-emerald-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                <strong>Quy tắc kế toán đối soát:</strong> Phân biệt rõ số tiền{' '}
                <strong>{formatVND(batch.preExpenseTotal)}</strong> ghi nhận trên hóa đơn bán hàng gốc của nhà cung cấp với tổng giá trị thực tế{' '}
                <strong>{formatVND(batch.postExpenseTotal)}</strong> sau khi cộng các chi phí phụ thu (vận chuyển, bốc xếp). Chi phí phát sinh không tự động xuất hiện trên hóa đơn gốc.
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PHẦN 2: DANH SÁCH THUỐC TRONG HÓA ĐƠN                   */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-emerald-600" />
                  <span>Danh sách thuốc thuộc hóa đơn</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thành tiền mỗi loại thuốc = Số lượng × Đơn giá. Có {items.length} loại thuốc.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddItem}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>+ Thêm thuốc</span>
              </button>
            </div>

            {/* Medicines Table (Desktop) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/70">
                    <th className="py-3 px-3 text-center w-12">STT</th>
                    <th className="py-3 px-4">Tên thuốc</th>
                    <th className="py-3 px-4">Hàm lượng / Quy cách</th>
                    <th className="py-3 px-3 text-center">ĐVT</th>
                    <th className="py-3 px-3 text-right">Số lượng</th>
                    <th className="py-3 px-4 text-right">Đơn giá</th>
                    <th className="py-3 px-4 text-right">Thành tiền</th>
                    <th className="py-3 px-3 text-center w-20">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 text-sm block">
                          {item.medicineName}
                        </span>
                        {item.notes && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {item.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.specification || '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-medium">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                          {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-800">
                        {item.quantity.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {formatVND(item.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-800 text-sm">
                        {formatVND(item.amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenEditItem(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Sửa dòng thuốc"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa dòng thuốc"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <td colSpan={6} className="py-3.5 px-4 text-right text-slate-700 text-xs">
                      Tổng tiền hàng trước chi phí (Tổng thành tiền):
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-900 text-sm font-black">
                      {formatVND(batch.preExpenseTotal)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Medicines Cards (Mobile) */}
            <div className="block sm:hidden space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        STT {index + 1}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {item.medicineName}
                      </h4>
                      <p className="text-slate-500 text-[11px]">
                        {item.specification || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditItem(item)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Số lượng:</span>
                      <span className="font-semibold text-slate-800">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Đơn giá:</span>
                      <span className="font-semibold text-slate-800">
                        {formatVND(item.unitPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="font-medium text-slate-500">Thành tiền:</span>
                    <span className="font-black text-emerald-800 text-sm">
                      {formatVND(item.amount)}
                    </span>
                  </div>
                </div>
              ))}

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Tổng tiền thuốc:</span>
                <span className="font-black text-emerald-900 text-sm">
                  {formatVND(batch.preExpenseTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PHẦN 3: CHI PHÍ PHÁT SINH                                */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <DollarSign size={18} className="text-amber-600" />
                  <span>Chi phí phát sinh ngoài hóa đơn</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phí vận chuyển xe lạnh, bốc xếp, lưu kho... Có {expenses.length} khoản phụ phí.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddExpense}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>+ Thêm chi phí</span>
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-600">
                  Lô thuốc này không có chi phí phát sinh
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Khi không có chi phí phát sinh, tổng tiền sau chi phí sẽ bằng chính xác tổng tiền trên hóa đơn gốc.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {expenses.map((exp, index) => (
                  <div
                    key={exp.id}
                    className="p-4 bg-amber-50/30 rounded-2xl border border-amber-200/80 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">
                          #{index + 1}
                        </span>
                        <Tag size={13} className="text-amber-600" />
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800">
                          {exp.expenseName}
                        </h4>
                      </div>
                      <div className="text-base font-extrabold text-amber-800">
                        {formatVND(exp.amount)}
                      </div>
                      {exp.notes && (
                        <p className="text-[11px] text-slate-500">{exp.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditExpense(exp)}
                        className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Sửa chi phí"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Xóa chi phí"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Invoice Trigger Button */}
          <div className="pt-2 flex justify-end print:hidden">
            <button
              type="button"
              onClick={() => invoice?.id && onDeleteInvoice(invoice.id)}
              className="text-xs text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1.5 font-medium"
            >
              <Trash2 size={14} />
              <span>Hủy hóa đơn này (Chuyển lô về trạng thái Chưa có hóa đơn)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
