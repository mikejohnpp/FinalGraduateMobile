## Cấu hình môi trường (.env)

App đọc cấu hình (API, storage) từ file `.env` qua `app.config.js`. File `.env` **không commit** (đã có trong `.gitignore`).

Bước đầu (lần đầu clone repo):

```bash
cp .env.example .env
# rồi mở .env điền giá trị thật (SERVER_API, WS_URL, R2_*...)
```

Các biến cần thiết:

| Biến                    | Mô tả                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| `SERVER_API`            | URL backend, vd `http://100.120.5.8:30940`                       |
| `WS_URL`                | URL WebSocket (STOMP), vd `ws://100.120.5.8:30940/app_socket`    |
| `STORAGE_PROVIDER`      | `r2` (mặc định, khớp web) hoặc `supabase` (fallback)             |
| `R2_ACCOUNT_ID`         | Account ID Cloudflare                                            |
| `R2_ACCESS_KEY_ID`      | Access key của R2 (S3-compatible)                                |
| `R2_SECRET_ACCESS_KEY`  | Secret key của R2                                                |
| `R2_BUCKET`             | Tên bucket, mặc định `media`                                     |
| `R2_PUBLIC_URL`         | Domain công khai của bucket (r2.dev / custom), không có `/` cuối |
| `SUPABASE_URL`          | URL project Supabase (chỉ dùng khi fallback)                     |
| `SUPABASE_KEY`          | Anon/publishable key của Supabase                                |
| `SUPABASE_MEDIA_BUCKET` | Tên bucket Supabase, mặc định `media`                            |

### Upload media

Media (ảnh/video bài viết, avatar, ảnh bìa, story) đi lên Cloudflare R2 qua S3-compatible API.
Khác với web (dùng `@aws-sdk/client-s3`), mobile tự ký SigV4 ở `lib/mediaStorage/sigv4.ts` bằng
`js-sha256` vì aws-sdk cần WebCrypto mà Hermes không có. Nếu R2 chưa cấu hình đủ, lớp
`lib/mediaStorage` tự fallback sang Supabase Storage.

> ⚠️ Access key R2 được nhúng vào bundle app nên có thể trích xuất từ APK. Chỉ nên dùng token
> giới hạn quyền (write vào đúng một bucket). Hướng an toàn hơn là để backend cấp presigned URL.

Sau khi đổi `.env`, chạy lại Metro có xoá cache để nạp giá trị mới:

```bash
npx expo start -c
```

> Lưu ý: giá trị `.env` được nhúng vào bundle lúc build/start, không đọc runtime. Với Android emulator, `localhost` sẽ tự đổi sang `10.0.2.2` trong `lib/constants.ts`.

## Nix

```bash
QT_QPA_PLATFORM=xcb \
env -u LD_LIBRARY_PATH emulator \
  -avd FinalGraduateEmulator \
  -gpu host \
-no-snapshot

```
