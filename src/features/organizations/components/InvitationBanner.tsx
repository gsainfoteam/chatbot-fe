import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  acceptOrganizationInvitation,
  getOrganizationInvitations,
  rejectOrganizationInvitation,
} from "../../../api/organizations";
import type { OrgInvitation } from "../../../api/types";
import { Button, ConfirmDialog } from "../../../components/ui";
import { organizationQueryKeys } from "../queryKeys";
import { organizationRoleLabel } from "../utils";

interface InvitationBannerProps {
  onAccepted: () => void;
}

export default function InvitationBanner({ onAccepted }: InvitationBannerProps) {
  const queryClient = useQueryClient();
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingInvite, setRejectingInvite] = useState<OrgInvitation | null>(
    null,
  );

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
      await queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.all,
      });
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
    setActingId(membershipId);
    setError(null);
    try {
      await rejectOrganizationInvitation(membershipId);
      setInvitations((prev) => prev.filter((item) => item.id !== membershipId));
      await queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.all,
      });
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error("초대 거절에 실패했습니다.");
    } finally {
      setActingId(null);
    }
  };

  if (loading || (invitations.length === 0 && !error)) {
    return null;
  }

  return (
    <>
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
                  {invite.organizationSlug} · {organizationRoleLabel(invite.role)}로 초대됨
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  onClick={() => void handleAccept(invite.id)}
                  loading={actingId === invite.id}
                  loadingText="처리 중..."
                  disabled={actingId !== null}
                >
                  수락
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRejectingInvite(invite)}
                  disabled={actingId !== null}
                >
                  거절
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ConfirmDialog
        open={rejectingInvite !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setRejectingInvite(null);
        }}
        title="조직 초대를 거절할까요?"
        description={
          rejectingInvite
            ? `${rejectingInvite.organizationName} 조직의 초대를 거절합니다.`
            : ""
        }
        confirmLabel="초대 거절"
        loadingLabel="거절 중..."
        variant="danger"
        fallbackErrorMessage="초대 거절에 실패했습니다."
        onConfirm={() =>
          rejectingInvite
            ? handleReject(rejectingInvite.id)
            : Promise.resolve()
        }
      />
    </>
  );
}
