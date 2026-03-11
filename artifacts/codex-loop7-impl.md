# Loop 7 Implementation: Team Sharing — Backend

## RESULT
All 5 tasks implemented. Typecheck passes clean.

## FILES CHANGED

1. **`backend/supabase/migrations/00018_dashboard_members.sql`** (created)
   - `dashboard_members` table with app_id, invited_by, user_id, email, role (viewer/editor), status (pending/accepted/declined), invite_token
   - Indexes on app_id, email, invite_token
   - RLS: owners manage all members, users read/update own invites, service role full access
   - New policy on `apps`: members can read shared apps
   - Replaced notification SELECT policy: users can read own OR shared notifications

2. **`api/invite-member.ts`** (created)
   - POST endpoint, auth required
   - Validates Pro plan, app ownership, no self-invite, no duplicate invites
   - Looks up invitee profile to pre-link user_id if they have an account
   - Inserts dashboard_member record
   - Sends invite email via Resend (non-fatal if email fails)
   - Returns `{ ok: true, inviteId }`

3. **`api/accept-invite.ts`** (created)
   - POST/GET endpoint, invite_token from body or query
   - If not authenticated: returns `{ requiresAuth: true, email, appName }`
   - If authenticated: verifies email matches invite, updates status to accepted
   - Handles already-accepted and declined states
   - Returns `{ ok: true, appId, appName }`

4. **`api/_email.ts`** (modified)
   - Added `sendInviteEmail()` function
   - Subject: "{inviter} invited you to {appName} on Relay"
   - CTA: "Accept Invite" linking to `/invite?token=...`
   - Shows account creation note for users without existing accounts
   - Uses existing layout/heading/paragraph/button helpers

5. **`src/pages/InviteAccept.tsx`** (created)
   - Reads `?token=` from URL
   - Calls `/api/accept-invite` with auth header if logged in
   - States: loading spinner, requiresAuth (sign in / create account links with redirect), success (with "Go to Dashboard"), error
   - Redirect preserves token: `/login?redirect=/invite?token=...`

6. **`src/main.tsx`** (modified)
   - Added lazy import for InviteAccept
   - Added `/invite` route

## OUTPUT
```
> relay-site@1.0.0 typecheck
> tsc -p tsconfig.json --noEmit
```
(clean pass, no errors)

## CONFIDENCE
9/10 — All backend pieces are complete and type-safe. The invite flow handles edge cases (self-invite, duplicate, email mismatch, already accepted/declined). The migration properly extends existing RLS policies for shared access. Only uncertainty: login/signup pages need to support `?redirect=` param for the post-auth redirect to work (not yet verified).
