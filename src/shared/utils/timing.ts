export function estimateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateListeningSeconds(text: string, wordsPerMinute = 165): number {
  const words = estimateWordCount(text);
  return Math.max(1, Math.round((words / wordsPerMinute) * 60));
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  if (minutes === 0) {
    return `${remainder}s`;
  }
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
