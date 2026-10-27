# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN LÝ HÓA ĐƠN LÔ THUỐC (MINTPHARMA)
*Dành cho người quản lý hiệu thuốc, dược sĩ, kế toán và nhân viên phụ trách kho*

---

## 1. Giới thiệu tổng quan hệ thống

**MintPharma** là hệ thống quản lý, tra cứu và kiểm tra hóa đơn nhập hàng theo từng lô thuốc dành cho hiệu thuốc nội bộ. Hệ thống được thiết kế theo phong cách hiện đại **Soft Mint Pharmacy**, kết nối trực tiếp với Cơ sở dữ liệu **MySQL Server** (`HoaDonLoThuoc`) và hỗ trợ **Đồng bộ hai chiều với Google Sheets**.

### Tính năng chính
1. **Tra cứu & Đối chiếu lô thuốc thông minh**: Nhập số lô để kiểm tra ngay 3 tình trạng thực tế:
   - *Trường hợp 1*: Lô đã có hóa đơn (hiển thị chi tiết tiền thuốc, danh mục thuốc, chi phí phát sinh và tổng thanh toán).
   - *Trường hợp 2*: Lô chưa có hóa đơn (hiển thị cảnh báo màu hổ phách và nút "Tạo hóa đơn cho lô này" nhanh chóng).
   - *Trường hợp 3*: Lô chưa từng tồn tại trong hệ thống (gợi ý tạo lô mới tức thì).
2. **Quản lý danh sách Lô thuốc**: Thêm mới, chỉnh sửa thông tin nhà cung cấp, ngày nhập kho, ghi chú và xóa lô.
3. **Quản lý Hóa đơn & Bảng tính chi phí nhập hàng**:
   - Chi tiết từng mặt hàng thuốc (Tên thuốc, quy cách, đơn vị, số lượng, đơn giá, thành tiền).
   - Chi phí phát sinh (Vận chuyển, bốc xếp, lưu kho lạnh, kiểm định chất lượng, khác).
   - Tự động tính toán: `Tổng thanh toán sau chi phí = Tổng tiền thuốc + Tổng chi phí phát sinh`.
4. **Báo cáo & Thống kê**: Tỷ lệ lô đã có hóa đơn, tổng giá trị hàng nhập, cơ cấu chi phí phát sinh.
5. **Đồng bộ hai chiều Google Sheets**: Dữ liệu lưu vào MySQL được tự động chuyển sang Google Sheets và các thay đổi hợp lệ từ Google Sheets tự động cập nhật về MySQL qua hàng đợi bền vững.

---

## 2. Hướng dẫn thiết lập ban đầu (Dành cho quản trị viên)

### Bước 2.1: Cấu hình file môi trường `.env`
Trong thư mục gốc của dự án `d:\Code\donthuoc_CT\`, hãy tạo một file có tên `.env` (hoặc sao chép từ file [.env.example](file:///d:/Code/donthuoc_CT/.env.example)) và điền thông tin tài khoản MySQL của bạn:

```env
# Cấu hình Cổng Backend
PORT=5000
HOST=0.0.0.0

# Cấu hình kết nối MySQL Server trên máy tính của bạn
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=HoaDonLoThuoc
DB_USER=root
DB_PASSWORD=MẬT_KHẨU_MYSQL_CỦA_BẠN

# Cấu hình Đồng bộ Google Sheets (Nếu chưa dùng, có thể để false)
GOOGLE_SHEETS_SYNC_ENABLED=false
GOOGLE_APPS_SCRIPT_URL=
SHEETS_SYNC_SECRET=MintPharmaSecureKey2026
```

> **Lưu ý bảo mật quan trọng:**
> - Tuyệt đối không xóa dòng `DB_NAME=HoaDonLoThuoc`.
> - Điền mật khẩu MySQL thật của bạn vào `DB_PASSWORD`.
> - File `.env` đã được cấu hình trong `.gitignore`, không bao giờ bị đẩy lên GitHub.

---

### Bước 2.2: Khởi động hệ thống

Bạn mở cửa sổ **PowerShell** tại thư mục dự án `d:\Code\donthuoc_CT` và chạy lệnh:

#### Cách 1: Khởi động đồng thời cả Backend và Frontend (Khuyên dùng)
```powershell
npm run full
```
*Lệnh này sẽ tự động khởi chạy cả Backend API (cổng 5000) và giao diện Web (cổng 5173).*

#### Cách 2: Khởi động riêng biệt từng dịch vụ (Nếu muốn theo dõi log chi tiết)
- **Cửa sổ PowerShell 1 (Backend API):**
  ```powershell
  npm run server
  ```
  *Backend sẽ tự động kiểm tra database `HoaDonLoThuoc`, tự tạo cấu trúc bảng an toàn (không làm mất dữ liệu) và nạp 5 lô thuốc mẫu thực tế nếu database đang trống.*

- **Cửa sổ PowerShell 2 (Giao diện Web Frontend):**
  ```powershell
  npm run dev
  ```

---

## 3. Hướng dẫn sử dụng chi tiết từng màn hình

### 3.1. Màn hình "Tổng quan" (Dashboard)
Khi mở trình duyệt tại địa chỉ `http://localhost:5173/`, bạn sẽ thấy:
- **Thanh trạng thái Cơ sở dữ liệu ở góc trên bên phải**:
  - Huy hiệu màu xanh ngọc: `MySQL: HoaDonLoThuoc (Đã kết nối)` nghĩa là mọi thao tác của bạn sẽ được lưu trực tiếp vào database MySQL thật.
  - Huy hiệu màu vàng cam: `Chưa kết nối MySQL (Offline)` kèm cảnh báo hướng dẫn kiểm tra file `.env`.
- **4 Thẻ số liệu thống kê (KPIs)**:
  - *Tổng số lô thuốc*: Tổng số lô đã nhập trong kho.
  - *Đã có hóa đơn*: Số lượng lô đã hoàn tất đối soát hóa đơn tài chính.
  - *Chưa có hóa đơn*: Số lượng lô hàng đang đợi hóa đơn (kèm huy hiệu cảnh báo cần xử lý).
  - *Tổng chi phí phát sinh*: Tổng chi phí vận chuyển, kho bãi, kiểm định đã cộng vào giá vốn.
- **Phím tắt tra cứu nhanh**: Bấm vào các lô mẫu để kiểm tra tức thì.
- **Danh sách lô thuốc nhập gần đây**: Hiển thị bảng tổng hợp kèm nút "Tra cứu nhanh" và "Tạo HĐ".

---

### 3.2. Màn hình "Tra cứu & Đối chiếu" (Core Feature)
Màn hình này giúp nhân viên kiểm soát hóa đơn khi nhận hàng vào kho:
1. **Tìm kiếm linh hoạt**:
   - Nhập **Số lô** (ví dụ: `LO-DHG-202601`, `LO-IMEX-202603`).
   - Nhập **Tên hoạt chất / biệt dược** (ví dụ: `Paracetamol`, `Ceftriaxone`, `Boganic`).
   - Nhập **Số hóa đơn** (ví dụ: `HD-DHG-88219`, `HD-TRP-4512`).
   - Bấm nút tìm kiếm hoặc nhấn phím Enter.
2. **Xử lý 3 kịch bản thực tế**:
   - **Kịch bản 1: Lô ĐÃ CÓ hóa đơn**:
     - Hiển thị huy hiệu xanh lá `Đã có hóa đơn`.
     - Xem thông tin số hóa đơn, ngày lập hóa đơn.
     - Xem bảng danh mục thuốc trong hóa đơn (Tên thuốc, Đơn vị, Quy cách, Số lượng, Đơn giá, Thành tiền).
     - Xem bảng chi phí phát sinh và bảng đối chiếu tài chính:
       - *Tiền hàng trước chi phí*: Tổng tiền gốc thuốc.
       - *Chi phí phát sinh*: Tiền vận chuyển, lưu kho,...
       - *Tổng tiền sau chi phí*: Giá vốn thực tế sau khi tính chi phí.
   - **Kịch bản 2: Lô CHƯA CÓ hóa đơn**:
     - Hiển thị hộp cảnh báo màu hổ phách: `Lô này chưa được gán hóa đơn tài chính`.
     - Xuất hiện nút nổi bật: **"Tạo hóa đơn cho lô này ngay"**.
     - Khi bấm nút, hệ thống tự động mở form lập hóa đơn và điền sẵn mã lô, tên lô và nhà cung cấp.
   - **Kịch bản 3: Lô CHƯA TỒN TẠI trong hệ thống**:
     - Hiển thị thông báo không tìm thấy kết quả.
     - Xuất hiện nút: **"Thêm mới lô thuốc [Số lô vừa gõ]"**. Bấm vào để tạo mới ngay lập tức.

---

### 3.3. Màn hình "Quản lý Lô thuốc"
Cho phép quản lý vòng đời của các lô nhập kho:
- **Lọc danh sách**:
  - Lọc theo trạng thái: *Tất cả*, *Đã có HĐ*, *Chưa có HĐ*.
  - Lọc theo Nhà cung cấp: Dược Hậu Giang, Sanofi, Imexpharm, Traphaco, Stellapharm,...
  - Sắp xếp theo ngày nhập (Mới nhất / Cũ nhất).
- **Thêm mới lô thuốc**:
  - Bấm nút **"+ Thêm lô mới"** ở góc trên.
  - Điền: Số lô (bắt buộc, duy nhất), Tên lô / Mô tả, Nhà cung cấp, Ngày nhập hàng, Ghi chú.
  - Bấm **"Lưu vào MySQL"**. Dữ liệu sẽ lưu ngay vào bảng `batches`.
- **Chỉnh sửa lô thuốc**:
  - Bấm biểu tượng cây bút tại dòng tương ứng, sửa thông tin và bấm Lưu.
- **Xóa lô thuốc**:
  - Bấm biểu tượng thùng rác. Hệ thống sẽ hiển thị hộp thoại xác nhận an toàn trước khi xóa khỏi database.

---

### 3.4. Màn hình "Quản lý Hóa đơn"
Nơi quản lý chứng từ hóa đơn GTGT và chi tiết các khoản chi phí:
- **Lập hóa đơn mới**:
  - Bấm nút **"+ Lập hóa đơn mới"**.
  - Chọn lô thuốc cần gán hóa đơn (danh sách chỉ gợi ý các lô chưa có hóa đơn để chống gán trùng).
  - Điền: Số hóa đơn (ví dụ: `HD-2026-001`), Ngày lập hóa đơn, Ghi chú.
  - **Nhập danh mục thuốc**:
    - Bấm *"+ Thêm thuốc"* để thêm dòng.
    - Điền tên thuốc, quy cách, đơn vị tính (Hộp, Lọ, Vỉ, Ống), số lượng và đơn giá.
    - Thành tiền tự động tính: `Thành tiền = Số lượng × Đơn giá`.
  - **Nhập các chi phí phát sinh**:
    - Bấm *"+ Thêm chi phí"*.
    - Chọn loại chi phí: Vận chuyển, Bốc xếp, Lưu kho lạnh, Kiểm định chất lượng, Phí khác.
    - Nhập số tiền chi phí và ghi chú.
  - **Đối chiếu tổng tiền tự động**:
    - Hệ thống tự động tính: `Tổng tiền trước chi phí` + `Tổng chi phí` = `Tổng tiền sau chi phí`.
  - Bấm **"Lưu hóa đơn vào MySQL"**. Giao dịch Database được thực hiện an toàn (Transaction), đảm bảo lưu đồng thời Hóa đơn, Chi tiết thuốc và Chi phí phát sinh mà không bị rác dữ liệu.
- **In hóa đơn**:
  - Bấm nút **"In hóa đơn"** để xem bản in khổ A4 chuyên nghiệp, sẵn sàng gửi lưu trữ kế toán hoặc xuất ra file PDF.

---

### 3.5. Màn hình "Chi phí nhập hàng"
- Thống kê chi tiết các khoản chi phí phát sinh theo 5 hạng mục:
  1. *Phí vận chuyển (Shipping)*
  2. *Phí bốc xếp (Handling)*
  3. *Phí kiểm định chất lượng (Inspection)*
  4. *Phí bảo quản / lưu kho (Storage)*
  5. *Chi phí khác (Other)*
- Giúp hiệu thuốc phân tích rõ tỷ lệ chi phí phát sinh chiếm bao nhiêu % trên tổng giá trị hàng nhập để tối ưu hóa giá bán lẻ.

---

## 4. Hướng dẫn kiểm tra dữ liệu bằng MySQL Workbench

Sau khi thao tác trên web, bạn có thể mở **MySQL Workbench** để kiểm chứng dữ liệu đã được lưu thật vào cơ sở dữ liệu:

1. Mở **MySQL Workbench** và kết nối vào MySQL Server nội bộ của bạn.
2. Mở một cửa sổ SQL Query mới và chạy các câu lệnh kiểm tra:

```sql
-- 1. Chuyển vào database HoaDonLoThuoc
USE HoaDonLoThuoc;

-- 2. Kiểm tra danh sách bảng
SHOW TABLES;
-- Kết quả hiển thị: batches, invoices, invoice_items, expenses, sheets_sync_queue, sheets_sync_log

-- 3. Kiểm tra danh sách lô thuốc đã lưu
SELECT id, batch_number, batch_name, supplier, import_date, has_invoice, invoice_number 
FROM batches 
ORDER BY import_date DESC;

-- 4. Kiểm tra hóa đơn và tổng tiền đối chiếu
SELECT id, invoice_number, invoice_date, batch_number, pre_expense_total, expenses_total, post_expense_total 
FROM invoices;

-- 5. Kiểm tra danh mục thuốc chi tiết thuộc hóa đơn
SELECT invoice_id, medicine_name, specification, unit, quantity, unit_price, amount 
FROM invoice_items;

-- 6. Kiểm tra các khoản chi phí phát sinh
SELECT invoice_id, title, category, amount, notes 
FROM expenses;
```

3. **Thử nghiệm thêm / sửa trên Web**:
   - Bạn thêm 1 lô mới trên web (ví dụ số lô: `LO-TEST-001`).
   - Quay lại MySQL Workbench, chạy lại câu lệnh: `SELECT * FROM batches WHERE batch_number = 'LO-TEST-001';`.
   - Bản ghi xuất hiện ngay lập tức trong bảng của MySQL.

---

## 5. Hướng dẫn cho người thứ hai truy cập từ máy tính khác

Hệ thống đã được cấu hình mở (`0.0.0.0`), cho phép các máy tính khác trong cùng mạng nội bộ (LAN / Wi-Fi) hoặc qua mạng riêng ảo **Tailscale** cùng truy cập và thao tác:

### Cách 1: Truy cập qua mạng Wi-Fi / LAN nội bộ
1. Trên máy chủ (máy tính đang chạy dự án), mở PowerShell và gõ lệnh:
   ```powershell
   ipconfig
   ```
   Tìm dòng `IPv4 Address` của mạng Wi-Fi hoặc Ethernet (Ví dụ: `192.168.1.47`).
2. Trên máy tính thứ hai (kết nối cùng Wi-Fi với máy chủ), mở trình duyệt web và nhập:
   ```text
   http://192.168.1.47:5173/
   ```
3. Người thứ hai có thể tra cứu, thêm lô thuốc, lập hóa đơn; dữ liệu sẽ lưu trực tiếp vào MySQL trên máy chủ và cập nhật cho cả hai người!

### Cách 2: Truy cập từ xa bảo mật qua Tailscale (Không cần mở cổng Router)
1. Cài đặt **Tailscale** trên máy chủ và máy thứ hai (cùng đăng nhập chung 1 tài khoản Tailscale).
2. Lấy IP Tailscale của máy chủ (dạng `100.x.y.z`).
3. Trên máy chủ, gõ lệnh chia sẻ an toàn:
   ```powershell
   tailscale serve --bg 5173
   ```
4. Người thứ hai ở bất kỳ đâu chỉ cần truy cập: `http://<IP_TAILSCALE_MÁY_CHỦ>:5173`.
5. Phương pháp này hoàn toàn bảo mật, không mở cổng 3306 hay 5000 ra Internet công cộng.

---

## 6. Hướng dẫn thiết lập Đồng bộ hai chiều với Google Sheets

Hệ thống hỗ trợ đồng bộ hai chiều tự động:
- Khi thao tác trên Web -> Dữ liệu lưu vào MySQL -> Tự động đồng bộ lên Google Sheets.
- Khi chỉnh sửa trực tiếp trên Google Sheets -> Dữ liệu tự động cập nhật về MySQL.

### Bước 6.1: Cài đặt Google Apps Script & Tự động tạo 4 Sheet chuẩn
1. Truy cập [Google Sheets](https://sheets.new) để tạo 1 bảng tính mới (đặt tên ví dụ: `HoaDonLoThuoc_DongBo`).
2. Bấm menu **Tiện ích mở rộng (Extensions)** -> **Apps Script**.
3. Xóa toàn bộ mã mặc định trong file `Code.gs`.
4. Mở file mã nguồn đã chuẩn bị sẵn trong dự án:
   [server/scripts/googleAppsScript.js](file:///d:/Code/donthuoc_CT/server/scripts/googleAppsScript.js)
5. Sao chép toàn bộ mã trong file trên và dán vào cửa sổ Apps Script.
6. Chỉnh sửa 2 dòng cấu hình ở đầu file script:
   ```javascript
   const BACKEND_API_URL = "http://192.168.1.47:5000/api/sync/from-sheets"; // Địa chỉ IP máy tính chạy Backend
   const SYNC_SECRET_TOKEN = "mint_pharma_secure_sync_secret_token_2026";
   ```
7. Bấm biểu tượng **Lưu (Save)**.
8. Quay lại Google Sheet và tải lại trang web (F5). Bạn sẽ thấy xuất hiện menu mới trên thanh công cụ:
   **🏥 MintPharma DB** -> Bấm chọn **"1. Tự động tạo 4 Sheet chuẩn theo MySQL"**.
   Hệ thống sẽ tự động tạo đủ 4 tab với màu sắc và tiêu đề chuẩn 100% theo MySQL:
   - **`LoThuoc`**: Tương ứng bảng `batches` (Số lô, tên thuốc, nhà cung cấp, ngày nhập, tiền trước/sau chi phí).
   - **`HoaDon`**: Tương ứng bảng `invoices` (Số HĐ, ngày HĐ, tiền thuốc, chi phí phát sinh, tổng thanh toán).
   - **`DanhSachThuoc`**: Tương ứng bảng `invoice_items` (Mã HĐ, tên thuốc, quy cách, số lượng, đơn giá, thành tiền).
   - **`ChiPhiPhatSinh`**: Tương ứng bảng `expenses` (Mã HĐ, tên chi phí, phân loại, số tiền).

### Bước 6.2: Thiết lập Trigger tự động gửi thay đổi về MySQL
1. Ở cột menu bên trái của Apps Script, bấm biểu tượng chiếc đồng hồ **Kích hoạt (Triggers)**.
2. Bấm nút **+ Thêm trình kích hoạt (Add Trigger)** ở góc dưới bên phải.
3. Cấu hình:
   - *Chọn hàm để chạy*: `onSpreadsheetEdit`
   - *Chọn nguồn sự kiện*: `Từ bảng tính (From spreadsheet)`
   - *Chọn loại sự kiện*: `Khi chỉnh sửa (On edit)`
4. Bấm **Lưu (Save)** và cấp quyền truy cập tài khoản Google khi được hỏi.

### Bước 6.3: Triển khai Web App (Deploy Web App)
1. Ở góc trên bên phải màn hình Apps Script, bấm nút **Triển khai (Deploy)** -> **Tùy chọn triển khai mới (New deployment)**.
2. Chọn loại: **Ứng dụng web (Web app)**.
3. Cấu hình:
   - *Mô tả*: `MintPharma Sync Webhook`
   - *Thực thi dưới dạng (Execute as)*: `Tôi (Me)`
   - *Người có quyền truy cập (Who has access)*: `Bất kỳ ai (Anyone)`
4. Bấm **Triển khai (Deploy)** và sao chép đường dẫn **URL ứng dụng web** (Web app URL có dạng: `https://script.google.com/macros/s/AKfycb.../exec`).

### Bước 6.4: Kích hoạt đồng bộ trong `.env` của Backend
Mở file `.env` trên máy chủ và cập nhật các dòng sau:
```env
GOOGLE_SHEETS_SYNC_ENABLED=true
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
SHEETS_SYNC_SECRET=mint_pharma_secure_sync_secret_token_2026
```
Sau đó khởi động lại Backend (`npm run server` hoặc `npm run full`).

### Bước 6.5: Kiểm tra đồng bộ hai chiều
1. **Chiều Web -> Google Sheets**:
   - Thêm 1 lô mới trên web.
   - Mở Google Sheet tab `LoThuoc`: dòng mới tự động xuất hiện với đầy đủ thông tin số lô, nhà cung cấp và ngày nhập!
2. **Chiều Google Sheets -> MySQL**:
   - Trong Google Sheet tab `LoThuoc`, bạn sửa tên nhà cung cấp hoặc ghi chú của một lô.
   - Google Apps Script sẽ gửi thông báo về webhook backend.
   - Backend xác thực token bảo mật, kiểm tra chống vòng lặp (Anti-loop) và cập nhật dữ liệu vào bảng `batches` trong MySQL!
   - Tải lại trang web hoặc kiểm tra MySQL Workbench: dữ liệu đã được cập nhật chính xác!

---

## 7. Xử lý sự cố thường gặp (Troubleshooting)

| Tình huống | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **Giao diện báo: "Chưa kết nối MySQL"** | Dịch vụ MySQL chưa bật hoặc sai mật khẩu trong `.env` | 1. Mở Start menu, gõ `Services`, tìm dịch vụ `MySQL84` và bấm Start.<br>2. Kiểm tra lại `DB_USER` và `DB_PASSWORD` trong file `.env`.<br>3. Khởi động lại backend bằng lệnh `npm run server`. |
| **Báo lỗi cổng 5000 hoặc 5173 đang bận** | Có ứng dụng khác đang chiếm cổng | Mở PowerShell và tắt tiến trình cũ: `Get-Process node \| Stop-Process -Force`, sau đó chạy lại `npm run full`. |
| **Người thứ hai không truy cập được** | Tường lửa Windows Firewall chặn cổng 5173 | Vào Windows Defender Firewall -> Bấm "Allow an app through firewall" -> Chọn Node.js hoặc mở cổng 5173 Inbound Rules. |
| **Google Sheets không đồng bộ** | Chưa bật biến môi trường hoặc sai URL Apps Script | Kiểm tra `GOOGLE_SHEETS_SYNC_ENABLED=true` và URL trong `.env`, xem log của backend trên PowerShell để kiểm tra trạng thái gửi webhook. |

---

*Hệ thống MintPharma - Quản lý & Đối chiếu Hóa đơn Lô thuốc hiệu thuốc an toàn, chính xác và đồng bộ tức thì!*
