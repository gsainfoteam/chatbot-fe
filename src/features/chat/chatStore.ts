// 홈(채팅 앱) 상태 저장소.
// - 대화 기록(threads)은 localStorage에 저장합니다. 백엔드에는 대화 목록 API가 없고
//   메시지가 위젯 세션 단위로만 저장되기 때문입니다.
// - 답변 스트리밍·피드백·재생성은 컴포넌트 밖(이 모듈)에서 처리해서
//   홈 → 스레드 화면으로 이동하는 중에도 스트림이 끊기지 않습니다.
//
// TODO(BE 연결): 프로토타입이라 아래는 비워 두었습니다. 백엔드 API가 생기면 여기서 연결합니다.
// - 대화 목록/메시지 조회·저장 API → localStorage 저장(loadThreads/persistNow)을 서버 조회로 교체
// - 여러 탭/기기 간 동기화 (지금은 탭마다 localStorage 사본을 따로 가짐)
// - 저장 용량 초과 처리 (지금은 저장 실패를 로그만 남김)
// - 429(세션당 질문 횟수 초과) 안내와 입력 잠금 (streamAnswer의 TODO 참고)
// - 후속 질문 제안(ThreadMessage.followUps) 수신

import { useSyncExternalStore } from "react";
import {
  createWidgetSession,
  fetchLatestAssistantMessage,
  getSessionToken,
  regenerateWidgetAnswer,
  saveSessionToken,
  sendWidgetChatMessage,
  submitMessageFeedback,
} from "@/api/widgetChat";
import type { SendChatResponse } from "@/api/types";
import { getWidgetKey } from "./widgetKey";
import type {
  ChatFeedback,
  ChatThread,
  StreamingState,
  ThreadMessage,
} from "./types";

const STORAGE_KEY = "gist-chatbot:threads";
const STORAGE_VERSION = 1;
const MAX_THREADS = 100;
const TITLE_MAX_LENGTH = 40;

export const STATUS_SEARCHING = "자료를 찾아보는 중";
export const STATUS_READING = "파일을 읽어보는 중";
export const STATUS_THINKING = "조금 더 생각 중";
export const STATUS_REGENERATING = "답변을 다시 생성하는 중";

export const ERROR_NO_WIDGET_KEY =
  "챗봇 설정(위젯 키)을 찾을 수 없어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.";
export const ERROR_ANSWER_FAILED =
  "죄송해요. 답변을 받는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
export const STOPPED_SUFFIX = "\n\n_(응답이 중지되었어요)_";
export const STOPPED_TEXT = "응답이 중지되었어요.";

export interface ChatState {
  threads: ChatThread[];
  /** threadId → 진행 중인 답변 생성 상태 */
  streaming: Record<string, StreamingState>;
  /** 피드백 요청 중인 messageId 집합 (중복 클릭 방지) */
  feedbackBusy: Record<string, true>;
  /** "출처 공지 함께 보기" 토글 */
  showSources: boolean;
}

// ---------------------------------------------------------------------------
// 저장/복원
// ---------------------------------------------------------------------------

function isThread(value: unknown): value is ChatThread {
  if (!value || typeof value !== "object") return false;
  const t = value as Partial<ChatThread>;
  return (
    typeof t.id === "string" &&
    typeof t.title === "string" &&
    typeof t.createdAt === "number" &&
    typeof t.updatedAt === "number" &&
    Array.isArray(t.messages)
  );
}

function isMessage(value: unknown): value is ThreadMessage {
  if (!value || typeof value !== "object") return false;
  const m = value as Partial<ThreadMessage>;
  return (
    typeof m.id === "string" &&
    (m.role === "user" || m.role === "assistant") &&
    typeof m.text === "string" &&
    typeof m.createdAt === "number"
  );
}

/** 저장된 대화 목록 복원. 깨진 대화/메시지는 그 항목만 버리고 나머지는 살린다. */
function loadThreads(): ChatThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { version?: number; threads?: unknown };
    if (!Array.isArray(parsed.threads)) return [];
    return parsed.threads.filter(isThread).map((thread) => ({
      ...thread,
      // 형식이 깨진 메시지와, 새로고침 전에 생성 중이던 빈 답변은 남기지 않는다
      messages: thread.messages.filter(
        (m) => isMessage(m) && (m.role === "user" || m.text.trim().length > 0),
      ),
    }));
  } catch {
    return [];
  }
}

let persistTimer: number | null = null;

function persistNow(): void {
  if (persistTimer !== null) {
    window.clearTimeout(persistTimer);
    persistTimer = null;
  }
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, threads: state.threads }),
    );
  } catch (error) {
    // TODO(BE 연결): 저장 용량 초과(QuotaExceededError) 처리. 서버 저장으로 바뀌면 불필요
    console.error("Failed to persist chat threads:", error);
  }
}

// 스트리밍 중에는 청크마다 저장하지 않도록 잠깐 모아서 저장
function schedulePersist(): void {
  if (persistTimer !== null) return;
  persistTimer = window.setTimeout(() => {
    persistTimer = null;
    persistNow();
  }, 250);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", persistNow);
  // TODO(BE 연결): 다른 탭/기기에서 바뀐 대화 목록 동기화 (storage 이벤트 또는 서버 재조회)
}

// ---------------------------------------------------------------------------
// 상태
// ---------------------------------------------------------------------------

let state: ChatState = {
  threads: loadThreads(),
  streaming: {},
  feedbackBusy: {},
  showSources: true,
};

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<ChatState>): void {
  state = { ...state, ...patch };
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ChatState {
  return state;
}

export function useChatStore(): ChatState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useThread(threadId: string | undefined): ChatThread | undefined {
  return useSyncExternalStore(
    subscribe,
    () => (threadId ? state.threads.find((t) => t.id === threadId) : undefined),
    () => undefined,
  );
}

export function useStreaming(threadId: string | undefined): StreamingState | undefined {
  return useSyncExternalStore(
    subscribe,
    () => (threadId ? state.streaming[threadId] : undefined),
    () => undefined,
  );
}

export function getChatState(): ChatState {
  return state;
}

/**
 * 어느 대화든 답변을 생성 중인지. 위젯 세션이 하나뿐이라 동시에 한 질문만 보낼 수 있다
 * (동시에 보내면 서버 대화 맥락이 섞이고 메시지 ID가 다른 대화에 붙을 수 있다).
 */
export function hasActiveStream(
  streaming: ChatState["streaming"] = state.streaming,
): boolean {
  return Object.keys(streaming).length > 0;
}

// ---------------------------------------------------------------------------
// 내부 헬퍼
// ---------------------------------------------------------------------------

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function makeThreadTitle(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > TITLE_MAX_LENGTH
    ? `${compact.slice(0, TITLE_MAX_LENGTH)}…`
    : compact;
}

function updateThreads(updater: (threads: ChatThread[]) => ChatThread[]): void {
  setState({ threads: updater(state.threads) });
  schedulePersist();
}

function updateThread(
  threadId: string,
  updater: (thread: ChatThread) => ChatThread,
): void {
  updateThreads((threads) =>
    threads.map((thread) => (thread.id === threadId ? updater(thread) : thread)),
  );
}

function updateMessage(
  threadId: string,
  messageId: string,
  updater: (message: ThreadMessage) => ThreadMessage,
): void {
  updateThread(threadId, (thread) => ({
    ...thread,
    messages: thread.messages.map((message) =>
      message.id === messageId ? updater(message) : message,
    ),
  }));
}

function appendMessage(threadId: string, message: ThreadMessage): void {
  updateThread(threadId, (thread) => ({
    ...thread,
    updatedAt: message.createdAt,
    messages: [...thread.messages, message],
  }));
}

function getMessage(threadId: string, messageId: string): ThreadMessage | undefined {
  return state.threads
    .find((thread) => thread.id === threadId)
    ?.messages.find((message) => message.id === messageId);
}

const abortControllers = new Map<string, AbortController>();
const statusTimers = new Map<string, number[]>();

function setStreaming(threadId: string, value: StreamingState | null): void {
  const next = { ...state.streaming };
  if (value) next[threadId] = value;
  else delete next[threadId];
  setState({ streaming: next });
}

function startStreaming(
  threadId: string,
  messageId: string,
  regenerating: boolean,
): AbortController {
  const controller = new AbortController();
  abortControllers.set(threadId, controller);
  setStreaming(threadId, {
    messageId,
    statusText: regenerating ? STATUS_REGENERATING : STATUS_SEARCHING,
    regenerating,
  });

  // 로딩 시간에 따라 안내 문구 변경 (위젯과 동일한 타이밍)
  const timers = [
    window.setTimeout(() => patchStatus(threadId, STATUS_READING), 3000),
    window.setTimeout(() => patchStatus(threadId, STATUS_THINKING), 6000),
  ];
  statusTimers.set(threadId, timers);
  return controller;
}

function patchStatus(threadId: string, statusText: string): void {
  const current = state.streaming[threadId];
  if (!current) return;
  setStreaming(threadId, { ...current, statusText });
}

function finishStreaming(threadId: string): void {
  abortControllers.delete(threadId);
  statusTimers.get(threadId)?.forEach((id) => window.clearTimeout(id));
  statusTimers.delete(threadId);
  setStreaming(threadId, null);
}

function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function setFeedbackBusy(messageId: string, busy: boolean): void {
  const next = { ...state.feedbackBusy };
  if (busy) next[messageId] = true;
  else delete next[messageId];
  setState({ feedbackBusy: next });
}

/** 스트림 완료 후 서버에 저장된 assistant 메시지 ID를 로컬 메시지에 연결 (피드백/재생성용) */
async function attachServerId(threadId: string, messageId: string): Promise<void> {
  try {
    const latest = await fetchLatestAssistantMessage();
    if (!latest) return;
    updateMessage(threadId, messageId, (message) => ({
      ...message,
      serverId: latest.id,
      feedback: latest.feedback,
    }));
  } catch (error) {
    // 실패하면 해당 답변의 피드백 버튼만 표시되지 않음 (대화에는 영향 없음)
    console.error("Failed to attach server message id:", error);
  }
}

async function ensureSession(widgetKey: string): Promise<void> {
  if (getSessionToken()) return;
  const session = await createWidgetSession({
    widgetKey,
    pageUrl: window.location.href,
  });
  saveSessionToken(session.sessionToken, session.expiresIn);
}

function applyFinalResponse(
  threadId: string,
  messageId: string,
  response: SendChatResponse,
): void {
  updateMessage(threadId, messageId, (message) => ({
    ...message,
    text: response.answer,
    sources: response.sources ?? [],
  }));
  updateThread(threadId, (thread) => ({ ...thread, updatedAt: Date.now() }));
}

// ---------------------------------------------------------------------------
// 공개 액션
// ---------------------------------------------------------------------------

/**
 * 질문 전송. threadId가 없으면 새 대화를 만들고 그 ID를 돌려줍니다.
 * 스트리밍은 백그라운드로 이어지므로 호출 측은 바로 /c/:id 로 이동해도 됩니다.
 * 전송할 수 없는 상태(빈 문자열, 어느 대화든 답변 생성 중)면 null.
 */
export function sendMessage(threadId: string | null, rawText: string): string | null {
  const text = rawText.trim();
  if (!text) return null;
  if (hasActiveStream()) return null;

  const now = Date.now();
  let id = threadId;
  if (!id) {
    id = uid();
    const thread: ChatThread = {
      id,
      title: makeThreadTitle(text),
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    updateThreads((threads) => [thread, ...threads].slice(0, MAX_THREADS));
  }

  appendMessage(id, { id: uid(), role: "user", text, createdAt: now });

  const widgetKey = getWidgetKey();
  if (!widgetKey) {
    appendMessage(id, {
      id: uid(),
      role: "assistant",
      text: ERROR_NO_WIDGET_KEY,
      createdAt: Date.now(),
      error: true,
    });
    return id;
  }

  const assistantId = uid();
  appendMessage(id, {
    id: assistantId,
    role: "assistant",
    text: "",
    sources: [],
    createdAt: Date.now(),
  });

  void streamAnswer(id, assistantId, widgetKey, text);
  return id;
}

async function streamAnswer(
  threadId: string,
  assistantId: string,
  widgetKey: string,
  question: string,
): Promise<void> {
  const controller = startStreaming(threadId, assistantId, false);

  try {
    await ensureSession(widgetKey);

    await sendWidgetChatMessage(
      { question },
      (streamedText) => {
        updateMessage(threadId, assistantId, (message) => ({
          ...message,
          text: streamedText,
        }));
      },
      (finalResponse) => {
        applyFinalResponse(threadId, assistantId, finalResponse);
        finishStreaming(threadId);
        void attachServerId(threadId, assistantId);
      },
      { signal: controller.signal },
    );
  } catch (error) {
    finishStreaming(threadId);
    if (isAbortError(error)) return; // 사용자가 중지: stopStreaming에서 처리됨

    console.error("Failed to send chat message:", error);
    // TODO(BE 연결): 429(세션당 질문 횟수 초과)면 빈 답변을 지우고 세션 만료 시각까지
    // 입력창을 잠근 뒤 남은 시간을 안내한다 (isRateLimitError / getSessionExpiresAt 참고).
    // 지금은 일반 오류 안내로 처리한다.

    // 이미 받은 텍스트가 있으면 그대로 유지하고, 없으면 오류 안내로 바꾼다
    if (getMessage(threadId, assistantId)?.text.trim()) return;
    updateMessage(threadId, assistantId, (message) => ({
      ...message,
      text: ERROR_ANSWER_FAILED,
      sources: [],
      error: true,
    }));
  }
}

/** 생성 중인 답변 중지. 받은 내용은 유지합니다. */
export function stopStreaming(threadId: string): void {
  const streaming = state.streaming[threadId];
  if (!streaming) return;
  const controller = abortControllers.get(threadId);
  updateMessage(threadId, streaming.messageId, (message) => ({
    ...message,
    text: message.text.trim() ? `${message.text}${STOPPED_SUFFIX}` : STOPPED_TEXT,
  }));
  finishStreaming(threadId);
  controller?.abort();
}

/** 답변 피드백 (도움이 됐어요 / 안 됐어요). 같은 평가를 다시 누르면 무시합니다. */
export async function submitFeedback(
  threadId: string,
  messageId: string,
  rating: ChatFeedback,
): Promise<void> {
  const message = getMessage(threadId, messageId);
  if (!message?.serverId || message.feedback === rating) return;
  if (state.feedbackBusy[messageId] || state.streaming[threadId]) return;

  setFeedbackBusy(messageId, true);
  try {
    await submitMessageFeedback(message.serverId, rating);
    updateMessage(threadId, messageId, (m) => ({ ...m, feedback: rating }));
  } catch (error) {
    console.error("Failed to submit feedback:", error);
  } finally {
    setFeedbackBusy(messageId, false);
  }
}

/** 재생성 가능 여부: 대화의 마지막 답변이고, 서버에 저장됐고, 아직 재생성되지 않았을 때 */
export function canRegenerate(thread: ChatThread, message: ThreadMessage): boolean {
  const last = thread.messages[thread.messages.length - 1];
  return (
    message.role === "assistant" &&
    !!message.serverId &&
    !message.regeneratedAnswer &&
    !message.error &&
    last?.id === message.id
  );
}

/**
 * 답변 다시 받기. 백엔드 규칙상 BAD 피드백이 저장된 답변만 1회 재생성할 수 있으므로,
 * 아직 BAD 피드백이 없으면 먼저 저장한 뒤 재생성합니다.
 */
export async function regenerateAnswer(threadId: string, messageId: string): Promise<void> {
  const thread = state.threads.find((t) => t.id === threadId);
  const original = thread && getMessage(threadId, messageId);
  if (!thread || !original || !canRegenerate(thread, original)) return;
  if (hasActiveStream() || state.feedbackBusy[messageId]) return;

  const serverId = original.serverId!;
  setFeedbackBusy(messageId, true);
  try {
    if (original.feedback !== "BAD") {
      await submitMessageFeedback(serverId, "BAD");
      updateMessage(threadId, messageId, (m) => ({ ...m, feedback: "BAD" }));
    }
  } catch (error) {
    console.error("Failed to submit feedback before regeneration:", error);
    setFeedbackBusy(messageId, false);
    return;
  }
  setFeedbackBusy(messageId, false);

  // 피드백 요청을 기다리는 사이 대화가 바뀌었을 수 있다(새 질문 전송, 삭제 등). 조건을 다시 확인
  const currentThread = state.threads.find((t) => t.id === threadId);
  const originalSnapshot = currentThread && getMessage(threadId, messageId);
  if (
    !currentThread ||
    !originalSnapshot ||
    !canRegenerate(currentThread, originalSnapshot) ||
    hasActiveStream()
  ) {
    return;
  }

  const regenId = uid();
  // 원본 답변 자리에서 재생성 답변을 스트리밍
  updateMessage(threadId, messageId, () => ({
    id: regenId,
    role: "assistant",
    text: "",
    sources: [],
    createdAt: Date.now(),
    regeneratedAnswer: true,
  }));

  const controller = startStreaming(threadId, regenId, true);
  let received = false;
  try {
    await regenerateWidgetAnswer(
      serverId,
      (streamedText) => {
        if (streamedText) received = true;
        updateMessage(threadId, regenId, (m) => ({ ...m, text: streamedText }));
      },
      (finalResponse) => {
        applyFinalResponse(threadId, regenId, finalResponse);
        finishStreaming(threadId);
        void attachServerId(threadId, regenId);
      },
      { signal: controller.signal },
    );
  } catch (error) {
    finishStreaming(threadId);
    if (isAbortError(error)) {
      // 아무것도 받기 전에 중지했으면 원본 답변을 되살린다 (재생성 다시 가능)
      if (!received) updateMessage(threadId, regenId, () => originalSnapshot);
      return;
    }

    console.error("Failed to regenerate answer:", error);
    const current = getMessage(threadId, regenId);
    if (current && current.text.trim()) return;
    // 아무것도 못 받았으면 원본 답변 복원 (다시 시도 가능)
    updateMessage(threadId, regenId, () => originalSnapshot);
  }
}

export function deleteThread(threadId: string): void {
  if (state.streaming[threadId]) {
    abortControllers.get(threadId)?.abort();
    finishStreaming(threadId);
  }
  updateThreads((threads) => threads.filter((thread) => thread.id !== threadId));
}

export function renameThread(threadId: string, title: string): void {
  const next = title.trim();
  if (!next) return;
  updateThread(threadId, (thread) => ({ ...thread, title: next }));
}

export function setShowSources(showSources: boolean): void {
  setState({ showSources });
}
