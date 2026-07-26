// Redux store — port từ web (src/stores/store.ts).
import { configureStore } from '@reduxjs/toolkit';
import userReducer from '@/store/userSlice';
import postReducer from '@/store/postSlice';
import commentReducer from '@/store/commentSlice';
import friendReducer from '@/store/friendSlice';
import groupReducer from '@/store/groupSlice';
import chatReducer from '@/store/chatSlice';
import notificationReducer from '@/store/notificationSlice';
import storyReducer from '@/store/storySlice';
import reelReducer from '@/store/reelSlice';
import userOnlineReducer from '@/store/userOnlineSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
        post: postReducer,
        comment: commentReducer,
        friend: friendReducer,
        group: groupReducer,
        chat: chatReducer,
        notification: notificationReducer,
        story: storyReducer,
        reel: reelReducer,
        userOnline: userOnlineReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
