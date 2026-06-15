// friendService — port từ web (src/services/friendService.ts).
import BaseService from '@/services/BaseService';
import http from '@/lib/http';
import type { ApiResult } from '@/types';

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
}

export default new FriendService();
