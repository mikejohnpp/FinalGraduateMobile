// useChat hooks — port ý tưởng từ web (MessengerLayout + chatSlice + chatSocket).
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
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
import { userOnlineActions } from '@/store/userOnlineSlice';
import type { ChatMessage, Conversation, MediaInput } from '@/types';

// Nhịp làm mới danh sách online. BE không broadcast presence qua websocket
// (chỉ lưu Redis + expose REST), nên phải poll giống web nhưng dày hơn để dot
// online không bị lệch quá lâu.
const ONLINE_POLL_INTERVAL = 20000;

// useSocketConnection — kết nối STOMP khi đã đăng nhập.
// Lưu ý: KHÔNG ngắt socket khi component unmount (giữ kết nối sống cho toàn app),
// chỉ cập nhật cờ connected trong store thông qua callback của client.
export function useSocketConnection() {
    const dispatch = useAppDispatch();
    const userId = useAppSelector((r) => r.user.userId);

    // Lấy danh sách userId đang online. Web gọi một lần trong beforeConnect của
    // STOMP client; ở đây tách ra để còn poll lại và làm mới khi app trở lại.
    const fetchOnlineUsers = useCallback(async () => {
        try {
            const ids = await chatService.getOnlineUsers();
            dispatch(userOnlineActions.setOnlineUsers(ids));
        } catch (e) {
            console.error('Lỗi khi tải danh sách người dùng online:', e);
        }
    }, [dispatch]);

    useEffect(() => {
        if (!userId) {
            dispatch(userOnlineActions.clearOnlineUsers());
            return;
        }
        connectSocket({
            onConnect: () => {
                dispatch(chatActions.setConnected(true));
                fetchOnlineUsers();
            },
            onDisconnect: () => dispatch(chatActions.setConnected(false)),
        });
        // Socket có thể đã connected trước khi hook này chạy → gọi luôn một lần.
        fetchOnlineUsers();

        const timer = setInterval(fetchOnlineUsers, ONLINE_POLL_INTERVAL);
        // App từ background trở lại thì snapshot cũ thường đã lỗi thời.
        const appStateSub = AppState.addEventListener('change', (state) => {
            if (state === 'active') fetchOnlineUsers();
        });

        return () => {
            clearInterval(timer);
            appStateSub.remove();
        };
        // Không gọi disconnectSocket() ở cleanup để tránh rớt kết nối khi điều hướng.
    }, [userId, dispatch, fetchOnlineUsers]);
}

// useIsUserOnline — tiện dụng cho UI: kiểm tra một userId có đang online.
export function useIsUserOnline(targetUserId?: number | null): boolean {
    const onlineUsers = useAppSelector((r) => r.userOnline.onlineUsers);
    if (!targetUserId) return false;
    return onlineUsers.includes(targetUserId);
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
    const [loadingOlder, setLoadingOlder] = useState(false);
    // Còn tin nhắn cũ hơn để tải không. Trang đầu trả < size ⇒ hết.
    const hasMoreRef = useRef(true);
    const loadingOlderRef = useRef(false);


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

    // Gửi media (ảnh/file) — url đã upload lên Supabase. messageType suy từ mediaType.
    const sendMedia = useCallback(
        (media: MediaInput) => {
            if (!conversationId || !media.url) return;
            if (!isConnected()) return;
            const messageType = media.mediaType === 'IMAGE' ? 'IMAGE' : 'FILE';
            wsSendMessage({ conversationId, content: media.url, messageType });
        },
        [conversationId],
    );

    // Tải thêm tin nhắn cũ hơn (cursor beforeId = id tin nhắn cũ nhất hiện có).
    const loadOlder = useCallback(async () => {
        if (!conversationId || loadingOlderRef.current || !hasMoreRef.current) return;
        const oldest = chatInfo?.messages?.[chatInfo.messages.length - 1];
        if (!oldest) return;

        loadingOlderRef.current = true;
        setLoadingOlder(true);
        try {
            const data = await chatService.getConversationDetail2(conversationId, oldest.id);
            const older = data?.messages ?? [];
            if (older.length === 0) {
                hasMoreRef.current = false;
            } else {
                dispatch(
                    chatActions.prependMessages({
                        messages: older,
                        currentPage: (chatInfo?.currentPage ?? 0) + 1,
                    }),
                );
            }
        } catch (e) {
            console.error('Lỗi khi tải tin nhắn cũ:', e);
        } finally {
            loadingOlderRef.current = false;
            setLoadingOlder(false);
        }
    }, [conversationId, chatInfo, dispatch]);

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
        loadingOlder,
        send,
        sendMedia,
        loadOlder,
        setTyping,
    };
}

