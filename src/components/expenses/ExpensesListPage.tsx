import React, { useState } from 'react';
import {
  DollarSign,
  Truck,
  Box,
  Thermometer,
  ShieldCheck,
  Tag,
  ArrowRight,
  Search,
} from 'lucide-react';
import type { BatchWithInvoice, ExpenseCategory } from '../../types/pharmacy';
import { formatVND, formatDateVN } from '../../utils/formatters';

interface ExpensesListPageProps {
  batchesWithInvoices: BatchWithInvoice[];
  onSelectBatch: (batchId: string) => void;
}

const CATEGORY_MAP: Record<ExpenseCategory, { label: string; icon: any; color: string; bg: string }> = {
  shipping: {
    label: 'Vận chuyển',
    icon: Truck,
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
  },
  handling: {
    label: 'Bốc xếp / Bốc dỡ',
    icon: Box,
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
  },
  storage: {
    label: 'Bảo quản nhiệt độ',
    icon: Thermometer,
    color: 'text-cyan-700',
    bg: 'bg-cyan-50 border-cyan-200',
  },
  inspection: {
    label: 'Kiểm nghiệm / COA',
    icon: ShieldCheck,
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
  },
  other: {
    label: 'Phụ phí khác',
    icon: Tag,
    color: 'text-slate-700',
    bg: 'bg-slate-50 border-slate-200',
  },
};

export const ExpensesListPage: React.FC<ExpensesListPageProps> = ({
  batchesWithInvoices,
  onSelectBatch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Flatten all expenses across all batches
  interface FlattenedExpense {
    id: string;
    expenseName: string;
    category: ExpenseCategory;
    amount: number;
    notes?: string;
    batchId: string;
    batchNumber: string;
    batchName: string;
    supplier: string;
    importDate: string;
    invoiceNumber: string;
  }

  const allExpenses: FlattenedExpense[] = [];
  let totalGoodsAmount = 0;
  let totalExpensesAmount = 0;

  batchesWithInvoices.forEach((b) => {
    if (b.hasInvoice && b.invoice) {
      totalGoodsAmount += b.preExpenseTotal;
      totalExpensesAmount += b.expensesTotal;

      (b.invoice.expenses || []).forEach((exp) => {
        allExpenses.push({
          ...exp,
          batchId: b.id,
          batchNumber: b.batchNumber,
          batchName: b.batchName,
          supplier: b.supplier,
          importDate: b.importDate,
          invoiceNumber: b.invoiceNumber || '—',
        });
      });
    }
  });

  // Calculate totals by category
  const categoryTotals: Record<string, number> = {
    shipping: 0,
    handling: 0,
    storage: 0,
    inspection: 0,
    other: 0,
  };

  allExpenses.forEach((exp) => {
    const cat = exp.category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
  });

  // Filtered list
  const filteredExpenses = allExpenses.filter((exp) => {
    if (selectedCategory !== 'all' && exp.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = exp.expenseName.toLowerCase().includes(q);
      const matchBatch = exp.batchNumber.toLowerCase().includes(q);
      const matchSup = exp.supplier.toLowerCase().includes(q);
      const matchNotes = exp.notes?.toLowerCase().includes(q);
      return matchName || matchBatch || matchSup || matchNotes;
    }
    return true;
  });

  const expenseRatio =
    totalGoodsAmount > 0 ? ((totalExpensesAmount / totalGoodsAmount) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <DollarSign size={22} className="text-amber-600" />
          <span>Thống kê Chi phí Nhập hàng Phát sinh</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi các khoản phụ phí vận chuyển, bốc xếp và bảo quản cấu thành nên giá vốn thực tế
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">
            Tổng giá trị hàng gốc (Trước CP)
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 block">
            {formatVND(totalGoodsAmount)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Cộng từ các hóa đơn đã lập
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <span className="text-xs font-semibold text-amber-800 uppercase block mb-1">
            Tổng chi phí phát sinh ngoài HĐ
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-800 block">
            +{formatVND(totalExpensesAmount)}
          </span>
          <span className="text-[11px] text-amber-700 block mt-1 font-medium">
            Tương đương ~{expenseRatio}% giá trị hàng
          </span>
        </div>

        <div className="bg-emerald-800 text-white p-5 rounded-2xl border border-emerald-900 shadow-xs">
          <span className="text-xs font-semibold text-emerald-200 uppercase block mb-1">
            Tổng chi phí thực tế (Sau CP)
          </span>
          <span className="text-xl sm:text-2xl font-black text-white block">
            {formatVND(totalGoodsAmount + totalExpensesAmount)}
          </span>
          <span className="text-[11px] text-emerald-300 block mt-1">
            Tổng giá vốn nhập kho thực tế
          </span>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700">
          Phân loại chi phí phát sinh
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.keys(CATEGORY_MAP) as ExpenseCategory[]).map((cat) => {
            const info = CATEGORY_MAP[cat];
            const Icon = info.icon;
            const amount = categoryTotals[cat] || 0;
            const isSelected = selectedCategory === cat;

            return (
              <div
                key={cat}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 bg-white shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg border ${info.bg} ${info.color}`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 truncate">
                    {info.label}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-extrabold text-slate-800">
                  {formatVND(amount)}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isSelected ? '✓ Đang lọc' : 'Nhấp để lọc'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={17} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên chi phí, số lô, nhà cung cấp..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-colors"
          />
        </div>
        {selectedCategory !== 'all' && (
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors shrink-0"
          >
            Bỏ lọc danh mục
          </button>
        )}
      </div>

      {/* Itemized Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <DollarSign size={40} className="mx-auto text-slate-300" />
          <h4 className="text-base font-bold text-slate-700">
            Không có khoản chi phí nào
          </h4>
          <p className="text-xs text-slate-400">
            Chưa có khoản chi phí phát sinh nào phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80 uppercase text-[11px]">
                  <th className="py-3.5 px-3 text-center w-12">STT</th>
                  <th className="py-3.5 px-4">Khoản chi phí</th>
                  <th className="py-3.5 px-4">Danh mục</th>
                  <th className="py-3.5 px-4">Số lô liên kết</th>
                  <th className="py-3.5 px-4">Nhà cung cấp</th>
                  <th className="py-3.5 px-4">Ngày nhập</th>
                  <th className="py-3.5 px-4 text-right">Số tiền</th>
                  <th className="py-3.5 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredExpenses.map((exp, index) => {
                  const catInfo = CATEGORY_MAP[exp.category] || CATEGORY_MAP.other;
                  const Icon = catInfo.icon;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3 text-center font-semibold text-slate-500 whitespace-nowrap">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 text-xs block">
                          {exp.expenseName}
                        </span>
                        {exp.notes && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {exp.notes}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${catInfo.bg} ${catInfo.color}`}
                        >
                          <Icon size={12} />
                          <span>{catInfo.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-800">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                          {exp.batchNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-[160px] truncate" title={exp.supplier}>
                        {exp.supplier}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {formatDateVN(exp.importDate)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-amber-800 whitespace-nowrap text-sm">
                        +{formatVND(exp.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectBatch(exp.batchId)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors inline-flex items-center gap-1"
                        >
                          <span>Xem lô</span>
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
