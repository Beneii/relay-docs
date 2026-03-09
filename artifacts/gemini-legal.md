# Legal Pages Audit & Updates

## 1. Review of Legal Pages
- **src/pages/Terms.tsx:** Already contained robust, professional content customized for the Relay webhook service, detailing the description of service, Free/Pro plan details, acceptable use rules, and standard terms around liability and termination. No changes were necessary as it was already highly tailored.
- **src/pages/Privacy.tsx:** Already had good baseline professional content detailing the use of Supabase, Stripe, and Vercel, as well as data retention.

## 2. Updates Made
- **Privacy Policy Enhancement:** Updated `src/pages/Privacy.tsx` section "1. Information We Collect" to explicitly state that Relay collects and stores **device push tokens** (Apple/Google) and temporarily processes **notification payload content** (title and body). This fulfills the requirement to be fully transparent about the specific technical data the SaaS app touches to function.

Overall, both pages now have high-quality, non-placeholder legal copy that directly applies to a webhook-to-mobile push notification SaaS product.
