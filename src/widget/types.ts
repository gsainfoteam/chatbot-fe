// 위젯 관련 타입 정의

export type Role = "user" | "assistant";

export type SourceType = "url" | "image";

export interface Source {
  type: SourceType;
  url: string;
  title?: string; // 출처 제목
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  sources?: Source[]; // 출처 정보
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
