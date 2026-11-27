import { cn } from "@/lib/utils";
import type { SuggestedQuestionResponse } from "@/api/types";
import { TRENDING_LIMIT, type SuggestedQuestionsState } from "../useSuggestedQuestions";
import {
  SUGGESTION_CARD_CLASS,
  SUGGESTION_LIST_CLASS,
  SUGGESTION_ROW_CLASS,
} from "./SuggestionTabsCard";
import { FlameIcon } from "./SuggestionIcons";

interface TrendingQuestionsCardProps {
  state: SuggestedQuestionsState;
  onPick: (item: SuggestedQuestionResponse) => void;
  disabled?: boolean;
  className?: string;
}

/** 불꽃 그림 (Figma 'Fire_animation'). 그림자 여백까지 담긴 원본이라 24px 칸 밖으로 넘치게 둔다 */
function FireMark() {
  return (
    <span aria-hidden="true" className="relative size-6 shrink-0">
      <img
        src="/icons/fire.svg"
        alt=""
        className="absolute inset-[-144.07%_-152.96%_-181.56%_-152.75%] block size-auto max-w-none"
      />
    </span>
  );
}

/**
 * '요즘 뜨는 질문' 카드 (Figma '02 후'): 추천 질문 API(관리자 질문 → 공지 기반 질문)에서 받은 질문.
 * 화면에는 question을 보여주고, 누르면 prompt(없으면 question)를 채팅으로 보낸다.
 */
export default function TrendingQuestionsCard({
  state,
  onPick,
  disabled = false,
  className,
}: TrendingQuestionsCardProps) {
  return (
    <section aria-labelledby="trending-heading" className={cn(SUGGESTION_CARD_CLASS, className)}>
      <h3
        id="trending-heading"
        className="flex items-center gap-1.5 px-5 text-xs leading-normal font-medium text-chat-brand-text"
      >
        <FlameIcon className="size-[17px] shrink-0" aria-hidden="true" />
        요즘 뜨는 질문
      </h3>

      {state.status === "loading" ? (
        <div aria-busy="true" className="flex flex-col gap-1.5 px-5">
          {Array.from({ length: TRENDING_LIMIT }, (_, index) => (
            <div key={index} className="flex h-8 items-center gap-2.5">
              <div className="size-6 shrink-0 animate-pulse rounded-full bg-chat-hover" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-chat-hover" />
            </div>
          ))}
          <span className="sr-only">요즘 뜨는 질문을 불러오는 중</span>
        </div>
      ) : (
        <ul className={cn(SUGGESTION_LIST_CLASS, "gap-1.5")}>
          {state.items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(item)}
                className={SUGGESTION_ROW_CLASS}
              >
                <FireMark />
                <span className="min-w-0 break-keep">{item.question}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
