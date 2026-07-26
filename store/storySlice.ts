// storySlice — port từ web (src/stores/storySlice.ts).
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IStoryDTO } from '@/types';

export interface StoryState {
    storyId: number | null;
    stories: IStoryDTO[];
    loading: boolean;
}

const initialState: StoryState = {
    storyId: null,
    stories: [],
    loading: false,
};

const storySlice = createSlice({
    name: 'story',
    initialState,
    reducers: {
        setStoryId: (state, action: PayloadAction<number | null>) => {
            state.storyId = action.payload;
        },
        setStories: (state, action: PayloadAction<IStoryDTO[]>) => {
            state.stories = action.payload;
        },
        addStory: (state, action: PayloadAction<IStoryDTO>) => {
            state.stories.unshift(action.payload);
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
    },
});

export const storyActions = storySlice.actions;
export default storySlice.reducer;
