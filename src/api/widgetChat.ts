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
  },
);

/**
 * 채팅 메시지 전송 (스트리밍)
 * POST /api/v1/widget/messages/chat/stream
 * @param request 요청 데이터
 * @param onChunk 스트림 청크를 받을 때마다 호출되는 콜백 (텍스트, 완료 여부)
 * @param onComplete 전체 응답이 완료되었을 때 호출되는 콜백 (최종 응답)
 */
export async function sendWidgetChatMessage(
  request: SendChatRequest,
  onChunk?: (text: string, isComplete: boolean) => void,
  onComplete?: (response: SendChatResponse) => void,
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
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      const err = new Error(
        `HTTP error! status: ${response.status}, error: ${errorText}`,
      ) as Error & { status: number };
      err.status = 429;
      throw err;
    }
    throw new Error(
      `HTTP error! status: ${response.status}, error: ${errorText}`,
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
            // 스트리밍 완료
            if (onComplete) {
              onComplete({
                answer: fullText,
                sources: resources,
              });
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
              const RESOURCE_CENTER_BASE =
                "https://resource-center-573707418062.us-central1.run.app/resource";

              resources = (parsed.resources || []).map(
                (resource: { type: string; url: string; title?: string }) => {
                  const url = resource.url || "";

                  // URL에서 path만 추출
                  let path = url;

                  // 절대 URL인 경우 path만 추출
                  try {
                    const urlObj = new URL(url);
                    path = urlObj.pathname;
                  } catch {
                    // URL 파싱 실패 시 원본 사용 (상대 경로일 가능성)
                    path = url;
                  }

                  // path에서 앞의 / 제거 (있으면)
                  let cleanPath = path.startsWith("/") ? path.slice(1) : path;

                  // 확장자 체크
                  const lowerPath = cleanPath.toLowerCase();
                  const hasPdfExtension = lowerPath.endsWith(".pdf");
                  const hasPngExtension = lowerPath.endsWith(".png");
                  const hasJpgExtension =
                    lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg");
                  const hasExtension =
                    hasPdfExtension || hasPngExtension || hasJpgExtension;

                  // 확장자가 없으면 서버에서 온 type을 기반으로 추가
                  if (!hasExtension) {
                    if (resource.type === "image" || resource.type === "png") {
                      cleanPath = `${cleanPath}.png`;
                    } else if (resource.type === "pdf") {
                      cleanPath = `${cleanPath}.pdf`;
                    } else {
                      // 기본값: PDF로 처리 (문서일 가능성이 높음)
                      cleanPath = `${cleanPath}.pdf`;
                    }
                  }

                  const finalUrl = `${RESOURCE_CENTER_BASE}/${cleanPath}`;

                  // PNG, JPG 등 이미지 확장자면 image 타입으로 설정
                  const finalLowerPath = cleanPath.toLowerCase();
                  const isImage =
                    finalLowerPath.endsWith(".png") ||
                    finalLowerPath.endsWith(".jpg") ||
                    finalLowerPath.endsWith(".jpeg") ||
                    resource.type === "image";

                  // 파일명에서 제목 추출 (확장자 제거, URL 디코딩, 8글자 제한)
                  let title = resource.title;
                  if (!title) {
                    // URL에서 파일명 추출
                    const pathParts = cleanPath.split("/");
                    let fileName =
                      pathParts[pathParts.length - 1] || "참고자료";

                    // URL 디코딩
                    try {
                      fileName = decodeURIComponent(fileName);
                    } catch {
                      console.log("[widgetChat] URL 디코딩 실패:", fileName);
                    }

                    // 확장자 제거
                    fileName = fileName.replace(/\.(pdf|png|jpg|jpeg)$/i, "");

                    // 8글자로 제한하고 ... 추가
                    if (fileName.length > 20) {
                      title = fileName.slice(0, 20) + "...";
                    } else {
                      title = fileName;
                    }
                  }

                  return {
                    type: isImage ? ("image" as const) : ("url" as const),
                    url: finalUrl,
                    title: title,
                  };
                },
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
    if (onComplete) {
      onComplete({
        answer: fullText,
        sources: resources,
      });
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
  request: CreateSessionRequest,
): Promise<CreateSessionResponse> {
  const response = await widgetApiClient.post<CreateSessionResponse>(
    "/v1/widget/auth/session",
    request,
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
