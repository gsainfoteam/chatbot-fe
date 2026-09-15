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

/** 차트 X축 라벨: 월별이면 "이번달/저번달/…", 아니면 날짜 포맷 */
export function getChartDateLabel(
  dateStr: string,
  groupBy: "1d" | "7d" | "30d"
): string {
  if (groupBy !== "30d") {
    const [y, m, day] = dateStr.split("-").map(Number);
    const d = new Date(y, m - 1, day);
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  }
  const [y, m] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const today = new Date();
  const thisMonth = today.getFullYear() * 12 + today.getMonth();
  const thatMonth = d.getFullYear() * 12 + d.getMonth();
  const diff = thisMonth - thatMonth;
  if (diff === 0) return "이번 달";
  if (diff === 1) return "저번 달";
  if (diff === 2) return "저저번 달";
  if (diff >= 3 && diff <= 11) return `${diff}달 전`;
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
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
  if (groupBy === "30d") {
    // 달력 기준 월: 해당 월의 마지막 날
    const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return `${dateStr} ~ ${formatLocalDate(lastDay)}`;
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${dateStr} ~ ${formatLocalDate(end)}`;
}

/** YYYY-MM-DD 또는 Date에 대한 그룹 키 계산 (주별=7일 버킷, 월별=달력 월) */
export function getGroupKeyForDate(
  dateInput: string | Date,
  groupBy: "7d" | "30d"
): string {
  const d =
    typeof dateInput === "string"
      ? parseLocalDate(dateInput)
      : dateInput;

  if (groupBy === "30d") {
    return formatLocalDate(new Date(d.getFullYear(), d.getMonth(), 1));
  }
  const groupDays = 7;
  const bucketStart =
    Math.floor((d.getDate() - 1) / groupDays) * groupDays + 1;
  const groupKeyDate = new Date(
    d.getFullYear(),
    d.getMonth(),
    bucketStart
  );
  return formatLocalDate(groupKeyDate);
}

/** startDate~endDate 범위의 모든 날짜(또는 그룹 키) 생성 */
export function getDateKeysInRange(
  startDate: string,
  endDate: string,
  groupBy: "1d" | "7d" | "30d"
): string[] {
  const keys = new Set<string>();
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (groupBy === "30d") {
    for (
      let d = new Date(start.getFullYear(), start.getMonth(), 1);
      d.getTime() <= end.getTime();
      d.setMonth(d.getMonth() + 1)
    ) {
      keys.add(formatLocalDate(d));
    }
  } else if (groupBy === "1d") {
    for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
      keys.add(formatLocalDate(d));
    }
  } else {
    for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
      keys.add(getGroupKeyForDate(d, "7d"));
    }
  }

  return Array.from(keys).sort();
}

/** 해결률을 표시용 문자열로 변환. 값이 없으면 "-" */
export function formatResolutionRate(rate?: number): string {
  if (rate == null || Number.isNaN(rate)) return "-";
  return `${(Math.round(rate * 10) / 10).toLocaleString()}%`;
}

/**
 * 여러 위젯 키의 해결률을 요청 수 가중 평균으로 합산.
 * 해결률이 없는 키는 제외하며, 유효한 키가 없으면 undefined.
 */
export function combineResolutionRate(
  stats: Array<{ totalRequests: number; resolutionRate?: number }>,
): number | undefined {
  let weightedSum = 0;
  let weight = 0;
  let count = 0;
  let plainSum = 0;
  for (const s of stats) {
    if (s.resolutionRate == null) continue;
    count += 1;
    plainSum += s.resolutionRate;
    weightedSum += s.resolutionRate * s.totalRequests;
    weight += s.totalRequests;
  }
  if (count === 0) return undefined;
  // 요청 수가 모두 0이면 단순 평균으로 대체
  return weight > 0 ? weightedSum / weight : plainSum / count;
}
