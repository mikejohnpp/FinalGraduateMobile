// notificationSlice — port từ web (src/stores/notificationSlice.ts).
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CursorPageResponse, INotification } from '@/types';

interface NotificationState {
    items: INotification[];
    nextCursor: string | null;
    hasMore: boolean;
    unreadCount: number;
}

const initialState: NotificationState = {
    items: [],
    nextCursor: null,
    hasMore: true,
    unreadCount: 0,
};

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        setNotifications: (state, action: PayloadAction<CursorPageResponse<INotification>>) => {
            state.items = action.payload.data;
            state.nextCursor = action.payload.nextCursor;
            state.hasMore = action.payload.hasMore;
        },
        appendNotifications: (state, action: PayloadAction<CursorPageResponse<INotification>>) => {
            state.items.push(...action.payload.data);
            state.nextCursor = action.payload.nextCursor;
            state.hasMore = action.payload.hasMore;
        },
        markRead: (state, action: PayloadAction<number>) => {
            const target = state.items.find((n) => n.id === action.payload);
            if (target && !target.isRead) {
                target.isRead = true;
                if (state.unreadCount > 0) state.unreadCount -= 1;
            }
        },
        markAllRead: (state) => {
            state.items.forEach((n) => {
                n.isRead = true;
            });
            state.unreadCount = 0;
        },
        setUnreadCount: (state, action: PayloadAction<number>) => {
            state.unreadCount = action.payload;
        },
    },
});

export const notificationActions = notificationSlice.actions;
export default notificationSlice.reducer;
