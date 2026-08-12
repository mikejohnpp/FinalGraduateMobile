import BaseService from '@/services/BaseService';
import http from '@/lib/http';
import { API } from '@/lib/constants';
import type { ApiResult, ApiResultGeneric, IFriendStatusResponse } from '@/types';

export class FriendService extends BaseService {
  async acceptRequest(requestId: number, userId: number): Promise<boolean> {
    const res = await http.put<ApiResult>(
      `users/friends/requests/${requestId}/accept?userId=${userId}`,
      null
    );
    return res.success ?? (res.code === 200 || res.code === 201);
  }

  async declineRequest(requestId: number, userId: number): Promise<boolean> {
    const res = await http.put<ApiResult>(
      `users/friends/requests/${requestId}/decline?userId=${userId}`,
      null
    );
    return res.success ?? res.code === 200;
  }

  async unfriend(friendUserId: number, userId: number): Promise<boolean> {
    const res = await http.delete<ApiResult>(`users/friends/${friendUserId}?userId=${userId}`);
    return res.success ?? res.code === 200;
  }

  async dismissSuggestion(targetUserId: number, userId: number): Promise<boolean> {
    const res = await http.delete<ApiResult>(
      `${API.FRIEND.SUGGESTIONS}/${targetUserId}?userId=${userId}`
    );
    return res.success ?? res.code === 200;
  }

  async getFriendStatus(
    currentUserId: number,
    targetUserId: number
  ): Promise<IFriendStatusResponse | null> {
    try {
      const res = await http.get<ApiResultGeneric<IFriendStatusResponse>>(
        `users/friends/status?userId=${currentUserId}&targetId=${targetUserId}`
      );
      return res.data ?? null;
    } catch {
      return null;
    }
  }

  async sendRequest(userId: number, targetUserId: number): Promise<boolean> {
    const res = await http.post<ApiResult>('users/friends/requests', {
      userId,
      targetUserId,
    });
    return res.success ?? (res.code === 200 || res.code === 201);
  }

  async cancelFriendRequest(userId: number, targetUserId: number): Promise<boolean> {
    const res = await http.delete<ApiResult>(
      `users/friends/requests/cancel?userId=${userId}&targetId=${targetUserId}`
    );
    return res.success ?? res.code === 200;
  }
}

export default new FriendService();
