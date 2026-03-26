# Setup Validation Checklist

Used by `*doctor` command and `final-validation` step to verify environment health.

## Prerequisites

- [ ] Node.js >= 18 installed
- [ ] Git installed and configured
- [ ] GitHub CLI authenticated
- [ ] Claude Code installed

## Project Structure

- [ ] `.git/` directory exists
- [ ] GitHub remote configured
- [ ] `.claude/` directory exists
- [ ] `.claude/settings.json` exists
- [ ] `.claude/CLAUDE.md` exists
- [ ] `.claude/rules/` directory with at least 1 rule file

## Framework

- [ ] `.aiox-core/` directory exists
- [ ] `package.json` exists
- [ ] `node_modules/` exists (dependencies installed)

## Squads

- [ ] `squads/` directory exists
- [ ] At least 1 squad installed
- [ ] Installed squads pass validation (squad.yaml present)

## LLM Routing

- [ ] `.claude/rules/llm-routing.md` exists (Claude Code)
- [ ] `.cursor/rules/llm-routing.mdc` exists (Cursor)
- [ ] Ficheiros contêm matriz de roteamento válida

## Memória Cursor (paridade claude-mem)

- [ ] `.cursor/mem/PROJECT_MEMORY.md` exists
- [ ] `.cursor/rules/cursor-mem-protocol.mdc` exists

## Environment

- [ ] `.aiox/` runtime directory exists
- [ ] No stale checkpoint (`.aiox/bootstrap-state.json` absent on healthy env)
