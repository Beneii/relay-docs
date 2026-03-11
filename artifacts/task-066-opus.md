# Code Review: @relayapp/sdk (codex implementation)

**RESULT:** Functional MVP with correct core logic, but has several security issues, edge cases, and API design problems that should be fixed before publishing to npm.

---

## Security Issues

### 1. Token Exposed in Request Body — Not URL Path (Correctness Bug)

The SDK sends the token in the JSON body (`{ token: "...", title: "..." }`), which matches the edge function's body-based token extraction. However, the edge function also supports URL-path-based tokens (`/functions/v1/notify/:token`). The SDK always sends to the base endpoint URL without the token in the path.

**This is fine functionally** — the edge function checks `body.token` first, then falls back to the URL path. But it means the token is always in the POST body, which is slightly worse for security: request bodies are more likely to be logged by proxies, application firewalls, and monitoring tools than URL path segments.

**Recommendation:** Send the token in the URL path instead:
```typescript
const url = `${this.endpoint}/${this.token}`;
// Body no longer needs token field
```
This also matches the curl examples on the landing page and documentation.

### 2. Hardcoded Supabase Project ID in Published Package

```typescript
export const DEFAULT_ENDPOINT =
  'https://wvlbdjpllcnmndkujzpy.supabase.co/functions/v1/notify';
```

The Supabase project ID (`wvlbdjpllcnmndkujzpy`) is now baked into a public npm package. This is:
- **Not a secret** (the anon key is already public in the frontend), so not a security vulnerability per se.
- **But a deployment coupling** — if the Supabase project ever changes (migration, region move, new project), every installed SDK version breaks. The endpoint should be `https://relayapp.dev/webhook` (the Vercel rewrite), not the raw Supabase URL. This also looks more professional in stack traces and error messages.

**Fix:**
```typescript
export const DEFAULT_ENDPOINT = 'https://relayapp.dev/webhook';
```

### 3. No Token Format Validation

The constructor accepts any non-empty string as a token:
```typescript
if (!config?.token) {
  throw new RelayError('Relay token is required');
}
```

Relay webhook tokens are 64-character hex strings (32 bytes). The SDK should validate this to catch typos and misconfiguration early, rather than making a network request that will fail with a 401:
```typescript
if (!/^[a-f0-9]{64}$/.test(config.token)) {
  throw new RelayError(
    'Invalid token format. Relay tokens are 64-character hex strings. ' +
    'Get your token at relayapp.dev/dashboard'
  );
}
```

---

## Edge Cases

### 4. Retry Logic Retries on ALL Server Responses (Not Just 5xx)

```typescript
if (!response.ok && response.status >= 400 && response.status < 500) {
  return response; // Don't retry 4xx
}
return response; // Returns immediately for ALL other responses
```

This code has a dead branch. The second `return response` is reached for both successful responses (2xx) AND server errors (5xx). That means **5xx errors are never retried** — the function returns immediately. The retry loop only retries on network errors (fetch throws).

**Fix:**
```typescript
if (response.status >= 500) {
  if (attempt < RETRY_ATTEMPTS) {
    await delay(RETRY_DELAY_MS);
    continue;
  }
}
return response;
```

### 5. `parseJson` Error Handling Is Inconsistent

```typescript
async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new RelayError('Failed to parse Relay response JSON', response.status || undefined);
  }
}
```

If the server returns an HTML error page (e.g., Vercel's default 500 page), `JSON.parse` throws, and the user gets "Failed to parse Relay response JSON" — which is confusing. The error message should indicate it's a server-side problem, not a parsing problem:
```typescript
throw new RelayError(
  `Relay returned an unexpected response (HTTP ${response.status})`,
  response.status
);
```

### 6. Success Check Is Fragile

```typescript
if (!response.ok || !data || 'success' in data === false) {
```

`'success' in data === false` requires the response to have a `success` property. But the edge function returns `{ error: "..." }` on failure (no `success` field). On success it returns `{ success: true, notificationId: "...", pushed: 0 }`. If the response is `{ success: true }` without `notificationId`, the SDK returns it as a valid `NotifyResponse`, but the caller will get `undefined` for `notificationId` and `pushed` — violating the type contract.

**Recommendation:** Validate the response shape more explicitly:
```typescript
if (!response.ok || !data || data.success !== true || typeof data.notificationId !== 'string') {
```

### 7. No Timeout on Fetch Requests

If the Supabase edge function hangs, the SDK will wait indefinitely. In server-side environments (Node.js scripts, CI/CD), this can block the process forever.

**Fix:** Add an AbortController timeout:
```typescript
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 10_000); // 10s timeout
try {
  const response = await fetch(this.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: controller.signal,
  });
  // ...
} finally {
  clearTimeout(timer);
}
```

### 8. Static `notify` Creates a New Instance Every Call

```typescript
static async notify(token: string, options: NotifyOptions, endpoint?: string) {
  const relay = new Relay({ token, endpoint });
  return relay.notify(options);
}
```

This is fine for occasional use, but if someone calls `Relay.notify()` in a loop, they're creating a new instance per call. Not a bug, but the README should recommend creating an instance for repeated use. Also, the static method's signature differs from the constructor pattern — the third `endpoint` parameter is positional, which is awkward. Consider using an options object:
```typescript
static async notify(options: NotifyOptions & { token: string; endpoint?: string })
```

---

## API Design Issues

### 9. Missing `NotifyOptions.url` Field

The edge function already accepts a `url` field for deep linking (planned in the interactive notifications spec), and even without that, a `url` field in the SDK would be natural for specifying which page the notification should open. The types should include it even if the backend doesn't use it yet — forward compatibility.

### 10. No `engines` or `peerDependencies` in package.json

The SDK uses `fetch` (global in Node 18+) but doesn't declare `"engines": { "node": ">=18" }`. Users on Node 16 will get a confusing `ReferenceError: fetch is not defined` at runtime.

### 11. MIT License on a Non-Open-Source Project

`package.json` declares `"license": "MIT"` but the Relay project is explicitly not open source. The SDK can be MIT-licensed separately (this is common — SDKs are often open-source even when the service isn't), but this should be a deliberate choice, not an accident.

### 12. `extends: "../../tsconfig.json"` Creates Fragile Coupling

The SDK tsconfig extends the root project tsconfig, which includes path aliases (`@/*`, `@shared/*`), React JSX settings, and other web-app-specific configuration. If the root config changes, the SDK build could break. The SDK should have a standalone tsconfig:
```json
{
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "Bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

---

## What's Good

- **Clean module structure.** Separate files for types, implementation, and exports. Good.
- **Helpful error messages.** `mapErrorMessage` translates HTTP status codes into actionable guidance ("Get your webhook token at..."). This is excellent DX.
- **`.js` extension imports.** Correctly uses `.js` extensions for ESM compatibility. Shows awareness of the project's deployment patterns.
- **No unnecessary dependencies.** Uses native `fetch` — no axios, no node-fetch. Zero dependencies is the right call for an SDK.
- **`prepublishOnly` build hook.** Ensures the package is compiled before publishing.

---

## Priority Fixes (Before npm Publish)

1. **Change DEFAULT_ENDPOINT to `https://relayapp.dev/webhook`** — critical, deployment coupling
2. **Fix retry logic to actually retry 5xx errors** — bug
3. **Add fetch timeout (10s)** — hang prevention
4. **Add token format validation** — DX improvement
5. **Remove `extends` from tsconfig** — build independence
6. **Add `"engines": { "node": ">=18" }`** to package.json
7. **Decide on license deliberately** — MIT is fine but should be intentional

**CONFIDENCE: 0.88**
