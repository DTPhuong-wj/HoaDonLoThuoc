/**
 * ====================================================================
 * GOOGLE APPS SCRIPT: ĐỒNG BỘ HAI CHIỀU VỚI MYSQL DATABASE `HoaDonLoThuoc`
 * Dự án: MintPharma - Quản lý & Đối chiếu Hóa đơn Lô thuốc
 * ====================================================================
 * 
 * SCRIPT NÀY KHỚP CHÍNH XÁC VỚI 4 BẢNG DỮ LIỆU TRONG MYSQL:
 *  1. Bảng `batches`       <---> Sheet `LoThuoc`
 *  2. Bảng `invoices`      <---> Sheet `HoaDon`
 *  3. Bảng `invoice_items` <---> Sheet `DanhSachThuoc`
 *  4. Bảng `expenses`       <---> Sheet `ChiPhiPhatSinh`
 * 
 * HƯỚNG DẪN CÀI ĐẶT NHANH (3 BƯỚC):
 * --------------------------------------------------------------------
 * 1. Mở một Google Spreadsheet mới.
 * 2. Vào menu: Tiện ích mở rộng (Extensions) -> Apps Script.
 *    Xóa hết mã mặc định và dán toàn bộ file này vào.
 * 3. Chỉnh sửa 2 biến cấu hình ở dòng 35 & 36:
 *    - BACKEND_API_URL: Địa chỉ Backend của bạn (VD: qua Tailscale, IP LAN, Cloudflare Tunnel, ngrok)
 *    - SYNC_SECRET_TOKEN: Khớp với SHEETS_SYNC_SECRET trong file .env của Backend
 * 4. Bấm Lưu (Save). Tải lại Google Sheet, bạn sẽ thấy Menu: "🏥 MintPharma DB"
 *    Bấm vào menu: "1. Tự động tạo 4 Sheet chuẩn theo MySQL" để tạo sẵn các cột đẹp mắt!
 * 5. Cài đặt Trigger: Bấm biểu tượng Đồng hồ (Triggers) ở cột trái -> Thêm Trigger:
 *    - Hàm chạy: onSpreadsheetEdit
 *    - Nguồn sự kiện: Từ bảng tính
 *    - Loại sự kiện: Khi chỉnh sửa (On edit)
 * 6. Triển khai Web App: Bấm "Triển khai" -> "Tùy chọn triển khai mới" -> "Ứng dụng web"
 *    - Thực thi dưới dạng: Tôi (Me)
 *    - Ai có quyền truy cập: Bất kỳ ai (Anyone)
 *    - Sao chép URL Web App dán vào GOOGLE_APPS_SCRIPT_URL trong file .env phía Backend!
 * ====================================================================
 */

// ====================================================================
// CẤU HÌNH LIÊN KẾT VỚI BACKEND MYSQL
// ====================================================================
const BACKEND_API_URL = "http://YOUR_BACKEND_IP_OR_DOMAIN:5000/api/sync/from-sheets";
const SYNC_SECRET_TOKEN = "mint_pharma_secure_sync_secret_token_2026";

/**
 * TẠO MENU TÙY CHỈNH KHI MỞ GOOGLE SHEETS
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏥 MintPharma DB')
    .addItem('1. Tự động tạo 4 Sheet chuẩn theo MySQL', 'setupDatabaseSheets')
    .addItem('2. Kiểm tra kết nối Backend API', 'testBackendConnection')
    .addToUi();
}

/**
 * 1. TỰ ĐỘNG KHỞI TẠO 4 BẢNG TRÊN GOOGLE SHEETS KHỚP VỚI MYSQL
 */
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Bảng 1: LoThuoc (tương ứng bảng `batches` trong MySQL)
  let sheetBatches = ss.getSheetByName("LoThuoc");
  if (!sheetBatches) sheetBatches = ss.insertSheet("LoThuoc");
  sheetBatches.clear();
  sheetBatches.appendRow([
    "Mã ID", "Số lô", "Tên lô thuốc", "Nhà cung cấp", "Ngày nhập", 
    "Trạng thái HĐ", "Số HĐ", "Tiền trước CP", "Phụ phí", "Tiền sau CP", "Ghi chú", "Cập nhật lúc"
  ]);
  formatHeaderRow(sheetBatches, 12, "#0f766e"); // Màu Soft Mint Teal

  // Bảng 2: HoaDon (tương ứng bảng `invoices` trong MySQL)
  let sheetInvoices = ss.getSheetByName("HoaDon");
  if (!sheetInvoices) sheetInvoices = ss.insertSheet("HoaDon");
  sheetInvoices.clear();
  sheetInvoices.appendRow([
    "Mã HĐ (ID)", "Số hóa đơn", "Ngày HĐ", "Mã Lô (batch_id)", "Số lô", 
    "Tiền thuốc trước CP", "Chi phí phát sinh", "Tổng thanh toán sau CP", "Ghi chú", "Cập nhật lúc"
  ]);
  formatHeaderRow(sheetInvoices, 10, "#0369a1"); // Màu Sky Blue

  // Bảng 3: DanhSachThuoc (tương ứng bảng `invoice_items` trong MySQL)
  let sheetItems = ss.getSheetByName("DanhSachThuoc");
  if (!sheetItems) sheetItems = ss.insertSheet("DanhSachThuoc");
  sheetItems.clear();
  sheetItems.appendRow([
    "Mã Item (ID)", "Mã HĐ (invoice_id)", "Số HĐ", "Số lô", 
    "Tên thuốc", "Quy cách đóng gói", "ĐVT", "Số lượng", "Đơn giá (VNĐ)", "Thành tiền (VNĐ)", "Ghi chú"
  ]);
  formatHeaderRow(sheetItems, 11, "#047857"); // Màu Emerald

  // Bảng 4: ChiPhiPhatSinh (tương ứng bảng `expenses` trong MySQL)
  let sheetExpenses = ss.getSheetByName("ChiPhiPhatSinh");
  if (!sheetExpenses) sheetExpenses = ss.insertSheet("ChiPhiPhatSinh");
  sheetExpenses.clear();
  sheetExpenses.appendRow([
    "Mã Chi Phí (ID)", "Mã HĐ (invoice_id)", "Tên khoản chi phí", 
    "Phân loại (shipping/handling/inspection/storage/other)", "Số tiền (VNĐ)", "Ghi chú"
  ]);
  formatHeaderRow(sheetExpenses, 6, "#b45309"); // Màu Amber

  SpreadsheetApp.getUi().alert(
    "ĐÃ KHỞI TẠO XONG!", 
    "Đã tạo thành công 4 Sheet khớp chuẩn với MySQL Database HoaDonLoThuoc:\n" +
    "- LoThuoc (bảng batches)\n- HoaDon (bảng invoices)\n- DanhSachThuoc (bảng invoice_items)\n- ChiPhiPhatSinh (bảng expenses)", 
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function formatHeaderRow(sheet, numCols, bgColor) {
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setFontWeight("bold")
             .setFontColor("#ffffff")
             .setBackground(bgColor)
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
}

/**
 * KIỂM TRA KẾT NỐI BACKEND TỪ GOOGLE APPS SCRIPT
 */
function testBackendConnection() {
  const ui = SpreadsheetApp.getUi();
  try {
    const healthUrl = BACKEND_API_URL.replace("/api/sync/from-sheets", "/api/health");
    const response = UrlFetchApp.fetch(healthUrl, { muteHttpExceptions: true });
    const code = response.getResponseCode();
    const content = response.getContentText();

    if (code === 200) {
      const data = JSON.parse(content);
      ui.alert("KẾT NỐI THÀNH CÔNG!", "Backend đang hoạt động.\nCơ sở dữ liệu: " + data.database, ui.ButtonSet.OK);
    } else {
      ui.alert("CẢNH BÁO", "Backend phản hồi mã lỗi HTTP: " + code + "\nChi tiết: " + content, ui.ButtonSet.OK);
    }
  } catch (err) {
    ui.alert("LỖI KẾT NỐI", "Không thể gọi tới Backend API.\nVui lòng kiểm tra lại BACKEND_API_URL.\nChi tiết lỗi: " + err.toString(), ui.ButtonSet.OK);
  }
}

/**
 * 2. WEBHOOK TIẾP NHẬN DỮ LIỆU TỪ MYSQL SERVER GỬI SANG (MySQL -> Google Sheets)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse(false, "Không có dữ liệu gửi lên.");
    }

    const postData = JSON.parse(e.postData.contents);

    // Xác thực token bảo mật
    if (postData.token !== SYNC_SECRET_TOKEN) {
      return jsonResponse(false, "Từ chối truy cập: Token xác thực không hợp lệ.");
    }

    const entityType = postData.entityType;
    const action = postData.mutation;
    const data = postData.data;

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (entityType === 'batch') {
      syncBatchToSheet(ss, action, data);
    } else if (entityType === 'invoice') {
      syncInvoiceToSheet(ss, action, data);
    }

    return jsonResponse(true, "Đã cập nhật vào Google Sheets thành công.");
  } catch (err) {
    return jsonResponse(false, "Lỗi xử lý trong Apps Script: " + err.toString());
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    "MintPharma Google Apps Script Webhook is active and connected to MySQL HoaDonLoThuoc."
  ).setMimeType(ContentService.MimeType.TEXT);
}

function jsonResponse(success, message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Cập nhật Lô thuốc vào sheet "LoThuoc"
 */
function syncBatchToSheet(ss, action, batch) {
  let sheet = ss.getSheetByName("LoThuoc");
  if (!sheet) return;

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  let foundRow = -1;

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === batch.id || values[i][1] === batch.batchNumber) {
      foundRow = i + 1;
      break;
    }
  }

  if (action === 'DELETE') {
    if (foundRow !== -1) sheet.deleteRow(foundRow);
    return;
  }

  const rowData = [
    batch.id,
    batch.batchNumber,
    batch.batchName,
    batch.supplier,
    formatDateStr(batch.importDate),
    batch.hasInvoice ? "Đã có HĐ" : "Chưa có HĐ",
    batch.invoiceNumber || "—",
    batch.preExpenseTotal || 0,
    batch.expensesTotal || 0,
    batch.postExpenseTotal || 0,
    batch.notes || "",
    new Date().toLocaleString("vi-VN")
  ];

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

/**
 * Cập nhật Hóa đơn, Thuốc và Chi phí vào 3 sheet tương ứng
 */
function syncInvoiceToSheet(ss, action, invoice) {
  if (!invoice) return;

  // 1. Cập nhật Sheet "HoaDon"
  let sheetInv = ss.getSheetByName("HoaDon");
  if (sheetInv) {
    const invValues = sheetInv.getDataRange().getValues();
    let foundRow = -1;
    for (let i = 1; i < invValues.length; i++) {
      if (invValues[i][0] === invoice.id || invValues[i][1] === invoice.invoiceNumber) {
        foundRow = i + 1;
        break;
      }
    }

    if (action === 'DELETE') {
      if (foundRow !== -1) sheetInv.deleteRow(foundRow);
    } else {
      const invRowData = [
        invoice.id,
        invoice.invoiceNumber,
        formatDateStr(invoice.invoiceDate),
        invoice.batchId,
        invoice.batchNumber,
        invoice.preExpenseTotal || 0,
        invoice.expensesTotal || 0,
        invoice.postExpenseTotal || 0,
        invoice.notes || "",
        new Date().toLocaleString("vi-VN")
      ];

      if (foundRow !== -1) {
        sheetInv.getRange(foundRow, 1, 1, invRowData.length).setValues([invRowData]);
      } else {
        sheetInv.appendRow(invRowData);
      }
    }
  }

  // 2. Cập nhật Sheet "DanhSachThuoc" (invoice_items)
  if (invoice.items && Array.isArray(invoice.items)) {
    let sheetItems = ss.getSheetByName("DanhSachThuoc");
    if (sheetItems) {
      invoice.items.forEach(function(item) {
        const itemValues = sheetItems.getDataRange().getValues();
        let itemRow = -1;
        for (let j = 1; j < itemValues.length; j++) {
          if (itemValues[j][0] === item.id) {
            itemRow = j + 1;
            break;
          }
        }

        const itemRowData = [
          item.id,
          invoice.id,
          invoice.invoiceNumber,
          invoice.batchNumber,
          item.medicineName,
          item.specification || "",
          item.unit || "Hộp",
          item.quantity || 0,
          item.unitPrice || 0,
          item.amount || (item.quantity * item.unitPrice) || 0,
          item.notes || ""
        ];

        if (itemRow !== -1) {
          sheetItems.getRange(itemRow, 1, 1, itemRowData.length).setValues([itemRowData]);
        } else {
          sheetItems.appendRow(itemRowData);
        }
      });
    }
  }

  // 3. Cập nhật Sheet "ChiPhiPhatSinh" (expenses)
  if (invoice.expenses && Array.isArray(invoice.expenses)) {
    let sheetExp = ss.getSheetByName("ChiPhiPhatSinh");
    if (sheetExp) {
      invoice.expenses.forEach(function(exp) {
        const expValues = sheetExp.getDataRange().getValues();
        let expRow = -1;
        for (let k = 1; k < expValues.length; k++) {
          if (expValues[k][0] === exp.id) {
            expRow = k + 1;
            break;
          }
        }

        const expRowData = [
          exp.id,
          invoice.id,
          exp.expenseName || exp.title || "Chi phí phát sinh",
          exp.category || "other",
          exp.amount || 0,
          exp.notes || ""
        ];

        if (expRow !== -1) {
          sheetExp.getRange(expRow, 1, 1, expRowData.length).setValues([expRowData]);
        } else {
          sheetExp.appendRow(expRowData);
        }
      });
    }
  }
}

/**
 * 3. TRIGGER KHI NGƯỜI DÙNG SỬA TRỰC TIẾP TRÊN GOOGLE SHEETS (Google Sheets -> MySQL)
 */
function onSpreadsheetEdit(e) {
  try {
    if (!e || !e.range) return;

    const range = e.range;
    const sheet = range.getSheet();
    const sheetName = sheet.getName();
    const row = range.getRow();

    // Bỏ qua dòng tiêu đề
    if (row === 1) return;

    // TH 1: Chỉnh sửa trên sheet "LoThuoc"
    if (sheetName === "LoThuoc") {
      const rowValues = sheet.getRange(row, 1, 1, 11).getValues()[0];
      const batchId = rowValues[0] || ("batch_" + new Date().getTime());
      if (!rowValues[0]) sheet.getRange(row, 1).setValue(batchId); // Điền tự động ID nếu thiếu

      const payload = {
        token: SYNC_SECRET_TOKEN,
        entityType: "batch",
        entityId: batchId,
        mutation: "UPSERT",
        data: {
          id: batchId,
          batchNumber: rowValues[1],
          batchName: rowValues[2],
          supplier: rowValues[3],
          importDate: formatDateStr(rowValues[4]),
          notes: rowValues[10] || ""
        }
      };
      sendWebhookToBackend(payload);
    }

    // TH 2: Chỉnh sửa trên sheet "DanhSachThuoc"
    else if (sheetName === "DanhSachThuoc") {
      const rowValues = sheet.getRange(row, 1, 1, 11).getValues()[0];
      const itemId = rowValues[0] || ("item_" + new Date().getTime());
      if (!rowValues[0]) sheet.getRange(row, 1).setValue(itemId);

      const invoiceId = rowValues[1];
      const quantity = Math.max(0, Number(rowValues[7]) || 0);
      const unitPrice = Math.max(0, Number(rowValues[8]) || 0);
      const amount = Math.round(quantity * unitPrice);

      // Tự động tính lại ô Thành tiền trên Sheet nếu sửa số lượng hoặc đơn giá
      sheet.getRange(row, 10).setValue(amount);

      const payload = {
        token: SYNC_SECRET_TOKEN,
        entityType: "item",
        entityId: itemId,
        mutation: "UPSERT",
        data: {
          id: itemId,
          invoiceId: invoiceId,
          medicineName: rowValues[4],
          specification: rowValues[5],
          unit: rowValues[6],
          quantity: quantity,
          unitPrice: unitPrice,
          amount: amount,
          notes: rowValues[10] || ""
        }
      };
      sendWebhookToBackend(payload);
    }

    // TH 3: Chỉnh sửa trên sheet "ChiPhiPhatSinh"
    else if (sheetName === "ChiPhiPhatSinh") {
      const rowValues = sheet.getRange(row, 1, 1, 6).getValues()[0];
      const expenseId = rowValues[0] || ("exp_" + new Date().getTime());
      if (!rowValues[0]) sheet.getRange(row, 1).setValue(expenseId);

      const payload = {
        token: SYNC_SECRET_TOKEN,
        entityType: "expense",
        entityId: expenseId,
        mutation: "UPSERT",
        data: {
          id: expenseId,
          invoiceId: rowValues[1],
          expenseName: rowValues[2],
          category: rowValues[3] || "other",
          amount: Math.max(0, Number(rowValues[4]) || 0),
          notes: rowValues[5] || ""
        }
      };
      sendWebhookToBackend(payload);
    }
  } catch (err) {
    Logger.log("Lỗi trigger onSpreadsheetEdit: " + err.toString());
  }
}

/**
 * Gửi HTTP Request Webhook từ Google Sheets về Backend MySQL
 */
function sendWebhookToBackend(payload) {
  try {
    UrlFetchApp.fetch(BACKEND_API_URL, {
      method: "post",
      contentType: "application/json",
      headers: {
        "X-Sync-Token": SYNC_SECRET_TOKEN
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log("Không thể gửi Webhook về Backend: " + err.toString());
  }
}

function formatDateStr(d) {
  if (!d) return new Date().toISOString().split('T')[0];
  if (d instanceof Date) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(d).split('T')[0];
}
