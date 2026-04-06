# Story — FR-ORC-DRE (P0): Orçamentos — modo **DRE / visão matricial** (UI + domínio)

**ID:** STORY-FR-ORC-DRE-P0-FRONTEND  
**Prioridade:** P0 (Must — PRD onda MVP)  
**Depende de:** [story-fr-orc-dre-p0-backend-api-matriz.md](./story-fr-orc-dre-p0-backend-api-matriz.md) — endpoint `GET /categories/budgets/dre-matrix` disponível e estável  
**Fonte:** `docs/prd/PRD-orcamentos-dre-visao-matricial-2026-04-06.md` (FR-DRE-01 a FR-DRE-10, AC-DRE-01 a AC-DRE-09)  
**Especificação UX:** `docs/specs/ux-spec-orcamentos-dre-visao-matricial-2026-04-06.md`  
**Arquitetura:** `docs/technical/architecture-orcamentos-dre-visao-matricial-2026-04-06.md` §3, §6–§7

## User story

**Como** utilizador na página **Orçamentos** (`/orcamentos`),  
**quero** alternar entre o **modo por mês** (atual) e o modo **DRE / visão anual** com sidebar de períodos, grelha só de leitura (Planejado, Realizado, Atingimento, % Receita), grupos Receitas/Despesas, subtotais e resultado,  
**para** analisar o meu mapa de resultado pessoal ao longo do ano sem exportar para folhas de cálculo.

## Contexto técnico

- **Página atual:** `frontend/src/pages/Orcamentos.tsx` — extrair ou compor **tab** “Por mês” vs “DRE”; sincronizar **ano** entre modos (UX spec §3.1, §6.1).  
- **API:** `fetchCategoryBudgetsDreMatrix` em `frontend/src/services/categoryService.ts` + tipos TS espelhando o contrato da story backend.  
- **Lógica pura:** `frontend/src/utils/dreMatrix.ts` (ou `lib/`) — elegibilidade de categorias, agregação **Total anual**, subtotais, resultado, atingimento, % receita (PRD §5 e UX §6).  
- **Hook:** `frontend/src/hooks/useDreMatrix.ts` — loading, erro, retry.  
- **Componentes (sugestão UX spec §11):** `frontend/src/components/orcamentos/DrePeriodSidebar.tsx`, `DreMatrixTable.tsx` (e subpartes para grupo colapsável / resultado).  
- **Padrões UI:** `PageShell`, `PageTitle`, `planner-card`, `planner-button*`, `LoadingOverlay`, `FetchErrorBanner`, `EmptyState`, tokens já usados em Orçamentos.

## Critérios de aceite

### Navegação e modos (FR-DRE-01, FR-DRE-10, AC-DRE-09)

- [ ] Existem separadores claros **Por mês** | **DRE** (ou rótulos equivalentes aprovados pelo PO).  
- [ ] No modo DRE **não** há inputs de edição de orçamento; alterações continuam só no modo mensal.  
- [ ] Empty state com CTA para mudar ao modo mensal quando não há dados no ano (FR-DRE-08, UX §7.4).

### Período e grelha (FR-DRE-02, FR-DRE-03, AC-DRE-01, AC-DRE-02)

- [ ] Seletor de **ano** (partilhado ou consistente com o modo mensal ao alternar tabs).  
- [ ] Sidebar: Janeiro–Dezembro + **Total anual**; um período ativo de cada vez.  
- [ ] Para o período selecionado, quatro colunas: **Planejado**, **Realizado**, **Atingimento**, **% Receita** (UX §5.3).  
- [ ] **Total anual:** somas e fórmulas conforme PRD §6.1 e UX §4.3.  
- [ ] Valores mensais alinhados à API (paridade com summary implícita via backend).

### Grupos e resultado (FR-DRE-04, FR-DRE-05, AC-DRE-03, AC-DRE-04)

- [ ] Grupos **Receitas** e **Despesas** por `tipo` de categoria; linhas elegíveis conforme UX §3.3.  
- [ ] Subtotais por grupo corretos; **Resultado (realizado)** = receitas − despesas no período visível.  
- [ ] Colapso de grupo com **subtotal ainda visível** quando recolhido (UX §5.4).

### Métricas derivadas (FR-DRE-06, AC-DRE-05)

- [ ] Atingimento e % Receita: regras PRD/UX (incl. **“—”** quando planeado zero ou receita total zero).  
- [ ] Formatação **pt-BR** moeda + % com **1 casa decimal** (UX §6.1).

### Realce (FR-DRE-07, AC-DRE-06) — P1 fino; mínimo P0

- [ ] Despesa com realizado > planejado (e planejado > 0): realce em **Realizado** e **Atingimento** (ex.: `text-rose-*`).  
- [ ] Receita abaixo/acima do plano: âmbar / verde conforme UX §5.6.

### Acessibilidade (FR-DRE-09, AC-DRE-08)

- [ ] Tabs com papéis ARIA adequados; sidebar com navegação por teclado (UX §9).  
- [ ] Tabela semântica com `scope` / cabeçalhos associados; botões de colapso com `aria-expanded`.

### Disclaimer (PRD §1, UX §7.3)

- [ ] Linha curta visível no modo DRE: mapa de resultado pessoal, não documento fiscal.

## Tasks (implementação)

1. [x] `categoryService`: tipo `DreMatrixCell`, função `fetchCategoryBudgetsDreMatrix(userId, year)`.  
2. [x] `dreMatrix.ts`: funções puras + testes unitários (Vitest) cobrindo casos AC-DRE-05 e pelo menos um caso de subtotal/resultado.  
3. [x] `useDreMatrix.ts`: fetch, estados loading/error, refetch ao mudar ano.  
4. [x] Componentes `Dre*` + integração em `Orcamentos.tsx` (tabs, layout desktop + variante mobile *sticky* coluna — UX §4.2).  
5. [x] Tooltips ou `title`/`aria-description` para Atingimento e % Receita (UX §7.1–7.2).  
6. [x] `npm run lint`, `npm run typecheck`, `npm test` no frontend (incluindo novos testes).

## Fora de escopo

- Query string `?view=dre` na URL (opcional V1 — UX §3.1).  
- Legenda 50/30/20; grupos personalizados; edição na grelha DRE.

## File list (checklist implementação)

- [x] `frontend/src/pages/Orcamentos.tsx`  
- [x] `frontend/src/services/categoryService.ts`  
- [x] `frontend/src/utils/dreMatrix.ts`  
- [x] `frontend/src/utils/dreMatrix.test.ts` (ou co-localizado)  
- [x] `frontend/src/hooks/useDreMatrix.ts`  
- [x] `frontend/src/components/orcamentos/DrePeriodSidebar.tsx`  
- [x] `frontend/src/components/orcamentos/DreMatrixTable.tsx`  
- [x] `frontend/src/components/orcamentos/DreBudgetPanel.tsx`

## Definition of Done

- Critérios de aceite acima verificados (QA manual em `/orcamentos`).  
- `npm run lint`, `npm run typecheck`, `npm test` verdes no repo / pacote frontend.  
- Regressão: modo mensal existente (edição, duplicar mês, cartões) intacto.

## Qualidade / CodeRabbit

- Centralizar fórmulas só em `dreMatrix.ts` (NFR-DRE-04).  
- Evitar *prop drilling* excessivo: contexto local ao painel DRE ou hook único.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- Tabs **Por mês** | **DRE (visão anual)** em `/orcamentos` com `role="tablist"` / `tabpanel`, ano partilhado entre modos (`selectedYear`).
- Modo DRE: `DreBudgetPanel` + `useDreMatrix` (categorias + `GET /categories/budgets/dre-matrix`), sidebar Janeiro–Dezembro + Total anual, grelha só leitura (Planejado, Realizado, Atingimento, % Receita), grupos Receitas/Despesas colapsáveis com **subtotal sempre visível** (incl. recolhido), resultado realizado; disclaimer UX §7.3; empty state com CTA para **Por mês**.
- Fórmulas e formatação pt-BR centralizadas em `dreMatrix.ts`; testes Vitest em `dreMatrix.test.ts` (AC-DRE-05 + subtotal/resultado + anual).
- Realce P0: despesa acima do plano (rose); receita abaixo/acima (âmbar / verde). Sticky na 1.ª coluna em scroll horizontal (mobile).
- **Pós-QA (CONCERNS):** `DrePeriodSidebar` com *roving tabindex* (`tabIndex` 0 só no período em foco), `onFocus` alinha roving ao clicar; desktop `ArrowUp`/`ArrowDown`, mobile `ArrowLeft`/`ArrowRight`, `Home`/`End`; `isLg` inicial via `matchMedia` no primeiro render. `buildDreMatrixViewModel` restringe elegibilidade a tipos `entrada` ou `saida`/`saída`. Testes em `DrePeriodSidebar.test.tsx`.

### File List (implementação)

- `frontend/src/pages/Orcamentos.tsx`
- `frontend/src/services/categoryService.ts`
- `frontend/src/utils/dreMatrix.ts`
- `frontend/src/utils/dreMatrix.test.ts`
- `frontend/src/hooks/useDreMatrix.ts`
- `frontend/src/components/orcamentos/DrePeriodSidebar.tsx`
- `frontend/src/components/orcamentos/DreMatrixTable.tsx`
- `frontend/src/components/orcamentos/DreBudgetPanel.tsx`
- `frontend/src/components/orcamentos/DrePeriodSidebar.test.tsx`

### Debug Log References

- `npm run lint` (frontend) — exit 0 (avisos pré-existentes noutros ficheiros).
- `npm run typecheck` (frontend) — exit 0.
- `npm test` (frontend, Vitest) — 325 testes passaram, incl. `dreMatrix.test.ts` e `DrePeriodSidebar.test.tsx`.

### Change Log

- **2026-04-06** — Modo DRE: API client, `dreMatrix`, hook, componentes `Dre*`, tabs em `Orcamentos.tsx`.
- **2026-04-06** — Resposta a QA: sidebar com *roving tabindex* + setas (↑/↓ desktop, ←/→ mobile) + Home/End; `dreMatrix` filtra só tipos entrada/saída; testes `DrePeriodSidebar.test.tsx` e caso tipo inválido em `dreMatrix.test.ts`.

---

## QA Results

**Revisor:** Quinn (QA / advisory)  
**Data:** 2026-04-06  
**Decisão de gate:** **CONCERNS** (aprovável para merge com follow-up de a11y na sidebar; validação manual em `/orcamentos` recomendada)

### Rastreio critérios → evidência

| Critério | Veredicto | Evidência |
|----------|-----------|-----------|
| Tabs Por mês \| DRE (FR-DRE-01) | **OK** | `Orcamentos.tsx`: `role="tablist"` / `tab` / `tabpanel`, `aria-selected`, `aria-controls`, `tabIndex` no tab ativo; setas →/← entre tabs com reposição de foco. |
| Modo DRE só leitura; edição no mensal (FR-DRE-10) | **OK** | `DreMatrixTable` só `formatDreCurrency` / texto; inputs de orçamento permanecem no `tabpanel` mensal. |
| Empty state + CTA modo mensal (FR-DRE-08) | **OK** | `DreBudgetPanel`: `EmptyState` com copy UX §7.4 e botão “Ir para orçamento do mês” → `onGoToMonthTab`. |
| Ano partilhado entre modos | **OK** | `selectedYear` / `setSelectedYear` passados ao `DreBudgetPanel`; mesmo `yearOptions` no seletor mensal. |
| Sidebar mês + Total anual; período único | **OK** | `DrePeriodSidebar`: 12 meses + “Total anual”; `aria-current` no ativo. |
| Quatro colunas + total anual (fórmulas) | **OK** | `dreMatrix.ts`: `aggregateCategoryPeriod` mensal/anual; `computeAtingimentoPercent` / `computePctReceitaLine`; subtotais e `resultadoRealizado = receitas − despesas`. |
| Grupos Receitas/Despesas; elegibilidade UX §3.3 | **OK** | `isCategoryEligibleInYear`; filtro `entrada` vs `saida`/`saída`; testes em `dreMatrix.test.ts`. |
| Colapso com subtotal visível (UX §5.4) | **OK** | `DreMatrixTable`: `tbody` das linhas com `hidden` quando fechado; `SubtotalRow` em `tbody` separado sempre presente. |
| Atingimento / % receita “—”; % 1 decimal; pt-BR | **OK** | `formatAtingimento` / `formatPctReceita`; `formatDreCurrency` pt-BR BRL; casos cobertos nos testes. |
| Realce P0 despesa/receita (FR-DRE-07) | **OK** | `rowHighlights` → classes rose / amber / emerald em `MetricCell`. |
| A11y tabela + colapsos (AC-DRE-08) | **CONCERNS** | `scope="col"`/`row`/`colgroup`; botões grupo com `aria-expanded` e `aria-controls` para `tbody` das linhas. **Gap:** UX §5.2 pede navegação ↑/↓ e *roving tabindex* na sidebar desktop — hoje só ordem de tabulação linear nos botões dos meses (13 focáveis). |
| Disclaimer (UX §7.3) | **OK** | Parágrafo no topo de `DreBudgetPanel` alinhado ao microcopy. |
| Tooltips Atingimento / % Receita | **OK** | `title` nos `<th>` relevantes, nas células derivadas e constantes `TOOLTIPS` em `DreBudgetPanel`. |
| NFR-DRE-04 (fórmulas centralizadas) | **OK** | Lógica numérica em `dreMatrix.ts`; UI consome view model. |
| Testes automatizados | **CONCERNS** | `dreMatrix.test.ts` (9 testes) cobre métricas e agregação; **sem** teste de componente/React para tabs, `DreBudgetPanel` ou fetch — aceitável P0 se DoD manual for executado. |

### Testes executados (gate)

- `npx vitest run src/utils/dreMatrix.test.ts --environment jsdom` — **exit 0** (9 testes, 2026-04-06).

### Recomendações (não bloqueantes)

1. **A11y sidebar:** implementar padrão *roving tabindex* e/ou setas verticais no desktop conforme UX §5.2 e checklist §9.  
2. **Opcional:** teste RTL mínimo em `Orcamentos` (tab DRE visível, painel `hidden`) ou smoke em `DreBudgetPanel` com API mockada.  
3. **Categoria com `tipo` fora entrada/saída:** hoje é omitida dos grupos se elegível por dados — risco baixo se o domínio garantir só tipos canónicos.

### Resumo

Implementação **alinhada** à story e à UX spec na maior parte: tabs, dados, grelha, subtotais, resultado, empty state, disclaimer e testes unitários do domínio. **Gate CONCERNS** reflete sobretudo o **desvio parcial** face ao teclado da sidebar (UX §5.2) e à **ausência de testes de UI**; não foi identificado bug lógico bloqueante na revisão estática do código.

— Quinn, guardião da qualidade 🛡️
