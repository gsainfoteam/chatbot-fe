import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { getToken, useVerifyToken } from "../../api/auth";
import {
  getOrganizationDocuments,
  getOrganizations,
} from "../../api/organizations";
import { isSuperAdmin } from "../../api/roles";
import {
  AdminUploadApiError,
  getManageableUploads,
  getUploadById,
} from "../../api/upload";
import type { DocumentItem, DocumentStatus, Organization } from "../../api/types";
import { UploadIcon } from "../../components/Icons";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Button } from "../../components/ui";
import {
  InvitationBanner,
  OrganizationPanel,
} from "../../features/organizations";
import DocumentListSection from "./components/DocumentListSection";
import DocumentUploadSection from "./components/DocumentUploadSection";
import "./UploadPage.css";

const POLL_INTERVAL_MS = 3000;

function isPollingStatus(status: DocumentStatus): boolean {
  return status === "queued" || status === "processing";
}

function upsertDocument(
  list: DocumentItem[],
  doc: DocumentItem,
): DocumentItem[] {
  const idx = list.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
    return list.map((d, i) => (i === idx ? doc : d));
  }
  return [doc, ...list];
}

function getRelatedOrganizationIds(document: DocumentItem): Set<string> {
  return new Set(
    [
      document.ownerOrganization?.id,
      ...(document.sharedOrganizations ?? []).map(
        (organization) => organization.id,
      ),
    ].filter((id): id is string => Boolean(id)),
  );
}

function getDocumentCounts(documents: DocumentItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  documents.forEach((document) => {
    getRelatedOrganizationIds(document).forEach((organizationId) => {
      counts[organizationId] = (counts[organizationId] ?? 0) + 1;
    });
  });
  return counts;
}

function pickDefaultOrganizationId(organizations: Organization[]): string {
  const defaultOrg = organizations.find((org) => org.isDefault);
  return defaultOrg?.id ?? organizations[0]?.id ?? "";
}

export default function UploadPage() {
  const hasToken = !!getToken();
  const { data, isLoading, isError } = useVerifyToken(hasToken);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgsError, setOrgsError] = useState<string | null>(null);

  const [uploadOrganizationId, setUploadOrganizationId] = useState("");
  const [filterOrganizationId, setFilterOrganizationId] = useState<
    string | "all"
  >("all");

  const [uploadedList, setUploadedList] = useState<DocumentItem[]>([]);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>(
    {},
  );
  const [totalDocumentCount, setTotalDocumentCount] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const uploadedListRef = useRef(uploadedList);

  useEffect(() => {
    uploadedListRef.current = uploadedList;
  }, [uploadedList]);

  const isGlobalSuperAdmin = isSuperAdmin(data?.role);

  const fetchOrganizations = useCallback(async () => {
    setOrgsError(null);
    try {
      setOrgsLoading(true);
      const list = await getOrganizations();
      setOrganizations(list);
      setUploadOrganizationId((prev) => {
        if (prev && list.some((org) => org.id === prev)) return prev;
        return pickDefaultOrganizationId(list);
      });
      setFilterOrganizationId((prev) => {
        if (prev === "all" || list.some((org) => org.id === prev)) return prev;
        return "all";
      });
    } catch (err) {
      setOrgsError(
        err instanceof Error ? err.message : "조직 목록을 불러오지 못했습니다.",
      );
    } finally {
      setOrgsLoading(false);
    }
  }, []);

  const fetchDocuments = useCallback(async (organizationId: string | "all") => {
    setListError(null);
    setListLoading(true);
    try {
      const list =
        organizationId === "all"
          ? await getManageableUploads({ limit: 50, offset: 0 })
          : await getOrganizationDocuments(organizationId);
      setUploadedList(list);
      if (organizationId === "all") {
        setDocumentCounts(getDocumentCounts(list));
        setTotalDocumentCount(list.length);
      } else {
        setDocumentCounts((previous) => ({
          ...previous,
          [organizationId]: list.length,
        }));
      }
    } catch (err) {
      setListError(
        err instanceof Error
          ? err.message
          : "목록을 불러오는데 실패했습니다.",
      );
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasToken || isLoading || isError || !data?.uuid) return;
    void fetchOrganizations();
  }, [hasToken, isLoading, isError, data?.uuid, fetchOrganizations]);

  useEffect(() => {
    if (!hasToken || isLoading || isError || !data?.uuid) return;
    void fetchDocuments(filterOrganizationId);
  }, [
    hasToken,
    isLoading,
    isError,
    data?.uuid,
    filterOrganizationId,
    fetchDocuments,
  ]);

  const pollingIdsKey = useMemo(
    () =>
      uploadedList
        .filter((item) => isPollingStatus(item.status))
        .map((item) => item.id)
        .join(","),
    [uploadedList],
  );

  useEffect(() => {
    if (!pollingIdsKey) return;

    let cancelled = false;
    let timeoutId: number | undefined;
    let controller: AbortController | undefined;

    const poll = async (): Promise<void> => {
      const ids = uploadedListRef.current
        .filter((item) => isPollingStatus(item.status))
        .map((item) => item.id);
      if (ids.length === 0) return;

      controller = new AbortController();
      const results = await Promise.allSettled(
        ids.map((id) => getUploadById(id, controller?.signal)),
      );
      if (cancelled) return;

      const updates = new Map<string, DocumentItem>();
      const missingIds = new Set<string>();
      let hasPollingError = false;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          updates.set(result.value.id, result.value);
          return;
        }
        if (
          result.reason instanceof AdminUploadApiError &&
          result.reason.status === 404
        ) {
          missingIds.add(ids[index]);
          return;
        }
        hasPollingError = true;
      });

      setPollingError(
        hasPollingError
          ? "일부 문서의 처리 상태를 불러오지 못했습니다. 자동으로 다시 시도합니다."
          : null,
      );
      setUploadedList((prev) =>
        prev
          .filter((item) => !missingIds.has(item.id))
          .map((item) => {
            const update = updates.get(item.id);
            return update && isPollingStatus(item.status) ? update : item;
          }),
      );

      if (!cancelled) {
        timeoutId = window.setTimeout(() => {
          void poll();
        }, POLL_INTERVAL_MS);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      controller?.abort();
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [pollingIdsKey]);

  const handleDocumentsChange = useCallback(
    (updater: (prev: DocumentItem[]) => DocumentItem[]) => {
      setUploadedList(updater);
    },
    [],
  );

  const revalidateDocuments = useCallback(async () => {
    try {
      const allDocumentsPromise = getManageableUploads({
        limit: 50,
        offset: 0,
      });
      const visibleDocumentsPromise =
        filterOrganizationId === "all"
          ? allDocumentsPromise
          : getOrganizationDocuments(filterOrganizationId);
      const [allDocuments, visibleDocuments] = await Promise.all([
        allDocumentsPromise,
        visibleDocumentsPromise,
      ]);

      setUploadedList(visibleDocuments);
      setDocumentCounts(getDocumentCounts(allDocuments));
      setTotalDocumentCount(allDocuments.length);
    } catch {
      // API 변경은 이미 성공했으므로 낙관적으로 반영한 화면 상태를 유지합니다.
    }
  }, [filterOrganizationId]);

  const handleDocumentMutation = useCallback(
    (previousDocument: DocumentItem, nextDocument: DocumentItem | null) => {
      const previousOrganizationIds =
        getRelatedOrganizationIds(previousDocument);
      const nextOrganizationIds = nextDocument
        ? getRelatedOrganizationIds(nextDocument)
        : new Set<string>();
      const affectedOrganizationIds = new Set([
        ...previousOrganizationIds,
        ...nextOrganizationIds,
      ]);

      setDocumentCounts((previousCounts) => {
        const nextCounts = { ...previousCounts };
        affectedOrganizationIds.forEach((organizationId) => {
          const delta =
            Number(nextOrganizationIds.has(organizationId)) -
            Number(previousOrganizationIds.has(organizationId));
          if (delta === 0) return;
          nextCounts[organizationId] = Math.max(
            0,
            (nextCounts[organizationId] ?? 0) + delta,
          );
        });
        return nextCounts;
      });

      const wasVisibleInAll = previousDocument.canManage !== false;
      const isVisibleInAll =
        nextDocument != null && nextDocument.canManage !== false;
      const totalDelta = Number(isVisibleInAll) - Number(wasVisibleInAll);
      if (totalDelta !== 0) {
        setTotalDocumentCount((previous) =>
          Math.max(0, previous + totalDelta),
        );
      }

      void revalidateDocuments();
    },
    [revalidateDocuments],
  );

  if (!hasToken) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <LoadingSpinner
          message="권한 확인 중..."
          fullScreen
          className="bg-white/70"
        />
      </div>
    );
  }

  if (isError || !data?.uuid) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">문서 관리</h1>
            <p className="mt-2 text-sm text-gray-600">
              PDF 파일은 자동으로 챗봇 답변에 적용되며, 만료된 문서는 답변에서
              제외됩니다.
            </p>
          </div>
          <Button
            size="lg"
            leftIcon={<UploadIcon className="h-4 w-4" />}
            onClick={() => setUploadModalOpen(true)}
            className="shrink-0 self-start"
          >
            PDF 업로드
          </Button>
        </header>

        <InvitationBanner
          onAccepted={() => {
            void fetchOrganizations();
            void fetchDocuments(filterOrganizationId);
          }}
        />

        <div className="upload-page-layout grid items-start gap-8 lg:gap-10">
          <OrganizationPanel
            organizations={organizations}
            loading={orgsLoading}
            error={orgsError}
            isGlobalSuperAdmin={isGlobalSuperAdmin}
            selectedOrganizationId={filterOrganizationId}
            documentCounts={documentCounts}
            totalDocumentCount={totalDocumentCount}
            onOrganizationSelect={(organizationId) => {
              setFilterOrganizationId(organizationId);
              if (organizationId !== "all") {
                setUploadOrganizationId(organizationId);
              }
            }}
            onRefresh={() => {
              void fetchOrganizations();
            }}
          />

          <DocumentListSection
            documents={uploadedList}
            organizations={organizations}
            filterOrganizationId={filterOrganizationId}
            listLoading={listLoading}
            listError={listError}
            pollingError={pollingError}
            onRetryFetch={() => {
              void fetchDocuments(filterOrganizationId);
            }}
            onDocumentsChange={handleDocumentsChange}
            onDocumentMutation={handleDocumentMutation}
          />
        </div>

        <DocumentUploadSection
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          organizations={organizations}
          selectedOrganizationId={uploadOrganizationId}
          onOrganizationChange={setUploadOrganizationId}
          onUploaded={(doc) => {
            const ownerOrganizationId =
              doc.ownerOrganization?.id ?? uploadOrganizationId;
            setDocumentCounts((previous) => ({
              ...previous,
              [ownerOrganizationId]:
                (previous[ownerOrganizationId] ?? 0) + 1,
            }));
            setTotalDocumentCount((previous) => previous + 1);
            if (
              filterOrganizationId === "all" ||
              ownerOrganizationId === filterOrganizationId
            ) {
              setUploadedList((prev) => upsertDocument(prev, doc));
            }
          }}
        />
      </div>
    </main>
  );
}
