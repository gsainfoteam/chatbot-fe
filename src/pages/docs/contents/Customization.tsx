import CodeBlock from "../../../components/CodeBlock";
import LauncherIconGallery from "../LauncherIconGallery";

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
                    런처 버튼 아이콘. 아래 "런처 아이콘" 섹션의 키 중 하나
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">logo</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-launcher
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    기본 런처 형태. icon(아이콘) / pill(아이콘 + 문구) / none(그리지
                    않음, 커스텀 트리거 전용)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">icon</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-launcher-label
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    pill 런처에 표시할 문구 (모바일과 열림 상태에서는 숨김)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    무엇이든 물어보세요
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-mode
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    패널 위치. corner(런처 위 카드) / center(화면 중앙 모달). 모바일은
                    항상 하단 시트
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">corner</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-hide-button
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    (하위 호환) true면 data-launcher="none"과 동일
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">false</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-resizable
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    데스크톱에서 패널 모서리 드래그 크기 조절 (true / false)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">true</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 런처 아이콘 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            런처 아이콘
          </h2>
          <p className="text-gray-700 mb-4">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              data-button-icon
            </code>
            에 넣을 수 있는 값입니다. 마스코트 아이콘은 색이 고정되고, 나머지는
            흰색 실루엣에 버튼색으로 디테일을 파낸 구조라 버튼색을 바꿔도 함께
            따라갑니다. 말풍선 꼬리는 런처가 놓인 쪽 모서리를 향합니다.
          </p>
          <LauncherIconGallery />
          <CodeBlock
            code={`<script
  src="https://chatbot.gistory.me/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
  data-button-icon="chat-sparkle"
></script>`}
            language="html"
          />
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
