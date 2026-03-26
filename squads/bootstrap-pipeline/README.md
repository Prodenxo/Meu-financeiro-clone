# Bootstrap Pipeline Squad

> Automates the complete AIOX project setup with a single `*full-setup` command.

## Overview

Replaces the manual 13-step onboarding process with a resilient, idempotent pipeline featuring pre-flight checks, checkpoint/resume, dry-run, and formatted reporting.

**Setup time:** ~30min manual → <5min automated

## Quick Start

```bash
@bootstrap-engineer
*full-setup
```

## Commands

| Command | Description |
|---------|-------------|
| `*full-setup` | Run complete setup (13 steps) |
| `*full-setup --dry-run` | Preview without executing |
| `*full-setup --resume` | Resume from checkpoint |
| `*full-setup --interactive` | Step-by-step with pauses |
| `*preflight` | Check prerequisites only |
| `*status` | Show checkpoint state |
| `*doctor` | Validate environment health |

## Pipeline Steps

| # | Step | What it does |
|---|------|-------------|
| 1 | Pre-flight | Check Node.js, Git, GitHub CLI, detect OS |
| 2 | Install Claude | Install Claude Code if missing |
| 3 | Status Line | Configure Claude Code status line |
| 4 | Localhost | Configure port 37770 |
| 5 | Basic Configs | Install .claude/ settings, CLAUDE.md, rules |
| 6 | Package Install | Run npm/yarn/pnpm install |
| 7 | Env Bootstrap | Git init, GitHub remote, project structure |
| 8 | Permission Mode | Configure YOLO/ask/explore |
| 9 | Download Squads | Install essential squads |
| 10 | LLM Routing | Install routing rules (Claude + Cursor) |
| 11 | Cursor Project Memory | Create `.cursor/mem/PROJECT_MEMORY.md` (claude-mem parity) |
| 12 | Install Plugins | Install claude-mem and other plugins (Claude Code) |
| 13 | Validation | Verify complete environment |

## Configuration

Edit `data/default-squads.yaml` to customize which squads are downloaded.

## Architecture

- **PRD:** `docs/prd/aiox-bootstrap-pipeline.md`
- **Architecture:** `docs/architecture/aiox-bootstrap-pipeline.md`
- **Pattern:** Chain of Responsibility with Checkpoint/Resume

## Version

- Squad: 1.0.0
- Agent: Forge (bootstrap-engineer)
