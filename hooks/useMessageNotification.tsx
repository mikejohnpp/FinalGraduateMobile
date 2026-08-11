// useMessageNotification — nhận thông báo tin nhắn mới qua STOMP (/user/queue/messages)
// và cung cấp cho toàn app qua context. Chỉ realtime khi app đang mở; không lưu DB,
// không badge unread.
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    subscribeMessageNotifications,
    unsubscribeMessageNotifications,
} from '@/lib/chatSocket';
import { useAppSelector } from '@/store/hooks';
import type { MessageNotification } from '@/types';

// Thời gian banner tự ẩn.
const AUTO_DISMISS_MS = 4000;

interface MessageNotificationContextValue {
    /** Thông báo đang hiển thị, null nếu không có. */
    current: MessageNotification | null;
    dismiss: () => void;
}

const MessageNotificationContext = createContext<MessageNotificationContextValue>({
    current: null,
    dismiss: () => { },
});

export function MessageNotificationProvider({ children }: { children: React.ReactNode }) {
    const userId = useAppSelector((s) => s.user.userId);
    const connected = useAppSelector((s) => s.chat.connected);
    // Hội thoại đang mở — tin nhắn của hội thoại này đã hiện trong khung chat.
    const openConversationId = useAppSelector((s) => s.chat.conversationId);

    const [current, setCurrent] = useState<MessageNotification | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Đọc trong callback của STOMP nên phải dùng ref, tránh callback giữ giá trị cũ.
    const openConversationIdRef = useRef<number | null>(null);
    // Chống hiện trùng khi cùng messageId đến hai lần (reconnect, multi-tab...).
    const lastMessageIdRef = useRef<number | null>(null);

    useEffect(() => {
        openConversationIdRef.current = openConversationId;
    }, [openConversationId]);

    const dismiss = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setCurrent(null);
    }, []);

    const show = useCallback((notification: MessageNotification) => {
        if (notification.messageId === lastMessageIdRef.current) return;
        lastMessageIdRef.current = notification.messageId;

        // Đang mở đúng hội thoại đó thì không cần thông báo.
        if (openConversationIdRef.current === notification.conversationId) return;

        setCurrent(notification);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCurrent(null), AUTO_DISMISS_MS);
    }, []);

    useEffect(() => {
        if (!userId) {
            unsubscribeMessageNotifications();
            setCurrent(null);
            return;
        }
        // subscribeMessageNotifications lưu "ý định đăng ký" và tự áp dụng khi socket
        // connected → re-run theo `connected` để đăng ký lại sau reconnect.
        subscribeMessageNotifications((notification: MessageNotification) => show(notification));

        return () => {
            unsubscribeMessageNotifications();
        };
    }, [userId, connected, show]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const value = useMemo(() => ({ current, dismiss }), [current, dismiss]);

    return (
        <MessageNotificationContext.Provider value={value}>
            {children}
        </MessageNotificationContext.Provider>
    );
}

export function useMessageNotification(): MessageNotificationContextValue {
    return useContext(MessageNotificationContext);
}
