import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CursorPageResponse, IFriendRequest, IFriendship, IFriendSuggestion } from '@/types';

interface FriendFeedState<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface FriendState {
  requests: FriendFeedState<IFriendRequest>;
  suggestions: FriendFeedState<IFriendSuggestion>;
  friends: FriendFeedState<IFriendship>;
  requestCount: number;
}

const makeFeed = <T>(): FriendFeedState<T> => ({
  items: [],
  nextCursor: null,
  hasMore: true,
});

const initialState: FriendState = {
  requests: makeFeed<IFriendRequest>(),
  suggestions: makeFeed<IFriendSuggestion>(),
  friends: makeFeed<IFriendship>(),
  requestCount: 0,
};

const friendSlice = createSlice({
  name: 'friend',
  initialState,
  reducers: {
    setRequests: (state, action: PayloadAction<CursorPageResponse<IFriendRequest>>) => {
      state.requests.items = action.payload.data;
      state.requests.nextCursor = action.payload.nextCursor;
      state.requests.hasMore = action.payload.hasMore;
    },
    appendRequests: (state, action: PayloadAction<CursorPageResponse<IFriendRequest>>) => {
      state.requests.items.push(...action.payload.data);
      state.requests.nextCursor = action.payload.nextCursor;
      state.requests.hasMore = action.payload.hasMore;
    },
    removeRequest: (state, action: PayloadAction<number>) => {
      state.requests.items = state.requests.items.filter((r) => r.requestId !== action.payload);
    },

    setSuggestions: (state, action: PayloadAction<CursorPageResponse<IFriendSuggestion>>) => {
      state.suggestions.items = action.payload.data;
      state.suggestions.nextCursor = action.payload.nextCursor;
      state.suggestions.hasMore = action.payload.hasMore;
    },
    appendSuggestions: (state, action: PayloadAction<CursorPageResponse<IFriendSuggestion>>) => {
      state.suggestions.items.push(...action.payload.data);
      state.suggestions.nextCursor = action.payload.nextCursor;
      state.suggestions.hasMore = action.payload.hasMore;
    },
    removeSuggestion: (state, action: PayloadAction<number>) => {
      state.suggestions.items = state.suggestions.items.filter((s) => s.user.id !== action.payload);
    },

    setFriends: (state, action: PayloadAction<CursorPageResponse<IFriendship>>) => {
      state.friends.items = action.payload.data;
      state.friends.nextCursor = action.payload.nextCursor;
      state.friends.hasMore = action.payload.hasMore;
    },
    appendFriends: (state, action: PayloadAction<CursorPageResponse<IFriendship>>) => {
      state.friends.items.push(...action.payload.data);
      state.friends.nextCursor = action.payload.nextCursor;
      state.friends.hasMore = action.payload.hasMore;
    },
    removeFriend: (state, action: PayloadAction<number>) => {
      state.friends.items = state.friends.items.filter((f) => f.user.id !== action.payload);
    },

    setRequestCount: (state, action: PayloadAction<number>) => {
      state.requestCount = action.payload;
    },
    decrementRequestCount: (state) => {
      if (state.requestCount > 0) {
        state.requestCount -= 1;
      }
    },
  },
});

export const friendActions = friendSlice.actions;
export default friendSlice.reducer;
