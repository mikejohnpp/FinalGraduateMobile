# Đồng bộ chức năng FE → Mobile

Kế hoạch đưa `FinalGraduateMobile` về ngang bằng `FinalGraduateFrontend` (trừ Admin).

**Phạm vi loại trừ:** Admin panel (`/admin`, user/group management, sentiment stats, reports)
— **không** port sang mobile. Web giữ nguyên.

---

## Trạng thái đã đồng bộ (kiểm tra 2026-07-26)

Các mục trong bản plan cũ đã hoàn thành:

- [x] Quên mật khẩu — `app/forgot-password.tsx` + `userService.forgotPassword/verifyOtp/resetPassword`.
- [x] Hệ thống thông báo — `notificationSlice`, `notificationService`, `useNotification`,
      `useNotificationClick`, `app/notifications.tsx`.
- [x] Chat: gửi ảnh/tệp (`IMAGE`/`FILE`), bong bóng theo loại, load-more qua
      `getConversationDetail2(conversationId, beforeId)`, `addMembersToGroup`, tìm kiếm hội thoại,
      nối `setTyping` vào ô nhập trong `app/chat/[id].tsx`.
- [x] Tab thành viên nhóm trong `app/group/[id].tsx`.
- [x] Cuộc gọi WebRTC (`react-native-webrtc` + `CallProvider` + `CallModal`).

---

## Phase 0 — Storage Cloudflare R2 (chặn các phase sau)

FE đã chuyển sang R2 làm storage chính: `src/plugins/storage/` với `r2Provider` (S3 API,
`@aws-sdk/client-s3`, endpoint `https://{accountId}.r2.cloudflarestorage.com`), chọn provider qua
`VITE_STORAGE_PROVIDER` (mặc định `r2`), Supabase còn lại làm fallback. Mobile vẫn gọi thẳng
`supabase.storage`.

**Phương án đã chốt: A — tự ký SigV4 trong app.** `@aws-sdk/client-s3` không chạy được trên RN
(bundle browser cần `crypto.subtle`, Hermes không có), nên ký SigV4 bằng `js-sha256` (pure JS,
không native module → không phải prebuild lại) rồi upload bằng
`FileSystem.uploadAsync(url, uri, { httpMethod: 'PUT' })`.

> ⚠️ Đánh đổi đã biết: access key / secret key nằm trong app bundle (giải nén APK là đọc được),
> giống như FE đang nhúng vào bundle web. Hướng an toàn hơn về sau là backend cấp presigned URL
> (`POST /media/presign`) cho cả web và mobile.

> Thư mục đặt tên `lib/mediaStorage/` (không phải `lib/storage/`) vì đã có `lib/storage.ts`
> (wrapper AsyncStorage) — trùng tên thì TS/Metro resolve vào file cũ.

- [x] `lib/mediaStorage/types.ts` — `StorageProviderName = 'r2' | 'supabase'`, `UploadResult`,
      `UploadItem` (uri + contentType, thay cho `File`), `StorageProvider`.
- [x] `lib/mediaStorage/sigv4.ts` — ký AWS SigV4 + `encodeObjectKey`.
- [x] `lib/mediaStorage/r2Provider.ts` — `isConfigured` + `upload(item, path)`.
- [x] `lib/mediaStorage/supabaseProvider.ts` — bọc lại code Supabase hiện có.
- [x] `lib/mediaStorage/index.ts` — `getActiveProvider()`, `uploadToStorage()`, `buildObjectPath()`.
- [x] `app.config.js > extra`: thêm `storageProvider`, `r2AccountId`, `r2AccessKeyId`,
      `r2SecretAccessKey`, `r2Bucket`, `r2PublicUrl`.
- [x] Cập nhật `.env.example` và bảng biến môi trường trong `README.md`.
- [x] `lib/mediaUpload.ts`: giữ `inferMediaType`, `MAX_MEDIA_SIZE_MB`, `MAX_IMAGE_SIZE_MB`;
      chuyển phần upload sang `uploadToStorage`; đổi `uploadImageToSupabase` →
      `uploadImageToStorage`.
- [x] Sửa lệch luồng avatar/cover: mobile `useUploadAvatar`/`useUploadCover` từng gọi endpoint
      multipart `users/profile/avatar|cover`; nay upload lên storage rồi `PUT /users/profile`
      với `{ avatar }` / `{ coverPhoto }` như web. Bỏ `userService.uploadAvatar/uploadCover`
      và `pickImage` (không còn callsite), bổ sung `userName`/`avatar`/`coverPhoto` vào
      `IProfileUpdate` cho khớp web.
- [x] Kiểm chứng chữ ký: đối chiếu `signRequest` với `@smithy/signature-v4` (thư viện
      `@aws-sdk/client-s3` dùng ở web) trên 3 key gồm tên tệp có dấu/khoảng trắng/ký tự đặc
      biệt → chữ ký khớp hoàn toàn. Chưa test upload thật lên R2 (cần credential thật).

## Phase 1 — UI primitives

Mobile chỉ có `components/ui/button.tsx` + `text.tsx`; mọi thứ khác vẽ tay trong từng screen.
Tách primitive theo đúng pattern đang dùng trước khi port thêm màn hình.

- [ ] `ui/tabs.tsx` — 2 biến thể: gạch chân (như `(tabs)/profile.tsx`) và pill (như `notifications.tsx`).
- [ ] `ui/avatar.tsx` — `expo-image` + fallback chữ cái đầu.
- [ ] `ui/badge.tsx` — dùng cho số lời mời / unread.
- [ ] `ui/input.tsx` — `TextInput` + variant lỗi.
- [ ] `ui/skeleton.tsx` — placeholder khi tải (đối ứng `PostSkeleton` của web).
- [ ] `ui/modal.tsx` — bottom sheet bằng RN `Modal` (không thêm `@gorhom/bottom-sheet` để
      tránh phải prebuild lại).
- [ ] `ui/empty.tsx` — trạng thái rỗng.

## Phase 2 — Friends (web có 4 nhánh, mobile đang gộp 1 tab)

- [ ] `app/friends/_layout.tsx` + `index.tsx` (trang chủ), `requests.tsx`, `suggest.tsx`, `all.tsx`.
- [ ] Badge số lời mời từ `useFriendRequestCount`.
- [ ] Load-more theo cursor cho requests / suggestions / all.
- [ ] Hook + service phía mobile đã đủ (`useFriendRequests`, `useFriendSuggestions`,
      `useAllFriends`, `useAcceptRequest`, `useDeclineRequest`, `useSendFriendRequest`,
      `useUnfriend`) — chỉ thiếu UI.

## Phase 3 — Groups

- [ ] Tách `(tabs)/groups.tsx` thành 3 tab: Bảng tin / Khám phá / Nhóm của bạn.
- [ ] `app/group/[id]/admin/overview.tsx` (tổng quan) và `community.tsx` (trang cộng đồng).

## Phase 4 — Messenger

- [ ] Tab Cá nhân / Nhóm trong `app/(tabs)/messages.tsx`.
- [ ] UI tạo nhóm chat — `chatService.createGroupConversation` đã có nhưng chưa nơi nào gọi.
- [ ] Đưa nút thêm thành viên + xem danh sách thành viên lên header `app/chat/[id].tsx`
      (hiện chỉ có trong `chat-info/[id].tsx`).
- [ ] `store/mediaSlice.ts` cho quản lý ảnh/tệp hội thoại (thay local state trong `chat-info`) + tải tệp về máy.
- [ ] Ghi chú: `chatSlice.setTyping` không bên nào dispatch → `typingUsers` luôn rỗng ở **cả**
      web và mobile. Nối đúng ở mobile; việc sửa web để user quyết định.

## Phase 5 — Profile

- [ ] Tab Giới thiệu / Ảnh / Bạn bè / Reels (web: `ProfileAbout`, `ProfilePhotos`,
      `ProfileFriends`, `ProfileReel`).
- [ ] Panel chỉnh sửa nhanh (đối ứng `ProfileEditPanel`).
- [ ] Modal album ảnh bìa (`CoverPhotoAlbumModal`).
- [ ] Số bạn bè bấm được để chuyển tab (web đang là button, mobile là text).

## Phase 6 — Xem bài viết & ảnh

- [ ] `store/postViewerSlice.ts` cho khớp web.
- [ ] Màn xem media toàn màn hình, swipe giữa các ảnh (`react-native-reanimated` đã có).
      Web dùng modal `PostViewer` + `MediaLightbox`; mobile giữ `post/[id].tsx` làm route
      và thêm viewer riêng.

## Phase 7 — Story & Reels

- [ ] Story creator 3 biến thể text / ảnh / video (web có 4 sidebar + `StoryTypePicker`).
- [ ] `app/stories.tsx` đủ tính năng như `StoryViewer.tsx`.
- [ ] Reels parity với `views/reels/Reels.tsx`.

## Phase 8 — Auth

- [ ] Màn kích hoạt tài khoản tương ứng web `/kich-hoat/:code`, qua deep link
      `fgmobile://kich-hoat/[code]` (scheme `fgmobile` đã khai báo trong `app.config.js`).

## Phase 9 — Dọn dẹp & kiểm tra

- [ ] `store/socketSlice.ts` cho khớp web (mobile hiện gate bằng `chatSlice.connected`).
- [ ] Rà `types/index.ts` so với `src/types/interfaces/**`.
- [ ] Cập nhật `AGENTS.md` — mục "Scope done / deferred" đang ghi Call và ảnh trong bài là
      deferred, nhưng cả hai đã làm; Admin thì chốt là không port.
- [ ] `npx tsc --noEmit -p tsconfig.json` + `npm run lint`.
