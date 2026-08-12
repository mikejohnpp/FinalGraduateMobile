import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CursorPageResponse, IGroup, IPost } from '@/types';

interface GroupState {
  joinedGroups: IGroup[];
  suggestedGroups: IGroup[];
  groupFeed: {
    items: IPost[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

const initialState: GroupState = {
  joinedGroups: [],
  suggestedGroups: [],
  groupFeed: {
    items: [],
    nextCursor: null,
    hasMore: true,
  },
};

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    setJoinedGroups: (state, action: PayloadAction<IGroup[]>) => {
      state.joinedGroups = action.payload;
    },
    setSuggestedGroups: (state, action: PayloadAction<IGroup[]>) => {
      state.suggestedGroups = action.payload;
    },
    addJoinedGroup: (state, action: PayloadAction<IGroup>) => {
      state.joinedGroups.push(action.payload);
      state.suggestedGroups = state.suggestedGroups.filter((g) => g.id !== action.payload.id);
    },
    removeJoinedGroup: (state, action: PayloadAction<number>) => {
      state.joinedGroups = state.joinedGroups.filter((g) => g.id !== action.payload);
    },
    updateGroup: (
      state,
      action: PayloadAction<{ id: number; isPending?: boolean; isJoined?: boolean }>
    ) => {
      const { id, ...updates } = action.payload;
      const suggested = state.suggestedGroups.find((g) => g.id === id);
      if (suggested) Object.assign(suggested, updates);
      const joined = state.joinedGroups.find((g) => g.id === id);
      if (joined) Object.assign(joined, updates);
    },
    setGroupFeed: (state, action: PayloadAction<CursorPageResponse<IPost>>) => {
      state.groupFeed.items = action.payload.data ?? [];
      state.groupFeed.nextCursor = action.payload.nextCursor ?? null;
      state.groupFeed.hasMore = action.payload.hasMore ?? false;
    },
    appendGroupFeed: (state, action: PayloadAction<CursorPageResponse<IPost>>) => {
      state.groupFeed.items = [...state.groupFeed.items, ...(action.payload.data ?? [])];
      state.groupFeed.nextCursor = action.payload.nextCursor ?? null;
      state.groupFeed.hasMore = action.payload.hasMore ?? false;
    },
    prependPostToGroupFeed: (state, action: PayloadAction<IPost>) => {
      state.groupFeed.items.unshift(action.payload);
    },
    updateGroupFeedPostLikeCount: (
      state,
      action: PayloadAction<{ postId: number; delta: number }>
    ) => {
      const post = state.groupFeed.items.find((p) => p.id === action.payload.postId);
      if (post) {
        post.likeCount = Math.max(0, post.likeCount + action.payload.delta);
      }
    },
  },
});

export const groupActions = groupSlice.actions;
export default groupSlice.reducer;
