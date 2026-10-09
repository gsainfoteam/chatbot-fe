import { useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/common";
import { deleteThread } from "../chatStore";
import type { ChatThread } from "../types";

interface DeleteThreadDialogProps {
  /** 삭제할 대화. null이면 닫힌 상태 */
  thread: ChatThread | null;
  onClose: () => void;
}

/**
 * 대화 삭제 확인 모달. 사이드바 목록의 쓰레기통 버튼과 대화 화면 "더 보기" 메뉴가 같이 씁니다.
 * 지금 보고 있는 대화를 지우면 홈으로 이동합니다.
 */
export default function DeleteThreadDialog({ thread, onClose }: DeleteThreadDialogProps) {
  const navigate = useNavigate();
  const { threadId: activeThreadId } = useParams<{ threadId: string }>();

  const confirm = () => {
    if (!thread) return;
    deleteThread(thread.id);
    if (thread.id === activeThreadId) navigate("/", { replace: true });
  };

  return (
    <ConfirmDialog
      open={thread !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      variant="danger"
      title="대화를 삭제할까요?"
      description={
        thread
          ? `"${thread.title}" 대화와 메시지가 지워져요. 삭제한 대화는 되돌릴 수 없어요.`
          : ""
      }
      confirmLabel="삭제"
      contentClassName="font-chat"
      onConfirm={confirm}
    />
  );
}
