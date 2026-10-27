# HƯỚNG DẪN TRIỂN KHAI TOÀN DIỆN: ĐƯA HỆ THỐNG MINTPHARMA LÊN CLOUD
*(Cloudflare Pages + Cloud Backend Node.js + Cloud MySQL + Google Sheets 2 Chiều)*

> **MỤC TIÊU:** Đưa toàn bộ hệ thống lên Internet hoạt động 24/7. Bạn và người khác ở bất kỳ đâu đều có thể truy cập, tra cứu, thêm/sửa/xóa và đồng bộ với Google Sheets mà **KHÔNG CẦN BẬT MÁY TÍNH CÁ NHÂN, KHÔNG CẦN CHẠY LOCALHOST, KHÔNG CẦN MỞ VS CODE**.

---

## 📌 1. SO SÁNH KIẾN TRÚC TRƯỚC VÀ SAU KHI LÊN CLOUD

### Kiến trúc ban đầu (Phụ thuộc máy cá nhân):
```
[Máy tính người dùng khác] ──(LAN/Wi-Fi)──► [Laptop cá nhân của bạn: Vite 5173]
                                                     │ (Proxy /api)
                                                     ▼
                                            [Express Backend :5000]
                                                     │
                                                     ▼
                                            [MySQL Local :3306]
*Nhược điểm: Khi tắt máy tính cá nhân hoặc ra ngoài mạng Wi-Fi, toàn bộ hệ thống ngừng hoạt động.*
```

### Kiến trúc Cloud mới (Độc lập 100%):
```
┌─────────────────────────────────┐
│     NGƯỜI DÙNG Ở BẤT KỲ ĐÂU     │
└────────────────┬────────────────┘
                 │ (Truy cập qua HTTPS domain riêng hoặc *.pages.dev)
                 ▼
┌──────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES (EDGE)                   │
│  - Phục vụ Giao diện Web React 19 + Vite siêu nhanh qua CDN  │
│  - Pages Functions (/functions/api/[[path]].ts) tự động      │
│    Reverse Proxy toàn bộ /api/* sang Backend Cloud           │
│  - Bảo mật: 100% HTTPS, không lộ IP backend, không lỗi CORS  │
└────────────────┬─────────────────────────────────────────────┘
                 │ (Proxy an toàn qua HTTPS)
                 ▼
┌──────────────────────────────────────────────────────────────┐
│                     BACKEND CLOUD SERVER                     │
│               (Render / Railway / Fly.io / VPS)              │
│  - Chạy Docker Node.js 22 Alpine liên tục 24/7               │
│  - Connection Pool an toàn với SSL/TLS                       │
│  - Background Worker chạy ngầm xử lý hàng đợi Google Sheets  │
│  - Endpoint /api/sync/from-sheets tiếp nhận webhook từ xa   │
└────────────────┬─────────────────────────────┬───────────────┘
                 │ (SSL/TLS mã hóa)            │ (Webhook HTTPS 2 chiều)
                 ▼                             ▼
┌────────────────────────────────┐ ┌───────────────────────────┐
│        CLOUD MYSQL DATABASE    │ │       GOOGLE SHEETS       │
│   (Aiven / TiDB / Railway)     │ │  1 Sheet: HoaDonLoThuoc   │
│ - Lưu trữ dữ liệu gốc an toàn  │ │ - Tiếp nhận dữ liệu mới   │
│ - Tự động sao lưu hàng ngày    │ │ - Chỉnh sửa cập nhật về   │
│ - Giữ nguyên 100% schema       │ │   MySQL Cloud qua trigger │
└────────────────────────────────┘ └───────────────────────────┘
```

---

## 🗂️ 2. DANH MỤC CÁC FILE ĐÃ ĐƯỢC CHUẨN HÓA TRÊN REPOSITORY

| File | Hành động | Mục đích & Chi tiết kỹ thuật |
| :--- | :--- | :--- |
| [`Dockerfile`](file:///d:/Code/donthuoc_CT/Dockerfile) | **Tạo mới** | Đóng gói Backend Node.js 22 Alpine đa tầng, cấu hình Healthcheck tự động, chạy độc lập trên bất kỳ nền tảng Cloud nào. |
| [`.dockerignore`](file:///d:/Code/donthuoc_CT/.dockerignore) | **Tạo mới** | Loại bỏ `node_modules`, `dist`, `.env` khi build Docker để bảo mật tuyệt đối. |
| [`render.yaml`](file:///d:/Code/donthuoc_CT/render.yaml) | **Tạo mới** | Cấu hình Infrastructure-as-Code giúp deploy Backend 1-click lên Render miễn phí. |
| [`public/_redirects`](file:///d:/Code/donthuoc_CT/public/_redirects) | **Tạo mới** | Cấu hình SPA routing cho Cloudflare Pages, tránh lỗi 404 khi người dùng F5 tải lại trang. |
| [`functions/api/[[path]].ts`](file:///d:/Code/donthuoc_CT/functions/api/[[path]].ts) | **Tạo mới** | Cloudflare Pages Function (Edge Worker) định tuyến trong suốt toàn bộ request `/api/*` tới Backend Cloud. |
| [`src/services/apiService.ts`](file:///d:/Code/donthuoc_CT/src/services/apiService.ts) | **Cập nhật** | Hỗ trợ linh hoạt cả `VITE_API_URL` khi build lẫn Reverse Proxy `/api` mặc định. |
| [`server/src/config/env.ts`](file:///d:/Code/donthuoc_CT/server/src/config/env.ts) | **Cập nhật** | Hỗ trợ parse `DATABASE_URL` từ Cloud MySQL, bật cờ `DB_SSL`, và kiểm soát `CORS_ORIGIN`. |
| [`server/src/db.ts`](file:///d:/Code/donthuoc_CT/server/src/db.ts) | **Cập nhật** | Kết nối an toàn qua TLS/SSL, xử lý quyền hạn Cloud MySQL, thêm keepAlive và connectTimeout. |
| [`server/src/index.ts`](file:///d:/Code/donthuoc_CT/server/src/index.ts) | **Cập nhật** | Cho phép cấu hình CORS domain Cloudflare Pages động hoặc `*`. |
| [`server/scripts/backupDatabase.ts`](file:///d:/Code/donthuoc_CT/server/scripts/backupDatabase.ts) | **Tạo mới** | Script sao lưu toàn bộ 6 bảng dữ liệu và schema MySQL local thành file `.sql`. |
| [`server/scripts/restoreDatabase.ts`](file:///d:/Code/donthuoc_CT/server/scripts/restoreDatabase.ts) | **Tạo mới** | Script phục hồi dữ liệu từ file backup vào database bất kỳ (Local hoặc Cloud). |
| [`server/scripts/googleAppsScript.js`](file:///d:/Code/donthuoc_CT/server/scripts/googleAppsScript.js) | **Cập nhật** | Hỗ trợ đồng bộ 2 chiều qua URL Backend Cloud, chống vòng lặp (Anti-loop) và tự renumber STT. |

---

## 🚀 3. QUY TRÌNH 4 BƯỚC TRIỂN KHAI THỰC TẾ

### BƯỚC 1: TẠO MYSQL DATABASE TRÊN CLOUD & NẠP DỮ LIỆU
Bạn có thể chọn một trong các nhà cung cấp MySQL Cloud miễn phí tốt nhất:
- **Lựa chọn hàng đầu: [Aiven for MySQL](https://aiven.io/)** (Gói Free tier miễn phí 5GB, đầy đủ SSL/TLS, cực kỳ ổn định).
- **Hoặc [TiDB Cloud](https://tidbcloud.com/)** (Tương thích 100% MySQL, miễn phí vĩnh viễn 5GB Serverless).
- **Hoặc [Railway](https://railway.app/)** (Cung cấp MySQL 1-click có connection string dạng `DATABASE_URL`).

#### Các bước thực hiện:
1. Đăng ký tài khoản tại [aiven.io](https://aiven.io/) hoặc [tidbcloud.com](https://tidbcloud.com/).
2. Tạo một dịch vụ mới: **MySQL** (chọn khu vực gần Việt Nam như Singapore `ap-southeast-1`).
3. Sau khi tạo xong, bạn sẽ nhận được thông tin kết nối gồm:
   - **Host** (ví dụ: `mysql-xxxx.aivencloud.com`)
   - **Port** (ví dụ: `12345`)
   - **User** (ví dụ: `avnadmin`)
   - **Password** (mật khẩu ngẫu nhiên được cấp)
   - **Database Name** (ví dụ: `defaultdb` hoặc `HoaDonLoThuoc`)
   - Hoặc chuỗi **Service URI / DATABASE_URL**: `mysql://avnadmin:pass@mysql-xxxx.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED`
4. **Nhập schema và dữ liệu từ máy lên Cloud**:
   - Mở **MySQL Workbench** trên máy tính của bạn.
   - Bấm dấu `+` để tạo kết nối mới, điền Host, Port, User, Password của MySQL Cloud (trong tab *SSL* chọn *Require*).
   - Mở file backup đã chuẩn bị sẵn trong thư mục dự án:  
     [`backups/HoaDonLoThuoc_latest.sql`](file:///d:/Code/donthuoc_CT/backups/HoaDonLoThuoc_latest.sql)
   - Bấm nút hình tia sét ⚡ (Execute) để chạy toàn bộ file SQL. Sau 5 giây, tất cả 6 bảng dữ liệu đã có mặt trên Cloud!

---

### BƯỚC 2: TRIỂN KHAI BACKEND LÊN CLOUD SERVER (RENDER / RAILWAY)
Khuyên dùng **[Render.com](https://render.com/)** vì hỗ trợ Dockerfile sẵn có trong dự án, miễn phí và kết nối trực tiếp với GitHub:

1. Đăng nhập [render.com](https://render.com/), bấm nút **New +** -> Chọn **Web Service**.
2. Chọn kết nối với kho lưu trữ GitHub của bạn: `DTPhuong-wj/HoaDonLoThuoc`.
3. Điền cấu hình:
   - **Name**: `hoadonlothuoc-api`
   - **Region**: `Singapore` (để tốc độ về Việt Nam nhanh nhất)
   - **Language / Runtime**: **Docker** (Render sẽ tự động dùng file `Dockerfile` đã tạo sẵn)
   - **Instance Type**: **Free**
4. Trong mục **Environment Variables** (Biến môi trường), thêm các biến sau:
   - `PORT`: `5000`
   - `HOST`: `0.0.0.0`
   - `DATABASE_URL`: *(Dán chuỗi kết nối MySQL Cloud từ Bước 1)*
   - `DB_SSL`: `true`
   - `CORS_ORIGIN`: `*`
   - `GOOGLE_SHEETS_SYNC_ENABLED`: `true`
   - `SHEETS_SYNC_SECRET`: `mint_pharma_secure_sync_secret_token_2026`
   - `GOOGLE_APPS_SCRIPT_URL`: *(Sẽ điền ở Bước 4)*
5. Bấm **Create Web Service**.
6. Render sẽ tự động build Docker và khởi chạy server. Sau 1-2 phút, bạn sẽ có URL Backend Cloud công khai dạng:
   `https://hoadonlothuoc-api.onrender.com`
   *(Kiểm tra bằng cách mở trình duyệt vào link `https://hoadonlothuoc-api.onrender.com/api/health` thấy báo `"status": "ONLINE"` là thành công 100%)*.

---

### BƯỚC 3: TRIỂN KHAI FRONTEND LÊN CLOUDFLARE PAGES

1. Đăng nhập vào trang quản trị **[Cloudflare Dashboard](https://dash.cloudflare.com/)**.
2. Ở thanh menu bên trái, chọn **Workers & Pages** -> Bấm **Create application** -> Chọn tab **Pages** -> Bấm **Connect to Git**.
3. Chọn tài khoản GitHub của bạn và chọn repository `DTPhuong-wj/HoaDonLoThuoc`.
4. Thiết lập thông số build:
   - **Project name**: `hoadonlothuoc` (hoặc tên tùy thích)
   - **Production branch**: `main`
   - **Framework preset**: Chọn **`Vite`**
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Trong mục **Environment variables (advanced)**, thêm biến:
   - **`BACKEND_API_URL`**: `https://hoadonlothuoc-api.onrender.com` *(URL của Backend Cloud từ Bước 2)*
6. Bấm **Save and Deploy**.
7. Cloudflare Pages sẽ tự động biên dịch và triển khai lên hàng trăm máy chủ Edge toàn cầu.
   Sau khi hoàn tất, bạn sẽ nhận được đường link website chính thức dạng:  
   👉 **`https://hoadonlothuoc.pages.dev`**  
   *(Bạn cũng có thể gán tên miền riêng của mình hoàn toàn miễn phí trên Cloudflare Pages)*.

---

### BƯỚC 4: CẬP NHẬT GOOGLE APPS SCRIPT CHO GOOGLE SHEETS
Để tính năng đồng bộ 2 chiều hoạt động 24/7 mà không phụ thuộc vào máy cá nhân:

1. Mở file Google Sheets của bạn -> Chọn menu **Tiện ích mở rộng (Extensions)** -> **Apps Script**.
2. Sao chép toàn bộ nội dung mới từ file:  
   [`server/scripts/googleAppsScript.js`](file:///d:/Code/donthuoc_CT/server/scripts/googleAppsScript.js)
   dán đè vào trình soạn thảo Apps Script.
3. Chỉnh sửa dòng 34 với URL Backend Cloud của bạn:
   ```javascript
   const BACKEND_API_URL = "https://hoadonlothuoc-api.onrender.com";
   ```
4. Bấm **Lưu (Ctrl + S)**.
5. Triển khai Web App:
   - Bấm nút **Triển khai (Deploy)** ở góc trên bên phải -> **Quản lý bản triển khai (Manage deployments)**.
   - Bấm biểu tượng bút chì ✏️ để chỉnh sửa -> Chọn **Phiên bản mới (New version)** -> Bấm **Triển khai**.
   - Sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/AKfycb.../exec`).
6. Quay lại trang quản trị Render của Backend Cloud (Bước 2):
   - Vào mục **Environment** -> Cập nhật giá trị biến `GOOGLE_APPS_SCRIPT_URL` bằng URL vừa sao chép.
   - Render sẽ tự động lưu và áp dụng ngay.
7. **Bật Trigger chỉnh sửa tự động trên Sheets**:
   - Trong cửa sổ Apps Script, bấm biểu tượng đồng hồ **Triggers (Kích hoạt)** ở menu bên trái.
   - Bấm **+ Thêm trình kích hoạt (Add Trigger)** ở góc dưới bên phải.
   - Hàm: `onSpreadsheetEdit`
   - Nguồn sự kiện: `Từ bảng tính (From spreadsheet)`
   - Loại sự kiện: `Khi chỉnh sửa (On edit)`
   - Bấm **Lưu**.

---

## 🧪 4. DANH MỤC KIỂM THỬ XÁC NHẬN (ACCEPTANCE TEST)

| Kịch bản kiểm thử | Thao tác | Kết quả đạt tiêu chuẩn |
| :--- | :--- | :--- |
| **1. Độc lập thiết bị** | Tắt hoàn toàn máy tính cá nhân, mở điện thoại hoặc máy tính khác vào `https://hoadonlothuoc.pages.dev` | Giao diện hiển thị tức thì, huy hiệu màu xanh `MySQL: defaultdb (Đã kết nối)`. |
| **2. Đọc & Thêm (CRUD)** | Bấm "+ Thêm lô thuốc mới", nhập số lô `LO-CLOUD-01` | Lô thuốc lưu ngay vào MySQL Cloud, danh sách hiển thị với STT `1`. |
| **3. Lập Hóa đơn** | Bấm "Tạo hóa đơn", nhập thuốc và chi phí phụ | Tổng tiền và chi phí được tính toán chính xác, lưu vào MySQL Cloud. |
| **4. MySQL -> Sheets** | Mở Google Sheet tab `HoaDonLoThuoc` | Dòng `LO-CLOUD-01` tự động xuất hiện với đầy đủ thông tin thuốc, phụ phí và STT tự đánh lại `1, 2, 3...`. |
| **5. Sheets -> MySQL** | Trên Google Sheet, sửa ghi chú hoặc tên thuốc của dòng `LO-CLOUD-01` | Sau 2 giây, cột P báo `(Đã đồng bộ MySQL)`. Tải lại trang web thấy ghi chú mới ngay lập tức! |
| **6. Lọc & Đánh lại STT** | Gõ tìm kiếm hoặc lọc nhà cung cấp trên web | Cột STT luôn hiển thị tăng dần liên tục từ 1, không nhảy số hay bỏ trống. |
| **7. An toàn dữ liệu** | Xóa thử một lô thuốc | Dòng tương ứng trên Google Sheets tự động biến mất, các dòng còn lại tự động co STT lại từ 1..N. |

---

## 💰 5. CHI PHÍ VÀ GIỚI HẠN DỊCH VỤ (TRANSPARENCY)

- **Cloudflare Pages**: **0 đ / Miễn phí 100% trọn đời** (Băng thông không giới hạn, 500 lượt build/tháng).
- **Aiven MySQL / TiDB Cloud**: **0 đ / Miễn phí trọn đời** (Dung lượng 5GB, đủ lưu trữ hàng trăm nghìn hóa đơn lô thuốc cho một nhà thuốc vừa và nhỏ).
- **Render Backend Web Service**: **0 đ / Miễn phí** (Gói Free instance).
  > *Lưu ý về gói Render Free:* Khi không có ai truy cập trong vòng 15 phút, máy chủ sẽ tạm ngủ đông. Lần truy cập đầu tiên sau đó sẽ mất khoảng 30-50 giây để khởi động lại. Nếu muốn ứng dụng phản hồi ngay lập tức 0 giây 24/7, bạn có thể nâng lên gói Starter ($7/tháng) hoặc dùng dịch vụ cron-job miễn phí ping health check mỗi 10 phút.

---
*Dự án đã được cấu hình hoàn tất ở mức production-ready, sẵn sàng để bạn đưa lên Cloudflare Pages và Cloud Server!*
