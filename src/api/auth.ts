// 인증 관련 API 함수 (React Query 훅 포함)

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  VerifyTokenResponse,
  ApiResponse,
} from "./types";

// 일반 함수 (React Query 없이 사용 가능)
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    credentials
  );
  return response.data;
}

// 개발 환경 확인
const isDev = import.meta.env.DEV || import.meta.env.MODE === "development";

export async function verifyToken(): Promise<VerifyTokenResponse> {
  // 개발 환경에서는 항상 통과
  if (isDev) {
    return { valid: true };
  }

  const response = await apiClient.get<VerifyTokenResponse>("/auth/verify");
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

// React Query 훅

export function useLogin() {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
    },
  });
}

export function useVerifyToken(enabled: boolean = true) {
  return useQuery({
    queryKey: ["auth", "verify"],
    queryFn: verifyToken,
    enabled,
    retry: false,
    staleTime: Infinity, // 토큰 검증은 자주 하지 않음
    refetchOnWindowFocus: false,
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      localStorage.removeItem("authToken");
    },
  });
}

// 토큰 관리 유틸리티 함수
export function saveToken(token: string): void {
  localStorage.setItem("authToken", token);
}

export function removeToken(): void {
  localStorage.removeItem("authToken");
}

export function getToken(): string | null {
  return localStorage.getItem("authToken");
}

// 기존 코드와의 호환성을 위한 함수 (deprecated)
export async function loginWithResponse(
  credentials: LoginRequest
): Promise<ApiResponse<LoginResponse>> {
  try {
    const data = await login(credentials);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "로그인 실패",
    };
  }
}
