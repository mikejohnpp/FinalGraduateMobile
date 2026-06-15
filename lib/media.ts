// Chuẩn hoá URL ảnh trả về từ backend.
// Backend có thể trả về URL tuyệt đối (http...) hoặc đường dẫn tương đối (/uploads/...).
import { SERVER_API } from '@/lib/constants';

export function resolveMediaUrl(path?: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_API}${normalized}`;
}
