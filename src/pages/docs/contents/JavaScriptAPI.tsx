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

// 위젯 상태 확인
ChatbotWidget.isOpen(); // boolean
ChatbotWidget.isReady(); // boolean

// 설정 정보 가져오기
const config = ChatbotWidget.getConfig();
console.log(config); // { widgetKey, position, colors, ... }`}
            language="javascript"
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
                    onReady
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    위젯이 준비되었을 때
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
