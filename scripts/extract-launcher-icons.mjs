// loader.js 에 인라인된 런처 아이콘을 문서용 TS 모듈로 추출한다.
//   npm run icons:extract
// 테스트(tests/launcherIcons.test.js)가 생성 파일과 loader.js 의 동기화를 검사한다.
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loaderSource, loadWidget } from "../tests/helpers/loaderStub.js";

export const OUTPUT_PATH = new URL(
  "../src/pages/docs/launcherIcons.generated.ts",
  import.meta.url
);

function parseIconKeys(source) {
  const block = source.slice(source.indexOf("const ICONS = {"), source.indexOf("\n  };", source.indexOf("const ICONS = {")));
  const keys = [...block.matchAll(/^\s{4}"?([a-z][a-z0-9-]*)"?:/gm)].map((m) => m[1]);
  return keys.filter((k) => k !== "close");
}

function parseAliases(source) {
  const block = source.slice(source.indexOf("const ICON_ALIASES = {"), source.indexOf("};", source.indexOf("const ICON_ALIASES = {")));
  return Object.fromEntries(
    [...block.matchAll(/"?([a-z][a-z0-9-]*)"?:\s*"([a-z0-9-]+)"/g)].map((m) => [m[1], m[2]])
  );
}

function extractSvg(key) {
  const { launcher } = loadWidget({ buttonIcon: key });
  const html = launcher.innerHTML;
  const marker = `data-icon="open" data-key="${key}">`;
  const from = html.indexOf(marker) + marker.length;
  const to = html.indexOf("</span>", from);
  if (from < marker.length || to < 0) throw new Error(`icon markup not found: ${key}`);
  return html.slice(from, to);
}

export function generate() {
  const defaultIcon = /const DEFAULT_ICON = "([a-z0-9-]+)"/.exec(loaderSource)[1];
  const keys = parseIconKeys(loaderSource);
  const icons = keys.map((key) => ({ key, svg: extractSvg(key) }));
  const aliases = parseAliases(loaderSource);
  return (
    "// 이 파일은 scripts/extract-launcher-icons.mjs 가 public/loader.js 에서 생성합니다. 직접 수정하지 마세요.\n" +
    "// 갱신: npm run icons:extract\n\n" +
    `export const DEFAULT_LAUNCHER_ICON = ${JSON.stringify(defaultIcon)};\n\n` +
    `export const LAUNCHER_ICON_ALIASES: Record<string, string> = ${JSON.stringify(aliases, null, 2)};\n\n` +
    "export const LAUNCHER_ICONS: { key: string; svg: string }[] = " +
    JSON.stringify(icons, null, 2) +
    ";\n"
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const next = generate();
  let prev = "";
  try { prev = readFileSync(OUTPUT_PATH, "utf8"); } catch { /* 최초 생성 */ }
  writeFileSync(OUTPUT_PATH, next);
  console.log(prev === next ? "launcherIcons.generated.ts: 변경 없음" : "launcherIcons.generated.ts: 갱신됨");
}
