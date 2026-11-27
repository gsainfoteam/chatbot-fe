import { useRef, useState, type ComponentType, type KeyboardEvent, type SVGProps } from "react";
import { cn } from "@/lib/utils";
import { suggestionCategories, type SuggestionCategoryId } from "../suggestions";
import { ChildHeadIcon, GraduationCapIcon, SchoolIcon } from "./SuggestionIcons";

const CATEGORY_ICONS: Record<SuggestionCategoryId, ComponentType<SVGProps<SVGSVGElement>>> = {
  freshman: ChildHeadIcon,
  "campus-life": SchoolIcon,
  career: GraduationCapIcon,
};

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/** 추천 질문 카드 공통 틀 (Figma '02 후': 흰 바탕, #e1e1e1 테두리, radius 14, 위아래 16) */
export const SUGGESTION_CARD_CLASS =
  "flex flex-col gap-4 rounded-[14px] border border-chat-sidebar-border bg-chat-surface py-4";

/**
 * 추천 질문 목록: 좌우 8px 띄워 호버 바탕이 카드 가장자리에 붙지 않게 한다.
 * 행 안쪽 12px과 합쳐 글자는 카드 머리(20px)와 같은 줄에서 시작한다.
 */
export const SUGGESTION_LIST_CLASS = "flex flex-col px-2";

/** 추천 질문 한 줄 (14px, 화살표 없이, 호버 시 옅은 브랜드 바탕). 모바일은 누르기 쉽게 최소 44px */
export const SUGGESTION_ROW_CLASS = cn(
  "flex min-h-11 w-full items-center sm:min-h-0 gap-2.5 rounded-chat-md px-3 py-1 text-left text-sm leading-normal font-medium text-chat-sidebar-ink transition-colors hover:bg-chat-brand-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent",
  FOCUS_RING,
);

interface SuggestionTabsCardProps {
  onPick: (question: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 새내기 · 학교생활 · 진로 탭 카드: 탭을 고르면 아래 질문 3개만 바뀐다 (카드 높이는 그대로).
 * WAI-ARIA 탭 패턴: 좌우 화살표·Home·End로 탭 이동, 선택된 탭만 Tab 키 순서에 들어간다.
 */
export default function SuggestionTabsCard({
  onPick,
  disabled = false,
  className,
}: SuggestionTabsCardProps) {
  const [selectedId, setSelectedId] = useState<SuggestionCategoryId>(
    suggestionCategories[0].id,
  );
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = suggestionCategories.findIndex((c) => c.id === selectedId);
  const selected = suggestionCategories[selectedIndex];
  const SelectedIcon = CATEGORY_ICONS[selected.id];

  const selectAt = (index: number) => {
    const count = suggestionCategories.length;
    const next = (index + count) % count;
    setSelectedId(suggestionCategories[next].id);
    tabRefs.current[next]?.focus();
  };

  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keyMap: Record<string, number> = {
      ArrowRight: selectedIndex + 1,
      ArrowLeft: selectedIndex - 1,
      Home: 0,
      End: suggestionCategories.length - 1,
    };
    if (!(e.key in keyMap)) return;
    e.preventDefault();
    selectAt(keyMap[e.key]);
  };

  return (
    <div className={cn(SUGGESTION_CARD_CLASS, "gap-3", className)}>
      <div role="tablist" aria-label="질문 분류" className="grid grid-cols-3 gap-1 px-2">
        {suggestionCategories.map((category, index) => {
          const isSelected = category.id === selectedId;
          const Icon = CATEGORY_ICONS[category.id];
          return (
            <button
              key={category.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`suggestion-tab-${category.id}`}
              aria-selected={isSelected}
              aria-controls="suggestion-tabpanel"
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelectedId(category.id)}
              onKeyDown={handleTabKeyDown}
              className={cn(
                "flex min-h-11 items-center justify-center gap-1.5 rounded-chat-md border text-[13px] leading-normal font-medium transition-colors sm:min-h-9",
                isSelected
                  ? "border-chat-brand-100 bg-chat-brand-50 text-chat-brand-strong"
                  : "border-transparent text-chat-sidebar-muted hover:bg-chat-hover hover:text-chat-sidebar-ink",
                FOCUS_RING,
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {category.tabLabel}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="suggestion-tabpanel"
        aria-labelledby={`suggestion-tab-${selected.id}`}
        className="flex flex-col gap-1.5"
      >
        <p className="flex items-center gap-1.5 px-5 text-xs leading-normal font-medium text-chat-brand-text">
          <SelectedIcon className="size-[17px] shrink-0" aria-hidden="true" />
          {selected.label}
        </p>
        {/* 탭이 바뀌면 key가 바뀌어 질문이 살짝 페이드 인 된다 (동작 줄이기 설정이면 바로 바뀜) */}
        <ul
          key={selected.id}
          className={cn(
            SUGGESTION_LIST_CLASS,
            "gap-1 animate-in fade-in-0 duration-200 motion-reduce:animate-none",
          )}
        >
          {selected.questions.map((question) => (
            <li key={question}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(question)}
                className={cn(SUGGESTION_ROW_CLASS, "py-1.5")}
              >
                <span className="break-keep">{question}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
