#!/usr/bin/env python3
"""
Agent Bus — routes messages between Claude, Codex, and Gemini CLIs.

Each agent has an inbox and outbox. The bus polls inboxes every 2 seconds.
When a message arrives, it claims it atomically (rename), runs the agent,
writes the result to the agent's outbox, and forwards it to the next agent's inbox.

Routing: Codex -> Gemini -> Claude -> Codex (circular)
"""

import os
import sys
import time
import subprocess
import logging
import tempfile
import signal
import json
from datetime import datetime
from pathlib import Path

BUS_DIR = Path(__file__).parent / "bus"
LOG_DIR = Path(__file__).parent / "logs"

AGENTS = {
    "codex": {
        "inbox": BUS_DIR / "codex_inbox.txt",
        "outbox": BUS_DIR / "codex_outbox.txt",
        "cmd": ["codex", "exec", "--full-auto"],
        "next": "gemini",
    },
    "gemini": {
        "inbox": BUS_DIR / "gemini_inbox.txt",
        "outbox": BUS_DIR / "gemini_outbox.txt",
        "cmd": ["gemini", "-p"],
        "next": "claude",
    },
    "claude": {
        "inbox": BUS_DIR / "claude_inbox.txt",
        "outbox": BUS_DIR / "claude_outbox.txt",
        "cmd": ["claude", "-p"],
        "next": "codex",
    },
}

POLL_INTERVAL = 2
TIMEOUT = 120  # max seconds per agent invocation

shutdown = False


def setup_logging():
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_file = LOG_DIR / f"bus_{datetime.now():%Y%m%d_%H%M%S}.log"

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout),
        ],
    )
    return log_file


def ensure_files():
    BUS_DIR.mkdir(parents=True, exist_ok=True)
    for agent in AGENTS.values():
        agent["inbox"].touch()
        agent["outbox"].touch()


def claim_message(inbox: Path) -> str | None:
    """Atomically claim a message from an inbox using rename."""
    if not inbox.exists():
        return None

    content = inbox.read_text().strip()
    if not content:
        return None

    # Atomic claim: rename inbox to a processing file
    processing = inbox.with_suffix(".processing")
    try:
        os.rename(inbox, processing)
    except OSError:
        # Another process got it first
        return None

    message = processing.read_text().strip()

    # Recreate empty inbox
    inbox.touch()

    # Clean up processing file
    processing.unlink(missing_ok=True)

    return message if message else None


def run_agent(name: str, cmd: list[str], message: str) -> str:
    """Run an agent CLI with the given message and return output."""
    full_cmd = cmd + [message]
    logging.info(f"[{name}] Running: {' '.join(full_cmd[:3])}... ({len(message)} chars)")

    env = os.environ.copy()
    env.pop("CLAUDECODE", None)  # prevent nested session detection

    try:
        result = subprocess.run(
            full_cmd,
            capture_output=True,
            text=True,
            timeout=TIMEOUT,
            cwd=str(Path(__file__).parent.parent),
            env=env,
        )
        output = result.stdout.strip()
        if result.stderr.strip():
            logging.warning(f"[{name}] stderr: {result.stderr.strip()[:200]}")
        if result.returncode != 0:
            logging.error(f"[{name}] exit code {result.returncode}")
            output = output or f"[ERROR] Agent {name} exited with code {result.returncode}: {result.stderr.strip()[:500]}"
        return output
    except subprocess.TimeoutExpired:
        logging.error(f"[{name}] timed out after {TIMEOUT}s")
        return f"[TIMEOUT] Agent {name} did not respond within {TIMEOUT}s"
    except FileNotFoundError:
        logging.error(f"[{name}] CLI not found: {cmd[0]}")
        return f"[ERROR] CLI not found: {cmd[0]}"


def write_outbox(outbox: Path, content: str):
    """Write result to outbox atomically using tmp + rename."""
    tmp_fd, tmp_path = tempfile.mkstemp(
        dir=BUS_DIR, prefix=".outbox_", suffix=".tmp"
    )
    try:
        with os.fdopen(tmp_fd, "w") as f:
            f.write(content)
        os.rename(tmp_path, outbox)
    except Exception:
        os.unlink(tmp_path)
        raise


def forward_to_next(next_inbox: Path, content: str):
    """Append result to the next agent's inbox atomically."""
    tmp_fd, tmp_path = tempfile.mkstemp(
        dir=BUS_DIR, prefix=".inbox_", suffix=".tmp"
    )
    try:
        with os.fdopen(tmp_fd, "w") as f:
            f.write(content)
        os.rename(tmp_path, next_inbox)
    except Exception:
        os.unlink(tmp_path)
        raise


def log_event(name: str, direction: str, message: str):
    """Append structured event to the event log."""
    event_log = LOG_DIR / "events.jsonl"
    event = {
        "ts": datetime.now().isoformat(),
        "agent": name,
        "direction": direction,
        "chars": len(message),
        "preview": message[:100],
    }
    with open(event_log, "a") as f:
        f.write(json.dumps(event) + "\n")


def process_agent(name: str, config: dict):
    """Check an agent's inbox and process if there's a message."""
    message = claim_message(config["inbox"])
    if not message:
        return False

    logging.info(f"[{name}] Claimed message: {message[:80]}...")
    log_event(name, "recv", message)

    # Run the agent
    result = run_agent(name, config["cmd"], message)

    logging.info(f"[{name}] Result: {result[:80]}...")
    log_event(name, "send", result)

    # Write to outbox
    write_outbox(config["outbox"], result)
    logging.info(f"[{name}] Wrote outbox")

    # Forward to next agent
    next_name = config["next"]
    next_inbox = AGENTS[next_name]["inbox"]
    forward_to_next(next_inbox, result)
    logging.info(f"[{name}] Forwarded to {next_name}")

    return True


def handle_shutdown(signum, frame):
    global shutdown
    logging.info(f"Received signal {signum}, shutting down...")
    shutdown = True


def main():
    log_file = setup_logging()
    ensure_files()

    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)

    logging.info("=" * 60)
    logging.info("Agent Bus started")
    logging.info(f"Bus dir: {BUS_DIR}")
    logging.info(f"Log file: {log_file}")
    logging.info(f"Poll interval: {POLL_INTERVAL}s")
    logging.info(f"Agent timeout: {TIMEOUT}s")
    logging.info(f"Route: codex -> gemini -> claude -> codex")
    logging.info("=" * 60)

    cycle = 0
    while not shutdown:
        did_work = False
        for name, config in AGENTS.items():
            if shutdown:
                break
            try:
                if process_agent(name, config):
                    did_work = True
            except Exception as e:
                logging.exception(f"[{name}] Unhandled error: {e}")

        if not did_work:
            time.sleep(POLL_INTERVAL)
        else:
            cycle += 1
            logging.info(f"--- Cycle {cycle} complete ---")

    logging.info("Agent Bus stopped")


if __name__ == "__main__":
    main()
