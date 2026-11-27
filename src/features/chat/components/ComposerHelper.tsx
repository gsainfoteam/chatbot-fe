import { useState } from "react";
import { cn } from "@/lib/utils";
import UsageGuideDialog from "./UsageGuideDialog";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-brand";

/** 입력창 왼쪽 아래 안내 (Figma 최종 01·03 '질문 도움'): 로그인 없이 질문 + 챗봇 사용법 */
export default function ComposerHelper() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
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
      <UsageGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
    </>
  );
}
