import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// 더미 데이터 타입 정의
type UsageData = {
  date: string; // YYYY-MM-DD
  tokens: number;
  requests: number;
  domain?: string;
};

type WidgetKeyStats = {
  widgetKeyId: string;
  widgetKeyName: string;
  widgetKey: string;
  totalTokens: number;
  totalRequests: number;
  usageData: UsageData[];
  domainStats: {
    domain: string;
    tokens: number;
    requests: number;
  }[];
};

// 더미 데이터 생성 함수
function generateDummyData(): WidgetKeyStats[] {
  const widgetKeys = [
    { id: "1", name: "메인 웹사이트", key: "wk_main2024" },
    { id: "2", name: "서브 도메인", key: "wk_sub2024" },
    { id: "3", name: "테스트 환경", key: "wk_test2024" },
  ];

  const domains = [
    "example.com",
    "www.example.com",
    "app.example.com",
    "api.example.com",
  ];

  return widgetKeys.map((wk) => {
    const days = 30; // 최근 30일
    const usageData: UsageData[] = [];
    const domainStatsMap = new Map<
      string,
      { tokens: number; requests: number }
    >();

    // 각 도메인별 통계 초기화
    domains.forEach((domain) => {
      domainStatsMap.set(domain, { tokens: 0, requests: 0 });
    });

    // 날짜별 데이터 생성
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // 랜덤한 사용량 생성 (약간의 트렌드 포함)
      const baseTokens = Math.floor(Math.random() * 50000) + 10000;
      const baseRequests = Math.floor(Math.random() * 50) + 10;
      const domain = domains[Math.floor(Math.random() * domains.length)];

      usageData.push({
        date: dateStr,
        tokens: baseTokens,
        requests: baseRequests,
        domain: domain,
      });

      // 도메인별 통계 누적
      const domainStat = domainStatsMap.get(domain)!;
      domainStat.tokens += baseTokens;
      domainStat.requests += baseRequests;
      domainStatsMap.set(domain, domainStat);
    }

    const domainStats = Array.from(domainStatsMap.entries()).map(
      ([domain, stats]) => ({
        domain,
        ...stats,
      })
    );

    const totalTokens = usageData.reduce((sum, d) => sum + d.tokens, 0);
    const totalRequests = usageData.reduce((sum, d) => sum + d.requests, 0);

    return {
      widgetKeyId: wk.id,
      widgetKeyName: wk.name,
      widgetKey: wk.key,
      totalTokens,
      totalRequests,
      usageData,
      domainStats,
    };
  });
}

export default function DashboardContent() {
  const [selectedWidgetKey, setSelectedWidgetKey] = useState<string | "all">(
    "all"
  );
  const [selectedDomain, setSelectedDomain] = useState<string | "all">("all");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [groupBy, setGroupBy] = useState<"1d" | "7d" | "30d">("1d");

  // 더미 데이터
  const allStats = useMemo(() => generateDummyData(), []);

  // 선택된 위젯 키의 데이터 필터링
  const filteredStats = useMemo(() => {
    if (selectedWidgetKey === "all") {
      // 모든 위젯 키 통합
      const combinedUsageData: Map<string, UsageData> = new Map();
      const combinedDomainStats: Map<
        string,
        { tokens: number; requests: number }
      > = new Map();

      allStats.forEach((stat) => {
        stat.usageData.forEach((data) => {
          const existing = combinedUsageData.get(data.date);
          if (existing) {
            existing.tokens += data.tokens;
            existing.requests += data.requests;
          } else {
            combinedUsageData.set(data.date, { ...data });
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

      return {
        widgetKeyName: "모든 위젯 키",
        totalTokens: Array.from(combinedUsageData.values()).reduce(
          (sum, d) => sum + d.tokens,
          0
        ),
        totalRequests: Array.from(combinedUsageData.values()).reduce(
          (sum, d) => sum + d.requests,
          0
        ),
        usageData: Array.from(combinedUsageData.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
        domainStats: Array.from(combinedDomainStats.entries()).map(
          ([domain, stats]) => ({
            domain,
            ...stats,
          })
        ),
      };
    }

    const found = allStats.find((s) => s.widgetKeyId === selectedWidgetKey);
    if (!found) {
      // 기본값 반환
      return (
        allStats[0] || {
          widgetKeyName: "위젯 키 없음",
          totalTokens: 0,
          totalRequests: 0,
          usageData: [],
          domainStats: [],
        }
      );
    }
    return found;
  }, [selectedWidgetKey, allStats]);

  // 날짜 범위 필터링
  const dateFilteredData = useMemo(() => {
    if (!filteredStats || !filteredStats.usageData) return [];
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return filteredStats.usageData.filter(
      (d) => new Date(d.date) >= cutoffDate
    );
  }, [filteredStats, dateRange]);

  // 도메인 필터링
  const domainFilteredData = useMemo(() => {
    if (selectedDomain === "all") return dateFilteredData;
    return dateFilteredData.filter((d) => d.domain === selectedDomain);
  }, [dateFilteredData, selectedDomain]);

  // 그룹바이 처리
  const groupedData = useMemo(() => {
    if (groupBy === "1d") return domainFilteredData;

    const grouped = new Map<string, UsageData>();
    const groupDays = groupBy === "7d" ? 7 : 30;

    domainFilteredData.forEach((data) => {
      const date = new Date(data.date);
      const groupKey = new Date(
        date.getFullYear(),
        date.getMonth(),
        Math.floor(date.getDate() / groupDays) * groupDays
      )
        .toISOString()
        .split("T")[0];

      const existing = grouped.get(groupKey);
      if (existing) {
        existing.tokens += data.tokens;
        existing.requests += data.requests;
      } else {
        grouped.set(groupKey, { ...data, date: groupKey });
      }
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [domainFilteredData, groupBy]);

  // 총 사용량 계산
  const totalTokens = domainFilteredData.reduce((sum, d) => sum + d.tokens, 0);
  const totalRequests = domainFilteredData.reduce(
    (sum, d) => sum + d.requests,
    0
  );

  // 이전 기간과 비교 (간단히 절반으로 가정)
  const previousTokens = Math.floor(totalTokens * 0.7);
  const previousRequests = Math.floor(totalRequests * 0.7);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-2 text-sm text-gray-600">
            위젯 키별 및 도메인별 사용량 통계를 확인하세요.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Widget Key Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                위젯 키
              </label>
              <select
                value={selectedWidgetKey}
                onChange={(e) => setSelectedWidgetKey(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#df3326] focus:border-transparent"
              >
                <option value="all">모든 위젯 키</option>
                {allStats.map((stat) => (
                  <option key={stat.widgetKeyId} value={stat.widgetKeyId}>
                    {stat.widgetKeyName} ({stat.widgetKey})
                  </option>
                ))}
              </select>
            </div>

            {/* Domain Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                도메인
              </label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#df3326] focus:border-transparent"
              >
                <option value="all">모든 도메인</option>
                {filteredStats.domainStats.map((ds) => (
                  <option key={ds.domain} value={ds.domain}>
                    {ds.domain}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                기간
              </label>
              <select
                value={dateRange}
                onChange={(e) =>
                  setDateRange(e.target.value as "7d" | "30d" | "90d")
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#df3326] focus:border-transparent"
              >
                <option value="7d">최근 7일</option>
                <option value="30d">최근 30일</option>
                <option value="90d">최근 90일</option>
              </select>
            </div>

            {/* Group By */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                그룹화
              </label>
              <select
                value={groupBy}
                onChange={(e) =>
                  setGroupBy(e.target.value as "1d" | "7d" | "30d")
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#df3326] focus:border-transparent"
              >
                <option value="1d">일별</option>
                <option value="7d">주별</option>
                <option value="30d">월별</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Total Spend / Usage */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  총 토큰 사용량
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {totalTokens.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">토큰</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  이전 기간: {previousTokens.toLocaleString()} 토큰
                </p>
              </div>

              {/* Chart */}
              <div className="mt-6">
                {groupedData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    데이터가 없습니다.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={256}>
                    <LineChart
                      data={groupedData.map((d, index) => {
                        // 이전 기간 데이터도 함께 계산 (비교용)
                        const prevIndex =
                          index - Math.ceil(groupedData.length / 2);
                        const prevTokens =
                          prevIndex >= 0 ? groupedData[prevIndex].tokens : 0;

                        return {
                          date: new Date(d.date).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                          }),
                          tokens: d.tokens,
                          previousTokens: prevTokens > 0 ? prevTokens : null,
                          fullDate: d.date,
                        };
                      })}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        tickFormatter={(value: number) => {
                          if (value >= 1000000)
                            return `${(value / 1000000).toFixed(1)}M`;
                          if (value >= 1000)
                            return `${(value / 1000).toFixed(1)}K`;
                          return value.toString();
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "none",
                          borderRadius: "6px",
                          color: "#fff",
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === "tokens") {
                            return [
                              `${value.toLocaleString()} 토큰`,
                              "현재 기간",
                            ];
                          }
                          if (name === "previousTokens") {
                            return [
                              `${value.toLocaleString()} 토큰`,
                              "이전 기간",
                            ];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(
                          label: string,
                          payload: Array<{ payload?: { fullDate?: string } }>
                        ) => {
                          if (payload && payload[0]?.payload?.fullDate) {
                            return payload[0].payload.fullDate;
                          }
                          return label;
                        }}
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
                      <Line
                        type="monotone"
                        dataKey="previousTokens"
                        stroke="#ec4899"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{
                          r: 6,
                          fill: "#ec4899",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Requests Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  총 요청 수
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {totalRequests.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">요청</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  이전 기간: {previousRequests.toLocaleString()} 요청
                </p>
              </div>

              {/* Chart */}
              <div className="mt-6">
                {groupedData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    데이터가 없습니다.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart
                      data={groupedData.map((d) => ({
                        date: new Date(d.date).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        }),
                        requests: d.requests,
                        fullDate: d.date,
                      }))}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        tickFormatter={(value: number) => value.toString()}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "none",
                          borderRadius: "6px",
                          color: "#fff",
                        }}
                        formatter={(value: number) => [
                          `${value.toLocaleString()} 요청`,
                          "요청",
                        ]}
                        labelFormatter={(
                          label: string,
                          payload: Array<{ payload?: { fullDate?: string } }>
                        ) => {
                          if (payload && payload[0]?.payload?.fullDate) {
                            return payload[0].payload.fullDate;
                          }
                          return label;
                        }}
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
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">요약</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">총 토큰</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {totalTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#df3326] h-2 rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">총 요청</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {totalRequests.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">
                      평균 토큰/요청
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {totalRequests > 0
                        ? Math.floor(
                            totalTokens / totalRequests
                          ).toLocaleString()
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Domain Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                도메인별 통계
              </h3>
              <div className="space-y-3">
                {filteredStats.domainStats
                  .sort((a, b) => b.tokens - a.tokens)
                  .map((ds) => (
                    <div
                      key={ds.domain}
                      className="border-b border-gray-100 pb-3 last:border-0"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-900">
                          {ds.domain}
                        </span>
                        <span className="text-xs text-gray-500">
                          {ds.tokens.toLocaleString()} 토큰
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {ds.requests} 요청
                        </span>
                        <span className="text-xs text-gray-500">
                          {ds.requests > 0
                            ? Math.floor(
                                ds.tokens / ds.requests
                              ).toLocaleString()
                            : 0}{" "}
                          토큰/요청
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Widget Key Stats (if all selected) */}
            {selectedWidgetKey === "all" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  위젯 키별 통계
                </h3>
                <div className="space-y-3">
                  {allStats
                    .sort((a, b) => b.totalTokens - a.totalTokens)
                    .map((stat) => (
                      <div
                        key={stat.widgetKeyId}
                        className="border-b border-gray-100 pb-3 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded -m-2"
                        onClick={() => setSelectedWidgetKey(stat.widgetKeyId)}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-gray-900">
                            {stat.widgetKeyName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {stat.totalTokens.toLocaleString()} 토큰
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 font-mono text-[10px]">
                            {stat.widgetKey}
                          </span>
                          <span className="text-xs text-gray-500">
                            {stat.totalRequests} 요청
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
