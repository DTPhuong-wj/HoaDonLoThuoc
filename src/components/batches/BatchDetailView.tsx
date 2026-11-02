import React from 'react';
import {
  ArrowLeft,
  Package,
  Edit2,
  Trash2,
  Calendar,
  Printer,
  Clock,
} from 'lucide-react';
import type { Batch } from '../../types/pharmacy';
import { LabelColorBadge } from '../common/StatusBadge';
import { formatDateVN } from '../../utils/formatters';

interface BatchDetailViewProps {
  batch: Batch;
  onBack: () => void;
  onEditBatch: (batch: Batch) => void;
  onDeleteBatch: (batch: Batch) => void;
}

export const BatchDetailView: React.FC<BatchDetailViewProps> = ({
  batch,
  onBack,
  onEditBatch,
  onDeleteBatch,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 print:p-0">
      {/* Top Back & Action Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-800 transition-colors self-start"
        >
          <ArrowLeft size={16} />
          <span>Quay lại danh sách lô</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer size={15} />
            <span>In thông tin</span>
          </button>

          <button
            type="button"
            onClick={() => onEditBatch(batch)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Edit2 size={15} />
            <span>Sửa thông tin</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteBatch(batch)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Trash2 size={15} />
            <span>Xóa lô này</span>
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Package size={28} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Chi tiết Lô
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-mono">
                {batch.batchNumber}
              </h2>
            </div>
          </div>

          <div>
            <LabelColorBadge color={batch.labelColor} size="lg" />
          </div>
        </div>

        {/* 4 trường thông tin chuẩn theo yêu cầu: lô thuốc, tên thuốc, nhãn, ngày nhập */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              1. Lô
            </div>
            <div className="text-base font-extrabold text-slate-800 font-mono">
              {batch.batchNumber}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              2. Tên thuốc
            </div>
            <div className="text-base font-bold text-slate-900">
              {batch.batchName}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              3. Nhãn
            </div>
            <div className="pt-1">
              <LabelColorBadge color={batch.labelColor} size="md" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              4. Ngày nhập
            </div>
            <div className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              <span>{formatDateVN(batch.importDate)}</span>
            </div>
          </div>
        </div>

        {/* Thời gian tạo */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>Ngày ghi nhận: {new Date(batch.createdAt).toLocaleString('vi-VN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
