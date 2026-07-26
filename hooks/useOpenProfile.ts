// useOpenProfile — điều hướng tới hồ sơ một người dùng từ bất kỳ đâu (avatar, tên,
// hàng thành viên...). Gom về một chỗ để mọi nơi hành xử giống nhau:
//   - chính mình     → tab Cá nhân, không mở /user/{id}
//   - đang ở sẵn màn hồ sơ đó → không làm gì, tránh chồng cùng một màn trong stack
//   - id không hợp lệ (null/undefined/NaN) → không làm gì
import { useCallback } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useAppSelector } from '@/store/hooks';

export function useOpenProfile() {
    const router = useRouter();
    const pathname = usePathname();
    const currentUserId = useAppSelector((r) => r.user.userId);

    return useCallback(
        (userId?: number | string | null) => {
            const id = Number(userId);
            if (!userId || Number.isNaN(id)) return;

            // Hồ sơ của chính mình → dùng tab Cá nhân (có nút chỉnh sửa).
            if (currentUserId && id === Number(currentUserId)) {
                if (pathname === '/profile') return;
                router.push('/(tabs)/profile');
                return;
            }

            if (pathname === `/user/${id}`) return;
            router.push(`/user/${id}`);
        },
        [router, pathname, currentUserId],
    );
}

export default useOpenProfile;
