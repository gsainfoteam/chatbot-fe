// 채팅 위젯 메인 컴포넌트

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, ColorTheme, WidgetContext, Source } from "./types";
import { uid, applyColorTheme, renderMarkdown } from "./utils";
import { LinkIcon, ExternalLinkIcon, PhotoIcon, ArrowUpIcon, StopIcon } from "../components/Icons";
import {
  createWidgetSession,
  sendWidgetChatMessage,
  saveSessionToken,
  getSessionToken,
  getSessionExpiresAt,
  isRateLimitError,
} from "../api/widgetChat";

// 출처 배지 컴포넌트
function SourceBadge({ source }: { source: Source }) {
  if (source.type === "url") {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition hover:opacity-80 max-w-full min-w-0"
        style={{
          backgroundColor: "var(--color-background, #f8fafc)",
          borderColor: "var(--color-border, #e2e8f0)",
          color: "var(--color-text, #1e293b)",
        }}
      >
        <LinkIcon className="w-3 h-3 shrink-0" />
        <span className="min-w-0 flex-1 truncate">
          {source.title || new URL(source.url).hostname}
        </span>
        <ExternalLinkIcon className="w-3 h-3 shrink-0" />
      </a>
    );
  }

  if (source.type === "image") {
    if (source.title) {
      return (
        <div
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border max-w-full min-w-0"
          style={{
            backgroundColor: "var(--color-background, #f8fafc)",
            borderColor: "var(--color-border, #e2e8f0)",
            color: "var(--color-text, #1e293b)",
          }}
        >
          <PhotoIcon className="w-3 h-3 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{source.title}</span>
        </div>
      );
    }
    return <></>;
  }
  return null;
}

// 이미지 컴포넌트 (로딩 skeleton 포함)
function SourceImage({ source }: { source: Source }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  return (
    <div className="mt-2 relative">
      {/* Skeleton UI */}
      {isLoading && (
        <div
          className="rounded-lg border animate-pulse"
          style={{
            aspectRatio: "16 / 9",
            backgroundColor: "var(--color-background, #f1f5f9)",
            borderColor: "var(--color-border, #e2e8f0)",
          }}
        />
      )}

      {/* 실제 이미지 */}
      <img
        src={source.url}
        alt={source.title || "출처 이미지"}
        className={`rounded-lg border ${
          isLoading ? "absolute opacity-0" : "opacity-100"
        }`}
        style={{
          maxWidth: "100%",
          width: "100%",
          height: "auto",
          borderColor: "var(--color-border, #e2e8f0)",
          transition: "opacity 0.2s ease-in-out",
        }}
        onLoad={() => {
          setIsLoading(false);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}

interface ChatWidgetProps {
  onClose?: () => void;
  className?: string;
}

export default function ChatWidget({
  onClose,
  className,
}: ChatWidgetProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      text: "무엇을 도와드릴까요?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("자료를 찾아보는 중");
  const [rateLimitWarning, setRateLimitWarning] = useState<{
    retryAt: number;
  } | null>(null);
  const [rateLimitRemainingText, setRateLimitRemainingText] = useState("");
  const isComposingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  // iframe 환경인지 확인 (React 앱 내부에서는 false)
  const isInIframe = typeof window !== "undefined" && window.parent !== window;

  const [ctx, setCtx] = useState<WidgetContext>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  // 미리보기 모드 확인 (URL 파라미터)
  const isPreviewMode =
    new URLSearchParams(window.location.search).get("preview") === "true";

  useEffect(() => {
    // iframe 환경에서만 postMessage 사용
    if (isInIframe) {
      // iframe이 로드되면 부모에게 준비됨 알림
      window.parent?.postMessage({ type: "WM_WIDGET_READY" }, "*");

      const onMsg = (e: MessageEvent) => {
        const data = e.data;
        if (!data || typeof data !== "object") return;

        if (data.type === "WM_INIT") {
          const colors = data.colors as ColorTheme | undefined;
          if (colors) {
            applyColorTheme(colors);
          }
          setCtx({
            widgetKey: data.widgetKey,
            pageUrl: data.pageUrl,
            colors: colors,
          });
        }
        if (data.type === "WM_UPDATE_COLORS") {
          // 색상 업데이트 메시지 처리
          const colors = data.colors as ColorTheme | undefined;
          if (colors) {
            applyColorTheme(colors);
            setCtx((prev) => ({
              ...prev,
              colors: colors,
            }));
          }
        }
        if (data.type === "WM_CLOSE") {
          // (필요하면 닫힘 애니메이션 처리 가능)
        }
      };

      window.addEventListener("message", onMsg);
      return () => window.removeEventListener("message", onMsg);
    }
  }, [isInIframe]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  // 429 경고 시 재시도 가능 시간 카운트다운
  useEffect(() => {
    if (!rateLimitWarning) return;

    function formatRemaining(retryAt: number): string {
      const now = Date.now();
      if (now >= retryAt) return "이제 다시 시도할 수 있습니다.";
      const sec = Math.ceil((retryAt - now) / 1000);
      if (sec < 60) return `${sec}초 후에 다시 시도할 수 있습니다.`;
      const min = Math.floor(sec / 60);
      const s = sec % 60;
      if (s === 0) return `${min}분 후에 다시 시도할 수 있습니다.`;
      return `${min}분 ${s}초 후에 다시 시도할 수 있습니다.`;
    }

    setRateLimitRemainingText(formatRemaining(rateLimitWarning.retryAt));

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= rateLimitWarning.retryAt) {
        setRateLimitWarning(null);
        setRateLimitRemainingText("");
        return;
      }
      setRateLimitRemainingText(formatRemaining(rateLimitWarning.retryAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitWarning]);

  // 로딩 시간에 따라 메시지 변경
  useEffect(() => {
    if (!loading) {
      return;
    }
    // 새 질문 시작 시 항상 첫 메시지로 초기화
    setLoadingMessage("자료를 찾아보는 중");

    const timeout1 = setTimeout(() => {
      setLoadingMessage("파일을 읽어보는 중");
    }, 3000);

    const timeout2 = setTimeout(() => {
      setLoadingMessage("조금 더 생각 중");
    }, 6000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [loading]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading]
  );

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // 미리보기 모드에서는 전송 비활성화
    if (isPreviewMode) return;

    // widgetKey가 없으면 전송 불가
    if (!ctx.widgetKey) {
      console.error("Widget key is not available");
      const errorMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        text: "위젯 키가 설정되지 않았습니다. 위젯을 다시 로드해주세요.",
      };
      setMessages((prev) => [...prev, errorMsg]);
      return;
    }

    const userMsg: ChatMessage = { id: uid(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoadingMessage("자료를 찾아보는 중");
    setLoading(true);

    // 메시지 전송 이벤트 전달 (iframe 환경에서만)
    if (isInIframe) {
      window.parent?.postMessage(
        {
          type: "WM_MESSAGE_SENT",
          message: {
            id: userMsg.id,
            text: userMsg.text,
            role: userMsg.role,
          },
        },
        "*"
      );
    }

    let assistantMsgId: string;
    try {
      // 스트리밍 응답을 위한 메시지 ID 생성 (catch에서 제거할 수 있도록 먼저 생성)
      assistantMsgId = uid();

      // 세션 토큰 확인 및 발급
      let sessionToken = getSessionToken();
      if (!sessionToken) {
        // 세션이 없으면 발급
        // iframe 내부에서는 부모 페이지의 URL을 사용해야 함
        // ctx.pageUrl은 loader.js에서 부모 페이지의 location.href로 설정됨
        const pageUrl =
          ctx.pageUrl ||
          (isInIframe ? document.referrer : window.location.href);
        const sessionResponse = await createWidgetSession({
          widgetKey: ctx.widgetKey,
          pageUrl: pageUrl,
        });
        saveSessionToken(
          sessionResponse.sessionToken,
          sessionResponse.expiresIn
        );
        sessionToken = sessionResponse.sessionToken;
      }

      // 초기 메시지 추가 (빈 텍스트로 시작)
      const initialMessage: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        text: "",
        sources: [],
      };
      setMessages((prev) => [...prev, initialMessage]);
      streamingMessageIdRef.current = assistantMsgId;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // 채팅 메시지 전송 (스트리밍)
      await sendWidgetChatMessage(
        {
          question: text,
        },
        // onChunk: 스트림 청크를 받을 때마다 호출
        (streamedText) => {
          try {
            // 함수형 업데이트를 사용하여 최신 상태 기반으로 업데이트
            setMessages((prev) => {
              return prev.map((msg): ChatMessage => {
                if (msg.id === assistantMsgId) {
                  return {
                    ...msg,
                    text: streamedText,
                  };
                }
                return msg;
              });
            });
          } catch (error) {
            // 렌더링 에러 발생 시 무시 (스트림 계속 진행)
            console.error("Error updating message:", error);
          }
        },
        // onComplete: 전체 응답 완료 시 호출
        (finalResponse) => {
          abortControllerRef.current = null;
          streamingMessageIdRef.current = null;
          // 함수형 업데이트를 사용하여 최종 메시지 업데이트 (sources 포함)
          setMessages((prev) => {
            const updatedMessage: ChatMessage = {
              id: assistantMsgId,
              role: "assistant",
              text: finalResponse.answer,
              sources: finalResponse.sources,
            };
            return prev.map((msg) =>
              msg.id === assistantMsgId ? updatedMessage : msg
            );
          });
          setLoading(false);

          // 메시지 수신 이벤트 전달 (iframe 환경에서만)
          if (isInIframe) {
            setMessages((prev) => {
              const assistantMsg = prev.find(
                (msg) => msg.id === assistantMsgId
              );
              if (assistantMsg) {
                window.parent?.postMessage(
                  {
                    type: "WM_MESSAGE_RECEIVED",
                    message: {
                      id: assistantMsg.id,
                      text: assistantMsg.text,
                      role: assistantMsg.role,
                    },
                  },
                  "*"
                );
              }
              return prev;
            });
          }
        },
        { signal: controller.signal },
      ).catch((error) => {
        abortControllerRef.current = null;
        streamingMessageIdRef.current = null;
        // 스트림 에러 발생 시 처리
        setLoading(false);
        // 사용자가 중지한 경우: 받은 내용만 유지, 에러 메시지 표시 안 함 (UI는 이미 중지 버튼에서 처리됨)
        if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        if (isRateLimitError(error)) {
          const retryAt = getSessionExpiresAt();
          if (retryAt) setRateLimitWarning({ retryAt });
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== assistantMsgId)
          );
          return;
        }
        // 에러가 발생했지만 이미 일부 텍스트가 있다면 그대로 유지
        setMessages((prev) => {
          const existingMsg = prev.find((msg) => msg.id === assistantMsgId);
          if (existingMsg && existingMsg.text) {
            // 이미 받은 텍스트가 있으면 그대로 유지
            return prev;
          }
          // 텍스트가 없으면 에러 메시지로 교체
          return prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  text: "죄송합니다. 응답을 받는 중 오류가 발생했습니다.",
                }
              : msg
          );
        });
        throw error; // 상위 catch로 전파
      });
    } catch (error) {
      abortControllerRef.current = null;
      streamingMessageIdRef.current = null;
      console.error("Failed to send chat message:", error);
      setLoading(false);

      // 사용자가 중지한 경우: 에러 메시지 표시 안 함
      const isAbortError =
        (typeof DOMException !== "undefined" && error instanceof DOMException && (error as DOMException).name === "AbortError") ||
        (error instanceof Error && error.name === "AbortError");
      if (isAbortError) {
        return;
      }

      if (isRateLimitError(error)) {
        const retryAt = getSessionExpiresAt();
        if (retryAt) setRateLimitWarning({ retryAt });
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
      } else {
        // 에러 메시지 표시 (말풍선)
        const errorMsg: ChatMessage = {
          id: uid(),
          role: "assistant",
          text: "죄송합니다. 메시지를 전송하는 중 오류가 발생했습니다. 다시 시도해주세요.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setLoadingMessage("자료를 찾아보는 중");
    }
  };

  return (
    <div className={className || "h-screen w-screen bg-transparent p-0"}>
      <div
        className="h-full w-full bg-white border border-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col"
        style={{ borderRadius: "24px" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{
            borderColor: "var(--color-border, #e2e8f0)",
            backgroundColor: "var(--color-background, #ffffff)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.svg"
              alt=""
              className="w-8 h-8 shrink-0 object-contain"
              aria-hidden
            />
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold tracking-tight truncate"
                style={{ color: "var(--color-text, #1e293b)" }}
              >
                GIST 챗봇
              </div>
              <div
                className="text-xs mt-0.5 tracking-tight"
                style={{ color: "var(--color-text-secondary, #94a3b8)" }}
              >
                궁금한 내용을 질문해보세요.
              </div>
            </div>
          </div>

          <button
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg active:scale-[0.98] transition"
            style={{
              color: "var(--color-text-secondary, #64748b)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            onClick={() => {
              if (isInIframe) {
                window.parent?.postMessage({ type: "WM_REQUEST_CLOSE" }, "*");
              } else if (onClose) {
                onClose();
              }
            }}
            aria-label="닫기"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-auto px-3 py-3"
          style={{
            backgroundColor: "var(--color-background, #f8fafc)",
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex mb-2 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className="max-w-[80%] text-[14px] leading-snug px-3 py-2 rounded-2xl border"
                style={
                  m.role === "user"
                    ? {
                        backgroundColor: `color-mix(in srgb, var(--color-user-message-bg, var(--color-primary, #ff4500)) 10%, transparent)`,
                        borderColor: `color-mix(in srgb, var(--color-user-message-bg, var(--color-primary, #ff4500)) 25%, transparent)`,
                        color: "var(--color-text, #1e293b)",
                      }
                    : {
                        backgroundColor:
                          "var(--color-assistant-message-bg, #ffffff)",
                        borderColor: "var(--color-border, #e2e8f0)",
                        color: "var(--color-text, #1e293b)",
                      }
                }
              >
                {m.role === "assistant" ? (
                  m.text ? (
                    renderMarkdown(m.text)
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="loading-text-shimmer">
                        {loadingMessage}
                      </span>
                      <span
                        className="flex items-center gap-1.5"
                        style={{
                          color: "var(--color-text-secondary, #64748b)",
                        }}
                      >
                        <span className="thinking-dot"></span>
                        <span className="thinking-dot"></span>
                        <span className="thinking-dot"></span>
                      </span>
                    </div>
                  )
                ) : (
                  m.text
                )}

                {/* 출처 정보 표시 (assistant 메시지만) */}
                {m.role === "assistant" &&
                  m.sources &&
                  m.sources.length > 0 && (
                    <div className="mt-2 pt-3 border-t border-slate-200 flex flex-col gap-1">
                      {/* 출처 배지 */}
                      <div className="flex flex-wrap gap-1.5">
                        {m.sources.map((source, idx) => (
                          <SourceBadge key={idx} source={source} />
                        ))}
                      </div>

                      {/* 이미지 출처 표시 */}
                      {m.sources
                        .filter((s) => s.type === "image")
                        .map((source, idx) => (
                          <SourceImage key={`img-${idx}`} source={source} />
                        ))}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {/* 로딩 표시는 메시지가 생성되기 전에만 표시 (텍스트가 있는 assistant 메시지가 없을 때만) */}
          {loading &&
            !messages.some(
              (m) =>
                m.role === "assistant" && m.text && m.text.trim().length > 0
            ) && (
              <div className="flex mb-2 justify-start">
                <div
                  className="max-w-[80%] text-[14px] px-3 py-2 rounded-2xl border"
                  style={{
                    backgroundColor:
                      "var(--color-assistant-message-bg, #ffffff)",
                    borderColor: "var(--color-border, #e2e8f0)",
                    color: "var(--color-text-secondary, #64748b)",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="loading-text-shimmer">
                      {loadingMessage}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="thinking-dot"></span>
                      <span className="thinking-dot"></span>
                      <span className="thinking-dot"></span>
                    </span>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* 429 경고 */}
        {rateLimitWarning && (
          <div
            className="px-3 pb-2"
            style={{
              backgroundColor: "var(--color-background, #ffffff)",
            }}
          >
            <div
              className="w-full text-xs sm:text-sm rounded-xl px-3 py-2"
              style={{
                backgroundColor: "#fee2e2",
                color: "#7f1d1d",
                border: "1px solid #fecaca",
              }}
            >
              <div className="font-semibold">
                한 번에 최대 5번까지만 질문할 수 있습니다.
              </div>
              <div className="mt-0.5 opacity-90">{rateLimitRemainingText}</div>
            </div>
          </div>
        )}

        {/* Input */}
        <form
          className="border-t p-2 flex gap-2 items-center"
          style={{
            borderColor: "var(--color-border, #e2e8f0)",
            backgroundColor: "var(--color-background, #ffffff)",
          }}
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            className="flex-1 resize-none border rounded-2xl px-4 py-2.5 text-sm outline-none transition min-h-10"
            style={{
              borderColor: "var(--color-border, #e2e8f0)",
              color: "var(--color-text, #1e293b)",
            }}
            onFocus={(e) => {
              if (isPreviewMode) return;
              e.currentTarget.style.borderColor =
                "var(--color-primary, #df3326)";
              e.currentTarget.style.boxShadow =
                "0 0 0 2px color-mix(in srgb, var(--color-primary, #df3326) 30%, transparent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor =
                "var(--color-border, #e2e8f0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            rows={1}
            placeholder="메시지를 입력하세요"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              // 조합이 완료된 후 약간의 지연을 두어 확실하게 처리
              setTimeout(() => {
                isComposingRef.current = false;
              }, 0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                // 미리보기 모드에서는 전송 비활성화
                if (isPreviewMode) {
                  e.preventDefault();
                  return;
                }
                // 한글 입력 조합 중일 때는 전송하지 않음
                if (
                  isComposingRef.current ||
                  (e.nativeEvent as KeyboardEvent).isComposing
                ) {
                  return;
                }
                e.preventDefault();
                send();
              }
            }}
          />
          {loading ? (
            <button
              type="button"
              onClick={() => {
                const msgId = streamingMessageIdRef.current;
                setLoading(false);
                if (msgId) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === msgId
                        ? {
                            ...msg,
                            text: msg.text.trim()
                              ? `${msg.text}\n\n_(응답이 중지되었습니다)_`
                              : "응답이 중지되었습니다.",
                          }
                        : msg
                    )
                  );
                  streamingMessageIdRef.current = null;
                }
                abortControllerRef.current?.abort();
              }}
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-[0.98] transition hover:opacity-90"
              style={{
                backgroundColor: "var(--color-primary, #df3326)",
              }}
              aria-label="응답 중지"
            >
              <StopIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSend}
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition"
              style={{
                backgroundColor: "var(--color-primary, #ff4500)",
              }}
              aria-label="전송"
            >
              <ArrowUpIcon className="w-6 h-6" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
