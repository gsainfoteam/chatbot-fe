// 채팅 위젯 메인 컴포넌트

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { Globe, Megaphone } from "lucide-react";
import type {
  ColorTheme,
  ExternalSource,
  WebSource,
  WidgetContext,
  Source,
  FeedbackRating,
} from "./types";
import { applyColorTheme } from "./utils";
import AgentSteps from "./AgentSteps";
import { useWidgetConversation } from "./useWidgetConversation";
import {
  LinkIcon,
  ExternalLinkIcon,
  ArrowUpIcon,
  StopIcon,
  InfoIcon,
  FlagIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
} from "@/components/Icons";
import { openWidgetResource } from "@/api/widgetChat";
import frequentQuestions from "./frequentQuestions";

// 출처 배지 컴포넌트
function SourceBadge({ source }: { source: Source }) {
  const [blobUrl, setBlobUrl] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(
    () => () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    },
    [blobUrl],
  );
  if (source.resourcePath && !blobUrl) {
    return (
      <button
        type="button"
        disabled={busy}
        className="px-2 py-1 rounded-md text-xs border"
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          try {
            setBlobUrl(await openWidgetResource(source.resourcePath!));
          } catch {
            setFailed(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? "문서 불러오는 중…"
          : failed
            ? "문서 불러오기 실패 · 다시 시도"
            : `${source.title || "참고 문서"} · 불러오기`}
      </button>
    );
  }
  if (source.type === "url") {
    return (
      <a
        href={blobUrl || source.url}
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
          {source.title || "참고 문서"}
        </span>
        <ExternalLinkIcon className="w-3 h-3 shrink-0" />
      </a>
    );
  }

  return null;
}

// 외부 출처 배지 (Ziggle 공지, 웹 검색 출처). url은 외부 절대 URL이라 그대로 새 탭으로 연다
function ExternalSourceBadge({
  source,
}: {
  source: ExternalSource | WebSource;
}) {
  const Icon = source.kind === "notice" ? Megaphone : Globe;
  const official = "official" in source ? source.official : undefined;
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      title={
        official === false
          ? `${source.title} · 학교 공식 안내가 아닐 수 있어요`
          : official === true
            ? `${source.title} · 학교 공식 도메인입니다. 내용의 정확성이나 승인을 보증하지 않습니다.`
            : source.title
      }
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition hover:opacity-80 max-w-full min-w-0"
      style={{
        backgroundColor: "var(--color-background, #f8fafc)",
        borderColor: "var(--color-border, #e2e8f0)",
        color: "var(--color-text, #1e293b)",
      }}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{source.title}</span>
      {official !== undefined && (
        <span
          className="shrink-0 px-1 rounded text-[10px] leading-4 font-medium border"
          style={
            official
              ? {
                  color: "var(--color-primary, #df3326)",
                  borderColor: "var(--color-primary, #df3326)",
                }
              : {
                  color: "var(--color-text-secondary, #94a3b8)",
                  borderColor: "var(--color-border, #e2e8f0)",
                }
          }
        >
          {official ? "학교 공식 도메인" : "외부 출처"}
        </span>
      )}
      <ExternalLinkIcon className="w-3 h-3 shrink-0" />
    </a>
  );
}

// 출처 묶음 제목 (참고 문서 / 관련 공지 / 웹 검색 결과)
function SourceSectionTitle({ children }: { children: string }) {
  return (
    <div
      className="text-[11px] font-medium"
      style={{ color: "var(--color-text-secondary, #94a3b8)" }}
    >
      {children}
    </div>
  );
}

// 이미지 컴포넌트 (로딩 skeleton 포함)
function SourceImage({ source }: { source: Source }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-2 relative block cursor-pointer overflow-hidden rounded-lg"
    >
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

      {/* 실제 이미지 - 클릭 시 해당 url 새 탭에서 열림 */}
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
      {/* 호버 시 은은한 흰색 오버레이 - 클릭 유도 */}
      <div
        className="absolute inset-0 rounded-lg bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-20 pointer-events-none"
        aria-hidden
      />
    </a>
  );
}

// 답변 피드백 버튼 (도움이 됐어요/안 됐어요)
function FeedbackButton({
  rating,
  selected,
  disabled,
  onClick,
}: {
  rating: FeedbackRating;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const label = rating === "GOOD" ? "도움이 됐어요" : "도움이 안 됐어요";
  const Icon = rating === "GOOD" ? ThumbsUpIcon : ThumbsDownIcon;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-6 h-6 flex items-center justify-center rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      style={{
        color: selected
          ? "var(--color-primary, #df3326)"
          : "var(--color-text-secondary, #94a3b8)",
        backgroundColor: selected
          ? "color-mix(in srgb, var(--color-primary, #df3326) 10%, transparent)"
          : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
      aria-label={label}
      title={label}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
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
  const [input, setInput] = useState("");
  const isComposingRef = useRef(false);
  // iframe 환경인지 확인 (React 앱 내부에서는 false)
  const isInIframe = typeof window !== "undefined" && window.parent !== window;

  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const infoTooltipRef = useRef<HTMLDivElement | null>(null);

  const [ctx, setCtx] = useState<WidgetContext>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  // 미리보기 모드 확인 (URL 파라미터)
  const isPreviewMode =
    new URLSearchParams(window.location.search).get("preview") === "true";

  // pageUrl: loader가 iframe URL에 포함시키므로 postMessage 타이밍에 의존하지 않음
  const pageUrlFromUrl = useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("pageUrl");
      return p ? decodeURIComponent(p) : null;
    } catch {
      return null;
    }
  }, []);

  // 세션 발급 시 사용할 pageUrl (우선순위: URL 파라미터 > WM_INIT > document.referrer > location.href)
  const getEffectivePageUrl = useCallback(() => {
    return (
      pageUrlFromUrl ||
      ctx.pageUrl ||
      (isInIframe ? document.referrer : null) ||
      window.location.href
    );
  }, [pageUrlFromUrl, ctx.pageUrl, isInIframe]);

  const {
    messages,
    loading,
    feedbackBusyId,
    notice,
    limitReached,
    sendQuestion,
    regenerateAnswer,
    handleFeedback,
    stop,
    refreshHistory,
  } = useWidgetConversation({
    widgetKey: ctx.widgetKey,
    getPageUrl: getEffectivePageUrl,
    preview: isPreviewMode,
    inIframe: isInIframe,
  });
  const loadingMessage = "답변을 준비하고 있어요";
  const questionLength = [...input.trim()].length;
  const canSend =
    questionLength > 0 &&
    questionLength <= 4000 &&
    !loading &&
    !feedbackBusyId &&
    !isPreviewMode &&
    !limitReached;
  const showFrequentQuestions = messages.every((m) => m.role === "assistant");

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading || feedbackBusyId || isPreviewMode) return;
    if ([...text].length > 4000) return;
    setInput("");
    const sent = await sendQuestion(text);
    if (!sent) setInput((current) => current || text);
  };

  // 툴팁 바깥 클릭 시 닫기
  useEffect(() => {
    if (!showInfoTooltip) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        infoTooltipRef.current &&
        !infoTooltipRef.current.contains(e.target as Node)
      ) {
        setShowInfoTooltip(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showInfoTooltip]);

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

  // 답변 생성(스트리밍) 중 여부를 부모(loader.js)에 알려 런처 버튼이 상태를 표현할 수 있게 한다
  useEffect(() => {
    if (!isInIframe) return;
    window.parent?.postMessage({ type: "WM_GENERATING", active: loading }, "*");
  }, [loading, isInIframe]);

  // 메시지 본문/로딩 변화에만 하단 스크롤.
  // feedback 등 메타 갱신 시 스크롤하면 이전 답변 피드백 클릭 때 화면이 튀는 버그가 난다.
  const scrollSignal = useMemo(
    () =>
      messages
        .map(
          (m) =>
            `${m.id}:${m.role}:${m.text}:${m.sources?.length ?? 0}:${m.externalSources?.length ?? 0}:${m.webSources?.length ?? 0}:${m.steps?.map((s) => s.status).join(",") ?? ""}:${m.serverId ?? ""}:${m.regeneratedAnswer ? 1 : 0}`,
        )
        .join("|"),
    [messages],
  );

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [scrollSignal, loading]);

  return (
    <div className={className || "h-screen w-screen bg-transparent p-0"}>
      <div
        className="h-full w-full bg-white shadow-[0_16px_40px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col"
        style={{
          borderRadius: "24px",
          border: "1px solid var(--color-border, #e2e8f0)",
        }}
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
                className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight truncate"
                style={{ color: "var(--color-text, #1e293b)" }}
              >
                GIST 챗봇
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--color-primary, #df3326) 10%, transparent)",
                    color: "var(--color-primary, #df3326)",
                    boxShadow:
                      "inset 0 0 0 1px color-mix(in srgb, var(--color-primary, #df3326) 20%, transparent)",
                  }}
                >
                  Beta
                </span>
              </div>
              <div
                className="flex items-center gap-1 mt-0.5"
                style={{ color: "var(--color-text-secondary, #94a3b8)" }}
              >
                <span className="text-[10px] leading-none tracking-tight">
                  Powered by
                </span>
                <a
                  href="https://letsur.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex opacity-90 hover:opacity-100 transition-opacity"
                  aria-label="Letsur 웹사이트로 이동"
                  title="letsur.ai"
                >
                  <img
                    src="/letsur-logo.svg"
                    alt="Letsur"
                    className="h-2 w-auto object-contain"
                  />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* 신고 버튼 (경고 아이콘) */}
            <a
              href="https://cs.gistory.me?service=chatbot"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center rounded-lg transition shrink-0"
              style={{
                color: "var(--color-text-secondary, #94a3b8)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label="신고"
              title="신고"
            >
              <FlagIcon className="w-[18px] h-[18px]" />
            </a>

            {/* 면책 안내 아이콘 + 툴팁 */}
            <div className="relative group" ref={infoTooltipRef}>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                style={{
                  color: "var(--color-text-secondary, #94a3b8)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onClick={() => setShowInfoTooltip((prev) => !prev)}
                aria-label="안내"
              >
                <InfoIcon className="w-[18px] h-[18px]" />
              </button>
              <div
                className={`absolute right-0 top-full mt-1.5 w-52 px-2.5 py-1.5 rounded-lg border text-[11px] leading-relaxed z-50 shadow-md transition-all duration-200 pointer-events-none ${
                  showInfoTooltip
                    ? "opacity-100 visible"
                    : "opacity-0 invisible group-hover:opacity-100 group-hover:visible"
                }`}
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-primary, #df3326) 8%, var(--color-background, #ffffff))",
                  borderColor:
                    "color-mix(in srgb, var(--color-primary, #df3326) 20%, transparent)",
                  color: "var(--color-text, #1e293b)",
                }}
              >
                챗봇의 답변은 부정확할 수 있으니
                <br />
                공식 자료를 다시 한 번 확인해 주세요.
              </div>
            </div>

            {/* 닫기 버튼 */}
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg active:scale-[0.98] transition"
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
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-auto px-3 py-3 flex flex-col"
          style={{
            backgroundColor: "var(--color-background, #f8fafc)",
          }}
        >
          {messages.map((m, msgIdx) => (
            <Fragment key={m.id}>
              <div
                className={`flex mb-2 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className="max-w-[80%] text-[14px] leading-snug px-3 py-2 rounded-2xl border wrap-break-words"
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
                      <>
                        {/* 답변이 시작되면 진행 단계는 요약 한 줄로 접힘 */}
                        {m.steps && m.steps.length > 0 && (
                          <AgentSteps steps={m.steps} live={false} />
                        )}
                        <Streamdown
                          plugins={{ code }}
                          skipHtml
                          rehypePlugins={[]}
                          components={{
                            a: ({ href, children }) => (
                              <a
                                href={
                                  href && /^https?:\/\//i.test(href)
                                    ? href
                                    : undefined
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                          }}
                          isAnimating={m.status === "streaming"}
                          className="text-[var(--color-text,#1e293b)] [&_a]:text-[var(--color-primary,var(--color-button,#df3326))]"
                        >
                          {m.text}
                        </Streamdown>
                      </>
                    ) : m.steps && m.steps.length > 0 ? (
                      // 에이전트 경로: 첫 답변 조각 전까지 실제 진행 단계를 표시
                      <AgentSteps
                        steps={m.steps}
                        live={
                          m.status === "waiting" ||
                          m.status === "researching" ||
                          m.status === "streaming"
                        }
                      />
                    ) : m.status === "waiting" ||
                      m.status === "researching" ||
                      m.status === "streaming" ? (
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
                    ) : null
                  ) : (
                    m.text
                  )}

                  {m.notice && (
                    <p
                      role="status"
                      className="mt-2 text-xs text-[var(--color-text-secondary,#64748b)]"
                    >
                      {m.notice}
                    </p>
                  )}

                  {/* 출처 정보 표시 (assistant 메시지만) */}
                  {m.role === "assistant" &&
                    ((m.sources?.length ?? 0) > 0 ||
                      (m.externalSources?.length ?? 0) > 0 ||
                      (m.webSources?.length ?? 0) > 0) && (
                      <div
                        className="mt-2 pt-3 border-t flex flex-col gap-2.5"
                        style={{
                          borderTopColor: "var(--color-border, #e2e8f0)",
                        }}
                      >
                        {/* 리소스 센터 문서 */}
                        {m.sources && m.sources.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <SourceSectionTitle>참고 문서</SourceSectionTitle>
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
                                <SourceImage
                                  key={`img-${idx}`}
                                  source={source}
                                />
                              ))}
                          </div>
                        )}

                        {/* Ziggle 공지 */}
                        {m.externalSources && m.externalSources.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <SourceSectionTitle>관련 공지</SourceSectionTitle>
                            <div className="flex flex-wrap gap-1.5">
                              {m.externalSources.map((source) => (
                                <ExternalSourceBadge
                                  key={source.url}
                                  source={source}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 웹 검색 출처 (공식 도메인 여부를 구분) */}
                        {m.webSources && m.webSources.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <SourceSectionTitle>
                              웹 검색 결과
                            </SourceSectionTitle>
                            <div className="flex flex-wrap gap-1.5">
                              {m.webSources.map((source) => (
                                <ExternalSourceBadge
                                  key={source.url}
                                  source={source}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {/* 답변 피드백 버튼 (서버에 저장된 assistant 답변에만 표시) */}
              {m.role === "assistant" &&
                m.serverId &&
                m.status === "completed" && (
                  <div className="flex items-center gap-0.5 -mt-1 mb-2 pl-1">
                    <FeedbackButton
                      rating="GOOD"
                      selected={m.feedback === "GOOD"}
                      disabled={
                        loading || feedbackBusyId !== null || isPreviewMode
                      }
                      onClick={() => void handleFeedback(m, "GOOD")}
                    />
                    <FeedbackButton
                      rating="BAD"
                      selected={m.feedback === "BAD"}
                      disabled={
                        loading || feedbackBusyId !== null || isPreviewMode
                      }
                      onClick={() => void handleFeedback(m, "BAD")}
                    />
                    {m.feedback === "BAD" &&
                      !m.regeneratedAnswer &&
                      !m.regenerationAttempted && (
                        <button
                          type="button"
                          disabled={
                            loading || !!feedbackBusyId || isPreviewMode
                          }
                          className="ml-2 text-xs underline disabled:opacity-40"
                          onClick={() => void regenerateAnswer(m)}
                        >
                          답변 다시 생성
                        </button>
                      )}
                    {m.regenerationAttempted && (
                      <span className="ml-2 text-[10px]">재생성 요청됨</span>
                    )}
                    {m.regeneratedAnswer ? (
                      <span
                        className="ml-1 text-[10px]"
                        style={{
                          color: "var(--color-text-secondary, #94a3b8)",
                        }}
                      >
                        다시 생성된 답변
                      </span>
                    ) : (
                      !m.feedback && (
                        <span
                          className="ml-1 text-[10px]"
                          style={{
                            color: "var(--color-text-secondary, #94a3b8)",
                          }}
                        >
                          답변이 도움이 되었나요?
                        </span>
                      )
                    )}
                  </div>
                )}

              {/* 첫 번째 메시지 뒤에 자주 묻는 질문 표시 */}
              {msgIdx === 0 &&
                showFrequentQuestions &&
                frequentQuestions.length > 0 && (
                  <div className="mt-1 mb-2 w-full">
                    <div
                      className="text-[11px] font-medium mb-1.5 px-0.5"
                      style={{
                        color: "var(--color-text-secondary, #94a3b8)",
                      }}
                    >
                      이런 것들을 물어보세요
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {frequentQuestions.map((fq, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 active:scale-[0.98] cursor-pointer"
                          style={{
                            backgroundColor:
                              "var(--color-assistant-message-bg, #ffffff)",
                            borderColor: "var(--color-border, #e2e8f0)",
                            color: "var(--color-text, #1e293b)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor =
                              "color-mix(in srgb, var(--color-primary, #df3326) 40%, var(--color-border, #e2e8f0))";
                            e.currentTarget.style.boxShadow =
                              "0 1px 4px rgba(0,0,0,0.06)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--color-border, #e2e8f0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                          disabled={
                            loading ||
                            !!feedbackBusyId ||
                            isPreviewMode ||
                            limitReached
                          }
                          onClick={() => void send(fq.question || fq.label)}
                        >
                          <span className="text-base leading-none shrink-0">
                            {fq.icon}
                          </span>
                          <span className="text-xs font-medium truncate">
                            {fq.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </Fragment>
          ))}

          {loading &&
            !messages.some((m) =>
              ["waiting", "researching", "streaming"].includes(m.status ?? ""),
            ) && (
              <p
                role="status"
                className="px-2 py-1 text-xs text-[var(--color-text-secondary,#64748b)]"
              >
                대화 기록을 확인하고 있어요.
              </p>
            )}
        </div>

        {notice && (
          <div
            role="status"
            className="px-3 py-2 text-xs border-t text-[var(--color-text,#1e293b)]"
          >
            {notice}
            <button
              type="button"
              className="ml-2 underline disabled:opacity-40"
              disabled={loading}
              onClick={() => void refreshHistory()}
            >
              대화 기록 다시 확인
            </button>
          </div>
        )}
        {limitReached && !notice && (
          <p className="px-3 py-2 text-xs">
            이 세션의 질문 5회를 모두 사용했습니다.
          </p>
        )}
        {questionLength > 4000 && (
          <p role="alert" className="px-3 py-2 text-xs">
            질문은 최대 4,000자까지 입력할 수 있습니다. (
            {questionLength.toLocaleString()}자)
          </p>
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
              onClick={stop}
              disabled={
                !messages.some((m) =>
                  ["waiting", "researching", "streaming"].includes(
                    m.status ?? "",
                  ),
                )
              }
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
