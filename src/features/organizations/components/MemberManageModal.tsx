import { useCallback, useEffect, useState } from "react";
import {
  getOrganizationMembers,
  inviteOrganizationMember,
  removeOrganizationMember,
  updateOrganizationMemberRole,
} from "../../../api/organizations";
import type {
  Organization,
  OrgMemberRole,
  OrgMembership,
} from "../../../api/types";
import {
  Button,
  ConfirmDialog,
  Dialog,
  Select,
  type SelectOption,
} from "../../../components/ui";
import { membershipStatusLabel } from "../utils";

interface MemberManageModalProps {
  organization: Organization;
  onClose: () => void;
  onMembershipChanged: () => void;
}

function validateEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: "이메일을 입력해주세요." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: "유효한 이메일 형식이 아닙니다." };
  }
  return { isValid: true };
}

const MEMBER_ROLE_OPTIONS: SelectOption[] = [
  { value: "MEMBER", label: "팀원" },
  { value: "MANAGER", label: "관리자" },
];

export default function MemberManageModal({
  organization,
  onClose,
  onMembershipChanged,
}: MemberManageModalProps) {
  const [members, setMembers] = useState<OrgMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgMemberRole>("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<OrgMembership | null>(
    null,
  );

  const fetchMembers = useCallback(async () => {
    setError(null);
    try {
      setLoading(true);
      const list = await getOrganizationMembers(organization.id);
      setMembers(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "멤버 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [organization.id]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async () => {
    const validation = validateEmail(inviteEmail);
    if (!validation.isValid) {
      setError(validation.error ?? "유효하지 않은 이메일입니다.");
      return;
    }

    setInviteLoading(true);
    setError(null);
    try {
      await inviteOrganizationMember(organization.id, {
        inviteeEmail: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      setInviteEmail("");
      setInviteRole("MEMBER");
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "초대에 실패했습니다.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (
    membership: OrgMembership,
    role: OrgMemberRole,
  ) => {
    if (membership.role === role) return;
    setActingId(membership.id);
    setError(null);
    try {
      await updateOrganizationMemberRole(organization.id, membership.id, {
        role,
      });
      onMembershipChanged();
      await fetchMembers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "역할 변경에 실패했습니다.",
      );
    } finally {
      setActingId(null);
    }
  };

  const handleRemove = async (membership: OrgMembership) => {
    setActingId(membership.id);
    setError(null);
    try {
      await removeOrganizationMember(organization.id, membership.id);
      onMembershipChanged();
      await fetchMembers();
    } catch (err) {
      throw err instanceof Error ? err : new Error("제거에 실패했습니다.");
    } finally {
      setActingId(null);
    }
  };

  const isPendingRemoval = memberToRemove?.status === "PENDING";

  return (
    <>
      <Dialog
        open
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose();
        }}
        title={`${organization.name} 멤버 관리`}
        description="이메일로 초대하고 역할을 변경할 수 있습니다."
        size="lg"
        closeDisabled={
          inviteLoading || actingId !== null || memberToRemove !== null
        }
        bodyClassName="space-y-4"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            멤버 초대
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              placeholder="name@gist.ac.kr"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleInvite();
                }
              }}
              className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#df3326]"
            />
            <Select
              value={inviteRole}
              onValueChange={(value) => setInviteRole(value as OrgMemberRole)}
              options={MEMBER_ROLE_OPTIONS}
              ariaLabel="초대할 멤버 역할"
              width="full"
              variant="form"
              className="sm:w-[120px]"
            />
            <Button
              onClick={() => void handleInvite()}
              disabled={inviteLoading || !inviteEmail.trim()}
              loading={inviteLoading}
              loadingText="초대 중..."
            >
              초대
            </Button>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-6 text-center text-sm text-gray-500">
            멤버 목록 불러오는 중...
          </p>
        ) : members.length === 0 ? (
          <div className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            초대된 멤버가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {member.inviteeEmail}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {membershipStatusLabel(member.status)}
                    {member.memberName ? ` · ${member.memberName}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Select
                    value={member.role}
                    disabled={actingId === member.id}
                    onValueChange={(value) =>
                      void handleRoleChange(
                        member,
                        value as OrgMemberRole,
                      )
                    }
                    options={MEMBER_ROLE_OPTIONS}
                    ariaLabel={`${member.inviteeEmail} 역할`}
                    width="sm"
                    variant="form"
                    size="sm"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setMemberToRemove(member)}
                    disabled={actingId === member.id}
                  >
                    제거
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={memberToRemove !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setMemberToRemove(null);
        }}
        title={isPendingRemoval ? "초대를 취소할까요?" : "멤버를 제거할까요?"}
        description={
          memberToRemove
            ? isPendingRemoval
              ? `${memberToRemove.inviteeEmail}에게 보낸 조직 초대를 취소합니다.`
              : `${memberToRemove.inviteeEmail}을(를) 조직에서 제거합니다.`
            : ""
        }
        confirmLabel={isPendingRemoval ? "초대 취소" : "멤버 제거"}
        loadingLabel={isPendingRemoval ? "취소 중..." : "제거 중..."}
        variant="danger"
        fallbackErrorMessage={
          isPendingRemoval ? "초대 취소에 실패했습니다." : "멤버 제거에 실패했습니다."
        }
        onConfirm={() =>
          memberToRemove ? handleRemove(memberToRemove) : Promise.resolve()
        }
      />
    </>
  );
}
