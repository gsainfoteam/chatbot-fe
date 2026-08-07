// 조직 기반 문서 관리 API

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "./client";
import type {
  CreateOrganizationRequest,
  DocumentItem,
  InviteOrgMemberRequest,
  Organization,
  OrgInvitation,
  OrgMembership,
  UpdateOrgMemberRoleRequest,
} from "./types";

function unwrap<T>(
  response: { success: boolean; data?: T; error?: string },
  fallback: string,
): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.error || fallback);
  }
  return response.data;
}

/** POST /api/v1/admin/organizations — SUPER_ADMIN만 */
export async function createOrganization(
  request: CreateOrganizationRequest,
): Promise<Organization> {
  const response = await apiPost<Organization>(
    "/v1/admin/organizations",
    request,
  );
  return unwrap(response, "조직 생성에 실패했습니다.");
}

/** GET /api/v1/admin/organizations — 내가 접근 가능한 조직 */
export async function getOrganizations(): Promise<Organization[]> {
  const response = await apiGet<Organization[]>("/v1/admin/organizations");
  if (!response.success) {
    throw new Error(response.error || "조직 목록을 불러오는데 실패했습니다.");
  }
  return Array.isArray(response.data) ? response.data : [];
}

/** GET /api/v1/admin/organizations/:id/members — MANAGER */
export async function getOrganizationMembers(
  organizationId: string,
): Promise<OrgMembership[]> {
  const response = await apiGet<OrgMembership[]>(
    `/v1/admin/organizations/${organizationId}/members`,
  );
  if (!response.success) {
    throw new Error(response.error || "멤버 목록을 불러오는데 실패했습니다.");
  }
  return Array.isArray(response.data) ? response.data : [];
}

/** POST /api/v1/admin/organizations/:id/members — MANAGER */
export async function inviteOrganizationMember(
  organizationId: string,
  request: InviteOrgMemberRequest,
): Promise<OrgMembership> {
  const response = await apiPost<OrgMembership>(
    `/v1/admin/organizations/${organizationId}/members`,
    request,
  );
  return unwrap(response, "멤버 초대에 실패했습니다.");
}

/** PATCH /api/v1/admin/organizations/:id/members/:membershipId — MANAGER */
export async function updateOrganizationMemberRole(
  organizationId: string,
  membershipId: string,
  request: UpdateOrgMemberRoleRequest,
): Promise<OrgMembership> {
  const response = await apiPatch<OrgMembership>(
    `/v1/admin/organizations/${organizationId}/members/${membershipId}`,
    request,
  );
  return unwrap(response, "역할 변경에 실패했습니다.");
}

/** DELETE /api/v1/admin/organizations/:id/members/:membershipId — MANAGER */
export async function removeOrganizationMember(
  organizationId: string,
  membershipId: string,
): Promise<void> {
  const response = await apiDelete<unknown>(
    `/v1/admin/organizations/${organizationId}/members/${membershipId}`,
  );
  if (!response.success) {
    throw new Error(response.error || "멤버 제거에 실패했습니다.");
  }
}

/** GET /api/v1/admin/organization-invitations */
export async function getOrganizationInvitations(): Promise<OrgInvitation[]> {
  const response = await apiGet<OrgInvitation[]>(
    "/v1/admin/organization-invitations",
  );
  if (!response.success) {
    throw new Error(response.error || "초대 목록을 불러오는데 실패했습니다.");
  }
  return Array.isArray(response.data) ? response.data : [];
}

/** POST /api/v1/admin/organization-invitations/:membershipId/accept */
export async function acceptOrganizationInvitation(
  membershipId: string,
): Promise<OrgMembership> {
  const response = await apiPost<OrgMembership>(
    `/v1/admin/organization-invitations/${membershipId}/accept`,
  );
  return unwrap(response, "초대 수락에 실패했습니다.");
}

/** DELETE /api/v1/admin/organization-invitations/:membershipId */
export async function rejectOrganizationInvitation(
  membershipId: string,
): Promise<void> {
  const response = await apiDelete<unknown>(
    `/v1/admin/organization-invitations/${membershipId}`,
  );
  if (!response.success) {
    throw new Error(response.error || "초대 거절에 실패했습니다.");
  }
}

/** GET /api/v1/admin/organizations/:id/documents */
export async function getOrganizationDocuments(
  organizationId: string,
): Promise<DocumentItem[]> {
  const response = await apiGet<DocumentItem[]>(
    `/v1/admin/organizations/${organizationId}/documents`,
  );
  if (!response.success) {
    throw new Error(response.error || "조직 문서를 불러오는데 실패했습니다.");
  }
  return Array.isArray(response.data) ? response.data : [];
}
