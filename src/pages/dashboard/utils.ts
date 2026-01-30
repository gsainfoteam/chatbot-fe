/** 브라우저 로컬 시간 기준 YYYY-MM-DD 포맷 (UTC 변환 없음) */
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD 문자열을 로컬 자정 Date로 파싱 */
function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

/** 날짜 범위 계산 (정확한 일수: 7d → 7일, 30d → 30일) */
export function getDateRange(range: "7d" | "30d" | "90d"): {
  startDate: string;
  endDate: string;
} {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end),
  };
}

/** 툴팁에 표시할 날짜/기간 문자열 (groupBy에 따라) */
export function getTooltipDateLabel(
  dateStr: string,
  groupBy: "1d" | "7d" | "30d"
): string {
  if (groupBy === "1d") return dateStr;
  const start = parseLocalDate(dateStr);
  const end = new Date(start);
  end.setDate(end.getDate() + (groupBy === "7d" ? 6 : 29));
  return `${dateStr} ~ ${formatLocalDate(end)}`;
}

/** startDate~endDate 범위의 모든 날짜(또는 그룹 키) 생성 (groupedData와 동일한 키 계산) */
export function getDateKeysInRange(
  startDate: string,
  endDate: string,
  groupBy: "1d" | "7d" | "30d"
): string[] {
  const keys = new Set<string>();
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const groupDays = groupBy === "7d" ? 7 : groupBy === "30d" ? 30 : 1;

  for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
    if (groupBy === "1d") {
      keys.add(formatLocalDate(d));
    } else {
      const groupKeyDate = new Date(
        d.getFullYear(),
        d.getMonth(),
        Math.floor(d.getDate() / groupDays) * groupDays
      );
      keys.add(formatLocalDate(groupKeyDate));
    }
  }

  return Array.from(keys).sort();
}
