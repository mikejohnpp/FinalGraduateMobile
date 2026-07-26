// Bảng màu icon dùng chung — đồng bộ với biến theme trong global.css.
// RN/Ionicons cần giá trị màu tường minh (không đọc được biến CSS), nên ta
// gom các token hay dùng vào đây để icon luôn khớp theme (tông xanh của web).
//
// Lưu ý: khi đổi màu trong global.css, cập nhật tương ứng ở đây.

// Palette cho giao diện SÁNG (khớp block :root trong global.css).
export const LIGHT_COLORS = {
    // Nền chính của toàn app (≈ --background).
    background: 'hsl(225, 40%, 99%)',
    // Nền thẻ/card (≈ --card).
    card: 'hsl(0, 0%, 100%)',
    // Nền phụ/placeholder (≈ --muted).
    muted: 'hsl(225, 25%, 95%)',
    // Màu chữ/icon chính trên nền sáng (≈ --foreground).
    foreground: 'hsl(240, 10%, 4%)',
    // Màu phụ, icon mờ (≈ --muted-foreground).
    mutedForeground: 'hsl(225, 5%, 45%)',
    // Màu nhấn chính (≈ --primary) — tông xanh, đồng bộ với web.
    primary: 'hsl(224, 76%, 55%)',
    // Chữ trên nền primary (≈ --primary-foreground).
    primaryForeground: 'hsl(0, 0%, 98%)',
    // Màu cảnh báo/like (≈ --destructive).
    destructive: 'hsl(358, 75%, 55%)',
    // Viền (≈ --border).
    border: 'hsl(225, 30%, 90%)',
    // Trắng thuần (icon trên nền primary/ảnh).
    white: '#ffffff',
} as const;

// Palette cho giao diện TỐI (khớp block .dark trong global.css).
export const DARK_COLORS = {
    background: 'hsl(225, 25%, 10%)',
    card: 'hsl(225, 22%, 14%)',
    muted: 'hsl(225, 15%, 22%)',
    foreground: 'hsl(0, 0%, 98%)',
    mutedForeground: 'hsl(225, 10%, 65%)',
    primary: 'hsl(224, 70%, 62%)',
    primaryForeground: 'hsl(225, 25%, 10%)',
    destructive: 'hsl(358, 65%, 55%)',
    border: 'hsl(225, 15%, 24%)',
    white: '#ffffff',
} as const;

// Giữ export cũ để tương thích ngược (mặc định = sáng).
export const THEME_COLORS = LIGHT_COLORS;

export type ThemeColorKey = keyof typeof LIGHT_COLORS;
