import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { generate, OUTPUT_PATH } from "../scripts/extract-launcher-icons.mjs";

test("docs icon module is in sync with loader.js (run: npm run icons:extract)", () => {
  const current = readFileSync(OUTPUT_PATH, "utf8");
  assert.equal(current, generate());
});
