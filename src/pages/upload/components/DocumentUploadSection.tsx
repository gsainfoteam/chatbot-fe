import { useMemo, useRef, useState } from "react";
import {
  isPdfFile,
  isWithinSizeLimit,
  MAX_FILE_SIZE_MB,
  uploadPdf,
} from "../../../api/upload";
import type { DocumentItem, Organization } from "../../../api/types";
import { UploadIcon } from "../../../components/Icons";
import { Button, Dialog, Select } from "../../../components/ui";
import {
  formatKoreanDate,
  getOneYearLaterValue,
  getSemesterExpiryPresets,
  parseFutureExpiresAt,
  toDateInputValue,
} from "../utils";

const MAX_CONCURRENT_UPLOADS = 10;

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

interface DocumentUploadSectionProps {
  open: boolean;
  organizations: Organization[];
  selectedOrganizationId: string;
  onOpenChange: (open: boolean) => void;
  onOrganizationChange: (organizationId: string) => void;
  onUploaded: (doc: DocumentItem) => void;
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

export default function DocumentUploadSection({
  open,
  organizations,
  selectedOrganizationId,
  onOpenChange,
  onOrganizationChange,
  onUploaded,
}: DocumentUploadSectionProps) {
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const expiryPresets = useMemo(() => getSemesterExpiryPresets(), []);
  const todayDateValue = useMemo(() => toDateInputValue(new Date()), []);
  const oneYearLaterValue = useMemo(() => getOneYearLaterValue(), []);
  const organizationOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.id,
        label: `${org.name}${org.isDefault ? " (기본)" : ""}`,
      })),
    [organizations],
  );

  const canUpload = organizations.length > 0 && !!selectedOrganizationId;
  const pendingCount = pending.filter((p) => p.status === "pending").length;
  const hasUploadable = canUpload && pendingCount > 0 && !isUploading;

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
    if (!canUpload) return;
    const dropped = e.dataTransfer.files;
    if (!dropped || dropped.length === 0) return;
    addFiles(Array.from(dropped));
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
      const doc = await uploadPdf(item.file, title, {
        expiresAt,
        organizationId: selectedOrganizationId,
      });
      onUploaded(doc);
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
    if (items.length === 0 || !selectedOrganizationId) return;

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

  const expiryOptions: Array<{ key: PendingExpiryPreset; label: string }> = [
    { key: "current-semester", label: expiryPresets.currentSemester.label },
    { key: "next-semester", label: expiryPresets.nextSemester.label },
    { key: "one-year", label: "1년" },
    { key: "indefinite", label: "무기한" },
    { key: "custom", label: "직접 지정" },
  ];

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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="PDF 업로드"
      description={`최대 ${MAX_CONCURRENT_UPLOADS}개, 파일당 최대 ${MAX_FILE_SIZE_MB}MB까지 업로드할 수 있습니다.`}
      size="lg"
      closeDisabled={isUploading}
      contentClassName="!max-w-[600px] !rounded-[28px] !border-0 shadow-2xl"
      headerClassName="!items-center !border-b-0 !px-6 !pt-6 !pb-3 sm:!px-10 sm:!pt-9 sm:!pb-5"
      titleClassName="!text-xl !font-bold sm:!text-2xl"
      descriptionClassName="sr-only"
      closeButtonClassName="!flex !h-11 !w-11 !items-center !justify-center !rounded-full !bg-gray-50 !p-0 hover:!bg-gray-100"
      bodyClassName="space-y-6 !px-6 !py-3 sm:!px-10 sm:!pb-6"
      footerClassName="!flex-wrap !border-t-0 !px-6 !pt-2 !pb-6 sm:!flex-nowrap sm:!px-10 sm:!pb-10"
      footer={
        <>
          <span className="mr-auto w-full self-center pb-2 text-sm text-gray-500 sm:w-auto sm:pb-0">
            업로드 대기 {pending.length}개
          </span>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
            className="min-w-24 flex-1 bg-gray-100 active:scale-[0.98] sm:flex-none"
          >
            취소
          </Button>
          <Button
            size="lg"
            onClick={() => {
              const targets = pending.filter((p) => p.status === "pending");
              void runQueue(targets);
            }}
            disabled={!hasUploadable}
            loading={isUploading}
            loadingText="업로드 중..."
            className="min-w-32 flex-1 active:scale-[0.98] sm:flex-none"
          >
            {pendingCount > 0 ? `업로드 (${pendingCount}개)` : "업로드"}
          </Button>
        </>
      }
    >
      <div
          role="button"
          tabIndex={canUpload ? 0 : -1}
          aria-label="PDF 파일 선택"
          aria-disabled={!canUpload}
          onClick={() => {
            if (canUpload) inputRef.current?.click();
          }}
          onKeyDown={(event) => {
            if (!canUpload) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            if (canUpload) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`flex min-h-[190px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-colors sm:min-h-[210px] ${
            !canUpload
              ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
              : isDragging
                ? "cursor-pointer border-[#df3326] bg-red-50"
                : "cursor-pointer border-gray-300 bg-gray-50/40 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            disabled={!canUpload}
            className="hidden"
            onChange={handleFileChange}
          />
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-[#df3326]">
            <UploadIcon className="h-8 w-8" />
          </span>
          <p className="mt-5 text-base font-semibold text-gray-900 sm:text-lg">
            {canUpload
              ? "클릭하거나 PDF를 드래그하세요"
              : "조직에 소속된 후 업로드할 수 있습니다"}
          </p>
          <p className="mt-1.5 text-sm text-gray-400 sm:text-base">
            PDF만, 파일당 최대 {MAX_FILE_SIZE_MB}MB · 최대{" "}
            {MAX_CONCURRENT_UPLOADS}개
          </p>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <span className="shrink-0 text-sm font-semibold text-gray-600 sm:text-base">
          업로드 조직
        </span>
        {organizations.length === 0 ? (
          <p className="text-sm text-gray-500">
            소속 조직이 없어 업로드할 수 없습니다.
          </p>
        ) : (
          <Select
            ariaLabel="업로드 조직"
            value={selectedOrganizationId}
            onValueChange={onOrganizationChange}
            options={organizationOptions}
            variant="form"
            className="w-full sm:w-[220px]"
            triggerClassName="!h-12 !rounded-xl !px-4 !text-base"
          />
        )}
      </section>

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 sm:text-base">
            선택한 파일
          </h3>
          <div className="mt-3 space-y-3">
            {pending.map((item) => (
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
                      <Button
                        variant="dangerLink"
                        size="inline"
                        onClick={() =>
                          setPending((prev) =>
                            prev.filter((p) => p.id !== item.id),
                          )
                        }
                        className="shrink-0"
                      >
                        제거
                      </Button>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {expiryOptions.map((option) => {
                      const isSelected = item.expiryPreset === option.key;
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
                      <Button
                        variant="link"
                        size="inline"
                        onClick={() => handleRetry(item.id)}
                        disabled={isUploading}
                      >
                        재시도
                      </Button>
                    </div>
                  )}
                </article>
            ))}
          </div>
        </div>
      )}

      {limitNotice && (
        <div
          aria-live="polite"
          className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600"
        >
          {limitNotice}
        </div>
      )}
    </Dialog>
  );
}
