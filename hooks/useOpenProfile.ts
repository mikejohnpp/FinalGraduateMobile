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

      if (currentUserId && id === Number(currentUserId)) {
        if (pathname === '/profile') return;
        router.push('/(tabs)/profile');
        return;
      }

      if (pathname === `/user/${id}`) return;
      router.push(`/user/${id}`);
    },
    [router, pathname, currentUserId]
  );
}

export default useOpenProfile;
