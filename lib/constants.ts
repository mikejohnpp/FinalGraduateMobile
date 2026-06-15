// API base URL — đổi theo môi trường.
// Lưu ý quan trọng về "localhost" tuỳ nền tảng:
//   - Web / iOS simulator: localhost trỏ đúng về máy host.
//   - Android emulator: localhost = chính máy ảo → phải dùng 10.0.2.2 để trỏ về máy host.
//   - Thiết bị thật: phải dùng IP LAN của máy chủ (vd: 192.168.1.x) — cấu hình qua app.json > extra.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as { serverApi?: string; wsUrl?: string };

// Đổi localhost/127.0.0.1 → 10.0.2.2 khi chạy trên Android emulator.
function resolveHost(url: string): string {
    if (Platform.OS === 'android') {
        return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
    }
    return url;
}

export const SERVER_API = resolveHost(extra.serverApi ?? 'http://localhost:8080');

// WebSocket (STOMP) cho chat realtime.
export const WS_URL = resolveHost(extra.wsUrl ?? 'ws://localhost:9091/app_socket');

export const AUTH_TOKEN_NAME = 'access_token';
export const USER_ID_KEY = 'user_id';


export const API = {
    REFRESH: 'api/auth/refresh-token',
    LOGIN: 'api/auth/login',
    LOGOUT: 'api/auth/logout',
    REGISTER: 'api/auth/register',
    ACTIVE: 'api/auth/active',

    POST: {
        BASE: 'users/posts',
        SUGGESTED: 'users/posts/suggested',
        SEARCH: 'users/posts/search',
    },

    GROUP: {
        BASE: 'users/groups',
        JOINED: 'users/groups/joined',
        SUGGESTED: 'users/groups/suggested',
        FEED: 'users/groups/posts/feed',
    },

    COMMENT: {
        PATH: 'comments',
        REPLIES_PATH: 'replies',
        LIKE_PATH: 'like',
    },

    FRIEND: {
        BASE: 'users/friends',
        REQUESTS: 'users/friends/requests',
        REQUESTS_COUNT: 'users/friends/requests/count',
        SUGGESTIONS: 'users/friends/suggestions',
    },

    PROFILE: {
        BASE: 'users',
        UPDATE: 'users/profile',
        AVATAR: 'users/profile/avatar',
        COVER: 'users/profile/cover',
    },

    SEARCH: 'users/search',
};
