import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { InfoIcon } from "../Icons";

export type TooltipSide = "top" | "right" | "bottom" | "left";

export interface TooltipProps {
  /** 툴팁에 표시할 내용 */
  content: ReactNode;
  /** 호버/포커스 대상. 반드시 단일 엘리먼트여야 합니다. */
  children: ReactNode;
  side?: TooltipSide;
  align?: "start" | "center" | "end";
  /** 표시 지연 (ms) */
  delayDuration?: number;
  className?: string;
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
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
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
    </TooltipPrimitive.Provider>
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
        className="inline-flex shrink-0 cursor-default items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
      >
        <InfoIcon className={iconClassName} />
      </button>
    </Tooltip>
  );
}
