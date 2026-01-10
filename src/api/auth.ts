// 인증 관련 API 함수 (React Query 훅 포함)

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  VerifyTokenResponse,
  ApiResponse,
  OAuth2TokenResponse,
  OAuth2CallbackParams,
  TokenExchangeRequest,
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

// OAuth2 React Query 훅
export function useTokenExchange() {
  return useMutation({
    mutationFn: async (code: string) => {
      const codeVerifier = localStorage.getItem("oauth2_code_verifier");
      const tokenResponse = await exchangeCodeForToken(
        code,
        codeVerifier || undefined
      );
      // code_verifier는 한 번만 사용되므로 삭제
      localStorage.removeItem("oauth2_code_verifier");
      saveTokens(tokenResponse);
      return tokenResponse;
    },
  });
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: async () => {
      const tokenResponse = await refreshAccessToken();
      saveTokens(tokenResponse);
      return tokenResponse;
    },
  });
}

export function useOAuth2Logout() {
  return useMutation({
    mutationFn: async () => {
      await logoutFromOAuth2();
      removeTokens();
    },
  });
}

// 토큰 관리 유틸리티 함수 (기존 호환성 유지)
export function saveToken(token: string): void {
  localStorage.setItem("authToken", token);
}

export function removeToken(): void {
  localStorage.removeItem("authToken");
}

export function getToken(): string | null {
  return localStorage.getItem("authToken");
}

// OAuth2/OIDC 유틸리티 함수

// PKCE를 위한 랜덤 문자열 생성
function generateRandomString(length: number = 43): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~".charAt(
      byte % 66
    )
  ).join("");
}

// Base64URL 인코딩
async function base64UrlEncode(buffer: ArrayBuffer): Promise<string> {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// PKCE code_verifier 및 code_challenge 생성
async function generatePKCE(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const codeVerifier = generateRandomString(128);
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const codeChallenge = await base64UrlEncode(digest);
  return { codeVerifier, codeChallenge };
}

// State 파라미터 생성 (CSRF 방지)
function generateState(): string {
  return generateRandomString(32);
}

// Nonce 파라미터 생성 (OIDC - ID Token 재생 공격 방지)
function generateNonce(): string {
  return generateRandomString(32);
}

// OAuth2 Authorization URL 생성
export async function generateAuthorizationUrl(): Promise<string> {
  // authorize 엔드포인트 URL (예: https://idp.gistory.me/authorize)
  const authorizationUrl =
    import.meta.env.VITE_OAUTH2_AUTHORIZATION_URL ||
    "https://auth.example.com/authorize";

  const clientId = import.meta.env.VITE_OAUTH2_CLIENT_ID || "";
  const redirectUri =
    import.meta.env.VITE_OAUTH2_REDIRECT_URI ||
    `${window.location.origin}/login`;
  const scope = import.meta.env.VITE_OAUTH2_SCOPE || "openid profile email";

  const { codeVerifier, codeChallenge } = await generatePKCE();
  const state = generateState();
  const nonce = generateNonce();

  // localStorage에 저장 (callback에서 검증용)
  localStorage.setItem("oauth2_code_verifier", codeVerifier);
  localStorage.setItem("oauth2_state", state);
  localStorage.setItem("oauth2_nonce", nonce);

  // authorize 엔드포인트에 전달할 파라미터 생성
  // 참고 URL 구조: https://idp.gistory.me/authorize?response_type=code&client_id=...&scope=...&state=...&redirect_uri=...&prompt=consent
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scope,
    state: state,
    redirect_uri: redirectUri,
    prompt: "consent",
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

  // 저장된 state와 비교
  const savedState = localStorage.getItem("oauth2_state");
  if (state && savedState && state !== savedState) {
    throw new Error("State mismatch: CSRF 공격 가능성");
  }

  // 검증 후 state 및 nonce 삭제
  localStorage.removeItem("oauth2_state");
  localStorage.removeItem("oauth2_nonce");

  return {
    code: code || undefined,
    state: state || undefined,
    error: error || undefined,
    error_description: errorDescription || undefined,
  };
}

// Authorization Code를 토큰으로 교환
export async function exchangeCodeForToken(
  code: string,
  codeVerifier?: string
): Promise<OAuth2TokenResponse> {
  const redirectUri =
    import.meta.env.VITE_OAUTH2_REDIRECT_URI ||
    `${window.location.origin}/auth/callback`;

  const requestBody: TokenExchangeRequest = {
    code,
    redirect_uri: redirectUri,
  };

  if (codeVerifier) {
    requestBody.code_verifier = codeVerifier;
  }

  const response = await apiClient.post<OAuth2TokenResponse>(
    "/api/v1/auth/admin/login",
    requestBody
  );

  return response.data;
}

// Refresh Token으로 Access Token 갱신
export async function refreshAccessToken(): Promise<OAuth2TokenResponse> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Refresh token이 없습니다.");
  }

  const response = await apiClient.post<OAuth2TokenResponse>(
    "/auth/oauth2/refresh",
    {
      refresh_token: refreshToken,
    }
  );

  return response.data;
}

// OAuth Provider 로그아웃
export async function logoutFromOAuth2(): Promise<void> {
  const logoutUrl = import.meta.env.VITE_OAUTH2_LOGOUT_URL;
  if (logoutUrl) {
    // OAuth Provider 로그아웃 페이지로 리다이렉트 (선택사항)
    const clientId = import.meta.env.VITE_OAUTH2_CLIENT_ID || "";
    const postLogoutRedirectUri = window.location.origin;
    const logoutParams = new URLSearchParams({
      client_id: clientId,
      post_logout_redirect_uri: postLogoutRedirectUri,
    });
    window.location.href = `${logoutUrl}?${logoutParams.toString()}`;
  }
}

// OAuth2 토큰 관리 함수
export function saveTokens(tokenResponse: OAuth2TokenResponse): void {
  localStorage.setItem("authToken", tokenResponse.access_token);

  if (tokenResponse.refresh_token) {
    localStorage.setItem("refreshToken", tokenResponse.refresh_token);
  }

  if (tokenResponse.expires_in) {
    const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
    localStorage.setItem("tokenExpiresAt", expiresAt.toString());
  }
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

export function removeTokens(): void {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tokenExpiresAt");
  localStorage.removeItem("oauth2_code_verifier");
  localStorage.removeItem("oauth2_state");
  localStorage.removeItem("oauth2_nonce");
}

export function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem("tokenExpiresAt");
  if (!expiresAt) {
    return false; // 만료 시간이 없으면 만료되지 않은 것으로 간주
  }
  return Date.now() >= parseInt(expiresAt, 10);
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
