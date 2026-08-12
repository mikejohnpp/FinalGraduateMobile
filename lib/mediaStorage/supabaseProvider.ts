import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import Constants from 'expo-constants';
import { supabase, MEDIA_BUCKET } from '@/lib/supabase';
import type { StorageProvider, UploadItem, UploadResult } from '@/lib/mediaStorage/types';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseKey?: string;
};

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
