# Obelisk: Multi-Agent CLI Orchestration System

## What This Document Is

A complete specification for building "Obelisk" — a tool that orchestrates multiple AI CLI agents (Claude Code, OpenAI Codex CLI, Google Gemini CLI, and potentially others) inside tmux, with a coordinator agent that delegates tasks, collects results, and synthesizes decisions.

This is based on a working prototype that has been tested extensively. Everything below includes what works, what breaks, and what needs to be built properly.

---

## 1. Architecture Overview

### Core Concept

Multiple AI CLI tools run side-by-side in tmux panes. One agent acts as "coordinator" (delegates work, stays lightweight). The others are "workers" (execute tasks, report back). Communication happens by programmatically typing messages into each agent's tmux pane.

### Current Working Prototype

```
tmux session: "agents"
+-------------------+-------------------+-------------------+-------------------+
| Pane %0           | Pane %1           | Pane %2           | Pane %3           |
| claude-sonnet     | codex             | gemini            | claude-opus       |
| (Coordinator)     | (Coder)           | (Analyst)         | (Architect)       |
| Claude Code CLI   | OpenAI Codex CLI  | Google Gemini CLI | Claude Code CLI   |
+-------------------+-------------------+-------------------+-------------------+
All share working directory: ~/Desktop/Relay
```

### Communication Flow

```
User → Coordinator (claude-sonnet)
Coordinator → Workers (via send.sh typing into tmux panes)
Workers → Coordinator (via send.sh typing back into coordinator's pane)
Coordinator → User (via ntfy push notification + direct output)
```

---

## 2. Agent CLI Details

### 2.1 Claude Code CLI

- **Binary**: `claude`
- **Bypass permissions flag**: `--dangerously-skip-permissions`
  - This skips ALL tool approval prompts (file writes, bash commands, etc.)
  - Without it, Claude Code prompts the user to approve each tool call interactively
  - The flag name is intentionally scary — it gives the agent full unsupervised access
- **Model selection**: `--model claude-sonnet-4-5-20250514` or `--model claude-opus-4-6` etc.
- **Resume sessions**: `claude --resume` resumes the last conversation, `claude --continue` continues with context
- **Print mode**: `claude -p "prompt"` for non-interactive single-shot usage
- **Settings file**: `.claude/settings.local.json` in project root can allowlist specific tools:
  ```json
  {
    "permissions": {
      "allow": [
        "Bash(npm test)",
        "mcp__resend__send-email"
      ]
    }
  }
  ```
- **System prompt**: `--system-prompt "text"` or via CLAUDE.md file in project root
- **Quirks**:
  - Needs double Enter to submit in some contexts (the first Enter sometimes just creates a newline)
  - When running as coordinator, agent replies from other agents arrive as `<system-reminder>` tagged content in the conversation
  - Has context compression — automatically compresses older messages when approaching context limits
  - Opus model sometimes prompts for approval even with `--dangerously-skip-permissions` for certain high-risk operations

### 2.2 OpenAI Codex CLI

- **Binary**: `codex`
- **Bypass permissions flag**: `--yolo`
  - Skips all confirmation prompts, auto-approves file writes and command execution
- **Model**: Uses whatever model is configured (currently gpt-5.4 equivalent)
- **Quirks**:
  - **Needs double Enter to submit** — after typing the message, you must send Enter, wait ~0.5s, then send Enter again. Single Enter often just moves cursor without submitting
  - Works well for focused coding tasks — give it a file and a task
  - Less capable at multi-step reasoning compared to Claude
  - Good at: writing code, running tests, file manipulation
  - Messages are received as plain text input

### 2.3 Google Gemini CLI

- **Binary**: `gemini`
- **Bypass permissions flag**: `--yolo`
  - Auto-approves all tool use without prompting
- **Model**: Gemini 3 (or whatever is current)
- **Quirks**:
  - **CRITICAL: `!` triggers shell mode** — if any message contains an exclamation mark, Gemini interprets it as a shell command prefix and enters shell execution mode instead of treating it as a prompt. Must strip all `!` from messages before sending.
  - When stuck in shell mode: send `Escape` key to return to prompt mode, verify it shows `* Type your message` before resending
  - Has "Nano Banana" image generation capability — can generate and save images
  - Good at: analysis, debugging, finding edge cases, second opinions
  - Messages are received as plain text input at the prompt

### 2.4 Adding Other Agents

The system should be extensible. Potential additions:
- **Cursor CLI** (if it gets one)
- **Aider** (`aider --yes` for auto-approve)
- **Continue CLI**
- **Custom MCP-based agents**

Each agent needs to define:
1. Binary/command to launch
2. Bypass permissions flag(s)
3. Submit behavior (single Enter, double Enter, etc.)
4. Character restrictions (like Gemini's `!` issue)
5. How to detect "ready" state (prompt visible, not processing)
6. How to recover from error/stuck states
7. Model selection flags

---

## 3. The send.sh Script (Current Working Version)

This is the core messaging primitive. It types a message into an agent's tmux pane and presses Enter.

```bash
#!/bin/bash
# send.sh — Send a message to another agent's tmux pane
# Usage: ./send.sh <agent> "<message>"

set -euo pipefail

AGENT="${1:?Usage: ./send.sh <agent> \"<message>\"}"
MESSAGE="${2:?Usage: ./send.sh <agent> \"<message>\"}"

# Map agent names to tmux pane IDs (stable, not title-based)
case "$AGENT" in
  claude-sonnet|claude|sonnet)  PANE="%0" ;;
  codex)                        PANE="%1" ;;
  gemini)                       PANE="%2" ;;
  claude-opus|opus)             PANE="%3" ;;
  *)
    echo "Unknown agent: $AGENT" >&2
    echo "Valid: claude-sonnet, codex, gemini, claude-opus" >&2
    exit 1
    ;;
esac

# Sanitize: strip exclamation marks for Gemini (triggers shell mode)
if [ "$AGENT" = "gemini" ]; then
  MESSAGE="${MESSAGE//!/}"
fi

# Send the message using literal flag to avoid key-name interpretation
tmux send-keys -t "$PANE" -l "$MESSAGE"

# Press Enter — Codex and Claude need double Enter with delay
case "$AGENT" in
  codex|claude-sonnet|claude|sonnet)
    sleep 0.5
    tmux send-keys -t "$PANE" Enter
    sleep 0.3
    tmux send-keys -t "$PANE" Enter
    ;;
  *)
    tmux send-keys -t "$PANE" Enter
    ;;
esac
```

### What Works

- Pane IDs (`%0`, `%1`, etc.) are stable across the session lifetime — pane titles are NOT stable and should never be used for routing
- The `-l` (literal) flag on `tmux send-keys` prevents tmux from interpreting the message as key names
- Agent name aliases (e.g., `opus` -> `%3`) work well for convenience
- Stripping `!` for Gemini prevents shell mode activation
- Double Enter with delay for Codex reliably submits messages

### What Doesn't Work / Known Issues

- **No multiline messages** — newlines cause premature submission. All messages must be single-line.
- **Character limit ~500** — longer messages get truncated or cause issues. Recommend keeping under 500 chars.
- **No backticks in messages** — shell interpretation can mangle them
- **No delivery confirmation** — you send the message but have no way to know if the agent received and processed it
- **No queue** — if you send messages too fast (< 2 seconds apart), they can interleave or get lost
- **Pane IDs are session-scoped** — if you restart the tmux session, pane IDs reset and the mapping may change
- **No escaping for special shell chars** — the `-l` flag handles most cases but edge cases exist

### Message Format Rules

**Safe characters**: `( ) | ; . , - _ / = : @ # $ % ^ & * + < > ?`
**Unsafe**: `` ` `` (backtick), `!` (for Gemini), newlines
**Max length**: ~500 characters recommended, ~350 tested reliable

---

## 4. Session Launcher (Current Working Version)

```bash
#!/usr/bin/env bash
# agents.sh — Launch a tmux session with all agents
# Usage: ./scripts/agents.sh [directory]

set -euo pipefail

SESSION="agents"
DIR="${1:-$(pwd)}"

# Kill existing session if present
tmux kill-session -t "$SESSION" 2>/dev/null || true

# Create session with first pane
tmux new-session -d -s "$SESSION" -c "$DIR" -x 200 -y 50

# Set up panes side by side
tmux split-window -h -t "$SESSION" -c "$DIR"
tmux split-window -h -t "$SESSION" -c "$DIR"

# Even out layout
tmux select-layout -t "$SESSION" even-horizontal

# Title each pane
tmux select-pane -t "$SESSION":0.0 -T claude
tmux select-pane -t "$SESSION":0.1 -T codex
tmux select-pane -t "$SESSION":0.2 -T gemini

# Show pane titles
tmux set-option -t "$SESSION" pane-border-status top
tmux set-option -t "$SESSION" pane-border-format " #{pane_title} "

# Launch each agent with full auto-approve
tmux send-keys -t "$SESSION":0.0 "claude --dangerously-skip-permissions" C-m
tmux send-keys -t "$SESSION":0.1 "codex --yolo" C-m
tmux send-keys -t "$SESSION":0.2 "gemini --yolo" C-m

# Attach
tmux attach-session -t "$SESSION"
```

### What's Missing From the Launcher

- No 4th pane (claude-opus was added manually later)
- No health checks — doesn't verify agents actually started
- No model selection — uses defaults
- No custom system prompts injected at launch
- No session resume capability
- No config file — everything hardcoded
- No error handling if a CLI binary is missing

---

## 5. Coordinator Pattern

The coordinator (currently claude-sonnet in pane %0) follows this cycle:

```
PLAN → DELEGATE → WAIT → REVIEW → SYNTHESIZE → STOP (notify user)
```

### Delegation Template

```bash
./send.sh codex "Implement X in src/foo.ts. Write results to artifacts/codex-taskname.md. Reply using ./send.sh claude-sonnet done-taskname"
./send.sh gemini "Review src/foo.ts for edge cases. Write results to artifacts/gemini-taskname.md. Reply using ./send.sh claude-sonnet review-taskname"
```

### Key Rules

1. **Always include reply instructions** — tell the worker how to respond (which agent to send to, what tag to use)
2. **Always include artifact path** — workers write detailed results to `artifacts/` since messages are limited to ~500 chars
3. **Keep messages under 500 chars** — detailed context goes in files, not messages
4. **Don't block waiting** — continue reasoning or handle other tasks while workers process
5. **Always verify work** — have one agent review another's output before accepting

### Council Pattern (Multi-Agent Consensus)

For non-trivial decisions, query all workers in parallel:

```bash
./send.sh codex "How would you implement <feature>? Reply ./send.sh claude-sonnet council-codex-<topic>"
./send.sh gemini "What are edge cases and risks for <feature>? Reply ./send.sh claude-sonnet council-gemini-<topic>"
./send.sh claude-opus "Review architecture for <feature>. Reply ./send.sh claude-sonnet council-opus-<topic>"
```

Coordinator collects all three responses and synthesizes a decision.

### Monitoring Workers

```bash
# Check what an agent is doing
tmux capture-pane -t %1 -p | tail -10

# Check if agent is at prompt (idle) or processing
tmux capture-pane -t %2 -p | tail -3
```

---

## 6. Recovery Procedures

| Problem | Detection | Fix |
|---------|-----------|-----|
| Agent not responding | `capture-pane` shows no activity | `tmux send-keys -t %<id> Enter` |
| Agent in error state | Error message visible in pane | `tmux send-keys -t %<id> Escape` then retry |
| Gemini stuck in shell mode | Pane shows `$` or shell prompt | `tmux send-keys -t %2 Escape`, verify `* Type your message` shows |
| Opus approval prompt | Pane shows permission dialog | `tmux send-keys -t %3 Enter` to approve |
| Agent crashed/exited | Pane shows shell prompt (`$`/`%`) | Relaunch: `tmux send-keys -t %<id> "claude --dangerously-skip-permissions" C-m` |
| Layout broken | Panes uneven/overlapping | `tmux select-layout -t agents:node even-horizontal` |
| Context exhausted | Agent says context limit reached | Kill and restart agent, or use `claude --resume` for Claude |

---

## 7. Notifications

The current system uses ntfy.sh for push notifications to the user's phone:

```bash
curl -d "Task complete: deployed v2.1" https://ntfy.sh/<topic-id>
```

Send notifications when:
- A work cycle completes
- Waiting for user input
- A task finishes
- Something fails and needs attention

---

## 8. What Obelisk Should Build On Top Of This

### 8.1 Configuration System

Replace hardcoded values with a config file:

```yaml
# obelisk.yaml
session:
  name: agents
  directory: ~/Desktop/Relay
  layout: even-horizontal  # or tiled, main-horizontal, etc.

agents:
  coordinator:
    name: claude-sonnet
    cli: claude
    model: claude-sonnet-4-5-20250514
    flags: ["--dangerously-skip-permissions"]
    aliases: [claude, sonnet]
    submit: double-enter  # single-enter | double-enter
    submit_delay: 0.5
    sanitize: []
    system_prompt: "You are the coordinator. Delegate work, don't do it yourself."

  workers:
    - name: codex
      cli: codex
      flags: ["--yolo"]
      aliases: []
      submit: double-enter
      submit_delay: 0.5
      sanitize: []
      role: "Coder — implements, patches, tests"

    - name: gemini
      cli: gemini
      flags: ["--yolo"]
      aliases: []
      submit: single-enter
      sanitize:
        - strip: "!"  # triggers shell mode
      role: "Analyst — debugging, edge cases, second opinion"

    - name: claude-opus
      cli: claude
      model: claude-opus-4-6
      flags: ["--dangerously-skip-permissions"]
      aliases: [opus]
      submit: double-enter
      submit_delay: 0.5
      sanitize: []
      role: "Architect — deep reasoning, review, hard problems"

notifications:
  provider: ntfy
  topic: relay-amber-orbit-7f3k2q9m
  events: [cycle-complete, waiting, task-done, failure]

artifacts:
  directory: artifacts/
  append_only: true

message_limits:
  max_chars: 500
  safe_chars: "() | ; . , - _ / = : @ # $ % ^ & * + < > ?"
  forbidden_chars_global: ["`", "\n"]
```

### 8.2 Pre-Saved Configs / Profiles

```bash
obelisk start --profile relay     # loads obelisk.relay.yaml
obelisk start --profile research  # loads obelisk.research.yaml — maybe 2 agents only
obelisk start --profile review    # loads obelisk.review.yaml — all agents, read-only
```

### 8.3 Session Resume

```bash
obelisk resume                   # resume last session
obelisk resume --session abc123  # resume specific session
```

This needs to:
1. Reconnect to existing tmux session (if still alive)
2. For Claude Code agents: use `claude --resume` to continue conversation
3. For other agents: can't resume — restart fresh, but inject context summary
4. Save/restore coordinator state (what tasks were delegated, what's pending)

### 8.4 Agent Health Monitoring

```bash
obelisk status  # show all agent states
```

Each agent needs:
- **Readiness detection**: Is it at a prompt and ready to receive messages?
- **Busy detection**: Is it currently processing a task?
- **Error detection**: Is it in an error state?
- **Crash detection**: Did the process exit?

Implementation: periodically `tmux capture-pane` and parse the output for known patterns:
- Claude Code ready: shows `>` prompt or `claude >`
- Codex ready: shows prompt
- Gemini ready: shows `* Type your message`
- Error states: look for error keywords, stack traces, etc.

### 8.5 Message Queue

Replace fire-and-forget with a proper queue:
1. Messages are queued per-agent
2. Only sent when agent is detected as ready (at prompt)
3. Delivery confirmation via pane content monitoring
4. Retry with backoff on failure
5. Priority levels (urgent messages skip queue)

### 8.6 Context Compression / Idle Management

When an agent will be idle:
- For Claude Code: context compression happens automatically, but you could also `/compact` the conversation
- For Codex/Gemini: no built-in compression — may need to restart with a summary
- Track token usage per agent if possible
- Auto-restart with context summary when approaching limits

### 8.7 Re-Authentication

Agents may need re-auth during long sessions:
- **Claude Code**: Uses API key from environment (`ANTHROPIC_API_KEY`) — doesn't expire during session
- **Codex CLI**: Uses OpenAI API key — may need refresh
- **Gemini CLI**: Uses Google auth — `gcloud auth` tokens expire
- Obelisk should detect auth failures (parse pane output for auth error patterns) and either:
  - Notify user to re-authenticate
  - Auto-run auth refresh commands if configured

### 8.8 Proper CLI / TUI

```bash
obelisk start                    # launch from config
obelisk start --agents 3         # quick start with N agents
obelisk send codex "do the thing"  # send message from outside
obelisk status                   # agent health
obelisk logs codex               # tail agent's pane output
obelisk kill                     # gracefully stop all agents
obelisk add gemini               # add an agent to running session
obelisk remove codex             # remove an agent
obelisk council "should we refactor auth?"  # trigger council pattern
```

---

## 9. Known Pain Points to Solve

### 9.1 No Reliable Delivery Confirmation
**Problem**: You type into a pane but have no idea if the agent actually received and started processing it.
**Solution**: After sending, monitor the pane content for changes. If the agent echoes the prompt or starts generating output, it was received.

### 9.2 Message Size Limits
**Problem**: Complex tasks can't be described in 500 chars.
**Solution**: Write detailed instructions to a temp file, then send a short message like "Read instructions from /tmp/obelisk-task-123.md and execute them."

### 9.3 No Structured Communication
**Problem**: Agents reply in natural language which is hard to parse programmatically.
**Solution**: Define a reply protocol. Workers write structured results to artifact files. The reply message is just a signal: "done-taskname" or "failed-taskname".

### 9.4 Pane ID Instability Across Sessions
**Problem**: Pane IDs (`%0`, `%1`) are assigned by tmux at creation time and aren't stable across session restarts.
**Solution**: Use environment variables or a mapping file written at session creation time. Or use tmux pane titles + a lookup, though titles can be unstable too.

### 9.5 No Task Tracking
**Problem**: The coordinator has to remember what it delegated and what's pending.
**Solution**: A task database (SQLite or JSON file) that tracks:
- Task ID, description, assigned agent, status, created_at, completed_at
- Artifact paths for results
- Dependencies between tasks

### 9.6 Agent Context Windows Fill Up
**Problem**: Long-running agents eventually hit context limits and degrade.
**Solution**:
- Monitor response quality/length as a proxy for context pressure
- Auto-restart agents with a context summary when they're idle
- Claude Code's `--resume` helps but still has limits

---

## 10. Security Considerations

- `--dangerously-skip-permissions` and `--yolo` give agents **unrestricted access** to the filesystem and shell. Only use in trusted environments.
- Agents can read/write any file the user has access to, execute arbitrary commands, make network requests
- The `send.sh` script is a shell injection surface — messages are passed through bash. The `-l` flag on `tmux send-keys` mitigates most issues but isn't perfect.
- Never run this on production servers or with production credentials accessible
- Consider sandboxing: Docker containers, VMs, or restricted user accounts per agent

---

## 11. Summary of CLI Permission Bypass Flags

| CLI | Flag | Effect |
|-----|------|--------|
| Claude Code | `--dangerously-skip-permissions` | Skips all tool approval prompts |
| OpenAI Codex | `--yolo` | Auto-approves all operations |
| Google Gemini | `--yolo` | Auto-approves all tool use |
| Aider | `--yes` | Auto-confirms all prompts |
| Claude Code (granular) | `.claude/settings.local.json` `permissions.allow` array | Allowlist specific tools without full bypass |

---

## 12. File Structure for Obelisk

```
obelisk/
  bin/
    obelisk              # main CLI entrypoint
  src/
    config.ts            # YAML config parser
    session.ts           # tmux session management
    agent.ts             # agent abstraction (launch, send, monitor, kill)
    coordinator.ts       # coordinator logic, task tracking
    messenger.ts         # message queue, delivery confirmation
    health.ts            # agent health monitoring
    recovery.ts          # error detection and auto-recovery
    notifications.ts     # ntfy / other push notification providers
    artifacts.ts         # artifact file management
    auth.ts              # re-authentication detection and handling
  profiles/
    default.yaml         # default config
  templates/
    system-prompts/
      coordinator.md
      coder.md
      analyst.md
      architect.md
```
