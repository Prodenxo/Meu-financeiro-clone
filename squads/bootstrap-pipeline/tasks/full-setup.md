---
task: "Full Setup"
responsavel: "@bootstrap-engineer"
responsavel_type: agent
atomic_layer: task
squad: bootstrap-pipeline
---

# Task: Full Setup

**Task ID:** full-setup
**Version:** 1.0
**Agent:** bootstrap-engineer
**Squad:** bootstrap-pipeline

## Purpose

Execute the complete AIOX project setup pipeline — 13 engine steps (pre-flight plus 12 steps through final validation). Supports resume from checkpoint, dry-run preview, and idempotent re-execution.

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| --resume | flag | No | Resume from last checkpoint |
| --dry-run | flag | No | Preview without executing |
| --force | flag | No | Ignore checkpoint, re-execute all |
| --interactive | flag | No | Pause after each step for confirmation |
| --verbose | flag | No | Show detailed output per step |

## Preconditions

- [ ] Terminal with UTF-8 support
- [ ] Internet connection (for squad downloads and Claude Code install)

## Steps

1. **Parse flags** — Read CLI flags and set execution mode
2. **Load checkpoint** — If `--resume`, load `.aiox/bootstrap-state.json`
3. **Initialize logger** — Create log file at `.aiox/logs/bootstrap-{timestamp}.log`
4. **Initialize context** — Create PipelineContext with OS detection
5. **Run pre-flight** — Verify Node.js >= 18, Git, GitHub CLI auth
6. **Execute setup steps** — For each step:
   - Call `step.check(context)` — if already done, skip
   - If `--dry-run`: call `step.dryRun(context)` and show preview
   - Else: call `step.execute(context)` and capture StepResult
   - Save checkpoint after each success
   - If `--interactive`: pause and ask to continue
   - On failure: save checkpoint with error, show resume instruction, exit
7. **Generate report** — Create summary table, environment info, next steps
8. **Save report** — Write to `.aiox/reports/bootstrap-{timestamp}.md`
9. **Display report** — Show formatted output in terminal
10. **Clear checkpoint** — Remove `.aiox/bootstrap-state.json` on full success

## Output Format

```
👑 [AIOX] Full Setup Pipeline v1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pre-flight Check
  ✓ Node.js 20.11.0 (>= 18 required)
  ✓ Git 2.43.0
  ✓ GitHub CLI 2.45.0 (authenticated as user)
  ✓ OS: WSL2 (Ubuntu 22.04)

Setup Pipeline [12 sequential steps]
  [1/12]  Install Claude Code.............. ✓ Already installed (v1.2.3)
  [2/12]  Configure Status Line............ ✓ Configured (1.1s)
  [3/12]  Configure Localhost.............. ✓ Port 37770 (0.3s)
  [4/12]  Install Basic Configs............ ✓ 8 files (2.1s)
  [5/12]  Package Install.................. ✓ npm install (15.3s)
  [6/12]  Environment Bootstrap............ ✓ Delegated (8.2s)
  [7/12]  Configure Permission Mode........ ✓ YOLO mode (0.2s)
  [8/12]  Download Essential Squads........ ✓ 2 squads (12.4s)
  [9/12]  Install LLM Routing.............. ✓ Claude + Cursor (0.5s)
  [10/12] Install Cursor Project Memory..... ✓ PROJECT_MEMORY.md (0.2s)
  [11/12] Install Plugins.................. ✓ delegated / claude-mem (4.1s)
  [12/12] Final Validation................. ✓ All checks passed (1.8s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Setup complete in 42.2s

Environment Summary:
  OS: WSL2 | Node: 20.11.0 | Git branch: main
  Squads: squad-creator-pro, education

Next Steps:
  1. @dev *help — Start implementing
  2. @sm *create-story — Create first story
  3. @squad-creator *list-squads — See installed squads
```

## Error Output Format

```
  [5/11]  Package Install.................. ✗ npm install failed (3.2s)

  Error: ERESOLVE unable to resolve dependency tree

  To fix: Check package.json for conflicting dependencies
  To resume: *full-setup --resume
```

## Postconditions

- [ ] All 11 steps completed or skipped (idempotent)
- [ ] Report saved to `.aiox/reports/`
- [ ] Log saved to `.aiox/logs/`
- [ ] Checkpoint cleared on success

## Related

- **PRD:** `docs/prd/aiox-bootstrap-pipeline.md`
- **Architecture:** `docs/architecture/aiox-bootstrap-pipeline.md`
- **Scripts:** `scripts/bootstrap/pipeline-engine.js`
