import type { ReactNode } from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog as DialogRoot,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type DialogSize = "sm" | "md" | "lg";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
  size?: DialogSize;
  closeLabel?: string;
  closeDisabled?: boolean;
  contentClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  closeButtonClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  iconClassName?: string;
}

// shadcn DialogContent가 sm 이상에서 max-w-sm을 지정하므로 sm: 변형도 함께 덮어씁니다.
const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-md sm:max-w-md",
  md: "max-w-xl sm:max-w-xl",
  lg: "max-w-3xl sm:max-w-3xl",
};

/**
 * 제목·설명·본문·푸터 슬롯이 고정된 앱 공용 모달. shadcn Dialog(Base UI) 기반.
 */
export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  icon,
  size = "md",
  closeLabel = "닫기",
  closeDisabled = false,
  contentClassName,
  headerClassName,
  titleClassName,
  descriptionClassName,
  closeButtonClassName,
  bodyClassName,
  footerClassName,
  iconClassName,
}: DialogProps) {
  // controlled 모드이므로 closeDisabled일 때 닫기 요청(ESC, 닫기 버튼)을 무시하면 열린 상태가 유지됩니다.
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && closeDisabled) return;
    onOpenChange(nextOpen);
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal={closeDisabled}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-0 text-base text-gray-900 shadow-[0_24px_80px_-20px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.03]",
          sizeClasses[size],
          contentClassName,
        )}
      >
        <DialogHeader
          className={cn(
            "shrink-0 flex-row items-start justify-between gap-5 px-6 pt-6 pb-3 sm:px-7 sm:pt-7",
            headerClassName,
          )}
        >
          <div className="flex min-w-0 items-start gap-3.5">
            {icon && (
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
                  iconClassName ??
                    "bg-red-50 text-[var(--color-primary)] ring-red-100",
                )}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0 pt-0.5">
              <DialogTitle
                className={cn(
                  "text-xl leading-7 font-semibold tracking-[-0.015em] text-gray-950",
                  titleClassName,
                )}
              >
                {title}
              </DialogTitle>
              <DialogDescription
                className={cn(
                  "mt-1.5 text-sm leading-5 whitespace-pre-line text-gray-500",
                  descriptionClassName,
                )}
              >
                {description}
              </DialogDescription>
            </div>
          </div>
          <DialogClose
            aria-label={closeLabel}
            disabled={closeDisabled}
            className={cn(
              "-mt-1 -mr-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              closeButtonClassName,
            )}
          >
            <XIcon className="size-[18px]" />
          </DialogClose>
        </DialogHeader>

        <div
          className={cn(
            "peer min-h-0 overflow-y-auto px-6 pt-3 pb-6 empty:hidden sm:px-7 sm:pb-7",
            bodyClassName,
          )}
        >
          {children}
        </div>

        {footer && (
          <DialogFooter
            className={cn(
              "mx-0 mb-0 shrink-0 flex-row flex-wrap items-center justify-end gap-2.5 rounded-none border-t border-gray-100 bg-gray-50/80 px-6 py-4 sm:px-7",
              footerClassName,
            )}
          >
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </DialogRoot>
  );
}
