// index.html의 loader.js가 띄우는 플로팅 런처 제어.
// 홈이 그 자체로 채팅 앱이므로 채팅 화면이 떠 있는 동안에는 런처를 숨깁니다.

interface ChatbotWidgetApi {
  showLauncher?: () => void;
  hideLauncher?: () => void;
}

function getApi(): ChatbotWidgetApi | null {
  const api = (window as Window & { ChatbotWidget?: unknown }).ChatbotWidget;
  if (!api || typeof api !== "object" || Array.isArray(api)) return null;
  return api as ChatbotWidgetApi;
}

export function hideWidgetLauncher(): void {
  getApi()?.hideLauncher?.();
}

export function showWidgetLauncher(): void {
  getApi()?.showLauncher?.();
}
