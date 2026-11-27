import { cn } from "@/lib/utils";
import { FOOTNOTE_TEXT } from "../suggestions";

interface ChatFooterProps {
  /** 홈처럼 안내문 아래 'GIST · INFOTEAM'을 함께 보여줄 때 */
  showCredit?: boolean;
  className?: string;
}

/** 메인 영역 맨 아래 회색 띠 (Figma 최종 01·03 'Footer') */
export default function ChatFooter({ showCredit = false, className }: ChatFooterProps) {
  return (
    <footer
      className={cn(
        "flex shrink-0 flex-col items-center gap-1 bg-chat-sidebar px-5 py-3.5 text-center leading-normal text-chat-muted",
        className,
      )}
    >
      <p className="text-xs break-keep">{FOOTNOTE_TEXT}</p>
      {showCredit && <p className="text-[10px] font-medium">GIST · INFOTEAM</p>}
    </footer>
  );
}
