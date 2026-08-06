import { useEffect, useState } from "react";
import {
  acceptOrganizationInvitation,
  getOrganizationInvitations,
  rejectOrganizationInvitation,
} from "../../../api/organizations";
import type { OrgInvitation } from "../../../api/types";

interface InvitationBannerProps {
  onAccepted: () => void;
}

function roleLabel(role: OrgInvitation["role"]): string {
  return role === "MANAGER" ? "관리자" : "팀원";
}

export default function InvitationBanner({ onAccepted }: InvitationBannerProps) {
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setError(null);
    try {
      setLoading(true);
      const list = await getOrganizationInvitations();
      setInvitations(list.filter((item) => item.status === "PENDING"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "초대 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInvitations();
  }, []);

  const handleAccept = async (membershipId: string) => {
    setActingId(membershipId);
    setError(null);
    try {
      await acceptOrganizationInvitation(membershipId);
      setInvitations((prev) => prev.filter((item) => item.id !== membershipId));
      onAccepted();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "초대 수락에 실패했습니다.",
      );
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (membershipId: string) => {
    if (!confirm("이 초대를 거절하시겠습니까?")) return;
    setActingId(membershipId);
    setError(null);
    try {
      await rejectOrganizationInvitation(membershipId);
      setInvitations((prev) => prev.filter((item) => item.id !== membershipId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "초대 거절에 실패했습니다.",
      );
    } finally {
      setActingId(null);
    }
  };

  if (loading || (invitations.length === 0 && !error)) {
    return null;
  }

  return (
    <section
      aria-labelledby="org-invitation-heading"
      className="mb-6 overflow-hidden rounded-lg border border-amber-200 bg-amber-50"
    >
      <div className="border-b border-amber-200 px-5 py-4">
        <h2
          id="org-invitation-heading"
          className="text-base font-semibold text-amber-950"
        >
          조직 초대
        </h2>
        <p className="mt-1 text-sm text-amber-800">
          받은 초대를 수락하거나 거절할 수 있습니다.
        </p>
      </div>
      <div className="space-y-3 p-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {invitations.map((invite) => (
          <div
            key={invite.id}
            className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">
                {invite.organizationName}
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                {invite.organizationSlug} · {roleLabel(invite.role)}로 초대됨
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => void handleAccept(invite.id)}
                disabled={actingId === invite.id}
                className="cursor-pointer rounded-md bg-[#df3326] px-3 py-2 text-sm font-medium text-white hover:bg-[#c72a1f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actingId === invite.id ? "처리 중..." : "수락"}
              </button>
              <button
                type="button"
                onClick={() => void handleReject(invite.id)}
                disabled={actingId === invite.id}
                className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                거절
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
