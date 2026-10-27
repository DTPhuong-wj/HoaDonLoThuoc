import type { Batch, Invoice, BatchWithInvoice, BatchStatistics, InvoiceItem, ExpenseItem } from '../types/pharmacy';
import { calculateInvoiceTotals, generateUniqueId } from '../utils/formatters';

const STORAGE_KEYS = {
  BATCHES: 'mint_pharma_batches_v1',
  INVOICES: 'mint_pharma_invoices_v1',
};

// Dữ liệu mẫu khởi tạo mang tính thực tế ngành dược Việt Nam
const INITIAL_BATCHES: Batch[] = [
  {
    id: 'batch_dhg_01',
    batchNumber: 'LO-DHG-202601',
    batchName: 'Hapacol 650mg & Kháng sinh Klamentin',
    supplier: 'Dược Hậu Giang (DHG Pharma)',
    importDate: '2026-10-15',
    notes: 'Nhập kho lô bảo quản nhiệt độ thường dưới 30°C. Đã kiểm tra cảm quan đạt chuẩn.',
    hasInvoice: true,
    invoiceId: 'inv_dhg_01',
    invoiceNumber: 'HD-DHG-88219',
    createdAt: '2026-10-15T08:30:00Z',
    updatedAt: '2026-10-15T09:15:00Z',
  },
  {
    id: 'batch_sanofi_02',
    batchNumber: 'LO-SANOFI-202602',
    batchName: 'Nexium Mups 40mg & Dị ứng Telfast',
    supplier: 'Sanofi-Aventis Việt Nam',
    importDate: '2026-10-20',
    notes: 'Lô hàng kèm chứng chỉ CO/CQ chuẩn châu Âu. Yêu cầu vận chuyển thùng xốp lạnh.',
    hasInvoice: true,
    invoiceId: 'inv_sanofi_02',
    invoiceNumber: 'HD-SNF-9941',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T11:20:00Z',
  },
  {
    id: 'batch_imex_03',
    batchNumber: 'LO-IMEX-202603',
    batchName: 'Ceftriaxone 1g & Kháng sinh tiêm',
    supplier: 'Công ty CP Dược phẩm Imexpharm',
    importDate: '2026-10-24',
    notes: 'Hàng đã kiểm đếm đủ số lượng tại kho 2. Đang chờ kế toán nhà cung cấp gửi hóa đơn điện tử.',
    hasInvoice: false,
    createdAt: '2026-10-24T14:15:00Z',
    updatedAt: '2026-10-24T14:15:00Z',
  },
  {
    id: 'batch_traphaco_04',
    batchNumber: 'LO-TRAPHACO-202604',
    batchName: 'Boganic Forte & Hoạt huyết dưỡng não',
    supplier: 'Công ty Cổ phần Traphaco',
    importDate: '2026-10-25',
    notes: 'Đông dược thảo dược nguồn gốc GACP-WHO. Hợp đồng miễn phí toàn bộ vận chuyển.',
    hasInvoice: true,
    invoiceId: 'inv_trp_04',
    invoiceNumber: 'HD-TRP-4512',
    createdAt: '2026-10-25T09:00:00Z',
    updatedAt: '2026-10-25T09:45:00Z',
  },
  {
    id: 'batch_stella_05',
    batchNumber: 'LO-STELLA-202605',
    batchName: 'Amlodipine 5mg & Thuốc Tim Mạch',
    supplier: 'Công ty TNHH LD Stellapharm',
    importDate: '2026-10-26',
    notes: 'Hàng mới nhập sáng nay, 500 hộp Amlodipine nguyên đai nguyên kiện, chưa có hóa đơn tài chính.',
    hasInvoice: false,
    createdAt: '2026-10-26T08:00:00Z',
    updatedAt: '2026-10-26T08:00:00Z',
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_dhg_01',
    invoiceNumber: 'HD-DHG-88219',
    invoiceDate: '2026-10-15',
    batchId: 'batch_dhg_01',
    batchNumber: 'LO-DHG-202601',
    items: [
      {
        id: 'item_1_1',
        medicineName: 'Hapacol 650mg',
        specification: 'Hộp 10 vỉ x 10 viên',
        unit: 'Hộp',
        quantity: 200,
        unitPrice: 45000,
        amount: 9000000,
        notes: 'Hạ sốt, giảm đau nhanh',
      },
      {
        id: 'item_1_2',
        medicineName: 'Klamentin 500/125',
        specification: 'Hộp 2 vỉ x 7 viên',
        unit: 'Hộp',
        quantity: 150,
        unitPrice: 110000,
        amount: 16500000,
        notes: 'Kháng sinh Amoxicillin + Acid Clavulanic',
      },
      {
        id: 'item_1_3',
        medicineName: 'Bocalex C 1000mg',
        specification: 'Tuýp 10 viên sủi',
        unit: 'Tuýp',
        quantity: 100,
        unitPrice: 32000,
        amount: 3200000,
        notes: 'Vitamin C tăng cường sức đề kháng',
      },
    ],
    expenses: [
      {
        id: 'exp_1_1',
        expenseName: 'Phí vận chuyển xe lạnh liên tỉnh',
        category: 'shipping',
        amount: 250000,
        notes: 'Chuyến xe giao tận kho dược',
      },
      {
        id: 'exp_1_2',
        expenseName: 'Phí bốc xếp kho nhập hàng',
        category: 'handling',
        amount: 80000,
        notes: 'Công bốc xếp 3 nhân công',
      },
    ],
    preExpenseTotal: 28700000,
    expensesTotal: 330000,
    postExpenseTotal: 29030000,
    notes: 'Hóa đơn đã đối chiếu trùng khớp với số lượng thực nhập kho.',
    createdAt: '2026-10-15T09:15:00Z',
    updatedAt: '2026-10-15T09:15:00Z',
  },
  {
    id: 'inv_sanofi_02',
    invoiceNumber: 'HD-SNF-9941',
    invoiceDate: '2026-10-20',
    batchId: 'batch_sanofi_02',
    batchNumber: 'LO-SANOFI-202602',
    items: [
      {
        id: 'item_2_1',
        medicineName: 'Nexium Mups 40mg',
        specification: 'Hộp 2 vỉ x 7 viên',
        unit: 'Hộp',
        quantity: 120,
        unitPrice: 340000,
        amount: 40800000,
        notes: 'Esomeprazole chính hãng Astra/Sanofi',
      },
      {
        id: 'item_2_2',
        medicineName: 'Telfast HD 180mg',
        specification: 'Hộp 1 vỉ x 10 viên',
        unit: 'Hộp',
        quantity: 80,
        unitPrice: 105000,
        amount: 8400000,
        notes: 'Thuốc chống dị ứng Fexofenadine',
      },
      {
        id: 'item_2_3',
        medicineName: 'Magne-B6 Corbiere',
        specification: 'Hộp 5 vỉ x 10 viên',
        unit: 'Hộp',
        quantity: 150,
        unitPrice: 48000,
        amount: 7200000,
        notes: 'Khoáng chất Magnesi & Vitamin B6',
      },
    ],
    expenses: [
      {
        id: 'exp_2_1',
        expenseName: 'Phí bảo quản kho lạnh đặc biệt',
        category: 'storage',
        amount: 400000,
        notes: 'Lưu kho nhiệt độ 15-25°C độ ẩm <60%',
      },
      {
        id: 'exp_2_2',
        expenseName: 'Phí vận chuyển giao hàng nội thành',
        category: 'shipping',
        amount: 150000,
        notes: 'Xe tải thùng kín',
      },
    ],
    preExpenseTotal: 56400000,
    expensesTotal: 550000,
    postExpenseTotal: 56950000,
    notes: 'Đã hoàn tất thanh toán chuyển khoản qua ngân hàng.',
    createdAt: '2026-10-20T11:20:00Z',
    updatedAt: '2026-10-20T11:20:00Z',
  },
  {
    id: 'inv_trp_04',
    invoiceNumber: 'HD-TRP-4512',
    invoiceDate: '2026-10-25',
    batchId: 'batch_traphaco_04',
    batchNumber: 'LO-TRAPHACO-202604',
    items: [
      {
        id: 'item_4_1',
        medicineName: 'Boganic Forte',
        specification: 'Hộp 5 vỉ x 10 viên nang mềm',
        unit: 'Hộp',
        quantity: 250,
        unitPrice: 85000,
        amount: 21250000,
        notes: 'Cao Actiso, Rau đắng đất, Bìm bìm',
      },
      {
        id: 'item_4_2',
        medicineName: 'Hoạt Huyết Dưỡng Não Traphaco',
        specification: 'Hộp 5 vỉ x 20 viên bao phim',
        unit: 'Hộp',
        quantity: 200,
        unitPrice: 92000,
        amount: 18400000,
        notes: 'Cao Đinh lăng & Bạch quả',
      },
      {
        id: 'item_4_3',
        medicineName: 'Ampelop Trị Viêm Loét Dạ Dày',
        specification: 'Hộp 9 vỉ x 10 viên',
        unit: 'Hộp',
        quantity: 100,
        unitPrice: 115000,
        amount: 11500000,
        notes: 'Chiết xuất cao Chè dây chuẩn hóa',
      },
    ],
    expenses: [], // Không có chi phí phát sinh -> Tiền sau chi phí = Tiền trước chi phí
    preExpenseTotal: 51150000,
    expensesTotal: 0,
    postExpenseTotal: 51150000,
    notes: 'Miễn phí chi phí phát sinh theo chính sách đại lý cấp 1.',
    createdAt: '2026-10-25T09:45:00Z',
    updatedAt: '2026-10-25T09:45:00Z',
  },
];

type Listener = () => void;

class StorageService {
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.BATCHES)) {
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(INITIAL_BATCHES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Lỗi khi thông báo cập nhật dữ liệu:', err);
      }
    });
  }

  public getBatches(): Batch[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BATCHES);
      return data ? JSON.parse(data) : [];
    } catch {
      return INITIAL_BATCHES;
    }
  }

  public getInvoices(): Invoice[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return data ? JSON.parse(data) : [];
    } catch {
      return INITIAL_INVOICES;
    }
  }

  public getBatchById(id: string): Batch | undefined {
    return this.getBatches().find((b) => b.id === id);
  }

  public getBatchByNumber(batchNumber: string): Batch | undefined {
    const cleanNumber = batchNumber.trim().toLowerCase();
    return this.getBatches().find((b) => b.batchNumber.toLowerCase() === cleanNumber);
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find((inv) => inv.id === id);
  }

  public getInvoiceByBatchId(batchId: string): Invoice | undefined {
    return this.getInvoices().find((inv) => inv.batchId === batchId);
  }

  public getBatchesWithInvoices(): BatchWithInvoice[] {
    const batches = this.getBatches();
    const invoices = this.getInvoices();

    return batches.map((batch) => {
      const invoice = invoices.find((inv) => inv.batchId === batch.id);
      return {
        ...batch,
        hasInvoice: !!invoice,
        invoiceId: invoice?.id,
        invoiceNumber: invoice?.invoiceNumber,
        invoice,
        itemCount: invoice?.items?.length || 0,
        preExpenseTotal: invoice?.preExpenseTotal || 0,
        expensesTotal: invoice?.expensesTotal || 0,
        postExpenseTotal: invoice?.postExpenseTotal || 0,
      };
    });
  }

  public getStatistics(): BatchStatistics {
    const batchesWithInvoices = this.getBatchesWithInvoices();
    const totalBatches = batchesWithInvoices.length;
    const withInvoiceCount = batchesWithInvoices.filter((b) => b.hasInvoice).length;
    const withoutInvoiceCount = totalBatches - withInvoiceCount;

    const totals = batchesWithInvoices.reduce(
      (acc, b) => {
        acc.pre += b.preExpenseTotal;
        acc.exp += b.expensesTotal;
        acc.post += b.postExpenseTotal;
        return acc;
      },
      { pre: 0, exp: 0, post: 0 }
    );

    return {
      totalBatches,
      withInvoiceCount,
      withoutInvoiceCount,
      totalLandedExpense: totals.post,
      totalPreExpense: totals.pre,
      totalExpenses: totals.exp,
    };
  }

  /**
   * Tra cứu lô thuốc: tìm theo số lô, tên thuốc, hoặc mã hóa đơn
   */
  public search(query: string): BatchWithInvoice[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const all = this.getBatchesWithInvoices();
    return all.filter((item) => {
      // 1. Số lô thuốc
      if (item.batchNumber.toLowerCase().includes(q)) return true;
      // 2. Tên lô thuốc / nhà cung cấp
      if (item.batchName.toLowerCase().includes(q)) return true;
      if (item.supplier.toLowerCase().includes(q)) return true;
      // 3. Mã hóa đơn
      if (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(q)) return true;
      // 4. Tên các loại thuốc thuộc lô
      if (item.invoice?.items?.some((med) => med.medicineName.toLowerCase().includes(q))) return true;
      return false;
    });
  }

  /**
   * Thêm một lô thuốc mới
   */
  public createBatch(batchData: {
    batchNumber: string;
    batchName: string;
    supplier: string;
    importDate: string;
    notes?: string;
  }): { success: boolean; message: string; batch?: Batch } {
    const trimmedNumber = batchData.batchNumber.trim();
    if (!trimmedNumber) {
      return { success: false, message: 'Số lô thuốc là bắt buộc.' };
    }

    const batches = this.getBatches();
    const exists = batches.some((b) => b.batchNumber.toLowerCase() === trimmedNumber.toLowerCase());
    if (exists) {
      return { success: false, message: `Số lô "${trimmedNumber}" đã tồn tại trong hệ thống. Vui lòng nhập số lô khác.` };
    }

    const now = new Date().toISOString();
    const newBatch: Batch = {
      id: generateUniqueId('batch'),
      batchNumber: trimmedNumber,
      batchName: batchData.batchName.trim() || 'Lô thuốc nhập mới',
      supplier: batchData.supplier.trim() || 'Chưa xác định',
      importDate: batchData.importDate || now.split('T')[0],
      notes: batchData.notes?.trim() || '',
      hasInvoice: false,
      createdAt: now,
      updatedAt: now,
    };

    batches.unshift(newBatch);
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    this.notify();

    return { success: true, message: `Đã tạo thành công lô thuốc ${newBatch.batchNumber}`, batch: newBatch };
  }

  /**
   * Cập nhật thông tin lô thuốc
   */
  public updateBatch(id: string, updates: Partial<Batch>): { success: boolean; message: string } {
    const batches = this.getBatches();
    const index = batches.findIndex((b) => b.id === id);
    if (index === -1) {
      return { success: false, message: 'Không tìm thấy lô thuốc cần sửa.' };
    }

    // Nếu đổi số lô, kiểm tra trùng lặp
    if (updates.batchNumber && updates.batchNumber.trim().toLowerCase() !== batches[index].batchNumber.toLowerCase()) {
      const exists = batches.some(
        (b) => b.id !== id && b.batchNumber.toLowerCase() === updates.batchNumber!.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, message: `Số lô "${updates.batchNumber}" đã tồn tại. Vui lòng chọn số khác.` };
      }
    }

    const now = new Date().toISOString();
    const updatedBatch = {
      ...batches[index],
      ...updates,
      updatedAt: now,
    };

    batches[index] = updatedBatch;
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));

    // Đồng bộ lại batchNumber trong hóa đơn nếu có
    if (updates.batchNumber) {
      const invoices = this.getInvoices();
      const invIndex = invoices.findIndex((inv) => inv.batchId === id);
      if (invIndex !== -1) {
        invoices[invIndex].batchNumber = updates.batchNumber;
        invoices[invIndex].updatedAt = now;
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      }
    }

    this.notify();
    return { success: true, message: 'Đã cập nhật thông tin lô thuốc.' };
  }

  /**
   * Xóa một lô thuốc và hóa đơn liên quan (nếu có)
   */
  public deleteBatch(id: string): { success: boolean; message: string } {
    const batches = this.getBatches();
    const target = batches.find((b) => b.id === id);
    if (!target) {
      return { success: false, message: 'Lô thuốc không tồn tại.' };
    }

    const newBatches = batches.filter((b) => b.id !== id);
    const invoices = this.getInvoices();
    const newInvoices = invoices.filter((inv) => inv.batchId !== id);

    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(newBatches));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(newInvoices));
    this.notify();

    return { success: true, message: `Đã xóa lô thuốc ${target.batchNumber} thành công.` };
  }

  /**
   * Tạo hoặc cập nhật hóa đơn cho một lô thuốc
   */
  public saveInvoice(invoiceData: {
    id?: string;
    batchId: string;
    invoiceNumber: string;
    invoiceDate: string;
    items: InvoiceItem[];
    expenses: ExpenseItem[];
    notes?: string;
  }): { success: boolean; message: string; invoice?: Invoice } {
    const batch = this.getBatchById(invoiceData.batchId);
    if (!batch) {
      return { success: false, message: 'Lô thuốc liên kết không tồn tại.' };
    }

    const trimmedInvNumber = invoiceData.invoiceNumber.trim();
    if (!trimmedInvNumber) {
      return { success: false, message: 'Mã hóa đơn là bắt buộc.' };
    }

    const invoices = this.getInvoices();
    // Kiểm tra mã hóa đơn có trùng với hóa đơn của lô khác không
    const duplicate = invoices.some(
      (inv) => inv.invoiceNumber.toLowerCase() === trimmedInvNumber.toLowerCase() && inv.batchId !== invoiceData.batchId
    );
    if (duplicate) {
      return { success: false, message: `Mã hóa đơn "${trimmedInvNumber}" đã được sử dụng cho một lô khác.` };
    }

    // Đảm bảo tính toán thành tiền từng item và tổng
    const sanitizedItems: InvoiceItem[] = invoiceData.items.map((it) => {
      const q = Math.max(0, Number(it.quantity) || 0);
      const p = Math.max(0, Number(it.unitPrice) || 0);
      return {
        id: it.id || generateUniqueId('item'),
        medicineName: it.medicineName.trim(),
        specification: it.specification?.trim() || '',
        unit: it.unit?.trim() || 'Hộp',
        quantity: q,
        unitPrice: p,
        amount: Math.round(q * p),
        notes: it.notes?.trim() || '',
      };
    });

    const sanitizedExpenses: ExpenseItem[] = invoiceData.expenses.map((exp) => ({
      id: exp.id || generateUniqueId('exp'),
      expenseName: exp.expenseName.trim(),
      category: exp.category || 'other',
      amount: Math.max(0, Math.round(Number(exp.amount) || 0)),
      notes: exp.notes?.trim() || '',
    }));

    const totals = calculateInvoiceTotals(sanitizedItems, sanitizedExpenses);
    const now = new Date().toISOString();

    const existingInvIndex = invoices.findIndex((inv) => inv.batchId === invoiceData.batchId);
    let savedInvoice: Invoice;

    if (existingInvIndex !== -1) {
      // Cập nhật hóa đơn hiện có
      savedInvoice = {
        ...invoices[existingInvIndex],
        invoiceNumber: trimmedInvNumber,
        invoiceDate: invoiceData.invoiceDate,
        batchNumber: batch.batchNumber,
        items: sanitizedItems,
        expenses: sanitizedExpenses,
        preExpenseTotal: totals.preExpenseTotal,
        expensesTotal: totals.expensesTotal,
        postExpenseTotal: totals.postExpenseTotal,
        notes: invoiceData.notes?.trim() || '',
        updatedAt: now,
      };
      invoices[existingInvIndex] = savedInvoice;
    } else {
      // Tạo mới hóa đơn
      savedInvoice = {
        id: invoiceData.id || generateUniqueId('inv'),
        invoiceNumber: trimmedInvNumber,
        invoiceDate: invoiceData.invoiceDate || now.split('T')[0],
        batchId: invoiceData.batchId,
        batchNumber: batch.batchNumber,
        items: sanitizedItems,
        expenses: sanitizedExpenses,
        preExpenseTotal: totals.preExpenseTotal,
        expensesTotal: totals.expensesTotal,
        postExpenseTotal: totals.postExpenseTotal,
        notes: invoiceData.notes?.trim() || '',
        createdAt: now,
        updatedAt: now,
      };
      invoices.unshift(savedInvoice);
    }

    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));

    // Cập nhật trạng thái lô thuốc thành Đã có hóa đơn
    const batches = this.getBatches();
    const batchIndex = batches.findIndex((b) => b.id === invoiceData.batchId);
    if (batchIndex !== -1) {
      batches[batchIndex] = {
        ...batches[batchIndex],
        hasInvoice: true,
        invoiceId: savedInvoice.id,
        invoiceNumber: savedInvoice.invoiceNumber,
        updatedAt: now,
      };
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    }

    this.notify();
    return { success: true, message: `Đã lưu hóa đơn ${savedInvoice.invoiceNumber} thành công!`, invoice: savedInvoice };
  }

  /**
   * Xóa hóa đơn của một lô thuốc (đưa lô về trạng thái "Chưa có hóa đơn")
   */
  public deleteInvoice(invoiceId: string): { success: boolean; message: string } {
    const invoices = this.getInvoices();
    const target = invoices.find((inv) => inv.id === invoiceId);
    if (!target) {
      return { success: false, message: 'Hóa đơn không tồn tại.' };
    }

    const newInvoices = invoices.filter((inv) => inv.id !== invoiceId);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(newInvoices));

    // Cập nhật lại batch
    const batches = this.getBatches();
    const batchIndex = batches.findIndex((b) => b.id === target.batchId);
    if (batchIndex !== -1) {
      batches[batchIndex] = {
        ...batches[batchIndex],
        hasInvoice: false,
        invoiceId: undefined,
        invoiceNumber: undefined,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    }

    this.notify();
    return { success: true, message: `Đã xóa hóa đơn ${target.invoiceNumber}. Lô thuốc chuyển về trạng thái Chưa có hóa đơn.` };
  }

  /**
   * Thêm hoặc sửa thuốc trực tiếp trong hóa đơn của lô
   */
  public upsertInvoiceItem(batchId: string, itemData: Omit<InvoiceItem, 'id' | 'amount'> & { id?: string }): { success: boolean; message: string } {
    const invoice = this.getInvoiceByBatchId(batchId);
    if (!invoice) {
      return { success: false, message: 'Lô thuốc chưa có hóa đơn. Vui lòng tạo hóa đơn trước khi thêm thuốc.' };
    }

    const q = Math.max(0, Number(itemData.quantity) || 0);
    const p = Math.max(0, Number(itemData.unitPrice) || 0);
    const amount = Math.round(q * p);

    let updatedItems: InvoiceItem[];
    if (itemData.id) {
      // Sửa
      updatedItems = invoice.items.map((it) =>
        it.id === itemData.id
          ? {
              ...it,
              medicineName: itemData.medicineName.trim(),
              specification: itemData.specification?.trim() || '',
              unit: itemData.unit?.trim() || 'Hộp',
              quantity: q,
              unitPrice: p,
              amount,
              notes: itemData.notes?.trim() || '',
            }
          : it
      );
    } else {
      // Thêm mới
      const newItem: InvoiceItem = {
        id: generateUniqueId('item'),
        medicineName: itemData.medicineName.trim(),
        specification: itemData.specification?.trim() || '',
        unit: itemData.unit?.trim() || 'Hộp',
        quantity: q,
        unitPrice: p,
        amount,
        notes: itemData.notes?.trim() || '',
      };
      updatedItems = [...invoice.items, newItem];
    }

    const totals = calculateInvoiceTotals(updatedItems, invoice.expenses);
    const now = new Date().toISOString();

    const invoices = this.getInvoices();
    const idx = invoices.findIndex((inv) => inv.id === invoice.id);
    if (idx !== -1) {
      invoices[idx] = {
        ...invoices[idx],
        items: updatedItems,
        preExpenseTotal: totals.preExpenseTotal,
        postExpenseTotal: totals.postExpenseTotal,
        updatedAt: now,
      };
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      this.notify();
    }

    return { success: true, message: 'Đã lưu loại thuốc thành công.' };
  }

  /**
   * Xóa một loại thuốc khỏi hóa đơn
   */
  public deleteInvoiceItem(batchId: string, itemId: string): { success: boolean; message: string } {
    const invoice = this.getInvoiceByBatchId(batchId);
    if (!invoice) return { success: false, message: 'Hóa đơn không tồn tại.' };

    const updatedItems = invoice.items.filter((it) => it.id !== itemId);
    const totals = calculateInvoiceTotals(updatedItems, invoice.expenses);

    const invoices = this.getInvoices();
    const idx = invoices.findIndex((inv) => inv.id === invoice.id);
    if (idx !== -1) {
      invoices[idx] = {
        ...invoices[idx],
        items: updatedItems,
        preExpenseTotal: totals.preExpenseTotal,
        postExpenseTotal: totals.postExpenseTotal,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      this.notify();
    }

    return { success: true, message: 'Đã xóa loại thuốc khỏi danh sách.' };
  }

  /**
   * Thêm hoặc sửa chi phí phát sinh
   */
  public upsertExpenseItem(batchId: string, expenseData: Omit<ExpenseItem, 'id'> & { id?: string }): { success: boolean; message: string } {
    const invoice = this.getInvoiceByBatchId(batchId);
    if (!invoice) {
      return { success: false, message: 'Lô thuốc chưa có hóa đơn. Vui lòng tạo hóa đơn trước khi thêm chi phí.' };
    }

    const amount = Math.max(0, Math.round(Number(expenseData.amount) || 0));

    let updatedExpenses: ExpenseItem[];
    if (expenseData.id) {
      updatedExpenses = invoice.expenses.map((exp) =>
        exp.id === expenseData.id
          ? {
              ...exp,
              expenseName: expenseData.expenseName.trim(),
              category: expenseData.category || 'other',
              amount,
              notes: expenseData.notes?.trim() || '',
            }
          : exp
      );
    } else {
      const newExp: ExpenseItem = {
        id: generateUniqueId('exp'),
        expenseName: expenseData.expenseName.trim(),
        category: expenseData.category || 'other',
        amount,
        notes: expenseData.notes?.trim() || '',
      };
      updatedExpenses = [...invoice.expenses, newExp];
    }

    const totals = calculateInvoiceTotals(invoice.items, updatedExpenses);
    const invoices = this.getInvoices();
    const idx = invoices.findIndex((inv) => inv.id === invoice.id);
    if (idx !== -1) {
      invoices[idx] = {
        ...invoices[idx],
        expenses: updatedExpenses,
        expensesTotal: totals.expensesTotal,
        postExpenseTotal: totals.postExpenseTotal,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      this.notify();
    }

    return { success: true, message: 'Đã lưu chi phí phát sinh thành công.' };
  }

  /**
   * Xóa một khoản chi phí phát sinh
   */
  public deleteExpenseItem(batchId: string, expenseId: string): { success: boolean; message: string } {
    const invoice = this.getInvoiceByBatchId(batchId);
    if (!invoice) return { success: false, message: 'Hóa đơn không tồn tại.' };

    const updatedExpenses = invoice.expenses.filter((exp) => exp.id !== expenseId);
    const totals = calculateInvoiceTotals(invoice.items, updatedExpenses);

    const invoices = this.getInvoices();
    const idx = invoices.findIndex((inv) => inv.id === invoice.id);
    if (idx !== -1) {
      invoices[idx] = {
        ...invoices[idx],
        expenses: updatedExpenses,
        expensesTotal: totals.expensesTotal,
        postExpenseTotal: totals.postExpenseTotal,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      this.notify();
    }

    return { success: true, message: 'Đã xóa chi phí phát sinh.' };
  }

  /**
   * Khôi phục toàn bộ dữ liệu về bộ mẫu ban đầu
   */
  public resetToDemoData(): void {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(INITIAL_BATCHES));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    this.notify();
  }
}

export const storageService = new StorageService();
