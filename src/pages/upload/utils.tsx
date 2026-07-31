/**
 * gcs path를 문서 링크로 변환
 */
export function getResourceLink(gcsPath: string): string {
  const match = gcsPath.match(/^gs:\/\/[^/]+\/(.+)$/);
  return `${import.meta.env.VITE_RESOURCE_CENTER_URL}/resource/${match?.[1]}`;
}

/** Date 객체를 date 입력값(YYYY-MM-DD)으로 변환 */
export function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 윤년을 고려한 해당 연도/월의 마지막 날짜 */
function getLastDayOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex + 1, 0);
}

export interface SemesterExpiryPreset {
  value: string;
  label: string;
  date: Date;
}

/**
 * GIST 학기 기준 만료일을 계산합니다.
 * 1학기(3~8월)는 8월 31일, 2학기(9~2월)는 2월 말일입니다.
 */
export function getSemesterExpiryPresets(
  now: Date = new Date(),
): {
  currentSemester: SemesterExpiryPreset;
  nextSemester: SemesterExpiryPreset;
} {
  const year = now.getFullYear();
  const month = now.getMonth();

  let currentSemesterDate: Date;
  let nextSemesterDate: Date;

  if (month >= 2 && month <= 7) {
    currentSemesterDate = new Date(year, 7, 31);
    nextSemesterDate = getLastDayOfMonth(year + 1, 1);
  } else if (month >= 8) {
    currentSemesterDate = getLastDayOfMonth(year + 1, 1);
    nextSemesterDate = new Date(year + 1, 7, 31);
  } else {
    currentSemesterDate = getLastDayOfMonth(year, 1);
    nextSemesterDate = new Date(year, 7, 31);
  }

  const shortLabel = (date: Date) =>
    `${date.getFullYear() > year ? "내년 " : ""}${date.getMonth() + 1}/${date.getDate()}`;

  return {
    currentSemester: {
      value: toDateInputValue(currentSemesterDate),
      label: `이번 학기 (~${shortLabel(currentSemesterDate)})`,
      date: currentSemesterDate,
    },
    nextSemester: {
      value: toDateInputValue(nextSemesterDate),
      label: `다음 학기 (~${shortLabel(nextSemesterDate)})`,
      date: nextSemesterDate,
    },
  };
}

/** 2월 29일에서 1년을 더할 때 3월로 넘어가지 않도록 보정 */
export function getOneYearLaterValue(now: Date = new Date()): string {
  const nextYear = now.getFullYear() + 1;
  const lastDay = getLastDayOfMonth(nextYear, now.getMonth()).getDate();
  const date = new Date(
    nextYear,
    now.getMonth(),
    Math.min(now.getDate(), lastDay),
  );
  return toDateInputValue(date);
}

export function formatKoreanDate(value: string | Date): string {
  const dateOnlyMatch =
    typeof value === "string" ? value.match(/^(\d{4})-(\d{2})-(\d{2})$/) : null;
  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : typeof value === "string"
      ? new Date(value)
      : value;
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

/**
 * date 입력값을 해당 날짜의 마지막 시각 ISO 문자열로 변환.
 * 빈 값이면 undefined(무기한), 유효하지 않거나 과거/현재면 오류 메시지.
 */
export function parseFutureExpiresAt(
  inputValue: string,
): { expiresAt?: string; error?: string } {
  const trimmed = inputValue.trim();
  if (!trimmed) return {};

  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
        23,
        59,
        59,
        999,
      )
    : new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return { error: "유효한 날짜를 입력해주세요." };
  }
  if (date.getTime() <= Date.now()) {
    return { error: "유효기간은 현재보다 미래 날짜여야 합니다." };
  }
  return { expiresAt: date.toISOString() };
}

export function formatExpiresAtLabel(expiresAt: string | null): string {
  if (expiresAt === null) return "무기한";
  return new Date(expiresAt).toLocaleString("ko-KR");
}
