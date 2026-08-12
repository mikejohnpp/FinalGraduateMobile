import BaseService from '@/services/BaseService';
import http from '@/lib/http';
import type { ApiResultGeneric, Conversation, MessageChat } from '@/types';

export class ChatService extends BaseService {
  async getConversations(userId: number): Promise<Conversation[]> {
    const res = await http.get<ApiResultGeneric<Conversation[]>>(
      `chat/conversations/user/${userId}`
    );
    return res.data ?? [];
  }

  async getOnlineUsers(): Promise<number[]> {
    const res = await http.get<ApiResultGeneric<number[]>>('chat/conversations/online');
    return res.data ?? [];
  }

  async getConversationDetail(
    conversationId: number,
    page = 0,
    size = 50
  ): Promise<MessageChat | null> {
    const res = await http.get<ApiResultGeneric<MessageChat>>(
      `chat/conversations/conversation/${conversationId}?page=${page}&size=${size}`
    );
    return res.data ?? null;
  }

  async getConversationDetail2(
    conversationId: number,
    beforeId: number | null
  ): Promise<MessageChat | null> {
    const url = beforeId
      ? `chat/conversations/conversation2/${conversationId}?beforeId=${beforeId}`
      : `chat/conversations/conversation2/${conversationId}`;
    const res = await http.get<ApiResultGeneric<MessageChat>>(url);
    return res.data ?? null;
  }

  async createDirectConversation(
    userOppenentId: number,
    userCurrentId: number
  ): Promise<Conversation | null> {
    const res = await http.post<ApiResultGeneric<Conversation>>('chat/conversations', {
      userOppenentId,
      userCurrentId,
    });
    return res.data ?? null;
  }

  async createGroupConversation(
    name: string,
    memberIds: number[],
    userCurrentId: number
  ): Promise<Conversation | null> {
    const res = await http.post<ApiResultGeneric<Conversation>>('chat/conversations/create_group', {
      name,
      memberIds,
      userCurrentId,
    });
    return res.data ?? null;
  }

  async addMembersToGroup(
    conversationId: number,
    memberIds: number[],
    userCurrentId: number
  ): Promise<Conversation | null> {
    const res = await http.post<ApiResultGeneric<Conversation>>(
      `chat/conversations/${conversationId}/members`,
      { memberIds, userCurrentId }
    );
    return res.data ?? null;
  }

  async getConversationMedia(conversationId: number): Promise<MessageChat | null> {
    const res = await http.get<ApiResultGeneric<MessageChat>>(
      `chat/conversations/conversationImageAndFile/${conversationId}`
    );
    return res.data ?? null;
  }
}

export default new ChatService();
