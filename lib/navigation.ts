// Helper điều hướng dùng chung.
import type { Href, Router } from 'expo-router';

/**
 * Back an toàn: nếu stack không còn màn nào phía dưới (mở bằng deep link,
 * hoặc màn trước đã bị replace) thì điều hướng về route dự phòng
 * thay vì gọi GO_BACK và bị navigator bỏ qua.
 */
export function goBackOr(router: Router, fallback: Href) {
    if (router.canGoBack()) {
        router.back();
        return;
    }
    router.replace(fallback);
}
