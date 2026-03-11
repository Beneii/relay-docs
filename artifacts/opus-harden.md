# Hardening: Member Role Update

## Problem
App owners could not change a member's role (viewer/editor) after invite — the only option was delete and re-invite.

## RLS Verification
The existing "Owners can manage dashboard members" policy in `00018_dashboard_members.sql` uses `FOR ALL`, which covers SELECT, INSERT, UPDATE, and DELETE. No migration needed — owners can already update any member of their apps via RLS.

## Implementation

### 1. `api/update-member.ts` (created)
- POST endpoint, auth required
- Accepts `{ memberId: string, role: "viewer" | "editor" }`
- Looks up the member record to find the `app_id`
- Verifies the requesting user owns that app (`apps.user_id = auth user id`)
- Returns `{ ok: true, unchanged: true }` if role is already the requested value (no-op)
- Updates `dashboard_members.role` via service role Supabase client
- Uses `.js` extension imports for `_auth.js` and `_cors.js`

### 2. `src/features/dashboard/useDashboardPage.ts` (modified)
- Added `handleUpdateMemberRole(memberId, appId, role)` handler
  - Calls `/api/update-member` with auth header
  - On success: optimistic update of the member's role in local state
  - On error: logs to console (no UI error state needed — role select reverts on next fetch)
- Added `handleUpdateMemberRole` to the return object

### 3. `src/features/dashboard/MembersModal.tsx` (modified)
- Added `onUpdateRole` prop to `MembersModalProps`
- For accepted members when `isOwner` is true: replaced the static `<span>` role label with a `<select>` dropdown
  - Options: "Viewer" and "Editor"
  - `onChange` calls `onUpdateRole(member.id, appId, e.target.value)`
  - Styled to match existing form elements (border, bg-bg, text-xs)
- For pending/declined members or when not owner: static role label as before

### 4. `src/pages/Dashboard.tsx` (modified)
- Destructures `handleUpdateMemberRole` from `useDashboardPage()`
- Passes `onUpdateRole={handleUpdateMemberRole}` to `MembersModal`

## Typecheck
```
> tsc -p tsconfig.json --noEmit
(clean pass)
```

## Files changed
- `api/update-member.ts` — created
- `src/features/dashboard/useDashboardPage.ts` — added handler + return
- `src/features/dashboard/MembersModal.tsx` — added onUpdateRole prop, inline role select
- `src/pages/Dashboard.tsx` — wired new handler to modal
