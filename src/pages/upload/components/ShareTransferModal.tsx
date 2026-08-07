import { useState } from "react";
import {
  getUploadById,
  shareUpload,
  transferUpload,
  unshareUpload,
} from "../../../api/upload";
import { canManageOrg } from "../../../api/roles";
import type { DocumentItem, Organization } from "../../../api/types";
import {
  Button,
  ConfirmDialog,
  Dialog,
  Select,
} from "../../../components/ui";

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
          if (mode === "transfer" && !canManageOrg(org.effectiveRole)) {
            return false;
          }
          return true;
        });

  const [targetId, setTargetId] = useState(candidates[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const targetName =
    candidates.find((org) => org.id === targetId)?.name ?? "선택한 조직";

  const executeAction = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "share") {
        const doc = await shareUpload(document.id, targetId);
        onUpdated(doc);
      } else if (mode === "unshare") {
        await unshareUpload(document.id, targetId);
        const refreshed = await getUploadById(document.id);
        onUpdated(refreshed);
      } else {
        const doc = await transferUpload(document.id, targetId);
        onTransferred(doc);
      }
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : mode === "transfer"
            ? "소유권 이양에 실패했습니다."
            : mode === "share"
              ? "문서 공유에 실패했습니다."
              : "공유 해제에 실패했습니다.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!targetId) {
      setError("대상 조직을 선택해주세요.");
      return;
    }

    if (mode === "transfer") {
      setTransferConfirmOpen(true);
      return;
    }

    void executeAction().catch(() => {});
  };

  return (
    <>
      <Dialog
        open
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose();
        }}
        title={modeTitle(mode)}
        description={modeDescription(mode)}
        size="md"
        closeDisabled={loading || transferConfirmOpen}
        bodyClassName="space-y-4"
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={candidates.length === 0}
              loading={loading}
              loadingText="처리 중..."
            >
              {mode === "share" ? "공유" : mode === "unshare" ? "해제" : "이양"}
            </Button>
          </>
        }
      >
        <p className="truncate text-sm font-medium text-gray-800">
          문서: {document.title}
        </p>

        {candidates.length === 0 ? (
          <p className="rounded-md bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
            {mode === "unshare"
              ? "공유된 조직이 없습니다."
              : mode === "transfer"
                ? "관리 권한이 있는 대상 조직이 없습니다."
                : "선택할 수 있는 조직이 없습니다."}
          </p>
        ) : (
          <Select
            label="대상 조직"
            value={targetId}
            onValueChange={setTargetId}
            options={candidates.map((org) => ({
              value: org.id,
              label: org.name,
            }))}
            variant="form"
          />
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </Dialog>

      <ConfirmDialog
        open={transferConfirmOpen}
        onOpenChange={setTransferConfirmOpen}
        title="문서 소유권을 이양할까요?"
        description={`"${document.title}" 문서의 소유권을 "${targetName}"(으)로 이양합니다.\n이양 후에는 출발 조직만 속한 사용자는 이 문서를 관리할 수 없습니다.`}
        confirmLabel="소유권 이양"
        loadingLabel="이양 중..."
        variant="danger"
        fallbackErrorMessage="소유권 이양에 실패했습니다."
        onConfirm={executeAction}
      />
    </>
  );
}
