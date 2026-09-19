import { XIcon } from "../../../components/Icons";
import { Button } from "../../../components/ui";
import type { UnansweredQuestion } from "../types";
import { formatFileSize, formatQuestionDateTime } from "../utils";
import KnowledgeInjectForm from "./KnowledgeInjectForm";

interface UnansweredQuestionDetailProps {
  question: UnansweredQuestion | null;
  injecting: boolean;
  resolving: boolean;
  onClose: () => void;
  onInjectText: (text: string) => Promise<void>;
  onInjectPdf: (file: File) => Promise<void>;
  onResolve: () => void;
}

function StatusBadge({
  status,
}: {
  status: UnansweredQuestion["status"];
}) {
  if (status === "resolved") {
    return (
      <span className="inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
        해결됨
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
      미해결
    </span>
  );
}

export default function UnansweredQuestionDetail({
  question,
  injecting,
  resolving,
  onClose,
  onInjectText,
  onInjectPdf,
  onResolve,
}: UnansweredQuestionDetailProps) {
  if (!question) {
    return (
      <section
        aria-label="질문 상세"
        className="flex min-h-[280px] items-center justify-center p-8 text-center text-sm text-gray-500"
      >
        왼쪽 목록에서 질문을 선택하면 상세 내용과 지식 주입을 확인할 수
        있습니다.
      </section>
    );
  }

  const knowledge = question.injectedKnowledge;

  return (
    <section
      aria-label="질문 상세"
      className="flex h-full min-h-0 flex-col bg-white"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">질문 상세</h2>
            <StatusBadge status={question.status} />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {formatQuestionDateTime(question.createdAt)}
            {question.occurrenceCount != null
              ? ` · 발생 ${question.occurrenceCount}회`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="상세 닫기"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <XIcon className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700">질문</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-900">
            {question.question}
          </p>
        </div>

        {question.status === "resolved" ? (
          <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3">
            <p className="text-sm font-medium text-green-800">
              해결된 질문입니다.
            </p>
            {question.resolvedAt && (
              <p className="mt-1 text-xs text-green-700">
                {formatQuestionDateTime(question.resolvedAt)}에 처리됨
              </p>
            )}
            {knowledge?.type === "text" && knowledge.text && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-green-900">
                {knowledge.text}
              </p>
            )}
            {knowledge?.type === "pdf" && knowledge.fileName && (
              <p className="mt-3 text-sm text-green-900">
                등록된 PDF: {knowledge.fileName}
                {knowledge.fileSize != null
                  ? ` (${formatFileSize(knowledge.fileSize)})`
                  : ""}
              </p>
            )}
          </div>
        ) : (
          <>
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700">
                지식 주입
              </h3>
              <KnowledgeInjectForm
                submitting={injecting}
                disabled={resolving}
                onSubmitText={onInjectText}
                onSubmitPdf={onInjectPdf}
              />
            </div>
            <div className="border-t border-gray-100 pt-4">
              <Button
                variant="secondary"
                onClick={onResolve}
                disabled={injecting}
                loading={resolving}
                loadingText="처리 중..."
                className="w-full"
              >
                지식 없이 해결됨으로 표시
              </Button>
              <p className="mt-2 text-xs text-gray-500">
                지식을 등록하지 않고 이 질문을 목록에서 해결됨으로 옮깁니다.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
