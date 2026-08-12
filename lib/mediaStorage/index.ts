import Constants from 'expo-constants';
import { r2Provider } from '@/lib/mediaStorage/r2Provider';
import { supabaseProvider } from '@/lib/mediaStorage/supabaseProvider';
import type {
  StorageProvider,
  StorageProviderName,
  UploadItem,
  UploadResult,
} from '@/lib/mediaStorage/types';

export type { StorageProvider, StorageProviderName, UploadItem, UploadResult };

const extra = (Constants.expoConfig?.extra ?? {}) as { storageProvider?: string };

const preferred = (extra.storageProvider || 'r2').toLowerCase();

const providers: Record<StorageProviderName, StorageProvider> = {
  r2: r2Provider,
  supabase: supabaseProvider,
};

export function getActiveProvider(): StorageProvider {
  const primary = providers[preferred as StorageProviderName];
  if (primary?.isConfigured) return primary;

  const fallback = preferred === 'r2' ? supabaseProvider : r2Provider;
  if (fallback.isConfigured) return fallback;

  return primary ?? r2Provider;
}

export function buildObjectPath(nameOrUri: string): string {
  const dotIdx = nameOrUri.lastIndexOf('.');
  const ext = dotIdx >= 0 ? nameOrUri.slice(dotIdx) : '';
  const rand = Math.random().toString(16).slice(2, 8);
  return `${Date.now()}-${rand}${ext}`;
}

export async function uploadToStorage(item: UploadItem, fileName?: string): Promise<UploadResult> {
  const provider = getActiveProvider();
  const path = buildObjectPath(fileName ?? item.uri);
  return provider.upload(item, path);
}
