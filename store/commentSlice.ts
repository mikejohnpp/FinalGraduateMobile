// commentSlice — port từ web (src/stores/commentSlice.ts).
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CursorPageResponse, IComment } from '@/types';

interface CommentFeedState {
    items: IComment[];
    nextCursor: string | null;
    hasMore: boolean;
}

interface ReplyFeedState extends CommentFeedState {
    loaded: boolean; // Đánh dấu đã fetch lần đầu chưa (lazy load)
}

interface CommentState {
    commentsByPost: Record<number, CommentFeedState>;
    repliesByComment: Record<number, ReplyFeedState>;
}

const initialState: CommentState = {
    commentsByPost: {},
    repliesByComment: {},
};

const commentSlice = createSlice({
    name: 'comment',
    initialState,
    reducers: {
        // ── Comments ────────────────────────────────────────────
        setComments: (
            state,
            action: PayloadAction<{ postId: number; data: CursorPageResponse<IComment> }>,
        ) => {
            const { postId, data } = action.payload;
            state.commentsByPost[postId] = {
                items: data.data,
                nextCursor: data.nextCursor,
                hasMore: data.hasMore,
            };
        },

        appendComments: (
            state,
            action: PayloadAction<{ postId: number; data: CursorPageResponse<IComment> }>,
        ) => {
            const { postId, data } = action.payload;
            const existing = state.commentsByPost[postId];
            if (existing) {
                existing.items.push(...data.data);
                existing.nextCursor = data.nextCursor;
                existing.hasMore = data.hasMore;
            }
        },

        prependComment: (state, action: PayloadAction<{ postId: number; comment: IComment }>) => {
            const { postId, comment } = action.payload;
            if (state.commentsByPost[postId]) {
                state.commentsByPost[postId].items.unshift(comment);
            } else {
                state.commentsByPost[postId] = {
                    items: [comment],
                    nextCursor: null,
                    hasMore: false,
                };
            }
        },

        updateComment: (state, action: PayloadAction<IComment>) => {
            const comment = action.payload;
            const feed = state.commentsByPost[comment.postId];
            if (feed) {
                const idx = feed.items.findIndex((c) => c.id === comment.id);
                if (idx !== -1) feed.items[idx] = comment;
            }
            if (comment.parentId) {
                const replyFeed = state.repliesByComment[comment.parentId];
                if (replyFeed) {
                    const idx = replyFeed.items.findIndex((c) => c.id === comment.id);
                    if (idx !== -1) replyFeed.items[idx] = comment;
                }
            }
        },

        removeComment: (
            state,
            action: PayloadAction<{ postId: number; commentId: number; parentId: number | null }>,
        ) => {
            const { postId, commentId, parentId } = action.payload;
            if (parentId) {
                const replyFeed = state.repliesByComment[parentId];
                if (replyFeed) {
                    replyFeed.items = replyFeed.items.filter((c) => c.id !== commentId);
                    const parentFeed = state.commentsByPost[postId];
                    if (parentFeed) {
                        const parent = parentFeed.items.find((c) => c.id === parentId);
                        if (parent && parent.replyCount > 0) parent.replyCount -= 1;
                    }
                }
            } else {
                const feed = state.commentsByPost[postId];
                if (feed) {
                    feed.items = feed.items.filter((c) => c.id !== commentId);
                }
                delete state.repliesByComment[commentId];
            }
        },

        toggleLikeComment: (
            state,
            action: PayloadAction<{
                postId: number;
                commentId: number;
                parentId: number | null;
                delta: number;
            }>,
        ) => {
            const { postId, commentId, parentId, delta } = action.payload;
            if (parentId) {
                const replyFeed = state.repliesByComment[parentId];
                if (replyFeed) {
                    const c = replyFeed.items.find((c) => c.id === commentId);
                    if (c) {
                        c.likeCount = Math.max(0, c.likeCount + delta);
                        c.liked = delta > 0;
                    }
                }
            } else {
                const feed = state.commentsByPost[postId];
                if (feed) {
                    const c = feed.items.find((c) => c.id === commentId);
                    if (c) {
                        c.likeCount = Math.max(0, c.likeCount + delta);
                        c.liked = delta > 0;
                    }
                }
            }
        },

        // ── Replies ────────────────────────────────────────────
        setReplies: (
            state,
            action: PayloadAction<{ commentId: number; data: CursorPageResponse<IComment> }>,
        ) => {
            const { commentId, data } = action.payload;
            state.repliesByComment[commentId] = {
                items: data.data,
                nextCursor: data.nextCursor,
                hasMore: data.hasMore,
                loaded: true,
            };
        },

        appendReplies: (
            state,
            action: PayloadAction<{ commentId: number; data: CursorPageResponse<IComment> }>,
        ) => {
            const { commentId, data } = action.payload;
            const existing = state.repliesByComment[commentId];
            if (existing) {
                existing.items.push(...data.data);
                existing.nextCursor = data.nextCursor;
                existing.hasMore = data.hasMore;
            }
        },

        appendReply: (
            state,
            action: PayloadAction<{ commentId: number; reply: IComment; postId: number }>,
        ) => {
            const { commentId, reply, postId } = action.payload;
            if (state.repliesByComment[commentId]) {
                state.repliesByComment[commentId].items.push(reply);
            } else {
                state.repliesByComment[commentId] = {
                    items: [reply],
                    nextCursor: null,
                    hasMore: false,
                    loaded: true,
                };
            }
            const feed = state.commentsByPost[postId];
            if (feed) {
                const parent = feed.items.find((c) => c.id === commentId);
                if (parent) parent.replyCount += 1;
            }
        },
    },
});

export const commentActions = commentSlice.actions;
export default commentSlice.reducer;
