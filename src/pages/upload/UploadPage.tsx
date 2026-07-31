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
import {
  CalendarIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  RefreshIcon,
  TrashIcon,
  UploadIcon,
} from "../../components/Icons";
import {
  formatKoreanDate,
  getOneYearLaterValue,
  getResourceLink,
  getSemesterExpiryPresets,
  parseFutureExpiresAt,
  toDateInputValue,
} from "./utils";
import "./UploadPage.css";

const SUPER_ADMIN = "SUPER_ADMIN";
const MAX_CONCURRENT_UPLOADS = 10;
const POLL_INTERVAL_MS = 3000;

type PendingStatus = "pending" | "uploading" | "success" | "error";
type PendingExpiryPreset =
  | "current-semester"
  | "next-semester"
  | "one-year"
  | "indefinite"
  | "custom";

interface PendingUpload {
  id: string;
  file: File;
  status: PendingStatus;
  error?: string;
  expiresAtInput: string;
  expiryPreset: PendingExpiryPreset;
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
  const [openDocumentMenuId, setOpenDocumentMenuId] = useState<string | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const documentMenuRef = useRef<HTMLDivElement>(null);
  const uploadedListRef = useRef(uploadedList);
  const expiryPresets = useMemo(() => getSemesterExpiryPresets(), []);
  const todayDateValue = useMemo(() => toDateInputValue(new Date()), []);
  const oneYearLaterValue = useMemo(() => getOneYearLaterValue(), []);

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
        expiryPreset: "indefinite",
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
          ? {
              ...item,
              expiresAtInput: value,
              expiryPreset: "custom",
              expiryError: undefined,
            }
          : item,
      ),
    );
  };

  const applyPendingExpiryPreset = (
    id: string,
    preset: PendingExpiryPreset,
  ) => {
    const presetValues: Record<PendingExpiryPreset, string> = {
      "current-semester": expiryPresets.currentSemester.value,
      "next-semester": expiryPresets.nextSemester.value,
      "one-year": oneYearLaterValue,
      indefinite: "",
      custom: todayDateValue,
    };

    setPending((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              expiryPreset: preset,
              expiresAtInput:
                preset === "custom" && item.expiresAtInput
                  ? item.expiresAtInput
                  : presetValues[preset],
              expiryError: undefined,
            }
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
      value: item.expiresAt
        ? toDateInputValue(new Date(item.expiresAt))
        : "",
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
        : `이 문서의 유효기간을 ${formatKoreanDate(nextExpiresAt)}까지로 변경하시겠습니까?`,
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
          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700">
            대기
          </span>
        );
      case "uploading":
        return (
          <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
            업로드 중...
          </span>
        );
      case "success":
        return (
          <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
            전송 완료
          </span>
        );
      case "error":
        return (
          <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
            실패
          </span>
        );
    }
  };

  const expiryOptions: Array<{
    key: PendingExpiryPreset;
    label: string;
  }> = [
    {
      key: "current-semester",
      label: expiryPresets.currentSemester.label,
    },
    { key: "next-semester", label: expiryPresets.nextSemester.label },
    { key: "one-year", label: "1년" },
    { key: "indefinite", label: "무기한" },
    { key: "custom", label: "직접 지정" },
  ];

  const renderExpiryDescription = (item: PendingUpload) => {
    if (item.expiryPreset === "indefinite") {
      return (
        <>
          <strong className="font-bold">무기한</strong>으로 저장됩니다.
        </>
      );
    }
    if (!item.expiresAtInput) return "유효기간을 선택해주세요.";
    return (
      <>
        <strong className="font-bold">
          {formatKoreanDate(item.expiresAtInput)}
        </strong>
        까지 유효
      </>
    );
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">문서 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            PDF를 업로드하면 AI 처리 상태가 자동으로 갱신됩니다. 유효기간을
            지정하지 않으면 무기한으로 저장됩니다. 한 번에 최대{" "}
            {MAX_CONCURRENT_UPLOADS}개, 파일당 최대 {MAX_FILE_SIZE_MB}MB까지
            업로드할 수 있습니다.
          </p>
        </header>

        <div className="upload-page-layout grid items-start gap-6">
          <section
            aria-labelledby="pdf-upload-heading"
            className="overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <div className="border-b border-gray-200 p-6">
              <h2
                id="pdf-upload-heading"
                className="text-xl font-semibold text-gray-900"
              >
                PDF 업로드
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                파일 이름이 제목으로 저장됩니다.
              </p>
            </div>

            <div className="p-6">

            <div
              role="button"
              tabIndex={0}
              aria-label="PDF 파일 선택"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-lg border px-5 py-8 text-center transition-colors ${
                isDragging
                  ? "border-[#df3326] bg-red-50"
                  : "border-gray-300 bg-gray-50/40 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-[#df3326]">
                <UploadIcon className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-medium text-gray-700 sm:text-base">
                클릭하거나 PDF를 드래그하세요
              </p>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                PDF만, 파일당 최대 {MAX_FILE_SIZE_MB}MB · 최대{" "}
                {MAX_CONCURRENT_UPLOADS}개
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 sm:text-base">
                업로드 대기 ({pending.length})
              </h3>

              <div className="mt-3 space-y-3">
                {pending.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 px-5 py-8 text-center text-sm text-gray-500">
                    업로드할 PDF를 선택해주세요.
                  </div>
                ) : (
                  pending.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-lg border border-gray-200 bg-gray-50/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="max-w-full truncate font-medium text-gray-900">
                              {item.file.name}
                            </p>
                            {renderPendingStatusBadge(item.status)}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {(item.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        {item.status !== "uploading" && (
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            className="shrink-0 cursor-pointer text-sm font-medium text-red-500 hover:text-red-700"
                          >
                            제거
                          </button>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {expiryOptions.map((option) => {
                          const isSelected =
                            item.expiryPreset === option.key;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() =>
                                applyPendingExpiryPreset(item.id, option.key)
                              }
                              disabled={item.status === "uploading"}
                              className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                isSelected
                                  ? "border-[#df3326] bg-red-50 text-[#df3326]"
                                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>

                      {item.expiryPreset === "custom" && (
                        <label
                          htmlFor={`pending-expires-at-${item.id}`}
                          className="mt-4 block"
                        >
                          <span className="sr-only">유효기간 직접 지정</span>
                          <input
                            id={`pending-expires-at-${item.id}`}
                            type="date"
                            value={item.expiresAtInput}
                            min={todayDateValue}
                            onChange={(event) =>
                              updatePendingExpiry(item.id, event.target.value)
                            }
                            disabled={item.status === "uploading"}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-all duration-150 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#df3326] disabled:opacity-50"
                          />
                        </label>
                      )}

                      <p className="mt-3 text-sm text-gray-500">
                        {renderExpiryDescription(item)}
                      </p>
                      {item.expiryError && (
                        <p className="mt-2 text-sm text-red-600">
                          {item.expiryError}
                        </p>
                      )}
                      {item.error && (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <p className="text-sm text-red-600">{item.error}</p>
                          <button
                            type="button"
                            onClick={() => handleRetry(item.id)}
                            disabled={isUploading}
                            className="cursor-pointer text-sm font-medium text-[#df3326] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            재시도
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleUploadAll}
              disabled={!hasUploadable}
              className="mt-6 w-full cursor-pointer rounded-md bg-[#df3326] px-6 py-2.5 font-medium text-white transition-all duration-150 hover:bg-[#c72a1f] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading
                ? "업로드 중..."
                : pendingCount > 0
                  ? `업로드 (${pendingCount}개)`
                  : "업로드"}
            </button>

            {limitNotice && (
              <div
                aria-live="polite"
                className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600"
              >
                {limitNotice}
              </div>
            )}
            </div>
          </section>

          <section
            aria-labelledby="document-list-heading"
            className="upload-document-panel flex min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <div className="flex shrink-0 items-start justify-between gap-5 border-b border-gray-200 p-6">
              <div className="min-w-0">
                <h2
                  id="document-list-heading"
                  className="text-xl font-semibold text-gray-900"
                >
                  문서 목록
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  만료된 문서는 목록에 남지만 Chat 검색에서는 제외됩니다.
                </p>
              </div>
              <span className="shrink-0 pt-1 text-sm font-medium text-gray-500">
                총 {uploadedList.length}개
              </span>
            </div>

            <div className="document-list-scroll flex-1 p-4 sm:p-6">
              {(deleteError || reprocessError || expiryError) && (
                <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {deleteError || reprocessError || expiryError}
                </div>
              )}
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
                    onClick={() => {
                      setListLoading(true);
                      fetchList();
                    }}
                    className="cursor-pointer text-sm font-medium text-[#df3326] hover:underline"
                  >
                    다시 시도
                  </button>
                </div>
              ) : uploadedList.length === 0 ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-gray-500">
                  업로드된 문서가 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadedList.map((item) => {
                    const isEditingExpiry = expiryEdit?.id === item.id;
                    const isMenuOpen = openDocumentMenuId === item.id;
                    const canView =
                      item.status === "ready" && item.gcsPdfPath != null;
                    const canRequestReprocess =
                      item.status === "failed" || item.status === "ready";
                    const expiryLabel = item.expiresAt
                      ? formatKoreanDate(item.expiresAt)
                      : "무기한";

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
                                className="absolute right-0 top-full z-30 mt-1.5 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
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
                                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
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
                                    className="flex w-full cursor-not-allowed items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-gray-400"
                                  >
                                    <EyeIcon className="h-[18px] w-[18px] shrink-0" />
                                    보기
                                  </button>
                                )}
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenDocumentMenuId(null);
                                    openExpiryEdit(item);
                                  }}
                                  disabled={updatingExpiryId != null}
                                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <CalendarIcon className="h-[18px] w-[18px] shrink-0" />
                                  유효기간 변경
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenDocumentMenuId(null);
                                    confirmReprocess(item.id);
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
                                          ) ??
                                          "현재 재처리할 수 없습니다.")
                                  }
                                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
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
                                <div className="mx-3 my-1 border-t border-gray-200" />
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenDocumentMenuId(null);
                                    confirmDelete(item);
                                  }}
                                  disabled={deletingId === item.id}
                                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <TrashIcon className="h-[18px] w-[18px] shrink-0" />
                                  {deletingId === item.id
                                    ? "삭제 중..."
                                    : "삭제"}
                                </button>
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
                              <button
                                type="button"
                                onClick={() => void handleSaveExpiry()}
                                disabled={updatingExpiryId === item.id}
                                className="cursor-pointer rounded-md bg-[#df3326] px-4 py-2 text-sm font-medium text-white hover:bg-[#c72a1f] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {updatingExpiryId === item.id
                                  ? "저장 중..."
                                  : "저장"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpiryEdit(null)}
                                disabled={updatingExpiryId === item.id}
                                className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                닫기
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
