// useReel hooks — port từ web (src/hooks/useReel.tsx & CreateReelModal).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import storyService from '@/services/storyService';
import { uploadPickedMedia } from '@/lib/mediaUpload';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { reelActions } from '@/store/reelSlice';
import type { IStoryDTO } from '@/types';

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

// useUserReels — reel của MỘT người dùng, dùng cho tab Reels trong hồ sơ.
// Khác useReels: giữ state cục bộ thay vì redux, nên lưới reel trong hồ sơ không
// tranh chấp dữ liệu với feed toàn màn hình /reels (web dùng chung store nên khi
// mở hồ sơ người khác vẫn thấy sót reel của người trước đó).
export function useUserReels(userId: number | undefined) {
    const [reels, setReels] = useState<IStoryDTO[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    // Trang hiện tại + cờ đang tải giữ trong ref để loadMore không đổi theo mỗi render.
    const pageRef = useRef(0);
    const loadingRef = useRef(false);

    const fetchPage = useCallback(
        async (pageNum: number) => {
            if (!userId || loadingRef.current) return;
            loadingRef.current = true;
            setLoading(true);
            try {
                const data = await storyService.getAllReelByUserId(userId, pageNum);
                if (data.length > 0) {
                    setReels((prev) => (pageNum === 0 ? data : [...prev, ...data]));
                    pageRef.current = pageNum;
                } else {
                    setHasMore(false);
                }
            } catch (e) {
                console.error('Lỗi khi tải reels của người dùng:', e);
            } finally {
                loadingRef.current = false;
                setLoading(false);
            }
        },
        [userId],
    );

    // Đổi userId → xoá danh sách cũ rồi tải lại từ trang 0.
    useEffect(() => {
        setReels([]);
        setHasMore(true);
        pageRef.current = 0;
        fetchPage(0);
    }, [fetchPage]);

    const loadMore = useCallback(() => {
        if (hasMore && !loadingRef.current) fetchPage(pageRef.current + 1);
    }, [fetchPage, hasMore]);

    // prepend — chèn reel mới tạo lên đầu lưới mà không cần gọi lại API.
    const prepend = useCallback((reel: IStoryDTO) => {
        setReels((prev) => [reel, ...prev]);
    }, []);

    return { reels, loading, hasMore, loadMore, prepend };
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
