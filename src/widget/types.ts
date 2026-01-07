// 위젯 관련 타입 정의

export type Role = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
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

