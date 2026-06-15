// useUser hooks — port từ web (src/hooks/useUser.tsx).
// Khác biệt: dùng AsyncStorage (async), expo-router để điều hướng, Alert thay cho toast.
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AUTH_TOKEN_NAME, USER_ID_KEY } from '@/lib/constants';
import { storage } from '@/lib/storage';
import userService from '@/services/userService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { userActions } from '@/store/userSlice';
import type { RegisterFormData } from '@/types';

export function useLoginUser() {
    const dispatch = useAppDispatch();
    const isLoading = useAppSelector((r) => r.user.isLoading);
    const router = useRouter();

    async function login(email: string, password: string) {
        try {
            dispatch(userActions.setIsLoading(true));
            const response = await userService.login(email, password);

            if (response?.data) {
                const { token, userId } = response.data;
                await storage.set(AUTH_TOKEN_NAME, token);
                await storage.set(USER_ID_KEY, String(userId));

                dispatch(userActions.setAccessToken(token));
                dispatch(userActions.setUserId(userId));
                dispatch(userActions.setLoginSuccess(true));

                router.replace('/(tabs)');
            } else {
                dispatch(userActions.setLoginSuccess(false));
                Alert.alert('Lỗi', response?.message || 'Đăng nhập thất bại');
            }
        } catch (error: any) {
            dispatch(userActions.setLoginSuccess(false));
            Alert.alert(
                'Lỗi',
                error?.response?.data?.message ||
                'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!',
            );
        } finally {
            dispatch(userActions.setIsLoading(false));
        }
    }

    return { login, isLoading };
}

export function useLogoutUser() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const isLoading = useAppSelector((r) => r.user.isLoading);

    async function logout() {
        try {
            dispatch(userActions.setIsLoading(true));
            const res = await userService.logout().catch(() => undefined);
            // Dù API thành công hay lỗi vẫn xoá session phía client.
            await storage.multiRemove([AUTH_TOKEN_NAME, USER_ID_KEY]);
            dispatch(userActions.resetUser());
            router.replace('/login');
            if (!res?.success) {
                // im lặng — đã đăng xuất phía client
            }
        } finally {
            dispatch(userActions.setIsLoading(false));
        }
    }

    return { logout, isLoading };
}

export function useUserRegister() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function register(data: RegisterFormData) {
        setError(null);

        if (
            !data.email.trim() ||
            !data.password.trim() ||
            !data.confirmPassword.trim() ||
            !data.username.trim()
        ) {
            setError('Vui lòng điền đầy đủ thông tin');
            return false;
        }
        if (data.password !== data.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return false;
        }
        if (data.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }

        setLoading(true);
        try {
            const res = await userService.register(
                data.username,
                data.email,
                data.password,
                data.confirmPassword,
            );
            if (res?.success) {
                Alert.alert(
                    'Thành công',
                    'Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.',
                );
            }
            return res?.success ?? false;
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? 'Đăng ký thất bại';
            setError(msg);
            return false;
        } finally {
            setLoading(false);
        }
    }

    return { register, error, loading };
}

export function useUserProfile() {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);
    const profile = useAppSelector((r) => r.user.profile);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await userService.getProfile(userId);
            if (response?.data) {
                dispatch(userActions.setProfile(response.data));
            }
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Không thể tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    }, [userId, dispatch]);

    useEffect(() => {
        if (!userId || profile) return;
        fetchProfile();
    }, [userId, profile, fetchProfile]);

    return { profile, loading, error, refetch: fetchProfile };
}
