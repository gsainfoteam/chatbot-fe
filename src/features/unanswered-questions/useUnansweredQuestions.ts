import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
} from "./types";

export function useUnansweredQuestions(params: ListUnansweredQuestionsParams) {
  return useQuery({
    queryKey: unansweredQuestionQueryKeys.list(params),
    queryFn: () => listUnansweredQuestions(params),
  });
}

function useInvalidateUnansweredQuestions() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: unansweredQuestionQueryKeys.all,
    });
}

export function useInjectTextKnowledge() {
  const invalidate = useInvalidateUnansweredQuestions();
  return useMutation({
    mutationFn: (input: InjectTextKnowledgeInput) => injectTextKnowledge(input),
    onSuccess: () => {
      void invalidate();
    },
  });
}

export function useInjectPdfKnowledge() {
  const invalidate = useInvalidateUnansweredQuestions();
  return useMutation({
    mutationFn: (input: InjectPdfKnowledgeInput) => injectPdfKnowledge(input),
    onSuccess: () => {
      void invalidate();
    },
  });
}

export function useResolveUnansweredQuestion() {
  const invalidate = useInvalidateUnansweredQuestions();
  return useMutation({
    mutationFn: (id: string) => resolveUnansweredQuestion(id),
    onSuccess: () => {
      void invalidate();
    },
  });
}
