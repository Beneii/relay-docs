# Review: Task-073 Landing Page Pivot (Codex)

- **RESULT:** needs-fixes
- **SPEC_COMPLIANCE:**
    - **Hero:** Pass (headline matches, CTA: "Get Started Free" & "View Documentation").
    - **Features:** Pass (4 features with correct descriptions and icons).
    - **How it works:** Pass (3 steps matching the new SDK-first flow).
    - **Code Demo:** Pass (Uses `@relayapp/sdk` and `actions` correctly).
    - **Personas:** Pass (Vibe-Coder, AI Agent Builder, Home Automator).
    - **Final CTA:** Pass (Matches headline/sub/button text).
- **ISSUES:**
    - **METAPHOR:** Line 323 has: "Relay is the pickaxe for people building their own tools...". This internal strategy term ("pickaxe") should be removed or changed to user-facing copy.
    - **DESYNC:** The `Pricing` page and `FAQ` content were not updated. The FAQ still claims "No SDKs, no dependencies," which contradicts the new "How it works" section.
- **SUGGESTED_FIX:** 
    - Change: "Relay is the pickaxe for people building their own tools — vibe-coders, agent operators, and home automators."
    - To: "Relay is the infrastructure for builders creating their own tools — vibe-coders, AI agent operators, and home automation enthusiasts."
- **VERDICT:** Fix first — specifically the FAQ contradiction and the "pickaxe" line.
- **CONFIDENCE:** 0.95
