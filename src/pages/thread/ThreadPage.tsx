import { useParams } from "react-router-dom";
import { ThreadView } from "@/features/chat";

/** 같은 라우트에서 대화만 바뀌어도 입력 중인 내용이 넘어가지 않도록 threadId별로 다시 마운트 */
export default function ThreadPage() {
  const { threadId } = useParams();
  return <ThreadView key={threadId} />;
}
