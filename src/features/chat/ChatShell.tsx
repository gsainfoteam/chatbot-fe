import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChatShellContext } from "./chatShellContext";
import ChatSidebar from "./components/ChatSidebar";
import { hideWidgetLauncher, showWidgetLauncher } from "./widgetLauncher";

const SIDEBAR_COLLAPSED_KEY = "gist-chatbot:sidebar-collapsed";
/** Tailwind lg 브레이크포인트. 이 이상에서는 드로어 대신 고정 사이드바를 쓴다 */
const DESKTOP_QUERY = "(min-width: 64rem)";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * 홈(새 채팅)과 스레드 화면이 공유하는 레이아웃: 좌측 사이드바(272px) + 메인 영역.
 * lg 미만에서는 사이드바가 드로어로 바뀝니다. 라우트가 바뀌어도 이 셸은 유지됩니다.
 */
export default function ChatShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPathname, setDrawerPathname] = useState(location.pathname);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasDrawerOpenRef = useRef(false);

  // 라우트 이동 시 드로어 닫기 (이전 경로와 비교해 렌더 중에 상태를 맞춘다)
  if (drawerPathname !== location.pathname) {
    setDrawerPathname(location.pathname);
    setDrawerOpen(false);
  }

  // 홈이 곧 채팅 앱이므로 떠 있는 동안 플로팅 런처는 숨긴다
  useEffect(() => {
    hideWidgetLauncher();
    return () => showWidgetLauncher();
  }, []);

  // 드로어가 열려 있는 동안 ESC로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  // 드로어가 열린 채 lg 이상으로 넓어지면 닫는다 (스크롤 잠금·ESC 핸들러가 남거나 다시 좁힐 때 튀어나오지 않도록)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => {
      if (mq.matches) setDrawerOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // 드로어가 닫히면 포커스를 "메뉴 열기" 버튼으로 되돌린다 (다른 요소가 이미 포커스를 가져갔으면 그대로 둔다)
  useEffect(() => {
    if (drawerOpen) {
      wasDrawerOpenRef.current = true;
      return;
    }
    if (!wasDrawerOpenRef.current) return;
    wasDrawerOpenRef.current = false;
    const active = document.activeElement;
    if (!active || active === document.body) menuButtonRef.current?.focus();
  }, [drawerOpen]);

  const updateCollapsed = useCallback((next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // 저장 실패는 무시 (세션 동안만 유지)
    }
  }, []);

  const openSidebar = useCallback(() => {
    const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
    if (isDesktop) updateCollapsed(false);
    else setDrawerOpen(true);
  }, [updateCollapsed]);

  const contextValue = useMemo(
    () => ({ sidebarCollapsed: collapsed, drawerOpen, openSidebar, menuButtonRef }),
    [collapsed, drawerOpen, openSidebar],
  );

  return (
    <ChatShellContext.Provider value={contextValue}>
      <div className="flex h-dvh w-full overflow-hidden bg-chat-bg font-chat text-chat-ink antialiased">
        {/* 데스크톱 사이드바 */}
        <div
          className={cn(
            "hidden h-full shrink-0 lg:block",
            collapsed && "lg:hidden",
          )}
        >
          <ChatSidebar variant="desktop" onClose={() => updateCollapsed(true)} />
        </div>

        {/* 모바일 드로어: 열리면 닫기 버튼으로 포커스가 이동하고(ChatSidebar autoFocus), 뒤 영역은 inert */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              aria-hidden="true"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="메뉴"
              className="relative h-full w-[min(272px,85vw)] shadow-chat-menu"
            >
              <ChatSidebar variant="drawer" onClose={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}

        <main
          inert={drawerOpen}
          className="chat-grid-bg relative flex min-w-0 flex-1 flex-col"
        >
          <Outlet />
        </main>
      </div>
    </ChatShellContext.Provider>
  );
}
