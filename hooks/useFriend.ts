import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { API } from '@/lib/constants';
import friendService from '@/services/friendService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { friendActions } from '@/store/friendSlice';
import type {
  CursorPageResponse,
  FriendStatus,
  IFriendRequest,
  IFriendRequestCreate,
  IFriendship,
  IFriendSuggestion,
} from '@/types';

export function useFriendRequests() {
  const dispatch = useAppDispatch();
  const requests = useAppSelector((s) => s.friend.requests);
  const userId = useAppSelector((s) => s.user.userId);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const load = useCallback(
    async (cursor?: string | null) => {
      if (loadingRef.current || !userId) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const result = await friendService.getSingle<CursorPageResponse<IFriendRequest>>(
          API.FRIEND.REQUESTS,
          undefined,
          { userId, ...(cursor ? { cursor } : {}), size: 10 }
        );
        if (result) {
          cursor
            ? dispatch(friendActions.appendRequests(result))
            : dispatch(friendActions.setRequests(result));
        }
      } catch (e) {
        console.error('Lỗi khi tải lời mời kết bạn:', e);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [dispatch, userId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(() => {
    if (requests.hasMore && requests.nextCursor) load(requests.nextCursor);
  }, [load, requests.hasMore, requests.nextCursor]);

  return { requests: requests.items, hasMore: requests.hasMore, loadMore, loading };
}

export function useFriendSuggestions() {
  const dispatch = useAppDispatch();
  const suggestions = useAppSelector((s) => s.friend.suggestions);
  const userId = useAppSelector((s) => s.user.userId);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const load = useCallback(
    async (cursor?: string | null) => {
      if (loadingRef.current || !userId) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const result = await friendService.getSingle<CursorPageResponse<IFriendSuggestion>>(
          API.FRIEND.SUGGESTIONS,
          undefined,
          { userId, ...(cursor ? { cursor } : {}), size: 20 }
        );
        if (result) {
          cursor
            ? dispatch(friendActions.appendSuggestions(result))
            : dispatch(friendActions.setSuggestions(result));
        }
      } catch (e) {
        console.error('Lỗi khi tải gợi ý bạn bè:', e);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [dispatch, userId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(() => {
    if (suggestions.hasMore && suggestions.nextCursor) load(suggestions.nextCursor);
  }, [load, suggestions.hasMore, suggestions.nextCursor]);

  return { suggestions: suggestions.items, hasMore: suggestions.hasMore, loadMore, loading };
}

export function useAllFriends() {
  const dispatch = useAppDispatch();
  const friends = useAppSelector((s) => s.friend.friends);
  const userId = useAppSelector((s) => s.user.userId);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const load = useCallback(
    async (cursor?: string | null) => {
      if (loadingRef.current || !userId) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const result = await friendService.getSingle<CursorPageResponse<IFriendship>>(
          API.FRIEND.BASE,
          undefined,
          { userId, ...(cursor ? { cursor } : {}), size: 20 }
        );
        if (result) {
          cursor
            ? dispatch(friendActions.appendFriends(result))
            : dispatch(friendActions.setFriends(result));
        }
      } catch (e) {
        console.error('Lỗi khi tải danh sách bạn bè:', e);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [dispatch, userId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(() => {
    if (friends.hasMore && friends.nextCursor) load(friends.nextCursor);
  }, [load, friends.hasMore, friends.nextCursor]);

  return { friends: friends.items, hasMore: friends.hasMore, loadMore, loading };
}

export function useAcceptRequest() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.user.userId);
  const requests = useAppSelector((s) => s.friend.requests);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const accept = async (requestId: number): Promise<boolean> => {
    if (!userId) return false;
    const snapshot = requests.items.find((r) => r.requestId === requestId);

    dispatch(friendActions.removeRequest(requestId));
    dispatch(friendActions.decrementRequestCount());
    setLoadingId(requestId);

    const rollback = () => {
      if (snapshot) {
        dispatch(
          friendActions.setRequests({
            data: [snapshot, ...requests.items.filter((r) => r.requestId !== requestId)],
            nextCursor: requests.nextCursor,
            hasMore: requests.hasMore,
          })
        );
        dispatch(friendActions.setRequestCount(requests.items.length));
      }
    };

    try {
      const success = await friendService.acceptRequest(requestId, userId);
      if (!success) {
        rollback();
        Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
      }
      return success;
    } catch {
      rollback();
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
      return false;
    } finally {
      setLoadingId(null);
    }
  };

  return { accept, loadingId };
}

export function useDeclineRequest() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.user.userId);
  const requests = useAppSelector((s) => s.friend.requests);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const decline = async (requestId: number): Promise<void> => {
    if (!userId) return;
    const snapshot = requests.items.find((r) => r.requestId === requestId);

    dispatch(friendActions.removeRequest(requestId));
    dispatch(friendActions.decrementRequestCount());
    setLoadingId(requestId);

    const rollback = () => {
      if (snapshot) {
        dispatch(
          friendActions.setRequests({
            data: [snapshot, ...requests.items.filter((r) => r.requestId !== requestId)],
            nextCursor: requests.nextCursor,
            hasMore: requests.hasMore,
          })
        );
        dispatch(friendActions.setRequestCount(requests.items.length));
      }
    };

    try {
      const success = await friendService.declineRequest(requestId, userId);
      if (!success) {
        rollback();
        Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch {
      rollback();
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoadingId(null);
    }
  };

  return { decline, loadingId };
}

export function useSendFriendRequest() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.user.userId);
  const suggestions = useAppSelector((s) => s.friend.suggestions);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const send = async (targetUserId: number): Promise<boolean> => {
    if (!userId) return false;
    const snapshot = suggestions.items.find((s) => s.user.id === targetUserId);

    dispatch(friendActions.removeSuggestion(targetUserId));
    setLoadingId(targetUserId);

    const rollback = () => {
      if (snapshot) {
        dispatch(
          friendActions.setSuggestions({
            data: [snapshot, ...suggestions.items.filter((s) => s.user.id !== targetUserId)],
            nextCursor: suggestions.nextCursor,
            hasMore: suggestions.hasMore,
          })
        );
      }
    };

    try {
      const data: IFriendRequestCreate = { userId, targetUserId };
      const success = await friendService.create(API.FRIEND.REQUESTS, data);
      if (!success) {
        rollback();
        Alert.alert('Lỗi', 'Gửi lời mời thất bại, vui lòng thử lại');
      }
      return success;
    } catch (e: any) {
      rollback();
      const message: string = e?.response?.data?.message ?? 'Có lỗi xảy ra';
      Alert.alert('Lỗi', message);
      return false;
    } finally {
      setLoadingId(null);
    }
  };

  return { send, loadingId };
}

export function useUnfriend() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.user.userId);
  const friends = useAppSelector((s) => s.friend.friends);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const unfriend = async (friendUserId: number): Promise<boolean> => {
    if (!userId) return false;
    const snapshot = friends.items.find((f) => f.user.id === friendUserId);

    dispatch(friendActions.removeFriend(friendUserId));
    setLoadingId(friendUserId);

    const rollback = () => {
      if (snapshot) {
        dispatch(
          friendActions.setFriends({
            data: [...friends.items.filter((f) => f.user.id !== friendUserId), snapshot],
            nextCursor: friends.nextCursor,
            hasMore: friends.hasMore,
          })
        );
      }
    };

    try {
      const success = await friendService.unfriend(friendUserId, userId);
      if (!success) {
        rollback();
        Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
      }
      return success;
    } catch {
      rollback();
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
      return false;
    } finally {
      setLoadingId(null);
    }
  };

  return { unfriend, loadingId };
}

export function useDismissSuggestion() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.user.userId);
  const suggestions = useAppSelector((s) => s.friend.suggestions);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const dismiss = useCallback(
    async (targetUserId: number) => {
      if (!userId) return;

      const snapshot = suggestions.items.find((s) => s.user.id === targetUserId);

      dispatch(friendActions.removeSuggestion(targetUserId));
      setLoadingId(targetUserId);

      const rollback = () => {
        if (snapshot) {
          dispatch(
            friendActions.setSuggestions({
              data: [snapshot, ...suggestions.items.filter((s) => s.user.id !== targetUserId)],
              nextCursor: suggestions.nextCursor,
              hasMore: suggestions.hasMore,
            })
          );
        }
      };

      try {
        const success = await friendService.dismissSuggestion(targetUserId, userId);
        if (!success) {
          rollback();
          Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
        }
      } catch {
        rollback();
        Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
      } finally {
        setLoadingId(null);
      }
    },
    [dispatch, userId, suggestions]
  );

  return { dismiss, loadingId };
}

export function useFriendRequestCount() {
  const dispatch = useAppDispatch();
  const requestCount = useAppSelector((s) => s.friend.requestCount);
  const userId = useAppSelector((s) => s.user.userId);

  useEffect(() => {
    if (!userId) return;
    friendService
      .getSingle<number>(API.FRIEND.REQUESTS_COUNT, undefined, { userId })
      .then((count) => {
        if (count !== null) dispatch(friendActions.setRequestCount(count));
      })
      .catch((e) => console.error('Lỗi khi lấy badge count:', e));
  }, [dispatch, userId]);

  return { count: requestCount };
}

export function useProfileFriendStatus(targetUserId: number | undefined) {
  const currentUserId = useAppSelector((s) => s.user.userId);
  const [status, setStatus] = useState<FriendStatus | null>(null);
  const [requestId, setRequestId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;
    let cancelled = false;
    setLoading(true);
    friendService
      .getFriendStatus(currentUserId, targetUserId)
      .then((res) => {
        if (!cancelled && res) {
          setStatus(res.status);
          setRequestId(res.requestId);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUserId, targetUserId]);

  const sendRequest = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    setActionLoading(true);
    try {
      const success = await friendService.sendRequest(currentUserId, targetUserId);
      if (success) setStatus('PENDING_SENT');
      else Alert.alert('Lỗi', 'Gửi lời mời thất bại, vui lòng thử lại');
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  }, [currentUserId, targetUserId]);

  const cancelRequest = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    setActionLoading(true);
    try {
      const success = await friendService.cancelFriendRequest(currentUserId, targetUserId);
      if (success) {
        setStatus('NOT_FRIENDS');
        setRequestId(undefined);
      } else {
        Alert.alert('Lỗi', 'Hủy lời mời thất bại, vui lòng thử lại');
      }
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  }, [currentUserId, targetUserId]);

  const acceptRequest = useCallback(async () => {
    if (!requestId || !currentUserId) return;
    setActionLoading(true);
    try {
      const success = await friendService.acceptRequest(requestId, currentUserId);
      if (success) {
        setStatus('FRIENDS');
        setRequestId(undefined);
      } else {
        Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  }, [requestId, currentUserId]);

  const unfriend = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    setActionLoading(true);
    try {
      const success = await friendService.unfriend(targetUserId, currentUserId);
      if (success) setStatus('NOT_FRIENDS');
      else Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  }, [currentUserId, targetUserId]);

  return { status, loading, actionLoading, sendRequest, cancelRequest, acceptRequest, unfriend };
}
