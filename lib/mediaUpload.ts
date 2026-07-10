// Tiện ích upload media lên Supabase Storage — port từ web (src/utils/mediaUpload.ts).
// Khác biệt: RN không có File; nhận URI từ expo-image-picker, đọc file qua expo-file-system
// rồi decode base64 → ArrayBuffer để upload (Supabase RN không nhận Blob trực tiếp ổn định).
import * as FileSystem from 'expo-file-system/legacy';

import { decode } from 'base64-arraybuffer';
import { supabase, MEDIA_BUCKET } from '@/lib/supabase';
import type { MediaInput, MediaType } from '@/types';

// Giới hạn kích thước upload (MB) — mặc định 25MB (khớp web).
export const MAX_MEDIA_SIZE_MB = 25;

// Giới hạn kích thước ảnh profile/nhóm (avatar/cover) — mặc định 10MB.
export const MAX_IMAGE_SIZE_MB = 10;

// Một item media người dùng chọn (trước khi upload).
export interface PickedMedia {
    uri: string;
    mediaType: MediaType;
    // Tên file (nếu có) để suy ra đuôi + contentType.
    fileName?: string | null;
    mimeType?: string | null;
    // Kích thước (byte) nếu picker cung cấp — dùng để kiểm tra giới hạn.
    fileSize?: number | null;
}

// Suy ra MediaType từ MIME type. Mặc định FILE nếu không khớp.
export function inferMediaType(mime?: string | null): MediaType {
    const m = (mime ?? '').toLowerCase();
    if (m.startsWith('image/')) return 'IMAGE';
    if (m.startsWith('video/')) return 'VIDEO';
    if (m.startsWith('audio/')) return 'AUDIO';
    return 'FILE';
}

// Suy ra contentType từ tên file / mime.
function resolveContentType(item: PickedMedia): string {
    if (item.mimeType) return item.mimeType;
    const name = item.fileName ?? item.uri;
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    switch (ext) {
        case 'png':
            return 'image/png';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'gif':
            return 'image/gif';
        case 'webp':
            return 'image/webp';
        case 'mp4':
            return 'video/mp4';
        case 'mov':
            return 'video/quicktime';
        case 'mp3':
            return 'audio/mpeg';
        case 'wav':
            return 'audio/wav';
        default:
            return 'application/octet-stream';
    }
}

// Sinh tên object duy nhất, giữ đuôi file gốc.
function buildObjectPath(item: PickedMedia): string {
    const name = item.fileName ?? item.uri;
    const dotIdx = name.lastIndexOf('.');
    const ext = dotIdx >= 0 ? name.slice(dotIdx) : '';
    const rand = Math.random().toString(16).slice(2, 8);
    return `${Date.now()}-${rand}${ext}`;
}

// Đọc file tại URI → base64 → ArrayBuffer.
async function readAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
    });
    return decode(base64);
}

// Upload một media (từ URI) lên Supabase và trả về MediaInput (url + mediaType).
export async function uploadPickedMedia(item: PickedMedia): Promise<MediaInput> {
    if (item.fileSize && item.fileSize > MAX_MEDIA_SIZE_MB * 1024 * 1024) {
        throw new Error(`Tệp vượt quá ${MAX_MEDIA_SIZE_MB}MB`);
    }

    const path = buildObjectPath(item);
    const contentType = resolveContentType(item);
    const data = await readAsArrayBuffer(item.uri);

    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, data, {
        cacheControl: '3600',
        upsert: false,
        contentType,
    });

    if (error) {
        throw new Error(`Upload thất bại: ${error.message}`);
    }

    const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    if (!pub?.publicUrl) {
        throw new Error('Không lấy được đường dẫn công khai của tệp');
    }

    return { url: pub.publicUrl, mediaType: item.mediaType };
}

// Upload nhiều media, gán position theo thứ tự mảng đầu vào.
export async function uploadPickedMediaFiles(items: PickedMedia[]): Promise<MediaInput[]> {
    const uploaded = await Promise.all(items.map((i) => uploadPickedMedia(i)));
    return uploaded.map((m, index) => ({ ...m, position: index }));
}

// Upload một ảnh (avatar/cover nhóm) lên Supabase và trả về public URL.
// Chỉ chấp nhận ảnh. Dùng cho useGroupImage.
export async function uploadImageToSupabase(uri: string, mimeType?: string | null): Promise<string> {
    const item: PickedMedia = { uri, mediaType: 'IMAGE', mimeType };
    const contentType = resolveContentType(item);
    if (!contentType.startsWith('image/')) {
        throw new Error('Chỉ chấp nhận tệp ảnh');
    }

    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && info.size && info.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        throw new Error(`Ảnh vượt quá ${MAX_IMAGE_SIZE_MB}MB`);
    }


    const media = await uploadPickedMedia(item);
    return media.url;
}
