import { Link, useLocation } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common";
import DevConsoleButton from "./DevConsoleButton";
import { SidebarToggleIcon } from "./SidebarIcons";

interface ChatSidebarRailProps {
  /** 사이드바 펼치기. focusSearch면 펼친 뒤 질문 검색에 포커스 */
  onOpen: (options?: { focusSearch?: boolean }) => void;
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/** 접힌 레일의 36px 원형 버튼 */
const RAIL_BUTTON = cn(
  "flex size-9 items-center justify-center rounded-full text-chat-sidebar-muted transition-colors hover:bg-chat-hover hover:text-chat-sidebar-ink",
  FOCUS_RING,
);

/**
 * 접힌 사이드바(64px 레일).
 * - 맨 위 로고가 "사이드바 열기" 버튼: 마우스를 올리거나 포커스하면 로고 대신 열기 아이콘이 보입니다
 * - 새 질문 · 질문 검색 바로가기, 맨 아래 '개발자 콘솔 바로가기' 아이콘 버튼
 */
export default function ChatSidebarRail({ onOpen }: ChatSidebarRailProps) {
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  return (
    <div className="flex h-full w-16 flex-col items-center border-r border-chat-sidebar-border bg-chat-sidebar px-3 py-6">
      {/* 로고 행: 펼친 사이드바의 로고 행(44px)과 같은 높이 */}
      <div className="flex h-11 items-center">
        <Tooltip content="사이드바 열기" side="right" className="font-chat">
          <button
            type="button"
            onClick={() => onOpen()}
            aria-label="사이드바 열기"
            className={cn("group", RAIL_BUTTON)}
          >
            <img
              src="/logo-mark.svg"
              alt=""
              aria-hidden="true"
              className="size-7 object-contain group-hover:hidden group-focus-visible:hidden"
            />
            <SidebarToggleIcon
              className="hidden h-[18px] w-[23px] group-hover:block group-focus-visible:block"
              aria-hidden="true"
            />
          </button>
        </Tooltip>
      </div>

      {/* 펼친 사이드바의 새 질문 버튼과 같은 세로 위치: 로고 행 아래 24px */}
      <nav aria-label="바로 가기" className="mt-6 flex flex-col items-center gap-1.5">
        <Tooltip content="새 질문" side="right" className="font-chat">
          <Link
            to="/"
            aria-label="새 질문"
            aria-current={onHome ? "page" : undefined}
            className={cn(
              RAIL_BUTTON,
              onHome &&
                "bg-chat-brand-50 text-chat-brand-strong hover:bg-chat-brand-100/70 hover:text-chat-brand-strong",
            )}
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
          </Link>
        </Tooltip>
        <Tooltip content="질문 검색" side="right" className="font-chat">
          <button
            type="button"
            onClick={() => onOpen({ focusSearch: true })}
            aria-label="질문 검색"
            className={RAIL_BUTTON}
          >
            <Search className="size-4" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </Tooltip>
      </nav>

      {/* 펼친 사이드바 하단의 개발자 콘솔 바로가기 버튼과 같은 세로 위치 */}
      <div className="mt-auto flex h-[39px] items-center">
        <DevConsoleButton variant="icon" />
      </div>
    </div>
  );
}
