import { Info } from "lucide-react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { hasActiveStream, sendMessage, useChatStore } from "../chatStore";
import type { ChatThread, ThreadMessage } from "../types";
import SourceCards from "./SourceCards";
import FeedbackBar from "./FeedbackBar";
import FollowUpChips from "./FollowUpChips";

interface AssistantMessageProps {
  thread: ChatThread;
  message: ThreadMessage;
  /** 이 메시지가 지금 생성 중인지 */
  isStreaming: boolean;
  /** 생성 중 안내 문구 (자료를 찾아보는 중 …) */
  statusText: string;
  showSources: boolean;
  /** 이 메시지의 피드백 요청이 진행 중인지 */
  feedbackBusy: boolean;
}

const WARNING_TEXT =
  "기간·마감은 바뀔 수 있어요. 신청 전에 원문 공지를 꼭 확인해 주세요.";

/** 챗봇 답변: 아바타 + 본문(마크다운) + 원문 확인 경고 + 출처 카드 + 피드백 + 후속 질문 */
export default function AssistantMessage({
  thread,
  message,
  isStreaming,
  statusText,
  showSources,
  feedbackBusy,
}: AssistantMessageProps) {
  // 위젯 세션이 하나라 어느 대화든 생성 중이면 후속 질문을 보낼 수 없다
  const { streaming } = useChatStore();
  const anyStreaming = hasActiveStream(streaming);
  const sources = message.sources ?? [];
  const isComplete = !isStreaming && !message.error;
  const showWarning = isComplete && sources.length > 0;
  const showCards = showSources && sources.length > 0 && !isStreaming;
  const showFeedback = !!message.serverId && isComplete;

  let body;
  if (!message.text && isStreaming) {
    body = (
      <div className="flex items-center gap-1.5 text-[15px] leading-[1.65]">
        <span className="loading-text-shimmer">{statusText}</span>
        <span className="flex items-center gap-1.5 text-chat-subtle">
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
        </span>
      </div>
    );
  } else if (message.error) {
    body = (
      <p className="text-[15px] leading-[1.65] break-words text-chat-muted">
        {message.text}
      </p>
    );
  } else {
    body = (
      <Streamdown
        plugins={{ code }}
        isAnimating={isStreaming}
        className="min-w-0 text-[15px] leading-[1.65] break-words text-chat-ink [&_a]:text-chat-brand-text [&_pre]:text-[13px] [&_table]:text-sm"
      >
        {message.text}
      </Streamdown>
    );
  }

  return (
    <div className="flex items-start gap-3.5">
      <img
        src="/logo.svg"
        alt=""
        aria-hidden="true"
        className="size-8 shrink-0 rounded-full"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3.5 pt-1">
        {body}

        {showWarning && (
          <div className="flex items-center gap-2.5 rounded-chat-md border border-chat-brand-100 bg-chat-brand-50 px-3.5 py-2.5 text-[13px] leading-5 font-medium text-chat-brand-strong">
            <Info className="size-[17px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
            <span>{WARNING_TEXT}</span>
          </div>
        )}

        {showCards && <SourceCards sources={sources} />}

        {showFeedback && (
          <FeedbackBar thread={thread} message={message} disabled={feedbackBusy} />
        )}

        {isComplete && (
          <FollowUpChips
            questions={message.followUps}
            onPick={(question) => sendMessage(thread.id, question)}
            disabled={anyStreaming}
          />
        )}
      </div>
    </div>
  );
}
