# Đồng bộ chức năng FE mới → Mobile

Tổng hợp các chức năng đã được implement bên `FinalGraduateFrontend` (từ ~2026-07-08 → 2026-07-14)
mà `FinalGraduateMobile` **chưa có / còn thiếu**.

## Bối cảnh timeline

- Mobile đồng bộ gần nhất: commit `6acbd6` (2026-07-10) — "avatar, cover for post, comment and group".
- FE hoàn thành sau mốc đó:
  - **Notification system** (2026-07-11).
  - **Cải thiện Chat sâu** (2026-07-10 → 2026-07-14): gửi ảnh/file, like, quản lý media, load tin nhắn.
  - **Forgot password** (2026-07-14).

---

## 1. Quên mật khẩu (Forgot Password) — CHƯA CÓ

FE: `userService.forgotPassword / verifyOtp / resetPassword` + view `ForgotPassword.tsx`
(flow 3 bước: gửi OTP → xác nhận OTP → đặt lại mật khẩu).

Cần làm ở Mobile:

- [ ] Thêm endpoint vào `lib/constants.ts`: `FORGOT_PASSWORD`, `VERIFY_OTP`, `RESET_PASSWORD`.
- [ ] Thêm 3 method vào `services/userService.ts`.
- [ ] Màn hình `app/forgot-password.tsx` (multi-step).
- [ ] Link "Quên mật khẩu?" từ `app/login.tsx`.

## 2. Hệ thống Thông báo (Notifications) — CHƯA CÓ

FE: `notificationSlice`, `notificationService`, hook `useNotification`
(list infinite scroll, unread count, markAsRead, markAllAsRead), type `INotification`
(8 loại: COMMENT, REPLY, FRIEND_REQUEST, FRIEND_ACCEPT, GROUP_JOIN_REQUEST,
GROUP_JOIN_APPROVED, GROUP_POST_PENDING, GROUP_POST_APPROVED), UI popover + preview.

Cần làm ở Mobile:

- [ ] `NOTIFICATION` endpoints trong `lib/constants.ts` (BASE, UNREAD_COUNT, READ_ALL, `{id}/read`).
- [ ] Type `INotification` + `NotificationType` trong `types/index.ts`.
- [ ] `store/notificationSlice.ts`.
- [ ] `services/notificationService.ts`.
- [ ] `hooks/useNotification.ts` (useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead).
- [ ] Màn hình danh sách thông báo + badge unread + điều hướng khi bấm (useNotificationClick).

## 3. Chat — thiếu nhiều so với FE mới

Mobile hiện chỉ gửi/nhận **text**; typing đã có trong hook nhưng chưa nối vào ô nhập.

Cần làm ở Mobile:

- [ ] **Gửi ảnh & file** trong tin nhắn (messageType `IMAGE` / `FILE`); file dùng định dạng `url|filename`.
- [ ] Bổ sung `IMAGE` / `FILE` vào type `MessageType`.
- [ ] **Hiển thị bong bóng theo loại**: IMAGE (ảnh), FILE (tải xuống),
      VIDEO_CALL/AUDIO_CALL (nhật ký cuộc gọi + nút gọi lại).
- [ ] **Nút thả tim 👍 nhanh** khi ô nhập trống.
- [ ] **Load thêm tin nhắn cũ**: thêm `getConversationDetail2(conversationId, beforeId)` vào `chatService` + xử lý load-more khi cuộn lên trong `app/chat/[id].tsx`.
- [ ] **Quản lý phương tiện hội thoại** (tab Ảnh/File + xem/tải): `mediaSlice` + màn quản lý + `downloadMedia`.
- [ ] **Thêm thành viên vào nhóm chat**: `chatService.addMembersToGroup` + UI.
- [ ] **Xem danh sách thành viên** nhóm chat.
- [ ] **Tìm kiếm hội thoại** (private + group) trong `app/(tabs)/messages.tsx`.
- [ ] **Nhắn tin khi chưa là bạn bè** (bấm profile → tạo direct conversation) — kiểm tra & bổ sung nếu thiếu.
- [ ] **Nối typing indicator**: gọi `setTyping` khi gõ trong `app/chat/[id].tsx`.

## 4. Nhóm (Groups) — thiếu tab thành viên

- [ ] **Tab danh sách thành viên nhóm** trong `app/group/[id].tsx`
      (`groupService.getGroupMembers` đã có, chỉ thiếu UI).
- Join PENDING/APPROVED: **đã có**.
- Group admin (member-requests, pending-posts): **đã có**.

---

## Thứ tự ưu tiên đề xuất

1. **Notifications** — ảnh hưởng trải nghiệm tổng thể.
2. **Chat nâng cao** — gửi ảnh/file + hiển thị theo loại + load-more + nối typing.
3. **Forgot password** — độc lập, nhỏ gọn.
4. **Quản lý phương tiện hội thoại + thêm thành viên nhóm chat + tìm kiếm hội thoại**.
5. **Tab thành viên nhóm**.
