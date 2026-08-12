import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { subscribeMessageNotifications, unsubscribeMessageNotifications } from '@/lib/chatSocket';
import { useAppSelector } from '@/store/hooks';
import type { MessageNotification } from '@/types';

const AUTO_DISMISS_MS = 4000;

interface MessageNotificationContextValue {
  current: MessageNotification | null;
  dismiss: () => void;
}

const MessageNotificationContext = createContext<MessageNotificationContextValue>({
  current: null,
  dismiss: () => {},
});

export function MessageNotificationProvider({ children }: { children: React.ReactNode }) {
  const userId = useAppSelector((s) => s.user.userId);
  const connected = useAppSelector((s) => s.chat.connected);

  const openConversationId = useAppSelector((s) => s.chat.conversationId);

  const [current, setCurrent] = useState<MessageNotification | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openConversationIdRef = useRef<number | null>(null);

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
