import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useMarkAsRead } from '@/hooks/useNotification';
import type { INotification } from '@/types';

export function useNotificationClick() {
  const router = useRouter();
  const { markAsRead } = useMarkAsRead();

  return useCallback(
    (n: INotification, onDone?: () => void) => {
      if (!n.isRead) markAsRead(n.id);

      if (n.type === 'COMMENT' || n.type === 'REPLY') {
        const postId = n.link ? Number(n.link.replace(/^\/posts\//, '')) : null;
        if (!Number.isNaN(postId)) {
          router.push(`/post/${postId}`);
          onDone?.();
          return;
        }
      }

      if (n.type === 'FRIEND_REQUEST' || n.type === 'FRIEND_ACCEPT') {
        router.push('/(tabs)/friends');
        onDone?.();
        return;
      }

      if (
        n.type === 'GROUP_JOIN_REQUEST' ||
        n.type === 'GROUP_JOIN_APPROVED' ||
        n.type === 'GROUP_POST_PENDING' ||
        n.type === 'GROUP_POST_APPROVED'
      ) {
        if (n.entityId) {
          router.push(`/group/${n.entityId}`);
        } else {
          router.push('/(tabs)/groups');
        }
        onDone?.();
        return;
      }

      onDone?.();
    },
    [router, markAsRead]
  );
}

export default useNotificationClick;
