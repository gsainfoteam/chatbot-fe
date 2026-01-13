import CodeBlock from "../../../components/CodeBlock";

export default function QuickStart() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Quick Start</h1>
      <p className="text-lg text-gray-600 mb-8">
        챗봇 위젯을 웹사이트에 통합하는 가장 빠른 방법을 알아보세요.
      </p>

      <div className="space-y-8">
        {/* Step 1 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-[#df3326] text-white rounded-full text-sm font-bold mr-3">
              1
            </span>
            스크립트 추가
          </h2>
          <p className="text-gray-700 mb-4">
            웹사이트의{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              &lt;body&gt;
            </code>{" "}
            태그 하단에 아래 스크립트를 추가하세요.
          </p>
          <CodeBlock
            code={`<script
  src="https://chatbot.gistory.me/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>`}
            language="html"
          />
        </section>

        {/* Step 2 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-[#df3326] text-white rounded-full text-sm font-bold mr-3">
              2
            </span>
            Widget Key 발급
          </h2>
          <p className="text-gray-700 mb-4">
            위젯을 사용하려면{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              widget-key
            </code>
            가 필요합니다. 관리자 페이지에서 키를 발급받으세요.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Widget Key란?</strong> 위젯을 설치한 서비스를 식별하기
              위한 고유 키입니다. 이를 통해 도메인 제한, 사용량 관리 등이
              가능합니다.
            </p>
          </div>
        </section>

        {/* Step 3 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-[#df3326] text-white rounded-full text-sm font-bold mr-3">
              3
            </span>
            완료!
          </h2>
          <p className="text-gray-700 mb-4">
            스크립트를 추가하면 즉시 화면 우하단에 챗봇 런처 버튼이 표시됩니다.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              ✅ 위젯이 정상적으로 로드되었는지 확인하려면 브라우저 개발자
              도구의 콘솔을 확인하세요.
            </p>
          </div>
        </section>

        {/* 예제 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            전체 예제
          </h2>
          <CodeBlock
            code={`<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>내 웹사이트</title>
  </head>
  <body>
    <h1>환영합니다!</h1>
    
    <!-- 챗봇 위젯 설치 -->
    <script
      src="https://chatbot.gistory.me/loader.js"
      data-widget-key="wk_live_abc123"
    ></script>
  </body>
</html>`}
            language="html"
          />
        </section>

        {/* 다음 단계 */}
        <section className="border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            다음 단계
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li>
              <a
                href="/docs/installation"
                className="text-[#df3326] hover:underline font-medium"
              >
                Installation 가이드
              </a>{" "}
              에서 더 자세한 설치 방법을 확인하세요
            </li>
            <li>
              <a
                href="/docs/customization"
                className="text-[#df3326] hover:underline font-medium"
              >
                Customization
              </a>{" "}
              에서 색상과 레이아웃을 커스터마이징하세요
            </li>
            <li>
              <a
                href="/docs/api/javascript"
                className="text-[#df3326] hover:underline font-medium"
              >
                JavaScript API
              </a>{" "}
              를 사용하여 위젯을 프로그래밍 방식으로 제어하세요
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
