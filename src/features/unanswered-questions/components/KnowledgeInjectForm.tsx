import { useRef, useState } from "react";
import {
  isPdfFile,
  isWithinSizeLimit,
  MAX_FILE_SIZE_MB,
} from "../../../api/upload";
import { UploadIcon } from "../../../components/Icons";
import { Button } from "../../../components/ui";
import type { KnowledgeInjectType } from "../types";
import { formatFileSize } from "../utils";

interface KnowledgeInjectFormProps {
  submitting: boolean;
  disabled?: boolean;
  onSubmitText: (text: string) => Promise<void>;
  onSubmitPdf: (file: File) => Promise<void>;
}

function validatePdfFile(file: File): string | null {
  if (!isPdfFile(file)) {
    return "PDF 파일만 업로드할 수 있습니다.";
  }
  if (!isWithinSizeLimit(file)) {
    return `파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다.`;
  }
  return null;
}

export default function KnowledgeInjectForm({
  submitting,
  disabled = false,
  onSubmitText,
  onSubmitPdf,
}: KnowledgeInjectFormProps) {
  const [tab, setTab] = useState<KnowledgeInjectType>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSubmitText = !disabled && !submitting && text.trim().length > 0;
  const canSubmitPdf = !disabled && !submitting && file != null && !fileError;

  const applyFile = (nextFile: File | null) => {
    if (!nextFile) {
      setFile(null);
      setFileError(null);
      return;
    }
    const error = validatePdfFile(nextFile);
    setFile(nextFile);
    setFileError(error);
    setFormError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0] ?? null;
    applyFile(chosen);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled || submitting) return;
    const dropped = event.dataTransfer.files?.[0] ?? null;
    applyFile(dropped);
  };

  const handleSubmitText = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setFormError("지식을 입력해주세요.");
      return;
    }
    setFormError(null);
    try {
      await onSubmitText(trimmed);
      setText("");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "지식 등록에 실패했습니다.",
      );
    }
  };

  const handleSubmitPdf = async () => {
    if (!file) {
      setFormError("PDF 파일을 선택해주세요.");
      return;
    }
    const error = validatePdfFile(file);
    if (error) {
      setFileError(error);
      return;
    }
    setFormError(null);
    try {
      await onSubmitPdf(file);
      setFile(null);
      setFileError(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "PDF 등록에 실패했습니다.",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="지식 주입 방식"
        className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "text"}
          disabled={disabled || submitting}
          onClick={() => {
            setTab("text");
            setFormError(null);
          }}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === "text"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          텍스트
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "pdf"}
          disabled={disabled || submitting}
          onClick={() => {
            setTab("pdf");
            setFormError(null);
          }}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === "pdf"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          PDF
        </button>
      </div>

      {tab === "text" ? (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">
              지식 내용
            </span>
            <textarea
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setFormError(null);
              }}
              disabled={disabled || submitting}
              rows={7}
              placeholder="이 질문에 답할 수 있는 지식을 입력하세요."
              className="w-full resize-y rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[#df3326] disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </label>
          <Button
            onClick={() => {
              void handleSubmitText();
            }}
            disabled={!canSubmitText}
            loading={submitting && tab === "text"}
            loadingText="등록 중..."
            className="w-full active:scale-[0.98]"
          >
            텍스트로 지식 등록
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            role="button"
            tabIndex={disabled || submitting ? -1 : 0}
            aria-label="PDF 파일 선택"
            aria-disabled={disabled || submitting}
            onClick={() => {
              if (!disabled && !submitting) inputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (disabled || submitting) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDrop={handleDrop}
            onDragOver={(event) => {
              event.preventDefault();
              if (!disabled && !submitting) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`flex min-h-[155px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-5 text-center transition-colors ${
              disabled || submitting
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
              disabled={disabled || submitting}
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#df3326]">
              <UploadIcon className="h-6 w-6" />
            </span>
            <p className="mt-3.5 text-sm font-semibold text-gray-900">
              PDF를 선택하거나 여기에 놓으세요
            </p>
            <p className="mt-1 text-xs text-gray-500">
              파일당 최대 {MAX_FILE_SIZE_MB}MB · 네트워크 업로드 없이 검증만
              수행합니다
            </p>
          </div>

          {file && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm">
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="mt-1 text-xs text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>
          )}

          {fileError && (
            <p role="alert" className="text-sm text-red-600">
              {fileError}
            </p>
          )}

          <Button
            onClick={() => {
              void handleSubmitPdf();
            }}
            disabled={!canSubmitPdf}
            loading={submitting && tab === "pdf"}
            loadingText="등록 중..."
            className="w-full active:scale-[0.98]"
          >
            PDF로 지식 등록
          </Button>
        </div>
      )}

      {formError && (
        <p
          role="alert"
          className="whitespace-pre-line rounded-lg border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          {formError}
        </p>
      )}
    </div>
  );
}
