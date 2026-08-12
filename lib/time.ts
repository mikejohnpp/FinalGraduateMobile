export function timeAgo(input: string | number | Date): string {
  const date = new Date(input);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return '';

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'Vừa xong';

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} giờ trước`;

  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} ngày trước`;

  const week = Math.floor(day / 7);
  if (week < 4) return `${week} tuần trước`;

  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}
