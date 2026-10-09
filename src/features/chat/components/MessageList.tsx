import { useChatStore } from "../chatStore";
import type { ChatThread, StreamingState } from "../types";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

interface MessageListProps {
  thread: ChatThread;
  streaming: StreamingState | undefined;
  showSources: boolean;
}

/** 대화 메시지 열 (760px 컬럼, 메시지 간 24px) */
export default function MessageList({
  thread,
  streaming,
  showSources,
}: MessageListProps) {
  const { feedbackBusy } = useChatStore();

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6">
      {thread.messages.map((message) =>
        message.role === "user" ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <AssistantMessage
            key={message.id}
            thread={thread}
            message={message}
            isStreaming={streaming?.messageId === message.id}
            statusText={streaming?.statusText ?? ""}
            showSources={showSources}
            feedbackBusy={!!feedbackBusy[message.id]}
          />
        ),
      )}
    </div>
  );
}
