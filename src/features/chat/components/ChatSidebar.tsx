import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PanelLeftClose, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "../chatStore";
import { filterThreads, groupThreadsByDate } from "../threadGroups";
import SettingsMenu from "./SettingsMenu";
import UserCard from "./UserCard";

interface ChatSidebarProps {
  /** desktop: 접기 버튼 / drawer: 닫기 버튼 */
  variant: "desktop" | "drawer";
  onClose: () => void;
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/**
 * 좌측 사이드바(272px): 로고 · 새 채팅 · 검색 · 날짜별 채팅 기록 · 설정 메뉴 · 사용자 카드.
 * drawer 변형은 ChatShell의 드로어 래퍼가 폭을 정하므로 w-full로 채웁니다.
 */
export default function ChatSidebar({ variant, onClose }: ChatSidebarProps) {
  const { threads } = useChatStore();
  const { threadId } = useParams<{ threadId: string }>();
  const [query, setQuery] = useState("");

  const isDrawer = variant === "drawer";
  const CloseIcon = isDrawer ? X : PanelLeftClose;

  const filtered = filterThreads(threads, query);
  const groups = groupThreadsByDate(filtered);
  const emptyText =
    threads.length === 0
      ? "아직 대화가 없어요. 새 채팅을 시작해 보세요."
      : filtered.length === 0
        ? "검색 결과가 없어요."
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
        {/* 드로어로 열리면 포커스가 오버레이 뒤에 남지 않도록 닫기 버튼에 바로 포커스 */}
        <button
          type="button"
          onClick={onClose}
          autoFocus={isDrawer}
          aria-label={isDrawer ? "메뉴 닫기" : "사이드바 접기"}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-chat-md text-chat-ink-2 transition-colors hover:bg-chat-hover",
            FOCUS_RING,
          )}
        >
          <CloseIcon className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      {/* 새 채팅 */}
      <Link
        to="/"
        className={cn(
          "flex h-11 items-center gap-2 rounded-chat-md bg-chat-brand px-3.5 text-[15px] font-semibold text-chat-on-brand transition-colors hover:bg-chat-brand-strong",
          FOCUS_RING,
        )}
      >
        <Plus className="size-[18px] shrink-0" strokeWidth={2} aria-hidden="true" />
        새 채팅
      </Link>

      {/* 채팅 검색 */}
      <label
        className={cn(
          "flex h-10 items-center gap-2 rounded-chat-md border border-chat-border bg-chat-surface px-3 text-chat-subtle",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-chat-brand",
        )}
      >
        <Search className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="채팅 검색"
          placeholder="채팅 검색"
          className="min-w-0 flex-1 bg-transparent text-sm text-chat-ink outline-none placeholder:text-chat-subtle"
        />
      </label>

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
                  <Link
                    key={thread.id}
                    to={`/c/${thread.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block truncate rounded-chat-md text-sm leading-5 transition-colors",
                      FOCUS_RING,
                      active
                        ? "border border-chat-brand-100 bg-chat-brand-50 px-[11px] py-[7px] font-semibold text-chat-ink"
                        : "px-3 py-2 font-medium text-chat-ink-2 hover:bg-chat-hover",
                    )}
                  >
                    {thread.title}
                  </Link>
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
    </aside>
  );
}
