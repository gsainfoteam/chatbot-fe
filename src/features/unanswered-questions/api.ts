import axios from "axios";
import { apiClient } from "../../api/client";
import type { DocumentStatus } from "../../api/types";
import {
  isPdfFile,
  isWithinSizeLimit,
  MAX_FILE_SIZE_MB,
} from "../../api/upload";
import type {
  InjectPdfKnowledgeInput,
  InjectTextKnowledgeInput,
  ListUnansweredQuestionsParams,
  ListUnansweredQuestionsResult,
  UnansweredQuestion,
  UnansweredQuestionAnswer,
  UnansweredQuestionsPage,
} from "./types";

const BASE_PATH = "/v1/admin/unanswered-questions";
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 100;

export class UnansweredQuestionApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "UnansweredQuestionApiError";
    this.status = status;
  }
}

interface ApiInjectedKnowledge {
  type: "text" | "pdf";
  injectedAt: string;
  text?: string;
  fileName?: string;
  documentId: string;
  documentTitle: string;
  documentStatus: DocumentStatus;
  documentActive: boolean;
}

interface ApiUnansweredQuestion {
  id: string;
  question: string;
  createdAt: string;
  status: "open" | "resolved";
  occurrenceCount: number;
  resolvedAt: string | null;
  injectedKnowledge: ApiInjectedKnowledge | null;
  lastAskedAt: string;
  askedAgainAfterResolved: boolean;
  widgetKeyId: string;
  widgetKeyName: string;
}

interface ApiUnansweredQuestionDetail extends ApiUnansweredQuestion {
  lastAnswer: {
    messageId: string;
    content: string;
    createdAt: string;
  } | null;
}

interface ApiListResponse {
  items: ApiUnansweredQuestion[];
  page: UnansweredQuestionsPage;
}

function readServerMessage(data: unknown): string | undefined {
  if (typeof data === "string" && data.trim()) return data;
  if (!data || typeof data !== "object") return undefined;
  const message = (data as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message)) {
    const parts = message.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    return parts.length > 0 ? parts.join("\n") : undefined;
  }
  return undefined;
}

const KNOWLEDGE_FORBIDDEN_MESSAGE =
  "이 조직의 멤버만 지식을 등록할 수 있습니다. 소속 조직을 선택한 뒤 다시 시도해주세요.";

function throwApiError(
  err: unknown,
  fallback: string,
  options?: { forbiddenMessage?: string },
): never {
  const status = axios.isAxiosError(err) ? err.response?.status : undefined;
  const serverMessage = axios.isAxiosError(err)
    ? readServerMessage(err.response?.data)
    : undefined;

  if (status === 401) {
    throw new UnansweredQuestionApiError(
      "인증에 실패했습니다. 다시 로그인해주세요.",
      status,
    );
  }
  if (status === 403) {
    throw new UnansweredQuestionApiError(
      serverMessage ||
        options?.forbiddenMessage ||
        "이 작업을 수행할 권한이 없습니다.",
      status,
    );
  }
  if (status === 404) {
    throw new UnansweredQuestionApiError(
      "질문을 찾을 수 없거나 접근 권한이 없습니다.",
      status,
    );
  }
  if (status === 409) {
    throw new UnansweredQuestionApiError(
      "같은 제목의 문서가 이미 있습니다. 문서 관리에서 확인하거나 다른 제목으로 등록해주세요.",
      status,
    );
  }
  if (status === 503) {
    throw new UnansweredQuestionApiError(
      "문서 저장소에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.",
      status,
    );
  }
  throw new UnansweredQuestionApiError(serverMessage || fallback, status);
}

function toIso(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

function toQuestion(
  item: ApiUnansweredQuestion,
  lastAnswer?: UnansweredQuestionAnswer | null,
): UnansweredQuestion {
  return {
    id: item.id,
    question: item.question,
    createdAt: item.createdAt,
    status: item.status,
    occurrenceCount: item.occurrenceCount,
    resolvedAt: toIso(item.resolvedAt),
    lastAskedAt: item.lastAskedAt,
    askedAgainAfterResolved: item.askedAgainAfterResolved,
    widgetKeyId: item.widgetKeyId,
    widgetKeyName: item.widgetKeyName,
    injectedKnowledge: item.injectedKnowledge
      ? {
          type: item.injectedKnowledge.type,
          injectedAt: item.injectedKnowledge.injectedAt,
          text: item.injectedKnowledge.text,
          fileName: item.injectedKnowledge.fileName,
          documentId: item.injectedKnowledge.documentId,
          documentTitle: item.injectedKnowledge.documentTitle,
          documentStatus: item.injectedKnowledge.documentStatus,
          documentActive: item.injectedKnowledge.documentActive,
        }
      : undefined,
    ...(lastAnswer !== undefined ? { lastAnswer } : {}),
  };
}

export async function listUnansweredQuestions(
  params: ListUnansweredQuestionsParams = {},
): Promise<ListUnansweredQuestionsResult> {
  const query = params.query?.trim();
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const size = Math.min(100, Math.max(1, params.size ?? DEFAULT_PAGE_SIZE));

  try {
    const res = await apiClient.get<ApiListResponse>(BASE_PATH, {
      params: {
        page,
        size,
        status: params.status ?? "open",
        ...(query ? { query } : {}),
      },
    });
    return {
      items: res.data.items.map((item) => toQuestion(item)),
      page: res.data.page,
    };
  } catch (err) {
    throwApiError(err, "미답변 질문 목록을 불러오는데 실패했습니다.");
  }
}

export async function getUnansweredQuestion(
  id: string,
): Promise<UnansweredQuestion> {
  try {
    const res = await apiClient.get<ApiUnansweredQuestionDetail>(
      `${BASE_PATH}/${id}`,
    );
    return toQuestion(res.data, res.data.lastAnswer);
  } catch (err) {
    throwApiError(err, "질문 상세를 불러오는데 실패했습니다.");
  }
}

export async function injectTextKnowledge(
  input: InjectTextKnowledgeInput,
): Promise<UnansweredQuestion> {
  const text = input.text.trim();
  if (!text) {
    throw new UnansweredQuestionApiError("지식을 입력해주세요.");
  }

  try {
    const res = await apiClient.post<ApiUnansweredQuestion>(
      `${BASE_PATH}/${input.questionId}/knowledge/text`,
      {
        text,
        ...(input.title?.trim() ? { title: input.title.trim() } : {}),
        ...(input.organizationId
          ? { organizationId: input.organizationId }
          : {}),
      },
    );
    return toQuestion(res.data);
  } catch (err) {
    throwApiError(err, "텍스트 지식 등록에 실패했습니다.", {
      forbiddenMessage: KNOWLEDGE_FORBIDDEN_MESSAGE,
    });
  }
}

export async function injectPdfKnowledge(
  input: InjectPdfKnowledgeInput,
): Promise<UnansweredQuestion> {
  if (!isPdfFile(input.file)) {
    throw new UnansweredQuestionApiError("PDF 파일만 업로드할 수 있습니다.");
  }
  if (!isWithinSizeLimit(input.file)) {
    throw new UnansweredQuestionApiError(
      `파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다.`,
    );
  }

  const pdfFile =
    input.file.type === "application/pdf"
      ? input.file
      : new File([input.file], input.file.name, { type: "application/pdf" });
  const formData = new FormData();
  formData.append("file", pdfFile);
  if (input.title?.trim()) {
    formData.append("title", input.title.trim());
  }
  if (input.organizationId) {
    formData.append("organizationId", input.organizationId);
  }

  try {
    const res = await apiClient.post<ApiUnansweredQuestion>(
      `${BASE_PATH}/${input.questionId}/knowledge/pdf`,
      formData,
      {
        headers: { "Content-Type": undefined } as Record<
          string,
          string | undefined
        >,
      },
    );
    return toQuestion(res.data);
  } catch (err) {
    throwApiError(err, "PDF 지식 등록에 실패했습니다.", {
      forbiddenMessage: KNOWLEDGE_FORBIDDEN_MESSAGE,
    });
  }
}

export async function resolveUnansweredQuestion(
  id: string,
): Promise<UnansweredQuestion> {
  try {
    const res = await apiClient.patch<ApiUnansweredQuestion>(
      `${BASE_PATH}/${id}`,
      { status: "resolved" },
    );
    return toQuestion(res.data);
  } catch (err) {
    throwApiError(err, "질문을 해결됨으로 표시하는데 실패했습니다.");
  }
}
