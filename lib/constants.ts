import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as { serverApi?: string; wsUrl?: string };

function resolveHost(url: string): string {
  if (Platform.OS === 'android') {
    return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return url;
}

export const SERVER_API = resolveHost(extra.serverApi ?? 'http://localhost:8080');

export const WS_URL = resolveHost(extra.wsUrl ?? 'ws://localhost:9091/app_socket');

export const AUTH_TOKEN_NAME = 'access_token';
export const USER_ID_KEY = 'user_id';

export const API = {
  REFRESH: 'auth/refresh-token',
  LOGIN: 'auth/login',
  LOGOUT: 'auth/logout',
  REGISTER: 'auth/register',
  ACTIVE: 'auth/active',
  FORGOT_PASSWORD: 'auth/forgot-password',
  VERIFY_OTP: 'auth/verify-otp',
  RESET_PASSWORD: 'auth/reset-password',

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

    AVATAR: (groupId: number) => `users/groups/${groupId}/avatar`,
    COVER: (groupId: number) => `users/groups/${groupId}/cover`,
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
    STATUS: 'users/friends/status',
    CANCEL_REQUEST: 'users/friends/requests/cancel',
  },

  NOTIFICATION: {
    BASE: 'notifications',
    UNREAD_COUNT: 'notifications/unread-count',
    READ_ALL: 'notifications/read-all',
  },

  PROFILE: {
    BASE: 'users',
    UPDATE: 'users/profile',
    AVATAR: 'users/profile/avatar',
    COVER: 'users/profile/cover',
  },

  SEARCH: 'users/search',

  GROUP_ADMIN: {
    INFO: 'users/groups',
    STATS: 'users/groups',
    MEMBER_REQUESTS: 'users/groups',
    MEMBER_APPROVE: 'users/groups',
    MEMBER_REJECT: 'users/groups',
    PENDING_POSTS: 'users/groups',
    POST_APPROVE: 'users/groups',
    POST_REJECT: 'users/groups',
  },

  STORY: {
    BASE: 'users/story',
    REEL: 'users/story/reel',
    FRIENDS: 'users/story/friends',
  },
};
