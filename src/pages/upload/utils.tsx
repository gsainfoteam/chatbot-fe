/**
 * gcs path를 문서 링크로 변환
 */
export function getResourceLink(gcsPath: string): string {
  const match = gcsPath.match(/^gs:\/\/[^/]+\/(.+)$/);
  return `${import.meta.env.VITE_RESOURCE_CENTER_URL}/resource/${match?.[1]}`;
}

/** ISO 문자열을 datetime-local 입력값으로 변환 */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * datetime-local 값을 ISO로 변환.
 * 빈 값이면 undefined(무기한), 유효하지 않거나 과거/현재면 오류 메시지.
 */
export function parseFutureExpiresAt(
  inputValue: string,
): { expiresAt?: string; error?: string } {
  const trimmed = inputValue.trim();
  if (!trimmed) return {};

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return { error: "유효한 날짜와 시간을 입력해주세요." };
  }
  if (date.getTime() <= Date.now()) {
    return { error: "유효기간은 현재보다 미래 시각이어야 합니다." };
  }
  return { expiresAt: date.toISOString() };
}

export function formatExpiresAtLabel(expiresAt: string | null): string {
  if (expiresAt === null) return "무기한";
  return new Date(expiresAt).toLocaleString("ko-KR");
}
