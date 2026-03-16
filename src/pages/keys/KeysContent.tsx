import { useRef, useState, useEffect } from "react";
import {
  getWidgetKeys,
  createWidgetKey,
  addDomainToWidgetKey,
  removeDomainFromWidgetKey,
  addAppIdToWidgetKey,
  removeAppIdFromWidgetKey,
  revokeWidgetKey,
  inviteCollaborator,
  getCollaborators,
  removeCollaborator,
} from "../../api/widgetKeys";
import type { CollaboratorResponse } from "../../api/types";

type WidgetKey = {
  id: string;
  name: string;
  widgetKey: string;
  createdAt: string;
  domains: string[];
  appIds: string[];
  status?: "ACTIVE" | "REVOKED";
  /** secretKey === "***" 이면 공유받은 키 */
  isShared?: boolean;
};

type ColorSettings = {
  primary: string;
  button: string;
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  userMessageBg: string;
  assistantMessageBg: string;
};

type LayoutSettings = {
  position: "right" | "left";
  offset: number;
  width: number;
  height: number;
  theme: "light" | "dark";
};

function validateEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: "이메일을 입력해주세요." };
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return { isValid: false, error: "유효한 이메일 형식이 아닙니다." };
  }
  return { isValid: true };
}

function validateDomain(domain: string): { isValid: boolean; error?: string } {
  const trimmed = domain.trim();

  if (!trimmed) {
    return { isValid: false, error: "도메인을 입력해주세요." };
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return {
      isValid: false,
      error: "프로토콜(http://, https://)은 포함하지 마세요.",
    };
  }
  if (trimmed.includes(":")) {
    return {
      isValid: false,
      error: "포트 번호는 포함하지 마세요.",
    };
  }
  if (trimmed.includes("/")) {
    return {
      isValid: false,
      error: "경로는 포함하지 마세요.",
    };
  }
  if (trimmed === "localhost") {
    return { isValid: true };
  }

  // 와일드카드 도메인 패턴: *.example.com
  const wildcardPattern =
    /^\*\.([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (wildcardPattern.test(trimmed)) {
    return { isValid: true };
  }

  // 일반 도메인 패턴: example.com, sub.example.com 등
  const domainPattern =
    /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (domainPattern.test(trimmed)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: "유효한 도메인 형식이 아닙니다. (예: example.com, *.example.com)",
  };
}

function validateAppId(appId: string): { isValid: boolean; error?: string } {
  const trimmed = appId.trim();
  if (!trimmed) {
    return { isValid: false, error: "앱 ID를 입력해주세요." };
  }
  // Android applicationId / iOS bundle identifier: at least one dot (e.g. com.company.myapp)
  const segment = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;
  if (!segment.test(trimmed)) {
    return {
      isValid: false,
      error:
        "유효한 앱 ID 형식이 아닙니다. (예: com.company.myapp, io.example.app)",
    };
  }
  return { isValid: true };
}

export default function KeysContent() {
  const [widgetKeys, setWidgetKeys] = useState<WidgetKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedKey, setSelectedKey] = useState<WidgetKey | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [newAppId, setNewAppId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isComposingKeyNameRef = useRef(false);
  const isComposingDomainRef = useRef(false);
  const isComposingAppIdRef = useRef(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [collaborators, setCollaborators] = useState<CollaboratorResponse[]>(
    [],
  );
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [colorSettings, setColorSettings] = useState<ColorSettings>({
    primary: "#df3326",
    button: "#df3326",
    background: "#ffffff",
    text: "#1e293b",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    userMessageBg: "#df3326",
    assistantMessageBg: "#ffffff",
  });

  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>({
    position: "right",
    offset: 18,
    width: 360,
    height: 520,
    theme: "light",
  });

  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleGenerateKey = async () => {
    const name = newKeyName.trim() || `위젯 키 ${widgetKeys.length + 1}`;

    try {
      setIsCreating(true);
      const response = await createWidgetKey({ name });

      // API 응답을 WidgetKey 타입으로 변환
      const newKey: WidgetKey = {
        id: response.id,
        name: response.name,
        widgetKey: response.secretKey,
        createdAt: response.createdAt,
        domains: response.allowedDomains,
        appIds: response.allowedAppIds ?? [],
        status: response.status,
        isShared: response.secretKey === "***",
      };

      setWidgetKeys([...widgetKeys, newKey]);
      setNewKeyName("");
      setSelectedKey(newKey);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "위젯 키 생성에 실패했습니다.",
      );
      console.error("Failed to create widget key:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddDomain = async () => {
    if (!selectedKey || !newDomain.trim()) return;

    const domain = newDomain.trim();

    // 도메인 형식 검증
    const validation = validateDomain(domain);
    if (!validation.isValid) {
      alert(validation.error || "유효하지 않은 도메인입니다.");
      return;
    }

    // 중복 체크
    if (selectedKey.domains.includes(domain)) {
      alert("이미 등록된 도메인입니다.");
      return;
    }

    try {
      const response = await addDomainToWidgetKey(selectedKey.id, { domain });

      // API 응답을 WidgetKey 타입으로 변환
      const updatedKey: WidgetKey = {
        id: response.id,
        name: response.name,
        widgetKey: response.secretKey,
        createdAt: response.createdAt,
        domains: response.allowedDomains,
        appIds: response.allowedAppIds ?? [],
        status: response.status,
        isShared: response.secretKey === "***",
      };

      // 위젯 키 목록 업데이트
      setWidgetKeys(
        widgetKeys.map((key) => (key.id === selectedKey.id ? updatedKey : key)),
      );
      setNewDomain("");
      setSelectedKey(updatedKey);
    } catch (err) {
      alert(err instanceof Error ? err.message : "도메인 추가에 실패했습니다.");
      console.error("Failed to add domain:", err);
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    if (!selectedKey) return;

    try {
      await removeDomainFromWidgetKey(selectedKey.id, domain);

      // 삭제 성공 후 목록 다시 불러오기
      const response = await getWidgetKeys();
      const convertedKeys: WidgetKey[] = response.map((key) => ({
        id: key.id,
        name: key.name,
        widgetKey: key.secretKey,
        createdAt: key.createdAt,
        domains: key.allowedDomains,
        appIds: key.allowedAppIds ?? [],
        status: key.status,
        isShared: key.secretKey === "***",
      }));

      setWidgetKeys(convertedKeys);

      // 선택된 키 업데이트
      const updatedKey = convertedKeys.find((key) => key.id === selectedKey.id);
      if (updatedKey) {
        setSelectedKey(updatedKey);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "도메인 삭제에 실패했습니다.");
      console.error("Failed to remove domain:", err);
    }
  };

  const handleAddAppId = async () => {
    if (!selectedKey || !newAppId.trim()) return;

    const appId = newAppId.trim();
    const validation = validateAppId(appId);
    if (!validation.isValid) {
      alert(validation.error || "유효하지 않은 앱 ID입니다.");
      return;
    }
    if (selectedKey.appIds.includes(appId)) {
      alert("이미 등록된 앱 ID입니다.");
      return;
    }

    try {
      const response = await addAppIdToWidgetKey(selectedKey.id, { appId });
      const updatedKey: WidgetKey = {
        id: response.id,
        name: response.name,
        widgetKey: response.secretKey,
        createdAt: response.createdAt,
        domains: response.allowedDomains,
        appIds: response.allowedAppIds ?? [],
        status: response.status,
        isShared: response.secretKey === "***",
      };
      setWidgetKeys(
        widgetKeys.map((key) => (key.id === selectedKey.id ? updatedKey : key)),
      );
      setNewAppId("");
      setSelectedKey(updatedKey);
    } catch (err) {
      alert(err instanceof Error ? err.message : "앱 ID 추가에 실패했습니다.");
      console.error("Failed to add app ID:", err);
    }
  };

  const handleRemoveAppId = async (appId: string) => {
    if (!selectedKey) return;
    try {
      await removeAppIdFromWidgetKey(selectedKey.id, appId);
      const response = await getWidgetKeys();
      const convertedKeys: WidgetKey[] = response.map((key) => ({
        id: key.id,
        name: key.name,
        widgetKey: key.secretKey,
        createdAt: key.createdAt,
        domains: key.allowedDomains,
        appIds: key.allowedAppIds ?? [],
        status: key.status,
        isShared: key.secretKey === "***",
      }));
      setWidgetKeys(convertedKeys);
      const updatedKey = convertedKeys.find((key) => key.id === selectedKey.id);
      if (updatedKey) setSelectedKey(updatedKey);
    } catch (err) {
      alert(err instanceof Error ? err.message : "앱 ID 삭제에 실패했습니다.");
      console.error("Failed to remove app ID:", err);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("위젯 키를 폐기하시겠습니까?")) return;

    try {
      await revokeWidgetKey(keyId);

      // 목록에서 삭제하여 화면에서 제거
      const nextKeys = widgetKeys.filter((key) => key.id !== keyId);
      setWidgetKeys(nextKeys);

      // 선택된 키가 폐기된 키였다면 선택 해제 또는 다른 키 선택
      if (selectedKey?.id === keyId) {
        setSelectedKey(nextKeys.length > 0 ? nextKeys[0] : null);
      }
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "위젯 키 폐기에 실패했습니다.",
      );
      console.error("Failed to revoke widget key:", err);
    }
  };

  const handleCopyWidgetKey = (widgetKey: string) => {
    navigator.clipboard.writeText(widgetKey);
    alert("Widget Key가 클립보드에 복사되었습니다.");
  };

  const handleColorChange = (key: keyof ColorSettings, value: string) => {
    const newColors = { ...colorSettings, [key]: value };
    setColorSettings(newColors);

    // 미리보기 iframe에 색상 업데이트 전달
    if (previewIframeRef.current?.contentWindow) {
      previewIframeRef.current.contentWindow.postMessage(
        {
          type: "WM_UPDATE_COLORS",
          colors: {
            primary: newColors.primary.replace("#", ""),
            button: newColors.button.replace("#", ""),
            background: newColors.background.replace("#", ""),
            text: newColors.text.replace("#", ""),
            textSecondary: newColors.textSecondary.replace("#", ""),
            border: newColors.border.replace("#", ""),
            userMessageBg: newColors.userMessageBg.replace("#", ""),
            assistantMessageBg: newColors.assistantMessageBg.replace("#", ""),
          },
        },
        "*",
      );
    }
  };

  const handleLayoutChange = (
    key: keyof LayoutSettings,
    value: string | number,
  ) => {
    const newLayout = { ...layoutSettings, [key]: value };
    setLayoutSettings(newLayout);

    // 미리보기 iframe에 레이아웃 업데이트 전달
    if (previewIframeRef.current?.contentWindow) {
      previewIframeRef.current.contentWindow.postMessage(
        {
          type: "WM_UPDATE_LAYOUT",
          layout: newLayout,
        },
        "*",
      );
    }
  };

  // 위젯 키 목록 조회
  useEffect(() => {
    const fetchWidgetKeys = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getWidgetKeys();

        // API 응답을 WidgetKey 타입으로 변환
        const convertedKeys: WidgetKey[] = response.map((key) => ({
          id: key.id,
          name: key.name,
          widgetKey: key.secretKey,
          createdAt: key.createdAt,
          domains: key.allowedDomains,
          appIds: key.allowedAppIds ?? [],
          status: key.status,
          isShared: key.secretKey === "***",
        }));

        setWidgetKeys(convertedKeys);

        // 첫 번째 키를 자동으로 선택 (초기 로드 시에만)
        if (convertedKeys.length > 0) {
          setSelectedKey(convertedKeys[0]);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "위젯 키 목록을 불러오는데 실패했습니다.",
        );
        console.error("Failed to fetch widget keys:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWidgetKeys();
  }, []);

  // 소유 키(공유받은 키 아님)이고 REVOKED가 아닐 때만 협업자 목록 조회
  const canManageCollaborators =
    selectedKey && !selectedKey.isShared && selectedKey.status !== "REVOKED";

  useEffect(() => {
    if (!canManageCollaborators) {
      setCollaborators([]);
      return;
    }
    const fetchCollaborators = async () => {
      try {
        setCollaboratorsLoading(true);
        const list = await getCollaborators(selectedKey!.id);
        setCollaborators(list);
      } catch {
        setCollaborators([]);
      } finally {
        setCollaboratorsLoading(false);
      }
    };
    fetchCollaborators();
  }, [selectedKey, canManageCollaborators]);

  const handleInviteCollaborator = async () => {
    if (!selectedKey || !inviteEmail.trim()) return;

    const validation = validateEmail(inviteEmail.trim());
    if (!validation.isValid) {
      alert(validation.error || "유효하지 않은 이메일입니다.");
      return;
    }

    try {
      setInviteLoading(true);
      await inviteCollaborator(selectedKey.id, {
        inviteeEmail: inviteEmail.trim().toLowerCase(),
      });
      setInviteEmail("");
      const list = await getCollaborators(selectedKey.id);
      setCollaborators(list);
    } catch (err) {
      alert(err instanceof Error ? err.message : "협업자 초대에 실패했습니다.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveCollaborator = async (inviteeId: string) => {
    if (!selectedKey || !confirm("이 협업자를 제거하시겠습니까?")) return;

    try {
      await removeCollaborator(selectedKey.id, inviteeId);
      const list = await getCollaborators(selectedKey.id);
      setCollaborators(list);
    } catch (err) {
      alert(err instanceof Error ? err.message : "협업자 제거에 실패했습니다.");
    }
  };

  useEffect(() => {
    // 미리보기 iframe이 로드되면 초기 색상 및 레이아웃 설정
    const iframe = previewIframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        iframe.contentWindow?.postMessage(
          {
            type: "WM_INIT",
            widgetKey: selectedKey?.widgetKey || "preview",
            pageUrl: window.location.href,
            colors: {
              primary: colorSettings.primary.replace("#", ""),
              button: colorSettings.button.replace("#", ""),
              background: colorSettings.background.replace("#", ""),
              text: colorSettings.text.replace("#", ""),
              textSecondary: colorSettings.textSecondary.replace("#", ""),
              border: colorSettings.border.replace("#", ""),
              userMessageBg: colorSettings.userMessageBg.replace("#", ""),
              assistantMessageBg: colorSettings.assistantMessageBg.replace(
                "#",
                "",
              ),
            },
            layout: layoutSettings,
          },
          "*",
        );
      };
      iframe.addEventListener("load", handleLoad);
      return () => iframe.removeEventListener("load", handleLoad);
    }
  }, [selectedKey, colorSettings, layoutSettings]);

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">위젯 키 발급</h1>
          <p className="mt-2 text-sm text-gray-600">
            위젯 키를 발급받고 도메인을 등록하여 챗봇 위젯을 설치하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Widget Key List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                내 위젯 키
              </h2>
            </div>

            {/* Generate Key Form */}
            <div className="p-6 border-b border-gray-200">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="프로젝트 이름 (선택사항)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onCompositionStart={() => {
                    isComposingKeyNameRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    setTimeout(() => {
                      isComposingKeyNameRef.current = false;
                    }, 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (
                        isComposingKeyNameRef.current ||
                        (e.nativeEvent as KeyboardEvent).isComposing
                      ) {
                        return;
                      }
                      handleGenerateKey();
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#df3326] focus:border-transparent transition-all duration-150"
                />
                <button
                  onClick={handleGenerateKey}
                  disabled={isCreating}
                  className="w-full px-6 py-2.5 bg-[#df3326] text-white font-medium rounded-md hover:bg-[#c72a1f] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "생성 중..." : "위젯 키 발급"}
                </button>
              </div>
            </div>

            {/* Widget Key List */}
            <div className="divide-y divide-gray-200">
              {isLoading ? (
                <div className="p-6 text-center text-gray-500">
                  위젯 키 목록을 불러오는 중...
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <p className="text-red-500 mb-2">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      getWidgetKeys()
                        .then((response) => {
                          const convertedKeys: WidgetKey[] = response.map(
                            (key) => ({
                              id: key.id,
                              name: key.name,
                              widgetKey: key.secretKey,
                              createdAt: key.createdAt,
                              domains: key.allowedDomains,
                              appIds: key.allowedAppIds ?? [],
                              status: key.status,
                              isShared: key.secretKey === "***",
                            }),
                          );
                          setWidgetKeys(convertedKeys);
                          if (convertedKeys.length > 0 && !selectedKey) {
                            setSelectedKey(convertedKeys[0]);
                          }
                        })
                        .catch((err) => {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "위젯 키 목록을 불러오는데 실패했습니다.",
                          );
                        })
                        .finally(() => {
                          setIsLoading(false);
                        });
                    }}
                    className="text-sm text-[#df3326] hover:underline"
                  >
                    다시 시도
                  </button>
                </div>
              ) : widgetKeys.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  발급된 위젯 키가 없습니다.
                  <br />
                  위에서 위젯 키를 발급받으세요.
                </div>
              ) : (
                widgetKeys.map((key) => (
                  <div
                    key={key.id}
                    className={`p-4 cursor-pointer transition-colors duration-150 ${
                      selectedKey?.id === key.id
                        ? "bg-red-50 border-l-4 border-[#df3326]"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedKey(key)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {key.name}
                          </h3>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              key.isShared
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {key.isShared ? "공유받음" : "소유"}
                          </span>
                          {key.status === "REVOKED" && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              폐기됨
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 font-mono">
                          {key.widgetKey}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(key.createdAt).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                      {!key.isShared && key.status !== "REVOKED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteKey(key.id);
                          }}
                          className="ml-4 text-red-500 hover:text-red-700 text-sm"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Key Details */}
          <div className="bg-white rounded-lg border border-gray-200">
            {selectedKey ? (
              <>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedKey.name}
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Widget Key Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      위젯 키
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedKey.widgetKey}
                        readOnly
                        className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm"
                      />
                      {!selectedKey.isShared && (
                        <button
                          onClick={() =>
                            handleCopyWidgetKey(selectedKey.widgetKey)
                          }
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 active:scale-[0.98] transition-all duration-150"
                        >
                          복사
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {selectedKey.isShared
                        ? "공유받은 키는 실제 키 값을 확인할 수 없습니다. 사용량은 대시보드에서 확인할 수 있습니다."
                        : "이 키를 웹사이트에 위젯을 설치할 때 사용하세요."}
                    </p>
                  </div>

                  {/* Domains Section - 소유 키만 추가/삭제 가능 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      허용 도메인
                    </label>
                    {!selectedKey.isShared && (
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="example.com"
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                          onCompositionStart={() => {
                            isComposingDomainRef.current = true;
                          }}
                          onCompositionEnd={() => {
                            setTimeout(() => {
                              isComposingDomainRef.current = false;
                            }, 0);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (
                                isComposingDomainRef.current ||
                                (e.nativeEvent as KeyboardEvent).isComposing
                              ) {
                                return;
                              }
                              handleAddDomain();
                            }
                          }}
                          className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#de3624] focus:border-transparent transition-all duration-150"
                        />
                        <button
                          onClick={handleAddDomain}
                          className="px-4 py-2.5 bg-[#df3326] text-white font-medium rounded-md hover:bg-[#c72a1f] active:scale-[0.98] transition-all duration-150"
                        >
                          추가
                        </button>
                      </div>
                    )}

                    {selectedKey.domains.length === 0 ? (
                      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg text-center">
                        등록된 도메인이 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedKey.domains.map(
                          (domain: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm font-mono text-gray-900">
                                {domain}
                              </span>
                              {!selectedKey.isShared && (
                                <button
                                  onClick={() => handleRemoveDomain(domain)}
                                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-2">
                        💡 도메인 등록 가이드
                      </p>
                      <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                        <li>
                          <strong>루트 도메인 등록:</strong>{" "}
                          <code className="bg-blue-100 px-1 rounded">
                            example.com
                          </code>
                          을 등록하면 루트 도메인과{" "}
                          <code className="bg-blue-100 px-1 rounded">
                            www.example.com
                          </code>
                          이 자동으로 허용됩니다.
                        </li>
                        <li>
                          <strong>모든 서브도메인 허용:</strong>{" "}
                          <code className="bg-blue-100 px-1 rounded">
                            *.example.com
                          </code>
                          을 등록하면 모든 서브도메인(
                          <code className="bg-blue-100 px-1 rounded">
                            app.example.com
                          </code>
                          ,
                          <code className="bg-blue-100 px-1 rounded">
                            api.example.com
                          </code>{" "}
                          등)이 허용됩니다.
                        </li>
                        <li>
                          <strong>특정 서브도메인만 허용:</strong>{" "}
                          <code className="bg-blue-100 px-1 rounded">
                            app.example.com
                          </code>
                          처럼 서브도메인을 직접 등록할 수 있습니다.
                        </li>
                        <li>
                          <strong>프로토콜 제외:</strong>{" "}
                          <code className="bg-blue-100 px-1 rounded">
                            https://
                          </code>
                          나{" "}
                          <code className="bg-blue-100 px-1 rounded">
                            http://
                          </code>
                          는 입력하지 마세요.
                        </li>
                      </ul>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      이 Widget Key가 사용될 수 있는 도메인 목록입니다.
                    </p>
                  </div>

                  {/* 허용 앱 ID - 모바일 앱(Flutter 등)용 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      허용 앱 ID
                    </label>
                    {!selectedKey.isShared && (
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="com.company.myapp"
                          value={newAppId}
                          onChange={(e) => setNewAppId(e.target.value)}
                          onCompositionStart={() => {
                            isComposingAppIdRef.current = true;
                          }}
                          onCompositionEnd={() => {
                            setTimeout(() => {
                              isComposingAppIdRef.current = false;
                            }, 0);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (
                                isComposingAppIdRef.current ||
                                (e.nativeEvent as KeyboardEvent).isComposing
                              ) {
                                return;
                              }
                              handleAddAppId();
                            }
                          }}
                          className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#de3624] focus:border-transparent transition-all duration-150"
                        />
                        <button
                          type="button"
                          onClick={handleAddAppId}
                          className="px-4 py-2.5 bg-[#df3326] text-white font-medium rounded-md hover:bg-[#c72a1f] active:scale-[0.98] transition-all duration-150"
                        >
                          추가
                        </button>
                      </div>
                    )}

                    {selectedKey.appIds.length === 0 ? (
                      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg text-center">
                        등록된 앱 ID가 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedKey.appIds.map((appId: string) => (
                            <div
                              key={appId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm font-mono text-gray-900">
                                {appId}
                              </span>
                              {!selectedKey.isShared && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAppId(appId)}
                                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-xs font-medium text-amber-900 mb-2">
                        📱 앱 ID 등록 가이드
                      </p>
                      <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                        <li>
                          <strong>Android:</strong>{" "}
                          <code className="bg-amber-100 px-1 rounded">
                            applicationId
                          </code>
                          (build.gradle)와 동일하게 입력하세요.
                        </li>
                        <li>
                          <strong>iOS:</strong>{" "}
                          <code className="bg-amber-100 px-1 rounded">
                            Bundle Identifier
                          </code>
                          와 동일하게 입력하세요.
                        </li>
                        <li>
                          <strong>형식:</strong> 프로토콜 없이 앱 ID만 입력 (예:{" "}
                          <code className="bg-amber-100 px-1 rounded">
                            com.company.myapp
                          </code>
                          ).
                        </li>
                      </ul>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      모바일 앱(Flutter 등)에서 이 위젯 키를 사용할 때 허용할 앱
                      ID 목록입니다. 세션 발급 시 <code className="bg-gray-100 px-1 rounded">clientType: &quot;app&quot;</code>, <code className="bg-gray-100 px-1 rounded">appId</code>를 전달해야 합니다.
                    </p>
                  </div>

                  {/* 협업자 관리 - 소유 키이고 REVOKED가 아닐 때만 표시 */}
                  {canManageCollaborators && (
                    <div className="pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        협업자 관리
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        이메일로 Admin을 초대하여 사용량을 함께 볼 수 있습니다.
                      </p>
                      <div className="flex gap-2 mb-4">
                        <input
                          type="email"
                          placeholder="collaborator@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleInviteCollaborator();
                            }
                          }}
                          className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#de3624] focus:border-transparent"
                        />
                        <button
                          onClick={handleInviteCollaborator}
                          disabled={inviteLoading || !inviteEmail.trim()}
                          className="px-4 py-2.5 bg-[#df3326] text-white font-medium rounded-md hover:bg-[#c72a1f] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {inviteLoading ? "초대 중..." : "초대"}
                        </button>
                      </div>
                      {collaboratorsLoading ? (
                        <p className="text-sm text-gray-500">
                          협업자 목록 불러오는 중...
                        </p>
                      ) : collaborators.length === 0 ? (
                        <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg text-center">
                          초대된 협업자가 없습니다.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {collaborators.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  {c.inviteeEmail}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {c.status === "ACCEPTED"
                                    ? "수락됨"
                                    : "대기 중"}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveCollaborator(c.id)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                              >
                                제거
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Usage Example - 공유받은 키는 설치 코드 비표시 */}
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      설치 코드
                    </label>
                    {selectedKey.isShared ? (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">
                          공유받은 키는 설치 코드를 확인할 수 없습니다. 위젯
                          설치가 필요한 경우 소유자에게 문의하세요.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-900 rounded-lg">
                        <pre className="text-xs text-gray-100 overflow-x-auto">
                          {`<script
  src="https://chatbot.gistory.me/loader.js"
  data-widget-key="${selectedKey.widgetKey}"
  data-position="${layoutSettings.position}"
  data-offset="${layoutSettings.offset}"
  data-width="${layoutSettings.width}"
  data-height="${layoutSettings.height}"
  data-theme="${layoutSettings.theme}"
  data-primary-color="${colorSettings.primary.replace("#", "")}"
  data-button-color="${colorSettings.button.replace("#", "")}"
  data-background-color="${colorSettings.background.replace("#", "")}"
  data-text-color="${colorSettings.text.replace("#", "")}"
  data-text-secondary-color="${colorSettings.textSecondary.replace("#", "")}"
  data-border-color="${colorSettings.border.replace("#", "")}"
  data-user-message-bg="${colorSettings.userMessageBg.replace("#", "")}"
  data-assistant-message-bg="${colorSettings.assistantMessageBg.replace(
    "#",
    "",
  )}"
></script>`}
                        </pre>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      {selectedKey.isShared
                        ? "사용량은 대시보드에서 확인할 수 있습니다."
                        : "이 코드를 웹사이트의 &lt;body&gt; 태그 하단에 추가하세요."}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>왼쪽에서 위젯 키를 선택하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* Customization Section - 공통 섹션 */}
        <div className="mt-8 w-full">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                위젯 커스터마이징
              </h2>

              {/* 설정 가능한 옵션 표 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  설정 가능한 옵션
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 레이아웃 옵션 */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 mb-2">
                      레이아웃 옵션
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                              옵션
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                              설명
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                              기본값
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-widget-key
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              위젯 식별 키
                            </td>
                            <td className="px-3 py-2 text-gray-500">(필수)</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-position
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              버튼 위치 (right / left)
                            </td>
                            <td className="px-3 py-2 text-gray-500">right</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-offset
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              화면 가장자리 여백(px)
                            </td>
                            <td className="px-3 py-2 text-gray-500">18</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-width
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              위젯 패널 너비(px)
                            </td>
                            <td className="px-3 py-2 text-gray-500">360</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-height
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              위젯 패널 높이(px)
                            </td>
                            <td className="px-3 py-2 text-gray-500">520</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-theme
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              테마 식별자
                            </td>
                            <td className="px-3 py-2 text-gray-500">light</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 색상 옵션 */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 mb-2">
                      색상 커스터마이징 옵션
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                              옵션
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                              설명
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                              기본값
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-primary-color
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              주요 색상 (아이콘, 전송 버튼 등)
                            </td>
                            <td className="px-3 py-2 text-gray-500">df3326</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-button-color
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              런처 버튼 배경색
                            </td>
                            <td className="px-3 py-2 text-gray-500">primary</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-background-color
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              위젯 배경색
                            </td>
                            <td className="px-3 py-2 text-gray-500">ffffff</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-text-color
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              기본 텍스트 색상
                            </td>
                            <td className="px-3 py-2 text-gray-500">1e293b</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-text-secondary-color
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              보조 텍스트 색상
                            </td>
                            <td className="px-3 py-2 text-gray-500">64748b</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-border-color
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              테두리 색상
                            </td>
                            <td className="px-3 py-2 text-gray-500">e2e8f0</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-user-message-bg
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              사용자 메시지 배경색
                            </td>
                            <td className="px-3 py-2 text-gray-500">primary</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              data-assistant-message-bg
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              어시스턴트 메시지 배경색
                            </td>
                            <td className="px-3 py-2 text-gray-500">ffffff</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      💡 색상 값은{" "}
                      <code className="bg-gray-100 px-1 rounded">#</code> 없이
                      6자리 hex 코드로 입력하세요. (예:{" "}
                      <code className="bg-gray-100 px-1 rounded">df3326</code>,{" "}
                      <code className="bg-gray-100 px-1 rounded">3b82f6</code>)
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings & Preview - 가로 배치 */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Layout Settings */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        레이아웃 설정
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Position
                          </label>
                          <select
                            value={layoutSettings.position}
                            onChange={(e) =>
                              handleLayoutChange(
                                "position",
                                e.target.value as "right" | "left",
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
                          >
                            <option value="right">Right</option>
                            <option value="left">Left</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Theme
                          </label>
                          <select
                            value={layoutSettings.theme}
                            onChange={(e) =>
                              handleLayoutChange(
                                "theme",
                                e.target.value as "light" | "dark",
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Width (px)
                          </label>
                          <input
                            type="number"
                            value={layoutSettings.width}
                            onChange={(e) =>
                              handleLayoutChange(
                                "width",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
                            min="200"
                            max="800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Height (px)
                          </label>
                          <input
                            type="number"
                            value={layoutSettings.height}
                            onChange={(e) =>
                              handleLayoutChange(
                                "height",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
                            min="300"
                            max="800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Offset (px)
                          </label>
                          <input
                            type="number"
                            value={layoutSettings.offset}
                            onChange={(e) =>
                              handleLayoutChange(
                                "offset",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Color Settings */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        색상 설정
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Primary
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={colorSettings.primary}
                              onChange={(e) =>
                                handleColorChange("primary", e.target.value)
                              }
                              className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={colorSettings.primary}
                              onChange={(e) =>
                                handleColorChange("primary", e.target.value)
                              }
                              className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-md font-mono"
                              placeholder="#df3326"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Button
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={colorSettings.button}
                              onChange={(e) =>
                                handleColorChange("button", e.target.value)
                              }
                              className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={colorSettings.button}
                              onChange={(e) =>
                                handleColorChange("button", e.target.value)
                              }
                              className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-md font-mono"
                              placeholder="#df3326"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Background
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={colorSettings.background}
                              onChange={(e) =>
                                handleColorChange("background", e.target.value)
                              }
                              className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={colorSettings.background}
                              onChange={(e) =>
                                handleColorChange("background", e.target.value)
                              }
                              className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-md font-mono"
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Text
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={colorSettings.text}
                              onChange={(e) =>
                                handleColorChange("text", e.target.value)
                              }
                              className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={colorSettings.text}
                              onChange={(e) =>
                                handleColorChange("text", e.target.value)
                              }
                              className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-md font-mono"
                              placeholder="#1e293b"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Text Secondary
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={colorSettings.textSecondary}
                              onChange={(e) =>
                                handleColorChange(
                                  "textSecondary",
                                  e.target.value,
                                )
                              }
                              className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={colorSettings.textSecondary}
                              onChange={(e) =>
                                handleColorChange(
                                  "textSecondary",
                                  e.target.value,
                                )
                              }
                              className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-md font-mono"
                              placeholder="#64748b"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Border
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={colorSettings.border}
                              onChange={(e) =>
                                handleColorChange("border", e.target.value)
                              }
                              className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={colorSettings.border}
                              onChange={(e) =>
                                handleColorChange("border", e.target.value)
                              }
                              className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-md font-mono"
                              placeholder="#e2e8f0"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            User Msg BG
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={colorSettings.userMessageBg}
                              onChange={(e) =>
                                handleColorChange(
                                  "userMessageBg",
                                  e.target.value,
                                )
                              }
                              className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={colorSettings.userMessageBg}
                              onChange={(e) =>
                                handleColorChange(
                                  "userMessageBg",
                                  e.target.value,
                                )
                              }
                              className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-md font-mono"
                              placeholder="#df3326"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Assistant Msg BG
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={colorSettings.assistantMessageBg}
                              onChange={(e) =>
                                handleColorChange(
                                  "assistantMessageBg",
                                  e.target.value,
                                )
                              }
                              className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={colorSettings.assistantMessageBg}
                              onChange={(e) =>
                                handleColorChange(
                                  "assistantMessageBg",
                                  e.target.value,
                                )
                              }
                              className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-md font-mono"
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      미리보기
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Floating Button Preview */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">
                          플로팅 버튼
                        </label>
                        <div
                          className="border border-gray-200 rounded-lg bg-white relative"
                          style={{ height: "400px", overflow: "hidden" }}
                        >
                          {/* Skeleton UI - 웹페이지 예시 */}
                          <div className="absolute inset-0 p-4">
                            <div className="h-4 bg-gray-200 rounded mb-3 w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded mb-3 w-full animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded mb-3 w-5/6 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded mb-3 w-4/5 animate-pulse"></div>
                            <div className="h-48 bg-gray-100 rounded mt-4 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded mt-4 w-2/3 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded mt-2 w-4/5 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded mt-2 w-3/4 animate-pulse"></div>
                            <div className="h-32 bg-gray-100 rounded mt-4 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded mt-4 w-2/3 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded mt-2 w-4/5 animate-pulse"></div>
                          </div>
                          <div
                            className={`absolute bottom-4 ${
                              layoutSettings.position === "right"
                                ? "right-4"
                                : "left-4"
                            }`}
                            style={{
                              bottom: `${layoutSettings.offset}px`,
                              [layoutSettings.position === "right"
                                ? "right"
                                : "left"]: `${layoutSettings.offset}px`,
                            }}
                          >
                            <button
                              className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                              style={{
                                backgroundColor: colorSettings.button,
                                boxShadow: "0 12px 30px rgba(0,0,0,.18)",
                              }}
                            >
                              <svg
                                viewBox="0 0 173 150"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ width: "28px", height: "auto" }}
                              >
                                <path
                                  d="M83.7427 87.1014L109.873 87.108V114.663H78.4867C56.3773 114.663 38.456 96.74 38.456 74.632C38.456 52.524 56.3773 34.6014 78.4867 34.6014H137.464L172.871 4.57764e-05H74.632C33.4147 4.57764e-05 0 33.4134 0 74.632C0 115.849 33.4147 149.264 74.632 149.264H112.308H147.541H147.544V58.7254H147.541H112.779L83.7427 87.1014Z"
                                  fill="white"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Chat UI Preview */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">
                          채팅 UI
                        </label>
                        <div
                          className="border border-gray-200 rounded-lg overflow-hidden"
                          style={{ height: "400px" }}
                        >
                          <iframe
                            ref={previewIframeRef}
                            src={`${window.location.origin}/widget/?preview=true`}
                            className="w-full h-full border-0"
                            title="채팅 UI 미리보기"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      색상 변경 시 실시간으로 미리보기가 업데이트됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
