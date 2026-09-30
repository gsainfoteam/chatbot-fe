import type { ListUnansweredQuestionsParams } from "./types";

export const unansweredQuestionQueryKeys = {
  all: ["unanswered-questions"] as const,
  list: (params: ListUnansweredQuestionsParams) =>
    [...unansweredQuestionQueryKeys.all, "list", params] as const,
  detail: (id: string) =>
    [...unansweredQuestionQueryKeys.all, "detail", id] as const,
};
