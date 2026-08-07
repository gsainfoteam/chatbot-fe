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
  size?: DialogSize;
  closeLabel?: string;
  closeDisabled?: boolean;
  contentClassName?: string;
  bodyClassName?: string;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
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
  size = "md",
  closeLabel = "닫기",
  closeDisabled = false,
  contentClassName,
  bodyClassName,
}: DialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && closeDisabled) return;
    onOpenChange(nextOpen);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(event) => {
            if (closeDisabled) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (closeDisabled) event.preventDefault();
          }}
          className={joinClasses(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl focus:outline-none",
            sizeClasses[size],
            contentClassName,
          )}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="truncate text-lg font-semibold text-gray-900">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 whitespace-pre-line text-sm text-gray-500">
                {description}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label={closeLabel}
                disabled={closeDisabled}
                className="shrink-0 cursor-pointer rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          </header>

          <div
            className={joinClasses(
              "min-h-0 overflow-y-auto p-5",
              bodyClassName,
            )}
          >
            {children}
          </div>

          {footer && (
            <footer className="flex shrink-0 justify-end gap-2 border-t border-gray-200 px-5 py-4">
              {footer}
            </footer>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
