// 위젯 키 관련 API 함수

import { apiGet, apiPost, apiPatch, apiDelete } from "./client";
import type {
  CreateWidgetKeyRequest,
  AddDomainRequest,
  WidgetKeyResponse,
} from "./types";

/**
 * 위젯 키 목록 조회
 * GET /api/v1/admin/widget-keys
 */
export async function getWidgetKeys(): Promise<WidgetKeyResponse[]> {
  const response = await apiGet<WidgetKeyResponse[]>("/v1/admin/widget-keys");
  if (!response.success || !response.data) {
    throw new Error(response.error || "위젯 키 목록을 불러오는데 실패했습니다.");
  }
  return response.data;
}

/**
 * 위젯 키 생성
 * POST /api/v1/admin/widget-keys
 */
export async function createWidgetKey(
  request: CreateWidgetKeyRequest
): Promise<WidgetKeyResponse> {
  const response = await apiPost<WidgetKeyResponse>(
    "/v1/admin/widget-keys",
    request
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || "위젯 키 생성에 실패했습니다.");
  }
  return response.data;
}

/**
 * 위젯 키에 도메인 추가
 * POST /api/v1/admin/widget-keys/{widgetKeyId}/domains
 */
export async function addDomainToWidgetKey(
  widgetKeyId: string,
  request: AddDomainRequest
): Promise<WidgetKeyResponse> {
  const response = await apiPost<WidgetKeyResponse>(
    `/v1/admin/widget-keys/${widgetKeyId}/domains`,
    request
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || "도메인 추가에 실패했습니다.");
  }
  return response.data;
}

/**
 * 위젯 키에서 도메인 삭제
 * DELETE /api/v1/admin/widget-keys/{widgetKeyId}/domains/{domain}
 */
export async function removeDomainFromWidgetKey(
  widgetKeyId: string,
  domain: string
): Promise<void> {
  // URL에 도메인을 인코딩하여 전달
  const encodedDomain = encodeURIComponent(domain);
  const response = await apiDelete<void>(
    `/v1/admin/widget-keys/${widgetKeyId}/domains/${encodedDomain}`
  );
  if (!response.success) {
    throw new Error(response.error || "도메인 삭제에 실패했습니다.");
  }
}

/**
 * 위젯 키 폐기
 * PATCH /api/v1/admin/widget-keys/{widgetKeyId}/revoke
 */
export async function revokeWidgetKey(
  widgetKeyId: string
): Promise<WidgetKeyResponse> {
  const response = await apiPatch<WidgetKeyResponse>(
    `/v1/admin/widget-keys/${widgetKeyId}/revoke`
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || "위젯 키 폐기에 실패했습니다.");
  }
  return response.data;
}
