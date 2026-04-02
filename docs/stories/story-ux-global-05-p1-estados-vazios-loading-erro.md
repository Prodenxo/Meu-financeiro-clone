# Story — UX-GLOBAL-05 (P1): Fluxos prioritários — Loading, empty e erro com CTA

**ID:** STORY-UX-GLOBAL-05  
**Prioridade:** P1  
**Depende de:** [story-ux-global-01-fase-a-artefactos-auditoria.md](./story-ux-global-01-fase-a-artefactos-auditoria.md), [story-ux-global-02-fase-a-testes-moderados.md](./story-ux-global-02-fase-a-testes-moderados.md) (recomendado)  
**Fonte:** `docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md` (FR-UX-GLOBAL-B04, B01/B02 suporte)  
**Especificação UX:** `docs/specs/ux-spec-revisao-iu-ux-global-2026-04-01.md` §5.2, §6.4

## User story

**Como** utilizador em qualquer fluxo principal da app,  
**quero** perceber quando os dados estão a carregar, quando não há registos e quando algo falhou — sempre com orientação e, se aplicável, um próximo passo,  
**para** não desistir por ecrãs em branco ou mensagens genéricas.

## Contexto técnico

- **Âmbito:** rotas PRD §4.3 — autenticação (login/registo/recuperação), núcleo financeiro (`/`, `/transacoes`, `/categorias`), planeamento (`/orcamentos`, `/agenda`, `/recorrencias`), `/settings` (+ subrotas admin), MEI/catálogo quando elegível, **sem** contradizer `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` em `/guias-mei`.
- **Padrão (spec §5.2):**
  - **Loading:** *skeleton* ou spinner + texto curto se percebível > ~300 ms; evitar *layout shift* grave.
  - **Empty:** explicar *porquê* vazio + CTA (ex.: “Adicionar primeira transação”).
  - **Erro:** mensagem humana + repetir/voltar; erros de campo com `aria-describedby`.
- **Abordagem:** implementar por **ondas dentro da story** — lista de páginas acordada a partir da matriz UX-GLOBAL-01 (mínimo **5** páginas ou todas as que a matriz marcar severidade ≥ alto).

## Critérios de aceite

- [ ] Lista explícita no PR/Dev Record das páginas alteradas (nomes de ficheiro sob `frontend/src/pages/`).
- [ ] Nenhuma das páginas em âmbito permanece com lista/tabela vazia **sem** empty state orientador (FR-UX-GLOBAL-B04).
- [ ] Estados de erro de rede ou API nas mesmas páginas mostram feedback acionável (não só `console.error`).
- [ ] `npm run lint`, `npm run typecheck`, `npm test` verdes.

## Fora de escopo

- Redesign visual completo ou novos *illustrations* pesadas.  
- Tratamento de erros MEI/fiscal específicos — ver [story-ux-global-06-p1-mapeamento-erros-fiscais-ui.md](./story-ux-global-06-p1-mapeamento-erros-fiscais-ui.md).

## File list (checklist implementação)

- [ ] Páginas acordadas em `frontend/src/pages/*.tsx` (preencher na implementação)
- [ ] Componentes partilhados opcionais: `frontend/src/components/*` (ex.: `EmptyState`, `PageLoading`)

## Definition of Done

- QA: percorrer 1 fluxo financeiro + 1 fluxo settings + 1 fluxo MEI (se disponível) com dados vazios simulados.  
- Evidência em screenshot ou nota de sessão (sem PII).

## Qualidade / CodeRabbit

- Reutilizar classes/tokens existentes (`planner-*`, `admin-*`) — alinhado NFR do PRD da área Mei Infinito onde sobreposto.  
- Não introduzir *spinners* sem nome acessível.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Composer (implementação)

### Completion Notes List

- Páginas cobertas (≥5): `App.tsx` (sessão), `Dashboard.tsx`, `Orcamentos.tsx`, `Categorias.tsx`, `Transactions.tsx`, `Recorrencias.tsx`, `Agenda.tsx`.
- Novo `FetchErrorBanner` para erros de rede/API com CTA «Tentar novamente»; título com `<h2>` (pós-QA a11y); `LoadingOverlay` com `role="status"`, `aria-busy`, `aria-label` e texto em `sr-only`.
- `Recorrencias`: `EmptyState` corrigido (ícone + `action`); loading alinhado ao overlay.
- `Transactions`: `loading`/`error` do store, `fetch` ao montar, empty state também em desktop; sem confundir vazio com erro.
- **Pós-QA (CONCERNS):** `Dashboard` — `FetchErrorBanner` + retry em falha de transações; `LoadingOverlay` quando carga inicial sem dados. `Categorias` — `budgetLoadError` + banner/retry para `loadBudgetSummary` (totais orçamento).
- Gates: `npm run lint`, `npm run typecheck`, `npm test` verdes (2026-04-01).

### File List (implementação)

- `frontend/src/App.tsx`
- `frontend/src/components/FetchErrorBanner.tsx` (novo)
- `frontend/src/components/LoadingOverlay.tsx`
- `frontend/src/pages/Agenda.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Categorias.tsx`
- `frontend/src/pages/Orcamentos.tsx`
- `frontend/src/pages/Recorrencias.tsx`
- `frontend/src/pages/Transactions.tsx`

### Debug Log References

—

### Change Log

- **2026-04-01** — Story criada (SM) a partir do PRD/spec revisão IU/UX global.
- **2026-04-01** — Implementação UX-GLOBAL-05: loading/empty/erro acionável nos fluxos prioritários (Dev).
- **2026-04-01** — Correção CONCERNS QA: `Dashboard.tsx`, `Categorias` (`loadBudgetSummary`), `FetchErrorBanner` título semântico (Dev).

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-04-01  
**Decisão:** **PASS com CONCERNS**

### Rastreio aos critérios de aceite

| Critério | Evidência | Resultado |
|----------|-----------|-----------|
| Lista explícita de páginas alteradas (`frontend/src/pages/`) | Dev Agent Record: `Agenda.tsx`, `Categorias.tsx`, `Orcamentos.tsx`, `Recorrencias.tsx`, `Transactions.tsx`; sessão em `App.tsx` (fora de `pages/`, documentado nas Completion Notes). | **OK** |
| Lista/tabela vazia com empty state orientador | `EmptyState` em `Orcamentos`, `Categorias`, `Recorrencias` (com `icon` + CTA); `Transactions` com empty partilhado desktop+mobile quando `filtered.length === 0` e sem erro de carga. | **OK** |
| Erro rede/API com feedback acionável | `FetchErrorBanner` + «Tentar novamente» em `Orcamentos` (`loadBudgetPage`), `Categorias` (`loadCategorias`), `Transactions` (`fetchTransactions`), `Recorrencias` (`fetchRecorrencias`), `Agenda` (`fetchGoogleEvents`). | **OK** |
| `npm run lint`, `typecheck`, `test` verdes | Reexecutado na revisão QA: exit code **0** (workspace root). | **OK** |

### Acessibilidade / NFR (Qualidade / story)

- `LoadingOverlay`: `role="status"`, `aria-live="polite"`, `aria-busy`, `aria-label`, `sr-only` + texto visível — **alinhado** a «spinner com nome».
- `FetchErrorBanner`: `role="alert"`; título em `<p>` (não `<h2>`) — **aceitável**; melhoria opcional: hierarquia de cabeçalhos se integrado em região sem `h1`/`h2` próximos.

### CONCERNS (âmbito PRD §4.3 vs entrega)

- **`/` (Dashboard):** o store expõe `loading` e `error` de transações, mas a página **não** apresenta banner/overlay/retry equivalente a `Transactions` — falha de API na raiz pode continuar sem orientação explícita (só efeitos indirectos). **Sugestão:** alinhar Dashboard ao mesmo padrão ou story de follow-up.
- **Auth (login/registo/recuperação) e `/settings`:** não constam do File List desta entrega; a story admite «mínimo 5 páginas», logo **não invalida** o PASS, mas o **DoD** pede percurso manual em fluxo financeiro + settings + MEI — **evidência (screenshot/nota sem PII) continua pendente** no artefacto da story.
- **`Categorias`:** `loadBudgetSummary` mantém apenas `console.error` em falha; o utilizador não vê retry para totais «gastos por categoria». **Risco baixo** se o foco da story for só a lista de categorias.

### Resumo

Implementação **coerente** com a spec §5.2 nos ficheiros entregues, componente partilhado reutilizável, gates automatizados **verdes**. **PASS com CONCERNS:** tratar Dashboard (e, se o PO exigir, settings/auth) numa **onda seguinte** ou story dedicada; fechar **DoD manual** com nota/snapshot sem PII antes de considerar o ciclo de release completo.

— Quinn (QA), 2026-04-01
