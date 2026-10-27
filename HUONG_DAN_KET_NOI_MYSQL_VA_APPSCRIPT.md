# HƯỚNG DẪN CHI TIẾT: KẾT NỐI GIAO DIỆN WEB VỚI MYSQL VÀ GOOGLE APPS SCRIPT
*Dự án: MintPharma - Quản lý & Đối chiếu Hóa đơn Lô thuốc*

---

## 📌 SƠ ĐỒ KIẾN TRÚC KẾT NỐI

```
┌─────────────────────────┐          ┌──────────────────────────┐          ┌──────────────────────────┐
│   GIAO DIỆN WEB (VITE)  │ ◄──────► │   BACKEND API (EXPRESS)  │ ◄──────► │      MYSQL DATABASE      │
│  http://localhost:5173  │  Proxy   │   http://0.0.0.0:5000    │   Pool   │     `HoaDonLoThuoc`      │
└─────────────────────────┘          └────────────┬─────────────┘          └──────────────────────────┘
                                                  │
                                   Hàng đợi đồng bộ 2 chiều (Durable Queue)
                                                  │
                                                  ▼
                                     ┌──────────────────────────┐
                                     │    GOOGLE APPS SCRIPT    │
                                     │       (WEB HOOK)         │
                                     └────────────┬─────────────┘
                                                  │
                                                  ▼
                                     ┌──────────────────────────┐
                                     │      GOOGLE SHEETS       │
                                     │  4 Sheet: LoThuoc,       │
                                     │  HoaDon, DanhSachThuoc,  │
                                     │  ChiPhiPhatSinh          │
                                     └──────────────────────────┘
```

---

## PHẦN I: KẾT NỐI GIAO DIỆN WEB VỚI MYSQL `HoaDonLoThuoc`

### Bước 1: Chuẩn bị file cấu hình `.env`
Hệ thống đọc thông tin kết nối từ file `.env` ở thư mục gốc `d:\Code\donthuoc_CT\.env`. Hãy đảm bảo file `.env` của bạn có nội dung:

```env
# 1. CẤU HÌNH KẾT NỐI MYSQL SERVER
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=HoaDonLoThuoc
DB_USER=root
DB_PASSWORD=

# 2. CẤU HÌNH BACKEND SERVER
PORT=5000
HOST=0.0.0.0

# 3. CẤU HÌNH ĐỒNG BỘ GOOGLE SHEETS
GOOGLE_SHEETS_SYNC_ENABLED=true
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbyxaDgUuj0ghTmEtryg1BLv0I29KHkBGmtvw0mGGrjSNSSTpxxrX3wHPFbiUS5w2er9TA/exec
SHEETS_SYNC_SECRET=mint_pharma_secure_sync_secret_token_2026
```

---

### Bước 2: Khởi động hệ thống

Bạn mở cửa sổ **PowerShell** tại thư mục dự án `d:\Code\donthuoc_CT` và chọn 1 trong 2 cách sau:

#### Cách 1: Khởi động đồng thời cả Backend và Giao diện Web (Khuyên dùng)
```powershell
npm run full
```
*Lệnh này chạy song song cả Backend (cổng 5000) và Frontend (cổng 5173).*

#### Cách 2: Chạy ở 2 cửa sổ riêng biệt để theo dõi log
- **Cửa sổ 1 (Khởi động Backend API kết nối MySQL):**
  ```powershell
  npm run server
  ```
  *Màn hình hiển thị:*
  ```text
  [Database] Đang kết nối tới MySQL Server tại 127.0.0.1:3306 (User: root)...
  [Database] Đã xác nhận cơ sở dữ liệu `HoaDonLoThuoc` sẵn sàng.
  [Database] Kết nối thành công vào database `HoaDonLoThuoc` qua Connection Pool.
  [Server] Backend API đang chạy tại: http://0.0.0.0:5000
  [Server] Trạng thái Database: ĐÃ KẾT NỐI MySQL (HoaDonLoThuoc)
  ```

- **Cửa sổ 2 (Khởi động Giao diện Web):**
  ```powershell
  npm run dev
  ```
  *Mở trình duyệt tại:* `http://localhost:5173/`

---

### Bước 3: Dấu hiệu nhận biết đã kết nối MySQL thành công
1. Trên giao diện Web tại `http://localhost:5173/`, nhìn góc trên bên phải thanh Header:
   - **Huy hiệu màu xanh ngọc**: `MySQL: HoaDonLoThuoc` -> Hệ thống đang kết nối trực tiếp với MySQL. Mọi thao tác thêm, sửa, xóa sẽ lưu vào database thật.
   - **Nếu huy hiệu màu vàng cam kèm cảnh báo**: Backend chưa bật hoặc sai mật khẩu MySQL. Hãy kiểm tra lại mật khẩu trong `.env` và chạy lệnh `npm run server`.
2. Kiểm tra trực tiếp bằng lệnh PowerShell:
   ```powershell
   Invoke-RestMethod -Uri http://localhost:5000/api/health
   ```
   Kết quả trả về:
   ```json
   {
     "status": "ONLINE",
     "connected": true,
     "service": "MintPharma API Backend",
     "database": "HoaDonLoThuoc"
   }
   ```

---

### Bước 4: Kiểm tra dữ liệu được lưu bằng MySQL Workbench
1. Mở phần mềm **MySQL Workbench**, đăng nhập bằng tài khoản `root` và mật khẩu `...`.
2. Mở một tab Query mới và chạy:
   ```sql
   USE HoaDonLoThuoc;
   
   -- 1. Xem danh sách các lô thuốc
   SELECT * FROM batches ORDER BY import_date DESC;

   -- 2. Xem danh sách hóa đơn nhập hàng
   SELECT * FROM invoices;

   -- 3. Xem chi tiết danh mục thuốc theo hóa đơn
   SELECT * FROM invoice_items;

   -- 4. Xem các khoản chi phí phát sinh
   SELECT * FROM expenses;
   ```
3. Khi bạn thêm 1 lô mới trên web (ví dụ: `LO-TEST-999`), bản ghi sẽ ngay lập tức xuất hiện trong bảng `batches` của MySQL Workbench.

---

## PHẦN II: KẾT NỐI HỆ THỐNG VỚI GOOGLE APPS SCRIPT (GOOGLE SHEETS)

Cơ chế đồng bộ gồm 2 chiều:
- **Chiều 1 (Web/MySQL sang Google Sheets):** Khi bạn thêm/sửa trên Web hoặc lưu vào MySQL, Backend tự động đẩy sang Google Sheets thông qua URL Web App.
- **Chiều 2 (Google Sheets sang MySQL):** Khi bạn hoặc nhân viên chỉnh sửa trực tiếp trên Google Sheets, Google Apps Script tự động gửi webhook về Backend để cập nhật ngược lại MySQL.

---

### Bước 1: Mở Google Sheets và dán mã Google Apps Script
1. Truy cập [Google Sheets](https://sheets.new) để tạo một bảng tính mới (đặt tên: `HoaDonLoThuoc_DongBo`).
2. Trên thanh menu, bấm **Tiện ích mở rộng (Extensions)** -> **Apps Script**.
3. Xóa toàn bộ mã mặc định và dán toàn bộ mã nguồn từ file:
   [`server/scripts/googleAppsScript.js`](file:///d:/Code/donthuoc_CT/server/scripts/googleAppsScript.js)
4. Bấm biểu tượng đĩa mềm **Lưu (Save)** (phím tắt `Ctrl + S`).

---

### Bước 2: Tự động khởi tạo 4 Sheet chuẩn theo MySQL (Chỉ 1 click)
1. Quay lại tab trình duyệt Google Sheets và nhấn **F5** để tải lại trang.
2. Bạn sẽ thấy trên thanh menu xuất hiện menu mới: **`🏥 MintPharma DB`**.
3. Bấm chọn: **`1. Tự động tạo 4 Sheet chuẩn theo MySQL`**.
4. Cấp quyền truy cập nếu Google yêu cầu. Sau 2 giây, Google Sheets sẽ tự động tạo đủ 4 tab với màu sắc và tiêu đề chuẩn 100% theo các bảng trong MySQL:
   - **`LoThuoc`** (khớp bảng `batches`): Mã ID, Số lô, Tên lô, NCC, Ngày nhập, Trạng thái HĐ, Số HĐ, Tiền trước CP, Phụ phí, Tiền sau CP, Ghi chú.
   - **`HoaDon`** (khớp bảng `invoices`): Mã HĐ, Số hóa đơn, Ngày HĐ, Mã Lô, Số lô, Tiền thuốc trước CP, Chi phí phát sinh, Tổng thanh toán, Ghi chú.
   - **`DanhSachThuoc`** (khớp bảng `invoice_items`): Mã Item, Mã HĐ, Số HĐ, Số lô, Tên thuốc, Quy cách, ĐVT, Số lượng, Đơn giá, Thành tiền, Ghi chú.
   - **`ChiPhiPhatSinh`** (khớp bảng `expenses`): Mã Chi phí, Mã HĐ, Tên chi phí, Phân loại, Số tiền, Ghi chú.

---

### Bước 3: Triển khai Web App để nhận dữ liệu từ Backend
1. Ở góc trên bên phải màn hình Apps Script, bấm nút **Triển khai (Deploy)** -> **Tùy chọn triển khai mới (New deployment)**.
2. Bấm vào biểu tượng bánh răng chọn loại: **Ứng dụng web (Web app)**.
3. Điền cấu hình:
   - *Mô tả*: `MintPharma Sync Webhook`
   - *Thực thi dưới dạng (Execute as)*: `Tôi (Me)`
   - *Ai có quyền truy cập (Who has access)*: `Bất kỳ ai (Anyone)` *(Bắt buộc chọn Anyone để Backend có thể gửi dữ liệu vào)*
4. Bấm **Triển khai (Deploy)**.
5. Google sẽ cấp cho bạn một đường dẫn **URL ứng dụng web** (dạng: `https://script.google.com/macros/s/AKfycb.../exec`).
6. Dán URL này vào dòng `GOOGLE_APPS_SCRIPT_URL` trong file `.env` của Backend:
   ```env
   GOOGLE_SHEETS_SYNC_ENABLED=true
   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbyxaDgUuj0ghTmEtryg1BLv0I29KHkBGmtvw0mGGrjSNSSTpxxrX3wHPFbiUS5w2er9TA/exec
   ```

---

### Bước 4: Cài đặt Trigger để đồng bộ chiều ngược lại (Google Sheets -> MySQL)
Nếu bạn muốn khi sửa trực tiếp trên Google Sheets thì dữ liệu tự động lưu vào MySQL:
1. Trong cửa sổ Google Apps Script, ở cột menu bên trái, bấm biểu tượng chiếc đồng hồ **Kích hoạt (Triggers)**.
2. Bấm nút màu xanh **+ Thêm trình kích hoạt (Add Trigger)** ở góc dưới bên phải.
3. Điền thông số:
   - *Chọn hàm để chạy*: **`onSpreadsheetEdit`**
   - *Chọn nguồn sự kiện*: **`Từ bảng tính (From spreadsheet)`**
   - *Chọn loại sự kiện*: **`Khi chỉnh sửa (On edit)`**
4. Bấm **Lưu (Save)**.

> **Lưu ý về URL Backend cho Google Sheets:**
> Google Apps Script chạy trên đám mây của Google nên không thể gọi trực tiếp `http://localhost:5000`. Để Google Sheets gửi được dữ liệu về máy bạn, hãy mở một đường link công khai bằng lệnh PowerShell:
> ```powershell
> npx cloudflared tunnel --url http://localhost:5000
> ```
> Link xuất hiện (ví dụ: `https://my-tunnel.trycloudflare.com`). Bạn dán vào dòng 35 của Google Apps Script:
> ```javascript
> const BACKEND_API_URL = "https://my-tunnel.trycloudflare.com/api/sync/from-sheets";
> ```

---

## PHẦN III: QUY TRÌNH KIỂM THỬ THỰC TẾ

| Bước thử nghiệm | Thao tác thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- |
| **Test 1: Web -> MySQL** | Mở Web `http://localhost:5173/`, bấm "+ Thêm lô mới", nhập số lô `LO-DEMO-01` | Dữ liệu lưu ngay vào bảng `batches` trong MySQL Workbench. |
| **Test 2: MySQL -> Google Sheets** | Xem Google Sheets tab `LoThuoc` | Dòng mới `LO-DEMO-01` tự động xuất hiện với đầy đủ thông tin nhà cung cấp, ngày nhập. |
| **Test 3: Lập Hóa đơn** | Trên Web, bấm "Lập hóa đơn mới" cho lô thuốc vừa tạo, nhập danh mục 2 loại thuốc và 1 khoản phí vận chuyển | Bảng `invoices`, `invoice_items`, `expenses` trong MySQL đều có dữ liệu. Tab `HoaDon`, `DanhSachThuoc`, `ChiPhiPhatSinh` trên Google Sheets đồng loạt cập nhật. |
| **Test 4: Sửa trên Google Sheets** | Vào Google Sheets tab `LoThuoc`, sửa ghi chú của lô `LO-DEMO-01` | MySQL cập nhật ghi chú mới; tải lại trang Web thấy ghi chú đã thay đổi! |

---

## PHẦN IV: CÁC LỖI THƯỜNG GẶP VÀ CÁCH XỬ LÝ

1. **Lỗi `http proxy error: /api/health Error: connect ECONNREFUSED 127.0.0.1:5000`:**
   - *Nguyên nhân*: Bạn mới chỉ chạy `npm run dev` (Frontend) mà chưa khởi động Backend (cổng 5000).
   - *Cách khắc phục*: Mở thêm 1 cửa sổ PowerShell và chạy lệnh `npm run server` (hoặc dùng `npm run full` để chạy cả hai cùng lúc).

2. **Lỗi `Access denied for user 'root'@'localhost'`:**
   - *Nguyên nhân*: Sai mật khẩu MySQL trong file `.env`.
   - *Cách khắc phục*: Mở file `.env`, sửa lại dòng `DB_PASSWORD=mật_khẩu_chuẩn_của_bạn`, sau đó khởi động lại backend.

3. **Giao diện báo "Cổng 5000 đang bận (EADDRINUSE)":**
   - *Nguyên nhân*: Có tiến trình server cũ đang chạy ngầm chiếm cổng 5000.
   - *Cách khắc phục*: Mở PowerShell và chạy lệnh tắt tiến trình Node:
     ```powershell
     Get-Process node | Stop-Process -Force
     npm run full
     ```

---
*Chúc bạn vận hành hệ thống MintPharma quản lý lô thuốc và hóa đơn thành công!*
