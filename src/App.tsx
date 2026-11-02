import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { BatchesListPage } from './components/batches/BatchesListPage';
import { BatchDetailView } from './components/batches/BatchDetailView';
import { BatchFormModal } from './components/modals/BatchFormModal';
import { SheetLinkModal } from './components/modals/SheetLinkModal';
import { ConfirmDeleteModal } from './components/common/ConfirmDeleteModal';
import { ToastProvider, useToast } from './components/common/Toast';
import { storageService } from './services/storageService';
import type { Batch, LabelColor } from './types/pharmacy';

const MainAppContent: React.FC = () => {
  const { showToast } = useToast();

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isSheetConnected, setIsSheetConnected] = useState(storageService.isSheetConnected());

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<Batch | null>(null);
  const [sheetLinkModalOpen, setSheetLinkModalOpen] = useState(false);

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
    onConfirm: () => { },
  });

  const loadData = useCallback(() => {
    try {
      const batchesData = storageService.getBatches(false);
      setBatches(batchesData);
      setIsSheetConnected(storageService.isSheetConnected());
    } catch (err: any) {
      console.error('[App] Lỗi nạp dữ liệu:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    if (storageService.isSheetConnected()) {
      storageService.processSyncQueue().then(() => loadData());
    }
  }, [loadData]);

  const selectedBatch = selectedBatchId
    ? storageService.getBatchById(selectedBatchId) || batches.find((b) => b.id === selectedBatchId)
    : null;

  const handleOpenCreateBatch = () => {
    if (!storageService.isSheetConnected()) {
      setSheetLinkModalOpen(true);
      showToast('Vui lòng liên kết với Google Sheet trước khi thêm lô  .', 'info');
      return;
    }
    setBatchToEdit(null);
    setBatchModalOpen(true);
  };

  const handleOpenEditBatch = (batch: Batch) => {
    setBatchToEdit(batch);
    setBatchModalOpen(true);
  };

  const handleSaveBatch = async (data: {
    batchNumber: string;
    batchNames: string[];
    labelColor: LabelColor;
    importDate: string;
  }) => {
    try {
      if (batchToEdit) {
        await storageService.updateBatch(batchToEdit.id, {
          batchNumber: data.batchNumber,
          batchName: data.batchNames[0] || batchToEdit.batchName,
          labelColor: data.labelColor,
          importDate: data.importDate,
        });
        showToast('Đã cập nhật thông tin dòng   thành công!', 'success');
      } else {
        const res = await storageService.createBatches({
          batchNumber: data.batchNumber,
          batchNames: data.batchNames,
          labelColor: data.labelColor,
          importDate: data.importDate,
        });
        showToast(`Đã thêm ${res.count} tên   vào lô ${data.batchNumber} thành công!`, 'success');
      }

      setBatchModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu thông tin lô  ', 'error');
    }
  };

  const handleDeleteBatch = (batch: Batch) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Xác nhận xóa dòng  ',
      message: `Bạn có chắc chắn muốn xóa dòng   "${batch.batchName}" thuộc lô "${batch.batchNumber}"? (Dữ liệu trên Google Sheet được giữ nguyên)`,
      itemName: `${batch.batchNumber} - ${batch.batchName}`,
      onConfirm: async () => {
        // Tắt popup xác nhận xóa ngay lập tức
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await storageService.deleteBatch(batch.id);
          showToast(`Đã xóa "${batch.batchName}" thành công!`, 'success');
          if (selectedBatchId === batch.id) {
            setSelectedBatchId(null);
          }
          loadData();
        } catch (err: any) {
          showToast(err.message || 'Lỗi khi xóa dòng  ', 'error');
        }
      },
    });
  };

  const handleSheetLinkSuccess = (count: number) => {
    setIsSheetConnected(true);
    loadData();
    showToast(`Đã liên kết thành công với Google Sheet (${count} dòng  )!`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Header
        onOpenCreateBatch={handleOpenCreateBatch}
        onOpenSheetLink={() => setSheetLinkModalOpen(true)}
        isSheetConnected={isSheetConnected}
        selectedBatchNumber={selectedBatch?.batchNumber}
        isDetailView={Boolean(selectedBatch)}
        onBackFromDetail={() => setSelectedBatchId(null)}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {selectedBatch ? (
          <BatchDetailView
            batch={selectedBatch}
            onBack={() => setSelectedBatchId(null)}
            onEditBatch={handleOpenEditBatch}
            onDeleteBatch={handleDeleteBatch}
          />
        ) : (
          <BatchesListPage
            batches={batches}
            onSelectBatch={(id) => setSelectedBatchId(id)}
            onEditBatch={handleOpenEditBatch}
            onDeleteBatch={handleDeleteBatch}
            onOpenCreateBatch={handleOpenCreateBatch}
            onOpenSheetLink={() => setSheetLinkModalOpen(true)}
            isSheetConnected={isSheetConnected}
          />
        )}
      </main>

      <BatchFormModal
        isOpen={batchModalOpen}
        batchToEdit={batchToEdit}
        onSave={handleSaveBatch}
        onClose={() => setBatchModalOpen(false)}
      />

      <SheetLinkModal
        isOpen={sheetLinkModalOpen}
        onClose={() => setSheetLinkModalOpen(false)}
        onSuccess={handleSheetLinkSuccess}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        title={deleteModalConfig.title}
        message={deleteModalConfig.message}
        itemName={deleteModalConfig.itemName}
        onConfirm={deleteModalConfig.onConfirm}
        onClose={() => setDeleteModalConfig({ ...deleteModalConfig, isOpen: false })}
      />
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}

export default App;
