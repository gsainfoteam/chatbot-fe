// Base UI Menu 공통 스타일 (사이드바 설정 메뉴 / 대화 "더 보기" 메뉴).
// Popover 기본 클래스와 겹치지 않으므로 chat-* 토큰 유틸리티를 그대로 쓸 수 있습니다.
// 포털로 body에 렌더되어 ChatShell의 font-chat을 상속받지 못하므로 폰트를 직접 지정합니다.

export const MENU_POSITIONER_CLASS = "isolate z-[70]";

/** 팝업: radius 16, 메뉴 그림자, padding 6, 항목 간 2px (tokens.json) */
export const MENU_POPUP_CLASS =
  "flex origin-(--transform-origin) flex-col gap-0.5 rounded-chat-lg border border-chat-border bg-chat-surface p-1.5 font-chat text-chat-ink shadow-chat-menu outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2";

/** 항목: h38, radius 10. 색은 쓰는 쪽에서 지정 (hover·방향키 하이라이트는 data-highlighted) */
export const MENU_ITEM_CLASS =
  "flex h-[38px] w-full cursor-pointer items-center gap-2.5 rounded-chat-md px-2.5 text-left text-sm font-medium transition-colors select-none data-highlighted:bg-chat-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";
