// API 응답 타입 정의

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface ChatRequest {
  widgetKey: string;
  messages: ChatMessage[];
  newMessage: string;
  pageUrl?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId?: string;
}

// OAuth2/OIDC 타입 정의
export interface OAuth2TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
}

export interface OAuth2CallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export interface TokenExchangeRequest {
  code: string;
  code_verifier?: string;
  redirect_uri?: string;
}
