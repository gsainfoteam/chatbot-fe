import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import TopBar from "./TopBar";
import Composer from "./Composer";
import ChatFooter from "./ChatFooter";
import ComposerHelper from "./ComposerHelper";
import RepelHeading from "./RepelHeading";
import { hasActiveStream, sendMessage, setShowSources, useChatStore } from "../chatStore";
import { suggestedQuestions } from "../suggestions";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/** 홈(새 대화) 메인 영역 (Figma 최종 01·02): 인사말 → 입력창 → 추천 질문 → 푸터 */
export default function HomeView() {
  const navigate = useNavigate();
  const { showSources, streaming } = useChatStore();
  const [value, setValue] = useState("");

  // 위젯 세션이 하나라 다른 대화의 답변이 끝날 때까지는 새 질문을 보낼 수 없다
  // TODO(BE 연결): 429(질문 횟수 초과) 안내가 생기면 여기서 입력창·추천 질문도 잠근다
  const blocked = hasActiveStream(streaming);

  // 새 대화를 만들고 바로 스레드 화면으로 이동 (스트리밍은 저장소에서 이어짐)
  const submit = (text: string) => {
    const id = sendMessage(null, text);
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
              helper={<ComposerHelper />}
              tools={sourcesToggle}
              autoFocus
            />

            <section aria-labelledby="suggested-heading" className="flex flex-col gap-3">
              <h2
                id="suggested-heading"
                className="text-sm leading-normal font-medium text-chat-muted"
              >
                <span className="sm:hidden">이런 질문부터 시작해 보세요</span>
                <span className="hidden sm:inline">무엇부터 물어볼지 고민된다면</span>
              </h2>
              {/* 모바일(Figma 09)은 질문만 있는 한 줄 카드 3개, 그 이상은 라벨이 붙은 2열 카드 4개 */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
                {suggestedQuestions.map(({ category, question }, index) => (
                  <button
                    key={question}
                    type="button"
                    disabled={blocked}
                    onClick={() => submit(question)}
                    className={cn(
                      "flex min-h-12 min-w-0 flex-col items-start justify-center rounded-xl border border-chat-border bg-chat-surface px-4 py-2.5 text-left font-medium leading-normal transition-colors sm:min-h-[104px] sm:justify-start sm:gap-4 sm:rounded-[14px] sm:p-5",
                      index >= 3 && "max-sm:hidden",
                      "hover:border-chat-brand-100 hover:bg-chat-brand-50/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-chat-border disabled:hover:bg-chat-surface",
                      FOCUS_RING,
                    )}
                  >
                    <span className="hidden text-xs text-chat-brand-text sm:block">{category}</span>
                    <span className="flex items-center gap-2 text-sm break-keep text-chat-ink sm:text-[17px]">
                      {question}
                      <ArrowUpRight
                        className="size-4 shrink-0"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <ChatFooter showCredit />
    </>
  );
}
