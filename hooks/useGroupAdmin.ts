import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import http from '@/lib/http';
import { API } from '@/lib/constants';
import { useAppSelector } from '@/store/hooks';
import type { 
    IGroupAdmin, 
    IGroupStats, 
    IGroupAdminMember, 
    IGroupAdminPost, 
    ApiResultGeneric, 
    ApiResult, 
    PageResponse 
} from '@/types';

export function useGroupInfo(groupId: number | string) {
    const [group, setGroup] = useState<IGroupAdmin | null>(null);
    const [loading, setLoading] = useState(true);
    const userId = useAppSelector((state) => state.user.userId);

    useEffect(() => {
        let isMounted = true;
        const fetchGroup = async () => {
            if (!userId || !groupId) return;
            setLoading(true);
            try {
                const res = await http.get<ApiResultGeneric<IGroupAdmin>>(
                    `${API.GROUP_ADMIN.INFO}/${groupId}/admin/info`,
                    { userId }
                );
                if (isMounted && res?.data) {
                    setGroup(res.data);
                }
            } catch (e: any) {
                Alert.alert('Lỗi', 'Không thể tải thông tin nhóm');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchGroup();
        return () => { isMounted = false; };
    }, [groupId, userId]);

    return { group, loading };
}

export function useGroupStats(groupId: number | string) {
    const [stats, setStats] = useState<IGroupStats | null>(null);
    const [loading, setLoading] = useState(true);
    const userId = useAppSelector((state) => state.user.userId);

    useEffect(() => {
        let isMounted = true;
        const fetchStats = async () => {
            if (!userId || !groupId) return;
            setLoading(true);
            try {
                const res = await http.get<ApiResultGeneric<IGroupStats>>(
                    `${API.GROUP_ADMIN.STATS}/${groupId}/admin/stats`,
                    { userId }
                );
                if (isMounted && res?.data) {
                    setStats(res.data);
                }
            } catch (e: any) {
                Alert.alert('Lỗi', 'Không thể tải thống kê');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchStats();
        return () => { isMounted = false; };
    }, [groupId, userId]);

    return { stats, loading, refetch: () => setLoading(true) }; // refetch hook
}

export function useGroupMemberRequests(groupId: number | string) {
    const [members, setMembers] = useState<IGroupAdminMember[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE' | 'OTHER'>('ALL');
    
    const [page, setPage] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const userId = useAppSelector((state) => state.user.userId);

    const fetchRequests = async (currentPage = 0, reset = false) => {
        if (!userId || !groupId) return;
        if (reset) setLoading(true);
        try {
            const params: any = { userId, page: currentPage, size: 20, sort: sortOrder };
            if (searchQuery) params.search = searchQuery;
            if (genderFilter !== 'ALL') params.gender = genderFilter;

            const res = await http.get<ApiResultGeneric<PageResponse<IGroupAdminMember>>>(
                `${API.GROUP_ADMIN.MEMBER_REQUESTS}/${groupId}/admin/member-requests`,
                params
            );
            if (res?.data) {
                setMembers(prev => reset ? res.data!.data : [...prev, ...res.data!.data]);
                setHasNext(res.data!.hasNext);
            }
        } catch (e: any) {
            Alert.alert('Lỗi', 'Không thể tải yêu cầu tham gia');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(0);
        fetchRequests(0, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId, userId, searchQuery, sortOrder, genderFilter]);

    const loadMore = () => {
        if (!hasNext || loading) return;
        setPage(prev => prev + 1);
        fetchRequests(page + 1);
    };

    const approve = async (memberId: number) => {
        if (!userId) return;
        const backup = [...members];
        setMembers(prev => prev.filter(m => m.id !== memberId));
        
        try {
            const res = await http.post<ApiResult>(
                `${API.GROUP_ADMIN.MEMBER_APPROVE}/${groupId}/admin/member-requests/approve?userId=${userId}`,
                { requestIds: [memberId] }
            );
            if (res?.success) {
                Alert.alert('Thành công', res.message || 'Đã phê duyệt thành viên');
            } else {
                throw new Error();
            }
        } catch (e: any) {
            setMembers(backup);
            Alert.alert('Lỗi', e?.response?.data?.message || 'Lỗi khi phê duyệt');
        }
    };

    const reject = async (memberId: number) => {
        if (!userId) return;
        const backup = [...members];
        setMembers(prev => prev.filter(m => m.id !== memberId));
        
        try {
            const res = await http.post<ApiResult>(
                `${API.GROUP_ADMIN.MEMBER_REJECT}/${groupId}/admin/member-requests/reject?userId=${userId}`,
                { requestIds: [memberId] }
            );
            if (res?.success) {
                Alert.alert('Thành công', res.message || 'Đã từ chối yêu cầu');
            } else {
                throw new Error();
            }
        } catch (e: any) {
            setMembers(backup);
            Alert.alert('Lỗi', e?.response?.data?.message || 'Lỗi khi từ chối');
        }
    };

    return {
        members,
        loading,
        approve,
        reject,
        searchQuery,
        setSearchQuery,
        sortOrder,
        setSortOrder,
        genderFilter,
        setGenderFilter,
        loadMore,
        hasNext,
    };
}

export function useGroupPendingPosts(groupId: number | string) {
    const [posts, setPosts] = useState<IGroupAdminPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const userId = useAppSelector((state) => state.user.userId);

    const fetchPosts = async (currentPage = 0, reset = false) => {
        if (!userId || !groupId) return;
        if (reset) setLoading(true);
        try {
            const res = await http.get<ApiResultGeneric<PageResponse<IGroupAdminPost>>>(
                `${API.GROUP_ADMIN.PENDING_POSTS}/${groupId}/admin/pending-posts`,
                { userId, page: currentPage, size: 10 }
            );
            if (res?.data) {
                setPosts(prev => reset ? res.data!.data : [...prev, ...res.data!.data]);
                setHasNext(res.data!.hasNext);
            }
        } catch (e: any) {
            Alert.alert('Lỗi', 'Không thể tải bài viết chờ duyệt');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(0);
        fetchPosts(0, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId, userId]);

    const loadMore = () => {
        if (!hasNext || loading) return;
        setPage(prev => prev + 1);
        fetchPosts(page + 1);
    };

    const approvePost = async (postId: number) => {
        if (!userId) return;
        const backup = [...posts];
        setPosts(prev => prev.filter(p => p.id !== postId));
        try {
            const res = await http.post<ApiResult>(
                `${API.GROUP_ADMIN.POST_APPROVE}/${groupId}/admin/pending-posts/${postId}/approve?userId=${userId}`,
                {}
            );
            if (res?.success) {
                Alert.alert('Thành công', res.message || 'Đã phê duyệt bài viết');
            } else {
                throw new Error();
            }
        } catch (e: any) {
            setPosts(backup);
            Alert.alert('Lỗi', e?.response?.data?.message || 'Lỗi khi phê duyệt');
        }
    };

    const rejectPost = async (postId: number) => {
        if (!userId) return;
        const backup = [...posts];
        setPosts(prev => prev.filter(p => p.id !== postId));
        try {
            const res = await http.post<ApiResult>(
                `${API.GROUP_ADMIN.POST_REJECT}/${groupId}/admin/pending-posts/${postId}/reject?userId=${userId}`,
                {}
            );
            if (res?.success) {
                Alert.alert('Thành công', res.message || 'Đã từ chối bài viết');
            } else {
                throw new Error();
            }
        } catch (e: any) {
            setPosts(backup);
            Alert.alert('Lỗi', e?.response?.data?.message || 'Lỗi khi từ chối');
        }
    };

    return { posts, loading, approvePost, rejectPost, loadMore, hasNext };
}
