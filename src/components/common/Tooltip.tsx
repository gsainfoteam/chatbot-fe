import type { ReactElement, ReactNode } from "react";
import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider as UiTooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  /** 표시 지연 (ms) */
  delayDuration?: number;
  /** 툴팁 사이를 빠르게 이동할 때 지연을 건너뛰는 시간 창 (ms) */
  skipDelayDuration?: number;
}

/**
 * Tooltip 컨텍스트. 앱 루트(main.tsx)에서 한 번만 감쌉니다.
 */
export function TooltipProvider({
  children,
  delayDuration = 150,
  skipDelayDuration = 300,
}: TooltipProviderProps) {
  return (
    <UiTooltipProvider delay={delayDuration} timeout={skipDelayDuration}>
      {children}
    </UiTooltipProvider>
  );
}

/**
 * 호버 또는 키보드 포커스 시 설명을 띄우는 툴팁. shadcn Tooltip(Base UI) 기반.
 * 앱 루트의 TooltipProvider(main.tsx)가 필요합니다.
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
  className,
}: TooltipProps) {
  return (
    <TooltipRoot>
      <TooltipTrigger delay={delayDuration} render={children} />
      <TooltipContent
        side={side}
        align={align}
        sideOffset={6}
        className={cn(
          "tooltip-content max-w-72 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed shadow-md [&_[data-slot=tooltip-arrow]]:hidden",
          className,
        )}
      >
        {content}
      </TooltipContent>
    </TooltipRoot>
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
        className="-m-1 inline-flex shrink-0 cursor-default items-center justify-center rounded-md p-1 text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 focus-visible:outline-none data-[popup-open]:bg-black/5 data-[popup-open]:text-gray-600"
      >
        <InfoIcon className={iconClassName} />
      </button>
    </Tooltip>
  );
}
