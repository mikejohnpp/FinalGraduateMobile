import BaseService from '@/services/BaseService';
import http from '@/lib/http';
import { API } from '@/lib/constants';
import type { ApiResult } from '@/types';

export class NotificationService extends BaseService {
  async markAsRead(id: number, userId: number): Promise<boolean> {
    const res = await http.put<ApiResult>(
      `${API.NOTIFICATION.BASE}/${id}/read?userId=${userId}`,
      null
    );
    return res.success ?? res.code === 200;
  }

  async markAllAsRead(userId: number): Promise<boolean> {
    const res = await http.put<ApiResult>(`${API.NOTIFICATION.READ_ALL}?userId=${userId}`, null);
    return res.success ?? res.code === 200;
  }
}

export default new NotificationService();
