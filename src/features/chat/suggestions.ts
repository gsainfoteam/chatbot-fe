// 홈(새 대화) 추천 질문 4개 — Figma 최종 01 '무엇부터 물어볼지 고민된다면' 순서 그대로

export interface SuggestedQuestion {
  /** 카드 위쪽 빨간 라벨 (12px) */
  category: string;
  /** 카드에 표시되고 실제로 전송되는 질문 */
  question: string;
}

export const suggestedQuestions: SuggestedQuestion[] = [
  { category: "학사 · 첫 수강신청", question: "수강신청은 어떻게 하나요?" },
  { category: "캠퍼스 · 출입 준비", question: "모바일 출입카드는 어떻게 받나요?" },
  { category: "생활 · 인터넷 연결", question: "학교 Wi-Fi는 어떻게 연결하나요?" },
  { category: "장학 · 지원 알아보기", question: "신입생이 받을 수 있는 장학금은?" },
];

/** 화면 하단 안내문 (home / thread 공통). 모바일은 짧은 문구 (Figma 최종 09) */
export const FOOTNOTE_TEXT =
  "답변과 함께 관련 자료를 확인할 수 있어요. 중요한 일정과 신청 조건은 원문을 확인해 주세요.";

export const FOOTNOTE_TEXT_SHORT = "중요한 일정과 신청 조건은 원문을 확인해 주세요.";
