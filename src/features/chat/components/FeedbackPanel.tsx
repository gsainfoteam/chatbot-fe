import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatFeedback } from "../types";

/** 👎 이유 (Figma '불만족 선택시' 139:1302 순서 그대로) */
export const FEEDBACK_REASONS = [
  "질문과 관련 없는 답변",
  "사실이 아닌 답변",
  "접근 불가능한 파일/링크를 제공",
  "기타",
] as const;

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

interface FeedbackPanelProps {
  rating: ChatFeedback;
  onSubmit: (comment: { reasons: string[]; text: string }) => void;
  onClose: () => void;
}

/**
 * 👍/👎 직후 답변 아래에 바로 열리는 의견 패널.
 * 👎: 이유 체크박스 + 자유 입력 / 👍: 자유 입력만. Esc로 닫습니다.
 */
export default function FeedbackPanel({ rating, onSubmit, onClose }: FeedbackPanelProps) {
  const titleId = useId();
  const [reasons, setReasons] = useState<string[]>([]);
  const [text, setText] = useState("");
  const firstReasonRef = useRef<HTMLInputElement | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const isBad = rating === "BAD";
  const canSubmit = text.trim().length > 0 || reasons.length > 0;

  // 패널이 열리면 첫 입력 요소로 포커스 (👎: 첫 이유, 👍: 입력란)
  useEffect(() => {
    (isBad ? firstReasonRef.current : textRef.current)?.focus();
  }, [isBad]);

  const toggleReason = (reason: string) => {
    setReasons((current) =>
      current.includes(reason) ? current.filter((r) => r !== reason) : [...current, reason],
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    onClose();
  };

  return (
    <form
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ reasons, text });
      }}
      className="flex flex-col gap-3 rounded-chat-lg border border-chat-border bg-chat-surface p-4"
    >
      <p id={titleId} className="text-sm leading-normal font-semibold text-chat-ink">
        {isBad ? "어떤 점이 아쉬웠나요?" : "어떤 점이 도움이 됐나요?"}
      </p>

      {isBad && (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">아쉬운 이유 (여러 개 고를 수 있어요)</legend>
          {FEEDBACK_REASONS.map((reason, index) => {
            const checked = reasons.includes(reason);
            return (
              <label
                key={reason}
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2 rounded-chat-md border px-3 text-[13px] font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-chat-brand",
                  checked
                    ? "border-chat-brand-100 bg-chat-brand-50 text-chat-brand-strong"
                    : "border-chat-border bg-chat-surface text-chat-ink-2 hover:bg-chat-hover",
                )}
              >
                <input
                  ref={index === 0 ? firstReasonRef : undefined}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleReason(reason)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                    checked
                      ? "border-chat-brand bg-chat-brand text-chat-on-brand"
                      : "border-chat-subtle",
                  )}
                >
                  {checked && <Check className="size-3" strokeWidth={3} />}
                </span>
                {reason}
              </label>
            );
          })}
        </fieldset>
      )}

      <textarea
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={500}
        aria-label={isBad ? "아쉬운 점 자세히 적기 (선택)" : "도움이 된 점 적기 (선택)"}
        placeholder={
          isBad ? "더 알려주실 내용이 있다면 적어 주세요 (선택)" : "자유롭게 적어 주세요 (선택)"
        }
        className="min-h-16 resize-none rounded-chat-md border border-chat-border bg-chat-surface px-3 py-2 text-sm leading-normal text-chat-ink outline-none placeholder:text-chat-subtle focus:border-chat-brand"
      />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "flex h-9 items-center rounded-chat-md px-3 text-sm font-medium text-chat-ink-2 transition-colors hover:bg-chat-hover",
            FOCUS_RING,
          )}
        >
          닫기
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "flex h-9 items-center rounded-chat-md bg-chat-brand px-4 text-sm font-medium text-chat-on-brand transition-colors hover:bg-chat-brand-strong disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-chat-brand",
            FOCUS_RING,
          )}
        >
          보내기
        </button>
      </div>
    </form>
  );
}
