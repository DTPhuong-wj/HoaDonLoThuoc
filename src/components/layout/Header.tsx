import React from 'react';
import { Plus, Calendar, Pill, CheckCircle2, Link2 } from 'lucide-react';
import { formatDateVN, getTodayDateString } from '../../utils/formatters';

interface HeaderProps {
  onOpenCreateBatch: () => void;
  onOpenSheetLink: () => void;
  isSheetConnected: boolean;
  selectedBatchNumber?: string;
  isDetailView?: boolean;
  onBackFromDetail?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateBatch,
  onOpenSheetLink,
  isSheetConnected,
  selectedBatchNumber,
  isDetailView,
  onBackFromDetail,
}) => {
  const todayStr = formatDateVN(getTodayDateString());

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-emerald-100/80 px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <Pill size={22} className="rotate-45" />
        </div>
        <div>
          {isDetailView && onBackFromDetail ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={onBackFromDetail}
                className="hover:text-emerald-700 hover:underline font-medium"
              >
                Danh sách lô
              </button>
              <span>/</span>
              <span className="text-slate-800 font-bold">{selectedBatchNumber}</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                Mai Thanh
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                Quản lý Lô
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Nút Trạng thái / Liên kết Google Sheet */}
        <button
          type="button"
          onClick={onOpenSheetLink}
          title={isSheetConnected ? 'Đã liên kết với Google Sheet (bấm để xem hoặc đổi URL)' : 'Bấm để liên kết với Google Sheet'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${isSheetConnected
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 animate-pulse'
            }`}
        >
          {isSheetConnected ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span className="hidden sm:inline">Đã liên kết Sheet</span>
              <span className="sm:hidden">Đã kết nối</span>
            </>
          ) : (
            <>
              <Link2 size={14} className="text-amber-700" />
              <span>Liên kết Google Sheet</span>
            </>
          )}
        </button>

        {/* Current Date */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
          <Calendar size={14} className="text-slate-400" />
          <span>{todayStr}</span>
        </div>

        {/* Add Batch Button */}
        <button
          type="button"
          onClick={onOpenCreateBatch}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus size={16} />
          <span>Thêm lô  </span>
        </button>
      </div>
    </header>
  );
};
