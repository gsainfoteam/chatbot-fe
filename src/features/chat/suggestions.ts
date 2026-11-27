// 홈 '무엇부터 물어볼지 고민된다면' 카테고리 카드 3개 — Figma '02 후' 추천 질문 카드 순서·문구 그대로

export type SuggestionCategoryId = "freshman" | "campus-life" | "career";

export interface SuggestionCategory {
  id: SuggestionCategoryId;
  /** 카드 머리의 빨간 라벨 (12px) */
  label: string;
  /** 펼쳤을 때 보이고 누르면 그대로 전송되는 질문 */
  questions: string[];
}

export const suggestionCategories: SuggestionCategory[] = [
  {
    id: "freshman",
    label: "GIST 새내기에요!",
    questions: [
      "수강 신청은 어떻게 하나요?",
      "학교 Wi-Fi는 어떻게 연결하나요?",
      "어떤 동아리가 있나요?",
    ],
  },
  {
    id: "campus-life",
    label: "학교 생활이 궁금해요!",
    questions: [
      "23학번 졸업 요건이 궁금해요",
      "교내 장학금은 무엇이 있나요?",
      "재학생 혜택이 궁금해요",
    ],
  },
  {
    id: "career",
    label: "진로를 고민 중이에요!",
    questions: [
      "학부 인턴은 어떻게 시작하나요?",
      "전공별 취업률·진학률이 궁금해요",
      "대학원 진학 절차가 궁금해요",
    ],
  },
];

/** 화면 하단 안내문 (home / thread 공통). 모바일은 짧은 문구 (Figma 최종 09) */
export const FOOTNOTE_TEXT =
  "답변과 함께 관련 자료를 확인할 수 있어요. 중요한 일정과 신청 조건은 원문을 확인해 주세요.";

export const FOOTNOTE_TEXT_SHORT = "중요한 일정과 신청 조건은 원문을 확인해 주세요.";
