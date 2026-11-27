import { useEffect, useState } from "react";
import type { SuggestedQuestionResponse } from "@/api/types";
import { loadSuggestedQuestions } from "./chatStore";

/** 홈 '요즘 뜨는 질문' 카드에 보여줄 개수 (Figma '02 후' 카드 3줄) */
export const TRENDING_LIMIT = 3;

export type SuggestedQuestionsState =
  | { status: "loading" }
  | { status: "ready"; items: SuggestedQuestionResponse[] }
  | { status: "unavailable" };

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

/** 추천 질문 API 결과. 실패하거나 비어 있으면 unavailable (카드를 숨긴다) */
export function useSuggestedQuestions(): SuggestedQuestionsState {
  const [state, setState] = useState<SuggestedQuestionsState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void requestOnce().then((items) => {
      if (cancelled) return;
      setState(
        items.length > 0
          ? { status: "ready", items: items.slice(0, TRENDING_LIMIT) }
          : { status: "unavailable" },
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
