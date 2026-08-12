import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage, MessageChat } from '@/types';

export interface ChatState {
  conversationId: number | null;
  chatInfo: MessageChat | null;
  typingUsers: number[];
  connected: boolean;
}

const initialState: ChatState = {
  conversationId: null,
  chatInfo: null,
  typingUsers: [],
  connected: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    setConversationId: (state, action: PayloadAction<number>) => {
      state.conversationId = action.payload;
    },
    setChatList: (state, action: PayloadAction<MessageChat>) => {
      state.chatInfo = action.payload;
    },

    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      if (!state.chatInfo) return;
      const exists = state.chatInfo.messages.some((m) => m.id === action.payload.id);
      if (!exists) {
        state.chatInfo.messages.unshift(action.payload);
      }
    },
    prependMessages: (
      state,
      action: PayloadAction<{ messages: ChatMessage[]; currentPage: number }>
    ) => {
      if (!state.chatInfo) return;
      const newMessages = action.payload.messages.filter(
        (newMsg) => !state.chatInfo!.messages.some((m) => m.id === newMsg.id)
      );
      state.chatInfo.messages = [...state.chatInfo.messages, ...newMessages];
      state.chatInfo.currentPage = action.payload.currentPage;
    },
    clearChat: (state) => {
      state.conversationId = null;
      state.chatInfo = null;
      state.typingUsers = [];
    },
    setTyping: (state, action: PayloadAction<{ userId: number; isTyping: boolean }>) => {
      const { userId, isTyping } = action.payload;
      if (isTyping) {
        if (!state.typingUsers.includes(userId)) state.typingUsers.push(userId);
      } else {
        state.typingUsers = state.typingUsers.filter((id) => id !== userId);
      }
    },
    clearTyping: (state) => {
      state.typingUsers = [];
    },
  },
});

export const chatActions = chatSlice.actions;
export default chatSlice.reducer;
