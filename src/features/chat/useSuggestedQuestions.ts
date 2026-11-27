import { useEffect, useState } from "react";
import type { SuggestedQuestionResponse } from "@/api/types";
import { loadSuggestedQuestions } from "./chatStore";

/** 홈 '요즘 뜨는 질문' 카드에 보여줄 개수 (Figma '02 후' 카드 3줄) */
export const TRENDING_LIMIT = 3;

/**
 * 추천 질문 API를 쓸 수 없을 때(운영 서버 미배포·세션 발급 실패·빈 응답) 보여줄 기본 질문.
 * Figma '02 후' 요즘 뜨는 질문 문구 그대로. API가 배포되면 서버 질문으로 바뀐다.
 */
export const FALLBACK_TRENDING: SuggestedQuestionResponse[] = [
  { id: "fallback-1", question: "2027 전공 선언 방법을 알려주세요", prompt: null, source: "ADMIN" },
  { id: "fallback-2", question: "기숙사 전열 기구 검사 기간이 언제인가요?", prompt: null, source: "ADMIN" },
  { id: "fallback-3", question: "2027 겨울 학기 G-SURF 접수 방법을 알려주세요", prompt: null, source: "ADMIN" },
];

export type SuggestedQuestionsState =
  | { status: "loading" }
  | { status: "ready"; items: SuggestedQuestionResponse[] };

// 서버가 요청마다 무작위로 고르므로, 홈을 오갈 때마다 질문이 바뀌지 않게 페이지당 한 번만 부른다
let request: Promise<SuggestedQuestionResponse[]> | null = null;

function requestOnce(): Promise<SuggestedQuestionResponse[]> {
  request ??= loadSuggestedQuestions().then((items) => {
    // 실패·빈 응답은 다음에 홈에 왔을 때 다시 시도한다
    if (items.length === 0) request = null;
    return items;
  });
  return request;
}

/** 추천 질문 API 결과. 실패하거나 비어 있으면 기본 질문(FALLBACK_TRENDING)을 쓴다 */
export function useSuggestedQuestions(): SuggestedQuestionsState {
  const [state, setState] = useState<SuggestedQuestionsState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void requestOnce().then((items) => {
      if (cancelled) return;
      setState({
        status: "ready",
        items: (items.length > 0 ? items : FALLBACK_TRENDING).slice(0, TRENDING_LIMIT),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
