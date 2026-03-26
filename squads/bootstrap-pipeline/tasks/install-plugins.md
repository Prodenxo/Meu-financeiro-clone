---
task: "Install Plugins"
responsavel: "@bootstrap-engineer"
responsavel_type: agent
atomic_layer: task
squad: bootstrap-pipeline
---

# Task: Install Plugins

**Task ID:** install-plugins
**Version:** 1.0
**Agent:** bootstrap-engineer
**Squad:** bootstrap-pipeline

## Purpose

Install essential Claude Code plugins from the marketplace during bootstrap. Ensures plugins like claude-mem are available from the first session.

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| context | PipelineContext | Yes | Shared pipeline context |

## Steps

1. **Read plugin list** from `data/default-plugins.yaml`
2. **For each plugin:**
   - Check if already installed
   - If not: run marketplace add + install commands
   - Verify installation
3. **Report** installed/skipped plugins

## Plugin Installation Commands

### claude-mem
```bash
# Step 1: Add from marketplace
/plugin marketplace add thedotmack/claude-mem

# Step 2: Install
/plugin install claude-mem
```

### Equivalente no Cursor

Não usa marketplace de plugins: o passo **`cursor-mem`** do pipeline cria `.cursor/mem/PROJECT_MEMORY.md` e a regra `.cursor/rules/cursor-mem-protocol.mdc` define o protocolo (paridade com memória persistente).

## Output Format

```
  [N/N]  Install Plugins.................. ✓ 1 plugin(s) (3.2s)
         ├── claude-mem ✓ Installed
```

## Idempotency

- Check if plugin directory/config already exists before installing
- Skip with `✓ Already installed` if present

## Related

- **Parent task:** full-setup.md
- **Data:** data/default-plugins.yaml
