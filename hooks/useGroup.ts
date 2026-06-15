// useGroup hooks — port từ web (src/hooks/useGroup.tsx). Alert thay cho toast.
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { API } from '@/lib/constants';
import groupService from '@/services/groupService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { groupActions } from '@/store/groupSlice';
import type { CursorPageResponse, IGroup, IPost } from '@/types';

// useGroupsData — danh sách nhóm đã tham gia + gợi ý
export function useGroupsData() {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const joinedGroups = useAppSelector((r) => r.group.joinedGroups);
    const suggestedGroups = useAppSelector((r) => r.group.suggestedGroups);
    const [loading, setLoading] = useState(false);

    const fetchGroups = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const [joined, suggested] = await Promise.all([
                groupService.getList<IGroup>(API.GROUP.JOINED, undefined, { userId }),
                groupService.getList<IGroup>(API.GROUP.SUGGESTED, undefined, { userId }),
            ]);
            dispatch(groupActions.setJoinedGroups(joined));
            dispatch(groupActions.setSuggestedGroups(suggested));
        } catch (e) {
            console.error(e);
            Alert.alert('Lỗi', 'Không thể lấy danh sách nhóm');
        } finally {
            setLoading(false);
        }
    }, [userId, dispatch]);

    useEffect(() => {
        if (userId && joinedGroups.length === 0 && suggestedGroups.length === 0) {
            fetchGroups();
        }
    }, [userId, joinedGroups.length, suggestedGroups.length, fetchGroups]);

    return { joinedGroups, suggestedGroups, loading, refetch: fetchGroups };
}

// useGroupDetail — chi tiết một nhóm
export function useGroupDetail(groupId: number) {
    const userId = useAppSelector((r) => r.user.userId);
    const [group, setGroup] = useState<IGroup | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDetail = useCallback(async () => {
        if (!userId || !groupId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await groupService.getSingle<IGroup>(API.GROUP.BASE, groupId, { userId });
            setGroup(data);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Không thể lấy thông tin nhóm');
        } finally {
            setLoading(false);
        }
    }, [userId, groupId]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    return { group, loading, error, refetch: fetchDetail, setGroup };
}

// useGroupActions — tham gia / rời / tạo nhóm
export function useGroupActions() {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const [loading, setLoading] = useState(false);

    const joinGroup = async (group: IGroup): Promise<boolean> => {
        if (!userId) return false;
        setLoading(true);
        try {
            const data = await groupService.joinGroup(group.id, userId);
            if (data) {
                if (data.status === 'APPROVED') {
                    dispatch(
                        groupActions.addJoinedGroup({ ...group, isJoined: true, role: 'MEMBER' }),
                    );
                    Alert.alert('Thành công', 'Đã tham gia nhóm');
                } else if (data.status === 'PENDING') {
                    dispatch(groupActions.updateGroup({ id: group.id, isPending: true }));
                    Alert.alert('Thành công', 'Đã gửi yêu cầu tham gia nhóm');
                }
                return true;
            }
        } catch (e: any) {
            Alert.alert('Lỗi', e?.response?.data?.message || 'Lỗi khi tham gia nhóm');
        } finally {
            setLoading(false);
        }
        return false;
    };

    const leaveGroup = async (groupId: number): Promise<boolean> => {
        if (!userId) return false;
        setLoading(true);
        try {
            const success = await groupService.leaveGroup(groupId, userId);
            if (success) {
                dispatch(groupActions.removeJoinedGroup(groupId));
                Alert.alert('Thành công', 'Đã rời nhóm');
                return true;
            }
        } catch (e: any) {
            Alert.alert('Lỗi', e?.response?.data?.message || 'Lỗi khi rời nhóm');
        } finally {
            setLoading(false);
        }
        return false;
    };

    const createGroup = async (data: {
        name: string;
        privacy: 'public' | 'private';
        invitees?: number[];
    }): Promise<IGroup | null> => {
        if (!userId) return null;
        setLoading(true);
        try {
            const newGroup = await groupService.createGroup(userId, data);
            if (newGroup) {
                dispatch(groupActions.addJoinedGroup(newGroup));
                Alert.alert('Thành công', 'Tạo nhóm thành công');
                return newGroup;
            }
        } catch (e: any) {
            Alert.alert('Lỗi', e?.response?.data?.message || 'Lỗi khi tạo nhóm');
        } finally {
            setLoading(false);
        }
        return null;
    };

    return { joinGroup, leaveGroup, createGroup, loading };
}

// useGroupFeed — bảng tin tổng hợp của các nhóm
export function useGroupFeed() {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const groupFeed = useAppSelector((r) => r.group.groupFeed);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFeed = useCallback(
        async (isLoadMore = false) => {
            if (!userId) return;
            if (isLoadMore && (!groupFeed.hasMore || loading)) return;

            setLoading(true);
            setError(null);
            try {
                const cursor = isLoadMore ? groupFeed.nextCursor || undefined : undefined;
                const data = await groupService.getSingle<CursorPageResponse<IPost>>(
                    API.GROUP.FEED,
                    undefined,
                    { userId, ...(cursor ? { cursor } : {}), size: 10 },
                );
                if (data) {
                    isLoadMore
                        ? dispatch(groupActions.appendGroupFeed(data))
                        : dispatch(groupActions.setGroupFeed(data));
                }
            } catch (e: any) {
                setError(e?.response?.data?.message || 'Lỗi tải bảng tin nhóm');
            } finally {
                setLoading(false);
            }
        },
        [userId, groupFeed.hasMore, groupFeed.nextCursor, loading, dispatch],
    );

    useEffect(() => {
        if (userId && groupFeed.items.length === 0) {
            fetchFeed();
        }
    }, [userId, groupFeed.items.length, fetchFeed]);

    const loadMore = () => fetchFeed(true);

    return { feed: groupFeed, loading, error, loadMore, refetch: () => fetchFeed(false) };
}

// useSingleGroupPosts — bài viết của một nhóm cụ thể
export function useSingleGroupPosts(groupId: number) {
    const userId = useAppSelector((r) => r.user.userId);
    const [posts, setPosts] = useState<IPost[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = useCallback(
        async (isLoadMore = false) => {
            if (!userId || !groupId) return;
            if (isLoadMore && (!hasMore || loading)) return;

            setLoading(true);
            setError(null);
            try {
                const cursor = isLoadMore ? nextCursor || undefined : undefined;
                const data = await groupService.getSingle<CursorPageResponse<IPost>>(
                    `${API.GROUP.BASE}/${groupId}/posts`,
                    undefined,
                    { userId, ...(cursor ? { cursor } : {}), size: 10 },
                );
                if (data) {
                    isLoadMore
                        ? setPosts((prev) => [...prev, ...data.data])
                        : setPosts(data.data);
                    setNextCursor(data.nextCursor);
                    setHasMore(data.hasMore);
                }
            } catch (e: any) {
                setError(e?.response?.data?.message || 'Lỗi tải bài viết nhóm');
            } finally {
                setLoading(false);
            }
        },
        [userId, groupId, hasMore, nextCursor, loading],
    );

    useEffect(() => {
        fetchPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, groupId]);

    const loadMore = () => fetchPosts(true);

    return { posts, loading, error, hasMore, loadMore, refetch: () => fetchPosts(false) };
}
