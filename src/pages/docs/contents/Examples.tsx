import CodeBlock from "../../../components/CodeBlock";

export default function Examples() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Examples</h1>
      <p className="text-lg text-gray-600 mb-8">
        다양한 상황에서 사용할 수 있는 예제들을 확인하세요.
      </p>

      <div className="space-y-12">
        {/* 기본 사용 예제 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            기본 사용 예제
          </h2>
          <p className="text-gray-700 mb-4">
            가장 간단한 형태로 위젯을 설치하는 방법입니다.
          </p>
          <CodeBlock
            code={`<script
  src="https://widget.yourdomain.com/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>`}
            language="html"
          />
        </section>

        {/* 커스터마이징 예제 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            커스터마이징 예제
          </h2>
          <p className="text-gray-700 mb-4">
            색상과 레이아웃을 브랜드에 맞게 커스터마이징하는 예제입니다.
          </p>
          <CodeBlock
            code={`<script
  src="https://widget.yourdomain.com/loader.js"
  data-widget-key="wk_live_abc123"
  data-position="right"
  data-primary-color="3b82f6"
  data-button-color="2563eb"
  data-user-message-bg="3b82f6"
  data-text-color="1e293b"
  data-width="380"
  data-height="560"
></script>`}
            language="html"
          />
        </section>

        {/* 이벤트 추적 예제 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Google Analytics 연동 예제
          </h2>
          <p className="text-gray-700 mb-4">
            위젯 이벤트를 Google Analytics로 전송하는 예제입니다.
          </p>
          <CodeBlock
            code={`<script
  src="https://widget.yourdomain.com/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>
<script>
  // 위젯이 준비되었을 때
  ChatbotWidget.on("onReady", () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'chatbot_ready', {
        'event_category': 'Chatbot',
        'event_label': 'Widget Ready'
      });
    }
  });

  // 위젯이 열릴 때
  ChatbotWidget.on("onOpen", () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'chatbot_open', {
        'event_category': 'Chatbot',
        'event_label': 'Widget Opened'
      });
    }
  });

  // 메시지가 전송될 때
  ChatbotWidget.on("onMessageSent", (data) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'chatbot_message_sent', {
        'event_category': 'Chatbot',
        'event_label': 'Message Sent',
        'value': data.message.text.length
      });
    }
  });
</script>`}
            language="html"
          />
        </section>

        {/* 프로그래밍 방식 제어 예제 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            프로그래밍 방식 제어 예제
          </h2>
          <p className="text-gray-700 mb-4">
            JavaScript를 사용하여 위젯을 동적으로 제어하는 예제입니다.
          </p>
          <CodeBlock
            code={`<script
  src="https://widget.yourdomain.com/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>
<script>
  // 페이지가 로드된 후 위젯이 준비될 때까지 대기
  function waitForWidget() {
    return new Promise((resolve) => {
      if (ChatbotWidget.isReady()) {
        resolve();
      } else {
        ChatbotWidget.on("onReady", resolve);
      }
    });
  }

  // 위젯이 준비되면 자동으로 열기
  waitForWidget().then(() => {
    // 3초 후 자동으로 위젯 열기
    setTimeout(() => {
      ChatbotWidget.open();
    }, 3000);
  });

  // 특정 버튼 클릭 시 위젯 열기
  document.getElementById('open-chatbot-btn').addEventListener('click', () => {
    if (ChatbotWidget.isReady()) {
      ChatbotWidget.open();
    }
  });
</script>`}
            language="html"
          />
        </section>

        {/* 동적 색상 변경 예제 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            동적 색상 변경 예제
          </h2>
          <p className="text-gray-700 mb-4">
            사용자 액션에 따라 위젯 색상을 동적으로 변경하는 예제입니다.
          </p>
          <CodeBlock
            code={`<script>
  // 위젯이 준비되면 테마 변경
  ChatbotWidget.on("onReady", () => {
    // 다크 모드 감지
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (prefersDark) {
      ChatbotWidget.updateColors({
        primary: "3b82f6",
        button: "2563eb",
        background: "1e293b",
        text: "f1f5f9",
        textSecondary: "cbd5e1",
        border: "334155",
        userMessageBg: "3b82f6",
        assistantMessageBg: "334155"
      });
    }

    // 테마 변경 감지
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (e.matches) {
        // 다크 모드 색상 적용
        ChatbotWidget.updateColors({
          primary: "3b82f6",
          background: "1e293b",
          text: "f1f5f9",
          // ...
        });
      } else {
        // 라이트 모드 색상 적용
        ChatbotWidget.updateColors({
          primary: "df3326",
          background: "ffffff",
          text: "1e293b",
          // ...
        });
      }
    });
  });
</script>`}
            language="javascript"
          />
        </section>

        {/* 조건부 로딩 예제 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            조건부 로딩 예제
          </h2>
          <p className="text-gray-700 mb-4">
            특정 조건에서만 위젯을 로드하는 예제입니다.
          </p>
          <CodeBlock
            code={`<script>
  // 특정 경로에서만 위젯 로드
  const allowedPaths = ['/support', '/help', '/contact'];
  const currentPath = window.location.pathname;

  if (allowedPaths.includes(currentPath)) {
    const script = document.createElement('script');
    script.src = 'https://widget.yourdomain.com/loader.js';
    script.setAttribute('data-widget-key', 'YOUR_WIDGET_KEY');
    document.body.appendChild(script);
  }

  // 또는 특정 사용자에게만 표시
  const userRole = getUserRole(); // 사용자 정의 함수
  if (userRole === 'premium' || userRole === 'admin') {
    const script = document.createElement('script');
    script.src = 'https://widget.yourdomain.com/loader.js';
    script.setAttribute('data-widget-key', 'YOUR_WIDGET_KEY');
    document.body.appendChild(script);
  }
</script>`}
            language="javascript"
          />
        </section>
      </div>
    </div>
  );
}
