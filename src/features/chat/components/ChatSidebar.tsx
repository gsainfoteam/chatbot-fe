import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common";
import { useChatStore } from "../chatStore";
import { filterThreads, groupThreadsByDate } from "../threadGroups";
import type { ChatThread } from "../types";
import DeleteThreadDialog from "./DeleteThreadDialog";
import DevConsoleButton from "./DevConsoleButton";
import { QuestionCircleIcon, SidebarToggleIcon } from "./SidebarIcons";

interface ChatSidebarProps {
  /** desktop: 사이드바 접기 / drawer: 드로어 닫기 */
  variant: "desktop" | "drawer";
  onClose: () => void;
  /** 값이 바뀔 때마다 질문 검색 입력에 포커스 (레일의 검색 아이콘으로 열었을 때) */
  focusSearchToken?: number;
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";
/** 촘촘히 붙은 행용 얇은 포커스 링 (옆 행을 넘지 않도록 1px, 오프셋 1px) */
const ROW_FOCUS_RING =
  "focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-chat-brand";

/**
 * 좌측 사이드바(280px, Figma '02 후' · '03 후' 사이드바):
 * 로고 · 접기 / 새 질문 / 질문 검색 / 날짜별 질문 기록 / 하단 '개발자 콘솔 바로가기'.
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
        "flex h-full flex-col gap-6 border-r border-chat-sidebar-border bg-chat-sidebar p-6 text-chat-sidebar-ink",
        isDrawer ? "w-full" : "w-[280px]",
      )}
    >
      {/* 로고 + 접기 */}
      <div className="flex h-11 shrink-0 items-center justify-between">
        <Link
          to="/"
          className={cn("flex min-w-0 items-center gap-[7px] rounded-chat-sm", FOCUS_RING)}
        >
          <img
            src="/logo-mark.svg"
            alt=""
            aria-hidden="true"
            className="h-[26px] w-7 shrink-0 object-contain"
          />
          <span className="truncate text-[21.6px] leading-normal font-semibold tracking-[-0.04em]">
            GIST 챗봇
          </span>
        </Link>
        {/* 드로어로 열리면 ChatShell이 이 버튼(data-sidebar-close)에 먼저 포커스를 준다 */}
        <Tooltip content={closeLabel} className="font-chat">
          <button
            type="button"
            onClick={onClose}
            data-sidebar-close=""
            aria-label={closeLabel}
            className={cn(
              "-mr-2 flex size-9 shrink-0 items-center justify-center rounded-chat-md text-chat-sidebar-muted transition-colors hover:bg-chat-hover hover:text-chat-sidebar-ink",
              FOCUS_RING,
            )}
          >
            <SidebarToggleIcon className="h-[18px] w-[23px]" aria-hidden="true" />
          </button>
        </Tooltip>
      </div>

      {/* 새 질문 + 질문 검색 */}
      <div className="flex shrink-0 flex-col gap-2.5">
        <Link
          to="/"
          aria-current={onHome ? "page" : undefined}
          className={cn(
            "flex h-11 items-center justify-center gap-1.5 rounded-[14px] border border-chat-sidebar-border bg-chat-surface text-sm font-medium transition-colors hover:bg-chat-hover",
            FOCUS_RING,
          )}
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden="true" />새 질문
        </Link>

        <label
          className={cn(
            "flex h-10 items-center gap-2 rounded-chat-md px-4 text-chat-sidebar-muted transition-colors hover:bg-chat-hover focus-within:bg-chat-hover",
            "focus-within:outline-1 focus-within:outline-offset-1 focus-within:outline-chat-brand",
          )}
        >
          <Search className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="질문 검색"
            placeholder="질문 검색"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-chat-sidebar-ink outline-none placeholder:text-chat-sidebar-muted"
          />
        </label>
      </div>

      {/* 질문 기록 (포커스 링이 잘리지 않도록 목록에 -mx-1 px-1 여유를 둠) */}
      <nav aria-labelledby="chat-history-heading" className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between">
          <h2 id="chat-history-heading" className="text-lg leading-normal font-semibold">
            질문 기록
          </h2>
          {/* 호버·포커스하면 회색 원 배경 + 안내 툴팁 (Figma '02 후 (2)') */}
          <Tooltip content="같은 기기에서는 대화 기록이 보존돼요." side="right" className="font-chat">
            <button
              type="button"
              aria-label="질문 기록 안내: 같은 기기에서는 대화 기록이 보존돼요."
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-chat-sidebar-muted transition-colors hover:bg-chat-sidebar-border focus-visible:bg-chat-sidebar-border",
                FOCUS_RING,
              )}
            >
              <QuestionCircleIcon className="size-4" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-1 [scrollbar-width:thin]">
          {emptyText ? (
            <p className="text-[13px] leading-normal text-chat-sidebar-muted">{emptyText}</p>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <div className="text-[13px] leading-normal text-chat-sidebar-muted">
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
                          "block truncate rounded-chat-md border py-3 pr-10 pl-4 text-sm leading-normal font-medium transition-colors",
                          FOCUS_RING,
                          // 선택된 대화: 브랜드 테두리 + 옅은 브랜드 바탕 (글자는 대비를 위해 한 단계 진한 브랜드색)
                          active
                            ? "border-chat-brand bg-chat-brand-50 text-chat-brand-strong"
                            : "border-transparent text-chat-sidebar-muted group-hover:bg-chat-hover group-hover:text-chat-sidebar-ink group-focus-within:bg-chat-hover",
                        )}
                      >
                        {thread.title}
                      </Link>
                      <button
                        type="button"
                        aria-label={`"${thread.title}" 대화 삭제`}
                        onClick={() => setPendingDelete(thread)}
                        className={cn(
                          "absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-chat-sm text-chat-sidebar-muted opacity-0 transition-opacity hover:bg-chat-brand-100/60 hover:text-destructive group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100",
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
