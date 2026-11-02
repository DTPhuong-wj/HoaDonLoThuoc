import React, { useState } from 'react';
import { X, FileSpreadsheet, Check, Copy, AlertCircle, RefreshCw } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface SheetLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const SheetLinkModal: React.FC<SheetLinkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const settings = storageService.getSettings();
  const [url, setUrl] = useState(settings.googleAppsScriptUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setMessage({ text: 'Vui lòng nhập đường dẫn URL Web App Google Sheet', isError: true });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Lưu URL trước
    storageService.saveSettings({ googleAppsScriptUrl: url.trim() });

    // Thử nạp dữ liệu từ Sheet về
    const res = await storageService.fetchBatchesFromSheet();
    setIsLoading(false);

    if (res.success) {
      setMessage({ text: res.message, isError: false });
      setTimeout(() => {
        onSuccess(res.count);
        onClose();
      }, 1200);
    } else {
      setMessage({
        text: `${res.message}. Hãy chắc chắn bạn đã chọn quyền truy cập là 'Anyone' (Bất kỳ ai) khi triển khai Web App.`,
        isError: true,
      });
    }
  };

  const handleCopyScriptCode = () => {
    const code = `/**
 * GOOGLE APPS SCRIPT: QUẢN LÝ LÔ THUỐC
 * 5 CỘT CHUẨN: stt, lô thuốc, tên thuốc, nhãn, ngày nhập
 * TÊN THUỐC TÁCH RIÊNG TỪNG DÒNG (KHÔNG GỘP)
 */
const TAB_NAME = "QUAN_LY_LO_THUOC";
const SYNC_SECRET_TOKEN = "mint_pharma_secure_sync_secret_token_2026";

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🏥 Quản lý Lô thuốc')
    .addItem('1. Khởi tạo Bảng 5 Cột chuẩn', 'setupSheet')
    .addItem('2. Đánh lại STT', 'renumberSTT')
    .addToUi();
}

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TAB_NAME) || ss.insertSheet(TAB_NAME);
  const headers = ["stt", "lô thuốc", "tên thuốc", "nhãn", "ngày nhập"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setFontColor("#ffffff").setBackground("#065f46").setHorizontalAlignment("center");
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
}

function renumberSTT() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TAB_NAME);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  const stt = [];
  for (let i = 1; i <= lastRow - 1; i++) stt.push([i]);
  sheet.getRange(2, 1, lastRow - 1, 1).setValues(stt);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return ContentService.createTextOutput(JSON.stringify({success: false, message: "Hệ thống bận"})).setMimeType(ContentService.MimeType.JSON);
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data.token || data.token !== SYNC_SECRET_TOKEN) return ContentService.createTextOutput(JSON.stringify({success: false, message: "Sai token"})).setMimeType(ContentService.MimeType.JSON);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(TAB_NAME);
    if (!sheet) { setupSheet(); sheet = ss.getSheetByName(TAB_NAME); }
    const p = data.payload || {};

    if (data.action === "CREATE_LOT") {
      const bNum = String(p.batchNumber || '').trim();
      const lColor = String(p.labelColor || 'Nhãn xanh').trim();
      const iDate = String(p.importDate || '').trim();
      let meds = Array.isArray(p.batchNames) && p.batchNames.length > 0 ? p.batchNames : [p.batchName || 'Thuốc'];

      let last = sheet.getLastRow();
      for (let i = 0; i < meds.length; i++) {
        sheet.appendRow([last, bNum, String(meds[i]).trim(), lColor, iDate]);
        last = sheet.getLastRow();
      }
      renumberSTT();
      return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
    }
    if (data.action === "UPDATE_LOT") {
      const targetNum = String(p.oldBatchNumber || p.batchNumber || '').trim();
      const targetName = String(p.oldBatchName || p.batchName || '').trim();
      const last = sheet.getLastRow();
      if (last > 1) {
        const rows = sheet.getRange(2, 2, last - 1, 2).getValues();
        for (let i = 0; i < rows.length; i++) {
          if (String(rows[i][0]).trim() === targetNum && (targetName === '' || String(rows[i][1]).trim() === targetName)) {
            sheet.getRange(i + 2, 2, 1, 4).setValues([[p.batchNumber, p.batchName, p.labelColor, p.importDate]]);
            return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      sheet.appendRow([sheet.getLastRow(), p.batchNumber, p.batchName, p.labelColor, p.importDate]);
      renumberSTT();
      return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
    }
    if (data.action === "DELETE_LOT") {
      // Khi xóa thì không cập nhật sheet, giữ nguyên dữ liệu trên sheet
      return ContentService.createTextOutput(JSON.stringify({success: true, message: "Dữ liệu trên sheet được giữ nguyên"})).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({success: false})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(TAB_NAME);
    if (!sheet) { setupSheet(); sheet = ss.getSheetByName(TAB_NAME); }
    const lastRow = sheet.getLastRow();
    const batches = [];
    if (lastRow > 1) {
      const v = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
      for (let i = 0; i < v.length; i++) {
        if (v[i][1] || v[i][2]) {
          batches.push({
            id: "s_" + (i + 1),
            batchNumber: String(v[i][1] || '').trim(),
            batchName: String(v[i][2] || '').trim(),
            labelColor: String(v[i][3] || '').toLowerCase().includes('xanh') ? 'green' : 'white',
            importDate: v[i][4] instanceof Date ? Utilities.formatDate(v[i][4], Session.getScriptTimeZone() || 'GMT+7', 'yyyy-MM-dd') : String(v[i][4] || '').trim()
          });
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success: true, batches: batches})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;

    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Liên kết với Google Sheet</h3>
              <p className="text-xs text-emerald-100">
                Kết nối tới Sheet trước khi thêm lô thuốc
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {message && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold border ${
                message.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>URL Web App Google Apps Script</span>
                <button
                  type="button"
                  onClick={handleCopyScriptCode}
                  className="text-emerald-700 hover:text-emerald-800 text-[11px] font-bold flex items-center gap-1"
                >
                  {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCode ? 'Đã sao chép mã' : 'Sao chép mã Apps Script'}</span>
                </button>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm font-mono"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dán đường dẫn Web App của Google Sheet vào đây để liên kết.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1.5 text-slate-600">
              <div className="font-bold text-slate-700">Hướng dẫn nhanh 3 bước:</div>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                <li>Mở tệp Google Sheet của bạn &gt; <strong>Tiện ích mở rộng</strong> &gt; <strong>Apps Script</strong>.</li>
                <li>Bấm <strong>"Sao chép mã Apps Script"</strong> ở trên và dán đè vào Apps Script &gt; Lưu lại.</li>
                <li>Bấm <strong>Triển khai</strong> &gt; <strong>Triển khai mới</strong> &gt; Chọn <strong>Ứng dụng web</strong> &gt; Quyền truy cập: <strong>Bất kỳ ai (Anyone)</strong> &gt; Sao chép link dán vào đây.</li>
              </ol>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Đóng
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-bold shadow-xs transition-colors"
              >
                {isLoading && <RefreshCw size={14} className="animate-spin" />}
                <span>{isLoading ? 'Đang kết nối...' : 'Liên kết với Sheet'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
