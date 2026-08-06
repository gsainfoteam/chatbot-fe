import { useEffect, useState } from "react";
import {
  getOrganizationMembers,
  inviteOrganizationMember,
  removeOrganizationMember,
  updateOrganizationMemberRole,
} from "../../../api/organizations";
import type { Organization, OrgMemberRole, OrgMembership } from "../../../api/types";
import { XIcon } from "../../../components/Icons";

interface MemberManageModalProps {
  organization: Organization;
  onClose: () => void;
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

function roleLabel(role: OrgMemberRole): string {
  return role === "MANAGER" ? "관리자" : "팀원";
}

function statusLabel(status: OrgMembership["status"]): string {
  return status === "PENDING" ? "초대 대기" : "활성";
}

export default function MemberManageModal({
  organization,
  onClose,
}: MemberManageModalProps) {
  const [members, setMembers] = useState<OrgMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgMemberRole>("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchMembers = async () => {
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
  };

  useEffect(() => {
    void fetchMembers();
  }, [organization.id]);

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
    const label =
      membership.status === "PENDING" ? "초대를 취소" : "멤버를 제거";
    if (!confirm(`${membership.inviteeEmail} ${label}하시겠습니까?`)) return;

    setActingId(membership.id);
    setError(null);
    try {
      await removeOrganizationMember(organization.id, membership.id);
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "제거에 실패했습니다.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-manage-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="member-manage-title"
              className="truncate text-lg font-semibold text-gray-900"
            >
              {organization.name} 멤버 관리
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              이메일로 초대하고 역할을 변경할 수 있습니다.
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

        <div className="space-y-4 overflow-y-auto p-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              멤버 초대
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="name@gm.gist.ac.kr"
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
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as OrgMemberRole)
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#df3326]"
              >
                <option value="MEMBER">팀원</option>
                <option value="MANAGER">관리자</option>
              </select>
              <button
                type="button"
                onClick={() => void handleInvite()}
                disabled={inviteLoading || !inviteEmail.trim()}
                className="cursor-pointer rounded-md bg-[#df3326] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#c72a1f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {inviteLoading ? "초대 중..." : "초대"}
              </button>
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
                      {statusLabel(member.status)}
                      {member.userName ? ` · ${member.userName}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      value={member.role}
                      disabled={actingId === member.id}
                      onChange={(e) =>
                        void handleRoleChange(
                          member,
                          e.target.value as OrgMemberRole,
                        )
                      }
                      className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 disabled:opacity-50"
                    >
                      <option value="MEMBER">{roleLabel("MEMBER")}</option>
                      <option value="MANAGER">{roleLabel("MANAGER")}</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleRemove(member)}
                      disabled={actingId === member.id}
                      className="cursor-pointer rounded-md px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      제거
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
