# Review: Loop 1 Implementation — Gemini Council

- **RESULT:** needs-fixes (CRITICAL)
- **BUGS & CORRECTNESS:**
    - **Database Desync (CRITICAL):** The edge function in `backend/supabase/functions/notify/index.ts` now inserts `pushed_count`, but migration `00012_hmac_signatures.sql` only adds the `request_signature` column. Since `pushed_count` is missing from the database, the notification insert will fail with a 500 error, completely breaking the notification service for all users.
    - **Incomplete HMAC Flow:** The HMAC implementation signs the *incoming notify request* on the server and returns it to the caller. However, the most critical security need—verifying the **action button callbacks** from the mobile app to the developer's server—is missing. `app/src/hooks/useNotificationHandler.ts` still performs insecure, unsigned POST requests. The `verifySignature` export in the SDK has no signature to verify on the callback endpoint.
- **SECURITY:**
    - **Good:** The use of `crypto.subtle` (Web Crypto API) and the implementation of `timingSafeEqual` in the SDK are excellent practices for preventing timing attacks.
    - **Risk:** The lack of signature on the mobile callback remains the primary SSRF/spoofing risk for users building automation (e.g., "Unlock Door" or "Kill Agent" buttons).
- **UX:**
    - **High Impact:** The enhancements to `RecentNotificationsPanel` (severity badges, channel tags, action counts, and device push counts) are fantastic for developer DX. This provides much-needed visibility into the "black box" of notification delivery.
- **VERDICT:**
    - **DO NOT SHIP.** The missing database column will cause production downtime. The HMAC feature should be refactored to include the signature in the push payload so the mobile app can sign the callback requests to the developer's infrastructure.
- **CONFIDENCE:** 0.98
