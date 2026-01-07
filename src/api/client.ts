// API 클라이언트 공통 설정 (axios 기반)

import axios, { type AxiosError } from "axios";
import type { AxiosInstance } from "axios";
import type { ApiResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// axios 인스턴스 생성
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30초 타임아웃
});

// 요청 인터셉터: 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // 401 에러 시 토큰 제거 및 로그인 페이지로 리다이렉트
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      // 현재 경로가 로그인 페이지가 아닐 때만 리다이렉트
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// 타입 안전한 API 응답 래퍼 (기존 코드와의 호환성을 위해 유지)
export async function apiRequest<T>(
  request: Promise<{ data: T }>
): Promise<ApiResponse<T>> {
  try {
    const response = await request;
    return {
      success: true,
      data: response.data,
    };
  } catch (err) {
    const error = err as AxiosError;
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error:
          (error.response?.data as { message?: string })?.message ||
          error.message,
        message: (error.response?.data as { message?: string })?.message,
      };
    }
    return {
      success: false,
      error: "알 수 없는 오류가 발생했습니다.",
    };
  }
}

// 기존 함수들 (호환성을 위해 유지하되 axios 사용)
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(apiClient.get<T>(endpoint));
}

export async function apiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(apiClient.post<T>(endpoint, body));
}

export async function apiPut<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(apiClient.put<T>(endpoint, body));
}

export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(apiClient.delete<T>(endpoint));
}
