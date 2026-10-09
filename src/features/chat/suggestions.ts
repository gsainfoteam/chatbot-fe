// 홈(새 채팅) 추천 질문 4개 — 시안 01-home-new-chat.html 순서 그대로
import type { LucideIcon } from "lucide-react";
import { Award, Bus, Calendar, House } from "lucide-react";

export interface SuggestedQuestion {
  /** 카테고리 레이블 (12px caption) */
  category: string;
  /** 카드에 표시되고 실제로 전송되는 질문 */
  question: string;
  icon: LucideIcon;
}

export const suggestedQuestions: SuggestedQuestion[] = [
  { category: "학사", question: "이번 주 학사 일정 알려줘", icon: Calendar },
  { category: "교통", question: "오늘 셔틀버스 시간표 보여줘", icon: Bus },
  { category: "장학", question: "지금 신청할 수 있는 장학금 있어?", icon: Award },
  { category: "생활", question: "기숙사 최근 공지 요약해줘", icon: House },
];

/** 입력창 아래 안내문 (home / thread 공통) */
export const FOOTNOTE_TEXT =
  "답변은 GIST 공지를 바탕으로 생성돼요. 마감일·제출 서류는 원문을 꼭 확인해 주세요.";
