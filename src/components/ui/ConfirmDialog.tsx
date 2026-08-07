import { useState, type ReactNode } from "react";
import Button from "./Button";
import Dialog, { type DialogSize } from "./Dialog";

export type ConfirmDialogVariant = "primary" | "danger";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  variant?: ConfirmDialogVariant;
  size?: DialogSize;
  fallbackErrorMessage?: string;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "확인",
  cancelLabel = "취소",
  loadingLabel = "처리 중...",
  variant = "primary",
  size = "sm",
  fallbackErrorMessage = "요청을 처리하지 못했습니다.",
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading) return;
    if (!nextOpen) setError(null);
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      size={size}
      closeDisabled={loading}
      bodyClassName="space-y-4"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={() => void handleConfirm()}
            loading={loading}
            loadingText={loadingLabel}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </Dialog>
  );
}
