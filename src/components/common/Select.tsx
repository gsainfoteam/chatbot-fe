import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectWidth = "auto" | "sm" | "md" | "lg" | "full";
export type SelectVariant = "default" | "form";
export type SelectSize = "sm" | "md";

export interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  ariaLabel?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  /** 트리거에 표시할 라벨을 옵션 라벨 대신 직접 지정 */
  selectedLabel?: string;
  helperText?: string;
  error?: string;
  width?: SelectWidth;
  variant?: SelectVariant;
  size?: SelectSize;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
}

const widthClasses: Record<SelectWidth, string> = {
  auto: "w-auto min-w-[120px]",
  sm: "w-[120px]",
  md: "w-[200px]",
  lg: "w-[260px]",
  full: "w-full",
};

const triggerVariantClasses: Record<SelectVariant, string> = {
  default: "rounded-lg bg-gray-50 hover:bg-gray-100",
  form: "rounded-md bg-white",
};

// shadcn 트리거는 data-size로 높이를 정하므로 같은 변형 키로 덮어씁니다.
const triggerSizeClasses: Record<SelectSize, string> = {
  sm: "data-[size=default]:h-8 px-2.5 py-1.5",
  md: "data-[size=default]:h-10 px-3 py-2",
};

/**
 * `options` 배열을 받는 단일 선택 드롭다운. shadcn Select(Base UI) 기반.
 */
export default function Select({
  value,
  onValueChange,
  options,
  label,
  ariaLabel,
  id,
  name,
  placeholder = "선택해주세요",
  selectedLabel,
  helperText,
  error,
  width = "full",
  variant = "default",
  size = "md",
  disabled = false,
  required = false,
  className,
  triggerClassName,
}: SelectProps) {
  const generatedId = useId();
  const triggerId = id ?? `select-${generatedId}`;
  const helperId = helperText ? `${triggerId}-helper` : undefined;
  const errorId = error ? `${triggerId}-error` : undefined;
  const describedBy =
    [helperId, errorId].filter(Boolean).join(" ") || undefined;

  const labelFor = (current: string | null) => {
    if (current == null) return placeholder;
    return (
      selectedLabel ??
      options.find((option) => option.value === current)?.label ??
      current
    );
  };

  return (
    <div className={cn(widthClasses[width], "min-w-0 shrink-0", className)}>
      {label && (
        <label
          htmlFor={triggerId}
          className={cn(
            "mb-1.5 block font-medium",
            variant === "form"
              ? "text-sm text-gray-700"
              : "text-xs text-gray-500",
          )}
        >
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-red-600">
              *
            </span>
          )}
        </label>
      )}

      <SelectRoot
        value={value ?? null}
        onValueChange={(next) => {
          if (next != null) onValueChange(next);
        }}
        items={options}
        disabled={disabled}
        name={name}
        required={required}
      >
        <SelectTrigger
          id={triggerId}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(
            "flex w-full cursor-pointer items-center justify-between gap-2 border text-left text-sm text-gray-900 transition-colors",
            "hover:border-gray-300 focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/25 data-open:border-[var(--color-primary)] data-open:ring-2 data-open:ring-[var(--color-primary)]/25",
            "data-placeholder:text-gray-400 aria-invalid:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
            triggerVariantClasses[variant],
            triggerSizeClasses[size],
            error
              ? "border-red-500"
              : variant === "form"
                ? "border-gray-300"
                : "border-gray-200",
            triggerClassName,
          )}
        >
          <SelectValue className="min-w-0 flex-1 overflow-hidden">
            {(current: string | null) => (
              <span className="block truncate">{labelFor(current)}</span>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent
          align="start"
          sideOffset={4}
          alignItemWithTrigger={false}
          className="max-h-[min(15rem,var(--available-height))] max-w-[calc(100vw-2rem)] min-w-0 rounded-lg border border-gray-200 bg-white p-1 shadow-lg ring-0"
        >
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="cursor-pointer rounded-md py-2 pr-8 pl-3 text-sm text-gray-900 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-950 data-[selected]:font-medium data-[selected]:text-[var(--color-primary)] data-disabled:opacity-40"
            >
              <span className="block min-w-0 flex-1 truncate">
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>

      {helperText && (
        <p id={helperId} className="mt-1.5 text-xs text-gray-500">
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
