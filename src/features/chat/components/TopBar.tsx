import type { ReactNode } from "react";
import { Menu, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatShell } from "../chatShellContext";

interface TopBarProps {
  /** 좌측 제목 영역 */
  title: ReactNode;
  /** 우측 액션 영역 */
  actions?: ReactNode;
  /** 스레드 화면처럼 흰 배경 + 하단 구분선이 필요할 때 */
  elevated?: boolean;
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/**
 * 메인 영역 상단 바(h60). 모바일에서는 사이드바(드로어) 열기 버튼,
 * 데스크톱에서 사이드바를 접었을 때는 다시 펼치기 버튼을 왼쪽에 보여줍니다.
 */
export default function TopBar({ title, actions, elevated = false }: TopBarProps) {
  const { sidebarCollapsed, drawerOpen, openSidebar, menuButtonRef } = useChatShell();

  return (
    <div
      className={cn(
        "flex h-[60px] shrink-0 items-center justify-between gap-3 px-4 sm:px-6",
        elevated && "border-b border-chat-border bg-chat-surface",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={openSidebar}
          aria-label="메뉴 열기"
          aria-expanded={drawerOpen}
          className={cn(
            "-ml-2 flex size-9 shrink-0 items-center justify-center rounded-chat-md text-chat-ink-2 transition-colors hover:bg-chat-hover lg:hidden",
            FOCUS_RING,
          )}
        >
          <Menu className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </button>
        {sidebarCollapsed && (
          <button
            type="button"
            onClick={openSidebar}
            aria-label="사이드바 펼치기"
            className={cn(
              "-ml-2 hidden size-9 shrink-0 items-center justify-center rounded-chat-md text-chat-ink-2 transition-colors hover:bg-chat-hover lg:flex",
              FOCUS_RING,
            )}
          >
            <PanelLeftOpen className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0">{title}</div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
