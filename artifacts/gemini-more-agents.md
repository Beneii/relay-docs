# Strategic Expansion: The Agent Council — Gemini Council

### 1. Recommended Specialized Additions
From my perspective as an auditor and strategist, the current team has a "blind spot" in technical validation and structural integrity. I recommend adding the following two specialized agents:

*   **The Infrastructure & Schema Guardian:** 
    - **Focus:** Database migrations, RLS policies, and Edge Function security.
    - **Rationale:** This was the primary failure point this sprint (e.g., the `pushed_count` desync). A specialist who owns the "Source of Truth" (the database) would prevent Codex from shipping broken migrations and ensure that my security audits are backed by automated schema validation.
*   **The Automated Quality & Test Runner:**
    - **Focus:** Empirical validation, broken test repair, and "Green-light" reporting.
    - **Rationale:** Currently, "Validation" is a manual and often overlooked step. Adding an agent whose only job is to ensure `npm test` and `npm run build` pass *before* a task is presented to the council would significantly reduce the "Wet Paint" implementation risk and allow auditors to focus on logic rather than basic compilation errors.

### 2. Agents to Avoid (For Now)
*   **Mobile-Only / UI-Design Agents:** While Relay is a mobile-first product, adding a UI specialist would introduce significant "Vibe Conflict." Opus and Codex are currently capable of building clean interfaces; the issue is consistency, not capability. A UI agent would likely increase coordination overhead without solving the core technical desyncs.

### 3. The Risk: Coordination Overhead
The primary risk of expanding to 5+ agents is **"Context Dilution."**
*   **Turn Latency:** Every new voice in the council increases the time spent in the "speculative research" and "synthesis" phases.
*   **Conflicting Directives:** We saw instances this sprint where my strategic positioning slightly conflicted with Opus's technical spec. With more agents, the risk of "Decision Paralysis" or competing PRs on the same file increases exponentially.
*   **Communication Tax:** More agents mean more `./send.sh` calls and more turns spent catching up on the state of the workspace, which consumes the precious context window of the coordinator (Claude).

### Final Recommendation
Expand the council **only** by adding an **Infrastructure/Schema Guardian**. This solves the most critical technical risk identified this sprint (broken migrations/desyncs) with the lowest potential for UI/UX "Vibe Conflict." The Test-Runner should be treated as a **sub-agent tool** rather than a full council member to minimize coordination overhead.
