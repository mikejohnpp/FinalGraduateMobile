// Kiểu dữ liệu cho lớp storage — port từ web (src/plugins/storage/types.ts).
// Khác biệt: RN không có `File`, nên provider nhận `UploadItem` (URI + contentType)
// thay vì đối tượng File của browser.

export type StorageProviderName = 'r2' | 'supabase';

export interface UploadResult {
    url: string;
    provider: StorageProviderName;
}

// Một tệp cần upload, đã được chuẩn hoá từ expo-image-picker / document-picker.
export interface UploadItem {
    // URI cục bộ (file:///...) do picker trả về.
    uri: string;
    // MIME type dùng cho header Content-Type khi upload.
    contentType: string;
}

export interface StorageProvider {
    name: StorageProviderName;
    isConfigured: boolean;
    upload(item: UploadItem, path: string): Promise<UploadResult>;
}
