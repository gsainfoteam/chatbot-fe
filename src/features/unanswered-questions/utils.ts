/**
 * 검색 비교용 문자열 정규화.
 * macOS 파일명에서 흔한 분해형 한글(NFD)을 조합형(NFC)으로 통일합니다.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("ko-KR")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatQuestionDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function matchesUnansweredQuestionQuery(
  question: string,
  query?: string,
): boolean {
  const normalizedQuery = query ? normalizeSearchText(query) : "";
  if (!normalizedQuery) return true;
  return normalizeSearchText(question).includes(normalizedQuery);
}
