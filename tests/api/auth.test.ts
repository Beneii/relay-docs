import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service-role-key";

const {
  getBearerToken,
  getRequestHeader,
  requireAuthenticatedUser,
} = await import("../../api/_auth.ts");

test("getRequestHeader is case-insensitive and unwraps array headers", () => {
  const req = {
    headers: {
      Authorization: ["Bearer first-token", "Bearer second-token"],
    },
  };

  assert.equal(getRequestHeader(req, "authorization"), "Bearer first-token");
});

test("getBearerToken returns the token for bearer auth", () => {
  const req = {
    headers: {
      authorization: "Bearer test-token",
    },
  };

  assert.equal(getBearerToken(req), "test-token");
});

test("getBearerToken rejects malformed auth headers", () => {
  assert.equal(getBearerToken({ headers: {} }), null);
  assert.equal(getBearerToken({ headers: { authorization: "Basic abc" } }), null);
  assert.equal(getBearerToken({ headers: { authorization: "Bearer" } }), null);
});

test("requireAuthenticatedUser throws before calling Supabase when auth is missing", async () => {
  await assert.rejects(
    requireAuthenticatedUser({ headers: {} }),
    /Unauthorized/
  );
});
