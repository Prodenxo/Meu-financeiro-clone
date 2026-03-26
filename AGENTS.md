# AGENTS.md - Meu Financeiro (Cursor + AIOX)

Instruções do projeto para uso no **Cursor**. A fonte canônica dos agentes AIOX é `.aiox-core/development/agents/`; as regras usáveis no Cursor são geradas em `.cursor/rules/agents/`.

<!-- AIOX-MANAGED-START: core -->
## Regras principais

1. Siga a constitution em `.aiox-core/constitution.md` (quando presente no workspace).
2. Priorize `CLI First → Observability Second → UI Third`.
3. Trabalhe por stories em `docs/stories/` quando aplicável.
4. Não invente requisitos fora dos artefatos existentes.
<!-- AIOX-MANAGED-END: core -->

<!-- AIOX-MANAGED-START: quality -->
## Quality gates

- `npm run lint`
- `npm run typecheck`
- `npm test`
- Atualize checklist e file list da story antes de concluir tarefas ligadas a story.
<!-- AIOX-MANAGED-END: quality -->

<!-- AIOX-MANAGED-START: codebase -->
## Mapa do repositório

- App frontend: `frontend/`
- App backend: `backend/`
- Framework AIOX (local): `.aiox-core/`
- Scripts raiz: `scripts/`
- Documentação / stories: `docs/`
<!-- AIOX-MANAGED-END: codebase -->

<!-- AIOX-MANAGED-START: commands -->
## Comandos úteis

- `npm run sync:ide` — sincroniza agentes AIOX para o **Cursor** (único alvo habilitado no `ideSync` deste repo).
- `npm run sync:ide:cursor` — somente Cursor (equivalente prático ao anterior).
- `npm run sync:ide:check` — valida `.cursor/rules/agents/` **e** os slash commands AIOX em `.cursor/commands/` (`aiox-*.md`, modo estrito).
- `npm run validate:structure` / `npm run validate:agents` — validações AIOX.

**Slash (`/`) no chat:** após `npm run sync:ide`, digite **`/`** e escolha um comando `aiox-*` (ex.: `aiox-dev`, `aiox-menu`). Cada um aponta para a regra em `.cursor/rules/agents/<id>.md`.

**Quando rodar o sync:** após alterar `.aiox-core/development/agents/`, execute `npm run sync:ide` e versiona `.cursor/rules/agents/` e `.cursor/commands/aiox-*.md` conforme a tua política de Git.

**MCP:** no Cursor, configure servidores MCP em *Settings → MCP*; o campo `mcp.configLocation` do AIOX refere-se ao ecossistema Claude Code (`.claude/mcp.json`), não ao Cursor.

**Roteamento LLM:** matriz para escolher modelo/modo no Cursor em `.cursor/rules/llm-routing.mdc` (paridade com `.claude/rules/llm-routing.md` no Claude Code).

**Memória tipo claude-mem:** no Cursor use `.cursor/mem/PROJECT_MEMORY.md` + a regra `.cursor/rules/cursor-mem-protocol.mdc`. O plugin `claude-mem` continua disponível só no Claude Code (`squads/bootstrap-pipeline/data/default-plugins.yaml`).
<!-- AIOX-MANAGED-END: commands -->

<!-- AIOX-MANAGED-START: shortcuts -->
## Personas / agentes no Cursor

**Forma recomendada:** use **`/`** com um comando `aiox-*` em `.cursor/commands/`, **ou** anexe `.cursor/rules/agents/<id>.md`, **ou** peça explicitamente para assumir essa persona até indicar fim de modo.

**Fonte detalhada (YAML completo):** `.aiox-core/development/agents/<id>.md` — use quando precisar do bloco YAML integral ou de comandos `*...` documentados lá.

Atalhos de nome (persona → ficheiro em `agents/`):

- `@architect` → `architect.md`
- `@dev` → `dev.md`
- `@qa` → `qa.md`
- `@pm` → `pm.md`
- `@po` → `po.md`
- `@sm` → `sm.md`
- `@analyst` → `analyst.md`
- `@devops` → `devops.md`
- `@data-engineer` → `data-engineer.md`
- `@ux-design-expert` → `ux-design-expert.md`
- `@squad-creator` → `squad-creator.md`
- `@aiox-master` → `aiox-master.md`

Redirects (use o agente destino): `aiox-developer` / `aiox-orchestrator` → `aiox-master`; `db-sage` → `data-engineer`; `github-devops` → `devops`.

**Memória entre sessões:** *Cursor Memories* (preferências globais) + **`.cursor/mem/PROJECT_MEMORY.md`** (contexto do repo, versionado) + `docs/` para histórico longo. Ver `cursor-mem-protocol.mdc`.
<!-- AIOX-MANAGED-END: shortcuts -->

<!-- AIOX-MANAGED-START: codex-appendix -->
## Apêndice: Codex CLI (opcional)

Se usar OpenAI Codex CLI no mesmo repositório, habilite o alvo `codex` em `ideSync` no `.aiox-core/core-config.yaml`, rode `npm run sync:ide` e utilize skills em `.codex/skills` (`npm run sync:skills:codex`). Este repositório está configurado por padrão **somente para Cursor** no `ideSync`.
<!-- AIOX-MANAGED-END: codex-appendix -->
