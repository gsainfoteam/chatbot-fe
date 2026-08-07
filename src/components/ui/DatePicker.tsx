import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DayPicker } from "@daypicker/react";
import { ko } from "@daypicker/react/locale";
import dayPickerStyles from "@daypicker/react/style.module.css";
import { useState, type CSSProperties } from "react";
import { CalendarIcon, ChevronDownIcon } from "../Icons";

export interface DatePickerProps {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  min?: string;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}

function parseDateValue(value?: string): Date | undefined {
  if (!value) return undefined;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

function toDateValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDisplayDate(date: Date): string {
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

export default function DatePicker({
  id,
  value,
  onChange,
  min,
  disabled = false,
  placeholder = "날짜를 선택해주세요",
  ariaLabel = "날짜 선택",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateValue(value);
  const minDate = parseDateValue(min);
  const defaultMonth = selectedDate ?? minDate ?? new Date();
  const calendarStyle = {
    "--rdp-accent-color": "var(--color-primary)",
    "--rdp-accent-background-color": "#fef2f2",
  } as CSSProperties;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          className="group flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-md border border-gray-300 bg-white px-3 text-left text-sm text-gray-900 transition-colors hover:border-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25 data-[state=open]:border-[var(--color-primary)] data-[state=open]:ring-2 data-[state=open]:ring-[var(--color-primary)]/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          <span
            className={`min-w-0 flex-1 truncate ${
              selectedDate ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
          </span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          collisionPadding={16}
          className="z-[70] rounded-lg border border-gray-200 bg-white p-3 shadow-lg focus:outline-none"
        >
          <DayPicker
            mode="single"
            locale={ko}
            showOutsideDays
            navLayout="around"
            defaultMonth={defaultMonth}
            startMonth={minDate}
            selected={selectedDate}
            disabled={minDate ? { before: minDate } : undefined}
            classNames={dayPickerStyles}
            style={calendarStyle}
            onSelect={(date) => {
              if (!date) return;
              onChange(toDateValue(date));
              setOpen(false);
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
