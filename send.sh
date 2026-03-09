#!/bin/bash
# send.sh — Send a message to another agent's tmux pane
# Usage: ./send.sh <agent> "<message>"
# Agents: claude-sonnet, codex, gemini, claude-opus (also accepts short aliases)

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

# Sanitize message: strip exclamation marks for Gemini (triggers shell mode)
if [ "$AGENT" = "gemini" ]; then
  MESSAGE="${MESSAGE//!/}"
fi

# Send the message to the target pane
# Using send-keys with literal flag to avoid key-name interpretation
tmux send-keys -t "$PANE" -l "$MESSAGE"
# Press Enter to submit
# Codex and claude-sonnet need a short delay before Enter
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
