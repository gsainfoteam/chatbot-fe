import type {
  OrgEffectiveRole,
  OrgMembershipStatus,
} from "../../api/types";

export function organizationRoleLabel(role: OrgEffectiveRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "슈퍼 관리자";
    case "MANAGER":
      return "관리자";
    case "MEMBER":
      return "팀원";
  }
}

export function membershipStatusLabel(status: OrgMembershipStatus): string {
  return status === "PENDING" ? "초대 대기" : "활성";
}
