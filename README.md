# HỆ THỐNG QUẢN LÝ HÓA ĐƠN LÔ THUỐC (MINT PHARMA)

Hệ thống quản lý, theo dõi tình trạng hóa đơn và hạn sử dụng của các lô thuốc nội bộ, hoạt động theo kiến trúc:

```
WEBSITE (React + Vite) ──[1 chiều]──> GOOGLE APPS SCRIPT ──> GOOGLE SHEETS
```

---

## 🌟 ĐẶC ĐIỂM NỔI BẬT

1. **Loại bỏ phụ thuộc MySQL & Backend Server:**
   - Website có thể chạy 100% độc lập trên trình duyệt hoặc host tĩnh (Vercel, GitHub Pages, Netlify) mà không cần cài đặt hoặc duy trì database server.
   - Dữ liệu client-side được quản lý với cơ chế lưu trữ bền vững (Local Database) và hàng đợi đồng bộ offline có khả năng tự động retry khi có kết nối mạng.

2. **Cơ chế 2 Tab độc lập trên 1 Google Spreadsheet:**
   - **Tab 1: `BAN_DAU` (DỮ LIỆU BAN ĐẦU):**
     - Bản ghi nhận tại thời điểm lô thuốc được tạo mới.
     - **Bất biến:** Tuyệt đối không bị ghi đè, không cập nhật, không xóa khi người dùng chỉnh sửa hoặc xóa trên website.
     - Dùng làm căn cứ pháp lý và đối chiếu phát hiện sai lệch.
   - **Tab 2: `HIEN_TAI` (DỮ LIỆU HIỆN TẠI):**
     - Luôn phản ánh trạng thái mới nhất từ website.
     - `CREATE`: Thêm dòng mới vào cả 2 tab.
     - `UPDATE`: Cập nhật dòng theo `lotId` trên tab `HIEN_TAI` (tab `BAN_DAU` giữ nguyên).
     - `DELETE`: **Xóa mềm (Soft Delete)** – đánh dấu trạng thái "Đã xóa", ghi nhận thời gian xóa và người thực hiện, tuyệt đối không xóa vật lý.

3. **Nghiệp vụ Hóa đơn & Hạn sử dụng rõ ràng:**
   - **Nhóm 1 (Trạng thái hóa đơn):** Nhãn Xanh lá (*Đã có hóa đơn*) / Nhãn Trắng viền xám (*Chưa có hóa đơn*).
   - **Nhóm 2 (Hạn sử dụng):** Trung tính (*Còn hạn*) / Cam (*Sắp hết hạn <= 90 ngày*) / Đỏ (*Đã hết hạn*).
   - **Không gộp hai trạng thái thành một.**
   - Ngưỡng cảnh báo hết hạn (mặc định 90 ngày) có thể cấu hình linh hoạt trong màn hình Cài đặt.

4. **Tuân thủ quy tắc thuật ngữ chuẩn hóa:**
   - Sử dụng các thuật ngữ trung tính, chuẩn y tế: *Hồ sơ liên quan, Thông tin giao dịch, Chứng từ liên quan, Thông tin đối chiếu, Hồ sơ lô thuốc*.

5. **Màn hình Đối chiếu Dữ liệu Chuyên sâu:**
   - So sánh trực quan dữ liệu ban đầu vs dữ liệu hiện tại theo từng trường dữ liệu.
   - Nhanh chóng nhận diện trường đã thay đổi, các lô đã xóa mềm hoặc các lô cần đối chiếu thông tin.

---

## 🚀 HƯỚNG DẪN TRIỂN KHAI GOOGLE APPS SCRIPT

### Bước 1: Tạo Google Spreadsheet mới
1. Truy cập [Google Sheets](https://sheets.new) và tạo một bảng tính mới (ví dụ đặt tên: `QuanLy_HoaDon_LoThuoc_2026`).
2. Vào menu **Tiện ích mở rộng (Extensions)** > **Apps Script**.

### Bước 2: Dán mã nguồn Apps Script
1. Xóa toàn bộ nội dung trong file `Code.gs`.
2. Mở file [public/googleAppsScript_TwoTabs.js](file:///d:/Code/donthuoc_CT/public/googleAppsScript_TwoTabs.js) (hoặc xem tại mục **Cài đặt hệ thống** trên website để copy 1-click).
3. Dán toàn bộ mã nguồn vào `Code.gs` và nhấn biểu tượng **Lưu (Save)**.

### Bước 3: Khởi tạo 2 Tab chuẩn
1. Quay lại trang Google Spreadsheet và tải lại trang (F5).
2. Bạn sẽ thấy thanh menu xuất hiện thêm mục **🏥 MintPharma**.
3. Chọn **1. Khởi tạo & Định dạng 2 Tab chuẩn (BAN_DAU & HIEN_TAI)**.
4. Cấp quyền truy cập khi Google Sheets yêu cầu (chỉ cần làm 1 lần).
5. Sau khi hoàn tất, bảng tính sẽ tự động sinh 2 Tab với header và màu sắc chuẩn y tế:
   - `BAN_DAU` (Xanh rêu đậm - Tab bảo vệ).
   - `HIEN_TAI` (Xanh Mint Teal - Tab hoạt động).

### Bước 4: Triển khai Web App (Deploy)
1. Trong giao diện Apps Script, nhấn nút **Triển khai (Deploy)** ở góc trên bên phải > **Triển khai mới (New deployment)**.
2. Chọn loại: **Ứng dụng web (Web app)**.
3. Thiết lập thông số:
   - **Mô tả:** `MintPharma Sync API v2`
   - **Thực thi dưới tên (Execute as):** `Tôi (Email của bạn)`
   - **Ai có quyền truy cập (Who has access):** `Bất kỳ ai (Anyone)` *(Để web gửi POST không bị chặn đăng nhập)*.
4. Nhấn **Triển khai (Deploy)** và **Sao chép URL ứng dụng web** (định dạng `https://script.google.com/macros/s/.../exec`).

### Bước 5: Cấu hình URL vào Website
1. Mở Website, vào mục **Cài đặt hệ thống**.
2. Dán URL Apps Script vừa sao chép vào ô **URL Google Apps Script Web App**.
3. Khóa bảo mật (Secret Token) mặc định là: `mint_pharma_secure_sync_secret_token_2026`.
4. Nhấn **Lưu cấu hình hệ thống** và thử đồng bộ.

---

## 💻 HƯỚNG DẪN CHẠY DỰ ÁN TRÊN MÁY

### Yêu cầu môi trường
- Node.js >= 18
- npm >= 9

### Cài đặt thư viện
```bash
npm install
```

### Chạy ứng dụng giao diện (Vite Web App)
```bash
npm run dev
```
Trình duyệt sẽ mở tại `http://localhost:5173`.

### Chạy bộ kiểm thử tự động 17 trường hợp
```bash
npm test
```
Tất cả 17 kịch bản nghiệp vụ bắt buộc (thêm lô, sửa tên, sửa số lượng nhiều lần, cập nhật hóa đơn, xóa mềm, bất biến BAN_DAU, chống ghi trùng, giả lập offline, retry, đối chiếu, cảnh báo HSD) sẽ được chạy và báo cáo chi tiết.

### Build đóng gói sản phẩm
```bash
npm run build
```

---

## 🗄️ SAO LƯU & DỮ LIỆU CŨ MYSQL (NẾU CẦN)

Nếu bạn có cơ sở dữ liệu MySQL cũ trước khi chuyển đổi:
- Dữ liệu MySQL cũ **chưa bị xóa** và vẫn được lưu trong database.
- Để trích xuất toàn bộ dữ liệu MySQL cũ ra file JSON độc lập:
  ```bash
  npm run db:backup
  ```
- File sao lưu sẽ được xuất vào thư mục `server/backups/`.
- Ngoài ra, trên website tại trang **Cài đặt hệ thống**, bạn có thể:
  - **Xuất sao lưu JSON đầy đủ** (gồm cả snapshot BAN_DAU, trạng thái HIEN_TAI, hóa đơn, cấu hình).
  - **Xuất danh sách lô thuốc ra file Excel/CSV**.
  - **Khôi phục dữ liệu từ bản sao lưu JSON**.

---

## 📁 CẤU TRÚC MÃ NGUỒN CHÍNH

```
donthuoc_CT/
├── src/
│   ├── types/
│   │   └── pharmacy.ts             # Kiểu dữ liệu lô thuốc, snapshot ban đầu, hóa đơn, sự kiện đồng bộ
│   ├── services/
│   │   ├── storageService.ts       # Database client-side bền vững, hàng đợi đồng bộ, tính toán 6 chỉ số, đối chiếu
│   │   └── apiService.ts           # Cầu nối gọi dịch vụ độc lập
│   ├── utils/
│   │   └── formatters.ts           # Đánh giá HSD (ngưỡng 90 ngày), định dạng tiền tệ VNĐ, ngày tháng DD/MM/YYYY
│   ├── components/
│   │   ├── common/
│   │   │   └── StatusBadge.tsx     # Nhãn HĐ (Xanh lá / Trắng) & Nhãn HSD (Trung tính / Cam / Đỏ) tách rời
│   │   ├── batches/
│   │   │   ├── BatchesListPage.tsx # Bảng 12 cột đầy đủ, tìm kiếm nhanh và 7 bộ lọc
│   │   │   └── BatchDetailView.tsx # Chi tiết 3 nhóm: Thuốc, Hóa đơn & chi phí, Hồ sơ liên quan & đối chiếu
│   │   ├── overview/
│   │   │   └── OverviewPage.tsx    # Dashboard 6 chỉ số cốt lõi kết nối lọc trực tiếp
│   │   ├── reconciliation/
│   │   │   └── ReconciliationPage.tsx # Màn hình đối chiếu dữ liệu BAN_DAU vs HIEN_TAI
│   │   ├── sync/
│   │   │   └── SyncStatusPage.tsx  # Giám sát hàng đợi đồng bộ, quản lý retry, thanh trạng thái
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx    # Cài đặt GAS URL, ngưỡng cảnh báo, sao lưu JSON/CSV, copy script 1-click
│   │   └── modals/
│   │       ├── BatchFormModal.tsx  # Thêm/sửa lô thuốc đầy đủ trường thông tin
│   │       └── InvoiceFormModal.tsx # Quản lý thông tin hóa đơn và chi phí bổ sung
│   ├── App.tsx                     # Ứng dụng gốc, tích hợp navigation 7 màn hình
│   └── main.tsx
├── public/
│   └── googleAppsScript_TwoTabs.js # File Apps Script đầy đủ sẵn sàng copy
├── scripts/
│   └── verify_all_requirements.ts  # Bộ test tự động 17 trường hợp nghiệp vụ
└── README.md
```
