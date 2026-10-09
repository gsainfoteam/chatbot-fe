import type { ThreadMessage } from "../types";

interface UserMessageProps {
  message: ThreadMessage;
}

/**
 * 사용자 질문 버블 (우측 정렬, 우하단만 작은 radius).
 * 긴 URL처럼 띄어쓰기 없는 텍스트도 컬럼을 넘지 않도록 wrap-anywhere + 폭 상한 100%.
 */
export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="max-w-[min(520px,100%)] self-end rounded-[16px_16px_6px_16px] bg-chat-hover px-4 py-3 text-[15px] leading-[1.65] wrap-anywhere whitespace-pre-wrap text-chat-ink">
      {message.text}
    </div>
  );
}
