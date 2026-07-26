// Tiện ích xử lý chuỗi — port từ web (src/utils/stringHelper.tsx).

/** Đếm số từ trong chuỗi (tách theo khoảng trắng, bỏ qua chuỗi rỗng). */
export function countWords(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
}

/**
 * Giới hạn chuỗi tối đa `maxWords` từ.
 * Giữ lại khoảng trắng đang gõ dở ở cuối để người dùng vẫn gõ tiếp được.
 */
export function limitWords(text: string, maxWords: number): string {
    const words = text.split(/(\s+)/); // giữ lại delimiter khoảng trắng
    let wordCount = 0;
    let result = '';
    for (const token of words) {
        if (token.trim()) {
            if (wordCount >= maxWords) break;
            wordCount++;
        }
        result += token;
    }
    return result;
}

/** "Tháng 5, 2024" — dùng cho mốc thời gian tham gia nền tảng. */
export function formatYear(isoString: string): string {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}
