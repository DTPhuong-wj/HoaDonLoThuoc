import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import type { NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewPage } from './components/overview/OverviewPage';
import { BatchSearchPage } from './components/search/BatchSearchPage';
import { BatchesListPage } from './components/batches/BatchesListPage';
import { BatchDetailView } from './components/batches/BatchDetailView';
import { InvoicesListPage } from './components/invoices/InvoicesListPage';
import { ExpensesListPage } from './components/expenses/ExpensesListPage';
import { BatchFormModal } from './components/modals/BatchFormModal';
import { InvoiceFormModal } from './components/modals/InvoiceFormModal';
import { ItemFormModal } from './components/modals/ItemFormModal';
import { ExpenseFormModal } from './components/modals/ExpenseFormModal';
import { ConfirmDeleteModal } from './components/common/ConfirmDeleteModal';
import { ToastProvider, useToast } from './components/common/Toast';
import { apiService } from './services/apiService';
import type { Batch, BatchWithInvoice, Invoice, InvoiceItem, ExpenseItem, BatchStatistics } from './types/pharmacy';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const INITIAL_STATS: BatchStatistics = {
  totalBatches: 0,
  withInvoiceCount: 0,
  withoutInvoiceCount: 0,
  totalLandedExpense: 0,
  totalPreExpense: 0,
  totalExpenses: 0,
};

const MainAppContent: React.FC = () => {
  const { showToast } = useToast();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');

  // Layout State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Data State
  const [batchesWithInvoices, setBatchesWithInvoices] = useState<BatchWithInvoice[]>([]);
  const [stats, setStats] = useState<BatchStatistics>(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; database?: string; message?: string }>({
    connected: false,
    message: 'Đang kiểm tra kết nối MySQL...',
  });

  // Reload data from backend MySQL API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const health = await apiService.checkHealth();
      setDbStatus(health);

      if (health.connected) {
        const [batchesData, statsData] = await Promise.all([
          apiService.getBatches(),
          apiService.getStatistics(),
        ]);
        setBatchesWithInvoices(batchesData);
        setStats(statsData);
      } else {
        setBatchesWithInvoices([]);
        setStats(INITIAL_STATS);
      }
    } catch (err: any) {
      setDbStatus({ connected: false, message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Tự động kiểm tra lại trạng thái định kỳ mỗi 15 giây
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Currently viewed batch detail (if any)
  const selectedBatch = selectedBatchId
    ? batchesWithInvoices.find((b) => b.id === selectedBatchId)
    : null;

  // Modals State
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<Batch | null>(null);
  const [initialBatchNumber, setInitialBatchNumber] = useState('');

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [batchForInvoice, setBatchForInvoice] = useState<Batch | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InvoiceItem | null>(null);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseItem | null>(null);

  // Confirmation Delete Modal State
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    itemName: '',
    onConfirm: () => {},
  });

  // ==========================================
  // Navigation Handlers
  // ==========================================
  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    setSelectedBatchId(null);
  };

  const handleSelectBatch = (batchId: string) => {
    setSelectedBatchId(batchId);
  };

  const handleBackFromDetail = () => {
    setSelectedBatchId(null);
  };

  const handleNavigateToSearch = (query = '') => {
    setSearchInitialQuery(query);
    setCurrentTab('search');
    setSelectedBatchId(null);
  };

  // ==========================================
  // Batch Operations (Lưu trực tiếp vào MySQL)
  // ==========================================
  const handleOpenCreateBatch = (prefilledNumber = '') => {
    setBatchToEdit(null);
    setInitialBatchNumber(prefilledNumber);
    setBatchModalOpen(true);
  };

  const handleOpenEditBatch = (batch: BatchWithInvoice) => {
    setBatchToEdit(batch);
    setInitialBatchNumber('');
    setBatchModalOpen(true);
  };

  const handleSaveBatch = async (data: {
    batchNumber: string;
    batchName: string;
    supplier: string;
    importDate: string;
    notes?: string;
    createInvoiceImmediately?: boolean;
  }) => {
    try {
      if (batchToEdit) {
        const res = await apiService.updateBatch(batchToEdit.id, data);
        showToast(res.message, 'success');
        setBatchModalOpen(false);
        await loadData();
      } else {
        const res = await apiService.createBatch(data);
        showToast(res.message, 'success');
        setBatchModalOpen(false);
        await loadData();
        if (data.createInvoiceImmediately && res.batch) {
          handleOpenCreateInvoice(res.batch as BatchWithInvoice);
        } else if (res.batch) {
          setSelectedBatchId(res.batch.id);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu lô thuốc vào MySQL.', 'error');
    }
  };

  const handleDeleteBatchPrompt = (batch: BatchWithInvoice) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Xác nhận xóa Lô thuốc khỏi MySQL',
      message: `Bạn có chắc chắn muốn xóa lô thuốc này khỏi database? Nếu lô đã có hóa đơn, toàn bộ thuốc và chi phí liên quan cũng sẽ bị xóa vĩnh viễn.`,
      itemName: `Số lô: ${batch.batchNumber} — ${batch.batchName}`,
      onConfirm: async () => {
        try {
          const res = await apiService.deleteBatch(batch.id);
          showToast(res.message, 'success');
          if (selectedBatchId === batch.id) {
            setSelectedBatchId(null);
          }
          await loadData();
        } catch (err: any) {
          showToast(err.message || 'Lỗi khi xóa lô thuốc trên MySQL.', 'error');
        }
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // ==========================================
  // Invoice Operations (Lưu trực tiếp vào MySQL)
  // ==========================================
  const handleOpenCreateInvoice = (batch: Batch) => {
    setBatchForInvoice(batch);
    setInvoiceToEdit(null);
    setInvoiceModalOpen(true);
  };

  const handleSaveInvoice = async (data: {
    batchId: string;
    invoiceNumber: string;
    invoiceDate: string;
    items: InvoiceItem[];
    expenses: ExpenseItem[];
    notes?: string;
  }) => {
    try {
      const res = await apiService.saveInvoice(data);
      showToast(res.message, 'success');
      setInvoiceModalOpen(false);
      setSelectedBatchId(data.batchId);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu hóa đơn vào MySQL.', 'error');
    }
  };

  const handleDeleteInvoicePrompt = (invoiceId: string) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Hủy bỏ Hóa đơn trong MySQL',
      message: 'Bạn có chắc chắn muốn xóa hóa đơn này khỏi database? Lô thuốc liên kết sẽ được đưa về trạng thái "Chưa có hóa đơn".',
      itemName: `Mã hóa đơn ID: ${invoiceId}`,
      onConfirm: async () => {
        try {
          const res = await apiService.deleteInvoice(invoiceId);
          showToast(res.message, 'info');
          await loadData();
        } catch (err: any) {
          showToast(err.message || 'Lỗi khi hủy hóa đơn.', 'error');
        }
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // ==========================================
  // Inline Medicine Item Operations (in Detail)
  // ==========================================
  const handleOpenAddItem = () => {
    setItemToEdit(null);
    setItemModalOpen(true);
  };

  const handleOpenEditItem = (item: InvoiceItem) => {
    setItemToEdit(item);
    setItemModalOpen(true);
  };

  const handleSaveItem = async (data: Omit<InvoiceItem, 'id' | 'amount'> & { id?: string }) => {
    if (!selectedBatchId) return;
    try {
      const res = await apiService.upsertInvoiceItem(selectedBatchId, data);
      showToast(res.message, 'success');
      setItemModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu loại thuốc vào MySQL.', 'error');
    }
  };

  const handleDeleteItemPrompt = (itemId: string) => {
    if (!selectedBatchId) return;
    setDeleteModalConfig({
      isOpen: true,
      title: 'Xóa loại thuốc khỏi MySQL',
      message: 'Xác nhận xóa loại thuốc này khỏi database? Tổng tiền hóa đơn sẽ được tự động tính toán lại.',
      itemName: `Mã dòng thuốc: ${itemId}`,
      onConfirm: async () => {
        try {
          const res = await apiService.deleteInvoiceItem(itemId);
          showToast(res.message, 'info');
          await loadData();
        } catch (err: any) {
          showToast(err.message || 'Lỗi khi xóa loại thuốc.', 'error');
        }
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // ==========================================
  // Inline Expense Item Operations (in Detail)
  // ==========================================
  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: ExpenseItem) => {
    setExpenseToEdit(expense);
    setExpenseModalOpen(true);
  };

  const handleSaveExpense = async (data: Omit<ExpenseItem, 'id'> & { id?: string }) => {
    if (!selectedBatchId) return;
    try {
      const res = await apiService.upsertExpenseItem(selectedBatchId, data);
      showToast(res.message, 'success');
      setExpenseModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu khoản chi phí vào MySQL.', 'error');
    }
  };

  const handleDeleteExpensePrompt = (expenseId: string) => {
    if (!selectedBatchId) return;
    setDeleteModalConfig({
      isOpen: true,
      title: 'Xóa khoản chi phí phát sinh trong MySQL',
      message: 'Xác nhận xóa khoản chi phí này? Tổng tiền sau chi phí sẽ được trừ lại tự động.',
      itemName: `Mã chi phí: ${expenseId}`,
      onConfirm: async () => {
        try {
          const res = await apiService.deleteExpenseItem(expenseId);
          showToast(res.message, 'info');
          await loadData();
        } catch (err: any) {
          showToast(err.message || 'Lỗi khi xóa chi phí.', 'error');
        }
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Khôi phục bộ dữ liệu mẫu (Gọi API nạp lại nếu cần)
  const handleResetDemoPrompt = () => {
    showToast('Dữ liệu đang được quản lý trực tiếp trên MySQL Server `HoaDonLoThuoc`.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#f6fbf8] flex text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        onResetDemo={handleResetDemoPrompt}
        stats={{
          totalBatches: stats.totalBatches,
          withoutInvoiceCount: stats.withoutInvoiceCount,
        }}
      />

      {/* Main Layout Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          onOpenCreateBatch={() => handleOpenCreateBatch()}
          onQuickSearch={() => handleNavigateToSearch()}
          selectedBatchNumber={selectedBatch?.batchNumber}
          isDetailView={!!selectedBatch}
          onBackFromDetail={handleBackFromDetail}
          dbStatus={dbStatus}
        />

        {/* Cảnh báo nếu chưa kết nối được MySQL */}
        {!dbStatus.connected && (
          <div className="m-4 sm:m-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="text-xs sm:text-sm">
                <p className="font-bold">Chưa kết nối được với MySQL Database `HoaDonLoThuoc`</p>
                <p className="text-amber-700 mt-0.5">
                  Vui lòng đảm bảo: 1) Đã tạo file <code className="font-mono bg-amber-100 px-1 rounded">.env</code> (từ file <code className="font-mono bg-amber-100 px-1 rounded">.env.example</code>) có đúng mật khẩu MySQL, và 2) Đang chạy server: <code className="font-mono bg-amber-100 px-1 rounded">npm run server</code>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Thử kết nối lại</span>
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {isLoading && batchesWithInvoices.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw size={32} className="mx-auto text-emerald-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-700">Đang đọc dữ liệu từ MySQL Database HoaDonLoThuoc...</p>
            </div>
          ) : selectedBatch ? (
            /* View 1: Batch & Invoice Detail */
            <BatchDetailView
              batch={selectedBatch}
              onBack={handleBackFromDetail}
              onEditBatch={handleOpenEditBatch}
              onDeleteBatch={handleDeleteBatchPrompt}
              onOpenCreateInvoice={handleOpenCreateInvoice}
              onDeleteInvoice={handleDeleteInvoicePrompt}
              onOpenAddItem={handleOpenAddItem}
              onOpenEditItem={handleOpenEditItem}
              onDeleteItem={handleDeleteItemPrompt}
              onOpenAddExpense={handleOpenAddExpense}
              onOpenEditExpense={handleOpenEditExpense}
              onDeleteExpense={handleDeleteExpensePrompt}
            />
          ) : currentTab === 'overview' ? (
            /* View 2: Dashboard Overview */
            <OverviewPage
              stats={stats}
              recentBatches={batchesWithInvoices.slice(0, 5)}
              onSelectBatch={handleSelectBatch}
              onNavigateSearch={() => handleNavigateToSearch()}
              onNavigateBatches={() => setCurrentTab('batches')}
              onOpenCreateBatch={() => handleOpenCreateBatch()}
              onOpenCreateInvoice={handleOpenCreateInvoice}
            />
          ) : currentTab === 'search' ? (
            /* View 3: Batch Search (Lookup) */
            <BatchSearchPage
              initialQuery={searchInitialQuery}
              onSearch={async (q) => {
                try {
                  return await apiService.searchBatches(q);
                } catch {
                  return [];
                }
              }}
              onSelectBatch={handleSelectBatch}
              onOpenCreateBatchWithNumber={(num) => handleOpenCreateBatch(num)}
              onOpenCreateInvoice={handleOpenCreateInvoice}
              allBatches={batchesWithInvoices}
            />
          ) : currentTab === 'batches' ? (
            /* View 4: Batches List */
            <BatchesListPage
              batches={batchesWithInvoices}
              onSelectBatch={handleSelectBatch}
              onEditBatch={handleOpenEditBatch}
              onDeleteBatch={handleDeleteBatchPrompt}
              onOpenCreateInvoice={handleOpenCreateInvoice}
              onOpenCreateBatch={() => handleOpenCreateBatch()}
            />
          ) : currentTab === 'invoices' ? (
            /* View 5: Invoices List */
            <InvoicesListPage
              batchesWithInvoices={batchesWithInvoices}
              onSelectBatch={handleSelectBatch}
              onOpenCreateInvoiceForPendingBatch={() => {
                const firstPending = batchesWithInvoices.find((b) => !b.hasInvoice);
                if (firstPending) {
                  handleOpenCreateInvoice(firstPending);
                } else {
                  showToast('Tất cả các lô hiện tại đều đã có hóa đơn.', 'info');
                }
              }}
              onDeleteInvoice={handleDeleteInvoicePrompt}
            />
          ) : currentTab === 'expenses' ? (
            /* View 6: Expenses Breakdown */
            <ExpensesListPage
              batchesWithInvoices={batchesWithInvoices}
              onSelectBatch={handleSelectBatch}
            />
          ) : null}
        </main>
      </div>

      {/* ========================================== */}
      {/* MODALS                                     */}
      {/* ========================================== */}

      {/* Batch Create / Edit Modal */}
      <BatchFormModal
        isOpen={batchModalOpen}
        batchToEdit={batchToEdit}
        initialBatchNumber={initialBatchNumber}
        onSave={handleSaveBatch}
        onClose={() => setBatchModalOpen(false)}
      />

      {/* Invoice Create / Edit Modal */}
      <InvoiceFormModal
        isOpen={invoiceModalOpen}
        batch={batchForInvoice}
        invoiceToEdit={invoiceToEdit}
        onSave={handleSaveInvoice}
        onClose={() => setInvoiceModalOpen(false)}
      />

      {/* Medicine Line Item Modal */}
      <ItemFormModal
        isOpen={itemModalOpen}
        itemToEdit={itemToEdit}
        onSave={handleSaveItem}
        onClose={() => setItemModalOpen(false)}
      />

      {/* Expense Line Item Modal */}
      <ExpenseFormModal
        isOpen={expenseModalOpen}
        expenseToEdit={expenseToEdit}
        onSave={handleSaveExpense}
        onClose={() => setExpenseModalOpen(false)}
      />

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        title={deleteModalConfig.title}
        message={deleteModalConfig.message}
        itemName={deleteModalConfig.itemName}
        onConfirm={deleteModalConfig.onConfirm}
        onClose={() => setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}
