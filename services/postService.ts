import BaseService from '@/services/BaseService';
import http from '@/lib/http';
import type { ApiResult } from '@/types';

export class PostService extends BaseService {
  async likePost(postId: number, userId: number): Promise<boolean> {
    const res = await http.post<ApiResult>(`users/posts/${postId}/like`, { userId });
    return res.success ?? (res.code === 200 || res.code === 201);
  }

  async unlikePost(postId: number, userId: number): Promise<boolean> {
    const res = await http.deleteWithBody<ApiResult>(`users/posts/${postId}/like`, { userId });
    return res.success ?? (res.code === 200 || res.code === 204);
  }
}

export default new PostService();
