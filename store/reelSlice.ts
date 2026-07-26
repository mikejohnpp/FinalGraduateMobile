// reelSlice — port từ web (src/stores/reelSlice.ts).
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IStoryDTO } from '@/types';

export interface ReelState {
    reels: IStoryDTO[];
    hasMore: boolean;
}

const initialState: ReelState = {
    reels: [],
    hasMore: true,
};

const reelSlice = createSlice({
    name: 'reel',
    initialState,
    reducers: {
        setReels: (state, action: PayloadAction<IStoryDTO[]>) => {
            state.reels = action.payload;
        },
        appendReels: (state, action: PayloadAction<IStoryDTO[]>) => {
            state.reels.push(...action.payload);
        },
        prependReel: (state, action: PayloadAction<IStoryDTO>) => {
            state.reels.unshift(action.payload);
        },
        setHasMore: (state, action: PayloadAction<boolean>) => {
            state.hasMore = action.payload;
        },
        clearReels: (state) => {
            state.reels = [];
            state.hasMore = true;
        },
    },
});

export const reelActions = reelSlice.actions;
export default reelSlice.reducer;
