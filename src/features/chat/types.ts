// 홈(채팅 앱) 도메인 타입

export type ChatRole = "user" | "assistant";

export interface ChatSource {
  type: "url" | "image";
  url: string;
  title?: string;
}

export type ChatFeedback = "GOOD" | "BAD";

export interface ChatFeedbackComment {
  /** 👎일 때 고른 이유 (FEEDBACK_REASONS 라벨) */
  reasons: string[];
  text: string;
  submittedAt: number;
}

export interface ThreadMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
  /** RAG 응답 출처 (assistant 전용) */
  sources?: ChatSource[];
  /** 백엔드에 저장된 메시지 ID — 피드백 API 호출용 */
  serverId?: string;
  feedback?: ChatFeedback | null;
  /** 👍/👎 뒤 의견 패널에서 남긴 의견 (서버 전송 API가 없어 로컬에만 저장) */
  feedbackComment?: ChatFeedbackComment;
  /** 후속 질문 제안. 백엔드가 제공할 때만 채워지며 없으면 칩을 렌더하지 않습니다. */
  followUps?: string[];
  /** 전송/응답 실패 안내 메시지 (피드백·출처 없음) */
  error?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ThreadMessage[];
}

/** 답변 생성 중 상태 (스레드별, 저장하지 않음) */
export interface StreamingState {
  messageId: string;
  /** 입력창 아래·메시지 자리 안내 문구 */
  statusText: string;
}
