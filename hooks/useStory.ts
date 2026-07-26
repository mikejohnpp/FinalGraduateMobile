// useStory hooks — port từ web (src/hooks/useStory.tsx). Alert thay cho toast.
// Khác biệt: upload media nhận URI (từ expo-image-picker) → storage, thay cho File của web.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import storyService from '@/services/storyService';
import { uploadImageToStorage, uploadPickedMedia } from '@/lib/mediaUpload';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storySlice';
import type { IGroupedStory, IStoryDTO } from '@/types';

// Loại story người dùng chọn khi tạo: text (màu nền), image, video (reel).
export type StoryComposeType = 'text' | 'image' | 'video';

interface CreateStoryParams {
    storyType: StoryComposeType;
    textContent?: string;
    color?: string;
    // URI ảnh/video từ expo-image-picker (nếu là image/video).
    mediaUri?: string | null;
    mediaMime?: string | null;
    // Chú thích cho ảnh/video.
    overlayText?: string;
}

// useCreateStory — tạo story mới (STORY). Upload media (nếu có) rồi gọi API.
export function useCreateStory() {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((s) => s.user.userId);
    const [loading, setLoading] = useState(false);

    const create = useCallback(
        async ({
            storyType,
            textContent,
            color,
            mediaUri,
            mediaMime,
            overlayText,
        }: CreateStoryParams): Promise<IStoryDTO | null> => {
            if (!userId) {
                Alert.alert('Lỗi', 'Bạn cần đăng nhập để tạo tin');
                return null;
            }

            // Kiểm tra dữ liệu theo từng loại.
            if (storyType === 'text' && !textContent?.trim()) {
                Alert.alert('Thiếu nội dung', 'Hãy nhập nội dung cho tin văn bản');
                return null;
            }
            if ((storyType === 'image' || storyType === 'video') && !mediaUri) {
                Alert.alert('Thiếu tệp', 'Hãy chọn tệp để tạo tin');
                return null;
            }

            setLoading(true);
            try {
                let urlImage: string | undefined;
                let urlVideo: string | undefined;

                if (storyType === 'image' && mediaUri) {
                    urlImage = await uploadImageToStorage(mediaUri, mediaMime);
                } else if (storyType === 'video' && mediaUri) {
                    // Video: dùng uploadPickedMedia (không giới hạn ảnh) → lấy URL.
                    const uploaded = await uploadPickedMedia({
                        uri: mediaUri,
                        mediaType: 'VIDEO',
                        mimeType: mediaMime,
                    });
                    urlVideo = uploaded.url;
                }

                const story = await storyService.createStory({
                    userId: Number(userId),
                    type: 'STORY',
                    content: storyType === 'text' ? textContent : overlayText,
                    urlImage,
                    urlVideo,
                    color: storyType === 'text' ? color : undefined,
                });

                if (!story) throw new Error('Không nhận được phản hồi từ server');

                dispatch(storyActions.addStory(story));
                return story;
            } catch (e: any) {
                Alert.alert('Lỗi', e?.message ?? 'Tạo tin thất bại');
                return null;
            } finally {
                setLoading(false);
            }
        },
        [dispatch, userId],
    );

    return { create, loading };
}

// useFriendsStories — story của bạn bè, gom nhóm theo user (giống web).
export function useFriendsStories() {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((s) => s.user.userId);
    const { stories, loading } = useAppSelector((s) => s.story);

    const load = useCallback(async () => {
        if (!userId) return;
        dispatch(storyActions.setLoading(true));
        try {
            const data = await storyService.getFriendsStories(Number(userId));
            dispatch(storyActions.setStories(data));
        } catch (e) {
            console.error('Lỗi khi tải story bạn bè:', e);
        } finally {
            dispatch(storyActions.setLoading(false));
        }
    }, [dispatch, userId]);

    useEffect(() => {
        load();
    }, [load]);

    // Gom story theo user, giữ thứ tự mới nhất trước.
    const groupedStories = useMemo(() => {
        const map = new Map<number, IGroupedStory>();
        const sorted = [...stories].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        sorted.forEach((story) => {
            if (!map.has(story.user.id)) {
                map.set(story.user.id, { user: story.user, stories: [] });
            }
            map.get(story.user.id)!.stories.push(story);
        });
        return Array.from(map.values());
    }, [stories]);

    return { groupedStories, loading, refetch: load };
}
