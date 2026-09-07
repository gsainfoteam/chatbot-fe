import CodeBlock from "../../../components/CodeBlock";

const Step = ({ n }: { n: number }) => (
  <span className="inline-flex items-center justify-center w-8 h-8 bg-[#df3326] text-white rounded-full text-sm font-bold mr-3">
    {n}
  </span>
);

const Code = ({ children }: { children: string }) => (
  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{children}</code>
);

// 파란 안내 박스 안에서 쓰는 코드 칩 (다른 문서 페이지의 팁 박스와 같은 스타일)
const TipCode = ({ children }: { children: string }) => (
  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">{children}</code>
);

export default function ReactIntegration() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">React 연동</h1>
      <p className="text-lg text-gray-600 mb-8">
        React, Next.js 등 컴포넌트 기반 앱에서는 스크립트 한 줄과 속성 하나로
        연동이 끝납니다. 별도 패키지 설치나 래퍼 컴포넌트가 필요하지 않습니다.
      </p>

      <div className="space-y-8">
        {/* 원리 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            어떻게 동작하나요
          </h2>
          <ul className="space-y-2 text-gray-700 list-disc list-inside">
            <li>
              위젯은 <Code>iframe</Code> 안에서 실행되고, 로더는{" "}
              <Code>Shadow DOM</Code>에 런처를 그립니다. 앱의 CSS나 상태
              관리와 충돌하지 않습니다.
            </li>
            <li>
              트리거는 <Code>document</Code> 레벨 클릭 위임으로 동작합니다.{" "}
              <Code>data-chatbot-toggle</Code> 속성이 붙은 요소가 나중에
              렌더링되거나 리렌더링되어도 그대로 동작합니다.
            </li>
            <li>
              스크립트가 두 번 삽입되면 이전 인스턴스를 정리하고 하나만
              남깁니다. <Code>StrictMode</Code>의 이중 마운트에도 안전합니다.
            </li>
          </ul>
        </section>

        {/* Step 1 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            <Step n={1} />
            스크립트 추가
          </h2>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Vite / CRA
          </h3>
          <p className="text-gray-700 mb-4">
            <Code>index.html</Code>의 <Code>&lt;body&gt;</Code> 하단에
            추가합니다. 자체 버튼을 쓸 계획이면{" "}
            <Code>data-launcher="none"</Code>으로 기본 런처를 끄세요.
          </p>
          <CodeBlock
            code={`<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>

  <!-- 챗봇 위젯 -->
  <script
    src="https://chatbot.gistory.me/loader.js"
    data-widget-key="YOUR_WIDGET_KEY"
    data-launcher="none"
  ></script>
</body>`}
            language="html"
          />

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Next.js (App Router)
          </h3>
          <p className="text-gray-700 mb-4">
            루트 레이아웃에서 <Code>next/script</Code>를 사용합니다.{" "}
            <Code>data-*</Code> 속성은 그대로 전달됩니다.
          </p>
          <CodeBlock
            code={`// app/layout.tsx
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Script
          src="https://chatbot.gistory.me/loader.js"
          strategy="afterInteractive"
          data-widget-key="YOUR_WIDGET_KEY"
          data-launcher="none"
        />
      </body>
    </html>
  );
}`}
            language="tsx"
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900">
              💡 Pages Router는 <TipCode>pages/_app.tsx</TipCode>에 같은{" "}
              <TipCode>&lt;Script&gt;</TipCode>를 두면 됩니다.
            </p>
          </div>
        </section>

        {/* Step 2 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            <Step n={2} />
            트리거 붙이기
          </h2>
          <p className="text-gray-700 mb-4">
            열고 싶은 요소에 속성 하나만 추가하면 됩니다. 이벤트 핸들러나{" "}
            <Code>window</Code> 접근이 필요 없습니다.
          </p>
          <CodeBlock
            code={`export function Header() {
  return (
    <header>
      <nav>...</nav>
      <button type="button" data-chatbot-toggle>
        문의하기
      </button>
    </header>
  );
}`}
            language="tsx"
          />
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    속성
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    동작
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-chatbot-toggle
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    열림/닫힘 토글. 열림 상태에 맞춰{" "}
                    <Code>aria-expanded</Code>가 자동으로 붙습니다
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-chatbot-open
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">열기</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    data-chatbot-close
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">닫기</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900">
              💡 기본 런처를 그대로 두고 트리거를 추가로 달아도 됩니다. 둘 다 같은
              패널을 엽니다.
            </p>
          </div>
        </section>

        {/* Step 3 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            <Step n={3} />
            상태를 컴포넌트에서 쓰기 (선택)
          </h2>
          <p className="text-gray-700 mb-4">
            열림 여부를 UI에 반영하거나 코드로 열고 닫아야 하면 아래 훅을 프로젝트에
            복사해 쓰세요. 로더가 아직 로드되지 않았을 때는{" "}
            <Code>chatbot:onLoad</Code> 이벤트를 기다렸다가 구독합니다.
          </p>
          <CodeBlock
            code={`// src/hooks/useChatbot.ts
import { useCallback, useEffect, useState } from "react";

function getApi() {
  const api = window.ChatbotWidget;
  return api && !Array.isArray(api) ? api : null;
}

export function useChatbot() {
  const [isLoaded, setIsLoaded] = useState(() => getApi() !== null);
  const [isOpen, setIsOpen] = useState(() => getApi()?.isOpen() ?? false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const subscribe = () => {
      const api = getApi();
      if (!api) return;
      setIsLoaded(true);
      setIsOpen(api.isOpen());
      unsubscribe = api.on("onStateChange", ({ open }) => setIsOpen(open));
    };

    if (getApi()) subscribe();
    else window.addEventListener("chatbot:onLoad", subscribe, { once: true });

    return () => {
      window.removeEventListener("chatbot:onLoad", subscribe);
      unsubscribe?.();
    };
  }, []);

  return {
    isLoaded,
    isOpen,
    open: useCallback(() => getApi()?.open(), []),
    close: useCallback(() => getApi()?.close(), []),
    toggle: useCallback(() => getApi()?.toggle(), []),
  };
}`}
            language="tsx"
          />
          <p className="text-gray-700 mt-6 mb-4">사용 예시:</p>
          <CodeBlock
            code={`function SupportButton() {
  const { isLoaded, isOpen, toggle } = useChatbot();

  return (
    <button type="button" onClick={toggle} disabled={!isLoaded}>
      {isOpen ? "닫기" : "문의하기"}
    </button>
  );
}`}
            language="tsx"
          />
        </section>

        {/* TypeScript */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            TypeScript 타입 선언
          </h2>
          <p className="text-gray-700 mb-4">
            <Code>window.ChatbotWidget</Code>에 타입을 붙이려면 아래 선언 파일을
            프로젝트에 추가하세요. 로드 전에는 명령 큐(배열)일 수 있어 유니온으로
            선언합니다.
          </p>
          <CodeBlock
            code={`// src/types/chatbot-widget.d.ts
type ChatbotEvent =
  | "onLoad"
  | "onReady"
  | "onOpen"
  | "onClose"
  | "onStateChange"
  | "onMessage"
  | "onMessageSent"
  | "onMessageReceived";

interface ChatbotWidgetApi {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  isReady(): boolean;
  getState(): {
    open: boolean;
    ready: boolean;
    generating: boolean;
    launcherVisible: boolean;
    mode: "corner" | "center";
    mobile: boolean;
  };
  ready(callback: (api: ChatbotWidgetApi) => void): ChatbotWidgetApi;
  resize(width: number, height: number): { width: number; height: number };
  showLauncher(): void;
  hideLauncher(): void;
  setLauncherVisible(visible: boolean): void;
  updateColors(colors: Record<string, string>): void;
  on(event: ChatbotEvent, handler: (data: any) => void): () => void;
  off(event: ChatbotEvent, handler: (data: any) => void): void;
  destroy(): void;
}

declare global {
  interface Window {
    ChatbotWidget?: ChatbotWidgetApi | unknown[];
  }
}

export {};`}
            language="typescript"
          />
        </section>

        {/* 동적 로딩 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            컴포넌트에서 동적으로 로드하기 (선택)
          </h2>
          <p className="text-gray-700 mb-4">
            특정 페이지에서만 위젯을 띄우거나 위젯 키를 런타임에 정해야 하면
            컴포넌트 안에서 스크립트를 삽입하고, 언마운트 시{" "}
            <Code>destroy()</Code>로 정리합니다.
          </p>
          <CodeBlock
            code={`// src/components/ChatbotLoader.tsx
import { useEffect } from "react";

type Props = {
  widgetKey: string;
  launcher?: "icon" | "pill" | "none";
  position?: "right" | "left";
};

export function ChatbotLoader({ widgetKey, launcher = "icon", position = "right" }: Props) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://chatbot.gistory.me/loader.js";
    script.dataset.widgetKey = widgetKey;
    script.dataset.launcher = launcher;
    script.dataset.position = position;
    document.body.appendChild(script);

    return () => {
      const api = window.ChatbotWidget;
      if (api && !Array.isArray(api)) api.destroy();
      script.remove();
    };
  }, [widgetKey, launcher, position]);

  return null;
}`}
            language="tsx"
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900">
              💡 <TipCode>StrictMode</TipCode>에서 effect가 두 번 실행되어도 로더가
              중복 인스턴스를 정리하므로 런처는 하나만 남습니다.
            </p>
          </div>
        </section>

        {/* 이벤트 활용 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            이벤트 활용
          </h2>
          <p className="text-gray-700 mb-4">
            메시지 송수신 같은 이벤트를 분석 도구에 연결할 수 있습니다.{" "}
            <Code>on()</Code>은 해제 함수를 반환하므로 effect의 cleanup으로
            그대로 넘기면 됩니다.
          </p>
          <CodeBlock
            code={`useEffect(() => {
  const api = window.ChatbotWidget;
  if (!api || Array.isArray(api)) return;

  return api.on("onMessageSent", ({ message }) => {
    gtag("event", "chatbot_message_sent", { length: message.length });
  });
}, []);`}
            language="tsx"
          />
          <p className="text-sm text-gray-600 mt-4">
            전체 이벤트 목록은{" "}
            <a href="/docs/api/javascript" className="text-[#df3326] hover:underline">
              JavaScript API
            </a>
            를 참고하세요.
          </p>
        </section>

        {/* 주의사항 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            알아두면 좋은 점
          </h2>
          <ul className="space-y-3 text-gray-700 list-disc list-inside">
            <li>
              <strong>SSR</strong>: <Code>window</Code>는 브라우저에서만
              존재합니다. 로더 접근은 항상 <Code>useEffect</Code> 안에서
              하세요.
            </li>
            <li>
              <strong>라우트 이동</strong>: SPA에서 URL이 바뀌어도 위젯은 그대로
              유지되고, 패널을 열 때마다 현재 URL이 위젯에 전달됩니다.
            </li>
            <li>
              <strong>로드 순서</strong>: <Code>index.html</Code>에 넣은
              스크립트는 보통 앱보다 먼저 실행되지만 보장되지는 않습니다.{" "}
              <Code>window.ChatbotWidget</Code>을 바로 호출하기보다 위 훅처럼{" "}
              <Code>chatbot:onLoad</Code>를 기다리거나 선언적 트리거를 쓰세요.
            </li>
            <li>
              <strong>패널 위치</strong>: 헤더처럼 모서리와 먼 곳에 트리거를 두면{" "}
              <Code>data-mode="center"</Code>로 화면 중앙 모달 형태가 더
              자연스럽습니다.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
