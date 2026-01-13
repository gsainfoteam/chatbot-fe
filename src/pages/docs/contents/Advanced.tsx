import CodeBlock from "../../../components/CodeBlock";

export default function Advanced() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Advanced Topics</h1>
      <p className="text-lg text-gray-600 mb-8">
        고급 사용법과 최적화 팁을 알아보세요.
      </p>

      <div className="space-y-12">
        {/* 동적 색상 변경 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            동적 색상 변경
          </h2>
          <p className="text-gray-700 mb-4">
            위젯이 로드된 후에도 JavaScript API를 사용하여 색상을 동적으로
            변경할 수 있습니다. 이는 사용자 설정, 테마 변경, 또는 시간대에 따른
            색상 변경 등에 유용합니다.
          </p>
          <CodeBlock
            code={`// 위젯이 준비되면 색상 변경
ChatbotWidget.on("onReady", () => {
  ChatbotWidget.updateColors({
    primary: "3b82f6",
    button: "2563eb",
    background: "ffffff",
    text: "1e293b",
    textSecondary: "64748b",
    border: "e2e8f0",
    userMessageBg: "3b82f6",
    assistantMessageBg: "ffffff"
  });
});`}
            language="javascript"
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900">
              💡 <strong>팁:</strong> 색상 값은{" "}
              <code className="bg-blue-100 px-1 rounded">#</code> 없이 6자리 hex
              코드로 입력하세요.
            </p>
          </div>
        </section>

        {/* 커스텀 이벤트 처리 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            커스텀 이벤트 처리
          </h2>
          <p className="text-gray-700 mb-4">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              ChatbotWidget.on()
            </code>{" "}
            외에도 브라우저의 네이티브{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              CustomEvent
            </code>
            를 사용할 수 있습니다.
          </p>
          <CodeBlock
            code={`// CustomEvent 방식 사용
window.addEventListener("chatbot:onOpen", (event) => {
  console.log("위젯 열림:", event.detail);
  // event.detail에는 { widgetKey, pageUrl } 같은 데이터가 포함됩니다
});

window.addEventListener("chatbot:onMessage", (event) => {
  console.log("메시지 이벤트:", event.detail);
  // event.detail에는 { message, role } 같은 데이터가 포함됩니다
});

// 이벤트 리스너 제거
const handler = (event) => {
  console.log("이벤트 발생:", event.detail);
};
window.addEventListener("chatbot:onOpen", handler);
// 나중에 제거
window.removeEventListener("chatbot:onOpen", handler);`}
            language="javascript"
          />
        </section>

        {/* 위젯 상태 관리 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            위젯 상태 관리
          </h2>
          <p className="text-gray-700 mb-4">
            위젯의 현재 상태를 확인하고 관리하는 방법입니다.
          </p>
          <CodeBlock
            code={`// 위젯이 준비되었는지 확인
if (ChatbotWidget.isReady()) {
  console.log("위젯이 준비되었습니다");
}

// 위젯이 열려있는지 확인
if (ChatbotWidget.isOpen()) {
  console.log("위젯이 현재 열려있습니다");
}

// 설정 정보 가져오기
const config = ChatbotWidget.getConfig();
console.log("위젯 설정:", config);
// {
//   widgetKey: "wk_live_abc123",
//   position: "right",
//   colors: { primary: "df3326", ... },
//   layout: { width: 360, height: 520, ... }
// }

// 상태 변화 감지
ChatbotWidget.on("onOpen", () => {
  // 위젯이 열릴 때 실행할 코드
  console.log("위젯이 열렸습니다");
});

ChatbotWidget.on("onClose", () => {
  // 위젯이 닫힐 때 실행할 코드
  console.log("위젯이 닫혔습니다");
});`}
            language="javascript"
          />
        </section>

        {/* 성능 최적화 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            성능 최적화
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                1. 지연 로딩 (Lazy Loading)
              </h3>
              <p className="text-gray-700 mb-3">
                사용자가 페이지 하단으로 스크롤하거나 특정 조건이 만족될 때만
                위젯을 로드할 수 있습니다.
              </p>
              <CodeBlock
                code={`// Intersection Observer를 사용한 지연 로딩
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // 뷰포트에 들어왔을 때 위젯 로드
      const script = document.createElement('script');
      script.src = 'https://chatbot.gistory.me/loader.js';
      script.setAttribute('data-widget-key', 'YOUR_WIDGET_KEY');
      document.body.appendChild(script);
      observer.disconnect();
    }
  });
});

// 페이지 하단에 마커 요소 추가
const marker = document.createElement('div');
marker.id = 'chatbot-load-trigger';
document.body.appendChild(marker);
observer.observe(marker);`}
                language="javascript"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                2. 이벤트 리스너 최적화
              </h3>
              <p className="text-gray-700 mb-3">
                불필요한 이벤트 리스너는 제거하여 메모리 사용을 최적화하세요.
              </p>
              <CodeBlock
                code={`// 이벤트 리스너를 변수에 저장
const messageHandler = (data) => {
  console.log("메시지:", data);
};

// 등록
ChatbotWidget.on("onMessage", messageHandler);

// 나중에 제거
ChatbotWidget.off("onMessage", messageHandler);

// 또는 unsubscribe 함수 사용
const unsubscribe = ChatbotWidget.on("onMessage", messageHandler);
// 사용이 끝나면
unsubscribe();`}
                language="javascript"
              />
            </div>
          </div>
        </section>

        {/* 여러 위젯 인스턴스 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            여러 위젯 키 사용
          </h2>
          <p className="text-gray-700 mb-4">
            한 페이지에 여러 위젯 키를 사용하는 것은 권장하지 않습니다. 하나의
            위젯 키에 여러 도메인을 등록하여 사용하세요.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              ⚠️ <strong>주의:</strong> 하나의 페이지에 여러 위젯 인스턴스를
              로드하면 충돌이 발생할 수 있습니다. 대신 하나의 위젯 키를 사용하고
              도메인을 여러 개 등록하세요.
            </p>
          </div>
        </section>

        {/* 접근성 고려사항 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            접근성 고려사항
          </h2>
          <p className="text-gray-700 mb-4">
            위젯은 기본적으로 접근성을 고려하여 설계되었지만, 추가적인
            고려사항이 있습니다.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>키보드 네비게이션: 위젯은 키보드로도 접근 가능합니다</li>
            <li>스크린 리더: ARIA 레이블이 자동으로 적용됩니다</li>
            <li>색상 대비: 커스터마이징 시 WCAG 가이드라인을 준수하세요</li>
            <li>포커스 관리: 위젯이 열릴 때 자동으로 포커스가 이동합니다</li>
          </ul>
        </section>

        {/* SEO 고려사항 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            SEO 고려사항
          </h2>
          <p className="text-gray-700 mb-4">
            위젯은 iframe 내에서 실행되므로 검색 엔진에 의해 인덱싱되지
            않습니다. 이는 SEO에 영향을 주지 않습니다.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              ✅ <strong>좋은 소식:</strong> 위젯은 SEO에 영향을 주지 않습니다.
              iframe 내에서 실행되므로 페이지의 메타데이터나 콘텐츠 인덱싱에
              영향을 미치지 않습니다.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
