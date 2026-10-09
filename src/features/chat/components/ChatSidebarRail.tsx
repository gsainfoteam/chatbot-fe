import { Link, useLocation } from "react-router-dom";
import { PanelLeftOpen, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common";
import SettingsMenu from "./SettingsMenu";
import UserCard from "./UserCard";

interface ChatSidebarRailProps {
  /** 사이드바 펼치기. focusSearch면 펼친 뒤 채팅 검색에 포커스 */
  onOpen: (options?: { focusSearch?: boolean }) => void;
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

const RAIL_BUTTON = cn(
  "flex size-10 items-center justify-center rounded-full text-chat-ink-2 transition-colors hover:bg-chat-hover hover:text-chat-ink",
  FOCUS_RING,
);

/**
 * 접힌 사이드바(64px 레일). Gemini 레이아웃을 따릅니다.
 * - 맨 위 로고가 "사이드바 열기" 버튼: 마우스를 올리거나 포커스하면 로고 대신 열기 아이콘이 보입니다
 * - 새 채팅 · 채팅 검색 바로가기, 맨 아래 설정 메뉴와 계정
 */
export default function ChatSidebarRail({ onOpen }: ChatSidebarRailProps) {
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  return (
    <div className="flex h-full w-16 flex-col items-center border-r border-chat-border bg-chat-sidebar px-3 pt-[14px] pb-4">
      <Tooltip content="사이드바 열기" side="right" className="font-chat">
        <button
          type="button"
          onClick={() => onOpen()}
          aria-label="사이드바 열기"
          className={cn("group mb-3", RAIL_BUTTON)}
        >
          <img
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            className="size-[30px] rounded-[9px] group-hover:hidden group-focus-visible:hidden"
          />
          <PanelLeftOpen
            className="hidden size-5 group-hover:block group-focus-visible:block"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </button>
      </Tooltip>

      <nav aria-label="바로 가기" className="flex flex-col items-center gap-1">
        <Tooltip content="새 채팅" side="right" className="font-chat">
          <Link
            to="/"
            aria-label="새 채팅"
            aria-current={onHome ? "page" : undefined}
            className={cn(
              RAIL_BUTTON,
              onHome &&
                "bg-chat-brand-50 text-chat-brand-strong hover:bg-chat-brand-100/70 hover:text-chat-brand-strong",
            )}
          >
            <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
          </Link>
        </Tooltip>
        <Tooltip content="채팅 검색" side="right" className="font-chat">
          <button
            type="button"
            onClick={() => onOpen({ focusSearch: true })}
            aria-label="채팅 검색"
            className={RAIL_BUTTON}
          >
            <Search className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </Tooltip>
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1">
        <SettingsMenu variant="icon" />
        <UserCard variant="icon" onExpand={() => onOpen()} />
      </div>
    </div>
  );
}
