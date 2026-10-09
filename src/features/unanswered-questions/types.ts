import type { DocumentStatus } from "@/api/types";

export type UnansweredQuestionStatus = "open" | "resolved";

export type UnansweredQuestionStatusFilter = UnansweredQuestionStatus | "all";

export type KnowledgeInjectType = "text" | "pdf";

export interface InjectedKnowledge {
  type: KnowledgeInjectType;
  injectedAt: string;
  text?: string;
  fileName?: string;
  fileSize?: number;
  documentId?: string;
  documentTitle?: string;
  documentStatus?: DocumentStatus;
  documentActive?: boolean;
}

export interface UnansweredQuestionAnswer {
  messageId: string;
  content: string;
  createdAt: string;
}

export interface UnansweredQuestion {
  id: string;
  question: string;
  createdAt: string;
  status: UnansweredQuestionStatus;
  occurrenceCount?: number;
  resolvedAt?: string;
  injectedKnowledge?: InjectedKnowledge;
  lastAskedAt?: string;
  askedAgainAfterResolved?: boolean;
  widgetKeyId?: string;
  widgetKeyName?: string;
  /** 상세 조회에서만 채워집니다. 목록 항목에는 없습니다. */
  lastAnswer?: UnansweredQuestionAnswer | null;
}

export interface UnansweredQuestionsPage {
  number: number;
  size: number;
  filteredTotal: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ListUnansweredQuestionsParams {
  query?: string;
  status?: UnansweredQuestionStatusFilter;
  page?: number;
  size?: number;
}

export interface ListUnansweredQuestionsResult {
  items: UnansweredQuestion[];
  page: UnansweredQuestionsPage;
}

export interface InjectTextKnowledgeInput {
  questionId: string;
  text: string;
  title?: string;
  organizationId?: string;
}

export interface InjectPdfKnowledgeInput {
  questionId: string;
  file: File;
  title?: string;
  organizationId?: string;
}
