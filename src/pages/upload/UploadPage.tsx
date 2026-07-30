import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { getToken, useVerifyToken } from "../../api/auth";
import {
  uploadPdf,
  deleteUpload,
  getUploadList,
  getUploadById,
  reprocessUpload,
  updateUploadExpiry,
  AdminUploadApiError,
  isPdfFile,
  isWithinSizeLimit,
  MAX_FILE_SIZE_MB,
} from "../../api/upload";
import type { DocumentItem, DocumentStatus } from "../../api/types";
import LoadingSpinner from "../../components/LoadingSpinner";
import { RefreshIcon, UploadIcon, XIcon } from "../../components/Icons";
import {
  formatExpiresAtLabel,
  getResourceLink,
  parseFutureExpiresAt,
  toDatetimeLocalValue,
} from "./utils";

const SUPER_ADMIN = "SUPER_ADMIN";
const MAX_CONCURRENT_UPLOADS = 10;
const POLL_INTERVAL_MS = 3000;

type PendingStatus = "pending" | "uploading" | "success" | "error";

interface PendingUpload {
  id: string;
  file: File;
  status: PendingStatus;
  error?: string;
  expiresAtInput: string;
  expiryError?: string;
}

interface ExpiryEditState {
  id: string;
  mode: "date" | "indefinite";
  value: string;
  error: string | null;
}

function isPollingStatus(status: DocumentStatus): boolean {
  return status === "queued" || status === "processing";
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

function validateFile(file: File): string | null {
  if (!isPdfFile(file)) {
    return "PDF 파일만 업로드할 수 있습니다.";
  }
  if (!isWithinSizeLimit(file)) {
    return `파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다.`;
  }
  return null;
}

function nextId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fileKey(f: File): string {
  return `${f.name}:${f.size}:${f.lastModified}`;
}

function getCooldownLabel(
  reprocessAvailableAt: string | null,
  now: number,
): string | null {
  if (!reprocessAvailableAt) return null;
  const availableAt = new Date(reprocessAvailableAt).getTime();
  if (Number.isNaN(availableAt)) return null;

  const remainingSeconds = Math.max(
    0,
    Math.ceil((availableAt - now) / 1000),
  );
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
        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs shrink-0">
          업로드 중
        </span>
      );
    case "queued":
      return (
        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs shrink-0">
          처리 대기
        </span>
      );
    case "processing":
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs shrink-0">
          처리 중
        </span>
      );
    case "ready":
      return (
        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs shrink-0">
          사용 가능
        </span>
      );
    case "failed":
      return (
        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs shrink-0">
          처리 실패
        </span>
      );
  }
}

function renderExpiredBadge() {
  return (
    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs shrink-0">
      만료됨
    </span>
  );
}

export default function UploadPage() {
  const hasToken = !!getToken();
  const { data, isLoading, isError } = useVerifyToken(hasToken);

  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedList, setUploadedList] = useState<DocumentItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [reprocessError, setReprocessError] = useState<string | null>(null);
  const [expiryEdit, setExpiryEdit] = useState<ExpiryEditState | null>(null);
  const [updatingExpiryId, setUpdatingExpiryId] = useState<string | null>(null);
  const [expiryError, setExpiryError] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadedListRef = useRef(uploadedList);

  uploadedListRef.current = uploadedList;

  const pollingIdsKey = useMemo(
    () =>
      uploadedList
        .filter((item) => isPollingStatus(item.status))
        .map((item) => item.id)
        .join(","),
    [uploadedList],
  );

  const cooldownKey = useMemo(
    () =>
      uploadedList
        .filter(
          (item) => !item.canReprocess && item.reprocessAvailableAt != null,
        )
        .map((item) => `${item.id}:${item.reprocessAvailableAt}`)
        .join(","),
    [uploadedList],
  );

  const fetchList = useCallback(() => {
    setListError(null);
    return getUploadList({ limit: 50, offset: 0 })
      .then((list) => {
        setUploadedList(list);
      })
      .catch((err) => {
        setListError(
          err instanceof Error
            ? err.message
            : "목록을 불러오는데 실패했습니다.",
        );
      })
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (
      !hasToken ||
      isLoading ||
      isError ||
      !data?.uuid ||
      data.role !== SUPER_ADMIN
    )
      return;
    fetchList();
  }, [hasToken, isLoading, isError, data?.uuid, data?.role, fetchList]);

  useEffect(() => {
    if (!pollingIdsKey) return;

    let cancelled = false;
    let timeoutId: number | undefined;
    let controller: AbortController | undefined;

    const poll = async (): Promise<void> => {
      const ids = uploadedListRef.current
        .filter((item) => isPollingStatus(item.status))
        .map((item) => item.id);
      if (ids.length === 0) return;

      controller = new AbortController();
      const results = await Promise.allSettled(
        ids.map((id) => getUploadById(id, controller?.signal)),
      );
      if (cancelled) return;

      const updates = new Map<string, DocumentItem>();
      const missingIds = new Set<string>();
      let hasPollingError = false;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          updates.set(result.value.id, result.value);
          return;
        }
        if (
          result.reason instanceof AdminUploadApiError &&
          result.reason.status === 404
        ) {
          missingIds.add(ids[index]);
          return;
        }
        hasPollingError = true;
      });

      setPollingError(
        hasPollingError
          ? "일부 문서의 처리 상태를 불러오지 못했습니다. 자동으로 다시 시도합니다."
          : null,
      );
      setUploadedList((prev) =>
        prev
          .filter((item) => !missingIds.has(item.id))
          .map((item) => {
            const update = updates.get(item.id);
            return update && isPollingStatus(item.status) ? update : item;
          }),
      );

      if (!cancelled) {
        timeoutId = window.setTimeout(() => {
          void poll();
        }, POLL_INTERVAL_MS);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      controller?.abort();
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [pollingIdsKey]);

  useEffect(() => {
    if (!cooldownKey) return;
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [cooldownKey]);

  useEffect(() => {
    if (!cooldownKey) return;

    const cooldownItems = uploadedListRef.current.filter(
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
        const expiredIds = uploadedListRef.current
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
            setUploadedList((prev) =>
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
  }, [cooldownKey]);

  if (!hasToken) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <LoadingSpinner
          message="권한 확인 중..."
          fullScreen
          className="bg-gray-50/55"
        />
      </div>
    );
  }

  if (isError || !data?.uuid || data.role !== SUPER_ADMIN) {
    return <Navigate to="/" replace />;
  }

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    const existingKeys = new Set(pending.map((p) => fileKey(p.file)));
    const toAdd: PendingUpload[] = [];
    for (const f of files) {
      const key = fileKey(f);
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      const error = validateFile(f);
      toAdd.push({
        id: nextId(),
        file: f,
        status: error ? "error" : "pending",
        error: error ?? undefined,
        expiresAtInput: "",
      });
    }
    const available = Math.max(MAX_CONCURRENT_UPLOADS - pending.length, 0);
    if (toAdd.length > available) {
      setLimitNotice(
        `한 번에 최대 ${MAX_CONCURRENT_UPLOADS}개까지만 업로드할 수 있습니다.`,
      );
    } else {
      setLimitNotice(null);
    }
    setPending((prev) => [...prev, ...toAdd.slice(0, available)]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen || chosen.length === 0) return;
    addFiles(Array.from(chosen));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files;
    if (!dropped || dropped.length === 0) return;
    addFiles(Array.from(dropped));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (id: string) => {
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePendingExpiry = (id: string, value: string) => {
    setPending((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, expiresAtInput: value, expiryError: undefined }
          : item,
      ),
    );
  };

  const uploadSingle = async (
    item: PendingUpload,
    expiresAt?: string,
  ): Promise<void> => {
    setPending((prev) =>
      prev.map((p) =>
        p.id === item.id ? { ...p, status: "uploading", error: undefined } : p,
      ),
    );
    try {
      const title = item.file.name.trim() || "제목 없음";
      const doc = await uploadPdf(item.file, title, expiresAt);
      setUploadedList((prev) => upsertDocument(prev, doc));
      setPending((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "success", error: undefined } : p,
        ),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "업로드에 실패했습니다.";
      setPending((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "error", error: message } : p,
        ),
      );
    }
  };

  const runQueue = async (items: PendingUpload[]) => {
    if (items.length === 0) return;

    const prepared = items.map((item) => ({
      item,
      parsed: parseFutureExpiresAt(item.expiresAtInput),
    }));
    const invalidById = new Map(
      prepared
        .filter(({ parsed }) => parsed.error)
        .map(({ item, parsed }) => [item.id, parsed.error as string]),
    );
    if (invalidById.size > 0) {
      setPending((prev) =>
        prev.map((item) => ({
          ...item,
          expiryError: invalidById.get(item.id) ?? item.expiryError,
        })),
      );
      return;
    }

    setIsUploading(true);
    try {
      await Promise.all(
        prepared.map(({ item, parsed }) =>
          uploadSingle(item, parsed.expiresAt),
        ),
      );
      setPending((prev) => prev.filter((p) => p.status !== "success"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAll = () => {
    const targets = pending.filter((p) => p.status === "pending");
    void runQueue(targets);
  };

  const handleRetry = (id: string) => {
    const target = pending.find((p) => p.id === id);
    if (!target) return;
    const error = validateFile(target.file);
    if (error) {
      setPending((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "error", error } : p)),
      );
      return;
    }
    void runQueue([{ ...target, status: "pending", error: undefined }]);
  };

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    try {
      setDeletingId(id);
      await deleteUpload(id);
      setUploadedList((prev) => prev.filter((item) => item.id !== id));
      if (expiryEdit?.id === id) setExpiryEdit(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "삭제에 실패했습니다.";
      setDeleteError(message);
      if (message === "이미 삭제되었거나 존재하지 않는 파일입니다.") {
        setUploadedList((prev) => prev.filter((item) => item.id !== id));
        setDeleteError(null);
        if (expiryEdit?.id === id) setExpiryEdit(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (item: DocumentItem) => {
    const confirmed = window.confirm(
      `"${item.title}" 문서를 삭제하시겠습니까?\n삭제한 문서는 복구할 수 없습니다.`,
    );
    if (confirmed) void handleDelete(item.id);
  };

  const handleReprocess = async (id: string) => {
    setReprocessError(null);
    try {
      setReprocessingId(id);
      const doc = await reprocessUpload(id);
      setUploadedList((prev) => upsertDocument(prev, doc));
    } catch (err) {
      if (
        err instanceof AdminUploadApiError &&
        err.status === 429 &&
        err.retryAt
      ) {
        setUploadedList((prev) =>
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
      setReprocessError(
        err instanceof Error ? err.message : "재처리 요청에 실패했습니다.",
      );
    } finally {
      setReprocessingId(null);
    }
  };

  const confirmReprocess = (id: string) => {
    const confirmed = window.confirm(
      "이 작업은 PDF 전체를 다시 처리하며 API 비용이 발생합니다.\n정말 재처리하시겠습니까?",
    );
    if (confirmed) void handleReprocess(id);
  };

  const openExpiryEdit = (item: DocumentItem) => {
    setExpiryError(null);
    setExpiryEdit({
      id: item.id,
      mode: item.expiresAt === null ? "indefinite" : "date",
      value: toDatetimeLocalValue(item.expiresAt),
      error: null,
    });
  };

  const handleSaveExpiry = async () => {
    if (!expiryEdit) return;
    setExpiryError(null);

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

    const confirmed = window.confirm(
      nextExpiresAt === null
        ? "이 문서의 유효기간을 무기한으로 변경하시겠습니까?"
        : `이 문서의 유효기간을 ${new Date(nextExpiresAt).toLocaleString("ko-KR")}(으)로 변경하시겠습니까?`,
    );
    if (!confirmed) return;

    try {
      setUpdatingExpiryId(expiryEdit.id);
      const doc = await updateUploadExpiry(expiryEdit.id, nextExpiresAt);
      setUploadedList((prev) => upsertDocument(prev, doc));
      setExpiryEdit(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "유효기간 변경에 실패했습니다.";
      setExpiryError(message);
      setExpiryEdit((prev) => (prev ? { ...prev, error: message } : prev));
    } finally {
      setUpdatingExpiryId(null);
    }
  };

  const pendingCount = pending.filter((p) => p.status === "pending").length;
  const hasUploadable = pendingCount > 0 && !isUploading;

  const renderPendingStatusBadge = (status: PendingStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs shrink-0">
            대기
          </span>
        );
      case "uploading":
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs shrink-0">
            업로드 중...
          </span>
        );
      case "success":
        return (
          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs shrink-0">
            전송 완료
          </span>
        );
      case "error":
        return (
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs shrink-0">
            실패
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">문서 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            PDF를 업로드하면 AI 처리 상태가 자동으로 갱신됩니다. 유효기간을
            지정하지 않으면 무기한으로 저장됩니다. 한 번에 최대{" "}
            {MAX_CONCURRENT_UPLOADS}개까지 업로드할 수 있습니다. (각 파일 최대{" "}
            {MAX_FILE_SIZE_MB}MB)
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">PDF 업로드</h2>
            <p className="mt-1 text-sm text-gray-500">
              파일 이름이 제목으로 저장됩니다. 파일을 추가한 뒤 각 문서의
              유효기간을 개별적으로 설정할 수 있습니다.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                파일 <span className="text-red-500">*</span>
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-colors duration-150
                  ${
                    isDragging
                      ? "border-[#df3326] bg-red-50/50"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50/50"
                  }
                `}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex justify-center">
                  <UploadIcon className="w-12 h-12 text-gray-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-700">
                  클릭하거나 PDF 파일을 여기에 드래그하세요 (최대{" "}
                  {MAX_CONCURRENT_UPLOADS}개까지 업로드 가능)
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PDF만 업로드 가능, 각 파일 최대 {MAX_FILE_SIZE_MB}MB
                </p>
              </div>

              {limitNotice && (
                <p className="mt-2 text-sm text-red-600">{limitNotice}</p>
              )}

              {pending.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-800">
                      업로드 대기 문서
                    </h3>
                    <span className="text-xs text-gray-500">
                      유효기간 미선택 시 무기한
                    </span>
                  </div>
                  {pending.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-gray-200 bg-gray-50/40 p-4 text-sm"
                    >
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)_auto] md:items-start">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 truncate min-w-0">
                              {item.file.name}
                            </span>
                            {renderPendingStatusBadge(item.status)}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {(item.file.size / 1024).toFixed(1)} KB
                          </p>
                          {item.error && (
                            <p className="mt-1 text-xs text-red-600">
                              {item.error}
                            </p>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <label
                              htmlFor={`pending-expires-at-${item.id}`}
                              className="text-xs font-medium text-gray-700"
                            >
                              유효기간
                            </label>
                            <button
                              type="button"
                              onClick={() => updatePendingExpiry(item.id, "")}
                              disabled={
                                !item.expiresAtInput ||
                                item.status === "uploading"
                              }
                              className="text-xs font-medium text-gray-500 hover:text-gray-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              무기한
                            </button>
                          </div>
                          <input
                            id={`pending-expires-at-${item.id}`}
                            type="datetime-local"
                            value={item.expiresAtInput}
                            min={toDatetimeLocalValue(
                              new Date().toISOString(),
                            )}
                            onChange={(event) =>
                              updatePendingExpiry(item.id, event.target.value)
                            }
                            disabled={item.status === "uploading"}
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#df3326] focus:outline-none focus:ring-1 focus:ring-[#df3326] disabled:opacity-50"
                          />
                          {item.expiryError && (
                            <p className="mt-1 text-xs text-red-600">
                              {item.expiryError}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 md:justify-end md:pt-6">
                          {item.status === "error" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetry(item.id);
                              }}
                              disabled={isUploading}
                              className="text-[#df3326] hover:text-[#c72a1f] font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            >
                              재시도
                            </button>
                          )}
                          {item.status !== "uploading" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(item.id);
                              }}
                              className="text-red-600 hover:text-red-700 font-medium cursor-pointer"
                            >
                              제거
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleUploadAll}
              disabled={!hasUploadable}
              className="w-full px-6 py-2.5 bg-[#df3326] text-white font-medium rounded-md hover:bg-[#c72a1f] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUploading
                ? "업로드 중..."
                : pendingCount > 0
                  ? `업로드 (${pendingCount}개)`
                  : "업로드"}
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">문서 목록</h2>
            <p className="mt-1 text-sm text-gray-500">
              만료된 문서는 목록에 남지만 Chat 검색에서는 제외됩니다.
            </p>
          </div>
          {listLoading ? (
            <div className="p-8 text-center text-gray-500">
              목록을 불러오는 중...
            </div>
          ) : listError ? (
            <div className="p-6 flex flex-col items-center gap-3">
              <p className="text-sm text-red-600">{listError}</p>
              <button
                type="button"
                onClick={() => {
                  setListLoading(true);
                  fetchList();
                }}
                className="text-sm font-medium text-[#df3326] hover:underline cursor-pointer"
              >
                다시 시도
              </button>
            </div>
          ) : uploadedList.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              업로드한 파일이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {uploadedList.map((item) => {
                const isEditingExpiry = expiryEdit?.id === item.id;
                return (
                  <div key={item.id} className="px-6 py-4 text-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <p className="font-medium text-gray-900 truncate min-w-0">
                            {item.title}
                          </p>
                          {renderDocumentStatusBadge(item.status)}
                          {item.isExpired && renderExpiredBadge()}
                        </div>
                        <p className="text-gray-500 text-xs">
                          업로드:{" "}
                          {new Date(item.uploadedAt).toLocaleString("ko-KR")}
                          {item.processedAt
                            ? ` · 처리 완료: ${new Date(
                                item.processedAt,
                              ).toLocaleString("ko-KR")}`
                            : ""}
                        </p>
                        <p className="text-gray-500 text-xs">
                          유효기간: {formatExpiresAtLabel(item.expiresAt)}
                          {item.isExpired ? " · Chat에서 제외됨" : ""}
                        </p>
                        {item.status === "failed" && item.errorMessage && (
                          <p className="text-red-600 text-xs">
                            {item.errorMessage}
                          </p>
                        )}
                        {(item.status === "failed" ||
                          item.status === "ready") &&
                          !item.canReprocess && (
                            <p className="text-amber-700 text-xs">
                              {getCooldownLabel(
                                item.reprocessAvailableAt,
                                currentTime,
                              ) ?? "현재 이 문서는 재처리할 수 없습니다."}
                            </p>
                          )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {item.status === "ready" && item.gcsPdfPath && (
                          <a
                            href={getResourceLink(item.gcsPdfPath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[#df3326] hover:text-[#c72a1f] hover:bg-red-50 rounded-md font-medium transition-colors cursor-pointer"
                          >
                            문서 보기
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            isEditingExpiry
                              ? setExpiryEdit(null)
                              : openExpiryEdit(item)
                          }
                          disabled={updatingExpiryId != null}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isEditingExpiry ? "취소" : "유효기간 변경"}
                        </button>
                        {(item.status === "failed" ||
                          item.status === "ready") && (
                          <button
                            type="button"
                            onClick={() => confirmReprocess(item.id)}
                            disabled={
                              !item.canReprocess || reprocessingId != null
                            }
                            title={
                              item.canReprocess
                                ? "문서 재처리"
                                : (getCooldownLabel(
                                    item.reprocessAvailableAt,
                                    currentTime,
                                  ) ?? "현재 재처리할 수 없습니다.")
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[#df3326] hover:text-[#c72a1f] hover:bg-red-50 rounded-md font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RefreshIcon
                              className={`w-4 h-4 ${
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
                        <button
                          type="button"
                          onClick={() => confirmDelete(item)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md font-medium shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XIcon className="w-4 h-4" />
                          {deletingId === item.id ? "삭제 중..." : "삭제"}
                        </button>
                      </div>
                    </div>

                    {isEditingExpiry && expiryEdit && (
                      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/70 p-4 space-y-3">
                        <p className="text-sm font-medium text-gray-800">
                          유효기간 변경
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
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
                                          toDatetimeLocalValue(item.expiresAt),
                                      }
                                    : prev,
                                )
                              }
                            />
                            만료 시각 지정
                          </label>
                          <label className="inline-flex items-center gap-2 cursor-pointer">
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
                            />
                            무기한으로 변경
                          </label>
                        </div>
                        {expiryEdit.mode === "date" && (
                          <input
                            type="datetime-local"
                            value={expiryEdit.value}
                            min={toDatetimeLocalValue(
                              new Date().toISOString(),
                            )}
                            onChange={(e) =>
                              setExpiryEdit((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      value: e.target.value,
                                      error: null,
                                    }
                                  : prev,
                              )
                            }
                            className="w-full max-w-md rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#df3326] focus:outline-none focus:ring-1 focus:ring-[#df3326]"
                          />
                        )}
                        {expiryEdit.error && (
                          <p className="text-sm text-red-600">
                            {expiryEdit.error}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSaveExpiry()}
                            disabled={updatingExpiryId === item.id}
                            className="inline-flex items-center rounded-md bg-[#df3326] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#c72a1f] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingExpiryId === item.id
                              ? "저장 중..."
                              : "저장"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpiryEdit(null)}
                            disabled={updatingExpiryId === item.id}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            닫기
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {deleteError && (
            <div className="px-6 py-3 border-t border-gray-200 bg-red-50 text-sm text-red-700">
              {deleteError}
            </div>
          )}
          {reprocessError && (
            <div className="px-6 py-3 border-t border-gray-200 bg-red-50 text-sm text-red-700">
              {reprocessError}
            </div>
          )}
          {expiryError && (
            <div className="px-6 py-3 border-t border-gray-200 bg-red-50 text-sm text-red-700">
              {expiryError}
            </div>
          )}
          {pollingError && (
            <div className="px-6 py-3 border-t border-gray-200 bg-amber-50 text-sm text-amber-800">
              {pollingError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
