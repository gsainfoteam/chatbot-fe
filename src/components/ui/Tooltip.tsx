import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";
import { InfoIcon } from "../Icons";

export type TooltipSide = "top" | "right" | "bottom" | "left";

export interface TooltipProps {
  /** 툴팁에 표시할 내용 */
  content: ReactNode;
  /**
   * 호버/포커스 대상. 정확히 하나의 엘리먼트여야 합니다.
   * 커스텀 컴포넌트를 넘길 경우 전달받은 props와 ref를
   * 내부 DOM 엘리먼트로 그대로 넘겨야 툴팁이 동작합니다.
   */
  children: ReactElement;
  side?: TooltipSide;
  align?: "start" | "center" | "end";
  /** 표시 지연 (ms) */
  delayDuration?: number;
  className?: string;
}

export interface TooltipProviderProps {
  children: ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
}

/**
 * Radix Tooltip 컨텍스트. 앱 루트(main.tsx)에서 한 번만 감쌉니다.
 * 각 Tooltip 안에 Provider를 두면 Vite HMR / React Strict Mode에서
 * `Tooltip must be used within TooltipProvider`가 납니다.
 */
export function TooltipProvider({
  children,
  delayDuration = 150,
  skipDelayDuration = 300,
  disableHoverableContent,
}: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      disableHoverableContent={disableHoverableContent}
    >
      {children}
    </TooltipPrimitive.Provider>
  );
}

/**
 * 호버 또는 키보드 포커스 시 설명을 띄우는 툴팁.
 *
 * @example
 * <Tooltip content="설명 텍스트">
 *   <button type="button">대상</button>
 * </Tooltip>
 */
export default function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 150,
  className = "",
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className={[
            "tooltip-content z-[80] max-w-72 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed shadow-md",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export interface InfoTooltipProps
  extends Omit<TooltipProps, "children" | "className"> {
  /** 스크린리더용 버튼 레이블 */
  label?: string;
  iconClassName?: string;
}

/**
 * (i) 아이콘 형태의 툴팁 트리거. 통계 수치 옆 설명 용도.
 */
export function InfoTooltip({
  label = "자세히",
  iconClassName = "w-3.5 h-3.5",
  ...props
}: InfoTooltipProps) {
  return (
    <Tooltip {...props}>
      <button
        type="button"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="-m-1 inline-flex shrink-0 cursor-default items-center justify-center rounded-md p-1 text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 data-[state=delayed-open]:bg-black/5 data-[state=delayed-open]:text-gray-600 data-[state=instant-open]:bg-black/5 data-[state=instant-open]:text-gray-600"
      >
        <InfoIcon className={iconClassName} />
      </button>
    </Tooltip>
  );
}
