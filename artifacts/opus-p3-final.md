# P3 Final Cleanup

## 1. Magic numbers extracted

### useDashboardPage.ts
| Constant | Value | Was at |
|----------|-------|--------|
| `PROFILE_PROVISION_DELAY_MS` | 1500 | line 107 — `sleep(1500)` |
| `CHECKOUT_POLL_DELAY_MS` | 2000 | line 124 — `sleep(2000)` |
| `CHECKOUT_MAX_RETRIES` | 3 | line 123 — `attempt < 3` |

(`COPY_FEEDBACK_MS` and `TEST_RESULT_CLEAR_MS` were already extracted.)

### notify/index.ts
| Constant | Value | Was at |
|----------|-------|--------|
| `QUOTA_WARNING_PERCENT` | 80 | checkQuotaWarning — `percent < 80`, `percent >= 80` |
| `QUOTA_LIMIT_PERCENT` | 100 | checkQuotaWarning — `percent >= 100`, `percent < 100` |
| `QUOTA_RESEND_COOLDOWN_DAYS` | 30 | checkQuotaWarning — `30 * 24 * 60 * 60 * 1000` |
| `MAX_URL_LENGTH` | 2048 | URL validation — `trimmed.length > 2048` |

Also renamed `thirtyDaysAgo` to `cooldownAgo` to match the constant name.

## 2. Modal backdrop click standardization

All 4 modals now close on backdrop click using `onClick={(e) => { if (e.target === e.currentTarget) ...; }}`:

| Modal | File | Guard |
|-------|------|-------|
| `AddDashboardModal` | `modals.tsx:24` | `onClose()` |
| `DeleteAccountModal` | `modals.tsx:97` | `!deleting && onCancel()` (prevents close during deletion) |
| `ComposeNotificationModal` | `ComposeNotificationModal.tsx:79,110` | `onClose()` (both success and form views) |
| `MembersModal` | `MembersModal.tsx:60` | `onClose()` |

MembersModal also already had state reset handled by the parent (Dashboard.tsx clears `inviteError` and refetches on open). ComposeNotificationModal's `handleSendAnother` already resets all local state. AddDashboardModal's parent already clears `error` on close. No additional state reset needed.

## 3. FlatList key props (mobile)

Both mobile files already use stable keys:
- `app/app/(tabs)/index.tsx:238` — `keyExtractor={(item) => item.id}` — correct
- `app/app/(tabs)/settings.tsx` — No `FlatList` or `.map()` with index keys; all rows are static components

No changes needed.

## Verification
- `npx tsc -p tsconfig.json --noEmit` — clean pass
