import * as FileSystem from 'expo-file-system/legacy';

import { uploadToStorage } from '@/lib/mediaStorage';
import type { MediaInput, MediaType } from '@/types';

export const MAX_MEDIA_SIZE_MB = 25;

export const MAX_IMAGE_SIZE_MB = 10;

export interface PickedMedia {
  uri: string;
  mediaType: MediaType;

  fileName?: string | null;
  mimeType?: string | null;

  fileSize?: number | null;
}

export function inferMediaType(mime?: string | null): MediaType {
  const m = (mime ?? '').toLowerCase();
  if (m.startsWith('image/')) return 'IMAGE';
  if (m.startsWith('video/')) return 'VIDEO';
  if (m.startsWith('audio/')) return 'AUDIO';
  return 'FILE';
}

export function resolveContentType(item: PickedMedia): string {
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

export async function uploadPickedMedia(item: PickedMedia): Promise<MediaInput> {
  if (item.fileSize && item.fileSize > MAX_MEDIA_SIZE_MB * 1024 * 1024) {
    throw new Error(`Tệp vượt quá ${MAX_MEDIA_SIZE_MB}MB`);
  }

  const { url } = await uploadToStorage(
    { uri: item.uri, contentType: resolveContentType(item) },
    item.fileName ?? item.uri
  );

  return { url, mediaType: item.mediaType };
}

export async function uploadPickedMediaFiles(items: PickedMedia[]): Promise<MediaInput[]> {
  const uploaded = await Promise.all(items.map((i) => uploadPickedMedia(i)));
  return uploaded.map((m, index) => ({ ...m, position: index }));
}

export async function uploadImageToStorage(uri: string, mimeType?: string | null): Promise<string> {
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
