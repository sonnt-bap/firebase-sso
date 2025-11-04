# Firebase SSO thử nghiệm với Next.js

Repo này bao gồm hai ứng dụng Next.js độc lập để thử nghiệm cơ chế Single Sign-On (SSO) trên Firebase Authentication:

- **kyc-system** – cổng dành cho hệ thống KYC.
- **user-system** – cổng dành cho ứng dụng người dùng.

## Cấu trúc thư mục

```
.
├── README.md                 # Tài liệu chung mô tả luồng SSO và hướng dẫn vận hành
├── kyc-system/               # Ứng dụng Next.js đóng vai trò hệ thống KYC
│   ├── .env.example          # Mẫu biến môi trường cho ứng dụng KYC
│   ├── src/app/              # App Router, trang UI, API routes
│   ├── src/lib/firebase/     # Các helper khởi tạo Firebase client/admin
│   └── README.md             # Ghi chú ngắn trỏ về tài liệu chính và cách chạy
└── user-system/              # Ứng dụng Next.js đóng vai trò user portal
    ├── .env.example          # Mẫu biến môi trường cho ứng dụng user-system
    ├── src/app/              # App Router, trang UI, API routes
    ├── src/lib/firebase/     # Helper khởi tạo Firebase client/admin dùng chung ý tưởng
    └── README.md             # Ghi chú ngắn dành riêng cho user-system
```

Cả hai ứng dụng đều:

- Cho phép đăng ký và đăng nhập bằng email/mật khẩu trên Firebase.
- Sử dụng Firebase Admin SDK ở phía backend (API Route của Next.js) để xác thực `idToken` và phát hành `customToken`.
- Sử dụng Firebase SDK ở phía frontend để gọi `getIdToken()` và đăng nhập sang ứng dụng đối tác bằng `signInWithCustomToken()`.
- Hiển thị nút mở ứng dụng còn lại và tự động đăng nhập thông qua custom token.

## Chuẩn bị môi trường

1. Tạo một project Firebase và bật phương thức đăng nhập Email/Password.
2. Tạo service account (Firebase Admin SDK) và tải file JSON.
3. Điền thông tin cấu hình vào hai file `.env.local` theo mẫu:

   ```bash
   # kyc-system/.env.local
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_PARTNER_APP_URL=http://localhost:3001

   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...@....gserviceaccount.com
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...(ghi chú: thay \n bằng \\n nếu lưu trong file .env)\n-----END PRIVATE KEY-----
   ```

   ```bash
   # user-system/.env.local
   # (giữ nguyên thông tin Firebase vì dùng chung project)
   NEXT_PUBLIC_PARTNER_APP_URL=http://localhost:3000
   ```

4. Đảm bảo biến `FIREBASE_PRIVATE_KEY` vẫn chứa dấu xuống dòng. Nếu copy vào `.env`, hãy thay thế mỗi ký tự xuống dòng bằng chuỗi `\n`.

## Cài đặt & chạy

```bash
# Cài đặt dependencies
cd kyc-system && npm install
cd ../user-system && npm install

# Chạy hai ứng dụng ở hai terminal riêng
cd kyc-system && npm run dev   # http://localhost:3000
cd user-system && npm run dev  # http://localhost:3001
```

Sau khi đăng nhập ở một ứng dụng, bấm nút "Mở ứng dụng ..." để mở ứng dụng còn lại trong tab mới. Ứng dụng thứ hai sẽ nhận `customToken` qua query string `/sso?token=...` và tự động đăng nhập bằng `signInWithCustomToken()`.

## Cấu trúc chức năng chính

- `kyc-system/src/lib/firebase/client.ts` (và bản tương tự tại `user-system/src/lib/firebase/client.ts`): Khởi tạo Firebase client và thiết lập `browserLocalPersistence`.
- `kyc-system/src/lib/firebase/admin.ts` (song song với `user-system/src/lib/firebase/admin.ts`): Khởi tạo Firebase Admin SDK theo mô hình singleton.
- `kyc-system/src/app/api/auth/custom-token/route.ts` (user-system có route tương tự): API Route nhận `idToken`, xác thực bằng `verifyIdToken()` rồi phát hành custom token bằng `createCustomToken()`.
- `kyc-system/src/app/(auth)/login` & `.../register` (tương tự ở user-system): Form đăng nhập/đăng ký sử dụng Firebase client SDK.
- `kyc-system/src/app/sso/page.tsx` (và `user-system/src/app/sso/page.tsx`): Trang trung gian nhận custom token và gọi `signInWithCustomToken()`.
- `kyc-system/src/app/page.tsx` (và `user-system/src/app/page.tsx`): Dashboard hiển thị thông tin người dùng và nút mở ứng dụng đối tác bằng custom token.

## Kiểm thử nhanh

1. Khởi động cả hai ứng dụng.
2. Đăng ký và đăng nhập tại `http://localhost:3000/login`.
3. Nhấn "Mở ứng dụng user-system" để sinh custom token và mở `http://localhost:3001/sso?token=...`.
4. Xác nhận bạn đã đăng nhập vào user-system mà không cần nhập lại thông tin.
5. Thử chiều ngược lại từ `http://localhost:3001`.

## Lệnh hỗ trợ

- `npm run lint` – chạy ESLint cho từng ứng dụng.
- `npm run dev` – chạy môi trường dev (Next.js + Tailwind CSS).
