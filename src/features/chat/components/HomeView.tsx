import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import TopBar from "./TopBar";
import Composer from "./Composer";
import ChatFooter from "./ChatFooter";
import RepelHeading from "./RepelHeading";
import UsageGuideDialog from "./UsageGuideDialog";
import { hasActiveStream, sendMessage, setShowSources, useChatStore } from "../chatStore";
import { suggestedQuestions } from "../suggestions";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/** 홈(새 대화) 메인 영역 (Figma 최종 01·02): 인사말 → 입력창 → 추천 질문 → 푸터 */
export default function HomeView() {
  const navigate = useNavigate();
  const { showSources, streaming } = useChatStore();
  const [value, setValue] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

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

  const helper = (
    <>
      <p className="text-[13px] leading-normal text-chat-muted">로그인 없이 질문할 수 있어요</p>
      <button
        type="button"
        onClick={() => setGuideOpen(true)}
        className={cn(
          "-mx-1 flex h-8 items-center gap-2 rounded-chat-md px-1 text-sm font-medium text-chat-ink transition-colors hover:text-chat-brand-text",
          FOCUS_RING,
        )}
      >
        <span aria-hidden="true">?</span>
        챗봇 사용법
      </button>
    </>
  );

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
      {/* 데스크톱은 상단 바 없이 사이드바만, 모바일은 사이드바(드로어) 열기 버튼 */}
      <div className="lg:hidden">
        <TopBar />
      </div>

      <div className="chat-home-bg min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-[832px] flex-col justify-center gap-7 px-4 pt-6 pb-12 sm:px-6 lg:px-0 lg:py-16">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm leading-normal font-medium text-chat-brand-text">
              학교생활의 첫 질문, GIST 챗봇
            </p>
            {/* 마우스를 가져가면 글자가 밀려났다 돌아오는 인사말 */}
            <RepelHeading
              className="text-center text-[32px] leading-[1.25] font-bold break-keep text-chat-ink sm:text-5xl sm:leading-[1.25]"
              lines={[
                { text: "처음 만나는 GIST," },
                { text: "궁금한 것부터 물어보세요.", className: "text-chat-brand-text" },
              ]}
            />
            <p className="text-base leading-normal break-keep text-chat-muted">
              학사부터 학교생활까지, 관련 자료와 함께 찾아드려요.
            </p>
          </div>

          <Composer
            variant="hero"
            value={value}
            onChange={setValue}
            onSubmit={() => submit(value)}
            disabled={blocked}
            placeholder="수강신청, 기숙사, 학교생활… 편하게 물어보세요"
            ariaLabel="질문 입력"
            helper={helper}
            tools={sourcesToggle}
            autoFocus
          />

          <section aria-labelledby="suggested-heading" className="flex flex-col gap-3">
            <h2
              id="suggested-heading"
              className="text-sm leading-normal font-medium text-chat-muted"
            >
              무엇부터 물어볼지 고민된다면
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {suggestedQuestions.map(({ category, question }) => (
                <button
                  key={question}
                  type="button"
                  disabled={blocked}
                  onClick={() => submit(question)}
                  className={cn(
                    "flex min-h-[104px] min-w-0 flex-col items-start gap-4 rounded-[14px] border border-chat-border bg-chat-surface p-5 text-left font-medium leading-normal transition-colors hover:border-chat-brand-100 hover:bg-chat-brand-50/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-chat-border disabled:hover:bg-chat-surface",
                    FOCUS_RING,
                  )}
                >
                  <span className="text-xs text-chat-brand-text">{category}</span>
                  <span className="flex items-center gap-2 text-[17px] break-keep text-chat-ink">
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

      <ChatFooter showCredit />

      <UsageGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
    </>
  );
}
