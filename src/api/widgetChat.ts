// 위젯 채팅 관련 API 함수

import axios from "axios";
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  SendChatRequest,
  SendChatResponse,
} from "./types";

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
  }
);

/**
 * 채팅 메시지 전송 (스트리밍)
 * POST /api/v1/widget/messages/chat/stream
 * @param request 요청 데이터
 * @param onChunk 스트림 청크를 받을 때마다 호출되는 콜백 (텍스트, 완료 여부)
 * @param onComplete 전체 응답이 완료되었을 때 호출되는 콜백 (최종 응답)
 * @param options.signal 중지 시 사용할 AbortSignal (중지 버튼 등)
 */
export async function sendWidgetChatMessage(
  request: SendChatRequest,
  onChunk?: (text: string, isComplete: boolean) => void,
  onComplete?: (response: SendChatResponse) => void,
  options?: { signal?: AbortSignal }
): Promise<void> {
  const sessionToken = getSessionToken();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

  const response = await fetch(
    `${API_BASE_URL}/v1/widget/messages/chat/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify(request),
      signal: options?.signal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      const err = new Error(
        `HTTP error! status: ${response.status}, error: ${errorText}`
      ) as Error & { status: number };
      err.status = 429;
      throw err;
    }
    throw new Error(
      `HTTP error! status: ${response.status}, error: ${errorText}`
    );
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let resources: SendChatResponse["sources"] = [];

  if (!reader) {
    throw new Error("Response body is not readable");
  }

  // 중지 시 스트림 읽기 취소 (응답 수신 중일 때 즉시 반응)
  if (options?.signal) {
    options.signal.addEventListener(
      "abort",
      () => {
        reader.cancel().catch(() => {});
      },
      { once: true }
    );
  }

  try {
    // 타임아웃 설정 (5분)
    const timeout = 5 * 60 * 1000;
    const startTime = Date.now();

    // EventSource 스타일로 SSE 스트림 읽기
    while (true) {
      // 타임아웃 체크
      if (Date.now() - startTime > timeout) {
        throw new Error("Stream timeout: 응답 시간이 초과되었습니다.");
      }

      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // 마지막 불완전한 라인은 버퍼에 보관

      for (const line of lines) {
        if (line.trim() === "") continue; // 빈 줄 무시

        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim(); // "data: " 제거 및 공백 제거

          // 종료 신호 처리
          if (data === "[DONE]") {
            const finalResponse = { answer: fullText, sources: resources };
            if (onComplete) {
              onComplete(finalResponse);
            }
            return;
          }

          try {
            const parsed = JSON.parse(data);

            // 에러 처리
            if (parsed.error) {
              throw new Error(parsed.error);
            }

            // 일반 콘텐츠 처리
            if (parsed.content) {
              fullText += parsed.content;
              if (onChunk) {
                onChunk(fullText, false);
              }
            }

            // 리소스 정보 처리
            if (parsed.type === "resources") {
              const rawResources = parsed.resources || [];
              const RESOURCE_CENTER_BASE = `${
                import.meta.env.VITE_RESOURCE_CENTER_URL
              }/resource`;

              resources = rawResources.map(
                (resource: {
                  formats: string[];
                  path: string;
                  url: string;
                }) => {
                  const url = resource.url || "";

                  let path = url;
                  try {
                    const urlObj = new URL(url);
                    path = urlObj.pathname;
                  } catch {
                    path = url;
                  }

                  let cleanPath = path.startsWith("/") ? path.slice(1) : path;

                  // formats 기반 확장자: ['pdf'] | ['png'] 만 존재
                  const formats = (resource.formats || []).map((f) =>
                    String(f).toLowerCase()
                  );
                  const hasExt =
                    cleanPath.toLowerCase().endsWith(".pdf") ||
                    cleanPath.toLowerCase().endsWith(".png");

                  if (!hasExt) {
                    if (formats.includes("png")) {
                      cleanPath = `${cleanPath}.png`;
                    } else if (formats.includes("pdf")) {
                      cleanPath = `${cleanPath}.pdf`;
                    } else {
                      cleanPath = `${cleanPath}.pdf`;
                    }
                  }

                  const finalUrl = `${RESOURCE_CENTER_BASE}/${cleanPath}`;
                  const isImage = cleanPath.toLowerCase().endsWith(".png");

                  let title = resource.path;
                  if (!title) {
                    const pathParts = cleanPath.split("/");
                    let fileName =
                      pathParts[pathParts.length - 1] || "참고자료";
                    try {
                      fileName = decodeURIComponent(fileName);
                    } catch {
                      void 0;
                    }
                    fileName = fileName.replace(/\.(pdf|png|jpg|jpeg)$/i, "");
                    title =
                      fileName.length > 20
                        ? fileName.slice(0, 20) + "..."
                        : fileName;
                  }

                  return {
                    type: isImage ? ("image" as const) : ("url" as const),
                    url: finalUrl,
                    title: title,
                  };
                }
              );
            }
          } catch (e) {
            // JSON 파싱 실패 시 무시 (불완전한 데이터일 수 있음)
            // 단, 에러 객체인 경우는 위에서 처리됨
            if (e instanceof Error) {
              // 스트림 에러인 경우 다시 throw
              if (e.message && e.message.includes("Stream error")) {
                throw e;
              }
              // JSON 파싱 에러인 경우 무시 (불완전한 데이터일 수 있음)
            } else {
              throw e;
            }
          }
        }
      }
    }

    // 스트리밍이 정상적으로 종료되지 않은 경우
    const finalResponse = { answer: fullText, sources: resources };
    if (onComplete) {
      onComplete(finalResponse);
    }
  } catch (error) {
    // 에러 발생 시 리더 정리
    try {
      reader.cancel();
    } catch {
      // 리더 정리 실패는 무시
    }
    throw error;
  } finally {
    // 리더 정리
    try {
      reader.releaseLock();
    } catch {
      // 리더 해제 실패는 무시
    }
  }
}

/**
 * 세션 발급
 * POST /api/v1/widget/auth/session
 */
export async function createWidgetSession(
  request: CreateSessionRequest
): Promise<CreateSessionResponse> {
  const response = await widgetApiClient.post<CreateSessionResponse>(
    "/v1/widget/auth/session",
    request
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
