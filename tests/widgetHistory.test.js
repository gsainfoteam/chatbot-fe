import test from "node:test";
import assert from "node:assert/strict";
import { reconcileHistory } from "../src/features/widget/history.ts";
const saved = (id, role, text, extra = {}) => ({
  id,
  serverId: id,
  role,
  text,
  status: "completed",
  ...extra,
});

test("저장된 질문과 답변을 요청 전 ID 및 내용으로 연결하고 metadata를 복원한다", () => {
  const local = [
    { id: "lu", role: "user", text: "질문" },
    { id: "la", role: "assistant", text: "답변", status: "completed" },
  ];
  const history = [
    saved("su", "user", "질문"),
    saved("sa", "assistant", "답변", {
      webSources: [{ official: true }],
      steps: [{ id: "research" }],
    }),
  ];
  const result = reconcileHistory(local, history, {
    userId: "lu",
    assistantId: "la",
    question: "질문",
    answer: "답변",
    previousIds: new Set(),
  });
  assert.equal(result.length, 2);
  assert.equal(result[1].serverId, "sa");
  assert.deepEqual(result[1].webSources, [{ official: true }]);
});

test("다른 탭/이전 요청의 최신 답변을 무조건 현재 답변 ID로 붙이지 않는다", () => {
  const local = [{ id: "la", role: "assistant", text: "답변" }];
  const history = [saved("old", "assistant", "답변")];
  const result = reconcileHistory(local, history, {
    assistantId: "la",
    answer: "답변",
    previousIds: new Set(["old"]),
  });
  assert.equal(result[0].serverId, undefined);
});

test("동일 질문이 둘 이상 새로 저장되면 모호한 ID 연결을 피한다", () => {
  const history = [
    saved("u1", "user", "질문"),
    saved("a1", "assistant", "답변"),
    saved("u2", "user", "질문"),
    saved("a2", "assistant", "답변"),
  ];
  const result = reconcileHistory(
    [{ id: "la", role: "assistant", text: "답변" }],
    history,
    {
      assistantId: "la",
      question: "질문",
      answer: "답변",
      previousIds: new Set(),
    },
  );
  assert.equal(result[0].serverId, undefined);
});

test("중단된 부분 답변은 보존하고 서버에 저장된 완성 답변은 별도로 복구한다", () => {
  const result = reconcileHistory(
    [{ id: "la", role: "assistant", text: "부분", status: "cancelled" }],
    [saved("sa", "assistant", "완성")],
  );
  assert.equal(result[0].status, "cancelled");
  assert.equal(result[1].serverId, "sa");
});

test("재생성은 연결 metadata로 매칭하고 원본 및 실패한 선점을 보존한다", () => {
  const original = saved("original", "assistant", "원본", {
    regenerationAttempted: true,
  });
  const regenerated = saved("regen", "assistant", "새 답변", {
    regeneratedFromMessageId: "original",
    regeneratedAnswer: true,
  });
  const local = [original, { id: "la", role: "assistant", text: "새 답변" }];
  const result = reconcileHistory(
    local,
    [saved("original", "assistant", "원본"), regenerated],
    {
      assistantId: "la",
      answer: "새 답변",
      previousIds: new Set(["original"]),
      regeneratedFromMessageId: "original",
    },
  );
  assert.equal(result.length, 2);
  assert.equal(result[0].regenerationAttempted, true);
  assert.equal(result[1].serverId, "regen");
});
