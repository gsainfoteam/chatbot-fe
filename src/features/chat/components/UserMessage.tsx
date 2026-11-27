import type { ThreadMessage } from "../types";

interface UserMessageProps {
  message: ThreadMessage;
}

/**
 * 사용자 질문 버블 (Figma 최종 03 'User question': 우측 정렬, brand-50 배경, radius 18).
 * 긴 URL처럼 띄어쓰기 없는 텍스트도 컬럼을 넘지 않도록 wrap-anywhere + 폭 상한 100%.
 */
export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="max-w-[min(560px,100%)] self-end rounded-[18px] bg-chat-brand-50 p-4 text-base leading-normal font-medium wrap-anywhere whitespace-pre-wrap text-chat-ink sm:p-5 sm:text-lg">
      {message.text}
    </div>
  );
}
