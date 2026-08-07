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
import LoadingSpinner from "../../components/LoadingSpinner";
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
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);

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

  if (!hasToken) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <LoadingSpinner
          message="권한 확인 중..."
          fullScreen
          className="bg-gray-50/55"
        />
      </div>
    );
  }

  if (isError || !data?.uuid) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">문서 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            조직별 문서를 업로드·관리합니다. PDF 파일은 자동으로 챗봇 답변에
            적용되며, 파일 크기에 따라 1분~30분이 소요됩니다.
          </p>
        </header>

        <InvitationBanner
          onAccepted={() => {
            void fetchOrganizations();
            void fetchDocuments(filterOrganizationId);
          }}
        />

        <OrganizationPanel
          organizations={organizations}
          loading={orgsLoading}
          error={orgsError}
          isGlobalSuperAdmin={isGlobalSuperAdmin}
          onRefresh={() => {
            void fetchOrganizations();
          }}
        />

        <div className="upload-page-layout grid items-start gap-6">
          <DocumentUploadSection
            organizations={organizations}
            selectedOrganizationId={uploadOrganizationId}
            onOrganizationChange={setUploadOrganizationId}
            onUploaded={(doc) => {
              if (
                filterOrganizationId === "all" ||
                doc.ownerOrganization?.id === filterOrganizationId
              ) {
                setUploadedList((prev) => upsertDocument(prev, doc));
              }
            }}
          />

          <DocumentListSection
            documents={uploadedList}
            organizations={organizations}
            filterOrganizationId={filterOrganizationId}
            listLoading={listLoading}
            listError={listError}
            pollingError={pollingError}
            onFilterChange={setFilterOrganizationId}
            onRetryFetch={() => {
              void fetchDocuments(filterOrganizationId);
            }}
            onDocumentsChange={handleDocumentsChange}
          />
        </div>
      </div>
    </main>
  );
}
