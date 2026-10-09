import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PanelLeftClose, Search, SquarePen, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common";
import { useChatStore } from "../chatStore";
import { filterThreads, groupThreadsByDate } from "../threadGroups";
import type { ChatThread } from "../types";
import DeleteThreadDialog from "./DeleteThreadDialog";
import SettingsMenu from "./SettingsMenu";
import UserCard from "./UserCard";

interface ChatSidebarProps {
  /** desktop: 접기 버튼 / drawer: 닫기 버튼 */
  variant: "desktop" | "drawer";
  onClose: () => void;
  /** 값이 바뀔 때마다 채팅 검색 입력에 포커스 (레일의 검색 아이콘으로 열었을 때) */
  focusSearchToken?: number;
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";
/** 새 채팅·채팅 검색처럼 촘촘히 붙은 행용 얇은 포커스 링 (옆 행을 넘지 않도록 1px, 오프셋 1px) */
const ROW_FOCUS_RING =
  "focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-chat-brand";

/**
 * 좌측 사이드바(272px): 로고 · 새 채팅 · 검색 · 날짜별 채팅 기록 · 설정 메뉴 · 사용자 카드.
 * drawer 변형은 ChatShell의 드로어 래퍼가 폭을 정하므로 w-full로 채웁니다.
 */
export default function ChatSidebar({
  variant,
  onClose,
  focusSearchToken = 0,
}: ChatSidebarProps) {
  const { threads } = useChatStore();
  const { threadId } = useParams<{ threadId: string }>();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ChatThread | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (focusSearchToken > 0) searchInputRef.current?.focus();
  }, [focusSearchToken]);

  const isDrawer = variant === "drawer";
  const CloseIcon = isDrawer ? X : PanelLeftClose;

  const filtered = filterThreads(threads, query);
  const groups = groupThreadsByDate(filtered);
  const emptyText =
    threads.length === 0
      ? "아직 나눈 대화가 없어요"
      : filtered.length === 0
        ? "검색 결과가 없어요"
        : null;

  return (
    <aside
      className={cn(
        "flex h-full flex-col gap-3 border-r border-chat-border bg-chat-sidebar p-[14px_12px]",
        isDrawer ? "w-full" : "w-[272px]",
      )}
    >
      {/* 로고 + 접기/닫기 */}
      <div className="flex items-center justify-between p-[4px_4px_4px_6px]">
        <Link
          to="/"
          className={cn("flex min-w-0 items-center gap-2.5 rounded-chat-sm", FOCUS_RING)}
        >
          <img
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            className="size-[30px] shrink-0 rounded-[9px]"
          />
          <span className="truncate text-lg leading-7 font-bold text-chat-ink">
            GIST 챗봇
          </span>
        </Link>
        {/* 드로어로 열리면 ChatShell이 이 버튼(data-sidebar-close)에 먼저 포커스를 준다 */}
        <Tooltip content="사이드바 닫기" className="font-chat">
          <button
            type="button"
            onClick={onClose}
            data-sidebar-close=""
            aria-label="사이드바 닫기"
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-chat-md text-chat-ink-2 transition-colors hover:bg-chat-hover",
              FOCUS_RING,
            )}
          >
            <CloseIcon className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </Tooltip>
      </div>

      {/* 새 채팅 · 채팅 검색: Gemini식 얇은 행 (16px 아이콘 + 14px 라벨, 36px, 대화 기록 행과 같은 radius 10px) */}
      <div className="flex flex-col gap-1.5">
        <Link
          to="/"
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-chat-md bg-chat-brand-50 px-3 text-sm font-medium text-chat-brand-strong transition-colors hover:bg-chat-brand-100/70",
            ROW_FOCUS_RING,
          )}
        >
          <SquarePen className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          새 채팅
        </Link>

        <label
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-chat-md px-3 text-chat-ink-2 transition-colors hover:bg-chat-hover focus-within:bg-chat-hover",
            "focus-within:outline-1 focus-within:outline-offset-1 focus-within:outline-chat-brand",
          )}
        >
          <Search className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="채팅 검색"
            placeholder="채팅 검색"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-chat-ink outline-none placeholder:font-medium placeholder:text-chat-ink-2"
          />
        </label>
      </div>

      {/* 채팅 기록 (포커스 링이 잘리지 않도록 -mx-1 px-1로 여유를 둠) */}
      <nav
        aria-label="채팅 기록"
        className="-mx-1 flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-1 pt-1.5 pb-1 [scrollbar-width:thin]"
      >
        {emptyText ? (
          <p className="px-3 text-[13px] leading-5 text-chat-subtle">{emptyText}</p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <div className="px-3 pb-1.5 text-xs leading-4 font-semibold tracking-[0.02em] text-chat-subtle">
                {group.label}
              </div>
              {group.threads.map((thread) => {
                const active = thread.id === threadId;
                return (
                  // 쓰레기통은 호버·포커스 시 나타나고, 터치 기기에서는 항상 보인다
                  <div key={thread.id} className="group relative">
                    <Link
                      to={`/c/${thread.id}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block truncate rounded-chat-md pr-9 text-sm leading-5 transition-colors",
                        FOCUS_RING,
                        // 쓰레기통 위에 있거나 쓰레기통이 포커스됐을 때도 행 전체가 하이라이트되도록 group 기준으로 적용
                        active
                          ? "border border-chat-brand-100 py-[7px] pl-[11px] font-semibold text-chat-ink"
                          : "py-2 pl-3 font-medium text-chat-ink-2 group-hover:bg-chat-hover group-focus-within:bg-chat-hover",
                      )}
                    >
                      {thread.title}
                    </Link>
                    <button
                      type="button"
                      aria-label={`"${thread.title}" 대화 삭제`}
                      onClick={() => setPendingDelete(thread)}
                      className={cn(
                        "absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-chat-sm text-chat-subtle opacity-0 transition-opacity hover:bg-chat-brand-100/60 hover:text-destructive group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100",
                        ROW_FOCUS_RING,
                      )}
                    >
                      <Trash2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </nav>

      {/* 설정 */}
      <div className="relative border-t border-chat-border pt-2.5">
        <SettingsMenu />
      </div>

      {/* 사용자 */}
      <UserCard />

      <DeleteThreadDialog thread={pendingDelete} onClose={() => setPendingDelete(null)} />
    </aside>
  );
}
