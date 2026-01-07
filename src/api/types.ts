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
