import {
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ArrowUp, Paperclip, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common";

export interface ComposerProps {
  /** hero: 홈 중앙 입력창(2행, 하단 도구 행) / compact: 스레드 하단 입력창(1행) */
  variant: "hero" | "compact";
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** 답변 생성 중이면 전송 버튼이 중지 버튼으로 바뀝니다 */
  streaming?: boolean;
  onStop?: () => void;
  disabled?: boolean;
  placeholder: string;
  ariaLabel: string;
  /** hero 변형의 하단 좌측 도구 영역 (예: 출처 공지 함께 보기 토글) */
  tools?: ReactNode;
  autoFocus?: boolean;
  className?: string;
}

const MAX_TEXTAREA_HEIGHT = 200;

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/** 시안의 textarea:focus-visible 링을 둥근 입력창 컨테이너에 표시 (버튼 포커스에는 반응하지 않음) */
const TEXTAREA_FOCUS_RING =
  "has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-chat-brand";

/**
 * 질문 입력창. Enter 전송 / Shift+Enter 줄바꿈, 한글 조합 중 Enter 무시.
 * 파일 첨부 버튼은 시안에 있지만 위젯 API에 업로드가 없어 비활성 상태로 둡니다
 * (HANDOFF.md "구현 메모" 참고).
 */
export default function Composer({
  variant,
  value,
  onChange,
  onSubmit,
  streaming = false,
  onStop,
  disabled = false,
  placeholder,
  ariaLabel,
  tools,
  autoFocus = false,
  className,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isComposingRef = useRef(false);
  const canSend = value.trim().length > 0 && !streaming && !disabled;

  // 내용에 맞춰 높이 자동 조절 (최대 200px)
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (isComposingRef.current || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (canSend) onSubmit();
  };

  const textarea = (
    <textarea
      ref={textareaRef}
      rows={variant === "hero" ? 2 : 1}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onCompositionStart={() => {
        isComposingRef.current = true;
      }}
      onCompositionEnd={() => {
        // 조합 종료 직후의 Enter를 전송으로 오인하지 않도록 한 틱 늦춘다
        setTimeout(() => {
          isComposingRef.current = false;
        }, 0);
      }}
      onKeyDown={handleKeyDown}
      className="min-w-0 flex-1 resize-none border-0 bg-transparent text-base leading-[1.6] text-chat-ink outline-none placeholder:text-chat-subtle disabled:cursor-not-allowed"
    />
  );

  const attachButton = (
    <Tooltip content="파일 첨부는 준비 중이에요" className="font-chat">
      <button
        type="button"
        aria-label="파일 첨부"
        aria-disabled="true"
        className={cn(
          "flex size-10 shrink-0 cursor-not-allowed items-center justify-center rounded-full text-chat-muted opacity-50",
          FOCUS_RING,
        )}
      >
        <Paperclip className="size-5" strokeWidth={1.8} aria-hidden="true" />
      </button>
    </Tooltip>
  );

  const actionButton = streaming ? (
    <button
      type="button"
      onClick={onStop}
      aria-label="응답 중지"
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full bg-chat-brand text-chat-on-brand transition-colors hover:bg-chat-brand-strong",
        FOCUS_RING,
      )}
    >
      <Square className="size-4 fill-current" aria-hidden="true" />
    </button>
  ) : (
    <button
      type="submit"
      disabled={!canSend}
      aria-label="보내기"
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full bg-chat-brand text-chat-on-brand transition-colors hover:bg-chat-brand-strong disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-chat-brand",
        FOCUS_RING,
      )}
    >
      <ArrowUp className="size-5" strokeWidth={2.2} aria-hidden="true" />
    </button>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSend) onSubmit();
  };

  if (variant === "hero") {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex w-full max-w-[760px] flex-col gap-2.5 rounded-chat-xl border border-chat-border bg-chat-surface px-[22px] pt-[18px] pr-[18px] pb-3 shadow-chat-composer",
          TEXTAREA_FOCUS_RING,
          className,
        )}
      >
        {textarea}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            {attachButton}
            {tools}
          </div>
          {actionButton}
        </div>
      </form>
    );
  }

  // 시안: align-items:center, padding 10px 10px 10px 8px, gap 6px
  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full max-w-[760px] items-center gap-1.5 rounded-chat-xl border border-chat-border bg-chat-surface py-2.5 pr-2.5 pl-2 shadow-chat-composer",
        TEXTAREA_FOCUS_RING,
        className,
      )}
    >
      {attachButton}
      {textarea}
      {actionButton}
    </form>
  );
}
