import { Link } from "react-router-dom";
import { Menu } from "@base-ui/react/menu";
import { BookOpen, ChartColumn, KeyRound, Settings, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getToken } from "@/api/auth";
import { useDocumentManagementAccess } from "@/features/organizations";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common";
import { MENU_ITEM_CLASS, MENU_POPUP_CLASS, MENU_POSITIONER_CLASS } from "./menuStyles";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

interface MenuItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  /** "관리자" 배지 표시 */
  admin?: boolean;
}

function MenuItem({ to, icon: Icon, label, admin = false }: MenuItemProps) {
  return (
    <Menu.LinkItem
      render={<Link to={to} />}
      closeOnClick
      className={cn(MENU_ITEM_CLASS, "text-chat-ink-2 data-highlighted:text-chat-ink")}
    >
      <Icon className="size-[17px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {admin && (
        <span className="shrink-0 rounded-full bg-chat-brand-50 px-[7px] py-px text-[11px] leading-4 font-semibold text-chat-brand-strong">
          관리자
        </span>
      )}
    </Menu.LinkItem>
  );
}

interface SettingsMenuProps {
  /** row: 사이드바 하단 행 / icon: 접힌 레일의 아이콘 버튼 (메뉴가 오른쪽으로 열림) */
  variant?: "row" | "icon";
}

/**
 * 사이드바 하단 "설정" 버튼 + 위로 열리는 메뉴(248px).
 * Base UI Menu라 방향키·Home/End·글자 입력 탐색이 role="menu" 의미에 맞게 동작합니다.
 * 로그인한 계정에만 대시보드 행을, 문서 관리 권한이 있을 때만 문서 관리 행을 보여줍니다.
 */
export default function SettingsMenu({ variant = "row" }: SettingsMenuProps) {
  const hasToken = !!getToken();
  const { canAccess } = useDocumentManagementAccess();

  const showDashboard = hasToken;
  const showDocumentManagement = hasToken && canAccess;
  const showAdminRows = showDashboard || showDocumentManagement;
  const isIcon = variant === "icon";

  const trigger = isIcon ? (
    <Tooltip content="설정" side="right" className="font-chat">
      <Menu.Trigger
        aria-label="설정"
        className={cn(
          "flex size-10 items-center justify-center rounded-full text-chat-ink-2 transition-colors hover:bg-chat-hover hover:text-chat-ink data-popup-open:bg-chat-hover data-popup-open:text-chat-ink",
          FOCUS_RING,
        )}
      >
        <Settings className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
      </Menu.Trigger>
    </Tooltip>
  ) : (
    <Menu.Trigger
      className={cn(
        "flex h-10 w-full items-center gap-2.5 rounded-chat-md px-3 text-left text-sm leading-5 font-medium text-chat-ink-2 transition-colors hover:bg-chat-hover hover:text-chat-ink data-popup-open:bg-chat-hover data-popup-open:text-chat-ink",
        FOCUS_RING,
      )}
    >
      <Settings className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
      설정
    </Menu.Trigger>
  );

  return (
    <Menu.Root modal={false}>
      {trigger}

      <Menu.Portal>
        {/* 시안: 메뉴 하단이 설정 버튼 위로 16px 떨어짐 (bottom 56px − 버튼 40px). 레일에서는 오른쪽으로 */}
        <Menu.Positioner
          side={isIcon ? "right" : "top"}
          align={isIcon ? "end" : "start"}
          sideOffset={isIcon ? 8 : 16}
          className={MENU_POSITIONER_CLASS}
        >
          <Menu.Popup
            aria-label="설정 메뉴"
            data-slot="menu-content"
            className={cn(MENU_POPUP_CLASS, "w-[248px]")}
          >
            {showAdminRows && (
              <>
                {showDashboard && (
                  <MenuItem to="/dashboard" icon={ChartColumn} label="대시보드" admin />
                )}
                {showDocumentManagement && (
                  <MenuItem to="/upload" icon={Upload} label="문서 관리" admin />
                )}
                <Menu.Separator className="mx-1.5 my-1 h-px bg-chat-border" />
              </>
            )}
            <MenuItem to="/docs" icon={BookOpen} label="문서" />
            <MenuItem to="/keys" icon={KeyRound} label="키 발급" />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
