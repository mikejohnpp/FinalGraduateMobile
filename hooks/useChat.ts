// useChat hooks — port ý tưởng từ web (MessengerLayout + chatSlice + chatSocket).
import { useCallback, useEffect, useState } from 'react';
import {
    connectSocket,
    isConnected,
    sendMessage as wsSendMessage,
    sendTypingIndicator,
    subscribeConversation,
    unsubscribeConversation,
} from '@/lib/chatSocket';
import chatService from '@/services/chatService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { chatActions } from '@/store/chatSlice';
import type { ChatMessage, Conversation } from '@/types';

// useSocketConnection — kết nối STOMP khi đã đăng nhập.
// Lưu ý: KHÔNG ngắt socket khi component unmount (giữ kết nối sống cho toàn app),
// chỉ cập nhật cờ connected trong store thông qua callback của client.
export function useSocketConnection() {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);

    useEffect(() => {
        if (!userId) return;
        connectSocket({
            onConnect: () => dispatch(chatActions.setConnected(true)),
            onDisconnect: () => dispatch(chatActions.setConnected(false)),
        });
        // Không gọi disconnectSocket() ở cleanup để tránh rớt kết nối khi điều hướng.
    }, [userId, dispatch]);
}

// useConversations — danh sách hội thoại của người dùng.
export function useConversations() {
    const userId = useAppSelector((r) => r.user.userId);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchConversations = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const list = await chatService.getConversations(userId);
            setConversations(list);
        } catch (e) {
            console.error('Lỗi khi tải danh sách hội thoại:', e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    return { conversations, loading, refetch: fetchConversations };
}

// useConversation — chi tiết một hội thoại + realtime + gửi tin nhắn.
export function useConversation(conversationId: number) {
    const dispatch = useAppDispatch();
    const chatInfo = useAppSelector((r) => r.chat.chatInfo);
    const connected = useAppSelector((r) => r.chat.connected);
    const typingUsers = useAppSelector((r) => r.chat.typingUsers);
    const [loading, setLoading] = useState(false);

    // Tải chi tiết hội thoại khi mở.
    useEffect(() => {
        if (!conversationId) return;
        let mounted = true;
        setLoading(true);
        dispatch(chatActions.setConversationId(conversationId));

        chatService
            .getConversationDetail(conversationId)
            .then((data) => {
                if (mounted && data) dispatch(chatActions.setChatList(data));
            })
            .catch((e) => console.error('Lỗi khi tải hội thoại:', e))
            .finally(() => mounted && setLoading(false));

        return () => {
            mounted = false;
            dispatch(chatActions.clearChat());
        };
    }, [conversationId, dispatch]);

    // Đăng ký nhận tin nhắn realtime.
    // subscribeConversation lưu "ý định đăng ký" và tự áp dụng khi socket connected,
    // nên không phụ thuộc thời điểm connected/khi effect chạy. Vẫn re-run khi `connected`
    // đổi để đảm bảo đăng ký lại sau khi reconnect.
    useEffect(() => {
        if (!conversationId) return;
        subscribeConversation(conversationId, (msg: ChatMessage) => {
            dispatch(chatActions.addMessage(msg));
        });
        return () => {
            unsubscribeConversation(conversationId);
        };
    }, [conversationId, connected, dispatch]);

    const send = useCallback(
        (content: string) => {
            if (!content.trim() || !conversationId) return;
            if (!isConnected()) return;
            wsSendMessage({ conversationId, content: content.trim() });
        },
        [conversationId],
    );

    const setTyping = useCallback(
        (isTyping: boolean) => {
            if (!conversationId) return;
            sendTypingIndicator({ conversationId, isTyping });
        },
        [conversationId],
    );

    return {
        chatInfo,
        messages: chatInfo?.messages ?? [],
        members: chatInfo?.members ?? [],
        typingUsers,
        loading,
        send,
        setTyping,
    };
}
