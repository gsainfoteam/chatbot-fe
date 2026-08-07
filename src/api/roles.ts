// 전역/조직 역할 헬퍼

import type { OrgEffectiveRole } from "./types";

export const SUPER_ADMIN = "SUPER_ADMIN" as const;

export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === SUPER_ADMIN;
}

export function canManageOrg(
  effectiveRole: OrgEffectiveRole | null | undefined,
): boolean {
  return effectiveRole === "SUPER_ADMIN" || effectiveRole === "MANAGER";
}

export function isOrgMember(
  effectiveRole: OrgEffectiveRole | null | undefined,
): boolean {
  return (
    effectiveRole === "SUPER_ADMIN" ||
    effectiveRole === "MANAGER" ||
    effectiveRole === "MEMBER"
  );
}
