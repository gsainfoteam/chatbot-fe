import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "./Icons";

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  width?: "sm" | "md" | "lg";
  disabled?: boolean;
  placeholder?: string;
  /** 선택 시 표시할 라벨 (옵션 라벨과 다를 때 사용) */
  selectedLabel?: string;
}

const widthClasses = {
  sm: "w-[120px]",
  md: "w-[200px]",
  lg: "w-[260px]",
};

export default function FilterSelect({
  label,
  value,
  onChange,
  options,
  width = "md",
  disabled = false,
  placeholder,
  selectedLabel,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayText =
    selectedLabel ??
    options.find((o) => o.value === value)?.label ??
    placeholder ??
    "";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
  };

  return (
    <div className={`${widthClasses[width]} shrink-0`} ref={containerRef}>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className="w-full h-10 pl-3 pr-9 py-2 text-left text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#df3326]/25 focus:border-[#df3326] focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50"
        >
          <span className="truncate block">{displayText}</span>
        </button>
        <span
          className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <ChevronDownIcon className="w-4 h-4" />
        </span>
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                  opt.value === value
                    ? "text-[#df3326] font-medium bg-gray-50/50"
                    : "text-gray-900"
                }`}
              >
                <span className="truncate block">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
