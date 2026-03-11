# Loop 8 Plan: Team Sharing Frontend

## Overview

Wire the loop 7 backend (dashboard_members table, invite-member.ts, accept-invite.ts) into the web dashboard. Four deliverables: invite UI, member list, shared dashboard display, Pro gate.

---

## Files to touch

### 1. `src/features/dashboard/types.ts` — New types

Add:
```ts
export interface DashboardMember {
  id: string;
  email: string;
  role: "viewer" | "editor";
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

// Extend Dashboard or create a wrapper:
export interface DashboardWithSharing extends Dashboard {
  owner_email?: string;   // populated for shared dashboards
  is_owner: boolean;
  members?: DashboardMember[];
}
```

### 2. `src/features/dashboard/useDashboardPage.ts` — Fetch shared dashboards + team handlers

**Change the apps query** from:
```ts
supabase.from("apps").select("*").eq("user_id", session.user.id)
```
to two parallel queries:
```ts
// Own apps
supabase.from("apps").select("*").eq("user_id", session.user.id)

// Shared apps (via dashboard_members)
supabase
  .from("dashboard_members")
  .select("app_id, apps:app_id(id, name, url, webhook_token, icon, ...), role, status")
  .eq("user_id", session.user.id)
  .eq("status", "accepted")
```
Merge results into a single `dashboards` array, tagging each with `is_owner: true/false` and `owner_email` for shared ones.

**Add new state:**
- `showMembersModal: string | null` (app_id of the app whose members to show, or null)
- `members: Record<string, DashboardMember[]>` (keyed by app_id, lazily loaded)
- `inviteError: string | null`
- `inviting: boolean`

**Add new handlers:**
- `handleInviteMember(appId: string, email: string, role: string)` — POST to `/api/invite-member`, refresh members list
- `handleRemoveMember(memberId: string)` — DELETE from `dashboard_members` via Supabase client, refresh
- `fetchMembers(appId: string)` — query `dashboard_members` for the app, store in `members[appId]`

**Return** all new state/handlers from the hook.

### 3. `src/features/dashboard/MembersModal.tsx` — New file

Modal containing:

**Top section: Invite form**
- Email input + role dropdown (viewer/editor) + "Send Invite" button
- Pro gate check: if `user.plan !== "pro"`, show upgrade prompt instead of the form
- Loading state while sending, success flash, error message
- Calls `handleInviteMember`

**Bottom section: Member list**
- List of current members fetched via `fetchMembers(appId)`
- Each row: email, role badge (`viewer` / `editor`), status badge (`pending` in yellow / `accepted` in green)
- Owner row at top (not removable, shows "Owner" badge)
- Remove button (trash icon) for each member — only shown to app owner
- Confirmation before remove

**Props:**
```ts
interface MembersModalProps {
  appId: string;
  appName: string;
  isOwner: boolean;
  isPro: boolean;
  members: DashboardMember[];
  inviteError: string | null;
  inviting: boolean;
  onInvite: (email: string, role: string) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
  onClose: () => void;
}
```

### 4. `src/features/dashboard/DashboardListSection.tsx` — Modify DashboardCard

**Add to DashboardListSectionProps:**
```ts
currentUserId: string;
onShowMembersModal: (appId: string) => void;
```

**In DashboardCard:**
- Accept `isOwner: boolean` and `ownerEmail?: string` props (derived from `DashboardWithSharing`)
- If `!isOwner`: hide Delete button, hide token/webhook URL, hide Test button. Show read-only "Shared by {ownerEmail}" badge instead
- Add "Team" button (Users icon) next to Test button — opens members modal. Show member count badge if > 0
- If `isOwner`: show everything as before, plus the Team button

**Shared dashboard badge:**
- Before the dashboard name, render: `<span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Shared</span>` for `!isOwner` dashboards

### 5. `src/pages/Dashboard.tsx` — Wire new modal + pass props

- Destructure new state from `useDashboardPage`: `showMembersModal`, `setShowMembersModal`, `members`, `inviteError`, `inviting`, `handleInviteMember`, `handleRemoveMember`, `fetchMembers`
- Pass `currentUserId={user.id}` and `onShowMembersModal` to `DashboardListSection`
- Render `MembersModal` when `showMembersModal` is set, with `useEffect` to call `fetchMembers` when the modal opens
- Import `MembersModal`

### 6. Pro gate behavior

In `MembersModal`, if `!isPro`:
- Replace the invite form with a card:
  ```
  Team sharing is a Pro feature.
  Upgrade to invite teammates to your dashboards.
  [Upgrade to Pro] button → /pricing
  ```
- Still show existing members list (if any somehow exist)
- The "Team" button on DashboardCard is always visible (so free users discover the feature) but the modal shows the gate

---

## Data flow summary

```
useDashboardPage
  ├─ fetches own apps + shared apps (merged)
  ├─ tags each with is_owner
  ├─ exposes invite/remove handlers
  └─ returns dashboards: DashboardWithSharing[]

Dashboard.tsx
  ├─ passes dashboards + currentUserId to DashboardListSection
  ├─ renders MembersModal when showMembersModal !== null
  └─ fetches members on modal open

DashboardListSection
  ├─ DashboardCard: shows/hides controls based on is_owner
  └─ Team button opens members modal

MembersModal
  ├─ Pro gate or invite form
  └─ Member list with remove
```

## Edge cases to handle

- **Email mismatch on shared dash:** shared dashboards should not show webhook tokens (security — viewers shouldn't see the raw token)
- **Free user receives invite:** They can accept and see the dashboard, but can't invite others from their own apps
- **Owner deletes app:** CASCADE deletes all dashboard_members — no cleanup needed
- **Self-invite prevention:** Already handled in backend, but disable invite button if email matches current user
- **Empty members list:** Show "No team members yet" with invite prompt
