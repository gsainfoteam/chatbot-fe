// API 클라이언트 공통 설정 (axios 기반)

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AxiosInstance } from "axios";
import type { ApiResponse } from "./types";
import { refreshAccessToken, getRefreshToken } from "./auth";

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
  (config: InternalAxiosRequestConfig) => {
    // refresh 엔드포인트는 Authorization 헤더 제외
    if (config.url?.includes("/v1/auth/admin/refresh")) {
      return config;
    }
    
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

// 응답 인터셉터: 에러 처리 및 토큰 자동 갱신
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // refresh 엔드포인트는 인터셉터에서 제외 (무한 루프 방지)
    if (
      originalRequest.url?.includes("/oauth2/token") ||
      originalRequest.url?.includes("/oauth2/revoke") ||
      originalRequest.url?.includes("/auth/oauth2/refresh") ||
      originalRequest.url?.includes("/v1/auth/admin/refresh")
    ) {
      return Promise.reject(error);
    }

    // 401 에러 시 Refresh Token으로 자동 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 갱신 중이면 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // 백엔드 refresh token으로 토큰 갱신 시도
      const savedRefreshToken = getRefreshToken();
      if (savedRefreshToken) {
        try {
          // IDP refresh -> 백엔드 로그인 전체 플로우 실행
          // refreshAccessToken 내부에서 토큰 저장 처리됨
          const backendResponse = await refreshAccessToken();

          processQueue(null, backendResponse.access_token);

          // 원래 요청 재시도
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${backendResponse.access_token}`;
          }
          isRefreshing = false;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh 실패 시 로그인 페이지로 리다이렉트
          processQueue(refreshError as AxiosError, null);

          // 모든 토큰 삭제
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("tokenExpiresAt");
          isRefreshing = false;

          if (
            window.location.pathname !== "/login" &&
            !window.location.pathname.startsWith("/auth/callback")
          ) {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      } else {
        // Refresh Token이 없으면 로그인 페이지로 리다이렉트
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpiresAt");
        isRefreshing = false;

        if (
          window.location.pathname !== "/login" &&
          !window.location.pathname.startsWith("/auth/callback")
        ) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
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

export async function apiPatch<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(apiClient.patch<T>(endpoint, body));
}

export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(apiClient.delete<T>(endpoint));
}
