// Supabase client cho mobile — port từ web (src/plugins/supabase/index.ts).
// Dùng cho upload media (Storage). Cấu hình qua app.json > extra.
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
    supabaseUrl?: string;
    supabaseKey?: string;
    supabaseMediaBucket?: string;
};

const supabaseUrl = extra.supabaseUrl ?? '';
const supabaseKey = extra.supabaseKey ?? '';

if (!supabaseUrl || !supabaseKey) {
    console.warn(
        '[supabase] supabaseUrl hoặc supabaseKey chưa được cấu hình trong app.json > extra. Tính năng upload media sẽ không hoạt động.',
    );
}

// Supabase client singleton dùng cho upload media (Storage).
// Không cần persist session vì chỉ dùng Storage với anon/publishable key.
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});

// Tên bucket lưu media của post/comment.
export const MEDIA_BUCKET = extra.supabaseMediaBucket || 'media';

export default supabase;
