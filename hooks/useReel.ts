// useReel hooks — port từ web (src/hooks/useReel.tsx & CreateReelModal).
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import storyService from '@/services/storyService';
import { uploadPickedMedia } from '@/lib/mediaUpload';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { reelActions } from '@/store/reelSlice';

// useReels — feed reel (video) phân trang. Truyền userId để lấy reel theo người dùng.
export function useReels(userId?: number) {
    const dispatch = useAppDispatch();
    const { reels, hasMore } = useAppSelector((s) => s.reel);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);

    const fetchReels = useCallback(
        async (pageNum: number) => {
            setLoading(true);
            try {
                const data = userId
                    ? await storyService.getAllReelByUserId(userId, pageNum)
                    : await storyService.getAllReel(pageNum);
                if (data && data.length > 0) {
                    pageNum === 0
                        ? dispatch(reelActions.setReels(data))
                        : dispatch(reelActions.appendReels(data));
                } else {
                    dispatch(reelActions.setHasMore(false));
                }
            } catch (e) {
                console.error('Lỗi khi tải reels:', e);
            } finally {
                setLoading(false);
            }
        },
        [dispatch, userId],
    );

    useEffect(() => {
        dispatch(reelActions.clearReels());
        setPage(0);
        fetchReels(0);
    }, [dispatch, fetchReels]);

    const loadMore = useCallback(() => {
        if (hasMore && !loading) {
            const next = page + 1;
            setPage(next);
            fetchReels(next);
        }
    }, [hasMore, loading, page, fetchReels]);

    return { reels, loading, hasMore, loadMore };
}

// useCreateReel — tạo reel mới (type=REEL) từ video đã chọn.
export function useCreateReel() {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((s) => s.user.userId);
    const [loading, setLoading] = useState(false);

    const create = useCallback(
        async (videoUri: string, mimeType?: string | null, content?: string) => {
            if (!userId) {
                Alert.alert('Lỗi', 'Bạn cần đăng nhập để tạo reel');
                return null;
            }
            setLoading(true);
            try {
                const uploaded = await uploadPickedMedia({
                    uri: videoUri,
                    mediaType: 'VIDEO',
                    mimeType,
                });
                const reel = await storyService.createStory({
                    userId: Number(userId),
                    type: 'REEL',
                    urlVideo: uploaded.url,
                    content,
                });
                if (!reel) throw new Error('Không nhận được phản hồi từ server');
                dispatch(reelActions.prependReel(reel));
                return reel;
            } catch (e: any) {
                Alert.alert('Lỗi', e?.message ?? 'Tạo reel thất bại');
                return null;
            } finally {
                setLoading(false);
            }
        },
        [dispatch, userId],
    );

    return { create, loading };
}
