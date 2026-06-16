# AGENTS

Mobile app (Expo + React Native) cloned from the web `FinalGraduateFrontend`. Shares the same Spring microservices backend. Uses the same 3-layer Service → Hook → UI architecture as the web app, adapted for the mobile platform.

## Commands

- `npm start` — Start the Expo dev server (Metro).
- `npm run android` — Open the app on Android (emulator/device).
- `npm run ios` — Open the app on the iOS simulator.
- `npm run web` — Run the web build.
- `npm run lint` — ESLint + Prettier check.
- `npm run format` — ESLint `--fix` + Prettier `--write`.
- `npx tsc --noEmit -p tsconfig.json` — Type-check (run after every change).

## Entry + App Wiring

- Uses **expo-router** (file-based routing). Entry is `expo-router/entry` (declared in `package.json > main`).
- `app/_layout.tsx` is the root layout: wraps the Redux `Provider`, hydrates the session, and gates navigation (not logged in → Login).
- Alias `@` points to the project root (configured in `tsconfig.json`, enabled via `experiments.tsconfigPaths` in `app.json`).
- Backend base URL is configured via `app.json > extra.serverApi` (default `http://localhost:8080`).
- Chat WebSocket is configured via `app.json > extra.wsUrl` (default `ws://localhost:9091/app_socket`).

## Platform differences vs. web (IMPORTANT)

- **Storage**: `localStorage` (web, synchronous) → `AsyncStorage` (mobile, **asynchronous**). Any token read must `await storage.get(...)`. Wrapper lives in `lib/storage.ts`.
- **Routing**: `react-router-dom` → `expo-router`. `useNavigate` → `useRouter`; react-router `<Link>` → `expo-router`. Routes follow the `app/` directory tree.
- **localhost on the Android emulator**: `localhost` resolves to the emulator itself. `lib/constants.ts` automatically rewrites `localhost`/`127.0.0.1` → `10.0.2.2` when `Platform.OS === 'android'`. Physical devices must use the host LAN IP via `app.json > extra`.
- **HTML tags** → React Native: `div` → `View`, `img` → `expo-image` `Image`, text must always be wrapped in `Text`, `button`/clickables → `Pressable`/`Button`.
- **File upload**: web `File`/`FormData` → use `expo-image-picker` to get a URI, then build `FormData` with an object `{ uri, name, type }` (see `userService.buildImageFormData`).
- **Toast (`sonner`)** → React Native `Alert`.
- **WebSocket/STOMP**: RN's WebSocket handles text frames non-standardly → the STOMP client **must** enable `forceBinaryWSFrames: true` and `appendMissingNULLonIncoming: true`, otherwise the CONNECT handshake hangs silently. See `lib/chatSocket.ts`.

## UI / Styling

- **NativeWind** (Tailwind for RN). Tailwind classes are used directly via the `className` prop. Configured in `tailwind.config.js`, `global.css`, `nativewind-env.d.ts`.
- className helper: `lib/utils.ts` (clsx + tailwind-merge).
- Self-rolled UI primitives in `components/ui/` (`button.tsx`, `text.tsx`) — built with `class-variance-authority` + `@rn-primitives/*`.
- Icons: `@expo/vector-icons` (using `Ionicons`).
- Images: `expo-image` (`Image` with `contentFit`).
- Colors in code use HSL values matching the theme (e.g. `hsl(240, 5.9%, 10%)`).

## HTTP / API Layer

### Http — `lib/http.ts`

- Axios wrapper singleton: `import http from '@/lib/http'`. **All API calls must go through this.**
- Token is read from `AsyncStorage` (async) in the request interceptor.
- Auto refresh token on 401; handles 403; same mechanism as the web app but async.
- All methods return `T` directly (not `AxiosResponse<T>`): `get`, `post`, `put`, `delete`, `deleteWithBody`, `postWithFile`.

### BaseService — `services/BaseService.ts`

- Base class for every service. Extend it, never instantiate directly.
- Automatically unwraps `ApiResultGeneric<T>.data`.
- Methods: `getList<T>`, `getSingle<T>`, `create<T>`, `createAndGetData<T>`, `update<T>`, `updateAndGetData<T>`, `delete`, `deleteWithBody`.

### API constants — `lib/constants.ts`

- The `API` object: central registry of all path segments. Never hardcode strings in services.
- `AUTH_TOKEN_NAME`, `USER_ID_KEY`: AsyncStorage keys.
- `SERVER_API`, `WS_URL`: already passed through `resolveHost()` to rewrite to `10.0.2.2` on Android.

### Service pattern

- Each service extends `BaseService` and exports a singleton: `export default new XxxService()`.
- **Keep services thin.** If standard CRUD is enough, leave the class body empty (e.g. `commentService.ts`). Only add custom methods when an endpoint doesn't fit `BaseService` (e.g. `userService.login()`, `chatService`, `friendService`, `groupService`).

## Directory structure

```
FinalGraduateMobile/
├── app/                       # expo-router (file-based routes)
│   ├── _layout.tsx            # Root: Provider + session gate
│   ├── login.tsx, register.tsx
│   ├── search.tsx             # Search screen
│   ├── (tabs)/                # Tab navigator
│   │   ├── _layout.tsx        # Tab bar config (icon-only)
│   │   ├── index.tsx          # Feed (header has search/create/messages)
│   │   ├── friends.tsx, groups.tsx, profile.tsx, settings.tsx
│   │   ├── create.tsx         # Create post (hidden from tab bar, opened from header)
│   │   └── messages.tsx       # Conversation list (hidden from tab bar)
│   ├── post/[id].tsx          # Post detail + comments
│   ├── group/[id].tsx         # Group detail
│   ├── chat/[id].tsx          # Realtime chat window
│   ├── user/[id].tsx          # Other user's profile
│   └── profile/edit.tsx       # Edit profile
├── components/                # Shared components
│   ├── ui/                    # Primitives (button, text)
│   ├── PostCard.tsx, CommentItem.tsx, FriendRow.tsx,
│   └── GroupCard.tsx, SentimentIndicator.tsx
├── hooks/                     # All business logic
├── services/                  # API wrappers (extends BaseService)
├── store/                     # Redux Toolkit slices + store + typed hooks
├── lib/                       # http, storage, constants, chatSocket, media, time, imagePicker, utils
└── types/index.ts             # All shared interfaces
```

## State Management — `store/`

- Redux Toolkit. Use the typed hooks `useAppSelector`/`useAppDispatch` from `store/hooks.ts` (do NOT use `react-redux` directly).
- `RootState`, `AppDispatch` are exported from `store/store.ts`.

### Slices

| Slice     | File              | Description                                          |
| --------- | ----------------- | ---------------------------------------------------- |
| `user`    | `userSlice.ts`    | userId, username, token, profile, loginSuccess       |
| `post`    | `postSlice.ts`    | suggestedFeed (cursor), currentPost, optimistic like |
| `comment` | `commentSlice.ts` | commentsByPost, repliesByComment                     |
| `friend`  | `friendSlice.ts`  | requests, suggestions, friends, requestCount         |
| `group`   | `groupSlice.ts`   | joinedGroups, suggestedGroups, groupFeed             |
| `chat`    | `chatSlice.ts`    | conversationId, chatInfo, typingUsers, connected     |

## Hooks — `hooks/`

| Hook                                                                                                                                                                  | File            | Description                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------- |
| `useSession`                                                                                                                                                          | `useSession.ts` | Hydrate token from AsyncStorage on boot |
| `useLoginUser`, `useLogoutUser`, `useUserRegister`, ...                                                                                                               | `useUser.ts`    | Auth flows                              |
| `useSuggestedFeed`, `useCreatePost`, `useLikePost`, `useUpdatePost`, `useDeletePost`                                                                                  | `usePost.ts`    | Posts                                   |
| `useComments`, `useReplies`, `useCreateComment`, `useEditComment`, `useDeleteComment`, `useLikeComment`                                                               | `useComment.ts` | Comments                                |
| `useProfile`, `useUpdateProfile`, `useUploadAvatar`, `useUploadCover`, `useUserPosts`                                                                                 | `useProfile.ts` | Profile                                 |
| `useFriendRequests`, `useFriendSuggestions`, `useAllFriends`, `useAcceptRequest`, `useDeclineRequest`, `useSendFriendRequest`, `useUnfriend`, `useFriendRequestCount` | `useFriend.ts`  | Friends                                 |
| `useGroupsData`, `useGroupDetail`, `useGroupActions`, `useGroupFeed`, `useSingleGroupPosts`                                                                           | `useGroup.ts`   | Groups                                  |
| `useSocketConnection`, `useConversations`, `useConversation`                                                                                                          | `useChat.ts`    | Realtime chat                           |
| `useSearch`                                                                                                                                                           | `useSearch.ts`  | Search users/groups (300ms debounce)    |

### Service → Hook → UI architecture

| Layer                                        | Responsibility                                                                                  | Accesses store? |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------- |
| **Service** (`services/`)                    | Thin API wrapper, extends `BaseService`. No business logic.                                     | ❌              |
| **Hook** (`hooks/`)                          | All logic: calls services, dispatches to store, local state, errors, navigation.                | ✅              |
| **Screen/Component** (`app/`, `components/`) | Presentation only. Consumes hook return values. Never calls `useAppSelector`/services directly. | ❌ (via hook)   |

## Realtime chat — `lib/chatSocket.ts`

- STOMP client (`@stomp/stompjs`) singleton, `text-encoding` polyfill, `webSocketFactory: () => new WebSocket(WS_URL)`.
- Requires `forceBinaryWSFrames` + `appendMissingNULLonIncoming` for RN.
- Re-applies subscriptions on `onConnect` (connect/subscribe timing is easily out of sync on mobile).
- Does NOT disconnect the socket when leaving a single screen — keeps the connection alive app-wide.
- Destinations: send `/app/chat.send`, typing `/app/chat.typing`; receive `/topic/conversation/{id}`.
- Backend returns messages with a `user: { id, username, avatarUrl }` field (not `senderId`).

## Types — `types/index.ts`

- All interfaces are gathered in a single file: `ApiResult`/`ApiResultGeneric<T>`, `CursorPageResponse<T>`, `IAuthor`, `UserProfileDTO`, `IPost`/`IPostDetails`, `IComment`, friend types, `IGroup`, chat types (`Conversation`, `ChatMessage`, `MessageChat`).
- `types/shims.d.ts`: declarations for modules missing `@types` (e.g. `text-encoding`).

## Naming + export conventions

- Component files use PascalCase, `.tsx` for files with JSX, `.ts` for plain TS.
- Components use named exports (e.g. `export function PostCard`), except route screens in `app/` which use `export default`.
- Code comments are written in Vietnamese, explaining the "why" for platform-specific differences.

## Language

- All UI text is in Vietnamese.

## Scope done / deferred

- ✅ Auth, Feed/Social, Comments (+ sentiment), Profile, Friends, Groups, realtime Messenger, Search.
- ⏸️ Deferred: Admin (user/group management), Call (WebRTC), images in posts/share. See `MOBILE_CLONE_PLAN.md`.
