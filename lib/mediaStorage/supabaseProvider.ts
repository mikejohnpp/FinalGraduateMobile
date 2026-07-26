// Provider upload lên Supabase Storage — port từ web (src/plugins/storage/supabaseProvider.ts).
// Chỉ còn dùng làm fallback khi R2 chưa cấu hình (giống web).
// Khác biệt: RN không có Blob ổn định cho supabase-js → đọc tệp qua expo-file-system,
// decode base64 → ArrayBuffer rồi upload.
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import Constants from 'expo-constants';
import { supabase, MEDIA_BUCKET } from '@/lib/supabase';
import type { StorageProvider, UploadItem, UploadResult } from '@/lib/mediaStorage/types';

const extra = (Constants.expoConfig?.extra ?? {}) as {
    supabaseUrl?: string;
    supabaseKey?: string;
};

// Đọc file tại URI → base64 → ArrayBuffer.
async function readAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
    });
    return decode(base64);
}

export const supabaseProvider: StorageProvider = {
    name: 'supabase',
    isConfigured: Boolean(extra.supabaseUrl && extra.supabaseKey),

    async upload(item: UploadItem, path: string): Promise<UploadResult> {
        const data = await readAsArrayBuffer(item.uri);

        const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, data, {
            cacheControl: '3600',
            upsert: false,
            contentType: item.contentType,
        });

        if (error) {
            throw new Error(`Upload thất bại: ${error.message}`);
        }

        const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
        if (!pub?.publicUrl) {
            throw new Error('Không lấy được đường dẫn công khai của tệp');
        }

        return { url: pub.publicUrl, provider: 'supabase' };
    },
};

export default supabaseProvider;
