// 위젯 관련 타입 정의

import type {
  AgentStep,
  AgentStepStatus,
  ExternalSource,
  WebSource,
} from "@/api/widgetStreamEvents";

export type { AgentStep, AgentStepStatus, ExternalSource, WebSource };

export type Role = "user" | "assistant";

export type SourceType = "url" | "image";

export interface Source {
  type: SourceType;
  url: string;
  title?: string; // 출처 제목
  resourcePath?: string; // 인증된 백엔드 프록시를 사용하는 인코딩 경로
}

export type FeedbackRating = "GOOD" | "BAD";

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  sources?: Source[]; // 출처 정보 (리소스 센터 문서)
  externalSources?: ExternalSource[]; // Ziggle 공지
  webSources?: WebSource[]; // 웹 검색 출처 (공식 도메인 여부 포함)
  steps?: AgentStep[]; // 에이전트 진행 단계 (처음 나타난 순서)
  serverId?: string; // 백엔드에 저장된 메시지 ID (피드백/재생성 API 호출용)
  feedback?: FeedbackRating | null; // 현재 저장된 피드백
  status?: "waiting" | "researching" | "streaming" | "completed" | "failed" | "cancelled";
  notice?: string;
  regeneratedFromMessageId?: string;
  regenerationAttempted?: boolean;
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
