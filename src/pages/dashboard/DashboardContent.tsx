import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getWidgetKeysUsage } from "../../api/usage";
import { getWidgetKeys, getWidgetKeyDomains } from "../../api/widgetKeys";
import FilterSelect from "../../components/FilterSelect";
import type { UsageData, DomainStat } from "../../api/types";
import ChartTooltip from "./components/ChartTooltip";
import {
  getDateRange,
  getDateKeysInRange,
  getGroupKeyForDate,
  getTooltipDateLabel,
  getChartDateLabel,
} from "./utils";

export default function DashboardContent() {
  const [selectedWidgetKey, setSelectedWidgetKey] = useState<string | "all">(
    "all",
  );
  const [selectedDomain, setSelectedDomain] = useState<string | "all">("all");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [groupBy, setGroupBy] = useState<"1d" | "7d" | "30d">("1d");

  const { startDate, endDate } = useMemo(
    () => getDateRange(dateRange),
    [dateRange],
  );

  // 위젯 키 목록 조회
  const {
    data: widgetKeys = [],
    isLoading: keysLoading,
    error: keysError,
  } = useQuery({
    queryKey: ["widgetKeys"],
    queryFn: getWidgetKeys,
  });

  // 선택된 위젯 키의 도메인 목록 조회 (전체 선택 시 allowedDomains 합침, 특정 키 시 API 호출)
  const { data: domains = [] } = useQuery({
    queryKey: ["widgetKeyDomains", selectedWidgetKey, widgetKeys.length],
    queryFn: () =>
      selectedWidgetKey === "all"
        ? Promise.resolve(
            [...new Set(widgetKeys.flatMap((k) => k.allowedDomains))].sort(),
          )
        : getWidgetKeyDomains(selectedWidgetKey),
    enabled:
      widgetKeys.length > 0 &&
      (selectedWidgetKey === "all" || !!selectedWidgetKey),
  });

  const handleWidgetKeyChange = (widgetKeyId: string) => {
    setSelectedWidgetKey(widgetKeyId);
    setSelectedDomain("all");
  };

  const {
    data: allStats = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "widgetKeysUsage",
      startDate,
      endDate,
      selectedWidgetKey,
      selectedDomain,
    ],
    queryFn: () =>
      getWidgetKeysUsage({
        startDate,
        endDate,
        widgetKeyId:
          selectedWidgetKey === "all" ? undefined : selectedWidgetKey,
        domain: selectedDomain === "all" ? undefined : selectedDomain,
      }),
  });

  // 선택된 위젯 키의 데이터 필터링
  const filteredStats = useMemo(() => {
    const emptyStats = {
      widgetKeyName: "위젯 키 없음",
      totalTokens: 0,
      totalRequests: 0,
      usageData: [] as UsageData[],
      domainStats: [] as DomainStat[],
    };

    if (selectedWidgetKey === "all") {
      if (allStats.length === 0) return emptyStats;
      // 모든 위젯 키 통합 (date + domain 기준으로 머지하여 도메인 필터 지원)
      const combinedUsageData = new Map<string, UsageData>();
      const combinedDomainStats = new Map<
        string,
        { tokens: number; requests: number }
      >();

      allStats.forEach((stat) => {
        stat.usageData.forEach((data) => {
          const key = data.domain ? `${data.date}__${data.domain}` : data.date;
          const existing = combinedUsageData.get(key);
          if (existing) {
            existing.tokens += data.tokens;
            existing.requests += data.requests;
          } else {
            combinedUsageData.set(key, { ...data });
          }
        });
        stat.domainStats.forEach((ds) => {
          const existing = combinedDomainStats.get(ds.domain);
          if (existing) {
            existing.tokens += ds.tokens;
            existing.requests += ds.requests;
          } else {
            combinedDomainStats.set(ds.domain, {
              tokens: ds.tokens,
              requests: ds.requests,
            });
          }
        });
      });

      const usageData = Array.from(combinedUsageData.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      return {
        widgetKeyName: "모든 위젯 키",
        totalTokens: usageData.reduce((sum, d) => sum + d.tokens, 0),
        totalRequests: usageData.reduce((sum, d) => sum + d.requests, 0),
        usageData,
        domainStats: Array.from(combinedDomainStats.entries()).map(
          ([domain, stats]) => ({
            domain,
            ...stats,
          }),
        ),
      };
    }

    const found = allStats.find((s) => s.widgetKeyId === selectedWidgetKey);
    return found || emptyStats;
  }, [selectedWidgetKey, allStats]);

  // API가 이미 날짜·도메인·위젯키로 필터링된 데이터 반환
  const usageData = useMemo(() => {
    if (!filteredStats?.usageData) return [];
    return [...filteredStats.usageData].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [filteredStats]);

  // 그룹바이 처리
  const groupedData = useMemo(() => {
    if (groupBy === "1d") return usageData;

    const grouped = new Map<string, UsageData>();

    usageData.forEach((data) => {
      const groupKey = getGroupKeyForDate(
        data.date,
        groupBy === "7d" ? "7d" : "30d",
      );

      const existing = grouped.get(groupKey);
      if (existing) {
        existing.tokens += data.tokens;
        existing.requests += data.requests;
      } else {
        grouped.set(groupKey, { ...data, date: groupKey });
      }
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [usageData, groupBy]);

  // 차트용 데이터: startDate~endDate 전체를 채우고, 없는 날짜는 0으로
  const chartData = useMemo(() => {
    const dataByDate = new Map<string, { tokens: number; requests: number }>();
    groupedData.forEach((d) => {
      dataByDate.set(d.date, { tokens: d.tokens, requests: d.requests });
    });

    return getDateKeysInRange(startDate, endDate, groupBy).map((date) => ({
      date,
      tokens: dataByDate.get(date)?.tokens ?? 0,
      requests: dataByDate.get(date)?.requests ?? 0,
    }));
  }, [startDate, endDate, groupBy, groupedData]);

  // 총 사용량 계산 (API가 이미 필터링된 데이터 반환)
  const totalTokens = usageData.reduce((sum, d) => sum + d.tokens, 0);
  const totalRequests = usageData.reduce((sum, d) => sum + d.requests, 0);

  const hasError = error || keysError;

  if (hasError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">
            사용량 데이터를 불러오는데 실패했습니다.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {(error ?? keysError) instanceof Error
              ? (error ?? keysError)!.message
              : "알 수 없는 오류"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-2 text-sm text-gray-600">
            위젯 키별 및 도메인별 사용량 통계를 확인하세요.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <FilterSelect
              label="위젯 키"
              value={selectedWidgetKey}
              onChange={handleWidgetKeyChange}
              options={[
                { value: "all", label: "모든 위젯 키" },
                ...widgetKeys.map((key) => ({
                  value: key.id,
                  label: `${key.name} (${key.secretKey})`,
                })),
              ]}
              selectedLabel={
                selectedWidgetKey === "all"
                  ? "모든 위젯 키"
                  : (widgetKeys.find((k) => k.id === selectedWidgetKey)?.name ??
                    "모든 위젯 키")
              }
              width="lg"
              disabled={keysLoading}
            />
            <FilterSelect
              label="도메인"
              value={selectedDomain}
              onChange={setSelectedDomain}
              options={[
                { value: "all", label: "모든 도메인" },
                ...domains.map((domain) => ({ value: domain, label: domain })),
              ]}
              width="lg"
            />
            <FilterSelect
              label="기간"
              value={dateRange}
              onChange={(v) => setDateRange(v as "7d" | "30d" | "90d")}
              options={[
                { value: "7d", label: "최근 7일" },
                { value: "30d", label: "최근 30일" },
                { value: "90d", label: "최근 90일" },
              ]}
              width="sm"
            />
            <FilterSelect
              label="그룹화"
              value={groupBy}
              onChange={(v) => setGroupBy(v as "1d" | "7d" | "30d")}
              options={[
                { value: "1d", label: "일별" },
                { value: "7d", label: "주별" },
                { value: "30d", label: "월별" },
              ]}
              width="sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Total Spend / Usage */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-gray-900 mb-0.5">
                  총 토큰 사용량
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {totalTokens.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">토큰</span>
                </div>
              </div>

              {/* Chart */}
              <div className="mt-4">
                {isLoading ? (
                  <div className="h-44 flex items-center justify-center text-gray-500">
                    로딩 중...
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-44 flex items-center justify-center text-gray-500">
                    데이터가 없습니다.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <ComposedChart
                      data={chartData.map((d) => ({
                        date: getChartDateLabel(d.date, groupBy),
                        tokens: d.tokens,
                        fullDate: getTooltipDateLabel(d.date, groupBy),
                      }))}
                      margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient
                          id="tokensAreaGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#df3326"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="100%"
                            stopColor="#df3326"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        angle={-45}
                        textAnchor="end"
                        height={44}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        tickFormatter={(value: number) => {
                          if (value >= 1000000)
                            return `${(value / 1000000).toFixed(1)}M`;
                          if (value >= 1000)
                            return `${(value / 1000).toFixed(1)}K`;
                          return value.toString();
                        }}
                      />
                      <Tooltip
                        content={(p) => <ChartTooltip {...p} unit="토큰" />}
                        payloadUniqBy={(item) => item.dataKey}
                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="tokens"
                        fill="url(#tokensAreaGradient)"
                        stroke="none"
                        legendType="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="tokens"
                        stroke="#df3326"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 6,
                          fill: "#df3326",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Requests Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-gray-900 mb-0.5">
                  총 요청 수
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {totalRequests.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">건</span>
                </div>
              </div>

              {/* Chart */}
              <div className="mt-4">
                {isLoading ? (
                  <div className="h-44 flex items-center justify-center text-gray-500">
                    로딩 중...
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-44 flex items-center justify-center text-gray-500">
                    데이터가 없습니다.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={chartData.map((d) => ({
                        date: getChartDateLabel(d.date, groupBy),
                        requests: d.requests,
                        fullDate: getTooltipDateLabel(d.date, groupBy),
                      }))}
                      margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        angle={-45}
                        textAnchor="end"
                        height={44}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        tickFormatter={(value: number) => value.toString()}
                      />
                      <Tooltip
                        content={(p) => <ChartTooltip {...p} unit="건" />}
                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      />
                      <Bar
                        dataKey="requests"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Summary */}
            {(() => {
              const dayCount = usageData.length || 1;
              const dailyAvgTokens = Math.floor(totalTokens / dayCount);
              const dailyAvgRequests = Math.floor(totalRequests / dayCount);
              const peakDay = usageData.length
                ? usageData.reduce((best, d) =>
                    d.tokens > best.tokens ? d : best,
                  )
                : null;
              return (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    사용량 요약
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                        총 토큰
                      </p>
                      <p className="text-lg font-semibold text-gray-900 tabular-nums mt-0.5">
                        {totalTokens.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                        총 요청
                      </p>
                      <p className="text-lg font-semibold text-gray-900 tabular-nums mt-0.5">
                        {totalRequests.toLocaleString()}건
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                        일평균 토큰
                      </p>
                      <p className="text-lg font-semibold text-gray-900 tabular-nums mt-0.5">
                        {dailyAvgTokens.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                        일평균 요청
                      </p>
                      <p className="text-lg font-semibold text-gray-900 tabular-nums mt-0.5">
                        {dailyAvgRequests.toLocaleString()}건
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                        평균 토큰/건
                      </p>
                      <p className="text-lg font-semibold text-gray-900 tabular-nums mt-0.5">
                        {totalRequests > 0
                          ? Math.floor(
                              totalTokens / totalRequests,
                            ).toLocaleString()
                          : 0}
                      </p>
                    </div>
                    {peakDay && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                          최다 사용일
                        </p>
                        <p className="text-sm font-semibold text-gray-900 tabular-nums mt-0.5">
                          {peakDay.date}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {peakDay.tokens.toLocaleString()} 토큰
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Domain Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                도메인별 통계
              </h3>
              {filteredStats.domainStats.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">
                  도메인 데이터가 없습니다.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {filteredStats.domainStats
                    .sort((a, b) => b.tokens - a.tokens)
                    .map((ds) => (
                      <li
                        key={ds.domain}
                        className="px-2.5 py-2 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors"
                        title={ds.domain}
                      >
                        <p
                          className="text-sm text-gray-900 truncate mb-1 font-medium"
                          title={ds.domain}
                        >
                          {ds.domain}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="tabular-nums font-medium text-gray-900">
                            {ds.tokens.toLocaleString()} 토큰
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="tabular-nums">{ds.requests}건</span>
                          <span className="text-gray-300">·</span>
                          <span className="tabular-nums">
                            평균{" "}
                            {ds.requests > 0
                              ? Math.floor(
                                  ds.tokens / ds.requests,
                                ).toLocaleString()
                              : "—"}
                            /건
                          </span>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Widget Key Stats (if all selected) */}
            {selectedWidgetKey === "all" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  위젯 키별 통계
                </h3>
                {allStats.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">
                    위젯 키가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {allStats
                      .sort((a, b) => b.totalTokens - a.totalTokens)
                      .map((stat, idx) => {
                        const totalAll = allStats.reduce(
                          (s, x) => s + x.totalTokens,
                          0,
                        );
                        const pct =
                          totalAll > 0
                            ? Math.round((stat.totalTokens / totalAll) * 100)
                            : 0;
                        return (
                          <div
                            key={stat.widgetKeyId}
                            className="p-2.5 rounded-lg bg-gray-50/80 hover:bg-gray-100 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                            onClick={() =>
                              handleWidgetKeyChange(stat.widgetKeyId)
                            }
                          >
                            <div className="flex items-start gap-2 mb-1.5">
                              <span className="shrink-0 w-5 h-5 rounded bg-gray-200 text-gray-600 text-xs font-medium flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {stat.widgetKeyName}
                                </p>
                                <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                                  {stat.widgetKey}
                                </p>
                              </div>
                              <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                                {stat.totalTokens.toLocaleString()} 토큰
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1 ml-7">
                              <span>{stat.totalRequests} 건</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden ml-7">
                              <div
                                className="h-full bg-[#df3326] rounded-full"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
