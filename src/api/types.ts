// API 응답 타입 정의

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 기존 이메일/패스워드 로그인 (사용하지 않음)
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

// 백엔드 IDP 로그인 요청/응답
// POST /api/v1/auth/admin/login with { code: "...", redirect_uri: "...", code_verifier: "..." }
// 백엔드가 IDP 토큰 교환을 처리하므로 client_secret은 백엔드에서 관리
export interface AdminLoginRequest {
  code: string;
  redirect_uri: string;
  code_verifier: string;
}

export interface AdminLoginResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    student_id?: string;
  };
}

export interface VerifyTokenResponse {
  uuid: string;
  email: string;
  name: string;
  role?: string;
}

export interface UploadResponseMetadata {
  resource_name?: string;
  status?: string;
  queued_for_processing?: boolean;
  message_id?: string;
  gcs_path?: string;
}

export interface UploadResponse {
  id: string;
  title: string;
  metadata?: UploadResponseMetadata;
  uploadedAt: string;
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

// 위젯 채팅 관련 타입
export interface CreateSessionRequest {
  widgetKey: string;
  pageUrl: string;
}

export interface CreateSessionResponse {
  sessionToken: string;
  expiresIn: number;
}

export interface SendChatRequest {
  question: string;
}

export interface SendChatResponse {
  answer: string;
  sources?: Array<{
    type: "url" | "image";
    url: string;
    title?: string;
  }>;
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
  grant_type: "authorization_code" | "refresh_token";
  code?: string;
  redirect_uri?: string;
  refresh_token?: string;
}

export interface TokenRevocationRequest {
  token: string;
  token_type_hint?: "access_token" | "refresh_token";
}

// 위젯 키 관련 타입
export interface CreateWidgetKeyRequest {
  name: string;
}

export interface AddDomainRequest {
  domain: string;
}

export interface WidgetKeyResponse {
  id: string;
  name: string;
  secretKey: string;
  status: "ACTIVE" | "REVOKED";
  allowedDomains: string[];
  createdAt: string;
}

// 협업자 관련 타입
export interface CollaboratorResponse {
  id: string;
  inviteeEmail: string;
  role: "VIEWER";
  status: "PENDING" | "ACCEPTED";
  createdAt: string;
}

export interface InviteCollaboratorRequest {
  inviteeEmail: string;
}

export interface InviteCollaboratorResponse {
  id: string;
  inviteeEmail: string;
  role: "VIEWER";
  status: "PENDING" | "ACCEPTED";
  createdAt: string;
}

export interface RemoveCollaboratorResponse {
  message: string;
}

// 대시보드 사용량 API 타입
export interface UsageData {
  date: string;
  tokens: number;
  requests: number;
  domain?: string;
}

export interface DomainStat {
  domain: string;
  tokens: number;
  requests: number;
}

export interface WidgetKeyStats {
  widgetKeyId: string;
  widgetKeyName: string;
  widgetKey: string;
  totalTokens: number;
  totalRequests: number;
  usageData: UsageData[];
  domainStats: DomainStat[];
}
