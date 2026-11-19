// 위젯 채팅 SSE 이벤트 파싱 (chatbot-be 채팅 스트리밍 계약 기준)
// node --test 에서 바로 불러올 수 있도록 외부 import 없이 유지한다.

// "stopped"는 서버가 보내지 않는 클라이언트 전용 상태 (사용자가 조사 중 중지한 경우)
export type AgentStepStatus = "running" | "done" | "failed" | "stopped";

export interface AgentStep {
  id: string; // 같은 id면 같은 단계. 형식에 의존하지 않는다.
  kind: string; // "research" | "search_documents" | "search_notices" | "get_notice" | "search_web" | 이후 추가될 값
  label: string; // 서버가 만든 진행 문구 (주 문구)
  status: AgentStepStatus;
  thought?: string; // 모델이 남긴 짧은 설명 (보조 문구)
  resultCount?: number; // 선택적 결과 수. 0도 유효하다.
}

export interface ExternalSource {
  kind: string; // sources 이벤트는 "notice", web_sources 이벤트는 "web"
  id: string;
  title: string; // 웹 출처는 페이지 제목이 아니라 도메인
  url: string; // 그대로 여는 외부 절대 URL
}

export interface WebSource extends ExternalSource {
  official: boolean; // 서버에 설정된 학교 공식 도메인인지
}

export interface RawResource {
  path: string;
  formats: string[];
  url: string;
}

export type StreamEvent =
  | { type: "done" }
  | { type: "content"; content: string }
  | { type: "step"; step: AgentStep }
  | { type: "resources"; resources: RawResource[] }
  | { type: "sources"; sources: ExternalSource[] }
  | { type: "web_sources"; sources: WebSource[] }
  | { type: "error"; error: string };

const SERVER_STEP_STATUSES = ["running", "done", "failed"];

/** 빈 줄로 끝난 프레임만 소비한다. CRLF가 청크 경계에서 갈라져도 보존한다. */
export function extractSseData(buffer: string): {
  payloads: string[];
  rest: string;
} {
  const payloads: string[] = [];
  const boundary = /\r?\n\r?\n/g;
  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(buffer))) {
    const data = buffer
      .slice(start, match.index)
      .split(/\r?\n/)
      .filter((line) => line === "data" || line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, ""));
    if (data.length) payloads.push(data.join("\n"));
    start = boundary.lastIndex;
  }
  return { payloads, rest: buffer.slice(start) };
}

export class WidgetStreamError extends Error {
  kind: "http" | "protocol" | "server" | "interrupted";
  status?: number;
  limit?: number;

  constructor(
    kind: WidgetStreamError["kind"],
    message: string,
    status?: number,
    limit?: number,
  ) {
    super(message);
    this.name = "WidgetStreamError";
    this.kind = kind;
    this.status = status;
    this.limit = limit;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStep(raw: Record<string, unknown>): AgentStep | null {
  const { id, kind, label, status, thought, resultCount } = raw;
  if (typeof id !== "string" || !id) return null;
  if (typeof label !== "string") return null;
  if (typeof status !== "string" || !SERVER_STEP_STATUSES.includes(status)) {
    return null;
  }
  return {
    id,
    kind: typeof kind === "string" ? kind : "",
    label,
    status: status as AgentStepStatus,
    ...(typeof thought === "string" && thought.trim() ? { thought } : {}),
    ...(typeof resultCount === "number" ? { resultCount } : {}),
  };
}

function parseExternalSource(item: unknown): ExternalSource | null {
  if (!isRecord(item)) return null;
  const { kind, id, title, url } = item;
  // 외부 링크는 href에 그대로 들어가므로 http(s)만 허용
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  return {
    kind: typeof kind === "string" ? kind : "",
    id: typeof id === "string" ? id : String(id ?? url),
    title: typeof title === "string" && title.trim() ? title : url,
    url,
  };
}

function parseExternalSources(raw: unknown): ExternalSource[] {
  if (!Array.isArray(raw)) return [];
  return uniqueSources(raw.flatMap((item) => parseExternalSource(item) ?? []));
}

function parseWebSources(raw: unknown): WebSource[] {
  if (!Array.isArray(raw)) return [];
  return uniqueSources(
    raw.flatMap((item): WebSource[] => {
      const source = parseExternalSource(item);
      if (!source) return [];
      // official이 없거나 잘못 오면 비공식으로 취급 (공식으로 잘못 표시하지 않도록)
      return [
        { ...source, official: isRecord(item) && item.official === true },
      ];
    }),
  );
}

function uniqueSources<T extends ExternalSource>(sources: T[]): T[] {
  return [...new Map(sources.map((source) => [source.url, source])).values()];
}

/**
 * `data:` 값 하나를 이벤트로 해석한다. 모르는 이벤트는 무시하되 깨진 JSON은 프로토콜 오류로 처리한다.
 */
export function parseStreamEvent(data: string): StreamEvent | null {
  // [DONE]은 JSON이 아니므로 파싱 전에 비교
  if (data === "[DONE]") return { type: "done" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    throw new WidgetStreamError("protocol", "Invalid SSE JSON");
  }
  if (!isRecord(parsed)) return null;

  if (
    parsed.type !== undefined &&
    !["step", "resources", "sources", "web_sources"].includes(
      String(parsed.type),
    )
  )
    return null;

  if (typeof parsed.error === "string") {
    return { type: "error", error: String(parsed.error) };
  }
  if (typeof parsed.content === "string") {
    return { type: "content", content: parsed.content };
  }
  if (parsed.type === "step") {
    const step = parseStep(parsed);
    return step ? { type: "step", step } : null;
  }
  if (parsed.type === "resources") {
    return {
      type: "resources",
      resources: parseResources(parsed.resources),
    };
  }
  if (parsed.type === "sources") {
    return { type: "sources", sources: parseExternalSources(parsed.sources) };
  }
  if (parsed.type === "web_sources") {
    return { type: "web_sources", sources: parseWebSources(parsed.sources) };
  }
  return null;
}

/**
 * 같은 id의 단계는 덮어쓰고, 새 단계는 처음 본 순서대로 뒤에 붙인다.
 */
export function upsertStep(steps: AgentStep[], step: AgentStep): AgentStep[] {
  const index = steps.findIndex((s) => s.id === step.id);
  if (index === -1) return [...steps, step];
  const next = steps.slice();
  next[index] = step;
  return next;
}

/**
 * 아직 running인 단계를 주어진 상태로 닫는다 (오류·중지 시 스피너가 남지 않도록).
 */
export function settleRunningSteps(
  steps: AgentStep[],
  status: Exclude<AgentStepStatus, "running">,
): AgentStep[] {
  if (!steps.some((s) => s.status === "running")) return steps;
  return steps.map((s) => (s.status === "running" ? { ...s, status } : s));
}

export function parseResources(raw: unknown): RawResource[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) =>
    isRecord(item) &&
    typeof item.path === "string" &&
    typeof item.url === "string" &&
    item.url.length > 0 &&
    Array.isArray(item.formats)
      ? [
          {
            path: item.path,
            url: item.url,
            formats: item.formats.filter(
              (f): f is string => typeof f === "string",
            ),
          },
        ]
      : [],
  );
}

export function parseHistoryMetadata(metadata: unknown) {
  const raw = isRecord(metadata) ? metadata : {};
  return {
    steps: Array.isArray(raw.steps)
      ? raw.steps.flatMap((step) =>
          isRecord(step) ? (parseStep(step) ?? []) : [],
        )
      : [],
    resources: parseResources(raw.resources),
    externalSources: parseExternalSources(raw.sources),
    webSources: parseWebSources(raw.webSources),
    regeneratedFromMessageId:
      typeof raw.regeneratedFromMessageId === "string"
        ? raw.regeneratedFromMessageId
        : undefined,
  };
}

/** HTTP 검증부터 종료까지 하나의 소비자만 소유한다. DONE 이외에는 성공하지 않는다. */
export async function consumeWidgetStream(
  response: Response,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  signal?.throwIfAborted();
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      /* HTML 프록시 오류도 HTTP 상태로 처리 */
    }
    throw new WidgetStreamError(
      "http",
      `HTTP ${response.status}`,
      response.status,
      isRecord(body) && typeof body.limit === "number" ? body.limit : undefined,
    );
  }
  if (
    response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "text/event-stream"
  ) {
    await response.body?.cancel();
    throw new WidgetStreamError("protocol", "Expected text/event-stream");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new WidgetStreamError("protocol", "Missing response body");
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", cancel, { once: true });
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      signal?.throwIfAborted();
      const { done, value } = await reader.read();
      signal?.throwIfAborted();
      if (done)
        throw new WidgetStreamError("interrupted", "Stream ended before DONE");
      buffer += decoder.decode(value, { stream: true });
      const { payloads, rest } = extractSseData(buffer);
      buffer = rest;
      for (const data of payloads) {
        signal?.throwIfAborted();
        const event = parseStreamEvent(data);
        if (!event) continue;
        if (event.type === "error")
          throw new WidgetStreamError("server", event.error);
        onEvent(event);
        if (event.type === "done") return;
      }
    }
  } finally {
    signal?.removeEventListener("abort", cancel);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
