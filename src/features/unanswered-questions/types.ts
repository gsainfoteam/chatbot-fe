export type UnansweredQuestionStatus = "open" | "resolved";

export type UnansweredQuestionStatusFilter = UnansweredQuestionStatus | "all";

export type KnowledgeInjectType = "text" | "pdf";

export interface InjectedKnowledge {
  type: KnowledgeInjectType;
  injectedAt: string;
  text?: string;
  fileName?: string;
  fileSize?: number;
}

export interface UnansweredQuestion {
  id: string;
  question: string;
  createdAt: string;
  status: UnansweredQuestionStatus;
  occurrenceCount?: number;
  resolvedAt?: string;
  injectedKnowledge?: InjectedKnowledge;
}

export interface ListUnansweredQuestionsParams {
  query?: string;
  status?: UnansweredQuestionStatusFilter;
}

export interface InjectTextKnowledgeInput {
  questionId: string;
  text: string;
}

export interface InjectPdfKnowledgeInput {
  questionId: string;
  file: File;
}
