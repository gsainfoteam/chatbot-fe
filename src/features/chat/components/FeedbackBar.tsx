import { useEffect, useRef, useState } from "react";
import { Check, Copy, RotateCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common";
import {
  canRegenerate,
  regenerateAnswer,
  submitFeedback,
  useChatStore,
  useStreaming,
} from "../chatStore";
import type { ChatFeedback, ChatThread, ThreadMessage } from "../types";

interface FeedbackBarProps {
  thread: ChatThread;
  message: ThreadMessage;
  disabled?: boolean;
}

const COPIED_DURATION_MS = 1500;

const iconButtonClass =
  "flex size-[34px] items-center justify-center rounded-chat-md text-chat-subtle transition-colors hover:bg-chat-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

/** 답변 아래 액션 행: 복사 / 도움됨 / 도움 안 됨 / 다시 답변 받기 */
export default function FeedbackBar({
  thread,
  message,
  disabled = false,
}: FeedbackBarProps) {
  const { feedbackBusy } = useChatStore();
  const streaming = useStreaming(thread.id);
  const [copied, setCopied] = useState(false);
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
  };

  const handleRegenerate = () => {
    void regenerateAnswer(thread.id, message.id);
  };

  const thumbClass = (rating: ChatFeedback) =>
    cn(
      iconButtonClass,
      message.feedback === rating && "bg-chat-brand-50 text-chat-brand",
    );

  return (
    <div className="-ml-2 flex items-center gap-0.5">
      <Tooltip content="답변 복사" className="font-chat">
        <button
          type="button"
          aria-label="답변 복사"
          onClick={() => void handleCopy()}
          className={iconButtonClass}
        >
          {copied ? (
            <Check className="size-[17px]" strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <Copy className="size-[17px]" strokeWidth={1.8} aria-hidden="true" />
          )}
        </button>
      </Tooltip>

      <Tooltip content="도움이 됐어요" className="font-chat">
        <button
          type="button"
          aria-label="도움이 됐어요"
          aria-pressed={message.feedback === "GOOD"}
          disabled={isDisabled}
          onClick={() => handleFeedback("GOOD")}
          className={thumbClass("GOOD")}
        >
          <ThumbsUp className="size-[17px]" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </Tooltip>

      <Tooltip content="도움이 안 됐어요" className="font-chat">
        <button
          type="button"
          aria-label="도움이 안 됐어요"
          aria-pressed={message.feedback === "BAD"}
          disabled={isDisabled}
          onClick={() => handleFeedback("BAD")}
          className={thumbClass("BAD")}
        >
          <ThumbsDown className="size-[17px]" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </Tooltip>

      {canRegenerate(thread, message) && (
        <Tooltip content="답변을 다시 생성해요 (한 번만 가능)" className="font-chat">
          <button
            type="button"
            aria-label="다시 답변 받기"
            disabled={isDisabled}
            onClick={handleRegenerate}
            className={iconButtonClass}
          >
            <RotateCw className="size-[17px]" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </Tooltip>
      )}

      {message.regeneratedAnswer && (
        <span className="ml-1 text-xs text-chat-subtle">다시 생성된 답변</span>
      )}
    </div>
  );
}
