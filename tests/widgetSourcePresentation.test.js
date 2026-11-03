import test from "node:test";
import assert from "node:assert/strict";
import {
  externalLinkInfo,
  citationSourceFor,
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
