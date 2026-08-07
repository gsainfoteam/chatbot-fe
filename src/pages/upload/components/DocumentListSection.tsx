import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdminUploadApiError,
  deleteUpload,
  getUploadById,
  reprocessUpload,
  updateUploadExpiry,
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
  formatKoreanDate,
  getResourceLink,
  normalizeSearchText,
  parseFutureExpiresAt,
  toDateInputValue,
} from "../utils";

interface DocumentListSectionProps {
  documents: DocumentItem[];
  organizations: Organization[];
  filterOrganizationId: string | "all";
  listLoading: boolean;
  listError: string | null;
  pollingError: string | null;
  onRetryFetch: () => void;
  onDocumentsChange: (updater: (prev: DocumentItem[]) => DocumentItem[]) => void;
  onDocumentMutation: (
    previousDocument: DocumentItem,
    nextDocument: DocumentItem | null,
  ) => void;
}

interface ExpiryEditState {
  id: string;
  mode: "date" | "indefinite";
  value: string;
  error: string | null;
}

type ShareMode = "share" | "unshare" | "transfer";
type DocumentStatusFilter =
  | "all"
  | "active"
  | "processing"
  | "failed"
  | "expired";
type DocumentSortOrder = "recent" | "name" | "expiry";

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
  | { type: "reprocess"; document: DocumentItem };

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
  if (organizationId === "all") return document.canManage !== false;
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
  onRetryFetch,
  onDocumentsChange,
  onDocumentMutation,
}: DocumentListSectionProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [expiryEdit, setExpiryEdit] = useState<ExpiryEditState | null>(null);
  const [updatingExpiryId, setUpdatingExpiryId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] =
    useState<PendingDocumentAction | null>(null);
  const [openDocumentMenuId, setOpenDocumentMenuId] = useState<string | null>(
    null,
  );
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DocumentStatusFilter>("all");
  const [sortOrder, setSortOrder] =
    useState<DocumentSortOrder>("recent");
  const [shareModal, setShareModal] = useState<{
    document: DocumentItem;
    mode: ShareMode;
  } | null>(null);
  const documentMenuRef = useRef<HTMLDivElement>(null);
  const todayDateValue = useMemo(() => toDateInputValue(new Date()), []);
  const filteredDocuments = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    const nextDocuments = documents.filter((item) => {
      const matchesStatus = (() => {
        switch (statusFilter) {
          case "all":
            return true;
          case "active":
            return item.status === "ready" && !item.isExpired;
          case "processing":
            return (
              item.status === "uploading" ||
              item.status === "queued" ||
              item.status === "processing"
            );
          case "failed":
            return item.status === "failed";
          case "expired":
            return item.isExpired;
        }
      })();
      if (!matchesStatus) return false;
      if (!query) return true;
      return [
        item.title,
        item.resourceName,
        item.ownerOrganization?.name,
        item.uploader?.name,
        item.uploader?.email,
      ].some(
        (value) => value != null && normalizeSearchText(value).includes(query),
      );
    });

    return nextDocuments.sort((a, b) => {
      switch (sortOrder) {
        case "recent":
          return (
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
          );
        case "name":
          return a.title.localeCompare(b.title, "ko");
        case "expiry": {
          if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1;
          const aExpiry = a.expiresAt
            ? new Date(a.expiresAt).getTime()
            : Number.POSITIVE_INFINITY;
          const bExpiry = b.expiresAt
            ? new Date(b.expiresAt).getTime()
            : Number.POSITIVE_INFINITY;
          return aExpiry - bExpiry;
        }
      }
    });
  }, [documents, searchQuery, sortOrder, statusFilter]);

  const expiryDocument = expiryEdit
    ? (documents.find((item) => item.id === expiryEdit.id) ?? null)
    : null;

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
      if (expiryEdit?.id === id) setExpiryEdit(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "삭제에 실패했습니다.";
      if (message === "이미 삭제되었거나 존재하지 않는 파일입니다.") {
        onDocumentsChange((prev) => prev.filter((item) => item.id !== id));
        onDocumentMutation(document, null);
        if (expiryEdit?.id === id) setExpiryEdit(null);
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

  const openExpiryEdit = (item: DocumentItem) => {
    setExpiryEdit({
      id: item.id,
      mode: item.expiresAt === null ? "indefinite" : "date",
      value: item.expiresAt ? toDateInputValue(new Date(item.expiresAt)) : "",
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

    const document = documents.find((item) => item.id === expiryEdit.id);
    if (!document) {
      setExpiryEdit((prev) =>
        prev ? { ...prev, error: "문서를 찾을 수 없습니다." } : prev,
      );
      return;
    }

    try {
      setUpdatingExpiryId(document.id);
      const doc = await updateUploadExpiry(document.id, nextExpiresAt);
      onDocumentsChange((prev) => upsertDocument(prev, doc));
      setExpiryEdit(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "유효기간 변경에 실패했습니다.";
      setExpiryEdit((prev) => (prev ? { ...prev, error: message } : prev));
    } finally {
      setUpdatingExpiryId(null);
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
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="문서 검색"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pr-4 pl-10 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/25"
          />
        </label>
        <div className="grid grid-cols-2 gap-2.5 sm:flex">
          <Select
            ariaLabel="문서 상태 필터"
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as DocumentStatusFilter)
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
              setSortOrder(value as DocumentSortOrder)
            }
            options={SORT_OPTIONS}
            variant="form"
            width="full"
            className="sm:w-[160px]"
            triggerClassName="border-gray-200"
          />
        </div>
      </div>

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
            표시할 문서가 없습니다.
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-gray-500">
            조건에 맞는 문서가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((item) => {
              const isMenuOpen = openDocumentMenuId === item.id;
              const canView =
                item.status === "ready" && item.gcsPdfPath != null;
              const canManage = item.canManage === true;
              const canShare = item.canShare === true;
              const canTransfer = item.canTransfer === true;
              const canRequestReprocess =
                canManage &&
                (item.status === "failed" || item.status === "ready");
              const expiryLabel = item.expiresAt
                ? formatKoreanDate(item.expiresAt)
                : "무기한";
              const hasShared =
                (item.sharedOrganizations?.length ?? 0) > 0;

              return (
                <article
                  key={item.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
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
                        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors ${
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
                          {canView ? (
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
                              title="처리 완료 후 문서를 볼 수 있습니다."
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
                                openExpiryEdit(item);
                              }}
                              disabled={updatingExpiryId != null}
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
                                setPendingAction({
                                  type: "reprocess",
                                  document: item,
                                });
                              }}
                              disabled={
                                !canRequestReprocess ||
                                !item.canReprocess ||
                                reprocessingId != null
                              }
                              title={
                                !canRequestReprocess
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
                                setShareModal({ document: item, mode: "share" });
                              }}
                              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
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
                                  document: item,
                                  mode: "unshare",
                                });
                              }}
                              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
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
                                  document: item,
                                  mode: "transfer",
                                });
                              }}
                              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
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
                                  setPendingAction({
                                    type: "delete",
                                    document: item,
                                  });
                                }}
                                disabled={deletingId === item.id}
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

      {shareModal && (
        <ShareTransferModal
          document={shareModal.document}
          organizations={organizations}
          mode={shareModal.mode}
          onClose={() => setShareModal(null)}
          onUpdated={(doc) => {
            const previousDocument = shareModal.document;
            onDocumentsChange((prev) => {
              if (!isDocumentVisibleForFilter(doc, filterOrganizationId)) {
                return prev.filter((item) => item.id !== doc.id);
              }
              return upsertDocument(prev, doc);
            });
            onDocumentMutation(previousDocument, doc);
          }}
          onTransferred={(doc) => {
            const previousDocument = shareModal.document;
            onDocumentsChange((prev) => {
              if (!isDocumentVisibleForFilter(doc, filterOrganizationId)) {
                return prev.filter((item) => item.id !== doc.id);
              }
              return upsertDocument(prev, doc);
            });
            onDocumentMutation(previousDocument, doc);
          }}
        />
      )}

      <Dialog
        open={expiryEdit !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && updatingExpiryId === null) setExpiryEdit(null);
        }}
        title="유효기간 변경"
        description="문서가 활성화될 기간을 설정합니다."
        size="md"
        closeDisabled={updatingExpiryId !== null}
        bodyClassName="space-y-4"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setExpiryEdit(null)}
              disabled={updatingExpiryId !== null}
            >
              취소
            </Button>
            <Button
              onClick={() => void handleSaveExpiry()}
              loading={updatingExpiryId !== null}
              loadingText="변경 중..."
            >
              변경 저장
            </Button>
          </>
        }
      >
        {expiryEdit && (
          <>
            {expiryDocument && (
              <p className="truncate text-sm font-medium text-gray-800">
                문서: {expiryDocument.title}
              </p>
            )}

            <p className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
              <span>현재 유효기간</span>
              <strong className="shrink-0 font-medium text-gray-900">
                {expiryDocument?.expiresAt
                  ? `~${formatKoreanDate(expiryDocument.expiresAt)}`
                  : "무기한"}
              </strong>
            </p>

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
              disabled={updatingExpiryId !== null}
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
                  disabled={updatingExpiryId !== null}
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
                className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
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

    </section>
  );
}
