import type { ComponentType, SVGProps } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SuggestionCategory, SuggestionCategoryId } from "../suggestions";
import { AngleDownIcon, ChildHeadIcon, GraduationCapIcon, SchoolIcon } from "./SuggestionIcons";

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

/** 펼친 카드·요즘 뜨는 질문 카드의 질문 한 줄 (16px, 좌우 20, 호버 시 옅은 브랜드 바탕) */
export const SUGGESTION_ROW_CLASS = cn(
  "flex w-full items-center gap-2.5 rounded-chat-md px-5 py-1 text-left text-base leading-normal font-medium text-chat-sidebar-ink transition-colors hover:bg-chat-brand-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent",
  FOCUS_RING,
);

interface SuggestionCategoryCardProps {
  category: SuggestionCategory;
  expanded: boolean;
  onToggle: () => void;
  onPick: (question: string) => void;
  disabled?: boolean;
}

/**
 * 카테고리 카드 (Figma '02 후' 추천 질문 카드): 머리를 누르면 질문 3개가 펼쳐진다.
 * 한 번에 하나만 펼치는 규칙은 부모(HomeView)가 expanded로 관리한다.
 */
export default function SuggestionCategoryCard({
  category,
  expanded,
  onToggle,
  onPick,
  disabled = false,
}: SuggestionCategoryCardProps) {
  const Icon = CATEGORY_ICONS[category.id];
  const panelId = `suggestion-${category.id}`;

  return (
    <div className={SUGGESTION_CARD_CLASS}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={cn(
          "-my-4 flex w-full items-center justify-between gap-2 rounded-[14px] px-5 py-4 text-left",
          FOCUS_RING,
        )}
      >
        <span className="flex items-center gap-1.5 text-xs leading-normal font-medium text-chat-brand-text">
          <Icon className="size-[17px] shrink-0" aria-hidden="true" />
          {category.label}
        </span>
        <AngleDownIcon
          className={cn(
            "size-4 shrink-0 text-chat-sidebar-muted transition-transform duration-200 motion-reduce:transition-none",
            expanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <ul id={panelId} className="flex flex-col gap-1.5">
          {category.questions.map((question) => (
            <li key={question}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(question)}
                className={SUGGESTION_ROW_CLASS}
              >
                <span className="break-keep">{question}</span>
                <ArrowUpRight className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
