---
task: "Pre-flight Check"
responsavel: "@bootstrap-engineer"
responsavel_type: agent
atomic_layer: task
squad: bootstrap-pipeline
---

# Task: Pre-flight Check

**Task ID:** preflight-check
**Version:** 1.0
**Agent:** bootstrap-engineer
**Squad:** bootstrap-pipeline

## Purpose

Verify all prerequisites before running the setup pipeline. Detects OS, checks required tools (Node.js, Git, GitHub CLI), and reports missing dependencies with installation instructions.

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| context | PipelineContext | Yes | Shared context object to populate |

## Steps

1. **Detect OS** — Identify Linux, macOS, or WSL2
2. **Check Node.js** — Verify `node --version` >= 18
3. **Check Git** — Verify `git --version`
4. **Check GitHub CLI** — Verify `gh auth status`
5. **Check Claude Code** — Verify `claude --version` (optional — step will install if missing)
6. **Format results** — Display table with status per tool

## Output Format

```
Pre-flight Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Tool         Required    Found       Status
  ─────────    ────────    ─────       ──────
  Node.js      >= 18       20.11.0     ✓
  Git          any         2.43.0      ✓
  GitHub CLI   auth'd      2.45.0      ✓
  OS           detected    WSL2        ✓

  Result: All prerequisites met ✓
```

## Failure Output

```
  Tool         Required    Found       Status
  ─────────    ────────    ─────       ──────
  Node.js      >= 18       16.20.0     ✗ Upgrade required
  Git          any         2.43.0      ✓
  GitHub CLI   auth'd      —           ✗ Not installed

  Missing prerequisites:
    Node.js: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    GitHub CLI: sudo apt install gh && gh auth login

  Fix the above and re-run: *full-setup
```

## Related

- **Parent task:** full-setup.md
- **Script:** scripts/bootstrap/steps/preflight-check.js
