#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$SCRIPT_DIR/logs"
SESSION="relay-agents"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

case "${1:-start}" in
  start)
    # Check if session already exists
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      echo -e "${YELLOW}Session '$SESSION' already running. Attaching...${NC}"
      tmux attach -t "$SESSION"
      exit 0
    fi

    mkdir -p "$LOG_DIR"

    # Check CLIs
    echo -e "${CYAN}Checking agent CLIs...${NC}"
    ALL_OK=true
    for cli in claude codex gemini; do
      if command -v "$cli" &>/dev/null; then
        echo -e "  ${GREEN}$cli${NC}: $(which "$cli")"
      else
        echo -e "  ${RED}$cli${NC}: NOT FOUND"
        ALL_OK=false
      fi
    done

    if [ "$ALL_OK" = false ]; then
      echo -e "${RED}Missing CLIs. Install them first.${NC}"
      exit 1
    fi

    echo -e "${CYAN}Starting tmux session: $SESSION${NC}"
    echo ""

    # Create tmux session with 4 panes
    # Layout:
    # ┌──────────────────┬──────────────────┐
    # │  Claude (orch.)  │  MCP event log   │
    # ├──────────────────┼──────────────────┤
    # │  Codex (worker)  │  Gemini (worker) │
    # └──────────────────┴──────────────────┘

    # Pane 0: Claude orchestrator
    tmux new-session -d -s "$SESSION" -n main -x 200 -y 50

    # Pane 1: MCP event log (right of pane 0)
    tmux split-window -h -t "$SESSION:main"

    # Pane 2: Codex worker (below pane 0)
    tmux split-window -v -t "$SESSION:main.0"

    # Pane 3: Gemini worker (below pane 1)
    tmux split-window -v -t "$SESSION:main.1"

    # Set up each pane
    # Pane 0: Claude — the orchestrator
    tmux send-keys -t "$SESSION:main.0" "echo -e '${GREEN}=== Claude Code (orchestrator) ===${NC}'" Enter
    tmux send-keys -t "$SESSION:main.0" "echo 'Claude is the planner. Use MCP tools: codex_run, gemini_run'" Enter
    tmux send-keys -t "$SESSION:main.0" "echo 'Start Claude with: claude'" Enter
    tmux send-keys -t "$SESSION:main.0" "cd $PROJECT_DIR" Enter

    # Pane 1: Event log
    tmux send-keys -t "$SESSION:main.1" "echo -e '${CYAN}=== MCP Event Log ===${NC}'" Enter
    tmux send-keys -t "$SESSION:main.1" "touch $LOG_DIR/events.jsonl" Enter
    tmux send-keys -t "$SESSION:main.1" "tail -f $LOG_DIR/events.jsonl 2>/dev/null | while IFS= read -r line; do echo \"\$(date '+%H:%M:%S') \$line\"; done" Enter

    # Pane 2: Codex direct access
    tmux send-keys -t "$SESSION:main.2" "echo -e '${YELLOW}=== Codex CLI (sub-agent) ===${NC}'" Enter
    tmux send-keys -t "$SESSION:main.2" "echo 'Codex is called by Claude via MCP. Direct access here for testing.'" Enter
    tmux send-keys -t "$SESSION:main.2" "cd $PROJECT_DIR" Enter

    # Pane 3: Gemini direct access
    tmux send-keys -t "$SESSION:main.3" "echo -e '${RED}=== Gemini CLI (sub-agent) ===${NC}'" Enter
    tmux send-keys -t "$SESSION:main.3" "echo 'Gemini is called by Claude via MCP. Direct access here for testing.'" Enter
    tmux send-keys -t "$SESSION:main.3" "cd $PROJECT_DIR" Enter

    # Select the Claude pane
    tmux select-pane -t "$SESSION:main.0"

    echo -e "${GREEN}Session ready.${NC}"
    echo ""
    echo "Architecture:"
    echo "  Claude (pane 0) = orchestrator + planner"
    echo "  Codex (pane 2)  = code generation sub-agent (via MCP)"
    echo "  Gemini (pane 3) = design/critique sub-agent (via MCP)"
    echo "  Event log (pane 1) = MCP call log"
    echo ""
    echo "MCP server registered in .mcp.json"
    echo "Claude can call: codex_run, gemini_run"
    echo ""
    echo -e "Attaching to session..."

    tmux attach -t "$SESSION"
    ;;

  stop)
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      tmux kill-session -t "$SESSION"
      echo -e "${GREEN}Session '$SESSION' killed${NC}"
    else
      echo -e "${YELLOW}No session '$SESSION' found${NC}"
    fi
    ;;

  status)
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      echo -e "${GREEN}Session '$SESSION' is running${NC}"
      tmux list-panes -t "$SESSION" -F "  Pane #{pane_index}: #{pane_current_command} (#{pane_width}x#{pane_height})"
      echo ""
      echo "Last 5 MCP events:"
      tail -5 "$LOG_DIR/events.jsonl" 2>/dev/null || echo "  (none yet)"
    else
      echo -e "${RED}Session '$SESSION' not running${NC}"
    fi
    ;;

  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
