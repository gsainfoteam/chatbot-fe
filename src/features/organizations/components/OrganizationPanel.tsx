import { useEffect, useState } from "react";
import { createOrganization } from "../../../api/organizations";
import { canManageOrg } from "../../../api/roles";
import type { Organization } from "../../../api/types";
import { PlusIcon, UsersIcon } from "../../../components/Icons";
import { Button, Dialog } from "../../../components/ui";
import InvitationBanner from "./InvitationBanner";
import MemberManageModal from "./MemberManageModal";
import OrganizationAvatar from "./OrganizationAvatar";

interface OrganizationPanelProps {
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  isGlobalSuperAdmin: boolean;
  selectedOrganizationId: string | "all";
  documentCounts: Record<string, number>;
  totalDocumentCount: number;
  onOrganizationSelect: (organizationId: string | "all") => void;
  onRefresh: () => void;
  onInvitationAccepted: () => void;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function OrganizationPanel({
  organizations,
  loading,
  error,
  isGlobalSuperAdmin,
  selectedOrganizationId,
  documentCounts,
  totalDocumentCount,
  onOrganizationSelect,
  onRefresh,
  onInvitationAccepted,
}: OrganizationPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [managingOrg, setManagingOrg] = useState<Organization | null>(null);

  useEffect(() => {
    if (!managingOrg) return;

    const currentOrganization = organizations.find(
      (organization) => organization.id === managingOrg.id,
    );
    if (
      !currentOrganization ||
      !canManageOrg(currentOrganization.effectiveRole)
    ) {
      setManagingOrg(null);
      return;
    }

    if (currentOrganization !== managingOrg) {
      setManagingOrg(currentOrganization);
    }
  }, [managingOrg, organizations]);

  const handleCreate = async () => {
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim().toLowerCase();

    if (!trimmedName) {
      setFormError("조직 이름을 입력해주세요.");
      return;
    }
    if (!trimmedSlug) {
      setFormError("슬러그를 입력해주세요.");
      return;
    }
    if (!SLUG_PATTERN.test(trimmedSlug)) {
      setFormError(
        "슬러그는 소문자, 숫자, 하이픈만 사용할 수 있습니다. (예: student-team)",
      );
      return;
    }

    setCreating(true);
    setFormError(null);
    try {
      await createOrganization({
        name: trimmedName,
        slug: trimmedSlug,
      });
      setName("");
      setSlug("");
      setShowCreate(false);
      onRefresh();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "조직 생성에 실패했습니다.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <aside
        aria-labelledby="organization-panel-heading"
        className="min-w-0 self-start rounded-xl border border-gray-100 bg-gray-50/80 p-3"
      >
        <div className="flex min-h-9 items-center justify-between gap-3 px-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2
              id="organization-panel-heading"
              className="text-sm font-semibold text-gray-700"
            >
              조직
            </h2>
            {!loading && (
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-400 ring-1 ring-gray-200">
                {organizations.length}
              </span>
            )}
          </div>
          {isGlobalSuperAdmin && (
            <button
              type="button"
              aria-label="새 조직 생성"
              title="새 조직 생성"
              onClick={() => {
                setShowCreate(true);
                setFormError(null);
              }}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-[var(--color-primary)] transition-colors hover:border-red-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/25"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <InvitationBanner onAccepted={onInvitationAccepted} />

        <div className="mt-2 space-y-2">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {loading ? (
            <p className="py-4 text-center text-sm text-gray-500">
              조직 목록 불러오는 중...
            </p>
          ) : organizations.length === 0 ? (
            <div className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              소속된 조직이 없습니다. 초대를 수락하거나 관리자에게 문의해주세요.
            </div>
          ) : (
            <>
              <button
                type="button"
                aria-pressed={selectedOrganizationId === "all"}
                onClick={() => onOrganizationSelect("all")}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/25 ${
                  selectedOrganizationId === "all"
                    ? "border-gray-200 bg-white"
                    : "border-transparent hover:bg-white/80"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-sm font-semibold text-gray-500">
                  *
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                  전체
                </span>
                <span className="text-sm text-gray-400">
                  {totalDocumentCount}
                </span>
              </button>

              {organizations.map((org) => {
                const isSelected = selectedOrganizationId === org.id;
                const canManage = canManageOrg(org.effectiveRole);
                return (
                  <div
                    key={org.id}
                    className={`flex items-center rounded-lg border transition-all ${
                      isSelected
                        ? "border-gray-200 bg-white"
                        : "border-transparent hover:bg-white/80"
                    }`}
                  >
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onOrganizationSelect(org.id)}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/25"
                    >
                      <OrganizationAvatar
                        organizationKey={org.id}
                        organizationName={org.name}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                        {org.name}
                      </span>
                      <span className="text-sm text-gray-400">
                        {documentCounts[org.id] ?? 0}
                      </span>
                    </button>

                    {isSelected && canManage && (
                      <button
                        type="button"
                        aria-label={`${org.name} 멤버 관리`}
                        title={`${org.name} 멤버 관리`}
                        onClick={() => setManagingOrg(org)}
                        className="mr-2 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/25"
                      >
                        <UsersIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

      </aside>

      <Dialog
        open={showCreate && isGlobalSuperAdmin}
        onOpenChange={(nextOpen) => {
          if (creating) return;
          setShowCreate(nextOpen);
          if (!nextOpen) setFormError(null);
        }}
        title="조직 생성"
        description="새 조직의 이름과 URL에 사용할 슬러그를 입력해주세요."
        size="sm"
        closeDisabled={creating}
        bodyClassName="space-y-4"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowCreate(false)}
              disabled={creating}
            >
              취소
            </Button>
            <Button
              onClick={() => void handleCreate()}
              loading={creating}
              loadingText="생성 중..."
            >
              생성
            </Button>
          </>
        }
      >
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-gray-700">
            조직 이름
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="학생팀"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-gray-700">슬러그</span>
          <input
            type="text"
            value={slug}
            onChange={(event) => setSlug(event.target.value.toLowerCase())}
            placeholder="student-team"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25"
          />
        </label>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
      </Dialog>

      {managingOrg && (
        <MemberManageModal
          organization={managingOrg}
          onClose={() => setManagingOrg(null)}
          onMembershipChanged={onRefresh}
        />
      )}
    </>
  );
}
