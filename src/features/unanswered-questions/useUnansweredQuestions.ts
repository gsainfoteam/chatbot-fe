import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUnansweredQuestion,
  injectPdfKnowledge,
  injectTextKnowledge,
  listUnansweredQuestions,
  resolveUnansweredQuestion,
} from "./api";
import { unansweredQuestionQueryKeys } from "./queryKeys";
import type {
  InjectPdfKnowledgeInput,
  InjectTextKnowledgeInput,
  ListUnansweredQuestionsParams,
  UnansweredQuestion,
} from "./types";

export function useUnansweredQuestions(params: ListUnansweredQuestionsParams) {
  return useQuery({
    queryKey: unansweredQuestionQueryKeys.list(params),
    queryFn: () => listUnansweredQuestions(params),
  });
}

export function useUnansweredQuestion(id: string | null) {
  return useQuery({
    queryKey: unansweredQuestionQueryKeys.detail(id ?? ""),
    queryFn: () => getUnansweredQuestion(id ?? ""),
    enabled: Boolean(id),
  });
}

function useUnansweredQuestionCache() {
  const queryClient = useQueryClient();
  return {
    invalidate: () =>
      queryClient.invalidateQueries({
        queryKey: unansweredQuestionQueryKeys.all,
      }),
    setDetail: (question: UnansweredQuestion) => {
      queryClient.setQueryData<UnansweredQuestion>(
        unansweredQuestionQueryKeys.detail(question.id),
        (current) => ({
          ...question,
          lastAnswer: question.lastAnswer ?? current?.lastAnswer,
        }),
      );
    },
  };
}

export function useInjectTextKnowledge() {
  const cache = useUnansweredQuestionCache();
  return useMutation({
    mutationFn: (input: InjectTextKnowledgeInput) => injectTextKnowledge(input),
    onSuccess: (question) => {
      cache.setDetail(question);
      void cache.invalidate();
    },
  });
}

export function useInjectPdfKnowledge() {
  const cache = useUnansweredQuestionCache();
  return useMutation({
    mutationFn: (input: InjectPdfKnowledgeInput) => injectPdfKnowledge(input),
    onSuccess: (question) => {
      cache.setDetail(question);
      void cache.invalidate();
    },
  });
}

export function useResolveUnansweredQuestion() {
  const cache = useUnansweredQuestionCache();
  return useMutation({
    mutationFn: (id: string) => resolveUnansweredQuestion(id),
    onSuccess: (question) => {
      cache.setDetail(question);
      void cache.invalidate();
    },
  });
}
