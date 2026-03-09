## Hermes Multi-Agent Audit Plan Review

### PASS

- **Clear orchestration model** — Hermes as sole orchestrator with explicit no-write, no-spawn rules for subagents. Good guardrails.
- **Clean scope partitioning** — Tasks 2 (mobile) and 3 (web+backend) have explicit `Forbidden` lists that prevent overlap.
- **Layered review** — Security review (Task 4) correctly re-examines auth/billing surfaces already covered by Task 3, but from a security-specific lens. Task 5 (Claude) then reviews all findings. Appropriate redundancy.
- **Success criteria** are concrete and measurable.

---

### CONCERNS

1. **`artifacts/patch.diff` violates read-only rules** — The plan states "No subagent may... modify source files" and "this audit is read-only," yet Task 6 (Hermes synthesis) outputs `artifacts/patch.diff`. A patch implies intent to modify source. This is contradictory — it should either be removed or the rules should clarify that *suggested* patches are acceptable as artifacts but must not be applied without human approval.

2. **Hermes synthesis has no defined scope** — Tasks 1–5 all list explicit `Scope:` sections. Task 6 lists only outputs. It's implied Hermes reads the other artifacts, but this should be explicit to maintain the plan's own consistency standard.

3. **No agent-identity enforcement** — The plan says subagents can't spawn agents or rewrite the plan, but there's no described mechanism to enforce this (sandboxing, permission flags, tool restrictions). These rules are aspirational without enforcement.

---

### SCOPE GAPS

| Missing area | Risk |
|---|---|
| **`Relay/` directory** (iOS/macOS native code, `Relay.xcodeproj`, `agent_bus.py`, `mcp_agents.py`, `start_relay.sh`) | Completely unaudited. The Python agent scripts and shell launcher are security-relevant. |
| **`RelayTests/`, `RelayUITests/`** | Native test suites ignored — no quality assessment of iOS test coverage. |
| **`scripts/`** | Build/utility scripts unaudited. Could contain hardcoded secrets or unsafe operations. |
| **`docs/`** | Not reviewed for accuracy or staleness against actual code. |
| **`.env.local`, `.env.production`, `.env.production.local`** | No task checks whether secrets are committed or `.gitignore` is correctly configured. |
| **`playwright-audit.js`** | E2E test setup not covered by any task. |
| **`tsconfig.json`, `index.html`** | Not in any scope list (minor, but completeness gap). |
| **`.mcp.json`** | MCP server configuration — potentially sensitive, not audited. |
| **`public/`** | Static assets unchecked (could contain stale/sensitive files). |

The `Relay/` gap is the most significant — it contains Python scripts (`agent_bus.py`, `mcp_agents.py`) that appear to be the agent infrastructure itself, which should absolutely be in scope for a security audit.

---

### UNSAFE OVERLAPS

- **`api/**` and `backend/**`** appear in both Task 3 (web+backend audit) and Task 4 (security review). This is intentional and safe since Task 3 is a general code quality audit while Task 4 is security-focused. No conflict.
- **`package.json`** appears in Tasks 1, 3, and 4. Again safe for read-only analysis from different angles.
- No actual unsafe overlaps detected — the read-only constraint makes parallel analysis safe.

---

### MISSING VALIDATION STEPS

1. **No secret-leak scan** — No task checks for committed secrets, API keys in source, or `.env` files tracked by git. The `.gitignore` is currently modified (per git status) which warrants inspection.
2. **No dependency vulnerability scan** — Task 1 inventories packages but doesn't run `npm audit` or equivalent.
3. **No build verification** — Success criteria say "build and test commands have been attempted" but no task explicitly runs `npm run build` or `npm test` to verify the codebase compiles.
4. **No CORS/CSP audit** — For a web app with auth + webhooks + Stripe, Content-Security-Policy and CORS configuration should be reviewed.
5. **No Vercel deployment config validation** — `vercel.json` is in Task 3's scope list but there's no explicit check for function timeout limits, route misconfigurations, or exposed endpoints.
6. **No cross-boundary validation** — No task verifies that the mobile app (`app/`) and web app (`src/`) use consistent auth flows, API contracts, or shared types.

---

### FINAL RECOMMENDATION

**Conditionally approve with revisions.** The plan is well-structured with good separation of concerns and appropriate safety rails. However:

1. **Must fix**: Add the `Relay/` directory (especially the Python agent scripts) to either Task 3 or Task 4's scope — these are security-critical.
2. **Must fix**: Resolve the `patch.diff` vs read-only contradiction.
3. **Should fix**: Add a secret-leak and dependency vulnerability scan to Task 1.
4. **Should fix**: Add `scripts/`, `.env*` patterns, and `.mcp.json` to at least one task's scope.
5. **Nice to have**: Add cross-boundary validation between mobile and web auth flows.
