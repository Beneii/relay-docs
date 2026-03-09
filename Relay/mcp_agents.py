#!/usr/bin/env python3
"""
MCP Server — exposes Codex and Gemini CLIs as tools for Claude Code.

Speaks JSON-RPC 2.0 over stdio (MCP transport).
Claude calls these as tools: codex_run, gemini_run.
"""

import json
import sys
import subprocess
import os
import logging
from datetime import datetime
from pathlib import Path

LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    filename=LOG_DIR / "mcp_agents.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

TIMEOUT = 180  # seconds per agent call

TOOLS = [
    {
        "name": "codex_run",
        "description": "Run a task using OpenAI Codex CLI (GPT-5.4). Best for: code generation, refactoring, bug fixes, writing tests, and code analysis. The task is run non-interactively with full-auto approval. Returns Codex's stdout.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task": {
                    "type": "string",
                    "description": "The task or prompt to send to Codex. Be specific and include file paths when relevant.",
                },
                "working_dir": {
                    "type": "string",
                    "description": "Working directory for Codex. Defaults to the project root.",
                },
            },
            "required": ["task"],
        },
    },
    {
        "name": "gemini_run",
        "description": "Run a task using Google Gemini CLI. Best for: design critique, UI/UX review, multimodal analysis, research, and alternative perspectives. Returns Gemini's stdout.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task": {
                    "type": "string",
                    "description": "The task or prompt to send to Gemini. Be specific about what you want.",
                },
            },
            "required": ["task"],
        },
    },
]

AGENT_COMMANDS = {
    "codex_run": lambda args: [
        "codex", "exec", "--full-auto",
        args["task"],
    ],
    "gemini_run": lambda args: [
        "gemini", "-p",
        args["task"],
    ],
}


def run_agent(tool_name: str, args: dict) -> str:
    """Execute an agent CLI and return its output."""
    cmd = AGENT_COMMANDS[tool_name](args)
    working_dir = args.get("working_dir", str(Path(__file__).parent.parent))

    env = os.environ.copy()
    env.pop("CLAUDECODE", None)

    logging.info(f"[{tool_name}] Running: {cmd[0]} (task: {args['task'][:100]}...)")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=TIMEOUT,
            cwd=working_dir,
            env=env,
        )

        output = result.stdout.strip()
        if result.returncode != 0 and not output:
            output = f"[EXIT {result.returncode}] {result.stderr.strip()[:1000]}"

        logging.info(f"[{tool_name}] Done ({len(output)} chars, exit {result.returncode})")
        return output

    except subprocess.TimeoutExpired:
        logging.error(f"[{tool_name}] Timeout after {TIMEOUT}s")
        return f"[TIMEOUT] {tool_name} did not respond within {TIMEOUT}s"
    except FileNotFoundError:
        logging.error(f"[{tool_name}] CLI not found: {cmd[0]}")
        return f"[ERROR] CLI '{cmd[0]}' not found. Is it installed?"


def read_message() -> dict | None:
    """Read a JSON-RPC message from stdin (Content-Length framed)."""
    # Read headers until empty line
    headers = {}
    while True:
        line = sys.stdin.readline()
        if not line:
            return None  # EOF
        line = line.rstrip("\r\n")
        if not line:
            break
        if ":" in line:
            key, value = line.split(":", 1)
            headers[key.strip().lower()] = value.strip()

    content_length = int(headers.get("content-length", 0))
    if content_length == 0:
        return None

    body = ""
    while len(body) < content_length:
        chunk = sys.stdin.read(content_length - len(body))
        if not chunk:
            return None
        body += chunk

    return json.loads(body)


def send_message(msg: dict):
    """Write a JSON-RPC message to stdout."""
    body = json.dumps(msg)
    sys.stdout.write(f"Content-Length: {len(body)}\r\n\r\n{body}")
    sys.stdout.flush()


def handle_initialize(msg: dict):
    send_message({
        "jsonrpc": "2.0",
        "id": msg["id"],
        "result": {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {},
            },
            "serverInfo": {
                "name": "relay-agents",
                "version": "1.0.0",
            },
        },
    })


def handle_initialized(msg: dict):
    # Notification, no response needed
    pass


def handle_tools_list(msg: dict):
    send_message({
        "jsonrpc": "2.0",
        "id": msg["id"],
        "result": {
            "tools": TOOLS,
        },
    })


def handle_tools_call(msg: dict):
    params = msg.get("params", {})
    tool_name = params.get("name")
    args = params.get("arguments", {})

    logging.info(f"Tool call: {tool_name}")

    if tool_name not in AGENT_COMMANDS:
        send_message({
            "jsonrpc": "2.0",
            "id": msg["id"],
            "result": {
                "content": [{"type": "text", "text": f"Unknown tool: {tool_name}"}],
                "isError": True,
            },
        })
        return

    result = run_agent(tool_name, args)

    # Log the exchange
    event_log = LOG_DIR / "events.jsonl"
    with open(event_log, "a") as f:
        f.write(json.dumps({
            "ts": datetime.now().isoformat(),
            "tool": tool_name,
            "task_preview": args.get("task", "")[:100],
            "result_chars": len(result),
            "result_preview": result[:200],
        }) + "\n")

    send_message({
        "jsonrpc": "2.0",
        "id": msg["id"],
        "result": {
            "content": [{"type": "text", "text": result}],
        },
    })


HANDLERS = {
    "initialize": handle_initialize,
    "notifications/initialized": handle_initialized,
    "tools/list": handle_tools_list,
    "tools/call": handle_tools_call,
}


def main():
    logging.info("MCP Agent Server started")

    while True:
        msg = read_message()
        if msg is None:
            break

        method = msg.get("method", "")
        logging.info(f"Received: {method}")

        handler = HANDLERS.get(method)
        if handler:
            try:
                handler(msg)
            except Exception as e:
                logging.exception(f"Error handling {method}: {e}")
                if "id" in msg:
                    send_message({
                        "jsonrpc": "2.0",
                        "id": msg["id"],
                        "error": {"code": -32603, "message": str(e)},
                    })
        elif "id" in msg:
            send_message({
                "jsonrpc": "2.0",
                "id": msg["id"],
                "error": {"code": -32601, "message": f"Unknown method: {method}"},
            })

    logging.info("MCP Agent Server stopped")


if __name__ == "__main__":
    main()
