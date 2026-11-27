import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useChatShell } from "../chatShellContext";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/**
 * 모바일 홈 상단 바 (Figma 최종 09 '홈 로고' + '메뉴'): 로고 · GIST 챗봇 / 메뉴(사이드바 드로어 열기).
 * 데스크톱(lg 이상)에서는 쓰지 않습니다. 드로어가 닫히면 포커스가 메뉴 버튼으로 돌아옵니다.
 */
export default function TopBar() {
  const { drawerOpen, openSidebar, menuButtonRef } = useChatShell();

  return (
    <div className="flex h-[76px] shrink-0 items-center justify-between gap-3 px-5 sm:px-6">
      <Link to="/" className={cn("flex min-w-0 items-center gap-[7px] rounded-chat-sm", FOCUS_RING)}>
        <img src="/logo.svg" alt="" aria-hidden="true" className="size-7 shrink-0" />
        <span className="truncate text-[15.75px] leading-normal font-semibold text-chat-ink">
          GIST 챗봇
        </span>
      </Link>
      <button
        ref={menuButtonRef}
        type="button"
        onClick={() => openSidebar()}
        aria-expanded={drawerOpen}
        aria-haspopup="dialog"
        className={cn(
          "flex h-11 w-[76px] shrink-0 items-center justify-center rounded-[14px] border border-chat-border bg-chat-surface text-sm font-medium text-chat-ink transition-colors hover:bg-chat-hover",
          FOCUS_RING,
        )}
      >
        메뉴
      </button>
    </div>
  );
}
