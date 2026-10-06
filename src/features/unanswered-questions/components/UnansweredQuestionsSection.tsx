import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getOrganizations } from "../../../api/organizations";
import { ConfirmDialog } from "../../../components/ui";
import { organizationQueryKeys } from "../../organizations/queryKeys";
import {
  useInjectPdfKnowledge,
  useInjectTextKnowledge,
  useResolveUnansweredQuestion,
  useUnansweredQuestion,
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
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const selectionVersion = useRef(0);

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
        selectionVersion.current += 1;
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
  const detailQuery = useUnansweredQuestion(selectedId);
  const organizationsQuery = useQuery({
    queryKey: organizationQueryKeys.list(),
    queryFn: getOrganizations,
    staleTime: 60_000,
  });
  const injectText = useInjectTextKnowledge();
  const injectPdf = useInjectPdfKnowledge();
  const resolveQuestion = useResolveUnansweredQuestion();

  const questions = listQuery.data?.items ?? EMPTY_QUESTIONS;
  const organizations = organizationsQuery.data ?? [];
  const effectiveOrganizationId =
    organizationId ??
    organizations.find((organization) => organization.isDefault)?.id ??
    organizations[0]?.id ??
    "";
  const selectedFromList = selectedId
    ? questions.find((item) => item.id === selectedId)
    : null;
  const selectedQuestion =
    (detailQuery.data?.id === selectedId ? detailQuery.data : null) ??
    selectedFromList ??
    (selectedSnapshot?.id === selectedId ? selectedSnapshot : null);
  const injecting = injectText.isPending || injectPdf.isPending;

  const closeDetail = () => {
    selectionVersion.current += 1;
    setSelectedId(null);
    setSelectedSnapshot(null);
    setSuccessMessage(null);
    setResolveConfirmOpen(false);
  };

  const handleInjected = (
    question: UnansweredQuestion,
    message: string,
    requestSelectionVersion: number,
  ) => {
    if (selectionVersion.current !== requestSelectionVersion) return;
    setSelectedId(question.id);
    setSelectedSnapshot(question);
    setSuccessMessage(message);
  };

  const handleInjectText = async (text: string) => {
    if (!selectedQuestion) return;
    const requestSelectionVersion = selectionVersion.current;
    const updated = await injectText.mutateAsync({
      questionId: selectedQuestion.id,
      text,
      organizationId: effectiveOrganizationId || undefined,
    });
    handleInjected(
      updated,
      "텍스트 지식을 등록하고 질문을 해결됨으로 표시했습니다.",
      requestSelectionVersion,
    );
  };

  const handleInjectPdf = async (file: File) => {
    if (!selectedQuestion) return;
    const requestSelectionVersion = selectionVersion.current;
    const updated = await injectPdf.mutateAsync({
      questionId: selectedQuestion.id,
      file,
      organizationId: effectiveOrganizationId || undefined,
    });
    handleInjected(
      updated,
      "PDF를 등록하고 질문을 해결됨으로 표시했습니다.",
      requestSelectionVersion,
    );
  };

  const handleResolve = async () => {
    if (!selectedQuestion) return;
    const requestSelectionVersion = selectionVersion.current;
    const updated = await resolveQuestion.mutateAsync(selectedQuestion.id);
    handleInjected(
      updated,
      "질문을 해결됨으로 표시했습니다.",
      requestSelectionVersion,
    );
  };

  return (
    <section aria-label="미답변 질문" className="mt-8 border-t border-gray-200 pt-8">
      <header className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">미답변 질문</h2>
        <p className="mt-1 text-sm text-gray-600">
          참고 문서 없이 답변된 질문을 확인하고, 텍스트 또는 PDF로 지식을
          등록할 수 있습니다.
        </p>
        {listQuery.data?.page != null && (
          <p className="mt-1 text-xs text-gray-500">
            {listQuery.data.page.filteredTotal}건
            {listQuery.data.page.hasNext
              ? " · 한 번에 최대 100건까지 표시됩니다. 검색으로 범위를 좁혀 주세요."
              : ""}
          </p>
        )}
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
            selectionVersion.current += 1;
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
            detailLoading={detailQuery.isLoading}
            organizations={organizations}
            organizationId={effectiveOrganizationId}
            organizationsLoading={organizationsQuery.isLoading}
            onOrganizationChange={setOrganizationId}
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
