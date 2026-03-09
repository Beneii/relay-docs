# Relay Codebase Audit Plan

Status: locked
Project: /Users/ben/Desktop/Relay
Owner: Hermes
Date: 2026-03-09

Objective
- Perform a read-only audit of the Relay codebase using subagents under Hermes orchestration.
- Produce scoped audit artifacts, baseline validation results, and a synthesized priority report.

Rules
- Hermes is the only orchestrator and only process allowed to update the task graph.
- No subagent may spawn agents, rewrite the plan, or modify source files.
- Subagents are restricted to analysis and artifact generation only.
- No two subagents may target the same file scope for editing; this audit is read-only.
- Sensitive areas (auth, billing, permissions, backend, infra/security) require Claude review in synthesis.
- Any patch artifact produced during this audit is advisory only and must not be applied automatically.

Planned tasks
1. Baseline inventory and validation
   Scope:
   - package.json
   - app/package.json
   - README.md
   - tsconfig.json
   - index.html
   - vercel.json
   - scripts/**
   - Relay/**
   - RelayTests/**
   - RelayUITests/**
   - .env.local
   - .env.production
   - .mcp.json if present
   - repo layout excluding node_modules, Pods, dist, build, .expo
   Checks:
   - build and test commands where available
   - dependency vulnerability scan where available
   - secret-exposure and tracked-env review
   Outputs:
   - artifacts/repo_inventory.json
   - artifacts/codebase_metrics.txt
   - artifacts/test_results.txt

2. Mobile app audit via Codex
   Scope:
   - app/app/**
   - app/src/**
   - app/package.json
   - app/tsconfig.json
   Forbidden:
   - src/**
   - api/**
   - backend/**
   - Relay/**
   - package manifests outside app/
   Output:
   - artifacts/codex_mobile_audit.md

3. Web, backend, and native-support audit via Codex
   Scope:
   - src/**
   - api/**
   - auth/**
   - backend/**
   - Relay/**
   - RelayTests/**
   - RelayUITests/**
   - scripts/**
   - playwright-audit.js
   - package.json
   - tsconfig.json
   - vite.config.ts
   - vercel.json
   - index.html
   Forbidden:
   - app/**
   Output:
   - artifacts/codex_web_backend_audit.md

4. Security and architecture review via Gemini
   Scope:
   - api/**
   - auth/**
   - backend/**
   - Relay/**
   - scripts/**
   - app/app/auth.tsx
   - app/src/lib/**
   - package.json
   - app/package.json
   - .env.local
   - .env.production
   - .mcp.json if present
   Focus:
   - auth flows
   - billing and Stripe handling
   - Supabase usage
   - secrets handling
   - webhook trust boundaries
   - deployment and MCP risk surfaces
   - cross-boundary consistency between mobile and web auth flows
   Output:
   - artifacts/gemini_security_analysis.md

5. Plan and findings review via Claude
   Scope:
   - artifacts/plan.md
   - artifacts/codex_mobile_audit.md
   - artifacts/codex_web_backend_audit.md
   - artifacts/gemini_security_analysis.md
   - artifacts/test_results.txt
   - artifacts/codebase_metrics.txt
   Output:
   - artifacts/claude_plan_review.md
   - artifacts/claude_audit_review.md

6. Hermes synthesis
   Scope:
   - artifacts/plan.md
   - artifacts/repo_inventory.json
   - artifacts/codebase_metrics.txt
   - artifacts/test_results.txt
   - artifacts/codex_mobile_audit.md
   - artifacts/codex_web_backend_audit.md
   - artifacts/gemini_security_analysis.md
   - artifacts/claude_plan_review.md
   - artifacts/claude_audit_review.md
   Outputs:
   - artifacts/summary.md
   - artifacts/patch.diff
   - artifacts/task_graph.json

Success criteria
- Baseline build, lint, typecheck, test, and dependency/secret scan commands have been attempted where available and recorded.
- Each subagent returns a scoped artifact with concrete findings.
- Findings are prioritized by severity and mapped to files or subsystems.
- Final summary identifies immediate, near-term, and later recommendations.
- No source files are modified as part of the audit.
