# Agent Orchestration System (4-Agent)

## Environment

Four AI agents in tmux session `agents`, window `node`, side-by-side:

| Pane ID | Agent | CLI | Role |
|---------|-------|-----|------|
| `%0` | claude-sonnet | Claude Code (Sonnet) | Coordinator — delegates, synthesizes, decides |
| `%1` | codex | OpenAI Codex CLI | Coder — implements, patches, tests |
| `%2` | gemini | Google Gemini CLI | Analyst — debugging, edge cases, second opinion |
| `%3` | claude-opus | Claude Code (Opus) | Architect — deep reasoning, review, hard problems |

All agents share working directory: `~/Desktop/Relay`

## Messaging

### send.sh
```bash
./send.sh <agent> "<message>"
```

Aliases accepted:
- `claude-sonnet`, `claude`, `sonnet` → pane %0
- `codex` → pane %1
- `gemini` → pane %2
- `claude-opus`, `opus` → pane %3

Workers reply to coordinator:
```bash
./send.sh claude-sonnet "<response>"
```

### Message Format Rules

**DO:**
- Keep messages under 500 characters
- End delegations with: `Reply using ./send.sh claude-sonnet <short-tag>`
- Use short reply tags (e.g., `done-task-name`)
- Use periods instead of exclamation marks
- Use simple ASCII

**DON'T:**
- No `!` in Gemini messages (triggers shell mode — auto-stripped by send.sh)
- No rapid-fire sends (wait 2+ seconds between)
- No multiline messages (newlines submit early)
- No backticks in messages (shell interpretation)
- Avoid messages over 500 chars

**Safe special characters:** `( ) | ; . , - _ / =`

## Agent-Specific Quirks

| Agent | Quirk | Mitigation |
|-------|-------|------------|
| Codex | Needs double Enter to submit | send.sh handles automatically |
| Gemini | `!` triggers shell mode | send.sh strips `!` automatically |
| Gemini | Has Nano Banana image generation | Save images to `artifacts/` with unique names |
| Claude Opus | Prompts for shell command approval | Select "don't ask again" or notify coordinator |
| All | Pane titles are unstable | send.sh uses pane IDs, not titles |

## Coordinator Rules (claude-sonnet)

1. **Stay lightweight** — delegate, don't do heavy work yourself
2. **Keep context free** to receive messages and respond quickly
3. **Never block** waiting for a response — continue reasoning or handle other tasks
4. **Monitor agents** via `tmux capture-pane -t %<id> -p | tail -10`

## When to Use Which Agent

| Task Type | Send to |
|-----------|---------|
| Write code, create files, refactor | codex |
| Bug analysis, edge cases, code review | gemini |
| Architecture decisions, complex reasoning | claude-opus |
| Quick implementation + review needed | codex + gemini in parallel |
| Critical decision | council (all three) |

## Council Pattern

For non-trivial decisions, get input from all three workers:

```bash
# Send to all three in parallel
./send.sh codex "How would you implement <feature>. Reply using ./send.sh claude-sonnet council-codex-<topic>"
./send.sh gemini "What are the edge cases and risks for <feature>. Reply using ./send.sh claude-sonnet council-gemini-<topic>"
./send.sh claude-opus "Review this architecture decision: <feature>. Reply using ./send.sh claude-sonnet council-opus-<topic>"
```

Then claude-sonnet synthesizes the three perspectives and decides.

**When to use council:**
- Architectural changes affecting multiple systems
- Security-sensitive decisions
- Trade-offs with no obvious winner
- Before major refactors

**When NOT to use council:**
- Simple bug fixes
- Routine implementation
- Tasks with clear solutions

## Recovery Procedures

### Agent not responding
1. Check pane: `tmux capture-pane -t %<id> -p | tail -10`
2. If at prompt: `tmux send-keys -t %<id> Enter`
3. If in error state: `tmux send-keys -t %<id> Escape`
4. If crashed: notify user for manual restart

### Gemini stuck in shell mode
1. `tmux send-keys -t %2 Escape`
2. Verify shows `* Type your message`
3. Resend without `!`

### Opus approval prompt
1. `tmux send-keys -t %3 Enter` (approve)
2. Or select option 2 to auto-approve that command

### Layout reset
```bash
tmux select-layout -t agents:node even-horizontal
```

## Artifacts

- `artifacts/` is append-only — never overwrite existing files
- Agent reports, images, and work products go here
- Use descriptive unique filenames
