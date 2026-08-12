import BaseService from '@/services/BaseService';
import http from '@/lib/http';
import { API } from '@/lib/constants';
import type { ApiResultGeneric, IStoryDTO, IStoryRequest } from '@/types';

export class StoryService extends BaseService {
  async createStory(payload: IStoryRequest): Promise<IStoryDTO | null> {
    const res = await http.post<ApiResultGeneric<IStoryDTO>>(API.STORY.BASE, payload);
    return res.data ?? null;
  }

  async getFriendsStories(userId: number): Promise<IStoryDTO[]> {
    const res = await http.get<ApiResultGeneric<IStoryDTO[]>>(API.STORY.FRIENDS, { userId });
    return res.data ?? [];
  }

  async getAllReel(page = 0): Promise<IStoryDTO[]> {
    const res = await http.get<ApiResultGeneric<IStoryDTO[]>>(API.STORY.REEL, { page });
    return res.data ?? [];
  }

  async getAllReelByUserId(userId: number, page = 0): Promise<IStoryDTO[]> {
    const res = await http.get<ApiResultGeneric<IStoryDTO[]>>(`${API.STORY.BASE}/reelUser`, {
      userId,
      page,
    });
    return res.data ?? [];
  }
}

export default new StoryService();
