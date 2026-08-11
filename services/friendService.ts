// friendService — port từ web (src/services/friendService.ts).
import BaseService from '@/services/BaseService';
import http from '@/lib/http';
import { API } from '@/lib/constants';
import type { ApiResult, ApiResultGeneric, IFriendStatusResponse } from '@/types';

export class FriendService extends BaseService {
    /** PUT /users/friends/requests/{requestId}/accept?userId={userId} */
    async acceptRequest(requestId: number, userId: number): Promise<boolean> {
        const res = await http.put<ApiResult>(
            `users/friends/requests/${requestId}/accept?userId=${userId}`,
            null,
        );
        return res.success ?? (res.code === 200 || res.code === 201);
    }

    /** PUT /users/friends/requests/{requestId}/decline?userId={userId} */
    async declineRequest(requestId: number, userId: number): Promise<boolean> {
        const res = await http.put<ApiResult>(
            `users/friends/requests/${requestId}/decline?userId=${userId}`,
            null,
        );
        return res.success ?? res.code === 200;
    }

    /** DELETE /users/friends/{friendUserId}?userId={userId} */
    async unfriend(friendUserId: number, userId: number): Promise<boolean> {
        const res = await http.delete<ApiResult>(
            `users/friends/${friendUserId}?userId=${userId}`,
        );
        return res.success ?? res.code === 200;
    }

    /** DELETE /users/friends/suggestions/{targetUserId}?userId={userId} */
    async dismissSuggestion(targetUserId: number, userId: number): Promise<boolean> {
        const res = await http.delete<ApiResult>(
            `${API.FRIEND.SUGGESTIONS}/${targetUserId}?userId=${userId}`,
        );
        return res.success ?? res.code === 200;
    }

    /** GET /users/friends/status?userId={currentUserId}&targetId={targetUserId} */
    async getFriendStatus(
        currentUserId: number,
        targetUserId: number,
    ): Promise<IFriendStatusResponse | null> {
        try {
            const res = await http.get<ApiResultGeneric<IFriendStatusResponse>>(
                `users/friends/status?userId=${currentUserId}&targetId=${targetUserId}`,
            );
            return res.data ?? null;
        } catch {
            return null;
        }
    }

    /** POST /users/friends/requests — gửi lời mời kết bạn */
    async sendRequest(userId: number, targetUserId: number): Promise<boolean> {
        const res = await http.post<ApiResult>('users/friends/requests', {
            userId,
            targetUserId,
        });
        return res.success ?? (res.code === 200 || res.code === 201);
    }

    /** DELETE /users/friends/requests/cancel?userId={userId}&targetId={targetUserId} */
    async cancelFriendRequest(userId: number, targetUserId: number): Promise<boolean> {
        const res = await http.delete<ApiResult>(
            `users/friends/requests/cancel?userId=${userId}&targetId=${targetUserId}`,
        );
        return res.success ?? res.code === 200;
    }
}

export default new FriendService();

