// 위젯 유틸리티 함수

import React from "react";
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
    `#${colors.button || colors.primary || "ff4500"}`,
  );
  root.style.setProperty(
    "--color-background",
    `#${colors.background || "ffffff"}`,
  );
  root.style.setProperty("--color-text", `#${colors.text || "1e293b"}`);
  root.style.setProperty(
    "--color-text-secondary",
    `#${colors.textSecondary || "64748b"}`,
  );
  root.style.setProperty("--color-border", `#${colors.border || "e2e8f0"}`);
  root.style.setProperty(
    "--color-user-message-bg",
    `#${colors.userMessageBg || colors.primary || "ff4500"}`,
  );
  root.style.setProperty(
    "--color-assistant-message-bg",
    `#${colors.assistantMessageBg || "ffffff"}`,
  );

  console.log("CSS 변수 업데이트 완료");
}

// 마크다운 텍스트를 React 요소로 변환
export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  try {
    const parts: React.ReactNode[] = [];
    let key = 0;

    // 줄바꿈으로 분리
    const lines = text.split("\n");

    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        parts.push(React.createElement("br", { key: key++ }));
      }

      if (!line) {
        return;
      }

      // 토큰화
      const tokens: Array<{
        type: "bold" | "italic" | "code" | "text" | "header" | "url";
        content: string;
        level?: number;
        url?: string;
      }> = [];
      let i = 0;

      while (i < line.length) {
        // 헤더 처리 (줄 시작 부분에서만, #부터 ######까지)
        if (i === 0 && line[i] === "#") {
          let headerLevel = 0;
          while (i < line.length && line[i] === "#" && headerLevel < 6) {
            headerLevel++;
            i++;
          }
          // # 다음에 공백이 있어야 헤더로 인식
          if (
            headerLevel > 0 &&
            headerLevel <= 6 &&
            (i >= line.length || line[i] === " ")
          ) {
            const headerText = line.slice(i).trim();
            if (headerText) {
              tokens.push({
                type: "header",
                content: headerText,
                level: headerLevel,
              });
            }
            // 헤더는 전체 라인을 차지하므로 종료
            break;
          } else {
            // 헤더가 아니면 원래 위치로 돌아가서 일반 텍스트로 처리
            i = 0;
          }
        }
        // **볼드** 처리
        if (line.slice(i).startsWith("**")) {
          const endIndex = line.indexOf("**", i + 2);
          if (endIndex !== -1) {
            tokens.push({
              type: "bold",
              content: line.slice(i + 2, endIndex),
            });
            i = endIndex + 2;
            continue;
          } else {
            // 닫는 **를 찾지 못하면 일반 텍스트로 처리하고 ** 하나만 건너뛰기
            i += 2;
            continue;
          }
        }
        // `코드` 처리
        else if (line[i] === "`") {
          const endIndex = line.indexOf("`", i + 1);
          if (endIndex !== -1) {
            tokens.push({
              type: "code",
              content: line.slice(i + 1, endIndex),
            });
            i = endIndex + 1;
            continue;
          } else {
            // 닫는 `를 찾지 못하면 일반 텍스트로 처리하고 ` 하나만 건너뛰기
            i += 1;
            continue;
          }
        }
        // *이탤릭* 처리 (볼드가 아닌 경우)
        else if (line[i] === "*") {
          const endIndex = line.indexOf("*", i + 1);
          if (endIndex !== -1) {
            tokens.push({
              type: "italic",
              content: line.slice(i + 1, endIndex),
            });
            i = endIndex + 1;
            continue;
          } else {
            // 닫는 *를 찾지 못하면 일반 텍스트로 처리하고 * 하나만 건너뛰기
            i += 1;
            continue;
          }
        }
        // [텍스트](URL) 링크 처리
        else if (line[i] === "[") {
          const closeBracket = line.indexOf("]", i + 1);
          if (closeBracket !== -1 && line[closeBracket + 1] === "(") {
            const closeParen = line.indexOf(")", closeBracket + 2);
            if (closeParen !== -1) {
              const linkText = line.slice(i + 1, closeBracket);
              const linkUrl = line.slice(closeBracket + 2, closeParen);
              tokens.push({
                type: "url",
                content: linkText,
                url: linkUrl,
              });
              i = closeParen + 1;
              continue;
            }
          }
          // 링크 형식이 아니면 일반 텍스트로 처리
          if (tokens.length > 0 && tokens[tokens.length - 1].type === "text") {
            tokens[tokens.length - 1].content += "[";
          } else {
            tokens.push({ type: "text", content: "[" });
          }
          i++;
          continue;
        }

        // 일반 텍스트 처리
        const textStart = i;
        while (
          i < line.length &&
          !line.slice(i).startsWith("**") &&
          line[i] !== "*" &&
          line[i] !== "`" &&
          line[i] !== "["
        ) {
          i++;
        }
        if (i > textStart) {
          const textContent = line.slice(textStart, i);
          if (tokens.length > 0 && tokens[tokens.length - 1].type === "text") {
            // 이전 토큰이 텍스트면 병합
            tokens[tokens.length - 1].content += textContent;
          } else {
            tokens.push({
              type: "text",
              content: textContent,
            });
          }
        } else {
          // 텍스트를 찾지 못했지만 루프를 계속 진행하기 위해 i를 증가
          i++;
        }
      }

      // 토큰을 React 요소로 변환
      tokens.forEach((token) => {
        switch (token.type) {
          case "bold":
            parts.push(
              React.createElement("strong", { key: key++ }, token.content),
            );
            break;
          case "italic":
            parts.push(
              React.createElement("em", { key: key++ }, token.content),
            );
            break;
          case "code":
            parts.push(
              React.createElement(
                "code",
                {
                  key: key++,
                  style: {
                    backgroundColor: "var(--color-background, #f1f5f9)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.9em",
                    fontFamily: "monospace",
                  },
                },
                token.content,
              ),
            );
            break;
          case "text":
            parts.push(
              React.createElement("span", { key: key++ }, token.content),
            );
            break;
          case "url":
            parts.push(
              React.createElement(
                "a",
                {
                  key: key++,
                  href: token.url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  style: {
                    color: "var(--color-primary, #df3326)",
                    textDecoration: "underline",
                  },
                },
                token.content,
              ),
            );
            break;
          case "header": {
            const level = token.level || 3;
            const tagName = `h${level}` as
              | "h1"
              | "h2"
              | "h3"
              | "h4"
              | "h5"
              | "h6";
            // 레벨에 따른 폰트 크기 설정
            const fontSizeMap: Record<number, string> = {
              1: "1.5em",
              2: "1.3em",
              3: "1.1em",
              4: "1em",
              5: "0.9em",
              6: "0.8em",
            };
            parts.push(
              React.createElement(
                tagName,
                {
                  key: key++,
                  style: {
                    fontSize: fontSizeMap[level] || "1.1em",
                    fontWeight: "bold",
                    marginTop: level <= 2 ? "0.6em" : "0.4em",
                    marginBottom: level <= 2 ? "0.2em" : "0.15em",
                    color: "var(--color-text, #1e293b)",
                  },
                },
                token.content,
              ),
            );
            break;
          }
          default:
            parts.push(
              React.createElement("span", { key: key++ }, token.content),
            );
            break;
        }
      });
    });

    return React.createElement(React.Fragment, null, ...parts);
  } catch (error) {
    console.error("Markdown 변환 오류:", error);
    return text;
  }
}
