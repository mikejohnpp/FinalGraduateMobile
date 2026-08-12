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

const ONLINE_POLL_INTERVAL = 20000;

export function useSocketConnection() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((r) => r.user.userId);

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

    fetchOnlineUsers();

    const timer = setInterval(fetchOnlineUsers, ONLINE_POLL_INTERVAL);

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchOnlineUsers();
    });

    return () => {
      clearInterval(timer);
      appStateSub.remove();
    };
  }, [userId, dispatch, fetchOnlineUsers]);
}

export function useIsUserOnline(targetUserId?: number | null): boolean {
  const onlineUsers = useAppSelector((r) => r.userOnline.onlineUsers);
  if (!targetUserId) return false;
  return onlineUsers.includes(targetUserId);
}

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

export function useConversation(conversationId: number) {
  const dispatch = useAppDispatch();
  const chatInfo = useAppSelector((r) => r.chat.chatInfo);
  const connected = useAppSelector((r) => r.chat.connected);
  const typingUsers = useAppSelector((r) => r.chat.typingUsers);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const hasMoreRef = useRef(true);
  const loadingOlderRef = useRef(false);

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
    [conversationId]
  );

  const sendMedia = useCallback(
    (media: MediaInput) => {
      if (!conversationId || !media.url) return;
      if (!isConnected()) return;
      const messageType = media.mediaType === 'IMAGE' ? 'IMAGE' : 'FILE';
      wsSendMessage({ conversationId, content: media.url, messageType });
    },
    [conversationId]
  );

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
          })
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
    [conversationId]
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
