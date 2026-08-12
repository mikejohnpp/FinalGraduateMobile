import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { API } from '@/lib/constants';
import { uploadImageToStorage } from '@/lib/mediaUpload';
import postService from '@/services/postService';
import userService from '@/services/userService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { userActions } from '@/store/userSlice';
import type { IPost, IProfileUpdate, UserProfileDTO } from '@/types';

export function useCurrentProfile() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((r) => r.user.userId);
  const profile = useAppSelector((r) => r.user.profile);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || profile) return;
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await userService.getProfile(userId);
        if (!cancelled && res?.data) {
          dispatch(userActions.setProfile(res.data));
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [userId, profile, dispatch]);

  return { profile, userId, loading };
}

export function useProfile(userId: number | string | undefined) {
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((r) => r.user.userId);
  const reduxProfile = useAppSelector((r) => r.user.profile);
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOwner && reduxProfile) {
      setProfile(reduxProfile);
    }
  }, [isOwner, reduxProfile]);

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
    [userId, dispatch]
  );

  return { update, loading, error };
}

export function useUploadAvatar() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((r) => r.user.userId);
  const [loading, setLoading] = useState(false);

  const upload = useCallback(
    async (uri: string, mimeType?: string | null): Promise<string | null> => {
      if (!userId) return null;
      setLoading(true);
      try {
        const url = await uploadImageToStorage(uri, mimeType);
        const res = await userService.updateProfile(userId, { avatar: url });
        if (res?.data) {
          dispatch(userActions.setProfile(res.data));
          return url;
        }
        return null;
      } catch (e: any) {
        Alert.alert('Lỗi', e?.message ?? 'Upload ảnh đại diện thất bại');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId, dispatch]
  );

  return { upload, loading };
}

export function useUploadCover() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((r) => r.user.userId);
  const [loading, setLoading] = useState(false);

  const upload = useCallback(
    async (uri: string, mimeType?: string | null): Promise<string | null> => {
      if (!userId) return null;
      setLoading(true);
      try {
        const url = await uploadImageToStorage(uri, mimeType);
        const res = await userService.updateProfile(userId, { coverPhoto: url });
        if (res?.data) {
          dispatch(userActions.setProfile(res.data));
          return url;
        }
        return null;
      } catch (e: any) {
        Alert.alert('Lỗi', e?.message ?? 'Upload ảnh bìa thất bại');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId, dispatch]
  );

  return { upload, loading };
}

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
