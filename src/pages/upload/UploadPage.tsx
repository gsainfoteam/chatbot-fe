import { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { getToken, useVerifyToken } from "../../api/auth";
import {
  uploadPdf,
  deleteUpload,
  getUploadList,
  isPdfFile,
  isWithinSizeLimit,
  MAX_FILE_SIZE_MB,
} from "../../api/upload";
import type { UploadResponse } from "../../api/types";
import LoadingSpinner from "../../components/LoadingSpinner";
import { UploadIcon, XIcon } from "../../components/Icons";
import { getResourceLink } from "./utils";

const SUPER_ADMIN = "SUPER_ADMIN";

export default function UploadPage() {
  const hasToken = !!getToken();
  const { data, isLoading, isError } = useVerifyToken(hasToken);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadedList, setUploadedList] = useState<UploadResponse[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchList = () => {
    setListError(null);
    getUploadList({ limit: 50 })
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
  };

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
  }, [hasToken, isLoading, isError, data?.uuid, data?.role]);

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

  const validateAndSubmit = async () => {
    setValidationError(null);
    setUploadError(null);

    if (!file) {
      setValidationError("PDF 파일을 선택해주세요.");
      return;
    }
    if (!isPdfFile(file)) {
      setValidationError(
        "PDF 파일만 업로드할 수 있습니다. (.pdf 또는 application/pdf)",
      );
      return;
    }
    if (!isWithinSizeLimit(file)) {
      setValidationError(`파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다.`);
      return;
    }

    const titleFromFile = file.name.trim() || "제목 없음";
    try {
      setIsUploading(true);
      await uploadPdf(file, titleFromFile);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      fetchList();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "업로드에 실패했습니다.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    setFile(chosen);
    setValidationError(null);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    setFile(dropped);
    setValidationError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    try {
      setDeletingId(id);
      await deleteUpload(id);
      fetchList();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "삭제에 실패했습니다.";
      setDeleteError(message);
      // 404(이미 삭제됨)인 경우에도 목록에서 제거해 화면이 바로 갱신되도록 함
      if (message === "이미 삭제되었거나 존재하지 않는 파일입니다.") {
        setUploadedList((prev) => prev.filter((item) => item.id !== id));
        setDeleteError(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">파일 업로드</h1>
          <p className="mt-2 text-sm text-gray-600">
            PDF 파일을 선택하면 파일 이름이 제목으로 저장됩니다. (최대{" "}
            {MAX_FILE_SIZE_MB}MB)
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">PDF 업로드</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Drop Zone (단일 PDF) */}
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
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex justify-center">
                  <UploadIcon className="w-12 h-12 text-gray-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-700">
                  {file
                    ? file.name
                    : "클릭하거나 PDF 파일을 여기에 드래그하세요"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PDF만 업로드 가능, 최대 {MAX_FILE_SIZE_MB}MB
                </p>
              </div>
              {file && (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm">
                  <span className="text-gray-700 truncate flex-1 min-w-0">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="ml-3 text-red-600 hover:text-red-700 font-medium shrink-0"
                  >
                    제거
                  </button>
                </div>
              )}
            </div>

            {/* 검증/업로드 에러 */}
            {(validationError || uploadError) && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {validationError || uploadError}
              </div>
            )}

            <button
              type="button"
              onClick={validateAndSubmit}
              disabled={isUploading || !file}
              className="w-full px-6 py-2.5 bg-[#df3326] text-white font-medium rounded-md hover:bg-[#c72a1f] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "업로드 중..." : "업로드"}
            </button>
          </div>
        </div>

        {/* 내가 업로드한 파일 목록 */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              내가 업로드한 파일
            </h2>
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
                className="text-sm font-medium text-[#df3326] hover:underline"
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
              {uploadedList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-6 py-4 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(item.uploadedAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.metadata?.status === "uploaded" &&
                      item.metadata?.gcs_path && (
                        <a
                          href={getResourceLink(item.metadata.gcs_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[#df3326] hover:text-[#c72a1f] hover:bg-red-50 rounded-md font-medium transition-colors"
                        >
                          문서 보기
                        </a>
                      )}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md font-medium shrink-0 disabled:opacity-50"
                    >
                      <XIcon className="w-4 h-4" />
                      {deletingId === item.id ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {deleteError && (
            <div className="px-6 py-3 border-t border-gray-200 bg-red-50 text-sm text-red-700">
              {deleteError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
