import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { XIcon } from "../Icons";

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

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

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
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && closeDisabled) return;
    onOpenChange(nextOpen);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-gray-950/50 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(event) => {
            if (closeDisabled) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (closeDisabled) event.preventDefault();
          }}
          className={joinClasses(
            "dialog-content fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.03] focus:outline-none",
            sizeClasses[size],
            contentClassName,
          )}
        >
          <header
            className={joinClasses(
              "flex shrink-0 items-start justify-between gap-5 px-6 pt-6 pb-3 sm:px-7 sm:pt-7",
              headerClassName,
            )}
          >
            <div className="flex min-w-0 items-start gap-3.5">
              {icon && (
                <div
                  className={joinClasses(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
                    iconClassName ??
                      "bg-red-50 text-[var(--color-primary)] ring-red-100",
                  )}
                >
                  {icon}
                </div>
              )}
              <div className="min-w-0 pt-0.5">
                <DialogPrimitive.Title
                  className={joinClasses(
                    "text-xl font-semibold leading-7 tracking-[-0.015em] text-gray-950",
                    titleClassName,
                  )}
                >
                  {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description
                  className={joinClasses(
                    "mt-1.5 whitespace-pre-line text-sm leading-5 text-gray-500",
                    descriptionClassName,
                  )}
                >
                  {description}
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label={closeLabel}
                disabled={closeDisabled}
                className={joinClasses(
                  "-mt-1 -mr-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 disabled:cursor-not-allowed disabled:opacity-50",
                  closeButtonClassName,
                )}
              >
                <XIcon className="h-[18px] w-[18px]" />
              </button>
            </DialogPrimitive.Close>
          </header>

          <div
            className={joinClasses(
              "peer min-h-0 overflow-y-auto px-6 pt-3 pb-6 empty:hidden sm:px-7 sm:pb-7",
              bodyClassName,
            )}
          >
            {children}
          </div>

          {footer && (
            <footer
              className={joinClasses(
                "flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/80 px-6 py-4 sm:px-7",
                footerClassName,
              )}
            >
              {footer}
            </footer>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
