// 홈 채팅이 사용할 위젯 키.
// 우선순위: VITE_WIDGET_KEY 환경 변수 → index.html의 loader.js 스크립트 data-widget-key.
// chatbot.gistory.me 자체도 하나의 위젯 설치처이므로 같은 키를 공유합니다.

let cachedKey: string | null | undefined;

export function getWidgetKey(): string | null {
  if (cachedKey !== undefined) return cachedKey;

  const fromEnv = import.meta.env.VITE_WIDGET_KEY as string | undefined;
  if (fromEnv && fromEnv.trim()) {
    cachedKey = fromEnv.trim();
    return cachedKey;
  }

  const script = document.querySelector<HTMLScriptElement>(
    "script[data-widget-key]",
  );
  const fromScript = script?.dataset.widgetKey?.trim();
  cachedKey = fromScript || null;
  return cachedKey;
}
