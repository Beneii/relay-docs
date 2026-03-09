# Auth UX Audit & Improvements

## 1. Email Normalization
- **Issue:** Users could accidentally include leading/trailing spaces or mixed-case characters in their email addresses, potentially leading to login failures.
- **Fix:** Added `.trim().toLowerCase()` to the email input in `src/pages/Login.tsx` before calling `supabase.auth.signInWithPassword()`. This matches the behavior already present in `Signup.tsx`.

## 2. OAuth Improvements
- **Issue:** OAuth errors were being displayed as raw strings, and error states weren't consistently reset between attempts. Furthermore, the buttons provided no visual feedback during the redirect process.
- **Fix:** 
    - Updated `handleOAuth` in both `Login.tsx` and `Signup.tsx` to clear previous errors and set an `isOAuthLoading` state.
    - Wrapped OAuth error messages in a more descriptive "Authentication failed: [message]" format.
    - Updated OAuth buttons to show an animated spinner and "Connecting..." text during the loading state.
    - Verified visual consistency of Google and GitHub buttons across both pages.

## 3. Error Handling
- **Issue:** Some Supabase auth errors (like "Invalid login credentials") could be more user-friendly.
- **Fix:** Added custom user-facing error messages for common scenarios in `Login.tsx`, specifically mapping "Invalid login credentials" to "Invalid email or password. Please try again."

## 4. Loading States & Consistency
- **Verified:** All primary action buttons (Sign in, Create account, Send reset link, OAuth) have appropriate loading states and disabled triggers while processing.
- **Verified:** Layouts, spacing, and icon usage are now identical between the two pages, providing a seamless transition for the user.
