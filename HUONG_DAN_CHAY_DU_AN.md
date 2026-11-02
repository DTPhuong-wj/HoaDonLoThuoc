# HƯỚNG DẪN CHẠY VÀ TRIỂN KHAI DỰ ÁN (MINT PHARMA)
*Dành cho Quản trị viên hệ thống, Kỹ sư phần mềm và Bộ phận Kỹ thuật*

Hệ thống **Quản lý Hóa đơn Lô thuốc (MintPharma)** đã được tái cấu trúc toàn diện theo kiến trúc hiện đại, tinh gọn:
```
WEBSITE (React + Vite) ──[Đồng bộ 1 chiều]──> GOOGLE APPS SCRIPT ──> GOOGLE SHEETS (BAN_DAU & HIEN_TAI)
```

**Đặc điểm kiến trúc cốt lõi:**
- **Không còn phụ thuộc vào MySQL Server hay máy chủ backend nội bộ.** Website có thể chạy độc lập trên máy tính hoặc xuất bản tĩnh lên Vercel, Netlify, GitHub Pages.
- Dữ liệu được lưu trữ bền vững tại Client (`localStorage` tiêu chuẩn ACID) kết hợp với hàng đợi đồng bộ offline tự động gửi dữ liệu một chiều lên Google Sheets.
- Sử dụng duy nhất một Google Spreadsheet với 2 tab độc lập:
  - `BAN_DAU`: Lưu trữ bản chụp bất biến tại thời điểm thêm mới (phục vụ đối soát, không bị sửa/xóa).
  - `HIEN_TAI`: Luôn phản ánh trạng thái mới nhất, hỗ trợ xóa mềm (Soft-delete).

---

## 📋 MỤC LỤC
1. [Yêu cầu môi trường](#1-yêu-cầu-môi-trường)
2. [Cài đặt thư viện phụ thuộc](#2-cài-đặt-thư-viện-phụ-thuộc)
3. [Khởi chạy ứng dụng Web (Chế độ phát triển)](#3-khởi-chạy-ứng-dụng-web-chế-độ-phát-triển)
4. [Chạy bộ kiểm thử tự động 17 kịch bản nghiệp vụ](#4-chạy-bộ-kiểm-thử-tự-động-17-kịch-bản-nghiệp-vụ)
5. [Đóng gói sản phẩm (Production Build)](#5-đóng-gói-sản-phẩm-production-build)
6. [Hướng dẫn triển khai Google Apps Script & Google Sheets](#6-hướng-dẫn-triển-khai-google-apps-script--google-sheets)
7. [Cấu hình liên kết trên giao diện Website](#7-cấu-hình-liên-kết-trên-giao-diện-website)
8. [Sao lưu & Trích xuất dữ liệu cũ MySQL](#8-sao-lưu--trích-xuất-dữ-liệu-cũ-mysql)
9. [Cấu trúc mã nguồn & Ý nghĩa các module](#9-cấu-trúc-mã-nguồn--ý-nghĩa-các-module)

---

## 1. YÊU CẦU MÔI TRƯỜNG

Trước khi cài đặt, hãy đảm bảo máy tính đã cài đặt các công cụ sau:
- **Node.js**: Phiên bản `>= 18.0.0` (Khuyên dùng Node 20 LTS hoặc mới hơn).
- **npm**: Phiên bản `>= 9.0.0` (thường đi kèm khi cài Node.js).
- **Trình duyệt Web hiện đại**: Google Chrome, Microsoft Edge, Mozilla Firefox hoặc Safari (hỗ trợ ES2022 và LocalStorage).

Kiểm tra phiên bản bằng dòng lệnh:
```powershell
node -v
npm -v
```

---

## 2. CÀI ĐẶT THƯ VIỆN PHỤ THUỘC

Mở cửa sổ **PowerShell** hoặc **Terminal** tại thư mục gốc dự án:
```powershell
# Chuyển đến thư mục dự án (nếu chưa đứng tại thư mục)
cd d:\Code\donthuoc_CT

# Cài đặt toàn bộ dependencies
npm install
```

---

## 3. KHỞI CHẠY ỨNG DỤNG WEB (CHẾ ĐỘ PHÁT TRIỂN)

Vì hệ thống không còn dùng MySQL và backend server Express nữa, bạn **chỉ cần chạy một lệnh duy nhất**:

```powershell
npm run dev
```

Sau khi chạy lệnh, màn hình console sẽ hiển thị:
```
  VITE v8.3.5  ready in 180 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

👉 Mở trình duyệt và truy cập: **`http://localhost:5173`**

### Điểm tiện lợi:
- Không cần mở XAMPP/MySQL service.
- Không cần mở 2 cửa sổ terminal (không cần `npm run server`).
- Toàn bộ dữ liệu bạn nhập sẽ được lưu trữ ngay vào cơ sở dữ liệu client an toàn.

---

## 4. CHẠY BỘ KIỂM THỬ TỰ ĐỘNG 17 KỊCH BẢN NGHIỆP VỤ

Để đảm bảo toàn bộ nghiệp vụ hoạt động chính xác 100%, dự án đã trang bị bộ kiểm thử tự động toàn diện:

```powershell
npm test
```
*(Hoặc lệnh tương đương: `npm run test:verify`)*

Bộ test sẽ tự động xác minh 17 trường hợp bắt buộc:
1. Thêm lô thuốc mới (sinh `initialSnapshot` và sự kiện `CREATE_LOT`).
2. Kiểm tra dữ liệu xuất hiện đồng thời ở cả hai tab `BAN_DAU` và `HIEN_TAI`.
3. Sửa tên thuốc trên giao diện.
4. Kiểm tra tab `BAN_DAU` không bị thay đổi (Bất biến bảo vệ đối chiếu).
5. Kiểm tra tab `HIEN_TAI` được cập nhật chính xác.
6. Sửa số lượng nhiều lần và kiểm tra lịch sử biến động.
7. Cập nhật thông tin hóa đơn (chuyển trạng thái từ "Chưa có" sang "Đã có").
8. Xóa lô thuốc khỏi danh sách.
9. Kiểm tra tab `BAN_DAU` vẫn còn nguyên dữ liệu sau khi xóa.
10. Kiểm tra tab `HIEN_TAI` chuyển sang trạng thái "Đã xóa" (Soft-delete), lưu thời gian xóa.
11. Thêm lại một lô thuốc mới thành công.
12. Kiểm tra cơ chế chống ghi trùng (Idempotency dựa trên `eventId`).
13. Giả lập lỗi ngắt kết nối mạng hoặc server không phản hồi.
14. Thử đồng bộ lại (Sync Retry an toàn).
15. Kiểm tra tính toàn vẹn dữ liệu sau khi retry.
16. Kiểm tra tốc độ và độ chính xác của tìm kiếm & bộ lọc.
17. Kiểm tra phân loại hạn sử dụng (Còn hạn, Sắp hết hạn <= 90 ngày, Đã hết hạn).

Kết quả kỳ vọng: **`🎉 HOÀN TẤT KIỂM THỬ: 17/17 KIỂM THỬ ĐẠT CHUẨN 100%`** với exit code `0`.

---

## 5. ĐÓNG GÓI SẢN PHẨM (PRODUCTION BUILD)

Khi muốn triển khai lên môi trường thực tế (web hosting, Vercel, Netlify):

```powershell
npm run build
```

Quá trình biên dịch sẽ tối ưu hóa mã nguồn TypeScript và đóng gói vào thư mục `dist/`. Bạn có thể kiểm tra trước bản build sản phẩm trên máy cục bộ bằng lệnh:
```powershell
npm run preview
```

---

## 6. HƯỚNG DẪN TRIỂN KHAI GOOGLE APPS SCRIPT & GOOGLE SHEETS

Đây là phần kết nối lưu trữ một chiều lên đám mây Google Sheets.

### Bước 6.1: Tạo Google Spreadsheet mới
1. Đăng nhập vào tài khoản Google và mở [Google Sheets](https://sheets.new).
2. Đặt tên bảng tính, ví dụ: **`QuanLy_HoaDon_LoThuoc_MintPharma`**.
3. Trên thanh công cụ, chọn **Tiện ích mở rộng (Extensions)** > **Apps Script**.

### Bước 6.2: Dán mã nguồn Apps Script 2 Tab
1. Trong trình biên tập Apps Script, xóa mã mặc định `myFunction()` trong file `Code.gs`.
2. Mở file [public/googleAppsScript_TwoTabs.js](file:///d:/Code/donthuoc_CT/public/googleAppsScript_TwoTabs.js) trong dự án (hoặc copy từ trang **Cài đặt hệ thống** trên web).
3. Dán toàn bộ mã nguồn vào `Code.gs` và nhấn biểu tượng **Lưu (Ctrl + S)**.

### Bước 6.3: Khởi tạo & Định dạng 2 Tab tự động
1. Quay lại trang Google Spreadsheet và bấm **F5** (tải lại trang).
2. Sau 2-3 giây, trên thanh menu của Google Sheets sẽ xuất hiện thêm menu mới tên là **🏥 MintPharma**.
3. Nhấp chọn: **1. Khởi tạo & Định dạng 2 Tab chuẩn (BAN_DAU & HIEN_TAI)**.
4. Một hộp thoại yêu cầu cấp quyền sẽ hiện ra:
   - Chọn tài khoản Google của bạn.
   - Bấm **Nâng cao (Advanced)** > Chọn **Đi tới ... (Không an toàn)**.
   - Bấm **Cho phép (Allow)**.
5. Sau khi cấp quyền, script sẽ tự động sinh 2 Tab chuẩn với tiêu đề in đậm, cố định dòng đầu và màu sắc nhận diện:
   - **`BAN_DAU`**: 18 cột (Header màu xanh rêu bảo vệ).
   - **`HIEN_TAI`**: 22 cột (Header màu xanh Mint y tế, có cột STT và Trạng thái hiện tại).

### Bước 6.4: Triển khai thành Web App (Deploy)
1. Trong cửa sổ Google Apps Script, nhấp nút **Triển khai (Deploy)** ở góc trên bên phải > chọn **Triển khai mới (New deployment)**.
2. Nhấp biểu tượng bánh răng bên cạnh mục *Chọn loại* > Chọn **Ứng dụng web (Web app)**.
3. Điền cấu hình như sau:
   - **Mô tả:** `MintPharma Sync API v2`
   - **Thực thi dưới tên (Execute as):** `Tôi (tài khoản email của bạn)`
   - **Ai có quyền truy cập (Who has access):** `Bất kỳ ai (Anyone)` *(Bắt buộc chọn Anyone để ứng dụng web có thể gửi request đồng bộ mà không cần popup đăng nhập Google).*
4. Nhấn nút **Triển khai (Deploy)**.
5. Google sẽ tạo ra một đường link **URL của ứng dụng web** có dạng:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
6. Nhấn nút **Sao chép (Copy)** URL này.

---

## 7. CẤU HÌNH LIÊN KẾT TRÊN GIAO DIỆN WEBSITE

1. Mở Website tại `http://localhost:5173/`.
2. Trên thanh menu bên trái, nhấp vào mục **Cài đặt hệ thống** (biểu tượng bánh răng).
3. Tại phần **Cấu hình Google Sheets & Apps Script**:
   - Dán URL vừa sao chép ở Bước 6.4 vào ô **URL Google Apps Script Web App**.
   - Ô **Khóa bảo mật (Secret Token)**: Giữ nguyên mặc định `mint_pharma_secure_sync_secret_token_2026` (khớp với token trong file script).
   - Ô **Cảnh báo hết hạn trước (ngày)**: Mặc định 90 ngày (bạn có thể đổi thành 60 hoặc 120 ngày tùy nhu cầu).
   - Ô **Tên người thao tác mặc định**: Ví dụ: `Dược sĩ Nguyễn Văn A`.
4. Bấm nút **Lưu cấu hình hệ thống**.
5. Nhấp nút **Thử kiểm tra kết nối ngay**: Hệ thống sẽ gửi một ping kiểm tra và hiển thị huy hiệu xanh lá `Google Sheets: Đã kết nối`.

---

## 8. SAO LƯU & TRÍCH XUẤT DỮ LIỆU CŨ MYSQL

Nếu bạn có dữ liệu MySQL cũ trước khi chuyển đổi:
- **Dữ liệu MySQL cũ không bị xóa mất.**
- Để trích xuất toàn bộ dữ liệu MySQL cũ ra file JSON độc lập:
  ```powershell
  npm run db:backup
  ```
  File sao lưu sẽ được xuất vào thư mục `server/backups/`.
- Ngoài ra, ngay trên giao diện Website tại trang **Cài đặt hệ thống**, bạn có thể:
  - Nhấn **Xuất dữ liệu dự phòng (JSON)**: Tải về toàn bộ cơ sở dữ liệu (lô thuốc, snapshot ban đầu, hóa đơn, cấu hình).
  - Nhấn **Xuất danh sách lô (CSV/Excel)**: Tải về file bảng tính mở được bằng Microsoft Excel.
  - Nhấn **Khôi phục dữ liệu**: Tải lên file JSON dự phòng để phục hồi nguyên trạng bất kỳ lúc nào.

---

## 9. CẤU TRÚC MÃ NGUỒN & Ý NGHĨA CÁC MODULE

```
donthuoc_CT/
├── src/
│   ├── types/
│   │   └── pharmacy.ts             # Định nghĩa cấu trúc dữ liệu Lô, Snapshot, Hóa đơn, Sự kiện đồng bộ
│   ├── services/
│   │   ├── storageService.ts       # Database client-side bền vững, hàng đợi đồng bộ, tính 6 KPI, đối chiếu
│   │   └── apiService.ts           # Service bridge cho các chức năng mở rộng
│   ├── utils/
│   │   └── formatters.ts           # Thuật toán đánh giá HSD (ngưỡng 90 ngày), định dạng tiền VNĐ, ngày DD/MM/YYYY
│   ├── components/
│   │   ├── common/
│   │   │   └── StatusBadge.tsx     # Nhãn HĐ (Xanh lá/Trắng) & Nhãn HSD (Trung tính/Cam/Đỏ) độc lập
│   │   ├── batches/
│   │   │   ├── BatchesListPage.tsx # Bảng 12 cột đầy đủ, tìm kiếm nhanh và 7 bộ lọc thông minh
│   │   │   └── BatchDetailView.tsx # Chi tiết 3 nhóm A (Thuốc), B (Hóa đơn), C (Hồ sơ liên quan)
│   │   ├── overview/
│   │   │   └── OverviewPage.tsx    # Dashboard 6 chỉ số cốt lõi kết nối lọc trực tiếp
│   │   ├── reconciliation/
│   │   │   └── ReconciliationPage.tsx # Màn hình đối chiếu dữ liệu BAN_DAU vs HIEN_TAI
│   │   ├── sync/
│   │   │   └── SyncStatusPage.tsx  # Giám sát hàng đợi đồng bộ, quản lý retry, kiểm tra sự kiện
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx    # Cài đặt GAS URL, ngưỡng cảnh báo, xuất sao lưu JSON/CSV, copy script
│   │   └── modals/
│   │       ├── BatchFormModal.tsx  # Modal thêm/sửa lô thuốc đầy đủ trường thông tin
│   │       └── InvoiceFormModal.tsx # Modal quản lý hóa đơn và chi phí bổ sung
│   ├── App.tsx                     # Ứng dụng gốc, tích hợp điều hướng 7 màn hình
│   └── main.tsx
├── public/
│   └── googleAppsScript_TwoTabs.js # File mã nguồn Apps Script 2 Tab chuẩn sẵn sàng sao chép
├── scripts/
│   └── verify_all_requirements.ts  # Bộ test tự động 17 trường hợp nghiệp vụ
├── HUONG_DAN_CHAY_DU_AN.md         # File tài liệu này
├── HUONG_DAN_SU_DUNG.md            # Sổ tay hướng dẫn người dùng nghiệp vụ (Dược sĩ, Kế toán, Quản lý kho)
└── README.md                       # Tài liệu tổng quan dự án
```

Chúc bạn vận hành hệ thống thành công và thuận lợi!
