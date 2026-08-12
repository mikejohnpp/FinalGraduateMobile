import { useCallback, useEffect, useRef, useState } from 'react';
import { API } from '@/lib/constants';
import postService from '@/services/postService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { postActions } from '@/store/postSlice';
import type { CursorPageResponse, IPost, IPostCreate, IPostDetails, IPostUpdate } from '@/types';

export function useSuggestedFeed() {
  const dispatch = useAppDispatch();
  const suggestedFeed = useAppSelector((r) => r.post.suggestedFeed);
  const userId = useAppSelector((r) => r.user.userId);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const load = useCallback(
    async (cursor?: string | null) => {
      if (loadingRef.current || !userId) return;
      loadingRef.current = true;
      cursor ? setLoading(true) : setRefreshing(true);
      try {
        const result = await postService.getSingle<CursorPageResponse<IPost>>(
          API.POST.SUGGESTED,
          undefined,
          { userId, ...(cursor ? { cursor } : {}), size: 10 }
        );
        if (result) {
          cursor
            ? dispatch(postActions.appendSuggestedPosts(result))
            : dispatch(postActions.setSuggestedFeed(result));
        }
      } catch (e) {
        console.error('Lỗi khi tải bài viết:', e);
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dispatch, userId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(() => {
    if (suggestedFeed.hasMore && suggestedFeed.nextCursor) {
      load(suggestedFeed.nextCursor);
    }
  }, [load, suggestedFeed.hasMore, suggestedFeed.nextCursor]);

  const refresh = useCallback(() => load(), [load]);

  return {
    posts: suggestedFeed.items,
    hasMore: suggestedFeed.hasMore,
    loadMore,
    refresh,
    loading,
    refreshing,
  };
}

export function useCreatePost() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: IPostCreate): Promise<IPostDetails | null> => {
    setError(null);

    const hasMedia = !!data.media && data.media.length > 0;
    if (!data.content.trim() && !hasMedia) {
      setError('Nội dung bài viết không được để trống');
      return null;
    }

    setLoading(true);
    try {
      const result = await postService.createAndGetData<IPostDetails>(API.POST.BASE, data);
      if (result) {
        if (result.status !== 'PENDING') {
          const asPost: IPost = { ...result, commentCount: 0 };
          dispatch(postActions.prependPost(asPost));
        }
      }
      return result;
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Tạo bài viết thất bại');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useUpdatePost() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((r) => r.user.userId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: number, data: IPostUpdate): Promise<IPostDetails | null> => {
    setError(null);
    if (!data.content.trim()) {
      setError('Nội dung bài viết không được để trống');
      return null;
    }
    setLoading(true);
    try {
      const url = userId ? `${API.POST.BASE}/${id}?userId=${userId}` : `${API.POST.BASE}/${id}`;
      const result = await postService.updateAndGetData<IPostDetails>(url, data);
      if (result) {
        dispatch(postActions.setCurrentPost(result));
      }
      return result;
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Cập nhật bài viết thất bại');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

export function useDeletePost() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const remove = async (id: number): Promise<boolean> => {
    setLoading(true);
    try {
      const success = await postService.delete(API.POST.BASE, [id]);
      if (success) {
        dispatch(postActions.removePost(id));
      }
      return success;
    } catch (e) {
      console.error('Xoá bài viết thất bại:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading };
}

export function useLikePost() {
  const dispatch = useAppDispatch();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const like = async (postId: number, userId: number): Promise<boolean> => {
    setLoadingId(postId);
    dispatch(postActions.updateLikeCount({ postId, delta: 1 }));
    try {
      const success = await postService.likePost(postId, userId);
      if (!success) {
        dispatch(postActions.updateLikeCount({ postId, delta: -1 }));
      }
      return success;
    } catch (e) {
      dispatch(postActions.updateLikeCount({ postId, delta: -1 }));
      return false;
    } finally {
      setLoadingId(null);
    }
  };

  const unlike = async (postId: number, userId: number): Promise<boolean> => {
    setLoadingId(postId);
    dispatch(postActions.updateLikeCount({ postId, delta: -1 }));
    try {
      const success = await postService.unlikePost(postId, userId);
      if (!success) {
        dispatch(postActions.updateLikeCount({ postId, delta: 1 }));
      }
      return success;
    } catch (e) {
      dispatch(postActions.updateLikeCount({ postId, delta: 1 }));
      return false;
    } finally {
      setLoadingId(null);
    }
  };

  return { like, unlike, loadingId };
}
