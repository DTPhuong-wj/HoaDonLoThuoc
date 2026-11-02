# SỔ TAY HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN LÝ LÔ THUỐC (MINT PHARMA)
*Phiên bản Chuẩn 5 Cột: stt | lô thuốc | tên thuốc | nhãn | ngày nhập*

---

## 🏥 QUY TẮC ĐỒNG BỘ DỮ LIỆU GOOGLE SHEET

1. **Google Sheet chỉ lưu khi THÊM MỚI và SỬA:**
   - **Thêm mới:** Khi thêm lô thuốc, từng tên thuốc được tách thành từng dòng riêng biệt trên Google Sheet.
   - **Sửa:** Khi chỉnh sửa thông tin thuốc (mã lô, tên thuốc, nhãn, ngày nhập), dòng tương ứng trên Google Sheet sẽ được cập nhật.
2. **Khi XÓA thì KHÔNG CẬP NHẬT SHEET:**
   - Khi xóa dòng thuốc trên Website, dòng thuốc sẽ được gỡ khỏi giao diện web.
   - **Dữ liệu trên Google Sheet được giữ nguyên vẹn 100%**, không bị xóa hay sửa đổi, giúp lưu trữ an toàn và bảo lưu lịch sử dữ liệu.
3. **Thao tác xóa nhanh chóng:**
   - Sau khi nhấn nút xác nhận xóa, popup xác nhận sẽ **tự động tắt ngay lập tức**, không bị treo lại trên màn hình.

---

## 📊 CẤU TRÚC 5 CỘT TRÊN GOOGLE SHEET

1. `stt`: Số thứ tự tự động (1, 2, 3...)
2. `lô thuốc`: Mã / Tên lô thuốc (ví dụ: `LO-DHG-01`)
3. `tên thuốc`: Tên thuốc thuộc lô (lưu riêng từng dòng, **không gộp**)
4. `nhãn`: `Nhãn xanh` hoặc `Nhãn trắng`
5. `ngày nhập`: Ngày nhập kho (ví dụ: `2026-10-15`)

---

## 💊 THÊM LÔ THUỐC VỚI NHIỀU TÊN THUỐC TÁCH RIÊNG

1. Bấm **"+ Thêm lô thuốc"**.
2. Nhập **Lô thuốc**, chọn **Nhãn** và **Ngày nhập**.
3. Tại phần **Tên thuốc (tách riêng từng dòng)**:
   - Nhập tên thuốc vào ô thứ nhất.
   - Bấm **"+ Thêm tên thuốc"** để thêm các ô tiếp theo.
   - Có thể dán (paste) danh sách các tên thuốc, hệ thống sẽ tự động tách thành từng ô.
4. Bấm **Lưu**: Hệ thống lưu từng thuốc thành từng dòng riêng trên Web và Google Sheet.
