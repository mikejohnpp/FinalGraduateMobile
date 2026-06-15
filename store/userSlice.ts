// userSlice — port từ web (src/stores/userSlice.ts).
// Lưu ý: token/userId đọc từ AsyncStorage (async) nên được hydrate qua action setUserId sau khi app khởi động.
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserProfileDTO } from '@/types';

interface UserState {
    userId?: number;
    username?: string;
    accessToken?: string;
    loginSuccess: boolean;
    isLoading: boolean;
    profile: UserProfileDTO | null;
}

const initialState: UserState = {
    userId: undefined,
    username: '',
    accessToken: undefined,
    loginSuccess: false,
    isLoading: false,
    profile: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUsername: (state, action: PayloadAction<string>) => {
            state.username = action.payload;
        },
        setUserId: (state, action: PayloadAction<number | undefined>) => {
            state.userId = action.payload;
        },
        setAccessToken: (state, action: PayloadAction<string | undefined>) => {
            state.accessToken = action.payload;
        },
        setLoginSuccess: (state, action: PayloadAction<boolean>) => {
            state.loginSuccess = action.payload;
        },
        setIsLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setProfile: (state, action: PayloadAction<UserProfileDTO | null>) => {
            state.profile = action.payload;
            if (action.payload) {
                state.username = action.payload.userName;
            }
        },
        updateProfile: (state, action: PayloadAction<Partial<UserProfileDTO>>) => {
            if (state.profile) {
                state.profile = { ...state.profile, ...action.payload };
            }
        },
        resetUser: (state) => {
            state.userId = undefined;
            state.username = '';
            state.accessToken = undefined;
            state.loginSuccess = false;
            state.profile = null;
        },
    },
});

export const userActions = userSlice.actions;
export default userSlice.reducer;
