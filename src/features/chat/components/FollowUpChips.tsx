interface FollowUpChipsProps {
  questions?: string[];
  onPick: (question: string) => void;
  disabled?: boolean;
}

/** 답변 아래 후속 질문 칩. 백엔드가 제안을 주지 않으면 아무것도 렌더하지 않습니다. */
export default function FollowUpChips({
  questions,
  onPick,
  disabled = false,
}: FollowUpChipsProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onPick(question)}
          className="h-11 max-w-full truncate rounded-chat-md border border-chat-border bg-chat-surface px-[18px] text-sm font-medium text-chat-ink transition-colors hover:border-chat-brand-100 hover:bg-chat-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
