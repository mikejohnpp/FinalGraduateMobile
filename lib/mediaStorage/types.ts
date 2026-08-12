export type StorageProviderName = 'r2' | 'supabase';

export interface UploadResult {
  url: string;
  provider: StorageProviderName;
}

export interface UploadItem {
  uri: string;

  contentType: string;
}

export interface StorageProvider {
  name: StorageProviderName;
  isConfigured: boolean;
  upload(item: UploadItem, path: string): Promise<UploadResult>;
}
