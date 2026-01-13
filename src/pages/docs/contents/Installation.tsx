import CodeBlock from "../../../components/CodeBlock";

export default function Installation() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Installation</h1>
      <p className="text-lg text-gray-600 mb-8">
        챗봇 위젯을 설치하고 설정하는 방법을 알아보세요.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            기본 설치
          </h2>
          <p className="text-gray-700 mb-4">
            웹사이트의{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              &lt;body&gt;
            </code>{" "}
            태그 하단에 스크립트를 추가하세요.
          </p>
          <CodeBlock
            code={`<script
  src="https://chatbot.gistory.me/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>`}
            language="html"
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            필수 속성
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    속성
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-widget-key
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    위젯 식별 키 (필수)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            주의사항
          </h2>
          <ul className="space-y-3 text-gray-700 list-disc list-inside">
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                loader.js
              </code>
              는 반드시 <strong>HTTPS 환경</strong>에서 사용하세요
            </li>
            <li>
              최신 버전을 받기 위해{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                no-cache
              </code>
              를 권장합니다
            </li>
            <li>
              CSP(Content-Security-Policy)가 강한 사이트에서는{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                script-src
              </code>{" "}
              /{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                frame-src
              </code>
              에 위젯 도메인 허용이 필요할 수 있습니다
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
