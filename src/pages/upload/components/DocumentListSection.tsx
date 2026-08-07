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
  TrashIcon,
} from "../../../components/Icons";
import { Button, ConfirmDialog, Select } from "../../../components/ui";
import ShareTransferModal from "./ShareTransferModal";
import {
  formatKoreanDate,
  getResourceLink,
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
  onFilterChange: (organizationId: string | "all") => void;
  onRetryFetch: () => void;
  onDocumentsChange: (updater: (prev: DocumentItem[]) => DocumentItem[]) => void;
}

interface ExpiryEditState {
  id: string;
  mode: "date" | "indefinite";
  value: string;
  error: string | null;
}

type ShareMode = "share" | "unshare" | "transfer";

type PendingDocumentAction =
  | { type: "delete"; document: DocumentItem }
  | { type: "reprocess"; document: DocumentItem }
  | {
      type: "expiry";
      document: DocumentItem;
      nextExpiresAt: string | null;
    };

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
          사용 가능
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

export default function DocumentListSection({
  documents,
  organizations,
  filterOrganizationId,
  listLoading,
  listError,
  pollingError,
  onFilterChange,
  onRetryFetch,
  onDocumentsChange,
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
  const [shareModal, setShareModal] = useState<{
    document: DocumentItem;
    mode: ShareMode;
  } | null>(null);
  const documentMenuRef = useRef<HTMLDivElement>(null);
  const todayDateValue = useMemo(() => toDateInputValue(new Date()), []);

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

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteUpload(id);
      onDocumentsChange((prev) => prev.filter((item) => item.id !== id));
      if (expiryEdit?.id === id) setExpiryEdit(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "삭제에 실패했습니다.";
      if (message === "이미 삭제되었거나 존재하지 않는 파일입니다.") {
        onDocumentsChange((prev) => prev.filter((item) => item.id !== id));
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

  const requestExpiryUpdate = () => {
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

    setPendingAction({ type: "expiry", document, nextExpiresAt });
  };

  const handleUpdateExpiry = async (
    id: string,
    nextExpiresAt: string | null,
  ) => {
    try {
      setUpdatingExpiryId(id);
      const doc = await updateUploadExpiry(id, nextExpiresAt);
      onDocumentsChange((prev) => upsertDocument(prev, doc));
      setExpiryEdit(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "유효기간 변경에 실패했습니다.";
      setExpiryEdit((prev) => (prev ? { ...prev, error: message } : prev));
      throw new Error(message);
    } finally {
      setUpdatingExpiryId(null);
    }
  };

  return (
    <section
      aria-labelledby="document-list-heading"
      className="upload-document-panel flex min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
    >
      <div className="flex shrink-0 flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2
            id="document-list-heading"
            className="text-xl font-semibold text-gray-900"
          >
            문서 목록
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            만료된 문서는 자동으로 챗봇 답변에서 제외됩니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="shrink-0">조직 필터</span>
            <Select
              value={filterOrganizationId}
              onValueChange={(value) =>
                onFilterChange(
                  value === "all" ? "all" : value,
                )
              }
              options={[
                { value: "all", label: "전체" },
                ...organizations.map((org) => ({
                  value: org.id,
                  label: org.name,
                })),
              ]}
              ariaLabel="문서 목록 조직 필터"
              width="auto"
              variant="form"
              size="sm"
            />
          </div>
          <span className="text-sm font-medium text-gray-500">
            총 {documents.length}개
          </span>
        </div>
      </div>

      <div className="document-list-scroll flex-1 p-4 sm:p-6">
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
        ) : (
          <div className="space-y-4">
            {documents.map((item) => {
              const isEditingExpiry = expiryEdit?.id === item.id;
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

                  {isEditingExpiry && expiryEdit && (
                    <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50/70 p-4">
                      <p className="text-sm font-medium text-gray-800">
                        유효기간 변경
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name={`expiry-mode-${item.id}`}
                            checked={expiryEdit.mode === "date"}
                            onChange={() =>
                              setExpiryEdit((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      mode: "date",
                                      error: null,
                                      value:
                                        prev.value ||
                                        (item.expiresAt
                                          ? toDateInputValue(
                                              new Date(item.expiresAt),
                                            )
                                          : ""),
                                    }
                                  : prev,
                              )
                            }
                            className="accent-[#df3326]"
                          />
                          만료일 지정
                        </label>
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name={`expiry-mode-${item.id}`}
                            checked={expiryEdit.mode === "indefinite"}
                            onChange={() =>
                              setExpiryEdit((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      mode: "indefinite",
                                      error: null,
                                    }
                                  : prev,
                              )
                            }
                            className="accent-[#df3326]"
                          />
                          무기한으로 변경
                        </label>
                      </div>
                      {expiryEdit.mode === "date" && (
                        <input
                          type="date"
                          value={expiryEdit.value}
                          min={todayDateValue}
                          onChange={(event) =>
                            setExpiryEdit((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    value: event.target.value,
                                    error: null,
                                  }
                                : prev,
                            )
                          }
                          className="w-full max-w-md rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#df3326]"
                        />
                      )}
                      {expiryEdit.error && (
                        <p className="text-sm text-red-600">
                          {expiryEdit.error}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={requestExpiryUpdate}
                          disabled={updatingExpiryId === item.id}
                        >
                          저장
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setExpiryEdit(null)}
                          disabled={updatingExpiryId === item.id}
                        >
                          닫기
                        </Button>
                      </div>
                    </div>
                  )}
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
          onUpdated={(doc) =>
            onDocumentsChange((prev) => upsertDocument(prev, doc))
          }
          onTransferred={(doc) => {
            onDocumentsChange((prev) => {
              const stillVisible =
                doc.canManage !== false &&
                (filterOrganizationId === "all" ||
                  doc.ownerOrganization?.id === filterOrganizationId ||
                  (doc.sharedOrganizations ?? []).some(
                    (org) => org.id === filterOrganizationId,
                  ));
              if (!stillVisible) {
                return prev.filter((item) => item.id !== doc.id);
              }
              return upsertDocument(prev, doc);
            });
          }}
        />
      )}

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
          onConfirm={() => handleDelete(pendingAction.document.id)}
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
          fallbackErrorMessage="문서 재처리 요청에 실패했습니다."
          onConfirm={() => handleReprocess(pendingAction.document.id)}
        />
      )}

      {pendingAction?.type === "expiry" && (
        <ConfirmDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPendingAction(null);
          }}
          title="유효기간을 변경할까요?"
          description={`"${pendingAction.document.title}" 문서의 유효기간을 ${
            pendingAction.nextExpiresAt === null
              ? "무기한"
              : `${formatKoreanDate(pendingAction.nextExpiresAt)}까지`
          }로 변경합니다.`}
          confirmLabel="유효기간 변경"
          loadingLabel="변경 중..."
          fallbackErrorMessage="유효기간 변경에 실패했습니다."
          onConfirm={() =>
            handleUpdateExpiry(
              pendingAction.document.id,
              pendingAction.nextExpiresAt,
            )
          }
        />
      )}
    </section>
  );
}
