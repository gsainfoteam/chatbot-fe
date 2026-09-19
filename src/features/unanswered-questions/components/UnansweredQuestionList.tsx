import { SearchIcon } from "../../../components/Icons";
import { Button, Select } from "../../../components/ui";
import type {
  UnansweredQuestion,
  UnansweredQuestionStatusFilter,
} from "../types";
import { formatQuestionDateTime } from "../utils";

const STATUS_FILTER_OPTIONS = [
  { value: "open", label: "미해결" },
  { value: "resolved", label: "해결됨" },
  { value: "all", label: "상태 전체" },
];

interface UnansweredQuestionListProps {
  questions: UnansweredQuestion[];
  selectedId: string | null;
  searchQuery: string;
  statusFilter: UnansweredQuestionStatusFilter;
  listLoading: boolean;
  listError: string | null;
  onSearchQueryChange: (query: string) => void;
  onStatusFilterChange: (status: UnansweredQuestionStatusFilter) => void;
  onSelect: (question: UnansweredQuestion) => void;
  onRetryFetch: () => void;
}

function StatusBadge({
  status,
}: {
  status: UnansweredQuestion["status"];
}) {
  if (status === "resolved") {
    return (
      <span className="inline-flex shrink-0 items-center rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
        해결됨
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
      미해결
    </span>
  );
}

export default function UnansweredQuestionList({
  questions,
  selectedId,
  searchQuery,
  statusFilter,
  listLoading,
  listError,
  onSearchQueryChange,
  onStatusFilterChange,
  onSelect,
  onRetryFetch,
}: UnansweredQuestionListProps) {
  return (
    <section
      aria-label="미답변 질문 목록"
      className="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-white"
    >
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">질문 검색</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="질문 검색"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pr-4 pl-10 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/25"
          />
        </label>
        <Select
          ariaLabel="질문 상태 필터"
          value={statusFilter}
          onValueChange={(value) =>
            onStatusFilterChange(value as UnansweredQuestionStatusFilter)
          }
          options={STATUS_FILTER_OPTIONS}
          variant="form"
          width="full"
          className="sm:w-[140px]"
          triggerClassName="border-gray-200"
        />
      </div>

      <div className="min-h-[280px]">
        {listLoading ? (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-gray-500">
            목록을 불러오는 중...
          </div>
        ) : listError ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-red-600">{listError}</p>
            <Button variant="link" size="inline" onClick={onRetryFetch}>
              다시 시도
            </Button>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center p-6 text-center text-sm text-gray-500">
            {searchQuery.trim() || statusFilter !== "all"
              ? "조건에 맞는 미답변 질문이 없습니다."
              : "표시할 미답변 질문이 없습니다."}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {questions.map((question) => {
              const selected = selectedId === question.id;
              return (
                <li key={question.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(question)}
                    className={`w-full cursor-pointer px-4 py-4 text-left transition-colors duration-150 ${
                      selected
                        ? "border-l-4 border-[#df3326] bg-red-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm font-medium text-gray-900">
                        {question.question}
                      </p>
                      <StatusBadge status={question.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span>{formatQuestionDateTime(question.createdAt)}</span>
                      {question.occurrenceCount != null && (
                        <span>발생 {question.occurrenceCount}회</span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
