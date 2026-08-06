import { useState } from "react";
import {
  shareUpload,
  transferUpload,
  unshareUpload,
} from "../../../api/upload";
import type { DocumentItem, Organization } from "../../../api/types";
import { XIcon } from "../../../components/Icons";

type Mode = "share" | "unshare" | "transfer";

interface ShareTransferModalProps {
  document: DocumentItem;
  organizations: Organization[];
  mode: Mode;
  onClose: () => void;
  onUpdated: (doc: DocumentItem) => void;
  onTransferred: (doc: DocumentItem) => void;
}

function modeTitle(mode: Mode): string {
  switch (mode) {
    case "share":
      return "다른 조직에 공유";
    case "unshare":
      return "공유 해제";
    case "transfer":
      return "소유권 이양";
  }
}

function modeDescription(mode: Mode): string {
  switch (mode) {
    case "share":
      return "선택한 조직이 이 문서를 조회할 수 있습니다. 소유권은 유지됩니다.";
    case "unshare":
      return "선택한 조직의 조회 권한을 해제합니다.";
    case "transfer":
      return "소유권을 대상 조직으로 넘깁니다. 양쪽 관리자 또는 슈퍼 관리자 권한이 필요합니다.";
  }
}

export default function ShareTransferModal({
  document,
  organizations,
  mode,
  onClose,
  onUpdated,
  onTransferred,
}: ShareTransferModalProps) {
  const ownerId = document.ownerOrganization?.id;
  const sharedIds = new Set(
    (document.sharedOrganizations ?? []).map((org) => org.id),
  );

  const candidates =
    mode === "unshare"
      ? (document.sharedOrganizations ?? [])
      : organizations.filter((org) => {
          if (org.id === ownerId) return false;
          if (mode === "share" && sharedIds.has(org.id)) return false;
          return true;
        });

  const [targetId, setTargetId] = useState(candidates[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!targetId) {
      setError("대상 조직을 선택해주세요.");
      return;
    }

    if (mode === "transfer") {
      const targetName =
        candidates.find((org) => org.id === targetId)?.name ?? "선택한 조직";
      const confirmed = window.confirm(
        `"${document.title}" 문서의 소유권을 "${targetName}"(으)로 이양하시겠습니까?\n이양 후에는 출발 조직만 속한 사용자는 이 문서를 관리할 수 없습니다.`,
      );
      if (!confirmed) return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === "share") {
        const doc = await shareUpload(document.id, targetId);
        onUpdated(doc);
      } else if (mode === "unshare") {
        const doc = await unshareUpload(document.id, targetId);
        onUpdated(doc);
      } else {
        const doc = await transferUpload(document.id, targetId);
        onTransferred(doc);
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === "transfer"
            ? "소유권 이양에 실패했습니다."
            : mode === "share"
              ? "문서 공유에 실패했습니다."
              : "공유 해제에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-transfer-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <h2
              id="share-transfer-title"
              className="text-lg font-semibold text-gray-900"
            >
              {modeTitle(mode)}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {modeDescription(mode)}
            </p>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="truncate text-sm font-medium text-gray-800">
            문서: {document.title}
          </p>

          {candidates.length === 0 ? (
            <p className="rounded-md bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
              {mode === "unshare"
                ? "공유된 조직이 없습니다."
                : "선택할 수 있는 조직이 없습니다."}
            </p>
          ) : (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-700">
                대상 조직
              </span>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#df3326]"
              >
                {candidates.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading || candidates.length === 0}
              className="cursor-pointer rounded-md bg-[#df3326] px-4 py-2 text-sm font-medium text-white hover:bg-[#c72a1f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "처리 중..."
                : mode === "share"
                  ? "공유"
                  : mode === "unshare"
                    ? "해제"
                    : "이양"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
