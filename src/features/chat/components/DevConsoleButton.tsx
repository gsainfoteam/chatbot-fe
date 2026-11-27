import { SquareTerminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

interface DevConsoleButtonProps {
  /** row: 사이드바 하단 전체 폭 버튼 / icon: 접힌 레일의 아이콘 버튼 */
  variant?: "row" | "icon";
}

/**
 * 사이드바 하단 '개발자 콘솔' 버튼 (Figma 최종 04 '개발자 도구' 버튼 스타일).
 * TODO: 개발자 콘솔 연결 — 로그인 안 됐으면 /login, 로그인돼 있으면 관리자 화면으로 이동 (다른 팀원 담당)
 */
export default function DevConsoleButton({ variant = "row" }: DevConsoleButtonProps) {
  if (variant === "icon") {
    return (
      <Tooltip content="개발자 콘솔" side="right" className="font-chat">
        <button
          type="button"
          aria-label="개발자 콘솔"
          className={cn(
            "flex size-9 items-center justify-center rounded-chat-md bg-chat-brand text-chat-on-brand transition-colors hover:bg-chat-brand-strong",
            FOCUS_RING,
          )}
        >
          <SquareTerminal className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "flex h-11 w-full shrink-0 items-center justify-center rounded-chat-md bg-chat-brand text-sm font-medium text-chat-on-brand transition-colors hover:bg-chat-brand-strong",
        FOCUS_RING,
      )}
    >
      개발자 콘솔
    </button>
  );
}
