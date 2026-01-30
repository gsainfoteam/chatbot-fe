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
