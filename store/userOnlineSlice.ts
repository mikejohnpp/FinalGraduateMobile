// userOnlineSlice — port từ web (src/stores/userOnlineSlice.ts).
// Lưu danh sách userId đang online (lấy từ Redis presence của chat-service).
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState = {
    onlineUsers: [] as number[],
};

export const userOnlineSlice = createSlice({
    name: 'userOnline',
    initialState,
    reducers: {
        setOnlineUsers: (state, action: PayloadAction<number[]>) => {
            state.onlineUsers = action.payload;
        },
        addOnlineUser: (state, action: PayloadAction<number>) => {
            if (!state.onlineUsers.includes(action.payload)) {
                state.onlineUsers.push(action.payload);
            }
        },
        removeOnlineUser: (state, action: PayloadAction<number>) => {
            state.onlineUsers = state.onlineUsers.filter((id) => id !== action.payload);
        },
        clearOnlineUsers: (state) => {
            state.onlineUsers = [];
        },
    },
});

export const userOnlineActions = userOnlineSlice.actions;
export default userOnlineSlice.reducer;
