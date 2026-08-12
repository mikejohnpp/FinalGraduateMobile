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
    '[supabase] supabaseUrl hoặc supabaseKey chưa được cấu hình trong app.json > extra. Tính năng upload media sẽ không hoạt động.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export const MEDIA_BUCKET = extra.supabaseMediaBucket || 'media';

export default supabase;
