// useSession — hydrate session từ AsyncStorage khi app khởi động.
// Web đọc localStorage đồng bộ; mobile phải đọc async nên cần bước hydrate này.
import { useEffect, useState } from 'react';
import { AUTH_TOKEN_NAME, USER_ID_KEY } from '@/lib/constants';
import { setOnUnauthorized } from '@/lib/http';
import { storage } from '@/lib/storage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { userActions } from '@/store/userSlice';

export function useSession() {
    const dispatch = useAppDispatch();
    const loginSuccess = useAppSelector((r) => r.user.loginSuccess);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        let mounted = true;

        (async () => {
            const [token, userIdRaw] = await Promise.all([
                storage.get(AUTH_TOKEN_NAME),
                storage.get(USER_ID_KEY),
            ]);
            if (!mounted) return;

            if (token && userIdRaw) {
                dispatch(userActions.setAccessToken(token));
                dispatch(userActions.setUserId(parseInt(userIdRaw, 10)));
                dispatch(userActions.setLoginSuccess(true));
            }
            setHydrated(true);
        })();

        // Khi phiên hết hạn (401/403 ở http.ts) → reset state để auth gate đẩy về Login.
        setOnUnauthorized(() => {
            dispatch(userActions.resetUser());
        });

        return () => {
            mounted = false;
            setOnUnauthorized(null);
        };
    }, [dispatch]);

    return { hydrated, isLoggedIn: loginSuccess };
}
