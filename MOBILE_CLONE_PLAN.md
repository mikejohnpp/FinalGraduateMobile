# Kế hoạch clone Web → Mobile (Expo + NativeWind)

Mục tiêu: clone chức năng từ `FinalGraduateFrontend` (React web) sang `FinalGraduateMobile` (Expo).
Phạm vi đợt này: **bỏ qua Admin và Call** (làm sau). Ưu tiên **Feed / Social**.

Backend dùng chung (Spring microservices), base URL cấu hình qua biến môi trường.

---

## Nguyên tắc chia nhỏ (tránh hết token)

Mỗi "chunk" là một đơn vị công việc nhỏ, build + chạy được, commit được. Làm tuần tự từng chunk.

---

## GIAI ĐOẠN 0 — FOUNDATION (hạ tầng dùng chung) ✅

- [x] **0.1 Dependencies**: axios, @reduxjs/toolkit, react-redux, @react-native-async-storage/async-storage, expo-image.
- [x] **0.2 Config & constants**: `lib/constants.ts` (API endpoints, token key) + `app.json > extra.serverApi`.
- [x] **0.3 Storage**: `lib/storage.ts` bọc AsyncStorage (thay cho localStorage của web).
- [x] **0.4 HTTP client**: `lib/http.ts` — axios instance + interceptor + refresh token (AsyncStorage, async).
- [x] **0.5 Types**: `types/index.ts` (ApiResult, IBase, IAuthor, IPost, IPostDetails, CursorPage, IPostCreate, UserProfileDTO, TokenResult, RegisterFormData...).
- [x] **0.6 BaseService**: `services/BaseService.ts`.
- [x] **0.7 Redux store**: `store/store.ts` + typed hooks `store/hooks.ts` + `Provider` trong `app/_layout.tsx`.

## GIAI ĐOẠN 1 — AUTH (điều kiện tiên quyết để gọi API) ✅

- [x] **1.1 userSlice** + `hooks/useSession.ts` hydrate token từ AsyncStorage lúc khởi động.
- [x] **1.2 userService** (login, logout, register, activate, getProfile, updateProfile).
- [x] **1.3 useUser hooks** (useLoginUser, useLogoutUser, useUserRegister, useUserProfile).
- [x] **1.4 Màn hình Login** (`app/login.tsx`) + Register (`app/register.tsx`).
- [x] **1.5 Auth guard / điều hướng**: gate trong `RootNavigator` — chưa đăng nhập → Login; đã đăng nhập → Tabs.

## GIAI ĐOẠN 2 — FEED / SOCIAL (ưu tiên cao) ✅

- [x] **2.1 postSlice** (suggestedFeed, currentPost, like optimistic).
- [x] **2.2 postService** (like/unlike) + BaseService cho CRUD post.
- [x] **2.3 usePost hooks** (useSuggestedFeed + refresh/loadMore, useCreatePost, useLikePost, useUpdatePost, useDeletePost).
- [x] **2.4 PostCard component** (`components/PostCard.tsx`) + `lib/media.ts`, `lib/time.ts`.
- [x] **2.5 Màn hình Feed** (`app/(tabs)/index.tsx` — FlatList + pull-to-refresh + load more).
- [x] **2.6 CreatePost** (`app/(tabs)/create.tsx`).
- [ ] **2.7 (còn lại)** Hình ảnh trong post (image picker + hiển thị nhiều ảnh), share.

## GIAI ĐOẠN 3 — COMMENTS ✅

- [x] **3.1 commentSlice + commentService + useComment** (comments, replies, create, edit, delete, like).
- [x] **3.2 Màn hình bình luận** (`app/post/[id].tsx` + `components/CommentItem.tsx` — list + reply + like + composer).

## GIAI ĐOẠN 4 — PROFILE

- [ ] **4.1 Màn hình Profile** (cover, avatar, thông tin).
- [ ] **4.2 Edit profile + upload avatar/cover**.

## GIAI ĐOẠN 5 — FRIENDS ✅

- [x] **5.1 friendSlice + friendService + useFriend** (requests, suggestions, friends, accept/decline/send/unfriend, badge count).
- [x] **5.2 Màn hình Bạn bè** (`app/(tabs)/friends.tsx` + `components/FriendRow.tsx` — 3 tab: lời mời, gợi ý, bạn bè).

## GIAI ĐOẠN 6 — GROUPS (cơ bản, bỏ phần admin) ✅

- [x] **6.1 groupSlice + groupService + useGroup** (joined/suggested, join/leave/create, group feed, single group posts).
- [x] **6.2 Màn hình Nhóm** (`app/(tabs)/groups.tsx` + `components/GroupCard.tsx` + chi tiết nhóm `app/group/[id].tsx`).

## GIAI ĐOẠN 7 — MESSENGER (realtime) ✅

- [x] **7.1 STOMP client cho RN** (`lib/chatSocket.ts` — @stomp/stompjs + polyfill `text-encoding`, WebSocket factory).
- [x] **7.2 chatSlice + chatService + useChat** (kết nối socket, danh sách hội thoại, chi tiết + realtime + gửi tin + typing).
- [x] **7.3 Màn hình** (`app/(tabs)/messages.tsx` danh sách + `app/chat/[id].tsx` cửa sổ chat realtime).

## SAU CÙNG (đã hoãn)

- [ ] Admin (quản lý user/group).
- [ ] Call (WebRTC).

---

## Ghi chú kỹ thuật khi port web → mobile

- `localStorage` → `AsyncStorage` (async). Mọi chỗ đọc token phải `await`.
- `react-router-dom` → `expo-router` (file-based). `useNavigate` → `useRouter`, `<Link>` → `expo-router Link`.
- `toast (sonner)` → dùng `Alert` hoặc thư viện toast cho RN (vd: `burnt` / `react-native-toast-message`).
- HTML tags (`div`, `img`...) → RN (`View`, `Image`/`expo-image`, `Text`, `Pressable`).
- File upload `File`/`FormData` → dùng `expo-image-picker` + FormData RN.
- CSS classes giữ nguyên nhờ NativeWind (đa số class Tailwind tương thích).
