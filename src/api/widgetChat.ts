// 위젯 채팅 관련 API 함수

import axios from "axios";
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  FeedbackRating,
  MessageFeedbackResponse,
  PaginatedWidgetMessagesResponse,
  SendChatRequest,
  SendChatResponse,
  WidgetMessageResponse,
} from "./types";
import {
  consumeWidgetStream,
  parseHistoryMetadata,
  type AgentStep,
  type RawResource,
} from "./widgetStreamEvents";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// 위젯용 axios 인스턴스 (세션 토큰을 헤더에 추가)
const widgetApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// 세션 토큰을 헤더에 자동 추가하는 인터셉터
widgetApiClient.interceptors.request.use(
  (config) => {
    const sessionToken = localStorage.getItem("widgetSessionToken");
    if (sessionToken && config.headers) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

const RESOURCE_CENTER_BASE = import.meta.env.VITE_RESOURCE_CENTER_URL?.replace(
  /\/$/,
  "",
);

export function mapResources(
  rawResources: RawResource[],
): NonNullable<SendChatResponse["sources"]> {
  return rawResources.map((resource) => ({
    type: "url",
    title: resource.path,
    // 서버가 인코딩한 경로를 재인코딩하거나 확장자를 덧붙이지 않는다.
    url: RESOURCE_CENTER_BASE
      ? `${RESOURCE_CENTER_BASE}/resource/${resource.url}`
      : "",
    ...(!RESOURCE_CENTER_BASE ? { resourcePath: resource.url } : {}),
  }));
}

export function mapWidgetHistory(message: WidgetMessageResponse) {
  const metadata = parseHistoryMetadata(message.metadata);
  return {
    id: message.id,
    serverId: message.id,
    role: message.role,
    text: message.content,
    feedback: message.feedback,
    status: "completed" as const,
    steps: metadata.steps,
    sources: mapResources(metadata.resources),
    externalSources: metadata.externalSources,
    webSources: metadata.webSources,
    regeneratedAnswer: !!metadata.regeneratedFromMessageId,
    regeneratedFromMessageId: metadata.regeneratedFromMessageId,
  };
}

export async function openWidgetResource(path: string): Promise<string> {
  const response = await widgetApiClient.get<Blob>(
    `/v1/widget/messages/resources/${path}`,
    { responseType: "blob" },
  );
  return URL.createObjectURL(response.data);
}

export interface WidgetChatStreamOptions {
  signal?: AbortSignal; // 중지 시 사용할 AbortSignal (중지 버튼 등)
  onStep?: (step: AgentStep) => void; // 에이전트 진행 단계 (같은 id로 상태가 갱신되어 다시 옴)
}

/**
 * 위젯 SSE 채팅 스트림 공통 처리
 * @param path API 경로 (API_BASE_URL 기준 상대 경로)
 * @param body 요청 본문 (undefined면 본문 없이 전송)
 * @param onChunk 스트림 청크를 받을 때마다 호출되는 콜백 (텍스트, 완료 여부)
 * @param onComplete 전체 응답이 완료되었을 때 호출되는 콜백 (최종 응답)
 * @param options.signal 중지 시 사용할 AbortSignal (중지 버튼 등)
 * @param options.onStep 진행 단계(step 이벤트)를 받을 때마다 호출되는 콜백
 */
async function streamWidgetChatResponse(
  path: string,
  body: unknown,
  onChunk?: (text: string, isComplete: boolean) => void,
  onComplete?: (response: SendChatResponse) => void,
  options?: WidgetChatStreamOptions,
): Promise<void> {
  const sessionToken = getSessionToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      // 본문 없이 Content-Type: application/json을 보내면 Fastify가 400을 반환함
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: options?.signal,
  });

  let fullText = "";
  let resources: SendChatResponse["sources"] = [];
  let externalSources: SendChatResponse["externalSources"] = [];
  let webSources: SendChatResponse["webSources"] = [];
  await consumeWidgetStream(
    response,
    (event) => {
      switch (event.type) {
        case "done":
          onComplete?.({
            answer: fullText,
            sources: resources,
            externalSources,
            webSources,
          });
          break;
        case "content":
          fullText += event.content;
          onChunk?.(fullText, false);
          break;
        case "step":
          options?.onStep?.(event.step);
          break;
        case "resources":
          resources = mapResources(event.resources);
          break;
        case "sources":
          externalSources = event.sources;
          break;
        case "web_sources":
          webSources = event.sources;
          break;
      }
    },
    options?.signal,
  );
}

/**
 * 채팅 메시지 전송 (스트리밍)
 * POST /api/v1/widget/messages/chat/stream
 */
export async function sendWidgetChatMessage(
  request: SendChatRequest,
  onChunk?: (text: string, isComplete: boolean) => void,
  onComplete?: (response: SendChatResponse) => void,
  options?: WidgetChatStreamOptions,
): Promise<void> {
  return streamWidgetChatResponse(
    "/v1/widget/messages/chat/stream",
    request,
    onChunk,
    onComplete,
    options,
  );
}

/**
 * BAD 피드백 답변 1회 재생성 (스트리밍)
 * POST /api/v1/widget/messages/:messageId/regenerate/stream
 */
export async function regenerateWidgetAnswer(
  messageId: string,
  onChunk?: (text: string, isComplete: boolean) => void,
  onComplete?: (response: SendChatResponse) => void,
  options?: WidgetChatStreamOptions,
): Promise<void> {
  return streamWidgetChatResponse(
    `/v1/widget/messages/${encodeURIComponent(messageId)}/regenerate/stream`,
    undefined,
    onChunk,
    onComplete,
    options,
  );
}

/**
 * assistant 답변 피드백 등록/변경 (문제 해결 여부)
 * PUT /api/v1/widget/messages/:messageId/feedback
 */
export async function submitMessageFeedback(
  messageId: string,
  rating: FeedbackRating,
): Promise<MessageFeedbackResponse> {
  const response = await widgetApiClient.put<MessageFeedbackResponse>(
    `/v1/widget/messages/${encodeURIComponent(messageId)}/feedback`,
    { rating },
  );
  return response.data;
}

/** 세션 전체를 최신순으로 읽는다. 페이지는 nextCursor로만 이어간다. */
export async function fetchWidgetHistory(): Promise<WidgetMessageResponse[]> {
  const messages: WidgetMessageResponse[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  do {
    const { data } = await widgetApiClient.get<PaginatedWidgetMessagesResponse>(
      "/v1/widget/messages",
      { params: { limit: 20, ...(cursor ? { cursor } : {}) } },
    );
    messages.push(...data.messages);
    cursor = data.nextCursor ?? undefined;
    if (cursor && seen.has(cursor)) throw new Error("Repeated history cursor");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return messages;
}

/**
 * 세션 발급
 * POST /api/v1/widget/auth/session
 */
export async function createWidgetSession(
  request: CreateSessionRequest,
  signal?: AbortSignal,
): Promise<CreateSessionResponse> {
  const response = await widgetApiClient.post<CreateSessionResponse>(
    "/v1/widget/auth/session",
    request,
    { signal },
  );
  return response.data;
}

/**
 * 세션 토큰을 로컬 스토리지에 저장
 */
export function saveSessionToken(token: string, expiresIn: number): void {
  localStorage.setItem("widgetSessionToken", token);
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem("widgetSessionTokenExpiresAt", expiresAt.toString());
}

/**
 * 로컬 스토리지에서 세션 토큰 가져오기
 */
export function getSessionToken(): string | null {
  const token = localStorage.getItem("widgetSessionToken");
  const expiresAt = localStorage.getItem("widgetSessionTokenExpiresAt");

  if (!token || !expiresAt) {
    return null;
  }

  // 만료 시간 확인
  if (Date.now() > parseInt(expiresAt, 10)) {
    // 만료된 토큰 삭제
    localStorage.removeItem("widgetSessionToken");
    localStorage.removeItem("widgetSessionTokenExpiresAt");
    return null;
  }

  return token;
}

/**
 * 세션 토큰 삭제
 */
export function clearSessionToken(): void {
  localStorage.removeItem("widgetSessionToken");
  localStorage.removeItem("widgetSessionTokenExpiresAt");
}

/**
 * 세션 만료 시각(ms) 가져오기. 없거나 만료된 경우 null
 */
export function getSessionExpiresAt(): number | null {
  const expiresAt = localStorage.getItem("widgetSessionTokenExpiresAt");
  if (!expiresAt) return null;
  const ts = parseInt(expiresAt, 10);
  return Number.isFinite(ts) ? ts : null;
}

/**
 * 429 Rate Limit 에러 여부
 */
export function isRateLimitError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "status" in error &&
    (error as Error & { status?: number }).status === 429
  );
}
