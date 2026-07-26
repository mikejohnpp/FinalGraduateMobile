// useNotificationClick — port ý tưởng từ web (src/hooks/useNotificationClick.tsx).
// Khác web: mobile dùng expo-router (không có postViewer overlay) nên điều hướng
// tới màn tương ứng theo loại thông báo.
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

            // COMMENT / REPLY → mở bài viết. link backend dạng "/posts/{postId}".
            if (n.type === 'COMMENT' || n.type === 'REPLY') {
                const postId = n.link ? Number(n.link.replace(/^\/posts\//, '')) : NaN;
                if (!Number.isNaN(postId)) {
                    router.push(`/post/${postId}`);
                    onDone?.();
                    return;
                }
            }

            // Bạn bè → tab bạn bè.
            if (n.type === 'FRIEND_REQUEST' || n.type === 'FRIEND_ACCEPT') {
                router.push('/(tabs)/friends');
                onDone?.();
                return;
            }

            // Nhóm → chi tiết nhóm nếu có entityId, ngược lại tab nhóm.
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
        [router, markAsRead],
    );
}

export default useNotificationClick;
