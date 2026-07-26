// notificationService — port từ web (src/services/notificationService.ts).
import BaseService from '@/services/BaseService';
import http from '@/lib/http';
import { API } from '@/lib/constants';
import type { ApiResult } from '@/types';

export class NotificationService extends BaseService {
    /** PUT /notifications/{id}/read?userId={userId} */
    async markAsRead(id: number, userId: number): Promise<boolean> {
        const res = await http.put<ApiResult>(
            `${API.NOTIFICATION.BASE}/${id}/read?userId=${userId}`,
            null,
        );
        return res.success ?? res.code === 200;
    }

    /** PUT /notifications/read-all?userId={userId} */
    async markAllAsRead(userId: number): Promise<boolean> {
        const res = await http.put<ApiResult>(
            `${API.NOTIFICATION.READ_ALL}?userId=${userId}`,
            null,
        );
        return res.success ?? res.code === 200;
    }
}

export default new NotificationService();
