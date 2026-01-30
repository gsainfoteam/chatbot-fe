// 대시보드 사용량 API

import { apiGet } from "./client";
import type { WidgetKeyStats } from "./types";

export interface GetWidgetKeysUsageParams {
  startDate?: string;
  endDate?: string;
  widgetKeyId?: string;
  domain?: string;
}

/**
 * 위젯 키 사용량 조회
 * GET /api/v1/admin/widget-keys/usage
 * - 전체 키, 최근 30일: 쿼리 없음
 * - 날짜 지정: startDate, endDate (YYYY-MM-DD)
 * - 특정 키: widgetKeyId
 * - 특정 도메인: domain
 */
export async function getWidgetKeysUsage(
  params?: GetWidgetKeysUsageParams
): Promise<WidgetKeyStats[]> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.widgetKeyId) searchParams.set("widgetKeyId", params.widgetKeyId);
  if (params?.domain) searchParams.set("domain", params.domain);
  
  const query = searchParams.toString();
  const endpoint = query
    ? `/v1/admin/widget-keys/usage?${query}`
    : "/v1/admin/widget-keys/usage";

  const response = await apiGet<WidgetKeyStats[]>(endpoint);
  if (!response.success || !response.data) {
    throw new Error(response.error || "사용량 데이터를 불러오는데 실패했습니다.");
  }
  return Array.isArray(response.data) ? response.data : [response.data];
}
