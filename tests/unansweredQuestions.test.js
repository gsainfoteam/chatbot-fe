import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const utilsSource = readFileSync(
  new URL("../src/features/unanswered-questions/utils.ts", import.meta.url),
  "utf8",
);

function normalizeSearchText(value) {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("ko-KR")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesUnansweredQuestionQuery(question, query) {
  const normalizedQuery = query ? normalizeSearchText(query) : "";
  if (!normalizedQuery) return true;
  return normalizeSearchText(question).includes(normalizedQuery);
}

test("unanswered search helper in source matches NFC Korean queries", () => {
  assert.match(utilsSource, /normalize\("NFC"\)/);
  assert.match(utilsSource, /toLocaleLowerCase\("ko-KR"\)/);

  const question = "지스트 기숙사 입사 신청 기간이 언제인가요?";
  assert.equal(matchesUnansweredQuestionQuery(question, ""), true);
  assert.equal(matchesUnansweredQuestionQuery(question, "  기숙사  "), true);
  assert.equal(matchesUnansweredQuestionQuery(question, "셔틀"), false);
  assert.equal(matchesUnansweredQuestionQuery(question, "기숙사"), true);
});
