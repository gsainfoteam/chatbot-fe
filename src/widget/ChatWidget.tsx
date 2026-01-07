// 채팅 위젯 메인 컴포넌트

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, ColorTheme, WidgetContext } from "./types";
import { uid, applyColorTheme } from "./utils";

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: uid(), role: "assistant", text: "안녕하세요! 무엇을 도와드릴까요?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const isComposingRef = useRef(false);

  const [ctx, setCtx] = useState<WidgetContext>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
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
          console.log("색상 업데이트 받음:", colors);
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
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading]
  );

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // 메시지 전송 이벤트 전달
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

    // ✅ 지금은 API 없이 "가짜 응답"만
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        text: `(${ctx.widgetKey ?? "no-key"}) 페이지(${
          ctx.pageUrl ? "있음" : "없음"
        }) 확인! "${text}"에 답변할게요.`,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);

      // 메시지 수신 이벤트 전달
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
    }, 600);
  };

  return (
    <div className="h-screen w-screen bg-transparent p-0">
      <div className="h-full w-full bg-white border border-slate-200 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b bg-white"
          style={{
            borderColor: "var(--color-border, #e2e8f0)",
            backgroundColor: "var(--color-background, #ffffff)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--color-primary, #ff4500)" }}
            />
            <div>
              <div
                className="text-sm font-extrabold"
                style={{ color: "var(--color-text, #1e293b)" }}
              >
                상담 챗봇
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--color-text-secondary, #64748b)" }}
              >
                빠르게 도와드릴게요
              </div>
            </div>
          </div>

          <button
            className="p-2 rounded-lg active:scale-[0.98] transition"
            style={{
              color: "var(--color-text-secondary, #64748b)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            onClick={() =>
              window.parent?.postMessage({ type: "WM_REQUEST_CLOSE" }, "*")
            }
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
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex mb-2 justify-start">
              <div
                className="max-w-[80%] text-[14px] px-3 py-2 rounded-2xl border"
                style={{
                  backgroundColor: "var(--color-assistant-message-bg, #ffffff)",
                  borderColor: "var(--color-border, #e2e8f0)",
                  color: "var(--color-text-secondary, #64748b)",
                }}
              >
                …
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          className="border-t p-2 flex gap-2"
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
            className="flex-1 resize-none border rounded-xl px-3 py-2 text-sm outline-none transition"
            style={{
              borderColor: "var(--color-border, #e2e8f0)",
              color: "var(--color-text, #1e293b)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor =
                "var(--color-primary, #ff4500)";
              e.currentTarget.style.boxShadow =
                "0 0 0 2px color-mix(in srgb, var(--color-primary, #ff4500) 30%, transparent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor =
                "var(--color-border, #e2e8f0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            rows={1}
            placeholder="메시지를 입력하세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
          <button
            type="submit"
            disabled={!canSend}
            className="px-4 rounded-xl font-extrabold text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition"
            style={{
              backgroundColor: "var(--color-primary, #ff4500)",
            }}
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
}
