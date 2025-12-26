import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";
type Msg = { id: string; role: Role; text: string };

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: uid(), role: "assistant", text: "안녕하세요! 무엇을 도와드릴까요?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [ctx, setCtx] = useState<{ widgetKey?: string; pageUrl?: string }>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // iframe이 로드되면 부모에게 준비됨 알림
    window.parent?.postMessage({ type: "WM_WIDGET_READY" }, "*");

    const onMsg = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "WM_INIT") {
        setCtx({ widgetKey: data.widgetKey, pageUrl: data.pageUrl });
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

    const userMsg: Msg = { id: uid(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // ✅ 지금은 API 없이 “가짜 응답”만
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          text: `(${ctx.widgetKey ?? "no-key"}) 페이지(${
            ctx.pageUrl ? "있음" : "없음"
          }) 확인! "${text}"에 답변할게요.`,
        },
      ]);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="h-screen w-screen bg-transparent p-0">
      <div className="h-full w-full bg-white border border-slate-200 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff4500]" />
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                상담 챗봇
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                빠르게 도와드릴게요
              </div>
            </div>
          </div>

          <button
            className="p-2 rounded-lg hover:bg-slate-100 active:scale-[0.98] transition"
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
          className="flex-1 overflow-auto px-3 py-3 bg-slate-50"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex mb-2 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={[
                  "max-w-[80%] text-[14px] leading-snug px-3 py-2 rounded-2xl border",
                  m.role === "user"
                    ? "bg-[#ff4500]/10 border-[#ff4500]/25 text-slate-900"
                    : "bg-white border-slate-200 text-slate-900",
                ].join(" ")}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex mb-2 justify-start">
              <div className="max-w-[80%] text-[14px] px-3 py-2 rounded-2xl border bg-white border-slate-200 text-slate-500">
                …
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          className="border-t border-slate-200 bg-white p-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#ff4500]/30"
            rows={1}
            placeholder="메시지를 입력하세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            type="submit"
            disabled={!canSend}
            className="px-4 rounded-xl font-extrabold text-white bg-[#ff4500] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition"
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
}
