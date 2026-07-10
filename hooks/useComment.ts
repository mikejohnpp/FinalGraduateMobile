// useComment hooks — port từ web (src/hooks/useComment.tsx).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { API } from '@/lib/constants';
import commentService from '@/services/commentService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { commentActions } from '@/store/commentSlice';
import type {
    CursorPageResponse,
    IComment,
    ICommentCreate,
    ICommentUpdate,
    MediaInput,
} from '@/types';


// URL builders
const commentUrl = (postId: number) => `${API.POST.BASE}/${postId}/${API.COMMENT.PATH}`;
const commentSingleUrl = (postId: number, commentId: number) =>
    `${API.POST.BASE}/${postId}/${API.COMMENT.PATH}/${commentId}`;
const repliesUrl = (postId: number, commentId: number) =>
    `${API.POST.BASE}/${postId}/${API.COMMENT.PATH}/${commentId}/${API.COMMENT.REPLIES_PATH}`;
const likeUrl = (postId: number, commentId: number) =>
    `${API.POST.BASE}/${postId}/${API.COMMENT.PATH}/${commentId}/${API.COMMENT.LIKE_PATH}`;

// useComments — danh sách comment gốc của post (infinite scroll)
export function useComments(postId: number) {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const feedState = useAppSelector((r) => r.comment.commentsByPost[postId]);
    const [loading, setLoading] = useState(false);
    const loadingRef = useRef(false);

    const comments = feedState?.items ?? [];
    const hasMore = feedState?.hasMore ?? true;
    const nextCursor = feedState?.nextCursor ?? null;

    const load = useCallback(
        async (cursor?: string | null) => {
            if (loadingRef.current || !userId || !postId) return;
            loadingRef.current = true;
            setLoading(true);
            try {
                const result = await commentService.getSingle<CursorPageResponse<IComment>>(
                    commentUrl(postId),
                    undefined,
                    { userId, ...(cursor ? { cursor } : {}), size: 10 },
                );
                if (result) {
                    cursor
                        ? dispatch(commentActions.appendComments({ postId, data: result }))
                        : dispatch(commentActions.setComments({ postId, data: result }));
                }
            } catch (e) {
                console.error('Lỗi khi tải bình luận:', e);
            } finally {
                loadingRef.current = false;
                setLoading(false);
            }
        },
        [dispatch, userId, postId],
    );

    useEffect(() => {
        if (!feedState) load();
    }, [feedState, load]);

    const loadMore = useCallback(() => {
        if (hasMore && nextCursor) load(nextCursor);
    }, [load, hasMore, nextCursor]);

    return { comments, loading, hasMore, loadMore, refetch: () => load() };
}

// useReplies — replies của một comment (lazy)
export function useReplies(postId: number, commentId: number) {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const feedState = useAppSelector((r) => r.comment.repliesByComment[commentId]);
    const [loading, setLoading] = useState(false);
    const loadingRef = useRef(false);

    const replies = feedState?.items ?? [];
    const hasMore = feedState?.hasMore ?? true;
    const nextCursor = feedState?.nextCursor ?? null;
    const loaded = feedState?.loaded ?? false;

    const fetch = useCallback(
        async (cursor?: string | null) => {
            if (loadingRef.current || !userId) return;
            loadingRef.current = true;
            setLoading(true);
            try {
                const result = await commentService.getSingle<CursorPageResponse<IComment>>(
                    repliesUrl(postId, commentId),
                    undefined,
                    { userId, ...(cursor ? { cursor } : {}), size: 5 },
                );
                if (result) {
                    cursor
                        ? dispatch(commentActions.appendReplies({ commentId, data: result }))
                        : dispatch(commentActions.setReplies({ commentId, data: result }));
                }
            } catch (e) {
                console.error('Lỗi khi tải phản hồi:', e);
            } finally {
                loadingRef.current = false;
                setLoading(false);
            }
        },
        [dispatch, userId, postId, commentId],
    );

    const load = useCallback(() => fetch(), [fetch]);
    const loadMore = useCallback(() => {
        if (hasMore && nextCursor) fetch(nextCursor);
    }, [fetch, hasMore, nextCursor]);

    return { replies, loading, hasMore, loaded, load, loadMore };
}

// useCreateComment — tạo comment mới hoặc reply
export function useCreateComment(postId: number) {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const create = useCallback(
        async (
            content: string,
            parentId?: number | null,
            media?: MediaInput[] | null,
        ): Promise<IComment | null> => {
            const hasMedia = !!media && media.length > 0;
            if (!content.trim() && !hasMedia) {
                setError('Nội dung bình luận không được để trống');
                return null;
            }
            if (!userId) return null;
            setError(null);
            setLoading(true);
            try {
                const body: ICommentCreate = {
                    userId,
                    content: content.trim(),
                    parentId,
                    ...(hasMedia ? { media } : {}),
                };

                const result = await commentService.createAndGetData<IComment>(
                    commentUrl(postId),
                    body,
                );
                if (result) {
                    if (parentId) {
                        dispatch(
                            commentActions.appendReply({ commentId: parentId, reply: result, postId }),
                        );
                    } else {
                        dispatch(commentActions.prependComment({ postId, comment: result }));
                    }
                }
                return result;
            } catch (e: any) {
                const msg = e?.response?.data?.message ?? 'Gửi bình luận thất bại';
                setError(msg);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [dispatch, userId, postId],
    );

    return { create, loading, error };
}

// useEditComment — chỉnh sửa nội dung comment
export function useEditComment(postId: number) {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const edit = useCallback(
        async (commentId: number, content: string): Promise<IComment | null> => {
            if (!content.trim()) {
                setError('Nội dung không được để trống');
                return null;
            }
            if (!userId) return null;
            setError(null);
            setLoading(true);
            try {
                const body: ICommentUpdate = { content: content.trim() };
                const result = await commentService.updateAndGetData<IComment>(
                    `${commentSingleUrl(postId, commentId)}?userId=${userId}`,
                    body,
                );
                if (result) dispatch(commentActions.updateComment(result));
                return result;
            } catch (e: any) {
                const msg = e?.response?.data?.message ?? 'Chỉnh sửa thất bại';
                setError(msg);
                Alert.alert('Lỗi', msg);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [dispatch, userId, postId],
    );

    return { edit, loading, error };
}

// useDeleteComment — xóa comment (userId là query param, dùng deleteWithBody)
export function useDeleteComment(postId: number) {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const [loading, setLoading] = useState(false);

    const remove = useCallback(
        async (commentId: number, parentId: number | null): Promise<boolean> => {
            if (!userId) return false;
            setLoading(true);
            try {
                const success = await commentService.deleteWithBody(
                    `${commentSingleUrl(postId, commentId)}?userId=${userId}`,
                    {},
                );
                if (success) {
                    dispatch(commentActions.removeComment({ postId, commentId, parentId }));
                }
                return success;
            } catch (e: any) {
                const msg = e?.response?.data?.message ?? 'Xóa bình luận thất bại';
                Alert.alert('Lỗi', msg);
                return false;
            } finally {
                setLoading(false);
            }
        },
        [dispatch, userId, postId],
    );

    return { remove, loading };
}

// useLikeComment — like/unlike comment với optimistic update
export function useLikeComment(postId: number) {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const like = useCallback(
        async (commentId: number, parentId: number | null): Promise<void> => {
            if (!userId) return;
            setLoadingId(commentId);
            dispatch(commentActions.toggleLikeComment({ postId, commentId, parentId, delta: 1 }));
            try {
                const success = await commentService.create(likeUrl(postId, commentId), { userId });
                if (!success)
                    dispatch(
                        commentActions.toggleLikeComment({ postId, commentId, parentId, delta: -1 }),
                    );
            } catch {
                dispatch(
                    commentActions.toggleLikeComment({ postId, commentId, parentId, delta: -1 }),
                );
            } finally {
                setLoadingId(null);
            }
        },
        [dispatch, userId, postId],
    );

    const unlike = useCallback(
        async (commentId: number, parentId: number | null): Promise<void> => {
            if (!userId) return;
            setLoadingId(commentId);
            dispatch(commentActions.toggleLikeComment({ postId, commentId, parentId, delta: -1 }));
            try {
                const success = await commentService.deleteWithBody(likeUrl(postId, commentId), {
                    userId,
                });
                if (!success)
                    dispatch(
                        commentActions.toggleLikeComment({ postId, commentId, parentId, delta: 1 }),
                    );
            } catch {
                dispatch(
                    commentActions.toggleLikeComment({ postId, commentId, parentId, delta: 1 }),
                );
            } finally {
                setLoadingId(null);
            }
        },
        [dispatch, userId, postId],
    );

    return { like, unlike, loadingId };
}
