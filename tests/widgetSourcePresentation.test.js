import test from "node:test";
import assert from "node:assert/strict";
import {
  externalLinkInfo,
  citationSourceFor,
  compactCitations,
} from "../src/features/widget/sourcePresentation.ts";

test("Ziggle 로고는 실제 공지 URL에만 표시한다", () => {
  assert.equal(
    externalLinkInfo("https://ziggle.gistory.me/notice/42").isZiggleNotice,
    true,
  );
  for (const url of [
    "https://ziggle.gistory.me.evil.test/notice/42",
    "https://example.com/notice/42",
    "https://ziggle.gistory.me/profile",
  ]) {
    assert.equal(externalLinkInfo(url).isZiggleNotice, false);
  }
});

test("파비콘은 검색 경로·쿼리 없이 해당 사이트 루트에서 요청한다", () => {
  assert.equal(
    externalLinkInfo("https://www.gist.ac.kr/news?q=private#top").faviconUrl,
    "https://www.gist.ac.kr/favicon.ico",
  );
});

test("반복되는 문장 끝 출처 제목만 숨기고 문장 일부나 다른 링크 텍스트는 보존한다", () => {
  const source = {
    kind: "notice",
    id: "42",
    title: "[STARTUP NIGHT] 참가 안내",
    url: "https://ziggle.gistory.me/notice/42",
  };
  const anchor = (label = "STARTUP NIGHT 참가 안내") => ({
    tagName: "a",
    properties: { href: source.url },
    children: [{ value: label }],
  });
  const first = anchor(),
    trailing = anchor(),
    subject = anchor(),
    meaningful = anchor("공지 원문");
  const tree = {
    children: [
      { tagName: "p", children: [{ value: "신청 안내 " }, first] },
      { tagName: "li", children: [{ value: "대상: 대학생 " }, trailing] },
      {
        tagName: "p",
        children: [subject, { value: "에 따르면 신청 가능합니다." }],
      },
      { tagName: "p", children: [meaningful] },
    ],
  };
  compactCitations([source])()(tree);
  assert.equal(first.properties.dataCitationHidden, false);
  assert.equal(trailing.properties.dataCitationHidden, true);
  assert.equal(subject.properties.dataCitationHidden, false);
  assert.equal(meaningful.properties.dataCitationHidden, false);
  assert.equal(trailing.children[0].value, "STARTUP NIGHT 참가 안내");
});

test("연속된 웹 인용이 한도를 넘으면 나머지 제목도 숨기고 출처 데이터는 보존한다", () => {
  const sources = Array.from({ length: 5 }, (_, id) => ({
    kind: "web",
    id: String(id),
    title: `site${id}.test`,
    url: `https://site${id}.test/article`,
    official: false,
  }));
  const links = sources.map((source) => ({
    tagName: "a",
    properties: { href: source.url },
    children: [{ value: source.title }],
  }));
  compactCitations(sources)()({
    tagName: "p",
    children: [{ value: "사례입니다." }, ...links],
  });
  assert.deepEqual(
    links.map((link) => link.properties.dataCitationHidden),
    [false, false, false, true, true],
  );
  assert.equal(sources.length, 5);
});

test("표시용 경로만 디코딩하고 링크의 쿼리·해시는 변경하지 않는다", () => {
  const href = "https://www.gist.ac.kr/startup/%EC%95%88%EB%82%B4?q=a#apply";
  const link = externalLinkInfo(href);
  assert.equal(link.href, href);
  assert.equal(link.hostname, "gist.ac.kr");
  assert.equal(link.path, "startup › 안내");
  assert.equal(externalLinkInfo("https://example.com/%XX").path, "%XX");
});

test("안전하지 않은 URL 및 인증정보가 포함된 URL은 렌더하지 않는다", () => {
  for (const url of [
    undefined,
    "javascript:alert(1)",
    "data:text/html,x",
    "/notice/42",
    "https://user:password@ziggle.gistory.me/notice/42",
  ])
    assert.equal(externalLinkInfo(url), null);
});

test("웹 인용은 등록된 정확한 URL만 연결하고 같은 도메인의 다른 페이지를 추정하지 않는다", () => {
  const source = {
    kind: "web",
    id: "1",
    title: "gist.ac.kr",
    url: "https://www.gist.ac.kr/?page=1",
    official: true,
  };
  assert.equal(citationSourceFor(source.url, [source]), source);
  assert.equal(
    citationSourceFor("https://www.gist.ac.kr/?page=2", [source]),
    undefined,
  );
  assert.equal(
    citationSourceFor("https://www.gist.ac.kr/?page=1#other", [source]),
    undefined,
  );
  assert.equal(
    citationSourceFor("https://another.example", [source]),
    undefined,
  );
});

test("배지는 답변 전체에서 같은 출처당 한 번, 최대 세 개만 표시한다", async () => {
  const { compactCitations } =
    await import("../src/features/widget/sourcePresentation.ts");
  const urls = [42, 42, 43, 44, 45].map(
    (id) => `https://ziggle.gistory.me/notice/${id}`,
  );
  const tree = {
    children: urls.map((href) => ({
      tagName: "p",
      children: [
        {
          tagName: "a",
          properties: { href },
          children: [{ value: "본문 링크" }],
        },
      ],
    })),
  };
  const transform = compactCitations([])();
  transform(tree);
  const links = tree.children.map((p) => p.children[0]);
  assert.deepEqual(
    links.map((a) => a.properties.dataCitationQuiet),
    [false, true, false, false, true],
  );
  assert.deepEqual(
    links.map((a) => a.properties.href),
    urls,
  );
  assert.ok(links.every((a) => a.children[0].value === "본문 링크"));
  transform(tree);
  assert.deepEqual(
    links.map((a) => a.properties.dataCitationQuiet),
    [false, true, false, false, true],
  );
});

test("일반 링크는 배지 한도를 소모하지 않고 웹 출처가 늦게 와도 다시 분류한다", async () => {
  const { compactCitations } =
    await import("../src/features/widget/sourcePresentation.ts");
  const source = {
    kind: "web",
    id: "1",
    url: "https://gist.ac.kr/guide",
    title: "gist.ac.kr",
    official: true,
  };
  const tree = {
    children: [
      { tagName: "a", properties: { href: "https://example.com" } },
      { tagName: "a", properties: { href: source.url } },
      { tagName: "a", properties: { href: source.url } },
    ],
  };
  compactCitations([])()(tree);
  assert.equal(tree.children[1].properties.dataCitationQuiet, undefined);
  compactCitations([source])()(tree);
  assert.equal(tree.children[0].properties.dataCitationQuiet, undefined);
  assert.equal(tree.children[1].properties.dataCitationQuiet, false);
  assert.equal(tree.children[2].properties.dataCitationQuiet, true);
});
