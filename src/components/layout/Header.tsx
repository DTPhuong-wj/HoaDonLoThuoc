import React from 'react';
import { Menu, Plus, Search, Calendar, Database } from 'lucide-react';
import type { NavTab } from './Sidebar';
import { formatDateVN, getTodayDateString } from '../../utils/formatters';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onOpenCreateBatch: () => void;
  onQuickSearch: () => void;
  selectedBatchNumber?: string;
  isDetailView?: boolean;
  onBackFromDetail?: () => void;
  dbStatus?: {
    connected: boolean;
    database?: string;
    message?: string;
  };
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenCreateBatch,
  onQuickSearch,
  selectedBatchNumber,
  isDetailView,
  onBackFromDetail,
  dbStatus,
}) => {
  const getTabTitle = () => {
    if (isDetailView && selectedBatchNumber) {
      return `Chi tiết Lô thuốc: ${selectedBatchNumber}`;
    }
    switch (currentTab) {
      case 'overview':
        return 'Tổng quan hóa đơn';
      case 'search':
        return 'Tra cứu lô thuốc & hóa đơn';
      case 'batches':
        return 'Danh sách lô thuốc';
      case 'invoices':
        return 'Quản lý hóa đơn nhập hàng';
      case 'expenses':
        return 'Thống kê chi phí nhập hàng';
      default:
        return 'Hệ thống Quản lý Dược';
    }
  };

  const todayStr = formatDateVN(getTodayDateString());

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-emerald-100/80 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden"
          aria-label="Mở menu"
        >
          <Menu size={22} />
        </button>

        <div>
          {isDetailView && onBackFromDetail ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={onBackFromDetail}
                className="hover:text-emerald-700 hover:underline"
              >
                Danh sách lô thuốc
              </button>
              <span>/</span>
              <span className="text-slate-800 font-semibold">{selectedBatchNumber}</span>
            </div>
          ) : null}
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight truncate">
            {getTabTitle()}
          </h1>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Database connection status pill */}
        {dbStatus && (
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              dbStatus.connected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
            title={dbStatus.message}
          >
            <Database size={13} className={dbStatus.connected ? 'text-emerald-600' : 'text-amber-600'} />
            <span className="truncate max-w-[130px]">
              {dbStatus.connected ? `MySQL: ${dbStatus.database || 'HoaDonLoThuoc'}` : 'Chưa kết nối MySQL'}
            </span>
          </div>
        )}

        {/* Date pill (hidden on small screens) */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs font-medium text-emerald-800">
          <Calendar size={14} className="text-emerald-600" />
          <span>{todayStr}</span>
        </div>

        {/* Quick Search Shortcut */}
        {currentTab !== 'search' && (
          <button
            type="button"
            onClick={onQuickSearch}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-colors"
          >
            <Search size={16} className="text-slate-400" />
            <span className="hidden sm:inline">Tra cứu</span>
          </button>
        )}

        {/* Add Batch Button */}
        <button
          type="button"
          onClick={onOpenCreateBatch}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Thêm lô thuốc</span>
        </button>
      </div>
    </header>
  );
};
