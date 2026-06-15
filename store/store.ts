// Redux store — port từ web (src/stores/store.ts).
import { configureStore } from '@reduxjs/toolkit';
import userReducer from '@/store/userSlice';
import postReducer from '@/store/postSlice';
import commentReducer from '@/store/commentSlice';
import friendReducer from '@/store/friendSlice';
import groupReducer from '@/store/groupSlice';
import chatReducer from '@/store/chatSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
        post: postReducer,
        comment: commentReducer,
        friend: friendReducer,
        group: groupReducer,
        chat: chatReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
