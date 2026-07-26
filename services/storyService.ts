// storyService — port từ web (src/services/StoryService.ts).
// Dùng chung cho cả Story (type=STORY) và Reel (type=REEL).
import BaseService from '@/services/BaseService';
import http from '@/lib/http';
import { API } from '@/lib/constants';
import type { ApiResultGeneric, IStoryDTO, IStoryRequest } from '@/types';

export class StoryService extends BaseService {
    // Tạo story/reel mới (đã upload media lên Supabase, chỉ gửi URL).
    async createStory(payload: IStoryRequest): Promise<IStoryDTO | null> {
        const res = await http.post<ApiResultGeneric<IStoryDTO>>(API.STORY.BASE, payload);
        return res.data ?? null;
    }

    // Lấy story của bạn bè (còn hiệu lực) để hiển thị thanh Stories.
    async getFriendsStories(userId: number): Promise<IStoryDTO[]> {
        const res = await http.get<ApiResultGeneric<IStoryDTO[]>>(API.STORY.FRIENDS, { userId });
        return res.data ?? [];
    }

    // Lấy danh sách reel (feed video) — phân trang theo page.
    async getAllReel(page = 0): Promise<IStoryDTO[]> {
        const res = await http.get<ApiResultGeneric<IStoryDTO[]>>(API.STORY.REEL, { page });
        return res.data ?? [];
    }

    // Lấy reel theo user (tab Reels trong hồ sơ).
    async getAllReelByUserId(userId: number, page = 0): Promise<IStoryDTO[]> {
        const res = await http.get<ApiResultGeneric<IStoryDTO[]>>(`${API.STORY.BASE}/reelUser`, {
            userId,
            page,
        });
        return res.data ?? [];
    }
}

export default new StoryService();
