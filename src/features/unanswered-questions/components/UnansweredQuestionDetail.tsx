import type { DocumentStatus, Organization } from "../../../api/types";
import { XIcon } from "../../../components/Icons";
import { Button, Select } from "@/components/common";
import type { UnansweredQuestion } from "../types";
import { formatFileSize, formatQuestionDateTime } from "../utils";
import KnowledgeInjectForm from "./KnowledgeInjectForm";

const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  uploading: "업로드 중",
  queued: "처리 대기 중",
  processing: "처리 중",
  ready: "활성화",
  failed: "처리 실패",
};

interface UnansweredQuestionDetailProps {
  question: UnansweredQuestion | null;
  injecting: boolean;
  resolving: boolean;
  detailLoading: boolean;
  organizations: Organization[];
  organizationId: string;
  organizationsLoading: boolean;
  onOrganizationChange: (organizationId: string) => void;
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
  detailLoading,
  organizations,
  organizationId,
  organizationsLoading,
  onOrganizationChange,
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
            {question.widgetKeyName ? ` · ${question.widgetKeyName}` : ""}
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

        {question.askedAgainAfterResolved && (
          <p className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            해결 이후 같은 질문이 다시 발생했습니다.
          </p>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-700">최근 답변</h3>
          {detailLoading && question.lastAnswer === undefined ? (
            <p className="mt-2 text-sm text-gray-500">최근 답변을 불러오는 중...</p>
          ) : question.lastAnswer ? (
            <>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-900">
                {question.lastAnswer.content}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {formatQuestionDateTime(question.lastAnswer.createdAt)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              저장된 최근 답변이 없습니다.
            </p>
          )}
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
            {knowledge?.documentTitle && (
              <p className="mt-3 text-sm text-green-900">
                문서: {knowledge.documentTitle}
              </p>
            )}
            {knowledge?.documentStatus && (
              <p className="mt-1 text-xs text-green-700">
                문서 상태: {DOCUMENT_STATUS_LABEL[knowledge.documentStatus]}
                {knowledge.documentActive === false ? " · 문서 관리에서 삭제됨" : ""}
              </p>
            )}
          </div>
        ) : (
          <>
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700">
                지식 주입
              </h3>
              {organizations.length > 1 && (
                <div className="mb-4">
                  <Select
                    label="등록 조직"
                    ariaLabel="지식 문서를 등록할 조직"
                    value={organizationId}
                    onValueChange={onOrganizationChange}
                    options={organizations.map((organization) => ({
                      value: organization.id,
                      label: organization.name,
                    }))}
                    variant="form"
                    width="full"
                    disabled={organizationsLoading || injecting || resolving}
                    helperText="지식 문서는 선택한 조직에 등록됩니다."
                  />
                </div>
              )}
              <KnowledgeInjectForm
                submitting={injecting}
                disabled={resolving || organizationsLoading}
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
