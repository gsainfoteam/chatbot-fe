// Admin PDF 업로드 / 삭제 API

import axios from "axios";
import { apiClient } from "./client";
import type { DocumentItem } from "./types";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

const DUPLICATE_UPLOAD_MESSAGE =
  "같은 파일명의 문서가 이미 있습니다. 기존 문서를 삭제하거나 다른 파일명으로 업로드해주세요.";

export class AdminUploadApiError extends Error {
  readonly status?: number;
  readonly retryAt?: string;

  constructor(message: string, status?: number, retryAt?: string) {
    super(message);
    this.name = "AdminUploadApiError";
    this.status = status;
    this.retryAt = retryAt;
  }
}

/** PDF 파일 검증: 확장자 .pdf 또는 type application/pdf */
export function isPdfFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const isPdfExtension = name.endsWith(".pdf");
  const isPdfType = file.type === "application/pdf";
  return isPdfExtension || isPdfType;
}

/** 파일 크기 20MB 이하 여부 */
export function isWithinSizeLimit(file: File): boolean {
  return file.size <= MAX_FILE_SIZE_BYTES;
}

export const MAX_FILE_SIZE_MB = 20;

export interface GetUploadListParams {
  limit?: number; // 기본 50, 최대 100
  offset?: number;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data != null) {
    const data = err.response.data as { message?: string };
    if (typeof data.message === "string") return data.message;
    if (typeof data === "string") return data;
  }
  return fallback;
}

function throwAdminUploadError(
  err: unknown,
  fallback: string,
  extraByStatus?: Record<number, string>,
): never {
  const status = axios.isAxiosError(err) ? err.response?.status : undefined;
  const retryAt = axios.isAxiosError(err)
    ? (err.response?.data as { retryAt?: string } | undefined)?.retryAt
    : undefined;
  const message = getErrorMessage(err, fallback);
  if (status === 401) {
    throw new AdminUploadApiError(
      "인증에 실패했습니다. 다시 로그인해주세요.",
      status,
    );
  }
  if (status === 403) {
    throw new AdminUploadApiError(
      message || "이 작업을 수행할 권한이 없습니다.",
      status,
    );
  }
  if (status != null && extraByStatus?.[status]) {
    throw new AdminUploadApiError(extraByStatus[status], status, retryAt);
  }
  throw new AdminUploadApiError(message, status, retryAt);
}

/** 내가 업로드한 문서 목록 조회 */
export async function getUploadList(
  params?: GetUploadListParams,
): Promise<DocumentItem[]> {
  const requestParams: { limit?: number; offset?: number } = {};
  if (params?.limit != null) {
    requestParams.limit = Math.min(100, Math.max(1, params.limit));
  }
  if (params?.offset != null && params.offset >= 0) {
    requestParams.offset = params.offset;
  }

  try {
    const res = await apiClient.get<DocumentItem[]>("/v1/admin/upload", {
      params: requestParams,
    });
    return res.data;
  } catch (err) {
    throwAdminUploadError(err, "목록을 불러오는데 실패했습니다.");
  }
}

/** 내가 관리할 수 있는 문서 전체 (여러 조직 합침) */
export async function getManageableUploads(
  params?: GetUploadListParams,
): Promise<DocumentItem[]> {
  const requestParams: { limit?: number; offset?: number } = {};
  if (params?.limit != null) {
    requestParams.limit = Math.min(100, Math.max(1, params.limit));
  }
  if (params?.offset != null && params.offset >= 0) {
    requestParams.offset = params.offset;
  }

  try {
    const res = await apiClient.get<DocumentItem[]>(
      "/v1/admin/upload/manageable",
      { params: requestParams },
    );
    return res.data;
  } catch (err) {
    throwAdminUploadError(err, "관리 문서 목록을 불러오는데 실패했습니다.");
  }
}

/** 단건 문서 조회 */
export async function getUploadById(
  id: string,
  signal?: AbortSignal,
): Promise<DocumentItem> {
  try {
    const res = await apiClient.get<DocumentItem>(`/v1/admin/upload/${id}`, {
      signal,
    });
    return res.data;
  } catch (err) {
    throwAdminUploadError(err, "문서 정보를 불러오는데 실패했습니다.", {
      404: "존재하지 않는 문서입니다.",
    });
  }
}

export interface UploadPdfOptions {
  expiresAt?: string;
  organizationId?: string;
}

/** PDF 업로드 (multipart/form-data). organizationId 생략 시 백엔드 기본 조직 사용. */
export async function uploadPdf(
  file: File,
  title: string,
  expiresAtOrOptions?: string | UploadPdfOptions,
): Promise<DocumentItem> {
  const options: UploadPdfOptions =
    typeof expiresAtOrOptions === "string"
      ? { expiresAt: expiresAtOrOptions }
      : (expiresAtOrOptions ?? {});

  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title.trim());
  if (options.expiresAt) {
    formData.append("expiresAt", options.expiresAt);
  }
  if (options.organizationId) {
    formData.append("organizationId", options.organizationId);
  }

  try {
    const res = await apiClient.post<DocumentItem>(
      "/v1/admin/upload",
      formData,
      {
        // FormData 전송 시 Content-Type 미설정 → axios가 boundary 포함 multipart/form-data로 설정
        headers: { "Content-Type": undefined } as Record<
          string,
          string | undefined
        >,
      },
    );
    return res.data;
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const message = getErrorMessage(err, "업로드에 실패했습니다.");
    if (status === 400) {
      throw new AdminUploadApiError(
        message || "잘못된 요청입니다. (PDF 파일과 제목을 확인해주세요.)",
        status,
      );
    }
    if (status === 409) {
      throw new AdminUploadApiError(DUPLICATE_UPLOAD_MESSAGE, status);
    }
    throwAdminUploadError(err, message);
  }
}

/** 다른 조직에 문서 공유 (조회권) */
export async function shareUpload(
  documentId: string,
  organizationId: string,
): Promise<DocumentItem> {
  try {
    const res = await apiClient.put<DocumentItem>(
      `/v1/admin/upload/${documentId}/shares/${organizationId}`,
    );
    return res.data;
  } catch (err) {
    throwAdminUploadError(err, "문서 공유에 실패했습니다.", {
      404: "문서 또는 조직을 찾을 수 없습니다.",
    });
  }
}

/** 문서 공유 해제 */
export async function unshareUpload(
  documentId: string,
  organizationId: string,
): Promise<DocumentItem> {
  try {
    const res = await apiClient.delete<DocumentItem>(
      `/v1/admin/upload/${documentId}/shares/${organizationId}`,
    );
    return res.data;
  } catch (err) {
    throwAdminUploadError(err, "공유 해제에 실패했습니다.", {
      404: "문서 또는 공유 정보를 찾을 수 없습니다.",
    });
  }
}

/** 문서 소유권 이양 */
export async function transferUpload(
  documentId: string,
  targetOrganizationId: string,
): Promise<DocumentItem> {
  try {
    const res = await apiClient.post<DocumentItem>(
      `/v1/admin/upload/${documentId}/transfer`,
      { targetOrganizationId },
    );
    return res.data;
  } catch (err) {
    throwAdminUploadError(err, "소유권 이양에 실패했습니다.", {
      404: "문서 또는 조직을 찾을 수 없습니다.",
    });
  }
}

/** 문서 유효기간 변경 */
export async function updateUploadExpiry(
  id: string,
  expiresAt: string | null,
): Promise<DocumentItem> {
  try {
    const res = await apiClient.patch<DocumentItem>(`/v1/admin/upload/${id}`, {
      expiresAt,
    });
    return res.data;
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const message = getErrorMessage(err, "유효기간 변경에 실패했습니다.");
    if (status === 400) {
      throw new AdminUploadApiError(
        message || "유효기간은 미래 시각의 ISO-8601 형식이어야 합니다.",
        status,
      );
    }
    throwAdminUploadError(err, message, {
      404: "존재하지 않는 문서입니다.",
    });
  }
}

/** 처리 실패 문서 재처리 */
export async function reprocessUpload(id: string): Promise<DocumentItem> {
  try {
    const res = await apiClient.post<DocumentItem>(
      `/v1/admin/upload/${id}/reprocess`,
    );
    return res.data;
  } catch (err) {
    throwAdminUploadError(err, "재처리 요청에 실패했습니다.", {
      404: "존재하지 않는 문서입니다.",
      409: "현재 처리 중인 문서는 재처리할 수 없습니다. 처리가 끝난 후 다시 시도해주세요.",
      429: "재처리 대기 시간이 지나지 않았습니다.",
    });
  }
}

/** 업로드된 파일 삭제 (204 No Content) */
export async function deleteUpload(id: string): Promise<void> {
  try {
    await apiClient.delete(`/v1/admin/upload/${id}`);
  } catch (err) {
    throwAdminUploadError(err, "삭제에 실패했습니다.", {
      404: "이미 삭제되었거나 존재하지 않는 파일입니다.",
    });
  }
}
