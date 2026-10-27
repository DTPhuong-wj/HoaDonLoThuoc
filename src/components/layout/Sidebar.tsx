import React from 'react';
import {
  LayoutDashboard,
  Search,
  Package,
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Pill,
  X,
  Building2,
} from 'lucide-react';

export type NavTab = 'overview' | 'search' | 'batches' | 'invoices' | 'expenses';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onResetDemo: () => void;
  stats: {
    totalBatches: number;
    withoutInvoiceCount: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
  onResetDemo,
  stats,
}) => {
  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Tổng quan',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'search' as NavTab,
      label: 'Tra cứu lô thuốc',
      icon: Search,
      badge: 'Chính',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'batches' as NavTab,
      label: 'Danh sách lô thuốc',
      icon: Package,
      badge: stats.totalBatches > 0 ? `${stats.totalBatches}` : null,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'invoices' as NavTab,
      label: 'Quản lý hóa đơn',
      icon: FileText,
      badge: stats.withoutInvoiceCount > 0 ? `${stats.withoutInvoiceCount} chưa có` : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'expenses' as NavTab,
      label: 'Chi phí nhập hàng',
      icon: DollarSign,
      badge: null,
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-emerald-100/80 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo & Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-50">
          <div
            className={`flex items-center gap-3 cursor-pointer ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
            onClick={() => handleNavClick('overview')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Pill size={22} className="rotate-45" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                  Mint<span className="text-emerald-600">Pharma</span>
                </span>
                <span className="text-[11px] text-slate-400 block -mt-0.5 font-medium truncate">
                  Quản lý lô & hóa đơn
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Chức năng
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs border border-emerald-200/60'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  size={20}
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Branch / Facility Info */}
        {!isCollapsed && (
          <div className="mx-3 mb-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/70 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-1">
              <Building2 size={15} />
              <span>Kho Dược Trung Tâm</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Chi nhánh Cần Thơ • Chuẩn GPP
            </p>
          </div>
        )}

        {/* User & Footer */}
        <div className="p-3 border-t border-emerald-50 bg-slate-50/60">
          <div
            className={`flex items-center gap-3 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-xs">
              NA
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  DS. Nguyễn Văn An
                </p>
                <p className="text-[11px] text-emerald-700 truncate font-medium">
                  Quản lý kho dược
                </p>
              </div>
            )}
          </div>

          {/* Reset Demo Data & Collapse Toggle */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={onResetDemo}
              title="Khôi phục lại dữ liệu mẫu ban đầu"
              className={`text-xs text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                isCollapsed ? 'w-full justify-center' : ''
              }`}
            >
              <RotateCcw size={14} />
              {!isCollapsed && <span>Dữ liệu mẫu</span>}
            </button>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
