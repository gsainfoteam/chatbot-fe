// Admin PDF 업로드 / 삭제 API

import axios from "axios";
import { apiClient } from "./client";
import type { UploadResponse } from "./types";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

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

/** 내가 업로드한 문서 목록 조회 (Super Admin) */
export async function getUploadList(
  params?: GetUploadListParams,
): Promise<UploadResponse[]> {
  const requestParams: { limit?: number; offset?: number } = {};
  if (params?.limit != null) {
    requestParams.limit = Math.min(100, Math.max(1, params.limit));
  }
  if (params?.offset != null && params.offset >= 0) {
    requestParams.offset = params.offset;
  }

  try {
    const res = await apiClient.get<UploadResponse[]>("/v1/admin/upload", {
      params: requestParams,
    });
    return res.data;
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const message = getErrorMessage(err, "목록을 불러오는데 실패했습니다.");
    if (status === 401) {
      throw new Error("인증에 실패했습니다. 다시 로그인해주세요.");
    }
    if (status === 403) {
      throw new Error("Super Admin만 사용할 수 있습니다.");
    }
    throw new Error(message);
  }
}

/** PDF 업로드 (multipart/form-data). */
export async function uploadPdf(
  file: File,
  title: string,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title.trim());

  try {
    const res = await apiClient.post<UploadResponse>(
      "/v1/admin/upload",
      formData,
      {
        // FormData 전송 시 Content-Type 미설정 → axios가 boundary 포함 multipart/form-data로 설정
        headers: { "Content-Type": undefined } as Record<string, string | undefined>,
      },
    );
    return res.data as UploadResponse;
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const message = getErrorMessage(err, "업로드에 실패했습니다.");
    if (status === 400) {
      throw new Error(
        message || "잘못된 요청입니다. (PDF 파일과 제목을 확인해주세요.)",
      );
    }
    if (status === 401) {
      throw new Error("인증에 실패했습니다. 다시 로그인해주세요.");
    }
    if (status === 403) {
      throw new Error("Super Admin만 사용할 수 있습니다.");
    }
    throw new Error(message);
  }
}

/** 업로드된 파일 삭제 */
export async function deleteUpload(id: string): Promise<void> {
  try {
    await apiClient.delete(`/v1/admin/upload/${id}`);
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const message = getErrorMessage(err, "삭제에 실패했습니다.");
    if (status === 401) {
      throw new Error("인증에 실패했습니다. 다시 로그인해주세요.");
    }
    if (status === 403) {
      throw new Error("Super Admin만 사용할 수 있습니다.");
    }
    if (status === 404) {
      throw new Error("이미 삭제되었거나 존재하지 않는 파일입니다.");
    }
    throw new Error(message);
  }
}
