import { useEffect, useState } from "react";
import { ConfirmDialog } from "../../../components/ui";
import {
  useInjectPdfKnowledge,
  useInjectTextKnowledge,
  useResolveUnansweredQuestion,
  useUnansweredQuestions,
} from "../useUnansweredQuestions";
import type {
  UnansweredQuestion,
  UnansweredQuestionStatusFilter,
} from "../types";
import UnansweredQuestionDetail from "./UnansweredQuestionDetail";
import UnansweredQuestionList from "./UnansweredQuestionList";

const SEARCH_DEBOUNCE_MS = 300;
const EMPTY_QUESTIONS: UnansweredQuestion[] = [];

export default function UnansweredQuestionsSection() {
  const [searchInput, setSearchInput] = useState("");
  const [documentQuery, setDocumentQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<UnansweredQuestionStatusFilter>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<UnansweredQuestion | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resolveConfirmOpen, setResolveConfirmOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDocumentQuery(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId(null);
        setSelectedSnapshot(null);
        setSuccessMessage(null);
        setResolveConfirmOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  const listQuery = useUnansweredQuestions({
    query: documentQuery || undefined,
    status: statusFilter,
  });
  const injectText = useInjectTextKnowledge();
  const injectPdf = useInjectPdfKnowledge();
  const resolveQuestion = useResolveUnansweredQuestion();

  const questions = listQuery.data ?? EMPTY_QUESTIONS;
  const selectedQuestion =
    (selectedId
      ? questions.find((item) => item.id === selectedId)
      : null) ?? selectedSnapshot;
  const injecting = injectText.isPending || injectPdf.isPending;

  const closeDetail = () => {
    setSelectedId(null);
    setSelectedSnapshot(null);
    setSuccessMessage(null);
    setResolveConfirmOpen(false);
  };

  const handleInjected = (question: UnansweredQuestion, message: string) => {
    setSelectedId(question.id);
    setSelectedSnapshot(question);
    setSuccessMessage(message);
  };

  const handleInjectText = async (text: string) => {
    if (!selectedQuestion) return;
    const updated = await injectText.mutateAsync({
      questionId: selectedQuestion.id,
      text,
    });
    handleInjected(
      updated,
      "텍스트 지식을 등록하고 질문을 해결됨으로 표시했습니다.",
    );
  };

  const handleInjectPdf = async (file: File) => {
    if (!selectedQuestion) return;
    const updated = await injectPdf.mutateAsync({
      questionId: selectedQuestion.id,
      file,
    });
    handleInjected(updated, "PDF를 등록하고 질문을 해결됨으로 표시했습니다.");
  };

  const handleResolve = async () => {
    if (!selectedQuestion) return;
    const updated = await resolveQuestion.mutateAsync(selectedQuestion.id);
    handleInjected(updated, "질문을 해결됨으로 표시했습니다.");
  };

  return (
    <section aria-label="미답변 질문" className="mt-8 border-t border-gray-200 pt-8">
      <header className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">미답변 질문</h2>
        <p className="mt-1 text-sm text-gray-600">
          문서가 없어 답변하지 못한 질문을 확인하고, 텍스트 또는 PDF로 지식을
          등록할 수 있습니다.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          현재는 목 데이터로 동작합니다. CHA3-12 API가 준비되면 같은
          인터페이스로 교체됩니다.
        </p>
      </header>

      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <UnansweredQuestionList
          questions={questions}
          selectedId={selectedQuestion?.id ?? null}
          searchQuery={searchInput}
          statusFilter={statusFilter}
          listLoading={listQuery.isLoading}
          listError={
            listQuery.error instanceof Error
              ? listQuery.error.message
              : listQuery.isError
                ? "목록을 불러오는데 실패했습니다."
                : null
          }
          onSearchQueryChange={setSearchInput}
          onStatusFilterChange={(status) => {
            setStatusFilter(status);
            setSuccessMessage(null);
          }}
          onSelect={(question) => {
            setSelectedId(question.id);
            setSelectedSnapshot(question);
            setSuccessMessage(null);
          }}
          onRetryFetch={() => {
            void listQuery.refetch();
          }}
        />

        {selectedQuestion && (
          <button
            type="button"
            aria-label="상세 패널 닫기"
            className="fixed inset-0 z-40 bg-gray-950/50 backdrop-blur-[2px] lg:hidden"
            onClick={closeDetail}
          />
        )}

        <div
          className={
            selectedQuestion
              ? "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-hidden border-l border-gray-200 bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.35)] lg:static lg:z-auto lg:min-h-[480px] lg:max-w-none lg:rounded-lg lg:border lg:shadow-none"
              : "hidden min-h-[480px] overflow-hidden rounded-lg border border-gray-200 lg:block"
          }
        >
          <UnansweredQuestionDetail
            question={selectedQuestion}
            injecting={injecting}
            resolving={resolveQuestion.isPending}
            onClose={closeDetail}
            onInjectText={handleInjectText}
            onInjectPdf={handleInjectPdf}
            onResolve={() => setResolveConfirmOpen(true)}
          />
        </div>
      </div>

      <ConfirmDialog
        open={resolveConfirmOpen}
        onOpenChange={setResolveConfirmOpen}
        title="질문을 해결됨으로 표시할까요?"
        description="지식을 등록하지 않고 이 질문을 해결됨으로 표시합니다. 나중에 상태 필터에서 다시 확인할 수 있습니다."
        confirmLabel="해결됨으로 표시"
        onConfirm={handleResolve}
      />
    </section>
  );
}
