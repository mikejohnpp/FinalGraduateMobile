## Cấu hình môi trường (.env)

App đọc cấu hình (API, Supabase) từ file `.env` qua `app.config.js`. File `.env` **không commit** (đã có trong `.gitignore`).

Bước đầu (lần đầu clone repo):

```bash
cp .env.example .env
# rồi mở .env điền giá trị thật (SERVER_API, WS_URL, SUPABASE_URL, SUPABASE_KEY...)
```

Các biến cần thiết:

| Biến                    | Mô tả                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `SERVER_API`            | URL backend, vd `http://100.120.5.8:30940`                    |
| `WS_URL`                | URL WebSocket (STOMP), vd `ws://100.120.5.8:30940/app_socket` |
| `SUPABASE_URL`          | URL project Supabase (dùng upload media)                      |
| `SUPABASE_KEY`          | Anon/publishable key của Supabase                             |
| `SUPABASE_MEDIA_BUCKET` | Tên bucket lưu media, mặc định `media`                        |

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
