export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function limitWords(text: string, maxWords: number): string {
  const words = text.split(/(\s+)/);
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

export function formatYear(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}
