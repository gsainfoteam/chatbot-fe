import { Link } from "react-router-dom";
import CodeBlock from "../../../components/CodeBlock";

const Code = ({ children }: { children: string }) => (
  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{children}</code>
);

// 파란 안내 박스 안에서 쓰는 코드 칩 (다른 문서 페이지의 팁 박스와 같은 스타일)
const TipCode = ({ children }: { children: string }) => (
  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">{children}</code>
);

// 문서 내부 이동은 전체 페이지 로드 없이 라우터로 처리한다
const DocLink = ({ to, children }: { to: string; children: string }) => (
  <Link to={to} className="text-[#df3326] hover:underline font-medium">
    {children}
  </Link>
);

export default function Installation() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Installation</h1>
      <p className="text-lg text-gray-600 mb-8">
        챗봇 위젯은 스크립트 한 줄로 설치됩니다. 어떤 환경에 어디에 넣는지, 설치
        후 무엇이 생기는지, 기본 버튼 대신 자체 버튼을 쓰는 방법을 정리했습니다.
      </p>

      <div className="space-y-8">
        {/* 기본 설치 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            기본 설치
          </h2>
          <p className="text-gray-700 mb-4">
            <Code>&lt;body&gt;</Code> 태그 하단에 스크립트를 추가하세요. 스크립트가
            실행되면 화면 모서리에 런처 버튼이 나타나고, 채팅 패널은 숨겨진 채로
            준비됩니다.
          </p>
          <CodeBlock
            code={`<script
  src="https://chatbot.gistory.me/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>`}
            language="html"
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900">
              💡 <TipCode>data-widget-key</TipCode>는 관리자 페이지에서 발급받습니다. 키에
              등록된 도메인에서만 동작합니다.
            </p>
          </div>
        </section>

        {/* 환경별 위치 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            환경별 설치 위치
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    환경
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    스크립트를 넣는 곳
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900">정적 HTML</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    각 페이지 <Code>&lt;body&gt;</Code> 하단
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    React (Vite, CRA)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <Code>index.html</Code>의 <Code>&lt;body&gt;</Code> 하단, 앱
                    스크립트 다음
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900">Next.js</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    루트 레이아웃에서 <Code>next/script</Code>로 삽입
                    (strategy: afterInteractive)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    Flutter 앱
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    스크립트 대신{" "}
                    <DocLink to="/docs/flutter/quick-start">
                      gist_chatbot_flutter
                    </DocLink>{" "}
                    패키지 사용
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            React와 Next.js의 실제 코드와 훅 예시는{" "}
            <DocLink to="/docs/react">React 연동</DocLink> 페이지에 있습니다.
          </p>
        </section>

        {/* 자체 버튼 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            기본 버튼 대신 자체 버튼 쓰기
          </h2>
          <p className="text-gray-700 mb-4">
            사이트 헤더의 "문의하기" 버튼처럼 이미 있는 요소로 챗봇을 열고 싶다면
            기본 런처를 끄고, 그 요소에 속성 하나만 붙이면 됩니다. 요소가 나중에
            렌더링되어도 동작합니다.
          </p>
          <CodeBlock
            code={`<!-- 기본 런처를 그리지 않음 -->
<script
  src="https://chatbot.gistory.me/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
  data-launcher="none"
></script>

<!-- 페이지 어디든: 클릭하면 열림/닫힘 -->
<button data-chatbot-toggle>문의하기</button>`}
            language="html"
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900">
              💡 <TipCode>data-chatbot-open</TipCode>, <TipCode>data-chatbot-close</TipCode>도
              있습니다. 기본 런처를 그대로 두고 트리거를 추가로 달아도 됩니다.
            </p>
          </div>
        </section>

        {/* 속성 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            필수 속성과 자주 쓰는 옵션
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    기본값
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-widget-key
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    위젯 식별 키 <strong>(필수)</strong>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-launcher
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    기본 런처 형태. icon / pill(아이콘 + 문구) / none
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">icon</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-position
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    런처와 패널 위치. right / left
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">right</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-mode
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    패널 위치. corner(런처 위 카드) / center(화면 중앙 모달)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">corner</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-button-icon
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    런처 아이콘. logo, popo-headset, chat-sparkle, chat, search, question 등
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    logo
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            색상, 크기, 여백 등 전체 옵션은{" "}
            <DocLink to="/docs/customization">Customization</DocLink>을
            참고하세요.
          </p>
        </section>

        {/* 설치 확인 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            설치 확인
          </h2>
          <ul className="space-y-3 text-gray-700 list-disc list-inside">
            <li>
              화면 모서리에 런처 버튼이 보이고, 누르면 채팅 패널이 열립니다.{" "}
              <Code>data-launcher="none"</Code>이면 트리거 요소를 눌러 확인하세요.
            </li>
            <li>
              브라우저 콘솔에서 <Code>window.ChatbotWidget</Code>을 입력하면 제어
              객체가 보입니다. <Code>ChatbotWidget.getState()</Code>로 현재
              상태를 확인할 수 있습니다.
            </li>
            <li>
              동작 로그가 필요하면 스크립트에 <Code>data-debug="true"</Code>를
              붙이세요. 기본값에서는 콘솔에 아무것도 출력하지 않습니다.
            </li>
          </ul>
        </section>

        {/* 주의사항 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            주의사항
          </h2>
          <ul className="space-y-3 text-gray-700 list-disc list-inside">
            <li>
              <Code>loader.js</Code>는 반드시 <strong>HTTPS 환경</strong>에서
              사용하세요
            </li>
            <li>
              스크립트를 한 페이지에 두 번 넣어도 위젯은 하나만 남습니다. 마지막
              스크립트의 설정이 적용됩니다
            </li>
            <li>
              최신 버전을 받기 위해 <Code>no-cache</Code>를 권장합니다
            </li>
            <li>
              CSP(Content-Security-Policy)가 강한 사이트에서는{" "}
              <Code>script-src</Code> / <Code>frame-src</Code>에 위젯 도메인
              허용이 필요할 수 있습니다.{" "}
              <DocLink to="/docs/security">Security</DocLink>에 설정 예시가
              있습니다
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
