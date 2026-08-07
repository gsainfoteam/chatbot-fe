import { useState } from "react";
import { createOrganization } from "../../../api/organizations";
import { canManageOrg } from "../../../api/roles";
import type { Organization } from "../../../api/types";
import { Button } from "../../../components/ui";
import { organizationRoleLabel } from "../utils";
import MemberManageModal from "./MemberManageModal";

interface OrganizationPanelProps {
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  isGlobalSuperAdmin: boolean;
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
  onRefresh,
}: OrganizationPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [managingOrg, setManagingOrg] = useState<Organization | null>(null);

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
      await createOrganization({ name: trimmedName, slug: trimmedSlug });
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
    <section
      aria-labelledby="organization-panel-heading"
      className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white"
    >
      <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="organization-panel-heading"
            className="text-lg font-semibold text-gray-900"
          >
            내 조직
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            소속 조직을 확인하고 멤버를 관리합니다.
          </p>
        </div>
        {isGlobalSuperAdmin && (
          <Button
            variant={showCreate ? "secondary" : "primary"}
            size="sm"
            onClick={() => {
              setShowCreate((prev) => !prev);
              setFormError(null);
            }}
            className="shrink-0"
          >
            {showCreate ? "생성 취소" : "조직 생성"}
          </Button>
        )}
      </div>

      <div className="space-y-4 p-5">
        {showCreate && isGlobalSuperAdmin && (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/60 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-700">
                  조직 이름
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="학생팀"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#df3326]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-700">
                  슬러그
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="student-team"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#df3326]"
                />
              </label>
            </div>
            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
            <Button
              onClick={() => void handleCreate()}
              loading={creating}
              loadingText="생성 중..."
            >
              생성
            </Button>
          </div>
        )}

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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => {
              const canManage = canManageOrg(org.effectiveRole);
              return (
                <div
                  key={org.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {org.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {org.slug}
                        {org.isDefault ? " · 기본" : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${roleBadgeClasses(org.effectiveRole)}`}
                    >
                      {organizationRoleLabel(org.effectiveRole)}
                    </span>
                  </div>
                  {canManage && (
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => setManagingOrg(org)}
                      className="mt-3"
                    >
                      멤버 관리
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {managingOrg && (
        <MemberManageModal
          organization={managingOrg}
          onClose={() => setManagingOrg(null)}
        />
      )}
    </section>
  );
}
