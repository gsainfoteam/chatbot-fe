import { useRef, useState, useEffect } from "react";

type WidgetKey = {
  id: string;
  name: string;
  widgetKey: string;
  createdAt: string;
  domains: string[];
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

function generateWidgetKey(): string {
  const prefix = "wk_";
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}${random}`;
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

export default function KeysContent() {
  const [widgetKeys, setWidgetKeys] = useState<WidgetKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedKey, setSelectedKey] = useState<WidgetKey | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const isComposingKeyNameRef = useRef(false);
  const isComposingDomainRef = useRef(false);

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

  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const handleGenerateKey = () => {
    const name = newKeyName.trim() || `위젯 키 ${widgetKeys.length + 1}`;

    const newKey: WidgetKey = {
      id: Math.random().toString(36).substring(2, 15),
      name: name,
      widgetKey: generateWidgetKey(),
      createdAt: new Date().toISOString(),
      domains: [],
    };

    setWidgetKeys([...widgetKeys, newKey]);
    setNewKeyName("");
    setSelectedKey(newKey);
  };

  const handleAddDomain = () => {
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

    setWidgetKeys(
      widgetKeys.map((key) =>
        key.id === selectedKey.id
          ? { ...key, domains: [...key.domains, domain] }
          : key
      )
    );
    setNewDomain("");
    setSelectedKey({
      ...selectedKey,
      domains: [...selectedKey.domains, domain],
    });
  };

  const handleRemoveDomain = (domain: string) => {
    if (!selectedKey) return;

    setWidgetKeys(
      widgetKeys.map((key) =>
        key.id === selectedKey.id
          ? { ...key, domains: key.domains.filter((d) => d !== domain) }
          : key
      )
    );
    setSelectedKey({
      ...selectedKey,
      domains: selectedKey.domains.filter((d) => d !== domain),
    });
  };

  const handleDeleteKey = (keyId: string) => {
    if (!confirm("위젯 키를 삭제하시겠습니까?")) return;

    setWidgetKeys(widgetKeys.filter((key) => key.id !== keyId));
    if (selectedKey?.id === keyId) {
      setSelectedKey(null);
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
        "*"
      );
    }
  };

  useEffect(() => {
    // 미리보기 iframe이 로드되면 초기 색상 설정
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
                ""
              ),
            },
          },
          "*"
        );
      };
      iframe.addEventListener("load", handleLoad);
      return () => iframe.removeEventListener("load", handleLoad);
    }
  }, [selectedKey, colorSettings]);

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
                  className="w-full px-6 py-2.5 bg-[#df3326] text-white font-medium rounded-md hover:bg-[#c72a1f] active:scale-[0.98] transition-all duration-150"
                >
                  위젯 키 발급
                </button>
              </div>
            </div>

            {/* Widget Key List */}
            <div className="divide-y divide-gray-200">
              {widgetKeys.length === 0 ? (
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
                        <h3 className="font-semibold text-gray-900">
                          {key.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 font-mono">
                          {key.widgetKey}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(key.createdAt).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteKey(key.id);
                        }}
                        className="ml-4 text-red-500 hover:text-red-700 text-sm"
                      >
                        삭제
                      </button>
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
                      <button
                        onClick={() =>
                          handleCopyWidgetKey(selectedKey.widgetKey)
                        }
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 active:scale-[0.98] transition-all duration-150"
                      >
                        복사
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      이 키를 웹사이트에 위젯을 설치할 때 사용하세요.
                    </p>
                  </div>

                  {/* Domains Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      허용 도메인
                    </label>
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
                              <button
                                onClick={() => handleRemoveDomain(domain)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                              >
                                삭제
                              </button>
                            </div>
                          )
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

                  {/* Usage Example */}
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      설치 코드
                    </label>
                    <div className="p-4 bg-gray-900 rounded-lg">
                      <pre className="text-xs text-gray-100 overflow-x-auto">
                        {`<script
  src="https://widget.yourdomain.com/loader.js"
  data-widget-key="${selectedKey.widgetKey}"
></script>`}
                      </pre>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      이 코드를 웹사이트의 &lt;body&gt; 태그 하단에 추가하세요.
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

              {/* Color Settings & Preview - 가로 배치 */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Color Settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      색상 설정
                    </label>
                    <div className="space-y-4">
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
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={colorSettings.primary}
                            onChange={(e) =>
                              handleColorChange("primary", e.target.value)
                            }
                            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md font-mono"
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
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={colorSettings.button}
                            onChange={(e) =>
                              handleColorChange("button", e.target.value)
                            }
                            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md font-mono"
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
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={colorSettings.background}
                            onChange={(e) =>
                              handleColorChange("background", e.target.value)
                            }
                            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md font-mono"
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
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={colorSettings.text}
                            onChange={(e) =>
                              handleColorChange("text", e.target.value)
                            }
                            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md font-mono"
                            placeholder="#1e293b"
                          />
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
                          <div className="absolute bottom-4 right-4">
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
