// 위젯 유틸리티 함수

import type { ColorTheme } from "./types";

/**
 * 고유 ID 생성
 */
export function uid(): string {
  return Math.random().toString(36).slice(2);
}

/**
 * CSS 변수로 색상 적용
 */
export function applyColorTheme(colors: ColorTheme): void {
  const root = document.documentElement;
  console.log("applyColorTheme 호출:", colors);

  // 모든 색상을 항상 업데이트 (값이 없어도 기본값 사용)
  root.style.setProperty("--color-primary", `#${colors.primary || "ff4500"}`);
  root.style.setProperty(
    "--color-button",
    `#${colors.button || colors.primary || "ff4500"}`
  );
  root.style.setProperty(
    "--color-background",
    `#${colors.background || "ffffff"}`
  );
  root.style.setProperty("--color-text", `#${colors.text || "1e293b"}`);
  root.style.setProperty(
    "--color-text-secondary",
    `#${colors.textSecondary || "64748b"}`
  );
  root.style.setProperty("--color-border", `#${colors.border || "e2e8f0"}`);
  root.style.setProperty(
    "--color-user-message-bg",
    `#${colors.userMessageBg || colors.primary || "ff4500"}`
  );
  root.style.setProperty(
    "--color-assistant-message-bg",
    `#${colors.assistantMessageBg || "ffffff"}`
  );

  console.log("CSS 변수 업데이트 완료");
}

