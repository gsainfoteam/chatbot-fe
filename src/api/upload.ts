// Admin PDF 업로드 / 삭제 API

import { getToken } from "./auth";
import type { UploadResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

/** 내가 업로드한 문서 목록 조회 (Super Admin) */
export async function getUploadList(
  params?: GetUploadListParams,
): Promise<UploadResponse[]> {
  const token = getToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  const searchParams = new URLSearchParams();
  if (params?.limit != null) {
    searchParams.set("limit", String(Math.min(100, Math.max(1, params.limit))));
  }
  if (params?.offset != null && params.offset >= 0) {
    searchParams.set("offset", String(params.offset));
  }
  const query = searchParams.toString();
  const url = query
    ? `${API_BASE_URL}/v1/admin/upload?${query}`
    : `${API_BASE_URL}/v1/admin/upload`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 200) {
    return res.json() as Promise<UploadResponse[]>;
  }

  const text = await res.text();
  let message: string;
  try {
    const json = JSON.parse(text) as { message?: string };
    message = json.message ?? text;
  } catch {
    message = text;
  }

  if (res.status === 401) {
    throw new Error("인증에 실패했습니다. 다시 로그인해주세요.");
  }
  if (res.status === 403) {
    throw new Error("Super Admin만 사용할 수 있습니다.");
  }

  throw new Error(message || "목록을 불러오는데 실패했습니다.");
}

/** PDF 업로드 (multipart/form-data). Content-Type은 설정하지 않음. */
export async function uploadPdf(
  file: File,
  title: string,
): Promise<UploadResponse> {
  const token = getToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title.trim());

  const res = await fetch(`${API_BASE_URL}/v1/admin/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (res.status === 201) {
    return res.json() as Promise<UploadResponse>;
  }

  const text = await res.text();
  let message: string;
  try {
    const json = JSON.parse(text) as { message?: string };
    message = (json.message ?? text) || "업로드에 실패했습니다.";
  } catch {
    message = text || "업로드에 실패했습니다.";
  }

  if (res.status === 400) {
    throw new Error(
      message || "잘못된 요청입니다. (PDF 파일과 제목을 확인해주세요.)",
    );
  }
  if (res.status === 401) {
    throw new Error("인증에 실패했습니다. 다시 로그인해주세요.");
  }
  if (res.status === 403) {
    throw new Error("Super Admin만 사용할 수 있습니다.");
  }

  throw new Error(message);
}

/** 업로드된 파일 삭제 */
export async function deleteUpload(id: string): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  const res = await fetch(`${API_BASE_URL}/v1/admin/upload/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 204) {
    return;
  }

  const text = await res.text();
  let message: string;
  try {
    const json = JSON.parse(text) as { message?: string };
    message = json.message ?? text;
  } catch {
    message = text;
  }

  if (res.status === 401) {
    throw new Error("인증에 실패했습니다. 다시 로그인해주세요.");
  }
  if (res.status === 403) {
    throw new Error("Super Admin만 사용할 수 있습니다.");
  }
  if (res.status === 404) {
    throw new Error("이미 삭제되었거나 존재하지 않는 파일입니다.");
  }

  throw new Error(message || "삭제에 실패했습니다.");
}
