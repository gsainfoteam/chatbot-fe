import {
  isPdfFile,
  isWithinSizeLimit,
  MAX_FILE_SIZE_MB,
} from "../../api/upload";
import { UNANSWERED_QUESTION_SEED } from "./mockData";
import type {
  InjectPdfKnowledgeInput,
  InjectTextKnowledgeInput,
  ListUnansweredQuestionsParams,
  UnansweredQuestion,
} from "./types";
import { matchesUnansweredQuestionQuery } from "./utils";

const MOCK_DELAY_MS = 320;

/**
 * CHA2-15 목 데이터 레이어.
 * 네트워크를 호출하지 않으며, 세션 동안 메모리에서만 상태를 유지합니다.
 *
 * CHA3-12 연동 시 이 파일의 함수 본문만 실제 HTTP 클라이언트로 교체하면 됩니다.
 * 페이지/컴포넌트는 아래 public 함수 시그니처만 사용합니다.
 */
let store: UnansweredQuestion[] = cloneQuestions(UNANSWERED_QUESTION_SEED);

function cloneQuestion(question: UnansweredQuestion): UnansweredQuestion {
  return {
    ...question,
    injectedKnowledge: question.injectedKnowledge
      ? { ...question.injectedKnowledge }
      : undefined,
  };
}

function cloneQuestions(questions: UnansweredQuestion[]): UnansweredQuestion[] {
  return questions.map(cloneQuestion);
}

function delay(ms: number = MOCK_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function requireQuestion(id: string): UnansweredQuestion {
  const found = store.find((item) => item.id === id);
  if (!found) {
    throw new Error("질문을 찾을 수 없습니다.");
  }
  return found;
}

function matchesQuery(question: UnansweredQuestion, query?: string): boolean {
  return matchesUnansweredQuestionQuery(question.question, query);
}

export function resetUnansweredQuestionStore(): void {
  store = cloneQuestions(UNANSWERED_QUESTION_SEED);
}

export async function listUnansweredQuestions(
  params: ListUnansweredQuestionsParams = {},
): Promise<UnansweredQuestion[]> {
  await delay();
  const status = params.status ?? "open";
  return cloneQuestions(store)
    .filter((item) => (status === "all" ? true : item.status === status))
    .filter((item) => matchesQuery(item, params.query))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getUnansweredQuestion(
  id: string,
): Promise<UnansweredQuestion> {
  await delay();
  return cloneQuestion(requireQuestion(id));
}

export async function injectTextKnowledge(
  input: InjectTextKnowledgeInput,
): Promise<UnansweredQuestion> {
  const text = input.text.trim();
  if (!text) {
    throw new Error("지식을 입력해주세요.");
  }

  await delay(420);
  const target = requireQuestion(input.questionId);
  const injectedAt = new Date().toISOString();
  target.status = "resolved";
  target.resolvedAt = injectedAt;
  target.injectedKnowledge = {
    type: "text",
    text,
    injectedAt,
  };
  return cloneQuestion(target);
}

export async function injectPdfKnowledge(
  input: InjectPdfKnowledgeInput,
): Promise<UnansweredQuestion> {
  if (!isPdfFile(input.file)) {
    throw new Error("PDF 파일만 업로드할 수 있습니다.");
  }
  if (!isWithinSizeLimit(input.file)) {
    throw new Error(`파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다.`);
  }

  await delay(520);
  const target = requireQuestion(input.questionId);
  const injectedAt = new Date().toISOString();
  target.status = "resolved";
  target.resolvedAt = injectedAt;
  target.injectedKnowledge = {
    type: "pdf",
    fileName: input.file.name,
    fileSize: input.file.size,
    injectedAt,
  };
  return cloneQuestion(target);
}

export async function resolveUnansweredQuestion(
  id: string,
): Promise<UnansweredQuestion> {
  await delay(280);
  const target = requireQuestion(id);
  if (target.status === "resolved") {
    return cloneQuestion(target);
  }
  const resolvedAt = new Date().toISOString();
  target.status = "resolved";
  target.resolvedAt = resolvedAt;
  return cloneQuestion(target);
}
