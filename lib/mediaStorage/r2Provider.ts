import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { encodeObjectKey, signRequest } from '@/lib/mediaStorage/sigv4';

import type { StorageProvider, UploadItem, UploadResult } from '@/lib/mediaStorage/types';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2Bucket?: string;
  r2PublicUrl?: string;
};

const accountId = extra.r2AccountId ?? '';
const accessKeyId = extra.r2AccessKeyId ?? '';
const secretAccessKey = extra.r2SecretAccessKey ?? '';

export const R2_BUCKET = extra.r2Bucket || 'media';

const publicBaseUrl = (extra.r2PublicUrl ?? '').replace(/\/$/, '');

const isConfigured = Boolean(accountId && accessKeyId && secretAccessKey && publicBaseUrl);

export const r2Provider: StorageProvider = {
  name: 'r2',
  isConfigured,

  async upload(item: UploadItem, path: string): Promise<UploadResult> {
    if (!isConfigured) {
      throw new Error('R2 chưa được cấu hình');
    }

    const encodedKey = encodeObjectKey(path);
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${R2_BUCKET}/${encodedKey}`;

    const headers = signRequest({
      method: 'PUT',
      url: endpoint,
      accessKeyId,
      secretAccessKey,
      headers: {
        'Content-Type': item.contentType,
        'Cache-Control': '3600',
      },
    });

    const res = await FileSystem.uploadAsync(endpoint, item.uri, {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers,
    });

    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Upload thất bại (R2 ${res.status})`);
    }

    return { url: `${publicBaseUrl}/${encodedKey}`, provider: 'r2' };
  },
};

export default r2Provider;
