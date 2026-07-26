// Bảng màu nền cho tin văn bản (story dạng text).
// Web dùng CSS gradient; RN không render gradient qua string CSS nên ta dùng màu đơn
// (lấy tông chủ đạo của mỗi gradient web) để lưu vào field `color` của story.
export const STORY_BG_COLORS: { label: string; value: string }[] = [
    { label: 'Tím xanh', value: '#667eea' },
    { label: 'Hồng cam', value: '#f5576c' },
    { label: 'Xanh biển', value: '#4facfe' },
    { label: 'Vàng cam', value: '#f7971e' },
    { label: 'Xanh lá', value: '#43e97b' },
    { label: 'Đỏ hồng', value: '#fa709a' },
    { label: 'Than chì', value: '#434343' },
    { label: 'Đại dương', value: '#2980B9' },
];
