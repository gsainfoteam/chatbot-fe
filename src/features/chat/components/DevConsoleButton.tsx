import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common";
import { DocumentSearchIcon } from "./SidebarIcons";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/** 기본: 흰 바탕 + 회색 글자 / 호버·누름: 브랜드 테두리 + 옅은 브랜드 바탕 (Figma '02 후 (2)') */
const STATE_CLASS =
  "border border-chat-sidebar-border bg-chat-surface text-chat-sidebar-muted transition-colors hover:border-chat-brand hover:bg-chat-brand-50 hover:text-chat-brand-strong active:border-chat-brand active:bg-chat-brand-50 active:text-chat-brand-strong";

interface DevConsoleButtonProps {
  /** row: 사이드바 하단 전체 폭 버튼 / icon: 접힌 레일의 아이콘 버튼 */
  variant?: "row" | "icon";
}

/**
 * 사이드바 하단 '개발자 콘솔 바로가기' 버튼 (Figma '02 후' · '03 후' 하단 버튼, 문구만 '콘솔'로).
 * TODO: 개발자 콘솔 연결 — 로그인 안 됐으면 /login, 로그인돼 있으면 관리자 화면으로 이동 (다른 팀원 담당)
 */
export default function DevConsoleButton({ variant = "row" }: DevConsoleButtonProps) {
  if (variant === "icon") {
    return (
      <Tooltip content="개발자 콘솔 바로가기" side="right" className="font-chat">
        <button
          type="button"
          aria-label="개발자 콘솔 바로가기"
          className={cn("flex size-9 items-center justify-center rounded-chat-md", STATE_CLASS, FOCUS_RING)}
        >
          <DocumentSearchIcon className="size-4" aria-hidden="true" />
        </button>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "flex w-full shrink-0 items-center justify-center gap-2 rounded-chat-md px-5 py-2 text-sm leading-normal font-medium",
        STATE_CLASS,
        FOCUS_RING,
      )}
    >
      <DocumentSearchIcon className="size-4 shrink-0" aria-hidden="true" />
      개발자 콘솔 바로가기
    </button>
  );
}
