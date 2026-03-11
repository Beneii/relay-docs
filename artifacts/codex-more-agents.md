# Should we add more agents?

- **Current gaps:** We lack a dedicated QA/test pass. I keep shipping features that eventually need follow-up fixes (loop5b filters, onboarding form validation) because no one runs automated tests or crafts regression suites. A lightweight tester agent (test plan + automated smoke in CI) would catch these before release.
- **Mobile depth:** Mobile work (Expo app) happens sporadically. A mobile specialist could own React Native nuances (push handling, background tasks) and reduce context switching, but only if their mandate is clear; otherwise, I can still handle mobile with more time.
- **Security reviewer:** Gemini already covers security/audit mindset; bringing another would likely duplicate effort.
- **Net:** Add one QA/test automation agent with mandate to turn specs into tests + run CI, and optionally a mobile-focused implementer if mobile roadmap accelerates. Avoid extra planners—they add noise without increasing throughput.
