import { useQuery } from "@tanstack/react-query";
import { getToken, useVerifyToken } from "../../api/auth";
import {
  getOrganizationInvitations,
  getOrganizations,
} from "../../api/organizations";
import { isSuperAdmin } from "../../api/roles";
import { organizationQueryKeys } from "./queryKeys";

export interface DocumentManagementAccess {
  /** 문서 관리 페이지 진입 및 헤더 버튼 노출 가능 */
  canAccess: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
}

/**
 * 문서 관리 노출/접근:
 * - SUPER_ADMIN: 항상 활성
 * - 그 외 Admin: 소속 조직 1개 이상 또는 PENDING 조직 초대가 있으면 활성
 */
export function useDocumentManagementAccess(): DocumentManagementAccess {
  const hasToken = !!getToken();
  const {
    data: verifyData,
    isLoading: verifyLoading,
    isError: verifyError,
  } = useVerifyToken(hasToken);

  const verified =
    hasToken && !verifyLoading && !verifyError && !!verifyData?.uuid;
  const superAdmin = isSuperAdmin(verifyData?.role);

  const orgContextEnabled = verified && !superAdmin;

  const organizationsQuery = useQuery({
    queryKey: organizationQueryKeys.list(),
    queryFn: getOrganizations,
    enabled: orgContextEnabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const invitationsQuery = useQuery({
    queryKey: organizationQueryKeys.invitations(),
    queryFn: getOrganizationInvitations,
    enabled: orgContextEnabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (!hasToken) {
    return {
      canAccess: false,
      isSuperAdmin: false,
      isLoading: false,
    };
  }

  if (verifyLoading) {
    return {
      canAccess: false,
      isSuperAdmin: false,
      isLoading: true,
    };
  }

  if (!verified) {
    return {
      canAccess: false,
      isSuperAdmin: false,
      isLoading: false,
    };
  }

  if (superAdmin) {
    return {
      canAccess: true,
      isSuperAdmin: true,
      isLoading: false,
    };
  }

  const orgLoading =
    orgContextEnabled &&
    (organizationsQuery.isLoading || invitationsQuery.isLoading);

  if (orgLoading) {
    return {
      canAccess: false,
      isSuperAdmin: false,
      isLoading: true,
    };
  }

  const organizationCount = organizationsQuery.data?.length ?? 0;
  const pendingInviteCount =
    invitationsQuery.data?.filter((item) => item.status === "PENDING").length ??
    0;

  return {
    canAccess: organizationCount > 0 || pendingInviteCount > 0,
    isSuperAdmin: false,
    isLoading: false,
  };
}
