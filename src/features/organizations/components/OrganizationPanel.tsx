import { useEffect, useState } from "react";
import { createOrganization } from "../../../api/organizations";
import { canManageOrg } from "../../../api/roles";
import type { Organization } from "../../../api/types";
import { Button, Dialog } from "../../../components/ui";
import { organizationRoleLabel } from "../utils";
import MemberManageModal from "./MemberManageModal";
import OrganizationAvatar from "./OrganizationAvatar";
import {
  loadOrganizationAvatarPresets,
  ORGANIZATION_AVATAR_PRESETS,
  saveOrganizationAvatarPresets,
  type OrganizationAvatarPresetId,
} from "./organizationAvatarPresets";

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
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function roleBadgeClasses(role: Organization["effectiveRole"]): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "border-red-100 bg-red-50 text-red-700";
    case "MANAGER":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "MEMBER":
      return "border-gray-200 bg-gray-100 text-gray-700";
  }
}

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
}: OrganizationPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [managingOrg, setManagingOrg] = useState<Organization | null>(null);
  const [selectedAvatarPresetId, setSelectedAvatarPresetId] =
    useState<OrganizationAvatarPresetId>("campus-red");
  const [avatarPresets, setAvatarPresets] = useState(
    loadOrganizationAvatarPresets,
  );

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
      const createdOrganization = await createOrganization({
        name: trimmedName,
        slug: trimmedSlug,
      });
      const nextAvatarPresets = {
        ...avatarPresets,
        [createdOrganization.id]: selectedAvatarPresetId,
      };
      setAvatarPresets(nextAvatarPresets);
      saveOrganizationAvatarPresets(nextAvatarPresets);
      setName("");
      setSlug("");
      setSelectedAvatarPresetId("campus-red");
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

  const selectedOrganization = organizations.find(
    (organization) => organization.id === selectedOrganizationId,
  );

  return (
    <>
      <aside
        aria-labelledby="organization-panel-heading"
        className="min-w-0 self-start lg:pt-3"
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="organization-panel-heading"
            className="text-sm font-semibold text-gray-500"
          >
            조직
          </h2>
          {isGlobalSuperAdmin && (
            <Button
              variant="dangerLink"
              size="inline"
              onClick={() => {
                setShowCreate(true);
                setFormError(null);
              }}
            >
              + 생성
            </Button>
          )}
        </div>

        <div className="mt-5 space-y-2">
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
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/25 ${
                  selectedOrganizationId === "all"
                    ? "border-gray-200 bg-white"
                    : "border-transparent hover:bg-gray-50"
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
                return (
                  <button
                    type="button"
                    key={org.id}
                    aria-pressed={isSelected}
                    onClick={() => onOrganizationSelect(org.id)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/25 ${
                      isSelected
                        ? "border-gray-200 bg-white"
                        : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <OrganizationAvatar
                      organizationKey={org.id}
                      organizationName={org.name}
                      presetId={avatarPresets[org.id]}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                      {org.name}
                    </span>
                    <span className="text-sm text-gray-400">
                      {documentCounts[org.id] ?? 0}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {selectedOrganization && (
          <div className="mt-6 border-t border-gray-200 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-gray-900">
                {selectedOrganization.name}
              </p>
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-medium ${roleBadgeClasses(selectedOrganization.effectiveRole)}`}
              >
                {organizationRoleLabel(selectedOrganization.effectiveRole)}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {selectedOrganization.slug}
              {selectedOrganization.isDefault ? " · 기본" : ""}
            </p>
            {canManageOrg(selectedOrganization.effectiveRole) && (
              <Button
                variant="dangerLink"
                size="inline"
                onClick={() => setManagingOrg(selectedOrganization)}
                className="mt-4"
              >
                멤버 관리 →
              </Button>
            )}
          </div>
        )}
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
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-gray-700">
            조직 이미지
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {ORGANIZATION_AVATAR_PRESETS.map((preset) => {
              const isSelected = selectedAvatarPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedAvatarPresetId(preset.id)}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border bg-white px-2 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/25 ${
                    isSelected
                      ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <OrganizationAvatar
                    organizationKey={preset.id}
                    organizationName="미리보기"
                    presetId={preset.id}
                    className="h-11 w-11"
                    iconClassName="h-5 w-5"
                  />
                  <span className="text-xs font-medium text-gray-600">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
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
