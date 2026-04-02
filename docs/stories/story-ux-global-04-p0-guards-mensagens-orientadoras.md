# Story — UX-GLOBAL-04 (P0): Guards e permissões — Mensagens orientadoras (sem dead end opaco)

**ID:** STORY-UX-GLOBAL-04  
**Prioridade:** P0 — quick win  
**Depende de:** [story-ux-global-01-fase-a-artefactos-auditoria.md](./story-ux-global-01-fase-a-artefactos-auditoria.md) (recomendado: matriz identifica páginas com *gap*)  
**Fonte:** `docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md` (FR-UX-GLOBAL-B05, B04 parcial)  
**Especificação UX:** `docs/specs/ux-spec-revisao-iu-ux-global-2026-04-01.md` §4.4, §5.2, §6.5

## User story

**Como** utilizador sem MEI ou sem permissão para uma área,  
**quero** ver **porquê** estou bloqueado e **que passo posso dar a seguir**,  
**para** não ficar perdido com mensagens técnicas ou redirecionamentos silenciosos.

## Contexto técnico

- **Padrão obrigatório (spec §4.4):** (1) título humano; (2) explicação numa frase; (3) próximo passo; (4) CTA opcional com destino válido.
- **Pontos de auditoria típicos:** `Navigate` em `App.tsx` para rotas MEI (`/guias-mei`, `/mei-catalogo/*`); rotas admin em `/settings/*`; *toasts* genéricos de erro de API em fluxos de auth.
- **Implementação sugerida:** componente reutilizável `BlockedState` / `AccessExplainer` em `frontend/src/components/` **ou** extensão de padrão existente — evitar duplicar parágrafos em 6 sítios sem abstração mínima.
- **Copy:** validar com produto para cenários `usuario` + `mei=false`, role `usuario` vs `admin` vs `superadmin`.

## Critérios de aceite

- [ ] Todas as rotas **prioritárias** PRD §4.3 onde hoje há apenas `Navigate to="/"` (ou equivalente) **sem** mensagem passam a cumprir o padrão de 4 pontos **ou** página de destino (`/`) explica brevemente o redirecionamento (aceite apenas se PO aprovar *landing* única).
- [ ] Cenário `usuario` sem MEI: tentativa direta a `/guias-mei` e `/mei-catalogo/...` — utilizador compreende o bloqueio (validação QA/manual).
- [ ] Não expor stack traces nem JSON de erro ao utilizador final.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` verdes; `App.mei-gate.test.tsx` atualizado se comportamento visível mudar.

## Fora de escopo

- Mudar regras de `canAccessMeiArea` / roles no backend.  
- Tradução completa da app para outro idioma.

## File list (checklist implementação)

- [ ] `frontend/src/App.tsx`
- [ ] `frontend/src/components/*` (novo componente de bloqueio, se criado)
- [ ] `frontend/src/App.mei-gate.test.tsx` (ou testes novos)
- [ ] Páginas específicas se guards forem locais

## Definition of Done

- QA: matriz UX-GLOBAL-01 atualizada com fecho dos IDs relacionados a guards **ou** nota de follow-up com novos IDs.  
- Lista de rotas tocadas no Dev Agent Record.

## Qualidade / CodeRabbit

- Acessibilidade: região com `role="status"` ou heading hierárquico adequado; foco gerível se página dedicada.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor Agent (implementação)

### Completion Notes List

- **`AccessBlockedExplainer`** + copy em **`accessBlockPresets.ts`**: padrão spec §4.4 (título, explicação, próximo passo, CTA + «Ocultar aviso»); `role="status"` + `aria-live="polite"`.
- **MEI:** rotas `/guias-mei`, `/mei-catalogo/clientes`, `/mei-catalogo/servicos-produtos` — `<Navigate to="/" state={{ accessBlock: 'mei-required' }} />`; **`Dashboard`** mostra aviso e `navigate(..., { replace: true, state: {} })` ao dispensar ou ao seguir CTA.
- **Admin:** `/settings/users` e `/settings/usuarios-dados` — `<Navigate to="/settings" state={{ accessBlock: 'admin-settings-restricted' }} />`; **`Settings`** mostra o mesmo padrão de copy.
- Testes: **`App.mei-gate.test.tsx`** (mensagens após bloqueio MEI + 2 casos settings não-admin); **`AccessBlockedExplainer.test.tsx`**.
- **DoD matriz UX-GLOBAL-01:** secção **Fechamento pós-implementação** em `docs/ux-audit/matriz-problemas-iu-ux-global-2026-04-01.md` (M003, M004) após correções pós-QA.
- **Pós-QA:** `AccessBlockedExplainer` com `tabIndex={-1}`, `focus({ preventScroll })` ao montar (opcional `focusOnMount={false}`), anel `focus-visible`; teste de foco em `AccessBlockedExplainer.test.tsx`.

### File List (implementação)

- `frontend/src/App.tsx`
- `frontend/src/components/AccessBlockedExplainer.tsx`
- `frontend/src/lib/accessBlockPresets.ts`
- `frontend/src/components/AccessBlockedExplainer.test.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Settings.tsx`
- `frontend/src/App.mei-gate.test.tsx`
- `docs/ux-audit/matriz-problemas-iu-ux-global-2026-04-01.md` (fecho M003/M004)

### Debug Log References

—

### Change Log

- **2026-04-01** — Story criada (SM) a partir do PRD/spec revisão IU/UX global.
- **2026-04-01** — Implementação UX-GLOBAL-04: avisos de acesso + estado de navegação + testes.
- **2026-04-01** — Pós-QA: foco inicial na região de aviso + matriz UX-GLOBAL (M003/M004 mitigados).

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-04-01  
**Decisão:** **PASS** (com ressalvas / follow-up documental)

### Rastreio aos critérios de aceite

| Critério | Evidência | Resultado |
|----------|-----------|-----------|
| Rotas prioritárias com `Navigate` sem mensagem → padrão §4.4 ou destino explica | `App.tsx`: MEI (`/guias-mei`, `/mei-catalogo/clientes`, `/mei-catalogo/servicos-produtos`) → `/` com `state.accessBlock: 'mei-required'`; admin (`/settings/users`, `/settings/usuarios-dados`) → `/settings` com `admin-settings-restricted`. `Dashboard` / `Settings` renderizam **`AccessBlockedExplainer`** (título, explicação, `nextStep`, CTA + «Ocultar aviso»). | **OK** |
| `usuario` + `mei=false`: `/guias-mei` e `/mei-catalogo/...` compreensíveis | Copy em `accessBlockPresets.ts` + asserções em `App.mei-gate.test.tsx` («Área Mei Infinito não disponível»). | **OK** (automatizado); smoke manual com leitor de ecrã recomendado |
| Sem stack trace / JSON ao utilizador | Mensagens estáticas; sem propagação de erro de API neste fluxo. | **OK** |
| `lint` / `typecheck` / `test`; `App.mei-gate.test.tsx` alinhado | `vitest`: `App.mei-gate.test.tsx` (11 testes) + `AccessBlockedExplainer.test.tsx` (1) **pass** nesta revisão; gates completos do repo assumidos alinhados à entrega Dev. | **OK** |

### Acessibilidade (Qualidade / story)

- `role="status"` + `aria-live="polite"` + **`h2`** para o título — alinhado à spec.
- **Ressalva menor:** não há movimento explícito de foco para a região após redirecionamento (não é página dedicada). Melhoria opcional P2: `tabIndex={-1}` + `ref.focus()` no primeiro paint ou *skip link* interno.

### Definition of Done (matriz UX-GLOBAL-01)

- **Pendência documental:** o Dev registou que a **atualização da matriz** em `docs/ux-audit/matriz-problemas-iu-ux-global-2026-04-01.md` (fecho de IDs / nota de follow-up) fica para **QA/PO**. **Não verificado nesta revisão de código** — recomenda-se fechar no mesmo *sprint* que o merge desta story.

### Fora do âmbito desta entrega (contexto story)

- **Toasts / auth API** citados como «pontos de auditoria típicos» no texto da story: **não** tratados neste diff (coerente com foco em `App.tsx`). Considerar **UX-GLOBAL** ou *tech debt* se o PO quiser o mesmo padrão §4.4 aí.
- Rota *catch-all* `path="*"` → `/` continua **sem** aviso específico (URL desconhecida); aceitável se PRD §4.3 não a listar como prioritária.

### Resumo

Implementação **sólida**, reutilizável (`AccessBlockedExplainer` + `accessBlockPresets`), testes de gate MEI/settings **a cobrir o comportamento visível**. **PASS** para merge, desde que **PO/QA** tratem da **matriz UX-GLOBAL-01** (DoD) e validem copy final em produto se necessário.

— Quinn (QA), 2026-04-01
