/** 날짜 범위 계산 */
export function getDateRange(range: "7d" | "30d" | "90d"): {
  startDate: string;
  endDate: string;
} {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

/** 툴팁에 표시할 날짜/기간 문자열 (groupBy에 따라) */
export function getTooltipDateLabel(
  dateStr: string,
  groupBy: "1d" | "7d" | "30d"
): string {
  if (groupBy === "1d") return dateStr;
  const start = new Date(dateStr);
  const end = new Date(start);
  end.setDate(end.getDate() + (groupBy === "7d" ? 6 : 29));
  return `${dateStr} ~ ${end.toISOString().split("T")[0]}`;
}

/** startDate~endDate 범위의 모든 날짜(또는 그룹 키) 생성 (groupedData와 동일한 키 계산) */
export function getDateKeysInRange(
  startDate: string,
  endDate: string,
  groupBy: "1d" | "7d" | "30d"
): string[] {
  const keys = new Set<string>();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const groupDays = groupBy === "7d" ? 7 : groupBy === "30d" ? 30 : 1;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (groupBy === "1d") {
      keys.add(d.toISOString().split("T")[0]);
    } else {
      const groupKey = new Date(
        d.getFullYear(),
        d.getMonth(),
        Math.floor(d.getDate() / groupDays) * groupDays
      )
        .toISOString()
        .split("T")[0];
      keys.add(groupKey);
    }
  }

  return Array.from(keys).sort();
}
