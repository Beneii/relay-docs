# Council: Should We Expand the Agent Team?

## The honest answer: No, not yet. Maybe one.

The current team's bottleneck is not headcount. It's coordination latency. Every agent added multiplies the number of messages sonnet has to send, the number of results to synthesize, and the number of conflicting opinions to resolve in council votes. We already saw this — council rounds with three agents produce three plans that sonnet has to merge, and the merged result is often just "what opus said plus a few lines from the others." Adding a fourth voter doesn't improve decision quality. It adds another artifact to read.

## What's genuinely missing

### Testing agent — YES, this is the real gap

Nobody is running tests. Not once in 10 loops did any agent run `npm test`, verify that the test suite passes, or write a new test for shipped code. We have two test files (`tests/shared/product.test.ts` and `app/src/__tests__/limits.test.ts`) that are actively broken — they assert `notificationsPerMonth` is 100 when the actual value is 500. Nobody caught this until I audited strings in loop 10. That's embarrassing.

A testing agent wouldn't need to be in council votes or planning sessions. It would:
- Run `npm test` and `npm run typecheck` after every implementation loop
- Report failures to sonnet before the loop is marked "done"
- Flag untested code paths in new features
- Fix broken test assertions

This is a pure automation role, not a creative one. It doesn't add coordination overhead because it doesn't participate in decisions — it just gates merges. This is the one agent I'd add.

### Security agent — NO

Security review is important but intermittent. The XSS fix in invite emails (escapeHtml, header injection prevention) was done inline by whoever was editing `_email.ts`. The RLS policies were reviewed during the reform audit. A dedicated security agent sitting idle for 8 out of 10 loops is waste. Better approach: add security review as a checklist item for the reviewer (me) after implementation loops.

### Mobile agent — NO

The mobile app uses the same language (TypeScript), same patterns (React components, hooks), and same data layer (Supabase) as the web app. There's nothing about mobile development that requires a specialist agent. The quiet hours UI, settings screen changes, and notification history plan were all handled by general-purpose agents. A "mobile agent" would just be another generalist with a narrower label.

### UI/Design agent — NO

Design decisions in Relay are constrained by the existing system: Tailwind CSS vars, rounded-2xl cards, accent color, specific spacing tokens. Every agent already follows these patterns because they're visible in the code. A design agent would either parrot the existing system (useless) or propose changes that conflict with it (harmful). Design opinions should come from the human, not from another LLM.

## The coordination cost math

Current state: 3 agents + 1 coordinator = 4 entities.
- Council round: sonnet sends 3 tasks, reads 3 artifacts, synthesizes. ~6 messages.
- Implementation round: sonnet assigns 1-2 agents, reviews results. ~4 messages.
- Total per loop: ~10 coordinator messages.

Add 2 more agents (5 agents + 1 coordinator = 6 entities):
- Council round: 5 tasks, 5 artifacts to read and merge. ~10 messages.
- Implementation round: more agents to potentially assign, but work doesn't parallelize well (features depend on each other). Most agents idle.
- Total per loop: ~16 coordinator messages.
- 60% more coordination overhead for maybe 20% more throughput.

The problem is that most tasks are sequential. You can't build the frontend for team sharing while someone else is still writing the migration. Parallelism only works when tasks are truly independent, and in a single-product sprint, that's rare. More agents means more agents waiting.

## Where more agents would actively slow things down

1. **Council votes.** Three opinions is already one too many when two of them (codex, gemini) add noise rather than signal. Five opinions would make synthesis harder and take longer. Sonnet would spend more time reading artifacts than shipping code.

2. **Conflicting code changes.** Two agents editing the same file in parallel creates merge conflicts. With 3 agents we've avoided this by having sonnet assign non-overlapping files. With 5 agents, file ownership gets complicated.

3. **Context fragmentation.** Each agent has limited context about what others have done. More agents means more "read this file first" preambles, more stale assumptions, more wasted work. The coordinator becomes a bottleneck translating between agents who don't share memory.

## Recommendation

| Role | Add? | Reasoning |
|------|------|-----------|
| Testing agent | Yes | Automation role, no coordination overhead, fills a real gap |
| Security agent | No | Intermittent need, better as a review checklist |
| Mobile agent | No | Same stack, no specialization needed |
| UI/Design agent | No | Design is constrained by existing system, human should own this |
| Additional implementer | No | Bottleneck is sequential dependencies, not parallelism |

**Add the testing agent. Keep everything else the same. If anything, consider dropping gemini and running leaner — two sharp agents beat four mediocre ones.**
