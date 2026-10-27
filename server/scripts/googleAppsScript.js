/**
 * ====================================================================
 * GOOGLE APPS SCRIPT: ĐỒNG BỘ 1 CHIỀU TỰ ĐỘNG TỪ MYSQL SANG GOOGLE SHEETS
 * Dự án: MintPharma - Quản lý Hóa đơn Lô thuốc
 * ====================================================================
 * 
 * ĐẶC ĐIỂM:
 *  - CHỈ DÙNG 1 SHEET DUY NHẤT: Bảng tổng hợp toàn bộ thông tin Lô thuốc, Hóa đơn, Thuốc & Chi phí.
 *  - ĐỒNG BỘ 1 CHIỀU TỰ ĐỘNG: Khi MySQL thêm mới, chỉnh sửa hoặc xóa thì Google Sheets tự cập nhật ngay.
 *  - CỘT STT TỰ ĐỘNG ĐÁNH LẠI LIÊN TỤC (1, 2, 3...) sau mỗi lần thêm/xóa.
 *  - KHÔNG CẦN CÀI ĐẶT TRIGGER PHỨC TẠP! KHÔNG CẦN NGROK HAY TUNNEL!
 * 
 * HƯỚNG DẪN CÀI ĐẶT 2 BƯỚC:
 * --------------------------------------------------------------------
 * 1. Mở một Google Spreadsheet bất kỳ.
 * 2. Bấm menu: Tiện ích mở rộng (Extensions) -> Apps Script.
 *    Xóa hết mã mặc định và dán toàn bộ file này vào. Bấm Lưu (Ctrl + S).
 * 3. Triển khai Web App:
 *    - Bấm nút "Triển khai" (Deploy) ở góc trên bên phải -> "Tùy chọn triển khai mới" (New deployment).
 *    - Chọn loại: "Ứng dụng web" (Web app).
 *    - Mô tả: "MintPharma 1-Way Sync".
 *    - Thực thi dưới dạng: "Tôi" (Me).
 *    - Ai có quyền truy cập: "Bất kỳ ai" (Anyone).
 *    - Bấm "Triển khai" (Deploy) và sao chép "URL ứng dụng web".
 * 4. Dán URL ứng dụng web vào file `.env` ở Backend:
 *    GOOGLE_SHEETS_SYNC_ENABLED=true
 *    GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
 * 
 * Quay lại Google Sheets, bạn sẽ thấy menu: "🏥 MintPharma DB"
 * Bấm: "1. Khởi tạo Bảng tổng hợp duy nhất" để định dạng tiêu đề và màu sắc chuẩn!
 * ====================================================================
 */

// Tên Sheet duy nhất dùng để quản lý toàn bộ dữ liệu
const SHEET_NAME = "HoaDonLoThuoc";

// Khóa bí mật (Khớp với SHEETS_SYNC_SECRET trong file .env của Backend)
const SYNC_SECRET_TOKEN = "mint_pharma_secure_sync_secret_token_2026";

/**
 * TẠO MENU TIỆN ÍCH TRÊN GOOGLE SHEETS
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏥 MintPharma DB')
    .addItem('1. Khởi tạo Bảng tổng hợp duy nhất', 'setupSingleSheet')
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
    "STT",
    "Số Lô",
    "Tên Lô Thuốc",
    "Nhà Cung Cấp",
    "Ngày Nhập Kho",
    "Trạng Thái HĐ",
    "Số Hóa Đơn",
    "Ngày Hóa Đơn",
    "Danh Mục Thuốc Trong Lô",
    "Tiền Hàng Trước CP",
    "Chi Phí Phát Sinh",
    "Tổng Tiền Sau CP",
    "Chi Tiết Chi Phí Phát Sinh",
    "Ghi Chú",
    "Mã ID Lô (Hệ thống)",
    "Cập Nhật Lúc"
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

  SpreadsheetApp.getUi().alert(
    "KHỞI TẠO THÀNH CÔNG!",
    "Đã thiết lập bảng dữ liệu tổng hợp duy nhất `HoaDonLoThuoc`.\nTừ bây giờ, mọi thay đổi từ MySQL sẽ tự động đồng bộ vào đây!",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * WEBHOOK TIẾP NHẬN DỮ LIỆU TỪ MYSQL SERVER (1 CHIỀU: MySQL -> Google Sheets)
 */
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
      sheet = ss.getSheets()[0]; // Lấy sheet đầu tiên nếu chưa đổi tên
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

/**
 * XỬ LÝ THÊM MỚI HOẶC CẬP NHẬT (UPSERT)
 */
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

  // Kiểm tra có hóa đơn chưa
  const hasInvoice = Boolean(data.hasInvoice || (data.invoiceNumber && data.invoiceNumber !== "—") || data.invoice);
  const invNumber = data.invoiceNumber || (data.invoice ? data.invoice.invoiceNumber : "") || (hasInvoice ? "Đã lập HĐ" : "—");
  const invDate = (data.invoice ? formatDateStr(data.invoice.invoiceDate) : (data.invoiceDate ? formatDateStr(data.invoiceDate) : "—"));
  
  const preTotal = Number(data.preExpenseTotal || (data.invoice ? data.invoice.preExpenseTotal : 0)) || 0;
  const expTotal = Number(data.expensesTotal || (data.invoice ? data.invoice.expensesTotal : 0)) || 0;
  const postTotal = Number(data.postExpenseTotal || (data.invoice ? data.invoice.postExpenseTotal : 0)) || (preTotal + expTotal);

  const rowData = [
    foundRow !== -1 ? foundRow - 1 : sheet.getLastRow(), // STT tạm (sẽ được renumberSTT đánh lại chuẩn xác)
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

/**
 * XỬ LÝ XÓA BẢN GHI (DELETE)
 */
function handleDeleteRecord(sheet, entityType, data, entityId) {
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const targetId = entityId || (data ? data.id : "");
  const targetBatchNum = data ? (data.batchNumber || data.batch_number) : "";

  for (let i = values.length - 1; i >= 1; i--) {
    // Nếu xóa lô thuốc -> xóa cả dòng tương ứng
    if (entityType === 'batch') {
      if ((targetId && values[i][14] === targetId) || (targetBatchNum && values[i][1] === targetBatchNum)) {
        sheet.deleteRow(i + 1);
        break;
      }
    } 
    // Nếu xóa hóa đơn -> cập nhật trạng thái dòng về "Chưa có HĐ"
    else if (entityType === 'invoice') {
      const batchId = data ? data.batchId : "";
      if ((batchId && values[i][14] === batchId) || (targetId && values[i][14] === targetId)) {
        sheet.getRange(i + 1, 6).setValue("Chưa có HĐ"); // Trạng thái HĐ
        sheet.getRange(i + 1, 7).setValue("—");          // Số HĐ
        sheet.getRange(i + 1, 8).setValue("—");          // Ngày HĐ
        sheet.getRange(i + 1, 9).setValue("—");          // Danh mục thuốc
        sheet.getRange(i + 1, 10).setValue(0);           // Tiền hàng
        sheet.getRange(i + 1, 11).setValue(0);           // Chi phí
        sheet.getRange(i + 1, 12).setValue(0);           // Tổng tiền
        sheet.getRange(i + 1, 13).setValue("—");         // Chi tiết chi phí
        sheet.getRange(i + 1, 16).setValue(new Date().toLocaleString("vi-VN"));
        break;
      }
    }
  }
}

/**
 * TỰ ĐỘNG ĐÁNH LẠI SỐ THỨ TỰ (STT) TĂNG DẦN LIÊN TỤC 1, 2, 3, 4, 5...
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
    "MintPharma Google Apps Script Webhook (1-Way MySQL -> Sheets) is active!"
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
