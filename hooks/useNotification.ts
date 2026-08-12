import { useCallback, useEffect, useRef, useState } from 'react';
import { API } from '@/lib/constants';
import notificationService from '@/services/notificationService';
import { notificationActions } from '@/store/notificationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { CursorPageResponse, INotification } from '@/types';

export function useNotifications(unreadOnly = false) {
  const dispatch = useAppDispatch();
  const { items, hasMore, nextCursor } = useAppSelector((s) => s.notification);
  const userId = useAppSelector((s) => s.user.userId);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const load = useCallback(
    async (cursor?: string | null) => {
      if (loadingRef.current || !userId) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const result = await notificationService.getSingle<CursorPageResponse<INotification>>(
          API.NOTIFICATION.BASE,
          undefined,
          {
            userId,
            unreadOnly,
            ...(cursor ? { cursor } : {}),
            size: 15,
          }
        );
        if (result) {
          if (cursor) {
            dispatch(notificationActions.appendNotifications(result));
          } else {
            dispatch(notificationActions.setNotifications(result));
          }
        }
      } catch (e) {
        console.error('Lỗi khi tải thông báo:', e);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [dispatch, userId, unreadOnly]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadOnly, userId]);

  const loadMore = useCallback(() => {
    if (hasMore && nextCursor) {
      load(nextCursor);
    }
  }, [load, hasMore, nextCursor]);

  return { notifications: items, hasMore, loadMore, loading, reload: load };
}

export function useUnreadCount() {
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector((s) => s.notification.unreadCount);
  const userId = useAppSelector((s) => s.user.userId);

  const refresh = useCallback(() => {
    if (!userId) return;
    notificationService
      .getSingle<number>(API.NOTIFICATION.UNREAD_COUNT, undefined, { userId })
      .then((count) => {
        if (count !== null) {
          dispatch(notificationActions.setUnreadCount(count));
        }
      })
      .catch((e) => console.error('Lỗi khi lấy số thông báo chưa đọc:', e));
  }, [dispatch, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { unreadCount, refresh };
}

export function useMarkAsRead() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.user.userId);

  const markAsRead = useCallback(
    async (id: number) => {
      if (!userId) return;
      dispatch(notificationActions.markRead(id));
      try {
        await notificationService.markAsRead(id, userId);
      } catch (e) {
        console.error('Lỗi khi đánh dấu đã đọc:', e);
      }
    },
    [dispatch, userId]
  );

  return { markAsRead };
}

export function useMarkAllAsRead() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.user.userId);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    dispatch(notificationActions.markAllRead());
    try {
      await notificationService.markAllAsRead(userId);
    } catch (e) {
      console.error('Lỗi khi đánh dấu tất cả đã đọc:', e);
    }
  }, [dispatch, userId]);

  return { markAllAsRead };
}
