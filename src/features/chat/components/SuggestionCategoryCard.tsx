import type { ComponentType, SVGProps } from "react";
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

/**
 * 추천 질문 목록: 좌우 8px 띄워 호버 바탕이 카드 가장자리에 붙지 않게 한다.
 * 행 안쪽 12px과 합쳐 글자는 카드 머리(20px)와 같은 줄에서 시작한다.
 */
export const SUGGESTION_LIST_CLASS = "flex flex-col px-2";

/** 요즘 뜨는 질문 카드의 질문 한 줄 (14px, 화살표 없이, 호버 시 옅은 브랜드 바탕) */
export const SUGGESTION_ROW_CLASS = cn(
  "flex w-full items-center gap-2.5 rounded-chat-md px-3 py-1 text-left text-sm leading-normal font-medium text-chat-sidebar-ink transition-colors hover:bg-chat-brand-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent",
  FOCUS_RING,
);

/** 펼친 카테고리 카드의 질문 한 줄: 14px, 화살표 없이 질문만. 펼침 영역이 overflow-hidden이라 포커스 링은 안쪽에 그린다 */
const CATEGORY_ROW_CLASS =
  "flex w-full items-center rounded-chat-md px-3 py-1.5 text-left text-sm leading-normal font-medium text-chat-sidebar-ink transition-colors hover:bg-chat-brand-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-chat-brand";

interface SuggestionCategoryCardProps {
  category: SuggestionCategory;
  expanded: boolean;
  onToggle: () => void;
  onPick: (question: string) => void;
  disabled?: boolean;
}

/**
 * 카테고리 카드 (Figma '02 후' 추천 질문 카드): 머리를 누르면 질문 3개가 부드럽게 펼쳐진다.
 * 펼침은 grid-template-rows 0fr ↔ 1fr 전환으로 높이를 애니메이션한다 (동작 줄이기 설정이면 바로 바뀜).
 * 접힌 동안에는 inert로 질문 버튼을 포커스·스크린리더에서 뺀다.
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
    // 머리와 질문 사이 16px은 펼침 영역 안쪽 여백으로 둔다 (접혔을 때 간격이 남지 않도록 gap 0)
    <div className={cn(SUGGESTION_CARD_CLASS, "gap-0")}>
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

      <div
        id={panelId}
        inert={!expanded}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className={cn(SUGGESTION_LIST_CLASS, "gap-1 pt-4")}>
            {category.questions.map((question) => (
              <li key={question}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPick(question)}
                  className={CATEGORY_ROW_CLASS}
                >
                  <span className="break-keep">{question}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
