# Review: task-068 Interactive Notifications & Manifest Support

- **RESULT:** needs-fixes
- **SPEC_DEVIATIONS:**
    - **Missing `deep_link_url` (Database & API):** The user's instructions for task-068 (and task-070 prompt) specified that `deep_link_url` was a required column/field. It is missing from the SQL migration (`00011_notifications_actions.sql`), the edge function's `NotifyRequest` interface, and the insert logic.
    - **Manifest Naming Convention:** The implementation uses `camelCase` (`themeColor`, `backgroundColor`) matching the `opus-interactive-notifications-spec.md` file, but deviates from the user's requirement of `snake_case` (`theme_color`, `background_color`) which was specified in `opus-council-pickaxe.md` and the task prompt.
    - **Icon Validation:** The implementation enforces `https:` or `data:` URIs and rejects relative paths (e.g., `/icon.png`), which the prompt claims was allowed in the spec (and used in the pickaxe document).
    - **Manifest Return Type:** `relayConfig` in the SDK throws on validation failure instead of returning an object containing warnings for recoverable issues (as mentioned in the spec's "optionally returns [manifest, warnings[]]" section).
    - **Partial Indexes:** The SQL migration uses standard indexes on `channel` and `severity` instead of the partial indexes suggested by the task-070 prompt (e.g., to index only non-default severity).
- **BUGS:**
    - **Inaccurate Error Message:** In `packages/sdk/src/manifest.ts`, the `sanitizeChannel` helper is used for both `defaultChannel` and tab-specific `channel` fields, but the error message is hardcoded to "defaultChannel must contain alphanumeric characters," which is confusing when a tab channel is invalid.
    - **Edge Case (SDK Types vs. Backend):** `packages/sdk/src/types.ts` defines `url` (the deep link path), but the backend `notify` function ignores this field entirely.
- **SECURITY:**
    - **SSRF Risk:** As noted in the spec, storing and POSTing to arbitrary `actions[].url` endpoints without an allowlist or proxy rate-limiting is a potential SSRF vector. Implementation correctly enforces `https`, but no further restrictions are in place.
- **VERDICT:** needs rework (specifically to add `deep_link_url` support and align manifest naming/validation with developer-focused requirements).
- **CONFIDENCE:** 0.95
