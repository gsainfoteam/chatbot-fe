import { useEffect, useRef, useState } from "react";
import { Check, Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common";
import {
  submitFeedback,
  submitFeedbackComment,
  useChatStore,
  useStreaming,
} from "../chatStore";
import type { ChatFeedback, ChatThread, ThreadMessage } from "../types";
import FeedbackPanel from "./FeedbackPanel";

interface FeedbackBarProps {
  thread: ChatThread;
  message: ThreadMessage;
  disabled?: boolean;
}

const COPIED_DURATION_MS = 1500;

const iconButtonClass =
  "flex size-[34px] items-center justify-center rounded-chat-md text-chat-subtle transition-colors hover:bg-chat-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

/**
 * 답변 아래 액션 행: 복사 / 도움됨 / 도움 안 됨.
 * 👍/👎를 누르면 평가를 바로 보내고, 그 아래에 의견 패널을 바로 엽니다 (👎여도 답변을 다시 만들지 않음).
 */
export default function FeedbackBar({
  thread,
  message,
  disabled = false,
}: FeedbackBarProps) {
  const { feedbackBusy } = useChatStore();
  const streaming = useStreaming(thread.id);
  const [copied, setCopied] = useState(false);
  // 열린 의견 패널의 평가 (null이면 닫힘)
  const [panelRating, setPanelRating] = useState<ChatFeedback | null>(null);
  const [thanks, setThanks] = useState(false);
  const copiedTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const isDisabled = !!feedbackBusy[message.id] || !!streaming || disabled;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(
        () => setCopied(false),
        COPIED_DURATION_MS,
      );
    } catch {
      // 클립보드 권한이 없으면 조용히 무시
    }
  };

  const handleFeedback = (rating: ChatFeedback) => {
    void submitFeedback(thread.id, message.id, rating);
    setThanks(false);
    setPanelRating(rating);
  };

  const handleCommentSubmit = (comment: {
    reasons: string[];
    text: string;
  }) => {
    submitFeedbackComment(thread.id, message.id, comment);
    setPanelRating(null);
    setThanks(true);
  };

  const thumbClass = (rating: ChatFeedback) =>
    cn(
      iconButtonClass,
      message.feedback === rating && "bg-chat-brand-50 text-chat-brand",
    );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="-ml-2 flex items-center gap-0.5">
        <Tooltip content="답변 복사" className="font-chat">
          <button
            type="button"
            aria-label="답변 복사"
            onClick={() => void handleCopy()}
            className={iconButtonClass}
          >
            {copied ? (
              <Check
                className="size-[17px]"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            ) : (
              <Copy
                className="size-[17px]"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            )}
          </button>
        </Tooltip>

        <Tooltip content="도움이 됐어요" className="font-chat">
          <button
            type="button"
            aria-label="도움이 됐어요"
            aria-pressed={message.feedback === "GOOD"}
            aria-expanded={panelRating === "GOOD"}
            disabled={isDisabled}
            onClick={() => handleFeedback("GOOD")}
            className={thumbClass("GOOD")}
          >
            <ThumbsUp
              className="size-[17px]"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>
        </Tooltip>

        <Tooltip content="도움이 안 됐어요" className="font-chat">
          <button
            type="button"
            aria-label="도움이 안 됐어요"
            aria-pressed={message.feedback === "BAD"}
            aria-expanded={panelRating === "BAD"}
            disabled={isDisabled}
            onClick={() => handleFeedback("BAD")}
            className={thumbClass("BAD")}
          >
            <ThumbsDown
              className="size-[17px]"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>
        </Tooltip>
      </div>

      {panelRating && (
        <FeedbackPanel
          key={panelRating}
          rating={panelRating}
          onSubmit={handleCommentSubmit}
          onClose={() => setPanelRating(null)}
        />
      )}

      {thanks && (
        <p role="status" className="text-[13px] leading-normal text-chat-muted">
          의견을 보내 주셔서 고마워요.
        </p>
      )}
    </div>
  );
}
