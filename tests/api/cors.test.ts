import assert from "node:assert/strict";
import test from "node:test";

import { handleOptions, setCorsHeaders } from "../../api/_cors.ts";

type HeaderMap = Record<string, string>;

function createResponse() {
  const headers: HeaderMap = {};
  let statusCode: number | null = null;
  let ended = false;

  return {
    headers,
    get statusCode() {
      return statusCode;
    },
    get ended() {
      return ended;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    status(code: number) {
      statusCode = code;
      return {
        end() {
          ended = true;
        },
      };
    },
  };
}

test("setCorsHeaders allows localhost origins during development", () => {
  const res = createResponse();

  setCorsHeaders(
    { headers: { origin: "http://localhost:3000" } } as never,
    res as never,
    ["POST", "OPTIONS"]
  );

  assert.equal(res.headers["Access-Control-Allow-Origin"], "http://localhost:3000");
  assert.equal(res.headers["Access-Control-Allow-Methods"], "POST, OPTIONS");
  assert.match(res.headers["Access-Control-Allow-Headers"], /Authorization/);
});

test("setCorsHeaders falls back to the production origin for unknown origins", () => {
  const res = createResponse();

  setCorsHeaders(
    { headers: { origin: "https://evil.example" } } as never,
    res as never
  );

  assert.equal(res.headers["Access-Control-Allow-Origin"], "https://relayapp.dev");
  assert.equal(res.headers["Vary"], "Origin");
});

test("handleOptions short-circuits OPTIONS requests", () => {
  const res = createResponse();

  const handled = handleOptions(
    { method: "OPTIONS", headers: { origin: "https://relayapp.dev" } } as never,
    res as never
  );

  assert.equal(handled, true);
  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);
});
