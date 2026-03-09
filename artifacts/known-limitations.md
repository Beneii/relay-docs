# Known Limitations

Documented: 2026-03-09

---

## L11. OAuth callback depends on static file + Vercel rewrite

**Status:** Accepted limitation

**Description:**
OAuth login (Google, GitHub) redirects to `/auth/callback`. This is served by `public/auth/callback.html` via a Vercel rewrite (`vercel.json:11-13`), not by the React router. The static file dynamically imports Supabase from a CDN, sets the session, and redirects to `/dashboard`.

**Why it works in production:**
Vercel rewrites `/auth/callback` to `/auth/callback.html` before the SPA catch-all, so the static file is served correctly. Supabase's OAuth flow puts tokens in the URL hash fragment, and the static file parses and sets them.

**Where it breaks:**
- `vite dev` does not process `vercel.json` rewrites. Navigating to `/auth/callback` in local dev hits the SPA catch-all and renders the React 404 page instead of the static callback file.
- Non-Vercel hosting (Netlify, Cloudflare Pages, etc.) would need equivalent rewrite rules.

**Why not fixed:**
- Moving the callback back into React would require the Supabase JS client to be loaded on the landing page bundle (it currently isn't, since `src/lib/supabase.ts` is only imported by authenticated pages).
- The static file approach is actually correct for production — it avoids loading the full SPA bundle just to handle a redirect.
- Local dev workaround: add a Vite plugin or proxy rule to serve the static file, or use `vite preview` which serves from `dist/` where the file exists.

**Workaround for local dev:**
Add to `vite.config.ts`:
```typescript
server: {
  proxy: {},
},
// Or use a simple middleware plugin to serve /auth/callback.html
```
Or simply test OAuth flows using `vite preview` (serves the built output with correct file routing).

---

## L12. pg_cron receipt processing relies on app.settings vars

**Status:** Accepted limitation

**Description:**
The `process-expo-receipts` cron job in `00007_push_tickets.sql` (lines 40-53) uses:
```sql
current_setting('app.settings.supabase_url')
current_setting('app.settings.service_role_key')
```
These are Supabase custom app settings that must be configured in the project dashboard under Settings > API > App Settings, or via SQL:
```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
```

**Impact:**
If these settings are not configured, the cron job executes but `net.http_post` fails silently (the HTTP call gets a malformed URL or empty auth header). Push receipts are never processed, and stale device tokens are never cleaned up. The system still functions — notifications are still sent and stored — but delivery failures are not detected.

**Why not fixed:**
- This is the standard Supabase pattern for pg_cron + pg_net calling edge functions. There is no alternative way to pass secrets to a cron-executed SQL statement.
- Supabase's hosted platform sets `app.settings.supabase_url` automatically on most projects. The `service_role_key` setting is the one that typically needs manual configuration.
- Hardcoding the values in the migration would be a security risk (the service role key would be in version control).

**Mitigation:**
The migration file already has a comment (line 32) noting the pg_cron/pg_net dependency. The setup steps should be documented in a deployment checklist or README. The `process-receipts` edge function logs errors when called, so failures are visible in the Supabase function logs even if the cron job itself fails silently.
