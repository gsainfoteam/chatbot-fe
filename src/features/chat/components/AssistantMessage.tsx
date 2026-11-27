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

/**
 * 챗봇 답변 (Figma 최종 03 'Assistant response'):
 * 'GIST 챗봇' 라벨 → 본문(마크다운) → 함께 확인할 자료 → 원문 확인 안내 → 피드백 → 후속 질문
 */
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
      <div className="flex items-center gap-1.5 text-base leading-normal sm:text-lg">
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
      <p className="text-base leading-normal break-words text-chat-muted sm:text-lg">
        {message.text}
      </p>
    );
  } else {
    body = (
      <Streamdown
        plugins={{ code }}
        isAnimating={isStreaming}
        className="min-w-0 text-base leading-normal break-words text-chat-ink sm:text-lg [&_a]:text-chat-brand-text [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_pre]:text-[13px] [&_table]:text-sm"
      >
        {message.text}
      </Streamdown>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-[18px]">
      <p className="text-lg leading-normal font-semibold text-chat-brand-text">GIST 챗봇</p>

      {body}

      {showCards && <SourceCards sources={sources} />}

      {showWarning && (
        <p className="text-xs leading-normal break-keep text-chat-muted">{WARNING_TEXT}</p>
      )}

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
  );
}
