import { CircleHelp } from "lucide-react";
import { Button, Dialog } from "@/components/common";

interface UsageGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GUIDE_ITEMS = [
  "학사 공지, 장학금, 셔틀버스, 기숙사 등 GIST 공식 공지를 바탕으로 답해요.",
  "답변 아래 출처 카드에서 원문 공지를 바로 확인할 수 있어요.",
  "한 세션에서 질문은 최대 5번까지 할 수 있어요. 잠시 후 다시 질문할 수 있어요.",
  "답변이 정확하지 않을 수 있어요. 마감일·제출 서류는 원문을 꼭 확인해 주세요.",
];

const LINK_CLASS =
  "font-medium text-chat-brand-text underline underline-offset-2 hover:text-chat-brand-strong";

/** 상단 바 "이용 안내" 버튼이 여는 안내 모달 */
export default function UsageGuideDialog({ open, onOpenChange }: UsageGuideDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      icon={<CircleHelp className="size-5" strokeWidth={1.8} aria-hidden="true" />}
      iconClassName="bg-chat-brand-50 text-chat-brand ring-chat-brand-100"
      title="이용 안내"
      description="GIST 챗봇을 이렇게 써 보세요."
      contentClassName="font-chat"
      footer={
        <Button variant="primary" onClick={() => onOpenChange(false)}>
          확인
        </Button>
      }
    >
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-chat-muted">
        {GUIDE_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-6 text-chat-muted">
        문제가 있나요?{" "}
        <a
          href="https://cs.gistory.me?service=chatbot"
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          신고·문의하기
        </a>
        {" · "}
        <a href="mailto:chatbot@gistory.me" className={LINK_CLASS}>
          chatbot@gistory.me
        </a>
      </p>
    </Dialog>
  );
}
