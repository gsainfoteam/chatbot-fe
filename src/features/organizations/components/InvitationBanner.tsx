import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  acceptOrganizationInvitation,
  getOrganizationInvitations,
  rejectOrganizationInvitation,
} from "../../../api/organizations";
import type { OrgInvitation } from "../../../api/types";
import { MailIcon } from "../../../components/Icons";
import { Button, ConfirmDialog } from "../../../components/ui";
import { organizationQueryKeys } from "../queryKeys";
import { organizationRoleLabel } from "../utils";

interface InvitationBannerProps {
  onAccepted: () => void;
}

export default function InvitationBanner({
  onAccepted,
}: InvitationBannerProps) {
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
      throw err instanceof Error ? err : new Error("초대 거절에 실패했습니다.");
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
        className="mt-2 border-b border-gray-200 px-1 pb-3"
      >
        <div className="flex items-center gap-2 px-1 py-1.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
            <MailIcon className="h-4 w-4" />
          </span>
          <h2
            id="org-invitation-heading"
            className="text-sm font-semibold text-gray-700"
          >
            받은 초대
          </h2>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            {invitations.length}
          </span>
        </div>
        <div className="mt-1.5 space-y-2">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {invitations.map((invite) => (
            <div
              key={invite.id}
              className="rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {invite.organizationName}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {organizationRoleLabel(invite.role)}(으)로 초대됨 ·{" "}
                  {invite.organizationSlug}
                </p>
              </div>
              <div className="mt-3 flex justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRejectingInvite(invite)}
                  disabled={actingId !== null}
                  className="text-gray-500"
                >
                  거절
                </Button>
                <Button
                  size="sm"
                  onClick={() => void handleAccept(invite.id)}
                  loading={actingId === invite.id}
                  loadingText="처리 중..."
                  disabled={actingId !== null}
                >
                  수락
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
          rejectingInvite ? handleReject(rejectingInvite.id) : Promise.resolve()
        }
      />
    </>
  );
}
