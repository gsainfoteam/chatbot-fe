import { useRef, useState } from "react";

type WidgetKey = {
  id: string;
  name: string;
  widgetKey: string;
  createdAt: string;
  domains: string[];
};

function generateWidgetKey(): string {
  const prefix = "wk_";
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}${random}`;
}

export default function Admin() {
  const [widgetKeys, setWidgetKeys] = useState<WidgetKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedKey, setSelectedKey] = useState<WidgetKey | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const isComposingKeyNameRef = useRef(false);
  const isComposingDomainRef = useRef(false);

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

  return (
    <div className="min-h-screen bg-gray-50">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={handleGenerateKey}
                  className="w-full px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 active:scale-[0.98] transition"
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
                    className={`p-4 cursor-pointer transition ${
                      selectedKey?.id === key.id
                        ? "bg-orange-50 border-l-4 border-orange-500"
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
                      />
                      <button
                        onClick={() =>
                          handleCopyWidgetKey(selectedKey.widgetKey)
                        }
                        className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 active:scale-[0.98] transition"
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddDomain}
                        className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 active:scale-[0.98] transition"
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
      </div>
    </div>
  );
}
