import { useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, LogOut } from "lucide-react";
import { getToken, useVerifyToken } from "@/api/auth";
import { isSuperAdmin } from "@/api/roles";
import { performLogout } from "@/features/auth";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

const AVATAR_CLASS =
  "flex size-9 shrink-0 items-center justify-center rounded-full border border-chat-brand-100 bg-chat-brand-50 text-sm font-bold text-chat-brand-strong";

/** 이름 첫 글자 (서로게이트 쌍 안전) */
function initialOf(name: string): string {
  return Array.from(name.trim())[0] ?? "";
}

interface UserCardProps {
  /** row: 사이드바 하단 카드 / icon: 접힌 레일의 아바타 버튼 */
  variant?: "row" | "icon";
  /** icon 변형에서 아바타를 누르면 호출 (사이드바를 열어 전체 카드를 보여줄 때) */
  onExpand?: () => void;
}

const RAIL_BUTTON_CLASS =
  "flex size-10 items-center justify-center rounded-full text-chat-ink-2 transition-colors hover:bg-chat-hover hover:text-chat-ink";

/**
 * 사이드바 맨 아래 사용자 카드.
 * 로그인 상태: 아바타 · 이름 · 역할 · 로그아웃 / 미로그인: 로그인 페이지로 가는 행.
 * icon 변형은 접힌 레일용으로 아바타(또는 로그인 아이콘)만 보여줍니다.
 */
export default function UserCard({ variant = "row", onExpand }: UserCardProps) {
  const hasToken = !!getToken();
  const { data: user, isLoading } = useVerifyToken(hasToken);
  const [loggingOut, setLoggingOut] = useState(false);
  const isIcon = variant === "icon";

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await performLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  if (isIcon) {
    if (hasToken && isLoading) {
      return <div aria-busy="true" className="size-9 animate-pulse rounded-full bg-chat-hover" />;
    }
    if (!hasToken || !user) {
      return (
        <Tooltip content="로그인" side="right" className="font-chat">
          <Link to="/login" aria-label="로그인" className={cn(RAIL_BUTTON_CLASS, FOCUS_RING)}>
            <LogIn className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </Tooltip>
      );
    }
    const name = user.name || user.email;
    return (
      <Tooltip content={name} side="right" className="font-chat">
        <button
          type="button"
          onClick={onExpand}
          aria-label={`${name} 계정 (사이드바 열기)`}
          className={cn(RAIL_BUTTON_CLASS, FOCUS_RING)}
        >
          <span className={AVATAR_CLASS} aria-hidden="true">
            {initialOf(name)}
          </span>
        </button>
      </Tooltip>
    );
  }

  // 토큰 검증 중: 중립 스켈레톤
  if (hasToken && isLoading) {
    return (
      <div
        aria-busy="true"
        className="flex items-center gap-2.5 border-t border-chat-border p-[8px_6px_2px]"
      >
        <div className="size-9 shrink-0 animate-pulse rounded-full bg-chat-hover" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="h-3.5 w-20 animate-pulse rounded bg-chat-hover" />
          <div className="h-3 w-14 animate-pulse rounded bg-chat-hover" />
        </div>
        <span className="sr-only">사용자 정보를 불러오는 중</span>
      </div>
    );
  }

  // 미로그인(또는 토큰 검증 실패): 로그인 행
  if (!hasToken || !user) {
    return (
      <div className="border-t border-chat-border pt-2 pb-0.5">
        <Link
          to="/login"
          className={cn(
            "-my-1 flex items-center gap-2.5 rounded-chat-md px-1.5 py-1 transition-colors hover:bg-chat-hover",
            FOCUS_RING,
          )}
        >
          <span className={AVATAR_CLASS}>
            <LogIn className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm leading-5 font-semibold text-chat-ink">
              로그인
            </span>
            <span className="truncate text-xs leading-4 text-chat-subtle">
              관리자 기능을 사용하려면 로그인하세요
            </span>
          </span>
        </Link>
      </div>
    );
  }

  const displayName = user.name || user.email;
  const roleLabel = isSuperAdmin(user.role) ? "최고 관리자" : "관리자";

  return (
    <div className="flex items-center gap-2.5 border-t border-chat-border p-[8px_6px_2px]">
      <div className={AVATAR_CLASS} aria-hidden="true">
        {initialOf(displayName)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm leading-5 font-semibold text-chat-ink">
          {displayName}
        </span>
        <span className="truncate text-xs leading-4 text-chat-subtle">{roleLabel}</span>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        aria-label="로그아웃"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-chat-md text-chat-ink-2 transition-colors hover:bg-chat-hover disabled:opacity-50",
          FOCUS_RING,
        )}
      >
        <LogOut className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  );
}
