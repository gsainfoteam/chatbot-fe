import { createContext, useContext, type RefObject } from "react";

export interface ChatShellContextValue {
  /** 데스크톱에서 사이드바를 접어 둔 상태 */
  sidebarCollapsed: boolean;
  /** 모바일 드로어가 열려 있는지 (메뉴 버튼의 aria-expanded용) */
  drawerOpen: boolean;
  /** 모바일: 드로어 열기 / 데스크톱: 접힌 사이드바 열기. focusSearch면 연 뒤 채팅 검색에 포커스 */
  openSidebar: (options?: { focusSearch?: boolean }) => void;
  /** 상단 바 "사이드바 열기" 버튼. 드로어가 닫히면 포커스를 여기로 되돌립니다 */
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}

export const ChatShellContext = createContext<ChatShellContextValue | null>(null);

/** ChatShell 하위에서 사이드바 상태·동작에 접근 */
export function useChatShell(): ChatShellContextValue {
  const ctx = useContext(ChatShellContext);
  if (!ctx) {
    throw new Error("useChatShell은 ChatShell 아래에서만 사용할 수 있습니다.");
  }
  return ctx;
}
