import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common";
import { useChatShell } from "../chatShellContext";

interface TopBarProps {
  /** 좌측 제목 영역 (홈처럼 제목이 없으면 생략) */
  title?: ReactNode;
  /** 우측 액션 영역 */
  actions?: ReactNode;
  /** 스레드 화면처럼 흰 배경 + 하단 구분선이 필요할 때 */
  elevated?: boolean;
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/**
 * 메인 영역 상단 바(h60). 모바일에서는 사이드바(드로어) 열기 버튼을 왼쪽에 보여줍니다.
 * 데스크톱에서 접힌 사이드바는 레일의 로고 버튼으로 엽니다.
 * 토글 버튼과 페이지 제목 사이에는 구분선을 두어 제목이 버튼 라벨처럼 읽히지 않게 합니다.
 */
export default function TopBar({ title, actions, elevated = false }: TopBarProps) {
  const { drawerOpen, openSidebar, menuButtonRef } = useChatShell();

  return (
    <div
      className={cn(
        "flex h-[60px] shrink-0 items-center justify-between gap-3 px-4 sm:px-6",
        elevated && "border-b border-chat-border bg-chat-surface",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {/* 모바일: 드로어 열기 (아이콘만, 툴팁으로 라벨) */}
        <Tooltip content="사이드바 열기" className="font-chat">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => openSidebar()}
            aria-label="사이드바 열기"
            aria-expanded={drawerOpen}
            className={cn(
              "-ml-2 flex size-9 shrink-0 items-center justify-center rounded-chat-md text-chat-ink-2 transition-colors hover:bg-chat-hover lg:hidden",
              FOCUS_RING,
            )}
          >
            <Menu className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </Tooltip>

        {/* 제목이 있으면 모바일 토글 버튼과의 사이에 구분선 표시 */}
        {title && (
          <>
            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-chat-border lg:hidden" />
            <div className="min-w-0">{title}</div>
          </>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
