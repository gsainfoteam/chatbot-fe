import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Share } from "lucide-react";
import { cn } from "@/lib/utils";
import Composer from "./Composer";
import ChatFooter from "./ChatFooter";
import MessageList from "./MessageList";
import ThreadMenu from "./ThreadMenu";
import { useChatShell } from "../chatShellContext";
import {
  hasActiveStream,
  sendMessage,
  stopStreaming,
  useChatStore,
  useStreaming,
  useThread,
} from "../chatStore";
import type { ChatThread } from "../types";

const COPIED_DURATION_MS = 1500;

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/** 상단 '새 질문 / 질문 기록' 버튼 (Figma 최종 03 '대화 전용 메뉴': h44, radius 10) */
const MENU_BUTTON =
  "flex h-11 shrink-0 items-center justify-center rounded-chat-md border px-[18px] text-sm font-medium text-chat-ink transition-colors";

/** 공유용 평문 대화록: "질문: …\n답변: …\n\n" 반복 + 출처 한 줄 */
function buildTranscript(thread: ChatThread): string {
  const body = thread.messages
    .filter((message) => message.text.trim().length > 0)
    .map((message) =>
      message.role === "user" ? `질문: ${message.text}` : `답변: ${message.text}\n`,
    )
    .join("\n");
  return `${body}\nGIST 챗봇 · ${window.location.origin}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * 대화(스레드) 화면 (Figma 최종 03): 대화 전용 메뉴 + 메시지 스크롤 영역 + 입력창 + 푸터.
 * ThreadPage가 threadId를 key로 넘기므로 대화가 바뀌면 입력 중인 내용·복사 상태가 초기화됩니다.
 */
export default function ThreadView() {
  const { threadId } = useParams();
  const thread = useThread(threadId);
  const streaming = useStreaming(threadId);
  const { showSources, streaming: streamingByThread } = useChatStore();
  const { sidebarCollapsed, drawerOpen, toggleSidebar, menuButtonRef } = useChatShell();
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastThreadIdRef = useRef<string | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  // 본문/출처 변화에만 스크롤. 피드백 같은 메타 갱신에는 화면이 튀지 않도록 신호 문자열로 비교
  const scrollSignal = useMemo(
    () =>
      thread
        ? thread.messages
            .map(
              (m) =>
                `${m.id}:${m.role}:${m.text.length}:${m.sources?.length ?? 0}`,
            )
            .join("|")
        : "",
    [thread],
  );
  const streamingStatus = streaming ? streaming.statusText : "";

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !threadId) return;
    // 처음 열거나 다른 대화로 바뀌면 즉시, 그 외에는 부드럽게
    const instant = lastThreadIdRef.current !== threadId;
    lastThreadIdRef.current = threadId;
    el.scrollTo({ top: el.scrollHeight, behavior: instant ? "auto" : "smooth" });
  }, [threadId, scrollSignal, streamingStatus]);

  if (!thread) return <Navigate to="/" replace />;

  // 위젯 세션이 하나라 다른 대화가 답변을 받는 동안은 이 대화에서 질문할 수 없다
  // TODO(BE 연결): 429(질문 횟수 초과) 안내가 생기면 입력창 위에 안내를 띄우고 잠근다
  const otherStreaming = !streaming && hasActiveStream(streamingByThread);

  const handleShare = async () => {
    const text = buildTranscript(thread);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: thread.title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(
        () => setCopied(false),
        COPIED_DURATION_MS,
      );
    } catch (error) {
      if (isAbortError(error)) return; // 사용자가 공유 시트를 닫음
      // 그 외 실패(권한 없음 등)는 조용히 무시
    }
  };

  const handleSubmit = () => {
    if (sendMessage(thread.id, value)) setValue("");
  };

  return (
    <>
      <h1 className="sr-only">{thread.title}</h1>

      {/* 대화 전용 메뉴: 새 질문 / 질문 기록(사이드바 열고 닫기) + 공유 · 더 보기 */}
      <div className="shrink-0 px-4 pt-4 sm:px-6 lg:px-12 lg:pt-6">
        <div className="mx-auto flex w-full max-w-[832px] items-center gap-3">
          <Link
            to="/"
            className={cn(
              MENU_BUTTON,
              "border-chat-border bg-chat-surface hover:bg-chat-hover",
              FOCUS_RING,
            )}
          >
            새 질문
          </Link>
          {/* 모바일에서는 드로어를 여는 메뉴 버튼 역할도 하므로 드로어가 닫히면 포커스가 여기로 돌아온다 */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={toggleSidebar}
            aria-expanded={drawerOpen || undefined}
            className={cn(
              MENU_BUTTON,
              "border-chat-border bg-chat-surface hover:bg-chat-hover",
              // 데스크톱에서 사이드바가 펼쳐져 있으면 선택된 상태(brand-50)로 보인다
              !sidebarCollapsed &&
                "lg:border-transparent lg:bg-chat-brand-50 lg:hover:bg-chat-brand-100/70",
              FOCUS_RING,
            )}
          >
            질문 기록
          </button>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => void handleShare()}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-chat-md px-3 text-sm font-medium text-chat-ink-2 transition-colors hover:bg-chat-hover",
                FOCUS_RING,
              )}
            >
              <Share className="size-[17px]" strokeWidth={1.8} aria-hidden="true" />
              {copied ? "복사됨" : "공유"}
            </button>
            <ThreadMenu thread={thread} />
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 pt-8 pb-4 sm:px-6 lg:px-12 lg:pt-14"
      >
        <MessageList thread={thread} streaming={streaming} showSources={showSources} />
      </div>

      <div className="flex shrink-0 justify-center px-4 pt-2 pb-5 sm:px-6 lg:px-12">
        <Composer
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          streaming={!!streaming}
          onStop={() => stopStreaming(thread.id)}
          disabled={otherStreaming}
          placeholder="이어서 궁금한 내용을 물어보세요"
          ariaLabel="이어서 질문하기"
        />
      </div>

      <ChatFooter />
    </>
  );
}
