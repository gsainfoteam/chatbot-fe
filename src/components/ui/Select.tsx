import * as SelectPrimitive from "@radix-ui/react-select";
import { useId } from "react";
import { ChevronDownIcon } from "../Icons";

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

const triggerSizeClasses: Record<SelectSize, string> = {
  sm: "h-8 px-2.5 py-1.5",
  md: "h-10 px-3 py-2",
};

function joinClasses(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="m4.5 10.5 3.25 3.25 7.75-7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={joinClasses(widthClasses[width], "min-w-0 shrink-0", className)}
    >
      {label && (
        <label
          htmlFor={triggerId}
          className={joinClasses(
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

      <SelectPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
        required={required}
      >
        <SelectPrimitive.Trigger
          id={triggerId}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={joinClasses(
            "flex w-full cursor-pointer items-center justify-between gap-2 border text-left text-sm text-gray-900 transition-colors",
            "hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25",
            "data-[placeholder]:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50",
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
          <SelectPrimitive.Value placeholder={placeholder}>
            {selectedLabel}
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon asChild>
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className="z-[70] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            <SelectPrimitive.Viewport className="max-h-60 overflow-y-auto p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={joinClasses(
                    "relative flex cursor-pointer select-none items-center rounded-md py-2 pr-8 pl-3 text-sm text-gray-900 outline-none",
                    "data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-950 data-[state=checked]:font-medium data-[state=checked]:text-[var(--color-primary)]",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                  )}
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2.5 inline-flex items-center">
                    <CheckIcon />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

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
