import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToken, useVerifyToken } from "@/api/auth";
import TopBar from "./TopBar";
import Composer from "./Composer";
import UsageGuideDialog from "./UsageGuideDialog";
import { hasActiveStream, sendMessage, setShowSources, useChatStore } from "../chatStore";
import { FOOTNOTE_TEXT, suggestedQuestions } from "../suggestions";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/** 홈(새 채팅) 메인 영역: 상단 바 → 배지·인사말 → 입력창 → 추천 질문 → 안내문 */
export default function HomeView() {
  const navigate = useNavigate();
  const { showSources, streaming } = useChatStore();
  const [value, setValue] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  const hasToken = !!getToken();
  const { data: user } = useVerifyToken(hasToken);

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

  const guideButton = (
    <button
      type="button"
      onClick={() => setGuideOpen(true)}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-chat-md px-3 text-sm font-medium text-chat-ink-2 transition-colors hover:bg-chat-hover hover:text-chat-ink",
        FOCUS_RING,
      )}
    >
      <CircleHelp className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
      이용 안내
    </button>
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
      <TopBar actions={guideButton} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* 시안: padding 0 48px 48px. 좁은 화면에서만 상단 여백을 조금 둔다 */}
        <div className="flex min-h-full flex-col items-center justify-center gap-7 px-4 pt-6 pb-12 sm:px-6 lg:px-12 lg:pt-0">
          <span className="rounded-full border border-chat-brand-100 bg-chat-brand-50 px-3.5 py-1.5 text-[13px] leading-[18px] font-semibold text-chat-brand-strong">
            GIST 구성원을 위한 정보 챗봇
          </span>

          <div className="flex flex-col items-center gap-3.5">
            <h1 className="text-center text-[32px] leading-[1.2] font-extrabold tracking-[-0.02em] break-keep text-chat-ink sm:text-[44px]">
              {user?.name ? `${user.name}님, 반가워요` : "반가워요"}
              <br />
              <span className="text-chat-brand-text">오늘은 무엇이 궁금하신가요?</span>
            </h1>
            <p className="text-center text-base leading-[1.6] break-keep text-chat-muted">
              학사공지·장학·생활 정보를 공지 원문과 함께 찾아 드려요.
            </p>
          </div>

          <Composer
            variant="hero"
            value={value}
            onChange={setValue}
            onSubmit={() => submit(value)}
            disabled={blocked}
            placeholder="학사 일정, 장학금, 셔틀버스… 무엇이든 물어보세요"
            ariaLabel="질문 입력"
            tools={sourcesToggle}
            autoFocus
          />

          <div className="grid w-full max-w-[760px] grid-cols-1 gap-3 sm:grid-cols-2">
            {suggestedQuestions.map(({ category, question, icon: Icon }) => (
              <button
                key={question}
                type="button"
                disabled={blocked}
                onClick={() => submit(question)}
                className={cn(
                  "flex min-w-0 items-center gap-3.5 rounded-chat-lg border border-chat-border bg-chat-surface px-4 py-3.5 text-left shadow-chat-sm transition-colors hover:border-chat-brand-100 hover:bg-chat-brand-50/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-chat-border disabled:hover:bg-chat-surface",
                  FOCUS_RING,
                )}
              >
                <span className="flex size-[38px] shrink-0 items-center justify-center rounded-chat-md bg-chat-brand-50 text-chat-brand">
                  <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs leading-4 font-semibold text-chat-subtle">
                    {category}
                  </span>
                  <span className="text-[15px] leading-[22px] font-semibold break-words text-chat-ink">
                    {question}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="shrink-0 px-6 pb-5 text-center text-xs leading-[18px] text-chat-subtle">
        {FOOTNOTE_TEXT}
      </p>

      <UsageGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
    </>
  );
}
