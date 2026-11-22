# Cà Phê Vườn Tre Xuân Phạm - Website Giới Thiệu & Đặt Món

Website thương hiệu và menu điện tử cho quán **Cà Phê Vườn Tre Xuân Phạm**.
- **Địa chỉ:** 905 Hùng Vương, Phường Phú Mỹ, TP. Thủ Dầu Một, Tỉnh Bình Dương
- **Hotline / Zalo:** 0365 777 113
- **Thanh toán:** Techcombank - 3657771130 - PHAM THI THANH XUAN

---

## 🎨 Điểm Nổi Bật Về Thiết Kế & Trải Nghiệm

1. **Gam màu chủ đạo (Xanh lá tre tự nhiên):**
   - Bộ màu `bambooGreen` dịu mắt, hòa quyện với thiên nhiên vườn tre.
   - Không bị chói lóa hay gắt mắt (Anti-glare), nền giấy ngà/linen ấm áp và chữ than đậm đạt chuẩn tương phản cao WCAG.
2. **Typography chuẩn bán hàng & tiếng Việt:**
   - **Heading Font:** `Plus Jakarta Sans` – Hiện đại, nổi bật thương hiệu, phong cách ẩm thực cao cấp.
   - **Body Font:** `Be Vietnam Pro` – Thiết kế tối ưu riêng cho tiếng Việt và đọc e-commerce (không lỗi dấu tiếng Việt, hiển thị giá tiền và mô tả rõ ràng).
3. **Thư viện UI Mantine:**
   - Sử dụng `@mantine/core` và `@mantine/notifications` kết hợp React trên nền Astro.
4. **Facebook của chủ quán:**
   - Đã được tích hợp ở Navbar, Card vị trí và Footer.
   - Được để trống (`facebookUrl: ""`) trong file [siteConfig.ts](file:///home/hnamhocit/Workspace/frontend/coffee-house-xp/src/config/siteConfig.ts) theo yêu cầu. Khi chủ quán muốn gắn link, chỉ cần điền link vào biến này.
5. **Thực đơn điện tử tương tác 100% chuẩn từ ảnh chụp menu:**
   - Toàn bộ đồ uống (Cà phê, Trà thảo mộc, Matcha Latte, Nước ép tươi, Sinh tố, Sữa tươi, Trà nóng, Nước ngọt, Thuốc lá/khăn lạnh) từ ảnh gốc.
   - Có popup tùy chọn: Mức đá (100%, 70%, 50%, Không đá), Mức đường (100%, 70%, 50%, Không đường), Ghi chú thêm cho nhân viên pha chế.
   - Thêm món bằng nút cộng, gửi cả giỏ một lần và theo dõi trạng thái trên website. Giỏ có ô số người và yêu cầu chung. Trình duyệt lưu tối đa 5 đơn đã hoàn tất để đặt lại.
6. **Thanh toán VietQR Techcombank:**
   - Hiển thị thông tin STK `3657771130` - `PHAM THI THANH XUAN`.
   - Nút 1 chạm sao chép STK.
   - Hiện VietQR theo số tiền và mã đơn sau khi quán phục vụ.

---

## ⚙️ Hướng Dẫn Cấu Hình (Site Config)

Mọi thông tin quán nằm tại [src/config/siteConfig.ts](file:///home/hnamhocit/Workspace/frontend/coffee-house-xp/src/config/siteConfig.ts):

```typescript
export const siteConfig = {
  name: "Cà Phê Vườn Tre Xuân Phạm",
  address: "905 Hùng Vương, Phường Phú Mỹ, TP. Thủ Dầu Một, Tỉnh Bình Dương",
  hotline: "0365777113",
  hotlineDisplay: "0365 777 113",
  facebookUrl: "", // <-- ĐIỀN LINK FACEBOOK CỦA BẠN VÀO ĐÂY (VÍ DỤ: "https://facebook.com/xuanphamcoffee")
  // ...
};
```

---

## 🚀 Lệnh Phát Triển & Vận Hành

Theo quy tắc của dự án, khi chạy dev server:

```bash
# Khởi động dev server chạy ngầm
bun run astro dev --background

# Kiểm tra trạng thái server
bun run astro dev status

# Xem log server
bun run astro dev logs

# Dừng server
bun run astro dev stop

# Build production
bun run build
```

## Kiểm thử và phát hành luồng đặt món

Checkout dùng Firebase Authentication (Anonymous) và Firestore trên gói Spark. Mỗi lần thử lại hoặc chỉnh một đơn chưa xác nhận vẫn dùng cùng mã yêu cầu. Khi nhà quán bắt đầu xử lý, trang quản trị đối chiếu đơn với giá trong danh mục. VietQR của khách xuất hiện khi quán đã đánh dấu phục vụ.

### Chạy với dữ liệu demo

```sh
firebase emulators:start --project demo-coffee-house-xp --only auth,firestore
PUBLIC_FIREBASE_EMULATORS=true bun run astro dev --background
```

Thêm ít nhất một món vào collection `products` trong Emulator UI để thử checkout. Món cần có `name`, `category`, `price` dạng số nguyên VND và `image`. Thử đặt bằng hai phiên trình duyệt để kiểm tra mỗi phiên chỉ đọc được đơn của mình. Dùng trang quản trị đánh dấu đơn đang chuẩn bị và đã phục vụ để kiểm tra VietQR, rồi xác nhận thu tiền.

### Đưa lên production

1. Bật **Anonymous** trong **Authentication → Sign-in method** của project `coffee-house-xp`. Giữ Google sign-in cho quản trị.
2. Triển khai rules mới bằng `firebase deploy --only firestore:rules --project coffee-house-xp`, sau đó phát hành cả trang khách lẫn trang quản trị. Tải lại các tab quản trị đang mở để nhận luồng kiểm tra giá mới.
3. Thử một đơn từ phiên trình duyệt mới và xác nhận quán nhận đơn trước khi cho khách dùng.

Đơn cũ thiếu `ownerUid` vẫn hiện cho quản trị. Với đơn cũ còn mở, nhân viên có thể đối chiếu qua hotline. Nếu `accounts:signUp` trả 400 với mã `OPERATION_NOT_ALLOWED`, kiểm tra lại Anonymous sign-in của project.
