// chatService — port từ web (src/services/chatService.ts).
import BaseService from '@/services/BaseService';
import http from '@/lib/http';
import type { ApiResultGeneric, Conversation, MessageChat } from '@/types';

export class ChatService extends BaseService {
    // Danh sách hội thoại của người dùng
    async getConversations(userId: number): Promise<Conversation[]> {
        const res = await http.get<ApiResultGeneric<Conversation[]>>(
            `chat/conversations/user/${userId}`,
        );
        return res.data ?? [];
    }

    // Danh sách userId đang online (presence lưu ở Redis phía chat-service).
    async getOnlineUsers(): Promise<number[]> {
        const res = await http.get<ApiResultGeneric<number[]>>('chat/conversations/online');
        return res.data ?? [];
    }

    // Chi tiết hội thoại + tin nhắn (phân trang)
    async getConversationDetail(
        conversationId: number,
        page = 0,
        size = 50,
    ): Promise<MessageChat | null> {
        const res = await http.get<ApiResultGeneric<MessageChat>>(
            `chat/conversations/conversation/${conversationId}?page=${page}&size=${size}`,
        );
        return res.data ?? null;
    }

    // Load thêm tin nhắn cũ hơn theo con trỏ beforeId (cursor). beforeId = id tin
    // nhắn cũ nhất hiện có; null = lấy trang đầu.
    async getConversationDetail2(
        conversationId: number,
        beforeId: number | null,
    ): Promise<MessageChat | null> {
        const url = beforeId
            ? `chat/conversations/conversation2/${conversationId}?beforeId=${beforeId}`
            : `chat/conversations/conversation2/${conversationId}`;
        const res = await http.get<ApiResultGeneric<MessageChat>>(url);
        return res.data ?? null;
    }


    // Tạo hội thoại 1-1
    async createDirectConversation(
        userOppenentId: number,
        userCurrentId: number,
    ): Promise<Conversation | null> {
        const res = await http.post<ApiResultGeneric<Conversation>>('chat/conversations', {
            userOppenentId,
            userCurrentId,
        });
        return res.data ?? null;
    }

    // Tạo nhóm chat
    async createGroupConversation(
        name: string,
        memberIds: number[],
        userCurrentId: number,
    ): Promise<Conversation | null> {
        const res = await http.post<ApiResultGeneric<Conversation>>(
            'chat/conversations/create_group',
            { name, memberIds, userCurrentId },
        );
        return res.data ?? null;
    }

    // Thêm thành viên vào nhóm chat
    async addMembersToGroup(
        conversationId: number,
        memberIds: number[],
        userCurrentId: number,
    ): Promise<Conversation | null> {
        const res = await http.post<ApiResultGeneric<Conversation>>(
            `chat/conversations/${conversationId}/members`,
            { memberIds, userCurrentId },
        );
        return res.data ?? null;
    }

    // Lấy toàn bộ ảnh/file đã chia sẻ trong hội thoại (quản lý phương tiện).
    async getConversationMedia(conversationId: number): Promise<MessageChat | null> {
        const res = await http.get<ApiResultGeneric<MessageChat>>(
            `chat/conversations/conversationImageAndFile/${conversationId}`,
        );
        return res.data ?? null;
    }
}


export default new ChatService();
