// groupService — port từ web (src/services/groupService.ts).
import BaseService from '@/services/BaseService';
import { API } from '@/lib/constants';
import http from '@/lib/http';
import type { ApiResult, ApiResultGeneric, CursorPageResponse, IGroup, IPost } from '@/types';

export class GroupService extends BaseService {
    async getGroupDetail(groupId: number, userId: number): Promise<IGroup | null> {
        const res = await http.get<ApiResultGeneric<IGroup>>(`${API.GROUP.BASE}/${groupId}`, {
            userId,
        });
        return res.data ?? null;
    }

    async getJoinedGroups(userId: number): Promise<IGroup[]> {
        const res = await http.get<ApiResultGeneric<IGroup[]>>(API.GROUP.JOINED, { userId });
        return res.data ?? [];
    }

    async getSuggestedGroups(userId: number): Promise<IGroup[]> {
        const res = await http.get<ApiResultGeneric<IGroup[]>>(API.GROUP.SUGGESTED, { userId });
        return res.data ?? [];
    }

    async getGroupFeed(
        userId: number,
        cursor?: string,
        size = 10,
    ): Promise<CursorPageResponse<IPost> | null> {
        const res = await http.get<ApiResultGeneric<CursorPageResponse<IPost>>>(API.GROUP.FEED, {
            userId,
            cursor,
            size,
        });
        return res.data ?? null;
    }

    async getSingleGroupPosts(
        groupId: number,
        userId: number,
        cursor?: string,
        size = 10,
    ): Promise<CursorPageResponse<IPost> | null> {
        const res = await http.get<ApiResultGeneric<CursorPageResponse<IPost>>>(
            `${API.GROUP.BASE}/${groupId}/posts`,
            { userId, cursor, size },
        );
        return res.data ?? null;
    }

    async getGroupMembers(groupId: number) {
        const res = await http.get<ApiResultGeneric<unknown[]>>(
            `${API.GROUP.BASE}/${groupId}/members`,
        );
        return res.data ?? [];
    }

    // Tham gia nhóm — trả về trạng thái PENDING/APPROVED.
    async joinGroup(
        groupId: number,
        userId: number,
    ): Promise<{ status: 'PENDING' | 'APPROVED' } | null> {
        const res = await http.post<ApiResultGeneric<{ status: 'PENDING' | 'APPROVED' }>>(
            `${API.GROUP.BASE}/${groupId}/join?userId=${userId}`,
            null,
        );
        return res.data ?? null;
    }

    async leaveGroup(groupId: number, userId: number): Promise<boolean> {
        const res = await http.post<ApiResult>(
            `${API.GROUP.BASE}/${groupId}/leave?userId=${userId}`,
            null,
        );
        return res.success ?? res.code === 200;
    }

    async createGroup(
        userId: number,
        data: { name: string; privacy: 'public' | 'private'; invitees?: number[] },
    ): Promise<IGroup | null> {
        const res = await http.post<ApiResultGeneric<IGroup>>(
            `${API.GROUP.BASE}?userId=${userId}`,
            data,
        );
        return res.data ?? null;
    }

    // Cập nhật ảnh đại diện nhóm (chỉ ADMIN) — BE chỉ lưu link Supabase.
    async updateGroupAvatar(
        groupId: number,
        userId: number,
        avatar: string,
    ): Promise<IGroup | null> {
        const res = await http.put<ApiResultGeneric<IGroup>>(
            API.GROUP.AVATAR(groupId),
            { avatar },
            { params: { userId } },
        );
        return res.data ?? null;
    }

    // Cập nhật ảnh bìa nhóm (chỉ ADMIN) — BE chỉ lưu link Supabase.
    async updateGroupCover(
        groupId: number,
        userId: number,
        coverPhoto: string,
    ): Promise<IGroup | null> {
        const res = await http.put<ApiResultGeneric<IGroup>>(
            API.GROUP.COVER(groupId),
            { coverPhoto },
            { params: { userId } },
        );
        return res.data ?? null;
    }
}


export default new GroupService();
