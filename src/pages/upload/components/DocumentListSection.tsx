import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdminUploadApiError,
  deleteUpload,
  getUploadById,
  reprocessUpload,
  updateUploadExpiry,
} from "../../../api/upload";
import type {
  AccessibleUploadPage,
  AccessibleUploadSort,
  AccessibleUploadStatus,
} from "../../../api/upload";
import type { DocumentItem, DocumentStatus, Organization } from "../../../api/types";
import {
  CalendarIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  RefreshIcon,
  SearchIcon,
  ShareIcon,
  TrashIcon,
  TransferIcon,
  UnlinkIcon,
} from "../../../components/Icons";
import {
  Button,
  ConfirmDialog,
  DatePicker,
  Dialog,
  Select,
} from "../../../components/ui";
import ShareTransferModal from "./ShareTransferModal";
import {
  buildBulkErrorMessage,
  formatKoreanDate,
  getResourceLink,
  parseFutureExpiresAt,
  toDateInputValue,
} from "../utils";
import type { BulkFailure } from "../utils";

interface DocumentListSectionProps {
  documents: DocumentItem[];
  organizations: Organization[];
  filterOrganizationId: string | "all";
  listLoading: boolean;
  listError: string | null;
  pollingError: string | null;
  searchQuery: string;
  statusFilter: AccessibleUploadStatus;
  sortOrder: AccessibleUploadSort;
  pageInfo: AccessibleUploadPage;
  onSearchQueryChange: (query: string) => void;
  onStatusFilterChange: (status: AccessibleUploadStatus) => void;
  onSortOrderChange: (sort: AccessibleUploadSort) => void;
  onPageChange: (page: number) => void;
  onRetryFetch: () => void;
  onDocumentsChange: (updater: (prev: DocumentItem[]) => DocumentItem[]) => void;
  onDocumentMutation: (
    previousDocument: DocumentItem,
    nextDocument: DocumentItem | null,
  ) => void;
  organizationEmptyMessage?: string;
}

interface ExpiryEditState {
  ids: string[];
  mode: "date" | "indefinite";
  value: string;
  error: string | null;
}

type ShareMode = "share" | "unshare" | "transfer";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "상태 전체" },
  { value: "active", label: "활성화" },
  { value: "processing", label: "처리 중" },
  { value: "failed", label: "처리 실패" },
  { value: "expired", label: "만료" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "최근 업로드순" },
  { value: "name", label: "이름순" },
  { value: "expiry", label: "만료 임박순" },
];

type PendingDocumentAction =
  | { type: "delete"; document: DocumentItem }
  | { type: "reprocess"; document: DocumentItem }
  | { type: "bulk-delete"; documents: DocumentItem[] }
  | { type: "bulk-reprocess"; documents: DocumentItem[] };

const DELETED_DOCUMENT_MESSAGE = "이미 삭제되었거나 존재하지 않는 파일입니다.";
const BULK_UNAVAILABLE_TITLE =
  "여러 문서를 선택한 상태에서는 사용할 수 없습니다.";

function canRequestDocumentReprocess(item: DocumentItem): boolean {
  return (
    item.canManage === true &&
    (item.status === "failed" || item.status === "ready")
  );
}

function withoutIds(ids: Set<string>, removedIds: Set<string>): Set<string> {
  return new Set([...ids].filter((id) => !removedIds.has(id)));
}

function getCooldownLabel(
  reprocessAvailableAt: string | null,
  now: number,
): string | null {
  if (!reprocessAvailableAt) return null;
  const availableAt = new Date(reprocessAvailableAt).getTime();
  if (Number.isNaN(availableAt)) return null;

  const remainingSeconds = Math.max(0, Math.ceil((availableAt - now) / 1000));
  if (remainingSeconds === 0) {
    return "재처리 가능 여부를 확인하는 중입니다.";
  }

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const parts = [
    hours > 0 ? `${hours}시간` : null,
    minutes > 0 ? `${minutes}분` : null,
    `${seconds}초`,
  ].filter(Boolean);

  return `재처리 가능까지 ${parts.join(" ")} 남았습니다.`;
}

function renderDocumentStatusBadge(status: DocumentStatus) {
  switch (status) {
    case "uploading":
      return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
          업로드 중
        </span>
      );
    case "queued":
      return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700">
          처리 대기 중
        </span>
      );
    case "processing":
      return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
          처리 중
        </span>
      );
    case "ready":
      return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
          활성화
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
          처리 실패
        </span>
      );
  }
}

function renderExpiredBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700">
      만료
    </span>
  );
}

function upsertDocument(
  list: DocumentItem[],
  doc: DocumentItem,
): DocumentItem[] {
  const idx = list.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
    return list.map((d, i) => (i === idx ? doc : d));
  }
  return [doc, ...list];
}

function isDocumentVisibleForFilter(
  document: DocumentItem,
  organizationId: string | "all",
): boolean {
  if (organizationId === "all") return true;
  return (
    document.ownerOrganization?.id === organizationId ||
    (document.sharedOrganizations ?? []).some(
      (organization) => organization.id === organizationId,
    )
  );
}

export default function DocumentListSection({
  documents,
  organizations,
  filterOrganizationId,
  listLoading,
  listError,
  pollingError,
  searchQuery,
  statusFilter,
  sortOrder,
  pageInfo,
  onSearchQueryChange,
  onStatusFilterChange,
  onSortOrderChange,
  onPageChange,
  onRetryFetch,
  onDocumentsChange,
  onDocumentMutation,
  organizationEmptyMessage,
}: DocumentListSectionProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [expiryEdit, setExpiryEdit] = useState<ExpiryEditState | null>(null);
  const [updatingExpiry, setUpdatingExpiry] = useState(false);
  const [pendingAction, setPendingAction] =
    useState<PendingDocumentAction | null>(null);
  const [openDocumentMenuId, setOpenDocumentMenuId] = useState<string | null>(
    null,
  );
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [shareModal, setShareModal] = useState<{
    documents: DocumentItem[];
    mode: ShareMode;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);
  const documentMenuRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const todayDateValue = useMemo(() => toDateInputValue(new Date()), []);

  const expiryDocument =
    expiryEdit && expiryEdit.ids.length === 1
      ? (documents.find((item) => item.id === expiryEdit.ids[0]) ?? null)
      : null;

  const selectableDocuments = useMemo(
    () => documents.filter((item) => item.canManage === true),
    [documents],
  );
  const selectedDocuments = useMemo(
    () => documents.filter((item) => selectedIds.has(item.id)),
    [documents, selectedIds],
  );
  const reprocessableSelectedDocuments = useMemo(
    () =>
      selectedDocuments.filter(
        (item) => canRequestDocumentReprocess(item) && item.canReprocess,
      ),
    [selectedDocuments],
  );
  const allSelectedShareable =
    selectedDocuments.length > 0 &&
    selectedDocuments.every((item) => item.canShare === true);
  const allSelectableSelected =
    selectableDocuments.length > 0 &&
    selectableDocuments.every((item) => selectedIds.has(item.id));
  const isPartiallySelected = selectedIds.size > 0 && !allSelectableSelected;
  const showBulkBar =
    !listLoading &&
    !listError &&
    !organizationEmptyMessage &&
    selectableDocuments.length > 0;

  // showBulkBar가 바뀌면 체크박스가 다시 마운트되므로 indeterminate를 다시 적용
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isPartiallySelected;
    }
  }, [isPartiallySelected, showBulkBar]);

  // 페이지 이동, 필터 변경, 삭제 등으로 목록에서 사라진 문서는 선택에서 제외
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(documents.map((item) => item.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [documents]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      allSelectableSelected
        ? new Set()
        : new Set(selectableDocuments.map((item) => item.id)),
    );
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleShareModalUpdated = (doc: DocumentItem) => {
    const previousDocument =
      shareModal?.documents.find((item) => item.id === doc.id) ?? doc;
    onDocumentsChange((prev) => {
      if (!isDocumentVisibleForFilter(doc, filterOrganizationId)) {
        return prev.filter((item) => item.id !== doc.id);
      }
      return upsertDocument(prev, doc);
    });
    setSelectedIds((prev) => withoutIds(prev, new Set([doc.id])));
    setShareModal((prev) =>
      prev
        ? {
            ...prev,
            documents: prev.documents.filter((item) => item.id !== doc.id),
          }
        : prev,
    );
    onDocumentMutation(previousDocument, doc);
  };

  const cooldownKey = useMemo(
    () =>
      documents
        .filter(
          (item) => !item.canReprocess && item.reprocessAvailableAt != null,
        )
        .map((item) => `${item.id}:${item.reprocessAvailableAt}`)
        .join(","),
    [documents],
  );

  useEffect(() => {
    if (!cooldownKey) return;
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [cooldownKey]);

  useEffect(() => {
    if (!openDocumentMenuId) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !documentMenuRef.current?.contains(event.target)
      ) {
        setOpenDocumentMenuId(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenDocumentMenuId(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDocumentMenuId]);

  useEffect(() => {
    if (!cooldownKey) return;

    const cooldownItems = documents.filter(
      (item) => !item.canReprocess && item.reprocessAvailableAt != null,
    );
    const earliestAvailableAt = Math.min(
      ...cooldownItems.map((item) =>
        new Date(item.reprocessAvailableAt as string).getTime(),
      ),
    );
    if (!Number.isFinite(earliestAvailableAt)) return;

    const timeoutId = window.setTimeout(
      () => {
        const expiredIds = documents
          .filter((item) => {
            if (item.canReprocess || !item.reprocessAvailableAt) return false;
            return (
              new Date(item.reprocessAvailableAt).getTime() <= Date.now() + 500
            );
          })
          .map((item) => item.id);
        if (expiredIds.length === 0) return;

        void Promise.allSettled(expiredIds.map((id) => getUploadById(id))).then(
          (results) => {
            onDocumentsChange((prev) =>
              prev.map((item) => {
                const result = results.find(
                  (candidate) =>
                    candidate.status === "fulfilled" &&
                    candidate.value.id === item.id,
                );
                return result?.status === "fulfilled" ? result.value : item;
              }),
            );
          },
        );
      },
      Math.max(0, earliestAvailableAt - Date.now() + 500),
    );

    return () => window.clearTimeout(timeoutId);
  }, [cooldownKey, documents, onDocumentsChange]);

  const handleDelete = async (document: DocumentItem) => {
    const id = document.id;
    try {
      setDeletingId(id);
      await deleteUpload(id);
      onDocumentsChange((prev) => prev.filter((item) => item.id !== id));
      onDocumentMutation(document, null);
      if (expiryEdit?.ids.includes(id)) setExpiryEdit(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "삭제에 실패했습니다.";
      if (message === DELETED_DOCUMENT_MESSAGE) {
        onDocumentsChange((prev) => prev.filter((item) => item.id !== id));
        onDocumentMutation(document, null);
        if (expiryEdit?.ids.includes(id)) setExpiryEdit(null);
        return;
      }
      throw new Error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      setReprocessingId(id);
      const doc = await reprocessUpload(id);
      onDocumentsChange((prev) => upsertDocument(prev, doc));
    } catch (err) {
      if (
        err instanceof AdminUploadApiError &&
        err.status === 429 &&
        err.retryAt
      ) {
        onDocumentsChange((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  canReprocess: false,
                  reprocessAvailableAt: err.retryAt ?? null,
                }
              : item,
          ),
        );
      }
      throw new Error(
        err instanceof Error ? err.message : "재처리 요청에 실패했습니다.",
      );
    } finally {
      setReprocessingId(null);
    }
  };

  const handleBulkDelete = async (targets: DocumentItem[]) => {
    try {
      setBulkActionInProgress(true);
      const results = await Promise.allSettled(
        targets.map((document) => deleteUpload(document.id)),
      );

      const removedIds = new Set<string>();
      const failures: BulkFailure[] = [];
      results.forEach((result, index) => {
        const document = targets[index];
        if (result.status === "fulfilled") {
          removedIds.add(document.id);
          return;
        }
        const message =
          result.reason instanceof Error
            ? result.reason.message
            : "삭제에 실패했습니다.";
        if (message === DELETED_DOCUMENT_MESSAGE) {
          removedIds.add(document.id);
          return;
        }
        failures.push({ document, message });
      });

      if (removedIds.size > 0) {
        onDocumentsChange((prev) =>
          prev.filter((item) => !removedIds.has(item.id)),
        );
        setSelectedIds((prev) => withoutIds(prev, removedIds));
        if (expiryEdit?.ids.some((id) => removedIds.has(id))) {
          setExpiryEdit(null);
        }
        targets
          .filter((document) => removedIds.has(document.id))
          .forEach((document) => onDocumentMutation(document, null));
      }

      if (failures.length > 0) {
        throw new Error(
          buildBulkErrorMessage("삭제", removedIds.size, failures),
        );
      }
    } finally {
      setBulkActionInProgress(false);
    }
  };

  const handleBulkReprocess = async (targets: DocumentItem[]) => {
    try {
      setBulkActionInProgress(true);
      const results = await Promise.allSettled(
        targets.map((document) => reprocessUpload(document.id)),
      );

      const updates = new Map<string, DocumentItem>();
      const cooldowns = new Map<string, string>();
      const failures: BulkFailure[] = [];
      results.forEach((result, index) => {
        const document = targets[index];
        if (result.status === "fulfilled") {
          updates.set(document.id, result.value);
          return;
        }
        const err = result.reason;
        if (
          err instanceof AdminUploadApiError &&
          err.status === 429 &&
          err.retryAt
        ) {
          cooldowns.set(document.id, err.retryAt);
        }
        failures.push({
          document,
          message:
            err instanceof Error ? err.message : "재처리 요청에 실패했습니다.",
        });
      });

      if (updates.size > 0 || cooldowns.size > 0) {
        onDocumentsChange((prev) =>
          prev.map((item) => {
            const update = updates.get(item.id);
            if (update) return update;
            const retryAt = cooldowns.get(item.id);
            if (retryAt) {
              return {
                ...item,
                canReprocess: false,
                reprocessAvailableAt: retryAt,
              };
            }
            return item;
          }),
        );
      }
      if (updates.size > 0) {
        setSelectedIds((prev) => withoutIds(prev, new Set(updates.keys())));
      }

      if (failures.length > 0) {
        throw new Error(
          buildBulkErrorMessage("재처리 요청", updates.size, failures),
        );
      }
    } finally {
      setBulkActionInProgress(false);
    }
  };

  const openExpiryEdit = (items: DocumentItem[]) => {
    const single = items.length === 1 ? items[0] : null;
    setExpiryEdit({
      ids: items.map((item) => item.id),
      mode: single?.expiresAt === null ? "indefinite" : "date",
      value: single
        ? single.expiresAt
          ? toDateInputValue(new Date(single.expiresAt))
          : ""
        : todayDateValue,
      error: null,
    });
  };

  const handleSaveExpiry = async () => {
    if (!expiryEdit) return;

    let nextExpiresAt: string | null = null;
    if (expiryEdit.mode === "date") {
      const parsed = parseFutureExpiresAt(expiryEdit.value);
      if (parsed.error || !parsed.expiresAt) {
        setExpiryEdit((prev) =>
          prev
            ? {
                ...prev,
                error: parsed.error ?? "유효기간을 입력해주세요.",
              }
            : prev,
        );
        return;
      }
      nextExpiresAt = parsed.expiresAt;
    }

    const targets = documents.filter((item) =>
      expiryEdit.ids.includes(item.id),
    );
    if (targets.length === 0) {
      setExpiryEdit((prev) =>
        prev ? { ...prev, error: "문서를 찾을 수 없습니다." } : prev,
      );
      return;
    }

    try {
      setUpdatingExpiry(true);
      const results = await Promise.allSettled(
        targets.map((document) =>
          updateUploadExpiry(document.id, nextExpiresAt),
        ),
      );

      const updates = new Map<string, DocumentItem>();
      const failures: BulkFailure[] = [];
      results.forEach((result, index) => {
        const document = targets[index];
        if (result.status === "fulfilled") {
          updates.set(document.id, result.value);
          return;
        }
        failures.push({
          document,
          message:
            result.reason instanceof Error
              ? result.reason.message
              : "유효기간 변경에 실패했습니다.",
        });
      });

      if (updates.size > 0) {
        onDocumentsChange((prev) =>
          prev.map((item) => updates.get(item.id) ?? item),
        );
        setSelectedIds((prev) => withoutIds(prev, new Set(updates.keys())));
      }

      if (failures.length === 0) {
        setExpiryEdit(null);
        return;
      }

      const message =
        targets.length === 1
          ? failures[0].message
          : buildBulkErrorMessage("유효기간 변경", updates.size, failures);
      setExpiryEdit((prev) =>
        prev
          ? {
              ...prev,
              ids: failures.map((failure) => failure.document.id),
              error: message,
            }
          : prev,
      );
    } finally {
      setUpdatingExpiry(false);
    }
  };

  return (
    <section
      aria-label="문서"
      className="upload-document-panel flex min-w-0 flex-col"
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">문서 검색</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="문서 검색"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pr-4 pl-10 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/25"
          />
        </label>
        <div className="grid grid-cols-2 gap-2.5 sm:flex">
          <Select
            ariaLabel="문서 상태 필터"
            value={statusFilter}
            onValueChange={(value) =>
              onStatusFilterChange(value as AccessibleUploadStatus)
            }
            options={STATUS_FILTER_OPTIONS}
            variant="form"
            width="full"
            className="sm:w-[140px]"
            triggerClassName="border-gray-200"
          />
          <Select
            ariaLabel="문서 정렬"
            value={sortOrder}
            onValueChange={(value) =>
              onSortOrderChange(value as AccessibleUploadSort)
            }
            options={SORT_OPTIONS}
            variant="form"
            width="full"
            className="sm:w-[160px]"
            triggerClassName="border-gray-200"
          />
        </div>
      </div>

      {showBulkBar && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allSelectableSelected}
              onChange={toggleSelectAll}
              disabled={bulkActionInProgress}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[var(--color-primary)] disabled:cursor-not-allowed"
            />
            전체 선택
          </label>
          <span className="text-sm text-gray-500">
            {selectedIds.size > 1
              ? `${selectedIds.size}개 선택됨 · 선택한 문서의 작업 메뉴에서 함께 처리합니다.`
              : selectedIds.size === 1
                ? "1개 선택됨 · 2개 이상 선택하면 함께 처리할 수 있습니다."
                : "문서를 선택하면 여러 문서를 함께 처리할 수 있습니다."}
          </span>
          {selectedIds.size > 0 && (
            <Button
              variant="link"
              size="inline"
              onClick={clearSelection}
              disabled={bulkActionInProgress}
              className="ml-auto"
            >
              선택 해제
            </Button>
          )}
        </div>
      )}

      <div className="document-list-scroll mt-5 flex-1">
        {pollingError && (
          <div className="mb-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {pollingError}
          </div>
        )}

        {listLoading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-gray-500">
            목록을 불러오는 중...
          </div>
        ) : organizationEmptyMessage ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            {organizationEmptyMessage}
          </div>
        ) : listError ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white p-6 text-center">
            <p className="text-sm text-red-600">{listError}</p>
            <button
              type="button"
              onClick={onRetryFetch}
              className="cursor-pointer text-sm font-medium text-[#df3326] hover:underline"
            >
              다시 시도
            </button>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-gray-500">
            {searchQuery.trim() || statusFilter !== "all"
              ? "조건에 맞는 문서가 없습니다."
              : "표시할 문서가 없습니다."}
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((item) => {
              const isMenuOpen = openDocumentMenuId === item.id;
              const isSelected = selectedIds.has(item.id);
              const isBulkMenu = isSelected && selectedDocuments.length > 1;
              const bulkTargets = isBulkMenu ? selectedDocuments : [item];
              const canView =
                item.status === "ready" && item.gcsPdfPath != null;
              const canManage = item.canManage === true;
              const canShare = item.canShare === true;
              const canTransfer = item.canTransfer === true;
              const canRequestReprocess = canRequestDocumentReprocess(item);
              const expiryLabel = item.expiresAt
                ? formatKoreanDate(item.expiresAt)
                : "무기한";
              const hasShared =
                (item.sharedOrganizations?.length ?? 0) > 0;

              return (
                <article
                  key={item.id}
                  onClick={(event) => {
                    if (!canManage || bulkActionInProgress) return;
                    if (!(event.target instanceof Element)) return;
                    // 버튼, 링크, 메뉴, 체크박스 클릭은 각자의 동작만 수행
                    if (
                      event.target.closest("button, a, input, [role='menu']")
                    ) {
                      return;
                    }
                    // 텍스트를 드래그해 선택한 경우는 무시
                    if (window.getSelection()?.toString()) return;
                    toggleSelected(item.id);
                  }}
                  className={`rounded-lg border bg-white p-4 transition-colors ${
                    canManage ? "cursor-pointer" : ""
                  } ${
                    isSelected
                      ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <input
                      type="checkbox"
                      aria-label={`${item.title} 선택`}
                      checked={isSelected}
                      onChange={() => toggleSelected(item.id)}
                      disabled={!canManage || bulkActionInProgress}
                      title={
                        canManage
                          ? undefined
                          : "관리 권한이 있는 문서만 선택할 수 있습니다."
                      }
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                    />
                    <div className="min-w-0 flex-1">
                      <h3
                        className="block truncate font-semibold text-gray-900"
                        title={item.title}
                      >
                        {item.title}
                      </h3>
                      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                        {item.isExpired
                          ? renderExpiredBadge()
                          : renderDocumentStatusBadge(item.status)}
                        {item.accessRelation === "SHARED" && (
                          <span className="inline-flex shrink-0 items-center rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            공유받음
                          </span>
                        )}
                        {item.accessRelation === "OWNER" && (
                          <span className="inline-flex shrink-0 items-center rounded bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                            소유
                          </span>
                        )}
                        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                          <ClockIcon className="h-3.5 w-3.5" />
                          <strong className="font-bold">
                            {item.expiresAt
                              ? `~${expiryLabel}`
                              : expiryLabel}
                          </strong>
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        {item.ownerOrganization
                          ? `${item.ownerOrganization.name} · `
                          : ""}
                        {item.uploader
                          ? `${item.uploader.name || item.uploader.email} · `
                          : ""}
                        업로드 {formatKoreanDate(item.uploadedAt)}
                        {item.processedAt
                          ? ` · 처리 완료 ${formatKoreanDate(item.processedAt)}`
                          : item.status === "queued" ||
                              item.status === "processing"
                            ? " · 처리 대기 중"
                            : ""}
                      </p>
                      {item.status === "failed" && item.errorMessage && (
                        <p className="mt-1 text-sm text-red-600">
                          {item.errorMessage}
                        </p>
                      )}
                      {canRequestReprocess && !item.canReprocess && (
                        <p className="mt-1 text-xs text-amber-700">
                          {getCooldownLabel(
                            item.reprocessAvailableAt,
                            currentTime,
                          ) ?? "현재 이 문서는 재처리할 수 없습니다."}
                        </p>
                      )}
                    </div>

                    <div
                      ref={isMenuOpen ? documentMenuRef : null}
                      className="relative -mt-1 shrink-0"
                    >
                      <button
                        type="button"
                        aria-label={`${item.title} 작업 메뉴`}
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        aria-controls={`document-menu-${item.id}`}
                        onClick={() =>
                          setOpenDocumentMenuId((currentId) =>
                            currentId === item.id ? null : item.id,
                          )
                        }
                        disabled={bulkActionInProgress}
                        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          isMenuOpen
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>

                      {isMenuOpen && (
                        <div
                          id={`document-menu-${item.id}`}
                          role="menu"
                          aria-label={`${item.title} 문서 작업`}
                          className="absolute right-0 top-full z-30 mt-1.5 flex w-52 flex-col gap-0.5 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg"
                        >
                          {isBulkMenu && (
                            <>
                              <p className="px-3 py-1.5 text-xs font-medium text-gray-500">
                                선택한 {selectedDocuments.length}개 문서에 적용
                              </p>
                              <div className="mx-1.5 my-0.5 border-t border-gray-200" />
                            </>
                          )}
                          {canView && !isBulkMenu ? (
                            <a
                              href={getResourceLink(
                                item.gcsPdfPath as string,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              role="menuitem"
                              onClick={() => setOpenDocumentMenuId(null)}
                              className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                            >
                              <EyeIcon className="h-[18px] w-[18px] shrink-0" />
                              보기
                            </a>
                          ) : (
                            <button
                              type="button"
                              role="menuitem"
                              disabled
                              title={
                                isBulkMenu
                                  ? BULK_UNAVAILABLE_TITLE
                                  : "처리 완료 후 문서를 볼 수 있습니다."
                              }
                              className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-400"
                            >
                              <EyeIcon className="h-[18px] w-[18px] shrink-0" />
                              보기
                            </button>
                          )}
                          {canManage && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenDocumentMenuId(null);
                                openExpiryEdit(bulkTargets);
                              }}
                              disabled={updatingExpiry || bulkActionInProgress}
                              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <CalendarIcon className="h-[18px] w-[18px] shrink-0" />
                              유효기간 변경
                            </button>
                          )}
                          {canManage && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenDocumentMenuId(null);
                                setPendingAction(
                                  isBulkMenu
                                    ? {
                                        type: "bulk-reprocess",
                                        documents:
                                          reprocessableSelectedDocuments,
                                      }
                                    : { type: "reprocess", document: item },
                                );
                              }}
                              disabled={
                                isBulkMenu
                                  ? reprocessableSelectedDocuments.length ===
                                      0 || bulkActionInProgress
                                  : !canRequestReprocess ||
                                    !item.canReprocess ||
                                    reprocessingId != null
                              }
                              title={
                                isBulkMenu
                                  ? reprocessableSelectedDocuments.length === 0
                                    ? "선택한 문서 중 재처리할 수 있는 문서가 없습니다."
                                    : reprocessableSelectedDocuments.length <
                                        selectedDocuments.length
                                      ? `재처리 가능한 ${reprocessableSelectedDocuments.length}개 문서만 재처리합니다.`
                                      : "선택한 문서 재처리"
                                  : !canRequestReprocess
                                    ? "처리 완료 또는 실패 후 재처리할 수 있습니다."
                                    : item.canReprocess
                                      ? "문서 재처리"
                                      : (getCooldownLabel(
                                          item.reprocessAvailableAt,
                                          currentTime,
                                        ) ?? "현재 재처리할 수 없습니다.")
                              }
                              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <RefreshIcon
                                className={`h-[18px] w-[18px] shrink-0 ${
                                  reprocessingId === item.id
                                    ? "animate-spin"
                                    : ""
                                }`}
                              />
                              {reprocessingId === item.id
                                ? "재처리 중..."
                                : "재처리"}
                            </button>
                          )}
                          {canShare && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenDocumentMenuId(null);
                                setShareModal({
                                  documents: bulkTargets,
                                  mode: "share",
                                });
                              }}
                              disabled={
                                bulkActionInProgress ||
                                (isBulkMenu && !allSelectedShareable)
                              }
                              title={
                                isBulkMenu && !allSelectedShareable
                                  ? "선택한 문서 중 공유 권한이 없는 문서가 있습니다."
                                  : undefined
                              }
                              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ShareIcon className="h-[18px] w-[18px] shrink-0" />
                              다른 조직에 공유
                            </button>
                          )}
                          {canShare && hasShared && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenDocumentMenuId(null);
                                setShareModal({
                                  documents: [item],
                                  mode: "unshare",
                                });
                              }}
                              disabled={isBulkMenu || bulkActionInProgress}
                              title={
                                isBulkMenu ? BULK_UNAVAILABLE_TITLE : undefined
                              }
                              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <UnlinkIcon className="h-[18px] w-[18px] shrink-0" />
                              공유 해제
                            </button>
                          )}
                          {canTransfer && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenDocumentMenuId(null);
                                setShareModal({
                                  documents: [item],
                                  mode: "transfer",
                                });
                              }}
                              disabled={isBulkMenu || bulkActionInProgress}
                              title={
                                isBulkMenu ? BULK_UNAVAILABLE_TITLE : undefined
                              }
                              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <TransferIcon className="h-[18px] w-[18px] shrink-0" />
                              소유권 이양
                            </button>
                          )}
                          {canManage && (
                            <>
                              <div className="mx-1.5 my-0.5 border-t border-gray-200" />
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenDocumentMenuId(null);
                                  setPendingAction(
                                    isBulkMenu
                                      ? {
                                          type: "bulk-delete",
                                          documents: selectedDocuments,
                                        }
                                      : { type: "delete", document: item },
                                  );
                                }}
                                disabled={
                                  deletingId === item.id || bulkActionInProgress
                                }
                                className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <TrashIcon className="h-[18px] w-[18px] shrink-0" />
                                {deletingId === item.id
                                  ? "삭제 중..."
                                  : "삭제"}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {!listLoading &&
        !listError &&
        !organizationEmptyMessage &&
        pageInfo.filteredTotal > 0 && (
          <nav
            aria-label="문서 목록 페이지"
            className="mt-5 flex items-center justify-center border-t border-gray-100 pt-4"
          >
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(pageInfo.number - 1)}
                disabled={!pageInfo.hasPrevious || listLoading}
              >
                이전
              </Button>
              <span className="min-w-16 text-center text-sm font-medium text-gray-700">
                {pageInfo.number} / {Math.max(1, pageInfo.totalPages)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(pageInfo.number + 1)}
                disabled={!pageInfo.hasNext || listLoading}
              >
                다음
              </Button>
            </div>
          </nav>
        )}

      {shareModal && (
        <ShareTransferModal
          documents={shareModal.documents}
          organizations={organizations}
          mode={shareModal.mode}
          onClose={() => setShareModal(null)}
          onUpdated={handleShareModalUpdated}
          onTransferred={handleShareModalUpdated}
        />
      )}

      <Dialog
        open={expiryEdit !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !updatingExpiry) setExpiryEdit(null);
        }}
        title="유효기간 변경"
        description="문서가 활성화될 기간을 설정합니다."
        size="md"
        closeDisabled={updatingExpiry}
        bodyClassName="space-y-4"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setExpiryEdit(null)}
              disabled={updatingExpiry}
            >
              취소
            </Button>
            <Button
              onClick={() => void handleSaveExpiry()}
              loading={updatingExpiry}
              loadingText="변경 중..."
            >
              변경 저장
            </Button>
          </>
        }
      >
        {expiryEdit && (
          <>
            {expiryDocument ? (
              <p className="truncate text-sm font-medium text-gray-800">
                문서: {expiryDocument.title}
              </p>
            ) : (
              <p className="text-sm font-medium text-gray-800">
                선택한 {expiryEdit.ids.length}개 문서의 유효기간을 함께
                변경합니다.
              </p>
            )}

            {expiryDocument && (
              <p className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                <span>현재 유효기간</span>
                <strong className="shrink-0 font-medium text-gray-900">
                  {expiryDocument.expiresAt
                    ? `~${formatKoreanDate(expiryDocument.expiresAt)}`
                    : "무기한"}
                </strong>
              </p>
            )}

            <Select
              label="변경할 기간"
              value={expiryEdit.mode}
              onValueChange={(value) =>
                setExpiryEdit((prev) =>
                  prev
                    ? {
                        ...prev,
                        mode: value as ExpiryEditState["mode"],
                        value:
                          value === "date" && !prev.value
                            ? expiryDocument?.expiresAt
                              ? toDateInputValue(
                                  new Date(expiryDocument.expiresAt),
                                )
                              : todayDateValue
                            : prev.value,
                        error: null,
                      }
                    : prev,
                )
              }
              options={[
                { value: "date", label: "만료일 지정" },
                { value: "indefinite", label: "무기한" },
              ]}
              variant="form"
              disabled={updatingExpiry}
            />

            {expiryEdit.mode === "date" && (
              <div>
                <label
                  htmlFor="document-expiry-date"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  만료일
                </label>
                <DatePicker
                  id="document-expiry-date"
                  value={expiryEdit.value}
                  min={todayDateValue}
                  disabled={updatingExpiry}
                  ariaLabel="문서 만료일 선택"
                  onChange={(value) =>
                    setExpiryEdit((prev) =>
                      prev
                        ? {
                            ...prev,
                            value,
                            error: null,
                          }
                        : prev,
                    )
                  }
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  지정한 날짜의 자정 전까지 챗봇 답변에 사용됩니다.
                </p>
              </div>
            )}

            {expiryEdit.error && (
              <p
                role="alert"
                className="whitespace-pre-line rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {expiryEdit.error}
              </p>
            )}
          </>
        )}
      </Dialog>

      {pendingAction?.type === "delete" && (
        <ConfirmDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPendingAction(null);
          }}
          title="문서를 삭제할까요?"
          description={`"${pendingAction.document.title}" 문서를 삭제합니다.\n삭제한 문서는 복구할 수 없습니다.`}
          confirmLabel="문서 삭제"
          loadingLabel="삭제 중..."
          variant="danger"
          fallbackErrorMessage="문서 삭제에 실패했습니다."
          onConfirm={() => handleDelete(pendingAction.document)}
        />
      )}

      {pendingAction?.type === "reprocess" && (
        <ConfirmDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPendingAction(null);
          }}
          title="문서를 재처리할까요?"
          description={`"${pendingAction.document.title}" 문서의 PDF 전체를 다시 처리합니다.\n재처리 과정에서 API 비용이 발생합니다.`}
          confirmLabel="재처리"
          loadingLabel="재처리 중..."
          size="md"
          fallbackErrorMessage="문서 재처리 요청에 실패했습니다."
          onConfirm={() => handleReprocess(pendingAction.document.id)}
        />
      )}

      {pendingAction?.type === "bulk-delete" && (
        <ConfirmDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPendingAction(null);
          }}
          title="선택한 문서를 삭제할까요?"
          description={`선택한 ${pendingAction.documents.length}개 문서를 삭제합니다.\n삭제한 문서는 복구할 수 없습니다.`}
          confirmLabel="문서 삭제"
          loadingLabel="삭제 중..."
          variant="danger"
          fallbackErrorMessage="문서 삭제에 실패했습니다."
          onConfirm={() => handleBulkDelete(pendingAction.documents)}
        />
      )}

      {pendingAction?.type === "bulk-reprocess" && (
        <ConfirmDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPendingAction(null);
          }}
          title="선택한 문서를 재처리할까요?"
          description={`선택한 ${pendingAction.documents.length}개 문서의 PDF 전체를 다시 처리합니다.\n재처리 과정에서 API 비용이 발생합니다.`}
          confirmLabel="재처리"
          loadingLabel="재처리 중..."
          size="md"
          fallbackErrorMessage="문서 재처리 요청에 실패했습니다."
          onConfirm={() => handleBulkReprocess(pendingAction.documents)}
        />
      )}
    </section>
  );
}
