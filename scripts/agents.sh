#!/usr/bin/env bash
# agents.sh — Launch a tmux session with Claude Code, Codex CLI, and Gemini CLI
# Usage: ./scripts/agents.sh [directory]
# Defaults to current working directory if no directory given.

set -euo pipefail

SESSION="agents"
DIR="${1:-$(pwd)}"

# Kill existing session if present
tmux kill-session -t "$SESSION" 2>/dev/null || true

# Create session with first pane (Claude Code)
tmux new-session -d -s "$SESSION" -c "$DIR" -x 200 -y 50

# Set up three vertical panes side by side
tmux split-window -h -t "$SESSION" -c "$DIR"
tmux split-window -h -t "$SESSION" -c "$DIR"

# Even out the layout
tmux select-layout -t "$SESSION" even-horizontal

# Title each pane
tmux select-pane -t "$SESSION":0.0 -T claude
tmux select-pane -t "$SESSION":0.1 -T codex
tmux select-pane -t "$SESSION":0.2 -T gemini

# Show pane titles in tmux
tmux set-option -t "$SESSION" pane-border-status top
tmux set-option -t "$SESSION" pane-border-format " #{pane_title} "

# Launch each agent
tmux send-keys -t "$SESSION":0.0 "claude --dangerously-skip-permissions" C-m
tmux send-keys -t "$SESSION":0.1 "codex --yolo" C-m
tmux send-keys -t "$SESSION":0.2 "gemini --yolo" C-m

# Attach
tmux attach-session -t "$SESSION"
