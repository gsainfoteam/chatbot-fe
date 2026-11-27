import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import TopBar from "./TopBar";
import Composer from "./Composer";
import ChatFooter from "./ChatFooter";
import RepelHeading from "./RepelHeading";
import SuggestionCategoryCard from "./SuggestionCategoryCard";
import TrendingQuestionsCard from "./TrendingQuestionsCard";
import { hasActiveStream, sendMessage, setShowSources, useChatStore } from "../chatStore";
import { suggestionCategories, type SuggestionCategoryId } from "../suggestions";
import { useSuggestedQuestions } from "../useSuggestedQuestions";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/**
 * 홈(새 대화) 메인 영역: 인사말 → 입력창 (Figma 최종 01·02) → 추천 질문 (Figma '02 후') → 푸터
 */
export default function HomeView() {
  const navigate = useNavigate();
  const { showSources, streaming } = useChatStore();
  const [value, setValue] = useState("");
  // 카테고리 카드는 한 번에 하나만 펼친다 (처음엔 모두 접힘)
  const [openCategory, setOpenCategory] = useState<SuggestionCategoryId | null>(null);
  const trending = useSuggestedQuestions();

  // 위젯 세션이 하나라 다른 대화의 답변이 끝날 때까지는 새 질문을 보낼 수 없다
  // TODO(BE 연결): 429(질문 횟수 초과) 안내가 생기면 여기서 입력창·추천 질문도 잠근다
  const blocked = hasActiveStream(streaming);

  // 새 대화를 만들고 바로 스레드 화면으로 이동 (스트리밍은 저장소에서 이어짐)
  // prompt가 있으면(추천 질문) 말풍선엔 text, 채팅 요청엔 prompt를 보낸다
  const submit = (text: string, prompt?: string | null) => {
    const id = sendMessage(null, text, { prompt });
    if (!id) return;
    setValue("");
    navigate(`/c/${id}`);
  };

  const sourcesToggle = (
    <button
      type="button"
      aria-pressed={showSources}
      onClick={() => setShowSources(!showSources)}
      className={cn(
        "flex h-[34px] min-w-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold whitespace-nowrap transition-colors",
        showSources
          ? "border-chat-brand-100 bg-chat-brand-50 text-chat-brand-strong"
          : "border-chat-border bg-chat-surface text-chat-ink-2 hover:bg-chat-hover",
        FOCUS_RING,
      )}
    >
      {showSources && (
        <Check className="size-[15px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
      )}
      <span className="truncate">출처 공지 함께 보기</span>
    </button>
  );

  return (
    <>
      <div className="chat-home-bg flex min-h-0 flex-1 flex-col">
        {/* 데스크톱은 상단 바 없이 사이드바만, 모바일은 로고 + 메뉴(드로어 열기) (Figma 최종 09) */}
        <div className="lg:hidden">
          <TopBar />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-[832px] flex-col justify-center gap-6 px-5 pt-4 pb-10 sm:gap-7 sm:px-6 sm:pt-6 sm:pb-12 lg:px-0 lg:py-16">
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-xs leading-normal font-medium text-chat-brand-text sm:text-sm">
                학교생활의 첫 질문, GIST 챗봇
              </p>
              {/* 모바일(Figma 09)은 짧은 문구, 그 이상은 마우스를 가져가면 글자가 밀려나는 인사말 */}
              <h1 className="text-[30px] leading-[1.35] font-bold break-keep text-chat-ink sm:hidden">
                GIST가 처음이라면,
                <span className="block text-chat-brand-text">여기서 물어보세요.</span>
              </h1>
              <RepelHeading
                className="hidden text-center text-5xl leading-[1.25] font-bold break-keep text-chat-ink sm:block"
                lines={[
                  { text: "처음 만나는 GIST," },
                  { text: "궁금한 것부터 물어보세요.", className: "text-chat-brand-text" },
                ]}
              />
              <p className="text-xs leading-normal break-keep text-chat-muted sm:text-base">
                학사부터 학교생활까지, 관련 자료와 함께 찾아드려요.
              </p>
            </div>

            <Composer
              value={value}
              onChange={setValue}
              onSubmit={() => submit(value)}
              disabled={blocked}
              placeholder="수강신청, 기숙사, 학교생활… 편하게 물어보세요"
              ariaLabel="질문 입력"
              tools={sourcesToggle}
              autoFocus
            />

            <section aria-labelledby="suggested-heading" className="flex flex-col gap-3">
              <h2
                id="suggested-heading"
                className="text-sm leading-normal font-medium text-chat-sidebar-muted"
              >
                무엇부터 물어볼지 고민된다면
              </h2>
              {/*
                데스크톱: [카테고리 카드 3개 세로, 320px] [요즘 뜨는 질문] (Figma '02 후')
                모바일: 요즘 뜨는 질문이 맨 위, 그 아래 카테고리 카드 한 열
              */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                <TrendingQuestionsCard
                  state={trending}
                  disabled={blocked}
                  onPick={(item) => submit(item.question, item.prompt)}
                  className="justify-center sm:order-2 sm:min-h-[184px] sm:min-w-0 sm:flex-1"
                />
                <div className="flex flex-col gap-3 sm:order-1 sm:w-[320px] sm:shrink-0 sm:gap-4">
                  {suggestionCategories.map((category) => (
                    <SuggestionCategoryCard
                      key={category.id}
                      category={category}
                      expanded={openCategory === category.id}
                      onToggle={() =>
                        setOpenCategory((current) =>
                          current === category.id ? null : category.id,
                        )
                      }
                      onPick={(question) => submit(question)}
                      disabled={blocked}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <ChatFooter showCredit />
    </>
  );
}
