import type { UnansweredQuestion } from "./types";

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number, hours = 10): string {
  return new Date(
    Date.now() - (days * 24 + hours) * 60 * 60 * 1000,
  ).toISOString();
}

/** 관리자 UI 확인용 시드. CHA3-12 연동 시 제거됩니다. */
export const UNANSWERED_QUESTION_SEED: UnansweredQuestion[] = [
  {
    id: "uq-001",
    question: "지스트 기숙사 입사 신청 기간이 언제인가요?",
    createdAt: hoursAgo(5),
    status: "open",
    occurrenceCount: 7,
  },
  {
    id: "uq-002",
    question: "학부 연구참여 프로그램 지원 자격은 어떻게 되나요?",
    createdAt: hoursAgo(18),
    status: "open",
    occurrenceCount: 4,
  },
  {
    id: "uq-003",
    question:
      "국제협력팀 교환학생 파견 후 학점 인정은 어떤 서류와 절차로 진행되나요? 파견 대학 성적표를 어디에 제출해야 하는지도 알고 싶습니다.",
    createdAt: daysAgo(2, 8),
    status: "open",
    occurrenceCount: 3,
  },
  {
    id: "uq-004",
    question: "도서관 24시간 열람실 이용 규칙과 좌석 배정 방법을 알려주세요.",
    createdAt: daysAgo(3, 14),
    status: "open",
    occurrenceCount: 2,
  },
  {
    id: "uq-005",
    question: "졸업요건에서 영어성적 제출 기준이 올해부터 바뀌었나요?",
    createdAt: daysAgo(6, 11),
    status: "resolved",
    occurrenceCount: 5,
    resolvedAt: daysAgo(1, 3),
    injectedKnowledge: {
      type: "text",
      injectedAt: daysAgo(1, 3),
      text: "2026학년도 학부 졸업요건의 영어성적은 TOEIC 750, TOEFL iBT 80, IELTS 6.0 이상이며, 성적 유효기간은 제출일 기준 2년입니다. 자세한 기준은 학사팀 공지를 따릅니다.",
    },
  },
  {
    id: "uq-006",
    question: "캠퍼스 셔틀버스 주말 운행 시간표가 따로 있나요?",
    createdAt: daysAgo(8, 9),
    status: "open",
  },
];
