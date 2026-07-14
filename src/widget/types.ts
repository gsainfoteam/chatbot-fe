// 위젯 관련 타입 정의

export type Role = "user" | "assistant";

export type SourceType = "url" | "image";

export interface Source {
  type: SourceType;
  url: string;
  title?: string; // 출처 제목
}

export type FeedbackRating = "GOOD" | "BAD";

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  sources?: Source[]; // 출처 정보
  serverId?: string; // 백엔드에 저장된 메시지 ID (피드백/재생성 API 호출용)
  feedback?: FeedbackRating | null; // 현재 저장된 피드백
  regeneratedAnswer?: boolean; // 재생성으로 만들어진 답변 (다시 재생성 불가)
}

export interface ColorTheme {
  primary?: string;
  button?: string;
  background?: string;
  text?: string;
  textSecondary?: string;
  border?: string;
  userMessageBg?: string;
  assistantMessageBg?: string;
}

export interface WidgetContext {
  widgetKey?: string;
  pageUrl?: string;
  colors?: ColorTheme;
}
