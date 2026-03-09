#!/usr/bin/env bash
# send.sh — Send a prompt to an AI agent's tmux pane by title
# Usage: ./send.sh <agent> "<message>"
# Helpers: source this script for `claude`, `codex`, `gemini` functions

set -euo pipefail

send_to_agent() {
  local agent="$1" message="$2"

  # Find pane by title
  local pane_id
  pane_id=$(tmux list-panes -a -F '#{pane_title} #{pane_id}' \
    | awk -v t="$agent" '$1 == t { print $2; exit }')

  if [[ -z "$pane_id" ]]; then
    echo "error: no tmux pane with title '$agent'" >&2
    return 1
  fi

  # Write message to temp file, load into tmux buffer, paste, enter
  local tmp
  tmp=$(mktemp)
  printf '%s' "$message" > "$tmp"
  tmux load-buffer "$tmp"
  tmux paste-buffer -t "$pane_id"
  tmux send-keys -t "$pane_id" C-m
  rm -f "$tmp"

  echo "sent to $agent ($pane_id)"
}

# Helper aliases
claude()  { send_to_agent claude  "$1"; }
codex()   { send_to_agent codex   "$1"; }
gemini()  { send_to_agent gemini  "$1"; }

# Direct invocation
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  if [[ $# -lt 2 ]]; then
    echo "usage: send.sh <agent> \"<message>\"" >&2
    exit 1
  fi
  send_to_agent "$1" "$2"
fi
