import assert from "node:assert/strict";
import test from "node:test";

import { TEAM_SHARING_DISABLED_MESSAGE } from "../../backend/shared/product.ts";
import { createMockRequest, createMockResponse } from "../support/vercel.ts";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service-role-key";

const inviteMember = (await import("../../api/invite-member.ts")).default;
const updateMember = (await import("../../api/update-member.ts")).default;
const acceptInvite = (await import("../../api/accept-invite.ts")).default;

for (const [name, handler] of [
  ["invite-member", inviteMember],
  ["update-member", updateMember],
  ["accept-invite", acceptInvite],
] as const) {
  test(`${name} is disabled while team sharing is sidelined`, async () => {
    const req = createMockRequest({
      method: "POST",
      body: {},
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    assert.equal(res.statusCode, 503);
    assert.deepEqual(res.jsonBody, {
      ok: false,
      error: TEAM_SHARING_DISABLED_MESSAGE,
    });
  });
}
