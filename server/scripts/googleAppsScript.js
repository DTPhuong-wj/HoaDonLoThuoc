/**
 * ====================================================================
 * GOOGLE APPS SCRIPT: ĐỒNG BỘ HAI CHIỀU CLOUD GIỮA MYSQL VÀ GOOGLE SHEETS
 * Dự án: MintPharma - Quản lý Hóa đơn Lô thuốc (HoaDonLoThuoc)
 * ====================================================================
 * 
 * ĐẶC ĐIỂM HỆ THỐNG CLOUD:
 *  - 1 SHEET TỔNG HỢP DUY NHẤT (`HoaDonLoThuoc`): Xem và quản lý toàn bộ dữ liệu.
 *  - ĐỒNG BỘ 2 CHIỀU TỰ ĐỘNG KHÔNG CẦN BẬT MÁY TÍNH CÁ NHÂN:
 *      + Luồng 1 (MySQL Cloud -> Google Sheets): Khi web app thêm/sửa/xóa,
 *        Backend Cloud tự động gọi Webhook này để cập nhật Sheets.
 *      + Luồng 2 (Google Sheets -> MySQL Cloud): Khi chỉnh sửa trên Google Sheets,
 *        Trình kích hoạt onEdit tự động gửi dữ liệu về Backend Cloud để lưu vào MySQL.
 *  - CỘT STT (Cột A) TỰ ĐỘNG ĐÁNH LẠI LIÊN TỤC 1, 2, 3... không bị nhảy số.
 *  - SỬ DỤNG ID HỆ THỐNG ỔN ĐỊNH (Cột O): Không dùng STT làm định danh.
 *  - CƠ CHẾ CHỐNG VÒNG LẶP (Anti-loop) & IDEMPOTENCY: Đảm bảo dữ liệu nhất quán.
 * 
 * HƯỚNG DẪN CÀI ĐẶT:
 * --------------------------------------------------------------------
 * 1. Mở một Google Spreadsheet bất kỳ.
 * 2. Bấm: Tiện ích mở rộng (Extensions) -> Apps Script.
 *    Xóa toàn bộ mã mặc định và dán toàn bộ file này vào.
 * 3. Điền URL Backend Cloud của bạn vào biến BACKEND_API_URL bên dưới (dòng 34).
 * 4. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment):
 *    - Loại: "Ứng dụng web" (Web app).
 *    - Mô tả: "MintPharma Cloud Sync".
 *    - Thực thi dưới dạng: "Tôi" (Me).
 *    - Ai có quyền truy cập: "Bất kỳ ai" (Anyone).
 *    - Sao chép URL ứng dụng web dán vào biến GOOGLE_APPS_SCRIPT_URL ở Backend Cloud.
 * 5. Thiết lập Trigger cho chiều ngược lại (Google Sheets -> MySQL):
 *    - Bấm biểu tượng Đồng hồ (Triggers) ở menu bên trái Apps Script.
 *    - Bấm "+ Thêm trình kích hoạt" (Add Trigger).
 *    - Hàm để chạy: onSpreadsheetEdit.
 *    - Nguồn sự kiện: Từ bảng tính (From spreadsheet).
 *    - Loại sự kiện: Khi chỉnh sửa (On edit).
 *    - Bấm Lưu.
 * ====================================================================
 */

// 1. CẤU HÌNH KẾT NỐI CLOUD
// Điền địa chỉ Backend Cloud của bạn (ví dụ: https://hoadonlothuoc-api.onrender.com hoặc domain Cloudflare)
const BACKEND_API_URL = "https://YOUR_BACKEND_CLOUD_DOMAIN";

// Tên Sheet duy nhất dùng để quản lý toàn bộ dữ liệu
const SHEET_NAME = "HoaDonLoThuoc";

// Khóa bí mật (Khớp với SHEETS_SYNC_SECRET trong biến môi trường của Backend)
const SYNC_SECRET_TOKEN = "mint_pharma_secure_sync_secret_token_2026";

/**
 * TẠO MENU TIỆN ÍCH TRÊN GOOGLE SHEETS
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏥 MintPharma DB')
    .addItem('1. Khởi tạo Bảng tổng hợp duy nhất', 'setupSingleSheet')
    .addItem('2. Đồng bộ dòng đang chọn về MySQL Cloud', 'syncActiveRowToMySQL')
    .addToUi();
}

/**
 * KHỞI TẠO TIÊU ĐỀ VÀ ĐỊNH DẠNG 1 SHEET DUY NHẤT
 */
function setupSingleSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Thiết lập tiêu đề các cột chuẩn
  const headers = [
    "STT",                        // Cột 1 (A)
    "Số Lô",                      // Cột 2 (B)
    "Tên Lô Thuốc",               // Cột 3 (C)
    "Nhà Cung Cấp",               // Cột 4 (D)
    "Ngày Nhập Kho",              // Cột 5 (E)
    "Trạng Thái HĐ",              // Cột 6 (F)
    "Số Hóa Đơn",                 // Cột 7 (G)
    "Ngày Hóa Đơn",               // Cột 8 (H)
    "Danh Mục Thuốc Trong Lô",    // Cột 9 (I)
    "Tiền Hàng Trước CP",         // Cột 10 (J)
    "Chi Phí Phát Sinh",          // Cột 11 (K)
    "Tổng Tiền Sau CP",           // Cột 12 (L)
    "Chi Tiết Chi Phí Phát Sinh", // Cột 13 (M)
    "Ghi Chú",                    // Cột 14 (N)
    "Mã ID Lô (Hệ thống)",        // Cột 15 (O)
    "Cập Nhật Lúc"                // Cột 16 (P)
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Định dạng Header phong cách Soft Mint Teal
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold")
             .setFontColor("#ffffff")
             .setBackground("#0f766e")
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");
  
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  // Định dạng căn lề và định dạng số tiền
  sheet.getRange("A:A").setHorizontalAlignment("center");
  sheet.getRange("B:B").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("E:E").setHorizontalAlignment("center");
  sheet.getRange("F:F").setHorizontalAlignment("center");
  sheet.getRange("G:H").setHorizontalAlignment("center");
  sheet.getRange("J:L").setNumberFormat("#,##0 \"đ\"").setHorizontalAlignment("right");
  sheet.getRange("O:O").setFontFamily("monospace").setFontSize(9).setFontColor("#64748b");

  SpreadsheetApp.getUi().alert(
    "KHỞI TẠO THÀNH CÔNG!",
    "Đã thiết lập bảng dữ liệu tổng hợp duy nhất `HoaDonLoThuoc`.\nTừ bây giờ, mọi thay đổi từ MySQL Cloud sẽ tự động đồng bộ vào đây!",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ====================================================================
// LUỒNG 1: MYSQL CLOUD -> GOOGLE SHEETS (TIẾP NHẬN TỪ BACKEND CLOUD)
// ====================================================================

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse(false, "Không có dữ liệu gửi lên.");
    }

    const postData = JSON.parse(e.postData.contents);

    // Xác thực token bảo mật
    if (postData.token !== SYNC_SECRET_TOKEN) {
      return jsonResponse(false, "Từ chối truy cập: Sai token xác thực.");
    }

    const entityType = postData.entityType;
    const action = postData.mutation; // 'UPSERT' hoặc 'DELETE'
    const data = postData.data;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }

    if (action === 'DELETE') {
      handleDeleteRecord(sheet, entityType, data, postData.entityId);
    } else {
      handleUpsertRecord(sheet, entityType, data);
    }

    // Tự động đánh lại số thứ tự STT (Cột A) từ 1 đến hết
    renumberSTT(sheet);

    return jsonResponse(true, "Đã đồng bộ sang Google Sheets thành công.");
  } catch (err) {
    return jsonResponse(false, "Lỗi xử lý trong Apps Script: " + err.toString());
  }
}

function handleUpsertRecord(sheet, entityType, data) {
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  // Xác định ID lô và số lô
  const batchId = data.id || data.batchId || "";
  const batchNumber = data.batchNumber || data.batch_number || "";

  let foundRow = -1;
  for (let i = 1; i < values.length; i++) {
    // Cột O (index 14) là Mã ID, Cột B (index 1) là Số lô
    if ((batchId && values[i][14] === batchId) || (batchNumber && values[i][1] === batchNumber)) {
      foundRow = i + 1;
      break;
    }
  }

  // Chuỗi danh mục thuốc
  let medicinesStr = "";
  if (data.invoice && data.invoice.items && Array.isArray(data.invoice.items)) {
    medicinesStr = data.invoice.items.map(function(it) {
      return it.medicineName + " (" + (it.quantity || 0) + " " + (it.unit || "Hộp") + ")";
    }).join(", ");
  } else if (data.items && Array.isArray(data.items)) {
    medicinesStr = data.items.map(function(it) {
      return it.medicineName + " (" + (it.quantity || 0) + " " + (it.unit || "Hộp") + ")";
    }).join(", ");
  }

  // Chuỗi chi tiết chi phí
  let expensesDetailStr = "";
  if (data.invoice && data.invoice.expenses && Array.isArray(data.invoice.expenses)) {
    expensesDetailStr = data.invoice.expenses.map(function(ex) {
      return (ex.expenseName || ex.title || "Phụ phí") + ": " + formatCurrencyVND(ex.amount);
    }).join("; ");
  } else if (data.expenses && Array.isArray(data.expenses)) {
    expensesDetailStr = data.expenses.map(function(ex) {
      return (ex.expenseName || ex.title || "Phụ phí") + ": " + formatCurrencyVND(ex.amount);
    }).join("; ");
  }

  // Kiểm tra trạng thái hóa đơn
  const hasInvoice = Boolean(data.hasInvoice || (data.invoiceNumber && data.invoiceNumber !== "—") || data.invoice);
  const invNumber = data.invoiceNumber || (data.invoice ? data.invoice.invoiceNumber : "") || (hasInvoice ? "Đã lập HĐ" : "—");
  const invDate = (data.invoice ? formatDateStr(data.invoice.invoiceDate) : (data.invoiceDate ? formatDateStr(data.invoiceDate) : "—"));
  
  const preTotal = Number(data.preExpenseTotal || (data.invoice ? data.invoice.preExpenseTotal : 0)) || 0;
  const expTotal = Number(data.expensesTotal || (data.invoice ? data.invoice.expensesTotal : 0)) || 0;
  const postTotal = Number(data.postExpenseTotal || (data.invoice ? data.invoice.postExpenseTotal : 0)) || (preTotal + expTotal);

  const rowData = [
    foundRow !== -1 ? foundRow - 1 : sheet.getLastRow(),
    batchNumber,
    data.batchName || data.batch_name || "",
    data.supplier || "",
    formatDateStr(data.importDate || data.import_date),
    hasInvoice ? "Đã có HĐ" : "Chưa có HĐ",
    invNumber,
    invDate,
    medicinesStr || "—",
    preTotal,
    expTotal,
    postTotal,
    expensesDetailStr || "—",
    data.notes || "",
    batchId,
    new Date().toLocaleString("vi-VN")
  ];

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function handleDeleteRecord(sheet, entityType, data, entityId) {
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const targetId = entityId || (data ? data.id : "");
  const targetBatchNum = data ? (data.batchNumber || data.batch_number) : "";

  for (let i = values.length - 1; i >= 1; i--) {
    if (entityType === 'batch') {
      if ((targetId && values[i][14] === targetId) || (targetBatchNum && values[i][1] === targetBatchNum)) {
        sheet.deleteRow(i + 1);
        break;
      }
    } else if (entityType === 'invoice') {
      const batchId = data ? data.batchId : "";
      if ((batchId && values[i][14] === batchId) || (targetId && values[i][14] === targetId)) {
        sheet.getRange(i + 1, 6).setValue("Chưa có HĐ");
        sheet.getRange(i + 1, 7).setValue("—");
        sheet.getRange(i + 1, 8).setValue("—");
        sheet.getRange(i + 1, 9).setValue("—");
        sheet.getRange(i + 1, 10).setValue(0);
        sheet.getRange(i + 1, 11).setValue(0);
        sheet.getRange(i + 1, 12).setValue(0);
        sheet.getRange(i + 1, 13).setValue("—");
        sheet.getRange(i + 1, 16).setValue(new Date().toLocaleString("vi-VN"));
        break;
      }
    }
  }
}

// ====================================================================
// LUỒNG 2: GOOGLE SHEETS -> MYSQL CLOUD (TRIGGER CHỈNH SỬA TRỰC TIẾP)
// ====================================================================

/**
 * Trình kích hoạt tự động phát hiện khi người dùng chỉnh sửa trên Google Sheets
 * Cần tạo Installable Trigger: "onSpreadsheetEdit" -> "Khi chỉnh sửa"
 */
function onSpreadsheetEdit(e) {
  try {
    if (!e || !e.range) return;
    const sheet = e.range.getSheet();
    if (sheet.getName() !== SHEET_NAME) return;

    const row = e.range.getRow();
    // Bỏ qua dòng tiêu đề
    if (row <= 1) return;

    const col = e.range.getColumn();
    // Chỉ đồng bộ khi sửa các cột được phép: Số lô (2), Tên lô (3), NCC (4), Ngày nhập (5), Ghi chú (14)
    const editableCols = [2, 3, 4, 5, 14];
    if (!editableCols.includes(col)) return;

    syncRowToBackend(sheet, row);
  } catch (err) {
    console.error("Lỗi onSpreadsheetEdit:", err.toString());
  }
}

/**
 * Menu thủ công: Đồng bộ dòng đang chọn về MySQL Cloud
 */
function syncActiveRowToMySQL() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getName() !== SHEET_NAME) {
    SpreadsheetApp.getUi().alert("Vui lòng chọn tab " + SHEET_NAME);
    return;
  }
  const row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert("Vui lòng chọn một dòng dữ liệu (không chọn dòng tiêu đề).");
    return;
  }
  syncRowToBackend(sheet, row, true);
}

/**
 * Gửi dữ liệu một dòng từ Google Sheets sang Backend Cloud
 */
function syncRowToBackend(sheet, row, showAlert) {
  if (!BACKEND_API_URL || BACKEND_API_URL.includes("YOUR_BACKEND_CLOUD_DOMAIN")) {
    if (showAlert) {
      SpreadsheetApp.getUi().alert("Chưa cấu hình BACKEND_API_URL trong mã Apps Script!");
    }
    return;
  }

  const rowValues = sheet.getRange(row, 1, 1, 16).getValues()[0];
  const batchId = String(rowValues[14] || "").trim(); // Cột O: ID ổn định của hệ thống

  if (!batchId) {
    if (showAlert) {
      SpreadsheetApp.getUi().alert("Dòng này chưa có Mã ID Lô hệ thống (Cột O). Không thể đồng bộ.");
    }
    return;
  }

  const payload = {
    entityType: "batch",
    mutation: "UPSERT",
    entityId: batchId,
    data: {
      id: batchId,
      batchNumber: String(rowValues[1] || "").trim(),
      batchName: String(rowValues[2] || "").trim(),
      supplier: String(rowValues[3] || "").trim(),
      importDate: formatDateStr(rowValues[4]),
      notes: String(rowValues[13] || "").trim()
    }
  };

  const endpoint = BACKEND_API_URL.replace(/\/$/, "") + "/api/sync/from-sheets";
  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Sync-Token": SYNC_SECRET_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);
  const respCode = response.getResponseCode();
  const respText = response.getContentText();

  if (respCode >= 200 && respCode < 300) {
    sheet.getRange(row, 16).setValue(new Date().toLocaleString("vi-VN") + " (Đã đồng bộ MySQL)");
    if (showAlert) {
      SpreadsheetApp.getUi().alert("ĐỒNG BỘ THÀNH CÔNG!", "Dữ liệu dòng này đã được cập nhật trực tiếp vào MySQL Cloud.", SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } else {
    sheet.getRange(row, 16).setValue("Lỗi đồng bộ: " + respCode);
    if (showAlert) {
      SpreadsheetApp.getUi().alert("ĐỒNG BỘ THẤT BẠI: " + respText);
    }
  }
}

// ====================================================================
// HÀM BỔ TRỢ HỆ THỐNG
// ====================================================================

/**
 * Tự động đánh lại số thứ tự (STT) cột A tăng dần liên tục: 1, 2, 3, 4, 5...
 */
function renumberSTT(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const numRows = lastRow - 1;
  const sttList = [];
  for (let i = 1; i <= numRows; i++) {
    sttList.push([i]);
  }
  sheet.getRange(2, 1, numRows, 1).setValues(sttList);
}

function doGet(e) {
  return ContentService.createTextOutput(
    "MintPharma Google Apps Script Cloud Sync Webhook is ONLINE!"
  ).setMimeType(ContentService.MimeType.TEXT);
}

function jsonResponse(success, message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function formatDateStr(d) {
  if (!d || d === "—") return "—";
  if (d instanceof Date) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(d).split('T')[0];
}

function formatCurrencyVND(num) {
  const n = Number(num) || 0;
  return n.toLocaleString("vi-VN") + " đ";
}
