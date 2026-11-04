import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  clearSessionToken,
  createWidgetSession,
  fetchWidgetHistory,
  getSessionToken,
  getSessionExpiresAt,
  mapWidgetHistory,
  regenerateWidgetAnswer,
  saveSessionToken,
  sendWidgetChatMessage,
  submitMessageFeedback,
} from "@/api/widgetChat";
import {
  settleRunningSteps,
  upsertStep,
  WidgetStreamError,
} from "@/api/widgetStreamEvents";
import { reconcileHistory, type HistoryTarget } from "./history";
import type { ChatMessage, FeedbackRating } from "./types";
import { uid } from "./utils";

function errorNotice(error: unknown): string {
  const status =
    error instanceof WidgetStreamError
      ? error.status
      : axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
  if (status === 401)
    return "세션이 만료되었습니다. 다음 전송 시 새 대화를 시작합니다. 질문은 자동으로 다시 보내지 않습니다.";
  if (status === 400) return "질문 내용 또는 답변 재생성 조건을 확인해 주세요.";
  if (status === 404)
    return "해당 답변을 찾을 수 없어 대화 기록을 다시 확인했습니다.";
  if (status === 429) {
    return "요청이 많습니다. 진행 중인 답변을 기다린 후 나중에 직접 다시 시도해 주세요.";
  }
  return "응답을 완료하지 못했습니다. 대화 기록을 확인한 후 다시 질문해 주세요. 다시 전송하면 질문 횟수를 추가로 사용합니다.";
}

export function useWidgetConversation(options: {
  widgetKey?: string;
  getPageUrl: () => string;
  preview: boolean;
  inIframe: boolean;
}) {
  const { widgetKey, getPageUrl, preview, inIframe } = options;
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: uid(), role: "assistant", text: "무엇을 도와드릴까요?" },
  ]);
  const [loading, setLoading] = useState(false);
  const [feedbackBusyId, setFeedbackBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const active = useRef<{
    controller: AbortController;
    messageId?: string;
    streaming: boolean;
  } | null>(null);
  const feedbackLock = useRef(false);
  const mounted = useRef(true);
  const session = useRef(getSessionToken());
  const historyReady = useRef(false);
  const pendingTarget = useRef<HistoryTarget | undefined>(undefined);

  const syncHistory = useCallback(async (target?: HistoryTarget) => {
    const owner = active.current;
    const token = getSessionToken();
    if (!token) return [];
    const history = (await fetchWidgetHistory())
      .reverse()
      .map(mapWidgetHistory);
    if (
      !mounted.current ||
      active.current !== owner ||
      getSessionToken() !== token
    )
      return [];
    const matchingTarget = target ?? pendingTarget.current;
    setMessages((prev) => reconcileHistory(prev, history, matchingTarget));
    setLimitReached(
      (previous) =>
        previous || history.filter((m) => m.role === "user").length >= 5,
    );
    historyReady.current = true;
    return history;
  }, []);

  const handleError = useCallback((error: unknown) => {
    const status =
      error instanceof WidgetStreamError
        ? error.status
        : axios.isAxiosError(error)
          ? error.response?.status
          : undefined;
    if (status === 401) {
      clearSessionToken();
      historyReady.current = false;
      setLimitReached(false);
      setMessages((prev) => prev.map((m) => ({ ...m, serverId: undefined })));
    }
    if (
      error instanceof WidgetStreamError &&
      error.status === 429 &&
      error.limit === 5
    ) {
      setLimitReached(true);
      setNotice(null);
      return;
    }
    setNotice(errorNotice(error));
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!preview && getSessionToken()) {
      const request = { controller: new AbortController(), streaming: false };
      active.current = request;
      setLoading(true);
      void syncHistory()
        .catch((error) => {
          if (mounted.current && active.current === request) handleError(error);
        })
        .finally(() => {
          if (mounted.current && active.current === request) {
            active.current = null;
            setLoading(false);
          }
        });
    }
    return () => {
      mounted.current = false;
      active.current?.controller.abort();
      active.current = null;
    };
  }, [preview, syncHistory, handleError]);

  // 실제 토큰 만료만 반영한다. 429의 재시도 시간을 임의로 계산하지 않는다.
  useEffect(() => {
    if (loading || preview) return;
    const expiresAt = getSessionExpiresAt();
    if (!expiresAt) return;
    const timer = setTimeout(
      () => {
        clearSessionToken();
        setLimitReached(false);
        setMessages((prev) => prev.map((m) => ({ ...m, serverId: undefined })));
        setNotice(
          limitReached
            ? null
            : "세션이 만료되었습니다. 다음 질문은 새 대화에서 시작합니다.",
        );
      },
      Math.min(Math.max(expiresAt - Date.now(), 0), 2_147_483_647),
    );
    return () => clearTimeout(timer);
  }, [loading, preview, limitReached]);

  const run = async (
    question?: string,
    original?: ChatMessage,
  ): Promise<boolean> => {
    if (
      active.current ||
      preview ||
      (!original && limitReached && getSessionToken())
    )
      return false;
    if (!original && (!question?.trim() || [...question].length > 4000)) {
      setNotice(
        "질문은 공백을 제외한 내용이 있어야 하며 최대 4,000자까지 입력할 수 있습니다.",
      );
      return false;
    }
    if (
      original &&
      (!original.serverId ||
        original.regenerationAttempted ||
        original.regeneratedAnswer ||
        original.feedback !== "BAD")
    )
      return false;
    if (!getSessionToken() && (!widgetKey || !getPageUrl()?.trim())) {
      setNotice(
        "위젯 키와 페이지 정보를 확인할 수 없습니다. 위젯을 다시 열어주세요.",
      );
      return false;
    }
    const request = {
      controller: new AbortController(),
      messageId: uid(),
      streaming: false,
    };
    active.current = request; // React 렌더 이전의 연속 클릭도 차단한다.
    setLoading(true);
    setNotice(null);
    const isCurrent = () => mounted.current && active.current === request;
    const acceptsEvents = () =>
      isCurrent() && !request.controller.signal.aborted && request.streaming;
    let target: HistoryTarget | undefined;
    let completed = false;
    let questionSent = false;
    try {
      if (!getSessionToken()) {
        if (original)
          throw new WidgetStreamError("http", "Session expired", 401);
        const response = await createWidgetSession(
          { widgetKey: widgetKey!, pageUrl: getPageUrl() },
          request.controller.signal,
        );
        if (!isCurrent()) return false;
        request.controller.signal.throwIfAborted();
        saveSessionToken(response.sessionToken, response.expiresIn);
        session.current = response.sessionToken;
        pendingTarget.current = undefined;
        setMessages([
          {
            id: uid(),
            role: "assistant",
            text: "새 대화를 시작합니다. 무엇을 도와드릴까요?",
          },
        ]);
        setLimitReached(false);
        historyReady.current = true;
      }
      if (session.current !== getSessionToken()) {
        session.current = getSessionToken();
        pendingTarget.current = undefined;
        setLimitReached(false);
        setMessages([]);
      }
      // 실패/취소 후 수동 재시도 전에도 저장 여부를 먼저 조회한다.
      const history = await syncHistory();
      if (!isCurrent()) return false;
      request.controller.signal.throwIfAborted();
      if (!original && history.filter((m) => m.role === "user").length >= 5) {
        throw new WidgetStreamError("http", "Question limit", 429, 5);
      }
      const userId = original ? undefined : uid();
      target = {
        userId,
        assistantId: request.messageId,
        question,
        previousIds: new Set(
          history.flatMap((m) => (m.serverId ? [m.serverId] : [])),
        ),
        regeneratedFromMessageId: original?.serverId,
      };
      pendingTarget.current = target;
      if (original) {
        const saved = history.find((m) => m.serverId === original.serverId);
        if (
          !saved ||
          saved.feedback !== "BAD" ||
          history.some((m) => m.regeneratedFromMessageId === original.serverId)
        ) {
          throw new WidgetStreamError("http", "Regeneration unavailable", 400);
        }
      }
      setMessages((prev) => [
        ...prev.map((m) =>
          m.id === original?.id ? { ...m, regenerationAttempted: true } : m,
        ),
        ...(userId
          ? [{ id: userId, role: "user" as const, text: question! }]
          : []),
        {
          id: request.messageId,
          role: "assistant",
          text: "",
          status: "waiting",
          regeneratedAnswer: !!original,
        },
      ]);
      request.streaming = true;
      questionSent = true;
      if (inIframe && userId)
        window.parent?.postMessage(
          {
            type: "WM_MESSAGE_SENT",
            message: { id: userId, text: question, role: "user" },
          },
          "*",
        );
      const onChunk = (text: string) => {
        if (!acceptsEvents()) return;
        target!.answer = text;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === request.messageId
              ? { ...m, text, status: "streaming" }
              : m,
          ),
        );
      };
      const onComplete = (response: import("@/api/types").SendChatResponse) => {
        if (!acceptsEvents()) return;
        completed = true;
        request.streaming = false;
        target!.answer = response.answer;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === request.messageId
              ? {
                  ...m,
                  text: response.answer,
                  sources: response.sources,
                  externalSources: response.externalSources,
                  webSources: response.webSources,
                  status: "completed",
                  steps: settleRunningSteps(m.steps ?? [], "stopped"),
                }
              : m,
          ),
        );
        if (inIframe)
          window.parent?.postMessage(
            {
              type: "WM_MESSAGE_RECEIVED",
              message: {
                id: request.messageId,
                text: response.answer,
                role: "assistant",
              },
            },
            "*",
          );
      };
      const streamOptions = {
        signal: request.controller.signal,
        onStep: (step: import("./types").AgentStep) => {
          if (!acceptsEvents()) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === request.messageId
                ? {
                    ...m,
                    status: m.text ? "streaming" : "researching",
                    steps: upsertStep(m.steps ?? [], step),
                  }
                : m,
            ),
          );
        },
      };
      if (original)
        await regenerateWidgetAnswer(
          original.serverId!,
          onChunk,
          onComplete,
          streamOptions,
        );
      else
        await sendWidgetChatMessage(
          { question: question! },
          onChunk,
          onComplete,
          streamOptions,
        );
    } catch (error) {
      if (!isCurrent()) return questionSent;
      request.streaming = false;
      const cancelled = request.controller.signal.aborted;
      if (!cancelled) handleError(error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === request.messageId
            ? {
                ...m,
                status: cancelled ? "cancelled" : "failed",
                notice: cancelled
                  ? "응답이 중지되었습니다."
                  : "미완료 답변 · 응답을 끝까지 받지 못했습니다.",
                steps: settleRunningSteps(
                  m.steps ?? [],
                  cancelled ? "stopped" : "failed",
                ),
              }
            : m,
        ),
      );
    } finally {
      if (isCurrent()) {
        request.streaming = false;
        if (target && getSessionToken()) {
          try {
            await syncHistory(target);
          } catch (error) {
            if (isCurrent()) {
              handleError(error);
              if (getSessionToken())
                setNotice(
                  "대화 기록을 동기화하지 못했습니다. 기록을 다시 확인하기 전에는 피드백을 보낼 수 없습니다.",
                );
              historyReady.current = false;
            }
          }
        }
        if (isCurrent()) {
          active.current = null;
          setLoading(false);
        }
      }
    }
    return questionSent || completed;
  };

  const stop = () => {
    const request = active.current;
    if (!request?.streaming) return;
    request.streaming = false;
    request.controller.abort();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === request.messageId
          ? {
              ...m,
              status: "cancelled",
              notice: "응답이 중지되었습니다.",
              steps: settleRunningSteps(m.steps ?? [], "stopped"),
            }
          : m,
      ),
    );
  };

  const handleFeedback = async (msg: ChatMessage, rating: FeedbackRating) => {
    if (!msg.serverId || active.current || feedbackLock.current || preview)
      return;
    feedbackLock.current = true;
    setFeedbackBusyId(msg.id);
    try {
      if (!getSessionToken())
        throw new WidgetStreamError("http", "Session expired", 401);
      if (!historyReady.current) await syncHistory();
      await submitMessageFeedback(msg.serverId, rating);
      if (mounted.current)
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, feedback: rating } : m)),
        );
    } catch (error) {
      if (mounted.current) handleError(error);
    } finally {
      feedbackLock.current = false;
      if (mounted.current) setFeedbackBusyId(null);
    }
  };

  const refreshHistory = async () => {
    if (active.current || preview || !getSessionToken()) return;
    const request = { controller: new AbortController(), streaming: false };
    active.current = request;
    setLoading(true);
    try {
      await syncHistory();
      setNotice(null);
    } catch (error) {
      if (mounted.current) handleError(error);
    } finally {
      if (mounted.current && active.current === request) {
        active.current = null;
        setLoading(false);
      }
    }
  };

  return {
    messages,
    loading,
    feedbackBusyId,
    notice,
    limitReached,
    handleFeedback,
    sendQuestion: (text: string) =>
      feedbackLock.current ? Promise.resolve(false) : run(text),
    regenerateAnswer: (msg: ChatMessage) =>
      feedbackLock.current ? Promise.resolve(false) : run(undefined, msg),
    stop,
    refreshHistory,
  };
}
