# Clothing Store — Frontend (Angular)

Giao diện website bán quần áo (trang khách hàng + trang quản trị), viết bằng Angular 12 và Bootstrap 5.

Backend và hướng dẫn chạy toàn bộ hệ thống: **https://github.com/trongduongtkhd/ClothingAPI**

## Chạy toàn bộ hệ thống bằng Docker (khuyến nghị)

Repo này được build tự động bởi `docker-compose.yml` nằm trong repo backend. Clone cả 2 repo cạnh nhau:

```bash
mkdir ClothingStore
cd ClothingStore
git clone https://github.com/trongduongtkhd/ClothingAPI.git
git clone https://github.com/trongduongtkhd/WebBanQuanAo.git shop-clothing-ui

cd ClothingAPI
cp .env.example .env
docker compose up -d --build
```

Sau đó mở http://localhost:4200. Chi tiết (tài khoản admin, xử lý sự cố) xem README của repo backend.

## Chạy frontend riêng để phát triển

Cần Node.js 14 hoặc 16 và backend đang chạy ở `http://localhost:8080` (ví dụ bằng Docker như trên).

```bash
npm install
npx ng serve
```

Mở http://localhost:4200 — trang tự tải lại khi sửa code. Địa chỉ API khi phát triển được cấu hình trong `src/environments/environment.ts`.

## Build

```bash
npx ng build
```

Kết quả nằm trong thư mục `dist/`. Khi chạy bằng Docker, bản build được phục vụ bởi Nginx (`nginx.conf`), Nginx chuyển tiếp `/api` và `/uploads` sang container backend.
