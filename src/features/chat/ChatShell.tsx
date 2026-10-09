import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { ChatShellContext } from "./chatShellContext";
import ChatSidebar from "./components/ChatSidebar";
import ChatSidebarRail from "./components/ChatSidebarRail";
import { hideWidgetLauncher, showWidgetLauncher } from "./widgetLauncher";

const SIDEBAR_COLLAPSED_KEY = "gist-chatbot:sidebar-collapsed";
/** Tailwind lg 브레이크포인트. 이 이상에서는 드로어 대신 고정 사이드바를 쓴다 */
const DESKTOP_QUERY = "(min-width: 64rem)";
/** 사이드바 열기/닫기·드로어 전환 시간. 모션 최소화 설정이면 전환 없이 바로 바뀐다 */
const SIDEBAR_MOTION =
  "duration-300 ease-out motion-reduce:transition-none motion-reduce:animate-none";

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
 * - 데스크톱: 접으면 폭이 272px에서 64px 레일로 줄어든다. 레일과 사이드바의 아이콘 위치가 같으므로
 *   두 층을 제자리에서 크로스페이드해 아이콘은 고정된 채 라벨만 나타나고 사라지는 것처럼 보인다
 * - 모바일: Base UI Dialog로 드로어를 띄워 슬라이드 인/아웃, 포커스 가둠, ESC·바깥 클릭 닫기를 맡긴다
 */
export default function ChatShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPathname, setDrawerPathname] = useState(location.pathname);
  // 레일의 검색 아이콘으로 열었을 때 채팅 검색에 포커스를 주기 위한 카운터
  const [focusSearchToken, setFocusSearchToken] = useState(0);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

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

  // 드로어가 열린 채 lg 이상으로 넓어지면 닫는다 (다시 좁힐 때 튀어나오지 않도록)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => {
      if (mq.matches) setDrawerOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const updateCollapsed = useCallback((next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // 저장 실패는 무시 (세션 동안만 유지)
    }
  }, []);

  const openSidebar = useCallback(
    (options?: { focusSearch?: boolean }) => {
      const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
      if (isDesktop) updateCollapsed(false);
      else setDrawerOpen(true);
      if (options?.focusSearch) setFocusSearchToken((token) => token + 1);
    },
    [updateCollapsed],
  );

  const contextValue = useMemo(
    () => ({ sidebarCollapsed: collapsed, drawerOpen, openSidebar, menuButtonRef }),
    [collapsed, drawerOpen, openSidebar],
  );

  // 드로어가 열리면 닫기 버튼부터 포커스 (없으면 Base UI 기본: 첫 포커스 가능 요소)
  const focusDrawerClose = useCallback(
    () =>
      drawerRef.current?.querySelector<HTMLElement>("[data-sidebar-close]") ?? undefined,
    [],
  );

  return (
    <ChatShellContext.Provider value={contextValue}>
      <div className="flex h-dvh w-full overflow-hidden bg-chat-bg font-chat text-chat-ink antialiased">
        {/* 데스크톱: 펼치면 272px 사이드바, 접으면 64px 레일. 안 보이는 쪽은 inert로 포커스·스크린리더에서 제외 */}
        <div
          className={cn(
            "relative hidden h-full shrink-0 overflow-hidden transition-[width] lg:block",
            SIDEBAR_MOTION,
            collapsed ? "lg:w-16" : "lg:w-[272px]",
          )}
        >
          <div
            inert={!collapsed}
            className={cn(
              "absolute inset-y-0 left-0 w-16 transition-opacity",
              SIDEBAR_MOTION,
              collapsed ? "opacity-100" : "opacity-0",
            )}
          >
            <ChatSidebarRail onOpen={openSidebar} />
          </div>
          <div
            inert={collapsed}
            className={cn(
              "absolute inset-y-0 left-0 w-[272px] transition-opacity",
              SIDEBAR_MOTION,
              collapsed ? "opacity-0" : "opacity-100",
            )}
          >
            <ChatSidebar
              variant="desktop"
              onClose={() => updateCollapsed(true)}
              focusSearchToken={focusSearchToken}
            />
          </div>
        </div>

        {/* 모바일 드로어 */}
        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop
              className={cn(
                "fixed inset-0 z-50 bg-black/40 duration-200 lg:hidden",
                "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none",
              )}
            />
            <Dialog.Popup
              ref={drawerRef}
              aria-label="사이드바"
              initialFocus={focusDrawerClose}
              finalFocus={menuButtonRef}
              className={cn(
                "fixed inset-y-0 left-0 z-50 w-[min(272px,85vw)] font-chat text-chat-ink shadow-chat-menu outline-none antialiased lg:hidden",
                "data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left",
                SIDEBAR_MOTION,
              )}
            >
              <ChatSidebar variant="drawer" onClose={() => setDrawerOpen(false)} />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>

        <main className="chat-grid-bg relative flex min-w-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </ChatShellContext.Provider>
  );
}
