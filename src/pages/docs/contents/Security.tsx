import CodeBlock from "../../../components/CodeBlock";

export default function Security() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Security</h1>
      <p className="text-lg text-gray-600 mb-8">
        챗봇 위젯의 보안 구조와 주의사항을 알아보세요.
      </p>

      <div className="space-y-8">
        {/* 보안 구조 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            보안 구조 개요
          </h2>
          <ul className="space-y-3 text-gray-700 list-disc list-inside mb-4">
            <li>위젯 UI는 iframe에서 실행됩니다</li>
            <li>
              호스트 ↔ iframe 통신은 postMessage + origin 검증을 사용합니다
            </li>
            <li>
              실제 AI 요청/비즈니스 로직은 서버에서만 처리하는 것을 전제로
              합니다
            </li>
          </ul>
          <CodeBlock
            code={`Host Page
  └─ loader.js
      └─ iframe (widget UI)
          └─ API 요청 → AI / Backend Server`}
            language="plaintext"
          />
        </section>

        {/* Widget Key 보안 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Widget Key 보안
          </h2>
          <p className="text-gray-700 mb-4">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              widgetKey
            </code>
            는 위젯을 설치한 서비스를 식별하기 위한 키입니다.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-900 font-semibold mb-2">
              ⚠️ 주의사항
            </p>
            <p className="text-sm text-yellow-900">
              widgetKey는 공개 HTML에 포함되므로, 서버에서는 반드시{" "}
              <strong>도메인 기반 검증</strong>을 수행해야 합니다.
            </p>
          </div>
          <p className="text-gray-700 mb-4">
            widgetKey를 통해 서버에서는 다음과 같은 제어가 가능합니다:
          </p>
          <ul className="space-y-2 text-gray-700 list-disc list-inside">
            <li>허용 도메인 제한 (allowedOrigins)</li>
            <li>사용량/레이트 리밋</li>
            <li>테마 및 기능 플래그 분기</li>
            <li>로그 분리</li>
          </ul>
        </section>

        {/* HTTPS 필수 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            HTTPS 필수
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 font-semibold mb-2">
              🔒 보안 필수사항
            </p>
            <p className="text-sm text-red-900 mb-2">
              <code className="bg-red-100 px-2 py-1 rounded">loader.js</code>는
              반드시 <strong>HTTPS 환경</strong>에서 사용하세요.
            </p>
            <p className="text-sm text-red-900">
              HTTP 환경에서는 보안 위험이 있으며, 일부 브라우저에서는 동작하지
              않을 수 있습니다.
            </p>
          </div>
        </section>

        {/* CSP 설정 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Content Security Policy (CSP)
          </h2>
          <p className="text-gray-700 mb-4">
            CSP가 강한 사이트에서는 다음을 허용해야 합니다:
          </p>
          <CodeBlock
            code={`Content-Security-Policy:
  script-src 'self' https://chatbot.gistory.me;
  frame-src 'self' https://chatbot.gistory.me;`}
            language="plaintext"
          />
        </section>
      </div>
    </div>
  );
}
