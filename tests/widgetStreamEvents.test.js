import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeWidgetStream,
  parseHistoryMetadata,
  WidgetStreamError,
  extractSseData,
  parseStreamEvent,
  settleRunningSteps,
  upsertStep,
} from "../src/api/widgetStreamEvents.ts";

test("청크 경계에서 끊긴 줄은 다음 청크까지 버퍼에 남긴다", () => {
  const first = extractSseData(
    'data: {"content":"졸업하려면 "}\n\ndata: {"con',
  );
  assert.deepEqual(first.payloads, ['{"content":"졸업하려면 "}']);
  assert.equal(first.rest, 'data: {"con');

  const second = extractSseData(
    `${first.rest}tent":"130학점"}\n\ndata: [DONE]\n\n`,
  );
  assert.deepEqual(second.payloads, ['{"content":"130학점"}', "[DONE]"]);
  assert.equal(second.rest, "");
});

test("[DONE]은 JSON 파싱 전에 종료로 처리한다", () => {
  assert.deepEqual(parseStreamEvent("[DONE]"), { type: "done" });
});

test("content 이벤트", () => {
  assert.deepEqual(parseStreamEvent('{"content":"답변"}'), {
    type: "content",
    content: "답변",
  });
});

test("error 이벤트는 다른 키보다 먼저 처리한다", () => {
  assert.deepEqual(parseStreamEvent('{"error":"Failed to save message"}'), {
    type: "error",
    error: "Failed to save message",
  });
});

test("step 이벤트: 선택 필드 유지", () => {
  const event = parseStreamEvent(
    JSON.stringify({
      type: "step",
      id: "r1_call_a",
      kind: "search_notices",
      label: "Ziggle 공지 1개를 불러왔어요",
      status: "done",
      thought: "공지에서 확인해 볼게요",
      resultCount: 1,
    }),
  );
  assert.deepEqual(event, {
    type: "step",
    step: {
      id: "r1_call_a",
      kind: "search_notices",
      label: "Ziggle 공지 1개를 불러왔어요",
      status: "done",
      thought: "공지에서 확인해 볼게요",
      resultCount: 1,
    },
  });
});

test("step 이벤트: 모르는 kind도 label로 표시할 수 있게 통과시킨다", () => {
  const event = parseStreamEvent(
    '{"type":"step","id":"r1_w","kind":"search_web","label":"웹을 찾고 있어요","status":"running"}',
  );
  assert.equal(event?.type, "step");
  assert.equal(event.step.kind, "search_web");
  assert.equal("thought" in event.step, false);
});

test("step 이벤트: 필수 필드가 없거나 status가 잘못되면 무시한다", () => {
  assert.equal(
    parseStreamEvent('{"type":"step","label":"x","status":"running"}'),
    null,
  );
  assert.equal(
    parseStreamEvent('{"type":"step","id":"a","label":"x","status":"stopped"}'),
    null,
  );
});

test("sources 이벤트: http(s)가 아닌 url은 걸러낸다", () => {
  const event = parseStreamEvent(
    JSON.stringify({
      type: "sources",
      sources: [
        {
          kind: "notice",
          id: "223132",
          title: "[학사] 국가장학금 안내",
          url: "https://ziggle.gistory.me/notice/223132",
        },
        { kind: "notice", id: "1", title: "x", url: "javascript:alert(1)" },
      ],
    }),
  );
  assert.deepEqual(event, {
    type: "sources",
    sources: [
      {
        kind: "notice",
        id: "223132",
        title: "[학사] 국가장학금 안내",
        url: "https://ziggle.gistory.me/notice/223132",
      },
    ],
  });
});

test("resources 이벤트", () => {
  const event = parseStreamEvent(
    '{"type":"resources","resources":[{"path":"a.pdf","formats":["pdf"],"url":"a.pdf"}]}',
  );
  assert.equal(event?.type, "resources");
  assert.equal(event.resources.length, 1);
});

test("모르는 이벤트는 무시하고 깨진 JSON은 프로토콜 오류", () => {
  assert.equal(parseStreamEvent('{"type":"heartbeat"}'), null);
  assert.throws(() => parseStreamEvent('{"content":'), { kind: "protocol" });
});

test("upsertStep: 같은 id는 덮어쓰고 처음 본 순서를 유지한다", () => {
  const research = {
    id: "research",
    kind: "research",
    label: "찾는 중",
    status: "running",
  };
  const a = {
    id: "a",
    kind: "search_documents",
    label: "a 찾는 중",
    status: "running",
  };
  const b = {
    id: "b",
    kind: "search_notices",
    label: "b 찾는 중",
    status: "running",
  };

  let steps = [research, a, b].reduce(upsertStep, []);
  // 병렬 호출: b가 먼저 끝나도 순서는 그대로
  steps = upsertStep(steps, { ...b, label: "b 완료", status: "done" });
  steps = upsertStep(steps, { ...a, label: "a 완료", status: "done" });

  assert.deepEqual(
    steps.map((s) => `${s.id}:${s.status}`),
    ["research:running", "a:done", "b:done"],
  );
  assert.equal(steps[2].label, "b 완료");
});

test("settleRunningSteps: running만 닫고, 닫을 게 없으면 같은 배열을 돌려준다", () => {
  const steps = [
    { id: "research", kind: "research", label: "찾는 중", status: "running" },
    { id: "a", kind: "search_documents", label: "a 완료", status: "done" },
  ];
  const settled = settleRunningSteps(steps, "stopped");
  assert.deepEqual(
    settled.map((s) => s.status),
    ["stopped", "done"],
  );
  assert.equal(settleRunningSteps(settled, "failed"), settled);
});

test("web_sources 이벤트: official을 유지하고, 없으면 비공식으로 본다", () => {
  const event = parseStreamEvent(
    JSON.stringify({
      type: "web_sources",
      sources: [
        {
          kind: "web",
          id: "https://dorm.gist.ac.kr/guide",
          title: "dorm.gist.ac.kr",
          url: "https://dorm.gist.ac.kr/guide",
          official: true,
        },
        {
          kind: "web",
          id: "https://blog.example.com/a",
          title: "blog.example.com",
          url: "https://blog.example.com/a",
        },
        { kind: "web", id: "x", title: "x", url: "ftp://example.com" },
      ],
    }),
  );
  assert.deepEqual(event, {
    type: "web_sources",
    sources: [
      {
        kind: "web",
        id: "https://dorm.gist.ac.kr/guide",
        title: "dorm.gist.ac.kr",
        url: "https://dorm.gist.ac.kr/guide",
        official: true,
      },
      {
        kind: "web",
        id: "https://blog.example.com/a",
        title: "blog.example.com",
        url: "https://blog.example.com/a",
        official: false,
      },
    ],
  });
});

test("빈 줄 전에는 처리하지 않고 CRLF, data: 공백 생략, 여러 data 줄을 지원한다", () => {
  const first = extractSseData('data:{"content":"한글"}\r\n');
  assert.deepEqual(first.payloads, []);
  assert.deepEqual(extractSseData(first.rest + "\r\n").payloads, [
    '{"content":"한글"}',
  ]);
  assert.deepEqual(
    extractSseData(
      ': comment\nevent: ignored\ndata: {\ndata: "content": "a"}\n\n',
    ).payloads,
    ['{\n"content": "a"}'],
  );
  assert.equal(parseStreamEvent('{"type":"future","content":"무시"}'), null);
  assert.deepEqual(parseStreamEvent('{"error":""}'), {
    type: "error",
    error: "",
  });
});

function streamResponse(bytes, chunkSize = 1, onCancel = () => {}) {
  let offset = 0;
  return new Response(
    new ReadableStream({
      pull(controller) {
        if (offset === bytes.length) return controller.close();
        controller.enqueue(bytes.slice(offset, offset + chunkSize));
        offset = Math.min(offset + chunkSize, bytes.length);
      },
      cancel: onCancel,
    }),
    { headers: { "Content-Type": "text/event-stream; charset=utf-8" } },
  );
}
const encode = (text) => new TextEncoder().encode(text);

test("한글, Markdown 링크, JSON을 모든 네트워크 청크 크기에서 복원하고 DONE 이후는 무시한다", async () => {
  const content =
    "안녕하세요. [공지 원문](https://ziggle.gistory.me/notice/42)\n ";
  const bytes = encode(
    `data: ${JSON.stringify({ content })}\r\n\r\ndata: [DONE]\r\n\r\ndata: {"content":"늦은 응답"}\n\n`,
  );
  for (let size = 1; size <= bytes.length; size++) {
    const events = [];
    await consumeWidgetStream(streamResponse(bytes, size), (event) =>
      events.push(event),
    );
    assert.deepEqual(events, [{ type: "content", content }, { type: "done" }]);
  }
});

test("EOF, 깨진 JSON, SSE error는 성공으로 처리하지 않는다", async () => {
  for (const [payload, kind] of [
    ['data: {"content":"부분 답변"}\n\n', "interrupted"],
    ["data: [DONE]\n", "interrupted"],
    ["data: {bad}\n\ndata: [DONE]\n\n", "protocol"],
    ['data: {"error":"Failed to save message"}\n\ndata: [DONE]\n\n', "server"],
  ]) {
    const events = [];
    await assert.rejects(
      consumeWidgetStream(streamResponse(encode(payload), 1000), (e) =>
        events.push(e),
      ),
      { kind },
    );
    assert.ok(!events.some((e) => e.type === "done"));
  }
});

test("HTTP 상태 및 limit을 보존하고 비 JSON 오류 및 잘못된 Content-Type을 처리한다", async () => {
  for (const status of [400, 401, 404, 429, 500]) {
    await assert.rejects(
      consumeWidgetStream(new Response("<html>proxy</html>", { status }), () =>
        assert.fail(),
      ),
      { kind: "http", status },
    );
  }
  await assert.rejects(
    consumeWidgetStream(new Response('{"limit":5}', { status: 429 }), () =>
      assert.fail(),
    ),
    { status: 429, limit: 5 },
  );
  await assert.rejects(
    consumeWidgetStream(new Response("OK"), () => assert.fail()),
    { kind: "protocol" },
  );
});

test("진행 단계 완료/실패는 요청을 끝내지 않으며 서버 문자열은 정책 코드가 아니다", async () => {
  const events = [];
  await consumeWidgetStream(
    streamResponse(
      encode(
        [
          {
            type: "step",
            id: "research",
            kind: "research",
            label: "완료",
            status: "done",
          },
          {
            type: "step",
            id: "a",
            kind: "unknown",
            label: "실패",
            status: "failed",
            resultCount: 0,
          },
          { content: "정보가 부족합니다." },
        ]
          .map((e) => `data: ${JSON.stringify(e)}\n\n`)
          .join("") + "data: [DONE]\n\n",
      ),
      1024,
    ),
    (e) => events.push(e),
  );
  assert.deepEqual(
    events.map((e) => e.type),
    ["step", "step", "content", "done"],
  );
  assert.equal(events[1].step.resultCount, 0);
});

test("소비 중 abort는 같은 청크의 후속 이벤트를 막고 reader를 정리한다", async () => {
  const controller = new AbortController();
  const events = [];
  let cancelled = false;
  await assert.rejects(
    consumeWidgetStream(
      streamResponse(
        encode('data: {"content":"a"}\n\ndata: [DONE]\n\n'),
        1024,
        () => {
          cancelled = true;
        },
      ),
      (e) => {
        events.push(e);
        controller.abort();
      },
      controller.signal,
    ),
    { name: "AbortError" },
  );
  assert.deepEqual(
    events.map((e) => e.type),
    ["content"],
  );
  assert.ok(cancelled);
});

test("이벤트가 없는 대기 중에도 사용자 abort가 즉시 읽기를 종료한다", async () => {
  const controller = new AbortController();
  const response = new Response(new ReadableStream({}), {
    headers: { "Content-Type": "text/event-stream" },
  });
  const reading = consumeWidgetStream(
    response,
    () => assert.fail(),
    controller.signal,
  );
  controller.abort();
  await assert.rejects(reading, { name: "AbortError" });
});

test("히스토리의 선택 metadata 및 camelCase webSources를 검증하고 URL 중복을 제거한다", () => {
  assert.deepEqual(parseHistoryMetadata(null).webSources, []);
  const source = {
    kind: "web",
    id: "1",
    title: "GIST",
    url: "https://gist.ac.kr",
    official: true,
    opened: true,
  };
  const metadata = parseHistoryMetadata({
    webSources: [source, source],
    resources: [
      null,
      {
        path: "학사 안내.pdf",
        formats: ["pdf"],
        url: "%ED%95%99%EC%82%AC%20%EC%95%88%EB%82%B4.pdf",
      },
    ],
  });
  assert.equal(metadata.webSources.length, 1);
  assert.equal(metadata.webSources[0].official, true);
  assert.equal(
    metadata.resources[0].url,
    "%ED%95%99%EC%82%AC%20%EC%95%88%EB%82%B4.pdf",
  );
  assert.ok(new WidgetStreamError("server", "diagnostic") instanceof Error);
});
