# HƯỚNG DẪN CHI TIẾT: KẾT NỐI GIAO DIỆN WEB VỚI MYSQL VÀ GOOGLE APPS SCRIPT
*Dự án: MintPharma - Quản lý & Đối chiếu Hóa đơn Lô thuốc*
*Cập nhật: Cơ chế đồng bộ 1 chiều tự động (MySQL -> Google Sheets) trên 1 Bảng tổng hợp duy nhất `HoaDonLoThuoc` & Đánh số thứ tự (STT) tự động*

---

## 📌 SƠ ĐỒ KIẾN TRÚC HỆ THỐNG ĐỒNG BỘ 1 CHIỀU

```
┌─────────────────────────┐          ┌──────────────────────────┐          ┌──────────────────────────┐
│   GIAO DIỆN WEB (VITE)  │ ◄──────► │   BACKEND API (EXPRESS)  │ ◄──────► │      MYSQL DATABASE      │
│  http://localhost:5173  │  Proxy   │   http://0.0.0.0:5000    │   Pool   │     `HoaDonLoThuoc`      │
│ STT tăng dần 1, 2, 3... │          │  (Tự động đẩy webhook)   │          │ (Dữ liệu gốc chính xác)  │
└─────────────────────────┘          └────────────┬─────────────┘          └──────────────────────────┘
                                                  │
                                   Hàng đợi đồng bộ 1 chiều (MySQL -> Sheets)
                                                  │
                                                  ▼
                                     ┌──────────────────────────┐
                                     │    GOOGLE APPS SCRIPT    │
                                     │       (WEB HOOK)         │
                                     └────────────┬─────────────┘
                                                  │
                                                  ▼
                                     ┌──────────────────────────┐
                                     │   GOOGLE SPREADSHEET     │
                                     │  1 Sheet: HoaDonLoThuoc  │
                                     │  Cột A: STT tự động 1..N │
                                     └──────────────────────────┘
```

### Ưu điểm vượt trội của thiết kế mới:
1. **Chỉ dùng 1 Sheet duy nhất (`HoaDonLoThuoc`)**: Toàn bộ thông tin: Số lô, Tên thuốc, NCC, Ngày nhập, Trạng thái HĐ, Số HĐ, Ngày HĐ, Danh mục các thuốc, Tiền hàng trước CP, Phụ phí, Tổng tiền sau CP, Chi tiết chi phí và Ghi chú đều hiển thị trên cùng 1 hàng trực quan.
2. **Đồng bộ 1 chiều tự động (MySQL -> Google Sheets)**:
   - Khi MySQL có bản ghi mới: Tự động thêm dòng mới vào Google Sheets.
   - Khi MySQL cập nhật dữ liệu: Tự động cập nhật đúng dòng tương ứng.
   - Khi xóa bản ghi trong MySQL/Web: Tự động xóa dòng trên Google Sheets.
   - Không cần thao tác thủ công, không cần cài đặt trigger `onEdit`, không cần mở port hay tạo tunnel (ngrok / Cloudflare) về máy cá nhân!
3. **Cột STT (Số Thứ Tự) chuẩn xác 100%**:
   - Trên Giao diện Web: Cột STT luôn tăng dần liên tục từ 1 (1, 2, 3, 4, 5...). Khi thêm, xóa hoặc lọc theo nhà cung cấp/trạng thái, STT tự động tính lại ngay lập tức.
   - Trên Google Sheets: Cột A (STT) tự động được hàm `renumberSTT()` đánh số lại liên tục từ 1 đến hết sau mỗi lần thêm/xóa.
   - Tuyệt đối không can thiệp hay thay đổi ID/Khóa chính của database MySQL.

---

## PHẦN I: KẾT NỐI GIAO DIỆN WEB VỚI MYSQL `HoaDonLoThuoc`

### Bước 1: Chuẩn bị file cấu hình `.env`
Hệ thống đọc thông tin kết nối từ file `.env` ở thư mục gốc `d:\Code\donthuoc_CT\.env`:

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

# 3. CẤU HÌNH ĐỒNG BỘ 1 CHIỀU GOOGLE SHEETS
GOOGLE_SHEETS_SYNC_ENABLED=true
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbyxaDgUuj0ghTmEtryg1BLv0I29KHkBGmtvw0mGGrjSNSSTpxxrX3wHPFbiUS5w2er9TA/exec
SHEETS_SYNC_SECRET=mint_pharma_secure_sync_secret_token_2026
```

---

### Bước 2: Khởi động hệ thống

Bạn mở cửa sổ **PowerShell** tại thư mục dự án `d:\Code\donthuoc_CT`:

#### Cách khuyên dùng: Khởi động đồng thời cả Backend và Giao diện Web
```powershell
npm run full
```
*Lệnh này chạy song song cả Backend (cổng 5000 kết nối MySQL) và Frontend (cổng 5173).*

#### Hoặc chạy ở 2 cửa sổ riêng biệt để xem log:
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
1. Trên thanh Header giao diện Web `http://localhost:5173/`:
   - **Huy hiệu màu xanh ngọc**: `MySQL: HoaDonLoThuoc` -> Đang kết nối trực tiếp với MySQL.
   - **Tên Dược sĩ quản lý**: Đã cập nhật chuẩn **Vũ Mai Thanh**.
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
Mở phần mềm **MySQL Workbench**, kết nối tới `root` và kiểm tra các bảng:
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

---

## PHẦN II: CÀI ĐẶT ĐỒNG BỘ 1 CHIỀU SANG GOOGLE SHEETS (1 SHEET DUY NHẤT)

### Bước 1: Mở Google Spreadsheet và dán mã Apps Script
1. Truy cập [Google Sheets](https://sheets.new) để tạo một bảng tính mới (đặt tên: `HoaDonLoThuoc_DongBo`).
2. Trên thanh menu, bấm **Tiện ích mở rộng (Extensions)** -> **Apps Script**.
3. Xóa toàn bộ nội dung mặc định trong trình soạn thảo, sau đó sao chép toàn bộ mã nguồn trong file:
   [`server/scripts/googleAppsScript.js`](file:///d:/Code/donthuoc_CT/server/scripts/googleAppsScript.js)
   và dán vào.
4. Bấm biểu tượng đĩa mềm **Lưu (Save)** (phím tắt `Ctrl + S`).

---

### Bước 2: Tự động khởi tạo giao diện 1 Sheet duy nhất
1. Quay lại tab trình duyệt Google Sheets và nhấn **F5** để tải lại trang.
2. Trên thanh menu xuất hiện menu: **`🏥 MintPharma DB`**.
3. Bấm chọn: **`1. Khởi tạo Bảng tổng hợp duy nhất`**.
4. Cấp quyền truy cập cho script nếu Google hiện bảng xác nhận.
5. Sau 2 giây, bảng tính sẽ tự động tạo tab **`HoaDonLoThuoc`** với tiêu đề màu xanh Soft Mint phong cách nhà thuốc chuyên nghiệp gồm 16 cột:
   - **Cột A**: `STT` (Tự động đánh 1, 2, 3... liên tục)
   - **Cột B**: `Số Lô`
   - **Cột C**: `Tên Lô Thuốc`
   - **Cột D**: `Nhà Cung Cấp`
   - **Cột E**: `Ngày Nhập Kho`
   - **Cột F**: `Trạng Thái HĐ` (Đã có HĐ / Chưa có HĐ)
   - **Cột G**: `Số Hóa Đơn`
   - **Cột H**: `Ngày Hóa Đơn`
   - **Cột I**: `Danh Mục Thuốc Trong Lô` (Gộp tên thuốc, số lượng, ĐVT)
   - **Cột J**: `Tiền Hàng Trước CP` (Định dạng VND)
   - **Cột K**: `Chi Phí Phát Sinh` (Định dạng VND)
   - **Cột L**: `Tổng Tiền Sau CP` (Định dạng VND)
   - **Cột M**: `Chi Tiết Chi Phí Phát Sinh` (Tên phí + số tiền)
   - **Cột N**: `Ghi Chú`
   - **Cột O**: `Mã ID Lô (Hệ thống)`
   - **Cột P**: `Cập Nhật Lúc`

---

### Bước 3: Triển khai Web App để nhận dữ liệu từ Backend
1. Ở góc trên bên phải màn hình Apps Script, bấm nút **Triển khai (Deploy)** -> **Tùy chọn triển khai mới (New deployment)**.
2. Chọn loại triển khai: **Ứng dụng web (Web app)**.
3. Cấu hình:
   - *Mô tả*: `MintPharma 1-Way Sync`
   - *Thực thi dưới dạng (Execute as)*: `Tôi (Me)`
   - *Ai có quyền truy cập (Who has access)*: **`Bất kỳ ai (Anyone)`** *(Bắt buộc chọn Anyone để Backend đẩy dữ liệu qua)*
4. Bấm **Triển khai (Deploy)**.
5. Sao chép **URL ứng dụng web** (có dạng `https://script.google.com/macros/s/AKfycb.../exec`).
6. Dán URL này vào dòng `GOOGLE_APPS_SCRIPT_URL` trong file `.env` của Backend:
   ```env
   GOOGLE_SHEETS_SYNC_ENABLED=true
   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## PHẦN III: QUY TẮC HIỂN THỊ STT (SỐ THỨ TỰ) VÀ KIỂM THỬ

### 1. Quy tắc hiển thị STT trên Giao diện Web:
- Bắt đầu từ 1.
- Tăng liên tục theo thứ tự các dòng đang hiển thị: 1, 2, 3, 4, 5...
- Khi xóa một dòng bất kỳ, giao diện tự động cập nhật lại STT của các dòng còn lại.
- Khi thêm một dòng mới, STT được cập nhật chuẩn xác theo vị trí hiển thị.
- Khi tìm kiếm hoặc lọc theo nhà cung cấp / trạng thái hóa đơn, STT được tính lại theo danh sách đang lọc.
- **Không sử dụng STT làm ID dữ liệu**: STT chỉ là số thứ tự render trên giao diện (`index + 1`), không thay thế ID thật trong MySQL. Mọi thao tác sửa, xóa đều gọi API bằng ID thật của bản ghi.

### 2. Quy trình kiểm thử thực tế:

| Bước thử nghiệm | Thao tác thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- |
| **Test 1: Thêm lô thuốc mới** | Bấm "+ Thêm lô thuốc mới", nhập số lô `LO-2026-001`, NCC `Dược Hậu Giang` | Dữ liệu lưu vào MySQL. Web hiển thị STT `1`. Google Sheets tự động xuất hiện dòng `LO-2026-001` với STT `1`. |
| **Test 2: Thêm lô thứ 2 & 3** | Thêm tiếp 2 lô `LO-2026-002` và `LO-2026-003` | Cả Web và Google Sheets hiển thị STT liên tục `1, 2, 3`. |
| **Test 3: Lập hóa đơn và chi phí** | Bấm "Tạo hóa đơn" cho `LO-2026-001`, thêm 2 loại thuốc và 1 phí vận chuyển | Tiền hàng, danh mục thuốc và phụ phí tự động hiển thị trong cột tương ứng trên Google Sheets. |
| **Test 4: Lọc / Tìm kiếm** | Nhập từ khóa tìm kiếm trên Web | Bảng chỉ hiện các dòng khớp, STT của các dòng được đánh lại từ 1, 2... không bị đứt đoạn. |
| **Test 5: Xóa dòng** | Xóa dòng thứ 2 (`LO-2026-002`) | Trên Web, các dòng còn lại tự động mang STT `1, 2`. Trên Google Sheets, dòng bị xóa biến mất và STT tự động renumber lại từ `1, 2`. |

---
*Hệ thống đã sẵn sàng vận hành hoàn chỉnh với kiến trúc 1 Sheet tối giản, đồng bộ 1 chiều tự động và STT chuẩn xác!*
