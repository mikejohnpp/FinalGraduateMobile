import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CursorPageResponse, IPost, IPostDetails } from '@/types';

interface PostState {
  suggestedFeed: {
    items: IPost[];
    nextCursor: string | null;
    hasMore: boolean;
  };
  currentPost: IPostDetails | null;
}

const initialState: PostState = {
  suggestedFeed: {
    items: [],
    nextCursor: null,
    hasMore: true,
  },
  currentPost: null,
};

const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    setSuggestedFeed: (state, action: PayloadAction<CursorPageResponse<IPost>>) => {
      state.suggestedFeed.items = action.payload.data;
      state.suggestedFeed.nextCursor = action.payload.nextCursor;
      state.suggestedFeed.hasMore = action.payload.hasMore;
    },
    appendSuggestedPosts: (state, action: PayloadAction<CursorPageResponse<IPost>>) => {
      state.suggestedFeed.items.push(...action.payload.data);
      state.suggestedFeed.nextCursor = action.payload.nextCursor;
      state.suggestedFeed.hasMore = action.payload.hasMore;
    },
    setCurrentPost: (state, action: PayloadAction<IPostDetails | null>) => {
      state.currentPost = action.payload;
    },
    updateLikeCount: (state, action: PayloadAction<{ postId: number; delta: number }>) => {
      const post = state.suggestedFeed.items.find((p) => p.id === action.payload.postId);
      if (post) {
        post.likeCount += action.payload.delta;
        post.hasLiked = action.payload.delta > 0;
      }
      if (state.currentPost && state.currentPost.id === action.payload.postId) {
        state.currentPost.likeCount += action.payload.delta;
        state.currentPost.hasLiked = action.payload.delta > 0;
      }
    },
    removePost: (state, action: PayloadAction<number>) => {
      state.suggestedFeed.items = state.suggestedFeed.items.filter((p) => p.id !== action.payload);
    },
    prependPost: (state, action: PayloadAction<IPost>) => {
      state.suggestedFeed.items.unshift(action.payload);
    },
  },
});

export const postActions = postSlice.actions;
export default postSlice.reducer;
