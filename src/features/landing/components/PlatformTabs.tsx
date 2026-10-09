import { useState, type ReactNode } from "react";

interface PlatformTab {
  label: string;
  content: ReactNode;
}

interface PlatformTabsProps {
  tabs: PlatformTab[];
  onChange?: (index: number) => void;
  className?: string;
}

export default function PlatformTabs({
  tabs,
  onChange,
  className = "",
}: PlatformTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSelect = (index: number) => {
    setActiveIndex(index);
    onChange?.(index);
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        className="inline-flex items-center gap-1 p-1 bg-gray-100 border border-gray-200 rounded-lg mb-4"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            role="tab"
            aria-selected={index === activeIndex}
            onClick={() => handleSelect(index)}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
              index === activeIndex
                ? "bg-white text-[#df3326] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tabs[activeIndex]?.content}</div>
    </div>
  );
}
