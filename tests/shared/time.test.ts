import assert from "node:assert/strict";
import test from "node:test";

import { timeAgo } from "../../backend/shared/time.ts";

test("timeAgo handles recent timestamps", () => {
  assert.equal(timeAgo(new Date().toISOString()), "just now");
});

test("timeAgo formats minutes, months, and invalid dates safely", () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  assert.equal(timeAgo(fiveMinutesAgo), "5m ago");
  assert.equal(timeAgo(sixtyDaysAgo), "2mo ago");
  assert.equal(timeAgo("not-a-date"), "just now");
});
