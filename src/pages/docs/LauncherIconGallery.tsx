import type { CSSProperties } from "react";
import {
  DEFAULT_LAUNCHER_ICON,
  LAUNCHER_ICONS,
  LAUNCHER_ICON_ALIASES,
} from "./launcherIcons.generated";

// 아이콘 키별 설명. 키 목록 자체는 loader.js 에서 생성된 launcherIcons.generated.ts 를 따른다.
const LABELS: Record<string, string> = {
  "popo-headset": "마스코트 상담원",
  "popo-headset-chat": "마스코트 + 말풍선",
  "chat-sparkle": "말풍선 + 스파클",
  chat: "말풍선 + 점 3개",
  "chat-text": "말풍선 + 텍스트 줄",
  chats: "말풍선 두 개",
  "chat-search": "말풍선 + 돋보기",
  "chat-question": "말풍선 + 물음표",
  sparkle: "스파클",
  search: "돋보기",
  question: "물음표",
  robot: "로봇",
  headset: "헤드셋",
  logo: "G 로고",
};

// loader.js 의 런처 크기 규칙과 동일 (마스코트 33px, 로고 28px, 그 외 30px)
function iconSize(key: string) {
  if (key.startsWith("popo")) return 33;
  if (key === "logo") return 28;
  return 30;
}

// 기본 아이콘을 맨 앞에 두고 나머지는 loader.js 정의 순서
const ORDERED = [...LAUNCHER_ICONS].sort(
  (a, b) =>
    Number(b.key === DEFAULT_LAUNCHER_ICON) -
    Number(a.key === DEFAULT_LAUNCHER_ICON),
);

const BRAND = "#df3326";

// loader.js 의 런처 버튼 스타일을 미리보기용으로 축약한 것
const buttonStyle: CSSProperties = {
  ["--c" as string]: BRAND,
  width: 56,
  height: 56,
  borderRadius: 22,
  color: "#ffffff",
  background: `linear-gradient(180deg, color-mix(in srgb, ${BRAND} 82%, #fff) 0%, color-mix(in srgb, ${BRAND} 93%, #000) 100%)`,
  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${BRAND} 86%, #fff), 0 2px 4px rgba(15,23,42,.10), 0 10px 24px -8px color-mix(in srgb, ${BRAND} 45%, transparent)`,
};

export default function LauncherIconGallery() {
  const aliasEntries = Object.entries(LAUNCHER_ICON_ALIASES);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 not-prose">
        {ORDERED.map(({ key, svg }) => {
          const size = iconSize(key);
          const isDefault = key === DEFAULT_LAUNCHER_ICON;
          return (
            <div
              key={key}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-4"
            >
              <span
                className="inline-flex shrink-0 items-center justify-center overflow-hidden"
                style={buttonStyle}
                aria-hidden="true"
              >
                <span
                  className="block [&>svg]:block"
                  style={{ width: size, height: size }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </span>
              <code className="text-xs font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                {key}
              </code>
              <span className="text-xs text-gray-600 text-center">
                {LABELS[key] ?? key}
                {isDefault && (
                  <span className="ml-1 rounded-full bg-[#df3326]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#df3326]">
                    기본
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-gray-600 mt-4">
        별칭도 받습니다:{" "}
        {aliasEntries.map(([alias, target], i) => (
          <span key={alias}>
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
              {alias}
            </code>
            {" → "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
              {target}
            </code>
            {i < aliasEntries.length - 1 ? ", " : ""}
          </span>
        ))}
        . 모르는 값은{" "}
        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
          {DEFAULT_LAUNCHER_ICON}
        </code>
        으로 처리됩니다.
      </p>
    </div>
  );
}
