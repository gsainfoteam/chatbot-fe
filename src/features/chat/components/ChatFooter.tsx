import { cn } from "@/lib/utils";
import { FOOTNOTE_TEXT, FOOTNOTE_TEXT_SHORT } from "../suggestions";

interface ChatFooterProps {
  /** 홈처럼 안내문 아래 'GIST · INFOTEAM'을 함께 보여줄 때 */
  showCredit?: boolean;
  className?: string;
}

/** 메인 영역 맨 아래 회색 띠 (Figma 최종 01·03·09 'Footer'). 모바일은 짧은 안내문 */
export default function ChatFooter({ showCredit = false, className }: ChatFooterProps) {
  return (
    <footer
      className={cn(
        "flex shrink-0 flex-col items-center gap-1 bg-chat-sidebar px-5 py-3.5 text-center text-[10px] leading-normal text-chat-muted sm:text-xs",
        className,
      )}
    >
      <p className="break-keep">
        <span className="sm:hidden">{FOOTNOTE_TEXT_SHORT}</span>
        <span className="hidden sm:inline">{FOOTNOTE_TEXT}</span>
      </p>
      {showCredit && <p className="text-[10px] font-medium">GIST · INFOTEAM</p>}
    </footer>
  );
}
