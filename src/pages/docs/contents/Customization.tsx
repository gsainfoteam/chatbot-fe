import CodeBlock from "../../../components/CodeBlock";

export default function Customization() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Customization</h1>
      <p className="text-lg text-gray-600 mb-8">
        위젯의 색상, 레이아웃, 위치 등을 자유롭게 커스터마이징하세요.
      </p>

      <div className="space-y-8">
        {/* 레이아웃 옵션 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            레이아웃 옵션
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    옵션
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    설명
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    기본값
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-position
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    버튼 위치 (right / left)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">right</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-offset
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    화면 가장자리 여백(px)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">18</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-width
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    위젯 패널 너비(px)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">360</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-height
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    위젯 패널 높이(px)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">520</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-theme
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    테마 식별자
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">light</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-button-icon
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    채팅 열기 버튼 아이콘 (logo: G 로고 / chat 또는 bubble: 말풍선 / robot: 로봇)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">logo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 색상 커스터마이징 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            색상 커스터마이징 옵션
          </h2>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    옵션
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    설명
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    기본값
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-primary-color
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    주요 색상 (아이콘, 전송 버튼 등)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">df3326</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-button-color
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    런처 버튼 배경색
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">primary</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-background-color
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    위젯 배경색
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">ffffff</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-text-color
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    기본 텍스트 색상
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">1e293b</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-text-secondary-color
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    보조 텍스트 색상
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">64748b</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-border-color
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    테두리 색상 (챗봇 패널·카드 외곽선, 헤더 구분선, 메시지·출처
                    영역 등)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">e2e8f0</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-user-message-bg
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    사용자 메시지 배경색
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">primary</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-assistant-message-bg
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    어시스턴트 메시지 배경색
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">ffffff</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 색상 값은 <code className="bg-blue-100 px-1 rounded">#</code>{" "}
              없이 6자리 hex 코드로 입력하세요. (예:{" "}
              <code className="bg-blue-100 px-1 rounded">df3326</code>,{" "}
              <code className="bg-blue-100 px-1 rounded">3b82f6</code>)
            </p>
          </div>
        </section>

        {/* 예제 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            커스터마이징 예제
          </h2>
          <CodeBlock
            code={`<script
  src="https://chatbot.gistory.me/loader.js"
  data-widget-key="wk_live_abc123"
  data-position="right"
  data-button-icon="chat"
  data-primary-color="3b82f6"
  data-button-color="2563eb"
  data-user-message-bg="3b82f6"
  data-text-color="1e293b"
  data-border-color="cbd5e1"
  data-width="380"
  data-height="560"
></script>`}
            language="html"
          />
        </section>
      </div>
    </div>
  );
}
