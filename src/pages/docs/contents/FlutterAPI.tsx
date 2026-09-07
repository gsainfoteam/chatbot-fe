import CodeBlock from "../../../components/CodeBlock";

const configParams = [
  {
    name: "widgetKey",
    type: "String",
    required: "필수",
    description: "대시보드에서 발급받은 위젯 키 (예: wk_live_xxx)",
  },
  {
    name: "apiBaseUrl",
    type: "String",
    required: "선택",
    description:
      "백엔드 API base URL. 기본값은 프로덕션 서버이며, 개발/스테이징 환경에서만 지정하세요",
  },
  {
    name: "resourceCenterUrl",
    type: "String?",
    required: "선택",
    description:
      "출처 자료(PDF/이미지) base URL. 기본값은 프로덕션 리소스 센터입니다",
  },
  {
    name: "appId",
    type: "String?",
    required: "선택",
    description:
      "앱 식별자. 생략하면 package_info_plus로 자동 인식됩니다 (대시보드에 등록된 앱 ID와 일치해야 함)",
  },
  {
    name: "accessToken",
    type: "String?",
    required: "선택",
    description: "인증 토큰 (로그인 연동 시 사용)",
  },
  {
    name: "reportUrl",
    type: "String",
    required: "선택",
    description: "헤더의 제보 버튼이 여는 URL",
  },
  {
    name: "colors",
    type: "GistChatbotColors",
    required: "선택",
    description: "챗봇 색상 커스터마이징 (아래 참고)",
  },
];

const methods = [
  {
    name: "open(context)",
    description: "챗봇 패널을 엽니다",
  },
  {
    name: "close()",
    description: "챗봇 패널을 닫습니다",
  },
  {
    name: "isOpen",
    description: "패널이 열려 있는지 여부를 반환합니다",
  },
  {
    name: "dispose()",
    description: "리소스와 대화 기록을 해제합니다 (State.dispose에서 호출)",
  },
];

const colorFields = [
  { name: "primary", web: "data-primary-color", description: "주 강조 색상" },
  { name: "button", web: "data-button-color", description: "버튼 색상" },
  {
    name: "background",
    web: "data-background-color",
    description: "헤더/메시지 영역/입력창 공통 배경",
  },
  { name: "text", web: "data-text-color", description: "기본 텍스트 색상" },
  {
    name: "textSecondary",
    web: "data-text-secondary-color",
    description: "보조 텍스트 색상",
  },
  { name: "border", web: "data-border-color", description: "테두리 색상" },
  {
    name: "userMessageBg",
    web: "data-user-message-bg",
    description: "사용자 말풍선 기준 색상",
  },
  {
    name: "assistantMessageBg",
    web: "data-assistant-message-bg",
    description: "챗봇 말풍선 배경 색상",
  },
];

export default function FlutterAPI() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Flutter API & 설정
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        gist_chatbot_flutter 패키지의 API와 설정 옵션을 알아보세요.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            GistChatbot 메서드
          </h2>
          <p className="text-gray-700 mb-4">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              GistChatbot
            </code>{" "}
            인스턴스로 챗봇 패널을 제어합니다.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    메서드
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {methods.map((method) => (
                  <tr key={method.name}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                      {method.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {method.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            GistChatbotConfig
          </h2>
          <p className="text-gray-700 mb-4">
            챗봇 동작을 설정하는 옵션입니다. 웹 위젯의{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              data-*
            </code>{" "}
            속성에 대응합니다.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    파라미터
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    타입
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b whitespace-nowrap">
                    필수 여부
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {configParams.map((param) => (
                  <tr key={param.name}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                      {param.name}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">
                      {param.type}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {param.required}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {param.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            색상 커스터마이징 (GistChatbotColors)
          </h2>
          <p className="text-gray-700 mb-4">
            웹 위젯의 CSS 변수와 동일한 팔레트를 사용합니다. 웹과 앱에서 일관된
            브랜드 색상을 적용할 수 있습니다.
          </p>
          <CodeBlock
            code={`final _chatbot = GistChatbot(
  config: const GistChatbotConfig(
    widgetKey: 'wk_live_xxx',
    colors: GistChatbotColors(
      primary: Color(0xFF2563EB),
      button: Color(0xFF2563EB),
      userMessageBg: Color(0xFF2563EB),
    ),
  ),
);`}
            language="dart"
          />
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    필드
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    웹 위젯 대응 속성
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {colorFields.map((field) => (
                  <tr key={field.name}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                      {field.name}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">
                      {field.web}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {field.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900">
              💡 모든 필드는 선택 사항이며,{" "}
              <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">
                copyWith()
              </code>
              로 일부 색상만 변경한 복사본을 만들 수도 있습니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            주요 기능
          </h2>
          <ul className="space-y-3 text-gray-700 list-disc list-inside">
            <li>SSE 스트리밍 기반 마크다운 답변 (스트리밍 중 중지 버튼 지원)</li>
            <li>단계별 로딩 인디케이터</li>
            <li>답변 피드백 (도움됨 / 도움 안 됨)</li>
            <li>세션 유지 및 대화 기록 관리</li>
            <li>세션당 5회 질문 제한 (rate limiting)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            플랫폼 지원
          </h2>
          <p className="text-gray-700 mb-4">
            Android, iOS, macOS, Windows, Linux, Web을 모두 지원합니다.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              ⚠️ 앱의 Bundle Identifier(iOS) 또는 applicationId(Android)가
              대시보드의 허용 앱 ID 목록에 등록되어 있어야 정상 동작합니다.
              자세한 내용은{" "}
              <a
                href="/docs/flutter/quick-start"
                className="text-[#df3326] hover:underline font-medium"
              >
                Flutter 시작하기
              </a>
              를 참고하세요.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
