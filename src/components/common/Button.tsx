import type { ComponentProps, ReactNode } from "react";
import { Button as UiButton } from "@/components/ui/button";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "accent"
  | "link"
  | "dangerLink";
export type ButtonSize = "inline" | "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<ComponentProps<typeof UiButton>, "variant" | "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

/**
 * shadcn Button 위에 로딩 상태와 좌우 아이콘 슬롯을 얹은 앱 공용 버튼.
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <UiButton
      {...props}
      type={type}
      variant={variant}
      size={size}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        leftIcon
      )}
      <span>{loading && loadingText ? loadingText : children}</span>
      {!loading && rightIcon}
    </UiButton>
  );
}
