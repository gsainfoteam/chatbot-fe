import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Plus, Search, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "../chatStore";
import { filterThreads, groupThreadsByDate } from "../threadGroups";
import type { ChatThread } from "../types";
import DeleteThreadDialog from "./DeleteThreadDialog";
import DevConsoleButton from "./DevConsoleButton";

interface ChatSidebarProps {
  /** desktop: 사이드바 접기 / drawer: 드로어 닫기 */
  variant: "desktop" | "drawer";
  onClose: () => void;
  /** 값이 바뀔 때마다 대화 검색 입력에 포커스 (레일의 검색 아이콘으로 열었을 때) */
  focusSearchToken?: number;
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";
/** 촘촘히 붙은 행용 얇은 포커스 링 (옆 행을 넘지 않도록 1px, 오프셋 1px) */
const ROW_FOCUS_RING =
  "focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-chat-brand";

/**
 * 좌측 사이드바(280px, Figma 최종 01·03 '기본 사이드바'):
 * 로고 · 닫기 / 새 대화 / 대화 검색 / 날짜별 대화 기록 / 하단 '개발자 콘솔' 버튼.
 * drawer 변형은 ChatShell의 드로어 래퍼가 폭을 정하므로 w-full로 채웁니다.
 */
export default function ChatSidebar({
  variant,
  onClose,
  focusSearchToken = 0,
}: ChatSidebarProps) {
  const { threads } = useChatStore();
  const { threadId } = useParams<{ threadId: string }>();
  const { pathname } = useLocation();
  const onHome = pathname === "/";
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ChatThread | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (focusSearchToken > 0) searchInputRef.current?.focus();
  }, [focusSearchToken]);

  const isDrawer = variant === "drawer";
  const closeLabel = isDrawer ? "사이드바 닫기" : "사이드바 접기";

  const filtered = filterThreads(threads, query);
  const groups = groupThreadsByDate(filtered);
  const emptyText =
    threads.length === 0
      ? "아직 나눈 대화가 없어요."
      : filtered.length === 0
        ? "검색 결과가 없어요."
        : null;

  return (
    <aside
      className={cn(
        "flex h-full flex-col gap-6 border-r border-chat-border bg-chat-sidebar p-6",
        isDrawer ? "w-full" : "w-[280px]",
      )}
    >
      {/* 로고 + 닫기 */}
      <div className="flex h-11 shrink-0 items-center justify-between">
        <Link
          to="/"
          className={cn("flex min-w-0 items-center gap-[7px] rounded-chat-sm", FOCUS_RING)}
        >
          <img src="/logo.svg" alt="" aria-hidden="true" className="size-7 shrink-0" />
          <span className="truncate text-[15.75px] leading-normal font-semibold text-chat-ink">
            GIST 챗봇
          </span>
        </Link>
        {/* 드로어로 열리면 ChatShell이 이 버튼(data-sidebar-close)에 먼저 포커스를 준다 */}
        <button
          type="button"
          onClick={onClose}
          data-sidebar-close=""
          aria-label={closeLabel}
          className={cn(
            "flex h-11 shrink-0 items-center gap-1 rounded-chat-md px-2.5 text-sm font-medium text-chat-brand-text transition-colors hover:bg-chat-brand-50",
            FOCUS_RING,
          )}
        >
          닫기
          <X className="size-4" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {/* 새 대화 + 대화 검색 */}
      <div className="flex shrink-0 flex-col gap-2.5">
        <Link
          to="/"
          aria-current={onHome ? "page" : undefined}
          className={cn(
            "flex h-11 items-center justify-center gap-1.5 rounded-[14px] border border-chat-border bg-chat-surface text-sm font-medium text-chat-ink transition-colors hover:bg-chat-hover",
            FOCUS_RING,
          )}
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden="true" />새 대화
        </Link>

        <label
          className={cn(
            "flex h-10 items-center gap-2 rounded-chat-md px-3 text-chat-subtle transition-colors hover:bg-chat-hover focus-within:bg-chat-hover",
            "focus-within:outline-1 focus-within:outline-offset-1 focus-within:outline-chat-brand",
          )}
        >
          <Search className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="대화 검색"
            placeholder="대화 검색"
            className="min-w-0 flex-1 bg-transparent text-sm text-chat-ink outline-none placeholder:text-chat-subtle"
          />
        </label>
      </div>

      {/* 대화 기록 (포커스 링이 잘리지 않도록 -mx-1 px-1로 여유를 둠) */}
      <nav aria-labelledby="chat-history-heading" className="flex min-h-0 flex-1 flex-col gap-3">
        <h2
          id="chat-history-heading"
          className="shrink-0 text-lg leading-normal font-semibold text-chat-ink"
        >
          대화 기록
        </h2>
        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-1 [scrollbar-width:thin]">
          {emptyText ? (
            <p className="text-[13px] leading-normal text-chat-muted">{emptyText}</p>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <div className="pb-1 text-xs leading-normal text-chat-muted">{group.label}</div>
                {group.threads.map((thread) => {
                  const active = thread.id === threadId;
                  return (
                    // 쓰레기통은 호버·포커스 시 나타나고, 터치 기기에서는 항상 보인다
                    <div key={thread.id} className="group relative">
                      <Link
                        to={`/c/${thread.id}`}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex flex-col gap-1 rounded-chat-md py-2.5 pr-9 pl-3 transition-colors",
                          FOCUS_RING,
                          active
                            ? "bg-chat-brand-50 py-3 group-hover:bg-chat-brand-100/70"
                            : "group-hover:bg-chat-hover group-focus-within:bg-chat-hover",
                        )}
                      >
                        <span className="truncate text-sm leading-normal font-medium text-chat-ink">
                          {thread.title}
                        </span>
                        {active && (
                          <span className="text-xs leading-normal text-chat-brand-text">
                            현재 대화
                          </span>
                        )}
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
        </div>
      </nav>

      <DevConsoleButton />

      <DeleteThreadDialog thread={pendingDelete} onClose={() => setPendingDelete(null)} />
    </aside>
  );
}
