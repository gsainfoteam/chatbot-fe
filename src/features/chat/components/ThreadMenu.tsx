import { useState, type KeyboardEvent } from "react";
import { Menu } from "@base-ui/react/menu";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { Button, Dialog } from "@/components/common";
import { cn } from "@/lib/utils";
import { renameThread } from "../chatStore";
import type { ChatThread } from "../types";
import DeleteThreadDialog from "./DeleteThreadDialog";
import { MENU_ITEM_CLASS, MENU_POPUP_CLASS, MENU_POSITIONER_CLASS } from "./menuStyles";

interface ThreadMenuProps {
  thread: ChatThread;
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/** 상단 바 "더 보기" 메뉴: 제목 바꾸기 / 대화 삭제 (항목 클릭 시 메뉴는 자동으로 닫힘) */
export default function ThreadMenu({ thread }: ThreadMenuProps) {
  const { id: threadId, title } = thread;
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState(title);

  const canSave = draft.trim().length > 0;

  const openRename = () => {
    setDraft(title);
    setRenameOpen(true);
  };

  const openDelete = () => setDeleteOpen(true);

  const saveTitle = () => {
    if (!canSave) return;
    renameThread(threadId, draft);
    setRenameOpen(false);
  };

  // Enter로 저장 (한글 조합 중 Enter는 무시)
  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    e.preventDefault();
    saveTitle();
  };

  return (
    <>
      <Menu.Root modal={false}>
        <Menu.Trigger
          aria-label="더 보기"
          className={cn(
            "flex size-9 items-center justify-center rounded-chat-md text-chat-ink-2 transition-colors hover:bg-chat-hover data-popup-open:bg-chat-hover",
            FOCUS_RING,
          )}
        >
          <Ellipsis className="size-[18px]" strokeWidth={2} aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner
            side="bottom"
            align="end"
            sideOffset={6}
            className={MENU_POSITIONER_CLASS}
          >
            <Menu.Popup
              aria-label="대화 메뉴"
              data-slot="menu-content"
              className={cn(MENU_POPUP_CLASS, "w-[200px]")}
            >
              <Menu.Item
                onClick={openRename}
                className={cn(MENU_ITEM_CLASS, "text-chat-ink-2 data-highlighted:text-chat-ink")}
              >
                <Pencil className="size-[17px]" strokeWidth={1.8} aria-hidden="true" />
                제목 바꾸기
              </Menu.Item>
              <Menu.Item
                onClick={openDelete}
                className={cn(
                  MENU_ITEM_CLASS,
                  "text-destructive data-highlighted:bg-destructive/10",
                )}
              >
                <Trash2 className="size-[17px]" strokeWidth={1.8} aria-hidden="true" />
                대화 삭제
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Dialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        size="sm"
        title="제목 바꾸기"
        description="사이드바 대화 목록에 표시되는 제목이에요."
        contentClassName="font-chat"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={saveTitle} disabled={!canSave}>
              저장
            </Button>
          </>
        }
      >
        <input
          type="text"
          value={draft}
          autoFocus
          aria-label="대화 제목"
          maxLength={100}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleInputKeyDown}
          className="h-10 w-full rounded-chat-md border border-chat-border bg-chat-surface px-3 text-sm text-chat-ink outline-none placeholder:text-chat-subtle focus:border-chat-brand"
        />
      </Dialog>

      <DeleteThreadDialog
        thread={deleteOpen ? thread : null}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
