// 인증 관련 API 함수 (React Query 훅 포함)

import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  LoginRequest,
  LoginResponse,
  VerifyTokenResponse,
  ApiResponse,
  OAuth2CallbackParams,
  AdminLoginRequest,
  AdminLoginResponse,
} from "./types";
import { apiClient } from "./client";

// ===== 일반 함수 =====

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    credentials
  );
  return response.data;
}

// 백엔드 Admin 로그인 (Authorization Code를 백엔드에 전달)
// 백엔드가 IDP 토큰 교환을 처리하므로 client_secret은 백엔드에서 관리
// POST /api/v1/auth/admin/login with { code: "...", redirect_uri: "...", code_verifier: "..." }
export async function adminLogin(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<AdminLoginResponse> {
  const response = await apiClient.post<AdminLoginResponse>(
    "/v1/auth/admin/login",
    {
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    } as AdminLoginRequest
  );
  return response.data;
}

export async function verifyToken(): Promise<VerifyTokenResponse> {
  const response = await apiClient.get<VerifyTokenResponse>(
    "/v1/auth/admin/verify"
  );
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

// ===== React Query 훅 =====

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

// OAuth2/OIDC 유틸리티 함수

// 랜덤 문자열 생성 (state 파라미터용)
function generateRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
      byte % 62
    )
  ).join("");
}

// State 파라미터 생성 (CSRF 방지)
function generateState(): string {
  return generateRandomString(32);
}

// PKCE (Proof Key for Code Exchange) 관련 함수

// Base64 URL 인코딩 (패딩 제거, URL 안전 문자 사용)
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Code Verifier 생성 (43-128자의 랜덤 문자열)
function generateCodeVerifier(): string {
  return generateRandomString(64);
}

// Code Challenge 생성 (code_verifier의 SHA-256 해시를 Base64 URL 인코딩)
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

// Nonce 생성 (ID Token replay attack 방지)
function generateNonce(): string {
  return generateRandomString(32);
}

// OAuth2 Authorization URL 생성 (PKCE 포함)
export async function generateAuthorizationUrl(): Promise<string> {
  // authorize 엔드포인트 URL (예: https://idp.gistory.me/authorize)
  const authorizationUrl = import.meta.env.VITE_OAUTH2_AUTHORIZATION_URL;

  const clientId = import.meta.env.VITE_OAUTH2_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI;
  const scope = import.meta.env.VITE_OAUTH2_SCOPE;
  const prompt = import.meta.env.VITE_OAUTH2_PROMPT;

  // State 생성 및 저장 (CSRF 방지)
  const state = generateState();
  localStorage.setItem("oauth2_state", state);

  // PKCE: Code Verifier 및 Code Challenge 생성
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Code Verifier 저장 (토큰 교환 시 사용)
  localStorage.setItem("oauth2_code_verifier", codeVerifier);

  // Nonce 생성 및 저장 (ID Token replay attack 방지)
  const nonce = generateNonce();
  localStorage.setItem("oauth2_nonce", nonce);

  // authorize 엔드포인트에 전달할 파라미터 생성
  // PKCE 포함: code_challenge, code_challenge_method
  // OIDC 포함: nonce
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scope,
    state: state,
    redirect_uri: redirectUri,
    prompt: prompt,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    nonce: nonce,
  });

  return `${authorizationUrl}?${params.toString()}`;
}

// OAuth2 Callback에서 파라미터 추출 및 state 검증
export function handleOAuth2Callback(): OAuth2CallbackParams {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");
  const errorDescription = params.get("error_description");

  // 저장된 state와 비교 (CSRF 방지)
  const savedState = localStorage.getItem("oauth2_state");
  if (state && savedState && state !== savedState) {
    throw new Error("State mismatch: CSRF 공격 가능성");
  }

  // 검증 후 state 삭제
  if (state) {
    localStorage.removeItem("oauth2_state");
  }

  return {
    code: code || undefined,
    state: state || undefined,
    error: error || undefined,
    error_description: errorDescription || undefined,
  };
}

// 백엔드 토큰 갱신 (백엔드 refresh token 사용)
export async function refreshAccessToken(): Promise<AdminLoginResponse> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Refresh token이 없습니다.");
  }

  // 백엔드 refresh 엔드포인트 호출
  const response = await apiClient.post<AdminLoginResponse>(
    "/v1/auth/admin/refresh",
    { refresh_token: refreshToken }
  );

  // 백엔드 토큰 저장
  saveBackendTokens(response.data);

  return response.data;
}

// 로그아웃 (백엔드 logout 엔드포인트 사용)
// refresh_token을 body에 전송하여 토큰 무효화
export async function revokeToken(): Promise<void> {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    try {
      await apiClient.post("/v1/auth/admin/logout", {
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  }

  // 로컬 스토리지에 저장된 모든 토큰 삭제
  removeTokens();
}

// OAuth Provider 로그아웃 (선택사항)
export async function logoutFromOAuth2(): Promise<void> {
  const logoutUrl = import.meta.env.VITE_OAUTH2_LOGOUT_URL;
  if (logoutUrl) {
    const clientId = import.meta.env.VITE_OAUTH2_CLIENT_ID || "";
    const postLogoutRedirectUri = window.location.origin;
    const logoutParams = new URLSearchParams({
      client_id: clientId,
      post_logout_redirect_uri: postLogoutRedirectUri,
    });
    window.location.href = `${logoutUrl}?${logoutParams.toString()}`;
  }
}

// ===== 토큰 관리 함수 =====

// 백엔드 토큰 저장 (실제 API 호출에 사용)
export function saveBackendTokens(response: AdminLoginResponse): void {
  localStorage.setItem("authToken", response.access_token);

  if (response.refresh_token) {
    localStorage.setItem("refreshToken", response.refresh_token);
  }

  if (response.expires_in) {
    const expiresAt = Date.now() + response.expires_in * 1000;
    localStorage.setItem("tokenExpiresAt", expiresAt.toString());
  }
}

// 기존 함수 (호환성 유지) - 더 이상 사용되지 않음
// export function saveTokens(tokenResponse: OAuth2TokenResponse): void {
//   // 백엔드가 토큰 교환을 처리하므로 프론트엔드에서는 사용하지 않음
// }

// 백엔드 access_token 가져오기 (API 호출용)
export function getToken(): string | null {
  return localStorage.getItem("authToken");
}

// 백엔드 refresh_token 가져오기
export function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

// 모든 토큰 삭제
export function removeTokens(): void {
  // 백엔드 토큰
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tokenExpiresAt");

  // PKCE, OIDC 및 기타
  localStorage.removeItem("oauth2_state");
  localStorage.removeItem("oauth2_code_verifier");
  localStorage.removeItem("oauth2_nonce");
}

// 백엔드 토큰 만료 여부
export function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem("tokenExpiresAt");
  if (!expiresAt) {
    return false; // 만료 시간이 없으면 만료되지 않은 것으로 간주
  }
  return Date.now() >= parseInt(expiresAt, 10);
}

// OAuth2 React Query 훅

// Authorization Code -> 백엔드 로그인 훅
export function useAdminLogin() {
  return useMutation({
    mutationFn: async (code: string) => {
      const redirectUri =
        import.meta.env.VITE_OAUTH2_REDIRECT_URI ||
        `${window.location.origin}/login`;

      // PKCE: localStorage에서 code_verifier 가져오기
      const codeVerifier = localStorage.getItem("oauth2_code_verifier") || "";

      const response = await adminLogin(code, redirectUri, codeVerifier);

      // 사용 후 code_verifier 삭제
      localStorage.removeItem("oauth2_code_verifier");

      // 백엔드 토큰 저장
      saveBackendTokens(response);
      return response;
    },
  });
}

// 전체 로그인 플로우: authorization code -> 백엔드 (백엔드가 IDP 토큰 교환 처리)
export function useTokenExchange() {
  return useMutation({
    mutationFn: async (code: string) => {
      const redirectUri =
        import.meta.env.VITE_OAUTH2_REDIRECT_URI ||
        `${window.location.origin}/login`;

      // PKCE: localStorage에서 code_verifier 가져오기
      const codeVerifier = localStorage.getItem("oauth2_code_verifier") || "";

      // 백엔드에 code, redirect_uri, code_verifier를 전달
      const backendResponse = await adminLogin(code, redirectUri, codeVerifier);

      // 사용 후 code_verifier 삭제
      localStorage.removeItem("oauth2_code_verifier");

      // 백엔드 토큰 저장
      saveBackendTokens(backendResponse);
      // 로그인 성공 후 홈으로 이동 (history 제거)
      sessionStorage.removeItem("oauth2_processing_code");
      window.location.replace("/");

      return backendResponse;
    },
  });
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: async () => {
      // refreshAccessToken이 이미 토큰 저장을 처리함
      const backendResponse = await refreshAccessToken();
      return backendResponse;
    },
  });
}

export function useOAuth2Logout() {
  return useMutation({
    mutationFn: async () => {
      // 백엔드 로그아웃 (토큰 무효화)
      await revokeToken();

      // OAuth Provider 로그아웃 (선택사항)
      await logoutFromOAuth2();

      // 로컬 토큰 삭제
      removeTokens();
    },
  });
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
