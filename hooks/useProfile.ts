// useProfile hooks — port từ web (src/hooks/useProfile.tsx).
// Khác biệt: upload nhận URI (string) từ expo-image-picker thay cho File; Alert thay cho toast.
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { API } from '@/lib/constants';
import { resolveMediaUrl } from '@/lib/media';
import postService from '@/services/postService';
import userService from '@/services/userService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { userActions } from '@/store/userSlice';
import type { IPost, IProfileUpdate, UserProfileDTO } from '@/types';

// Lấy profile của một user + tính isOwner. Nếu là chính mình → cập nhật store.
export function useProfile(userId: number | string | undefined) {
    const dispatch = useAppDispatch();
    const currentUserId = useAppSelector((r) => r.user.userId);
    const [profile, setProfile] = useState<UserProfileDTO | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!userId) return;
        const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        if (Number.isNaN(id)) return;

        setLoading(true);
        setError(null);
        try {
            const res = await userService.getProfile(id);
            if (res?.data) {
                setProfile(res.data);
                const owner = res.data.id === currentUserId;
                setIsOwner(owner);
                if (owner) {
                    dispatch(userActions.setProfile(res.data));
                }
            } else {
                setError('Không tìm thấy người dùng');
            }
        } catch {
            setError('Lỗi khi tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    }, [userId, currentUserId, dispatch]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, isOwner, loading, error, refetch: fetchProfile };
}

// Cập nhật thông tin profile (partial update).
export function useUpdateProfile() {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = useCallback(
        async (data: IProfileUpdate): Promise<UserProfileDTO | null> => {
            if (!userId) return null;
            setLoading(true);
            setError(null);
            try {
                const res = await userService.updateProfile(userId, data);
                if (res?.data) {
                    dispatch(userActions.setProfile(res.data));
                    return res.data;
                }
                return null;
            } catch {
                const msg = 'Cập nhật thông tin thất bại';
                setError(msg);
                Alert.alert('Lỗi', msg);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [userId, dispatch],
    );

    return { update, loading, error };
}

// Upload ảnh đại diện (nhận URI từ image picker).
export function useUploadAvatar() {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const [loading, setLoading] = useState(false);

    const upload = useCallback(
        async (uri: string): Promise<string | null> => {
            if (!userId) return null;
            setLoading(true);
            try {
                const res = await userService.uploadAvatar(userId, uri);
                if (res?.data) {
                    const url = resolveMediaUrl(res.data);
                    dispatch(userActions.updateProfile({ avatar: url }));
                    return url;
                }
                return null;
            } catch {
                Alert.alert('Lỗi', 'Upload ảnh đại diện thất bại');
                return null;
            } finally {
                setLoading(false);
            }
        },
        [userId, dispatch],
    );

    return { upload, loading };
}

// Upload ảnh bìa (nhận URI từ image picker).
export function useUploadCover() {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const [loading, setLoading] = useState(false);

    const upload = useCallback(
        async (uri: string): Promise<string | null> => {
            if (!userId) return null;
            setLoading(true);
            try {
                const res = await userService.uploadCover(userId, uri);
                if (res?.data) {
                    const url = resolveMediaUrl(res.data);
                    dispatch(userActions.updateProfile({ coverPhoto: url }));
                    return url;
                }
                return null;
            } catch {
                Alert.alert('Lỗi', 'Upload ảnh bìa thất bại');
                return null;
            } finally {
                setLoading(false);
            }
        },
        [userId, dispatch],
    );

    return { upload, loading };
}

// Lấy danh sách bài viết của một user.
export function useUserPosts(userId: number | string | undefined) {
    const [posts, setPosts] = useState<IPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        if (Number.isNaN(id)) return;

        const fetch = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await postService.getList<IPost>(API.POST.BASE, undefined, {
                    userId: id,
                });
                const filtered = (result ?? []).filter((p) => p.author?.id === id);
                setPosts(filtered);
            } catch {
                setError('Lỗi khi tải bài viết');
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [userId]);

    return { posts, loading, error };
}
