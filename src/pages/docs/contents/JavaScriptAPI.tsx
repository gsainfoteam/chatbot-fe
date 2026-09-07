import CodeBlock from "../../../components/CodeBlock";

export default function JavaScriptAPI() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">JavaScript API</h1>
      <p className="text-lg text-gray-600 mb-8">
        위젯 설치 후 <code className="bg-gray-100 px-2 py-1 rounded text-sm">window.ChatbotWidget</code> 객체를 통해 위젯을 제어하고 이벤트를 감지할 수 있습니다.
      </p>

      <div className="space-y-8">
        {/* 위젯 제어 API */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            위젯 제어 API
          </h2>
          <CodeBlock
            code={`// 위젯 열기
ChatbotWidget.open();

// 위젯 닫기
ChatbotWidget.close();

// 토글
ChatbotWidget.toggle();

// 패널 크기 변경 (허용 범위: 320~640 x 420~720px)
ChatbotWidget.resize(420, 640);
// 모바일에서는 설정값만 변경되며, 데스크톱 레이아웃으로 전환할 때 적용됩니다.

// 자체 버튼을 사용하는 경우 기본 런처 제어
ChatbotWidget.hideLauncher();
ChatbotWidget.showLauncher();
ChatbotWidget.setLauncherVisible(false);

// 위젯 상태 확인
ChatbotWidget.isOpen(); // boolean
ChatbotWidget.isReady(); // boolean (iframe 내부 위젯 준비 여부)
ChatbotWidget.getState();
// { open, ready, generating, launcherVisible, mode, mobile }

// 설정 정보 가져오기
const config = ChatbotWidget.getConfig();
console.log(config); // { widgetKey, position, colors, ... }

// 로더 준비 시 콜백 (이미 준비됐으면 즉시 호출)
ChatbotWidget.ready((api) => api.open());

// 위젯 DOM, 리스너, 전역 객체 제거
ChatbotWidget.destroy();`}
            language="javascript"
          />
        </section>

        {/* 선언적 트리거 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            선언적 트리거
          </h2>
          <p className="text-gray-700 mb-4">
            JavaScript 호출 없이 속성만으로 페이지의 어떤 요소든 트리거로 만들 수
            있습니다. document 레벨 클릭 위임이라 나중에 렌더링된 요소에도
            동작합니다.
          </p>
          <CodeBlock
            code={`<button data-chatbot-toggle>문의하기</button>
<a href="#" data-chatbot-open>챗봇 열기</a>
<button data-chatbot-close>닫기</button>`}
            language="html"
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900">
              💡 <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">data-chatbot-toggle</code>,{" "}
              <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">data-chatbot-open</code> 요소에는 열림 상태에 맞춰{" "}
              <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">aria-expanded</code>가 자동으로 설정됩니다.
            </p>
          </div>
        </section>

        {/* 로드 전 명령 큐 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            로드 전 명령 큐
          </h2>
          <p className="text-gray-700 mb-4">
            스크립트가 로드되기 전에 호출해야 하면 배열에 명령을 쌓아 두세요. 로드
            직후 순서대로 실행됩니다.
          </p>
          <CodeBlock
            code={`<script>
  window.ChatbotWidget = window.ChatbotWidget || [];
  ChatbotWidget.push(["hideLauncher"]);
  ChatbotWidget.push(["on", "onOpen", () => console.log("opened")]);
</script>
<script src="https://chatbot.gistory.me/loader.js" data-widget-key="YOUR_WIDGET_KEY"></script>`}
            language="html"
          />
        </section>

        {/* 이벤트 훅 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            이벤트 훅
          </h2>
          <CodeBlock
            code={`// 이벤트 리스너 등록
ChatbotWidget.on("onOpen", (data) => {
  console.log("위젯이 열렸습니다", data);
});

// 이벤트 리스너 제거 (unsubscribe 함수 반환)
const unsubscribe = ChatbotWidget.on("onMessage", (data) => {
  console.log("메시지 이벤트", data);
});

// 나중에 제거
unsubscribe();

// 또는 off 메서드 사용
ChatbotWidget.off("onMessage", handler);`}
            language="javascript"
          />

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">
            사용 가능한 이벤트
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    이벤트
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    onLoad
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    로더 초기화 완료. 로드 전에는 window 이벤트{" "}
                    <code className="bg-gray-100 px-1 rounded">chatbot:onLoad</code>로
                    받고, 로드 후에는 <code className="bg-gray-100 px-1 rounded">ready()</code>를
                    쓰세요
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    onOpen
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    위젯이 열릴 때
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    onClose
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    위젯이 닫힐 때
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    onStateChange
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    열림 상태가 바뀔 때. 페이로드{" "}
                    <code className="bg-gray-100 px-1 rounded">{"{ open: boolean }"}</code>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    onReady
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    iframe 내부 위젯이 준비되었을 때
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    onMessage
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    메시지가 송수신될 때 (통합)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    onMessageSent
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    사용자가 메시지를 보낼 때
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    onMessageReceived
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    봇이 응답할 때
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 색상 동적 업데이트 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            색상 동적 업데이트
          </h2>
          <p className="text-gray-700 mb-4">
            위젯이 로드된 후에도 색상을 동적으로 변경할 수 있습니다.
          </p>
          <CodeBlock
            code={`ChatbotWidget.updateColors({
  primary: "3b82f6",
  button: "2563eb",
  background: "ffffff",
  text: "1e293b",
  textSecondary: "64748b",
  border: "e2e8f0",
  userMessageBg: "3b82f6",
  assistantMessageBg: "ffffff",
});`}
            language="javascript"
          />
          <p className="text-sm text-gray-600 mt-4">
            💡 색상 값은 <code className="bg-gray-100 px-2 py-1 rounded text-sm">#</code> 없이 6자리 hex 코드로 입력하세요.
            </p>
        </section>

        {/* CustomEvent 방식 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            CustomEvent 방식
          </h2>
          <p className="text-gray-700 mb-4">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">ChatbotWidget.on()</code> 외에도 브라우저의 <code className="bg-gray-100 px-2 py-1 rounded text-sm">CustomEvent</code>를 직접 사용할 수 있습니다.
          </p>
          <CodeBlock
            code={`window.addEventListener("chatbot:onOpen", (event) => {
  console.log("위젯 열림:", event.detail);
});

window.addEventListener("chatbot:onMessage", (event) => {
  console.log("메시지:", event.detail);
});`}
            language="javascript"
          />
        </section>
      </div>
    </div>
  );
}
