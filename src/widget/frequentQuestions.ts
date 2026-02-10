// 자주 묻는 질문 리스트
// 채팅 위젯 초기 화면에 표시됩니다.

export interface FrequentQuestion {
  /** 아이콘 (이모지) */
  icon: string;
  /** 카드에 표시될 짧은 라벨 */
  label: string;
  /** 실제 전송될 질문 내용 (생략 시 label이 사용됩니다) */
  question?: string;
}

const frequentQuestions: FrequentQuestion[] = [
  {
    icon: "📅",
    label: "학사 일정",
    question: "이번 학기 학사 일정을 알려주세요.",
  },
  {
    icon: "📝",
    label: "수강신청 방법",
    question: "수강신청은 어떻게 하나요?",
  },
  {
    icon: "💰",
    label: "장학금 안내",
    question: "장학금 종류와 신청 방법을 알려주세요.",
  },
  {
    icon: "🪪",
    label: "학생증 발급",
    question: "학생증은 어디서 어떻게 발급받나요?",
  },
  {
    icon: "📶",
    label: "Wi-Fi 연결",
    question: "학교 Wi-Fi는 어떻게 연결하나요?",
  },
  {
    icon: "🗺️",
    label: "캠퍼스 맵",
    question: "캠퍼스 지도와 주요 건물 위치를 알려주세요.",
  },
  {
    icon: "🎓",
    label: "졸업 요건 확인",
    question: "졸업 요건을 알려주세요.",
  },
  {
    icon: "📖",
    label: "전공 선언 방법",
    question: "전공 선언 방법을 알려주세요.",
  },
  {
    icon: "📞",
    label: "주요 부서 연락처",
    question: "주요 부서 연락처를 알려주세요.",
  },
  {
    icon: "🏫",
    label: "휴학/복학 절차",
    question: "휴학/복학 절차를 알려주세요.",
  },
];

export default frequentQuestions;
