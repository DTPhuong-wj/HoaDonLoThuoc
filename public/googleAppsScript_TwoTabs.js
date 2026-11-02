/**
 * ====================================================================
 * GOOGLE APPS SCRIPT: QUẢN LÝ LÔ THUỐC
 * BẢNG SHEET CHỈ GỒM ĐÚNG 5 CỘT THEO YÊU CẦU:
 * 1. stt
 * 2. lô thuốc
 * 3. tên thuốc
 * 4. nhãn
 * 5. ngày nhập
 * 
 * TÊN THUỐC ĐƯỢC TÁCH RA TỪNG DÒNG RIÊNG BIỆT (KHÔNG GỘP)
 * ====================================================================
 */

const TAB_NAME = "QUAN_LY_LO_THUOC";
const SYNC_SECRET_TOKEN = "mint_pharma_secure_sync_secret_token_2026";

/**
 * TẠO MENU TIỆN ÍCH TRÊN GOOGLE SHEETS
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏥 Quản lý Lô thuốc')
    .addItem('1. Khởi tạo Bảng 5 Cột chuẩn (stt, lô thuốc, tên thuốc, nhãn, ngày nhập)', 'setupSheet')
    .addItem('2. Đánh lại Số thứ tự (stt)', 'renumberSTT')
    .addToUi();
}

/**
 * KHỞI TẠO BẢNG 5 CỘT CHUẨN:
 * A: stt
 * B: lô thuốc
 * C: tên thuốc
 * D: nhãn
 * E: ngày nhập
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TAB_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(TAB_NAME);
  }

  const headers = [
    "stt",        // Cột A
    "lô thuốc",   // Cột B
    "tên thuốc",  // Cột C
    "nhãn",       // Cột D
    "ngày nhập"   // Cột E
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold")
             .setFontColor("#ffffff")
             .setBackground("#065f46") // Xanh lá đậm chuẩn ngành Dược
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle")
             .setFontSize(11);

  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 70);  // stt
  sheet.setColumnWidth(2, 170); // lô thuốc
  sheet.setColumnWidth(3, 280); // tên thuốc
  sheet.setColumnWidth(4, 150); // nhãn
  sheet.setColumnWidth(5, 130); // ngày nhập

  sheet.getRange("A:A").setHorizontalAlignment("center").setFontFamily("monospace");
  sheet.getRange("B:B").setHorizontalAlignment("center").setFontWeight("bold").setFontFamily("monospace");
  sheet.getRange("C:C").setHorizontalAlignment("left");
  sheet.getRange("D:D").setHorizontalAlignment("center");
  sheet.getRange("E:E").setHorizontalAlignment("center");

  SpreadsheetApp.getUi().alert(
    "KHỞI TẠO THÀNH CÔNG!",
    "Bảng Quản lý Lô thuốc gồm đúng 5 cột:\n" +
    "1. stt\n" +
    "2. lô thuốc\n" +
    "3. tên thuốc (tách từng dòng riêng biệt)\n" +
    "4. nhãn\n" +
    "5. ngày nhập",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * ĐÁNH LẠI SỐ THỨ TỰ (CỘT A - stt)
 */
function renumberSTT() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TAB_NAME);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const numRows = lastRow - 1;
  const sttValues = [];
  for (let i = 1; i <= numRows; i++) {
    sttValues.push([i]);
  }

  sheet.getRange(2, 1, numRows, 1).setValues(sttValues);
}

/**
 * WEBHOOK XỬ LÝ DỮ LIỆU TỪ WEBSITE GỬI SANG (POST)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  const lockSuccess = lock.tryLock(30000);

  if (!lockSuccess) {
    return createJsonResponse(false, "Hệ thống Google Sheets đang bận, vui lòng thử lại sau.", 429);
  }

  try {
    let rawBody = "";
    if (e && e.postData && e.postData.contents) {
      rawBody = e.postData.contents;
    } else {
      return createJsonResponse(false, "Không tìm thấy dữ liệu yêu cầu", 400);
    }

    const data = JSON.parse(rawBody);

    if (!data.token || data.token !== SYNC_SECRET_TOKEN) {
      return createJsonResponse(false, "Mã xác thực token không hợp lệ", 401);
    }

    const eventId = data.eventId;
    if (eventId) {
      const cache = CacheService.getScriptCache();
      const cached = cache.get(eventId);
      if (cached) {
        return createJsonResponse(true, "Sự kiện đã được xử lý (Idempotent OK)", 200);
      }
      cache.put(eventId, "PROCESSED", 1800);
    }

    const action = data.action;
    const payload = data.payload || {};
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(TAB_NAME);

    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(TAB_NAME);
    }

    // 1. THÊM LÔ THUỐC: TÁCH TỪNG TÊN THUỐC THÀNH TỪNG DÒNG RIÊNG BIỆT TRONG SHEET
    if (action === "CREATE_LOT") {
      const batchNumber = String(payload.batchNumber || "").trim();
      const labelColor = String(payload.labelColor || "Nhãn xanh").trim();
      const importDate = String(payload.importDate || "").trim();

      // Hỗ trợ cả mảng tên thuốc (tách riêng) hoặc 1 tên thuốc
      let medicines = [];
      if (Array.isArray(payload.batchNames) && payload.batchNames.length > 0) {
        medicines = payload.batchNames.map(function(m) { return String(m).trim(); }).filter(Boolean);
      } else if (payload.batchName) {
        medicines = [String(payload.batchName).trim()];
      }

      if (medicines.length === 0) {
        medicines = ["Thuốc chưa đặt tên"];
      }

      let lastRow = sheet.getLastRow();
      for (let i = 0; i < medicines.length; i++) {
        const medName = medicines[i];
        const currentSTT = lastRow; // Dòng 2 -> stt 1, dòng 3 -> stt 2...
        sheet.appendRow([currentSTT, batchNumber, medName, labelColor, importDate]);

        const newRowIdx = sheet.getLastRow();
        sheet.setRowHeight(newRowIdx, 30);
        sheet.getRange(newRowIdx, 1, 1, 5).setVerticalAlignment("middle");

        if (labelColor.toLowerCase().indexOf("xanh") !== -1) {
          sheet.getRange(newRowIdx, 4).setFontColor("#065f46").setFontWeight("bold");
        } else {
          sheet.getRange(newRowIdx, 4).setFontColor("#475569").setFontWeight("bold");
        }

        lastRow = sheet.getLastRow();
      }

      renumberSTT();
      return createJsonResponse(true, "Đã lưu " + medicines.length + " tên thuốc thành từng dòng riêng trên Google Sheets", 200);
    }

    // 2. CẬP NHẬT TỪNG DÒNG THUỐC
    if (action === "UPDATE_LOT") {
      const targetBatchNumber = String(payload.oldBatchNumber || payload.batchNumber || "").trim();
      const targetBatchName = String(payload.oldBatchName || payload.batchName || "").trim();

      const newBatchNumber = String(payload.batchNumber || "").trim();
      const newBatchName = String(payload.batchName || "").trim();
      const newLabelColor = String(payload.labelColor || "Nhãn xanh").trim();
      const newImportDate = String(payload.importDate || "").trim();

      const lastRow = sheet.getLastRow();
      let foundRow = -1;

      if (lastRow > 1) {
        const rows = sheet.getRange(2, 2, lastRow - 1, 2).getValues();
        for (let i = 0; i < rows.length; i++) {
          const rowBatchNum = String(rows[i][0]).trim();
          const rowMedName = String(rows[i][1]).trim();

          if (rowBatchNum === targetBatchNumber && (targetBatchName === "" || rowMedName === targetBatchName)) {
            foundRow = i + 2;
            break;
          }
        }
      }

      if (foundRow !== -1) {
        sheet.getRange(foundRow, 2, 1, 4).setValues([[
          newBatchNumber,
          newBatchName,
          newLabelColor,
          newImportDate
        ]]);

        if (newLabelColor.toLowerCase().indexOf("xanh") !== -1) {
          sheet.getRange(foundRow, 4).setFontColor("#065f46").setFontWeight("bold");
        } else {
          sheet.getRange(foundRow, 4).setFontColor("#475569").setFontWeight("bold");
        }

        return createJsonResponse(true, "Đã cập nhật dòng thuốc trên Google Sheets", 200);
      } else {
        const stt = lastRow;
        sheet.appendRow([stt, newBatchNumber, newBatchName, newLabelColor, newImportDate]);
        renumberSTT();
        return createJsonResponse(true, "Đã thêm mới dòng thuốc vào Google Sheets", 200);
      }
    }

    // 3. XÓA: THEO YÊU CẦU, KHI XÓA THÌ KHÔNG CẬP NHẬT SHEET (GIỮ NGUYÊN DỮ LIỆU TRÊN SHEET)
    if (action === "DELETE_LOT") {
      return createJsonResponse(true, "Sheet chỉ lưu khi thêm mới và sửa. Dữ liệu trên Sheet được giữ nguyên.", 200);
    }

    return createJsonResponse(false, "Action không hỗ trợ: " + action, 400);

  } catch (error) {
    return createJsonResponse(false, "Lỗi máy chủ Google Apps Script: " + error.toString(), 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Phản hồi GET: Nạp danh sách các dòng thuốc từ Google Sheet về Web
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(TAB_NAME);
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(TAB_NAME);
    }

    const lastRow = sheet.getLastRow();
    const batches = [];

    if (lastRow > 1) {
      const values = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        const batchNumber = String(row[1] || "").trim();
        const batchName = String(row[2] || "").trim();
        if (batchNumber || batchName) {
          const rawColor = String(row[3] || "").toLowerCase();
          const labelColor = rawColor.indexOf("xanh") !== -1 ? "green" : "white";
          let importDateStr = "";
          if (row[4] instanceof Date) {
            importDateStr = Utilities.formatDate(row[4], Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");
          } else {
            importDateStr = String(row[4] || "").trim();
          }

          batches.push({
            id: "sheet_row_" + (i + 1) + "_" + (batchNumber ? batchNumber.replace(/[^a-zA-Z0-9]/g, "_") : i),
            batchNumber: batchNumber || ("LO-" + (i + 1)),
            batchName: batchName || "Thuốc",
            labelColor: labelColor,
            importDate: importDateStr,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        columns: ["stt", "lô thuốc", "tên thuốc", "nhãn", "ngày nhập"],
        batches: batches,
        total: batches.length,
        timestamp: new Date().toISOString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: err.toString(),
        timestamp: new Date().toISOString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function createJsonResponse(success, message, code) {
  const output = {
    success: success,
    message: message,
    statusCode: code,
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}
