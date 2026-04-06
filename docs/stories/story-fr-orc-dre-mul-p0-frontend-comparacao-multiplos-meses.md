# Story — FR-DRE-MUL (P0): Orçamentos — DRE **comparação entre múltiplos meses** (frontend)

**ID:** STORY-FR-ORC-DRE-MUL-P0-FRONTEND  
**Prioridade:** P0 (Must — PRD onda MVP)  
**Depende de:** [story-fr-orc-dre-p0-frontend-modo-dre.md](./story-fr-orc-dre-p0-frontend-modo-dre.md) — modo DRE, `dre-matrix`, `DreBudgetPanel`, `DrePeriodSidebar`, `DreMatrixTable`, `dreMatrix.ts`  
**Bloqueia:** — (opcional follow-up: [story-fr-orc-dre-mul-p1-realce-comparacao.md](./story-fr-orc-dre-mul-p1-realce-comparacao.md))  
**Fonte:** `docs/prd/PRD-orcamentos-dre-comparacao-multiplos-meses-2026-04-06.md` (FR-DRE-MUL-01–10, AC-DRE-MUL-01–08, NFR-DRE-MUL-01–05)  
**Especificação UX:** `docs/specs/ux-spec-orcamentos-dre-comparacao-multiplos-meses-2026-04-06.md`  
**Arquitetura:** `docs/technical/architecture-orcamentos-dre-comparacao-multiplos-meses-2026-04-06.md`

## User story

**Como** utilizador na aba **DRE** de **Orçamentos**,  
**quero** **selecionar vários meses** do mesmo ano (até ao limite do meu ecrã) e ver **lado a lado** Planejado, Realizado, Atingimento e % Receita **por mês**, mantendo **Total anual** como modo **exclusivo** quando quero o agregado do ano,  
**para** comparar meses (ex.: janeiro vs março) sem alternar de um para o outro de memória.

## Contexto técnico

- **Sem backend novo:** reutilizar `useDreMatrix` / `DreMatrixCell[]` já carregados para o ano (PRD §5, arquitetura §4).  
- **Estado canónico:** `DreUiSelection` — `{ mode: 'annual' }` **ou** `{ mode: 'months'; months: number[] }` (únicos, ordenados, 1..K); ver arquitetura §5.  
- **Domínio:** para comparação, **N** instâncias de `buildDreMatrixViewModel(categories, cells, year, { kind: 'month', month: m }, MESES)` — **não** duplicar fórmulas (NFR-DRE-MUL-04).  
- **K:** `maxMonths = 4` se `min-width: 1024px`, senão **2** — alinhar a `DrePeriodSidebar` / UX spec.  
- **Resize:** ao passar de `lg` para estreito com >2 meses, **truncar** para os **dois primeiros cronologicamente** + `aria-live="polite"` (UX §4.5, NFR-DRE-MUL-03 **fechado na UX**).  
- **Último mês:** **impedir** desmarcar o único mês seleccionado quando `mode === 'months'` (UX spec §3.1 nota).  
- **Ficheiros tocados (previstos):** `dreMatrix.ts`, `dreMatrix.test.ts`, novo hook `useMediaQueryMinLg.ts` (ou nome alinhado ao repo), `DrePeriodSidebar.tsx`, `DreBudgetPanel.tsx`, `DreMatrixTable.tsx`.

## Critérios de aceite

### Seleção e limites (FR-DRE-MUL-01, FR-DRE-MUL-07, AC-DRE-MUL-06)

- [ ] Cada mês na barra de períodos comporta-se como **toggle** (`aria-pressed`); ordem das colunas na grelha é **sempre cronológica**.  
- [ ] Com **≥1024px**, no máximo **4** meses seleccionados; abaixo disso, no máximo **2**. Tentativa de exceder **não** altera a seleção e dispara **feedback** acessível (`role="status"` / `aria-live="polite"` — UX §6.2).  
- [ ] Ao redimensionar de largo para estreito com >2 meses: ficam só os **dois primeiros** meses na ordem cronológica + anúncio acessível (UX §4.5, §6.3).

### Equivalência mês único e anual (FR-DRE-MUL-02, FR-DRE-MUL-06, AC-DRE-MUL-02, AC-DRE-MUL-05)

- [ ] Com **exactamente um** mês seleccionado, a tabela é **equivalente** à anterior: **uma** linha de cabeçalho, quatro colunas de métricas, **sem** segunda linha de agrupamento por mês.  
- [ ] **Total anual:** com **≥2** meses, o botão está **disabled** + ajuda contextual (tooltip/`title` conforme UX §4.4). Ao activar Total anual, **limpa** seleção de meses e mostra vista anual actual.  
- [ ] De **Total anual**, clicar num mês passa a **só esse mês** seleccionado (vista mês único).

### Grelha comparação (FR-DRE-MUL-03, FR-DRE-MUL-05, AC-DRE-MUL-01, AC-DRE-MUL-04)

- [ ] Com **≥2** meses: cabeçalho em **duas** linhas (`scope="colgroup"` / `scope="col"` — UX §5.3); grupos com `colSpan={1+4N}`; subtotais e linhas com **4×N** células numéricas.  
- [ ] **Resultado (realizado):** **uma** célula monetária por mês na coluna **Realizado** do bloco; Planejado, Atingimento e % Receita **“—”** nessa linha (UX §5.3 tabela).  
- [ ] Valores de uma categoria no mês *m* em modo comparação **coincidem** com os obtidos ao ver **só** o mês *m* (AC-DRE-MUL-01).

### Métricas (FR-DRE-MUL-04, AC-DRE-MUL-03)

- [ ] Atingimento e % Receita **por mês** com as mesmas regras que `dreMatrix` actual (denominador = receita total **desse** mês).

### Realce (FR-DRE-MUL-08) — mínimo aceitável no P0

- [ ] Realce aplicado **por célula e por mês** (sem herdar cor entre meses). *(Pode ser refinado na story P1.)*

### Estados vazios e leitura (FR-DRE-MUL-09, FR-DRE-MUL-10)

- [ ] Células sem dados seguem política actual (zeros / “—”). DRE permanece **só leitura** para orçamentos.

### Acessibilidade e cópia (AC-DRE-MUL-07)

- [ ] Com **≥2** meses, texto ou título que comunica **comparação** (ex.: “Comparando N meses…” — UX §5.7).  
- [ ] Navegação por teclado na barra: roving `tabindex`; setas movem foco; **Enter/Space** faz toggle (UX §5.1).

### Qualidade (AC-DRE-MUL-08)

- [ ] `npm run lint`, `npm run typecheck`, `npm test` verdes nos pacotes tocados.  
- [ ] Regressão: aba **Por mês** e fetch `dre-matrix` **inalterados** em comportamento.

## Tasks (implementação)

1. [x] Tipos `DreUiSelection` + funções puras `normalizeDreMonths`, `toggleMonthInSelection` (ou equivalente) + testes em `dreMatrix.test.ts`.  
2. [x] Hook `useMediaQueryMinLg` (1024px) + efeito de truncagem em `DreBudgetPanel` ao cruzar breakpoint.  
3. [x] Refactor `DrePeriodSidebar`: props novas, `aria-pressed`, Total anual `disabled` quando aplicável, bloqueio de desmarcar último mês.  
4. [x] `DreBudgetPanel`: estado `DreUiSelection`; `useMemo` para array de `DreMatrixViewModel` (N× mês ou 1× anual); passar `variant` + `models` à tabela.  
5. [x] `DreMatrixTable`: ramo `single` (markup actual) vs `compare` (thead 2 linhas, corpo largo, resultado multi-coluna).  
6. [x] Regiões `aria-live` para limite K e para truncagem resize (mensagens UX §7.2–7.3).  
7. [x] `npm run lint`, `npm run typecheck`, `npm test` (frontend).

## Fora de escopo

- Query string `?dreMonths=` (P2 — PRD).  
- Comparar **anos** diferentes.  
- Novo endpoint ou alteração ao `dre-matrix`.

## File list (checklist implementação)

- [x] `frontend/src/utils/dreMatrix.ts`  
- [x] `frontend/src/utils/dreMatrix.test.ts`  
- [x] `frontend/src/hooks/useMediaQueryMinLg.ts` (ou nome acordado)  
- [x] `frontend/src/components/orcamentos/DreBudgetPanel.tsx`  
- [x] `frontend/src/components/orcamentos/DrePeriodSidebar.tsx`  
- [x] `frontend/src/components/orcamentos/DreMatrixTable.tsx`  
- [x] (se necessário) `frontend/src/types/dreUi.ts` ou tipos co-localizados — tipos em `dreMatrix.ts`

## Definition of Done

- Todos os critérios de aceite verificados (QA manual em `/orcamentos` → DRE).  
- Gates `lint` / `typecheck` / `test` verdes.  
- Sem regressão no modo mensal nem no carregamento da matriz.

## Qualidade / CodeRabbit

- Evitar duplicar lógica de `buildDreMatrixViewModel`; comparar = mapear meses → view models.  
- Garantir `colSpan` e `thead` coerentes para leitores de ecrã (UX §8).  
- Não introduzir pedidos HTTP extra por mês (NFR-DRE-MUL-01).

## Rastreabilidade rápida

| PRD / AC | Secção desta story |
|----------|-------------------|
| FR-DRE-MUL-01, 07 | Seleção e limites |
| FR-DRE-MUL-02, 06 | Equivalência mês único e anual |
| FR-DRE-MUL-03, 05 | Grelha comparação |
| FR-DRE-MUL-04 | Métricas |
| FR-DRE-MUL-08 | Realce (mínimo P0) |
| FR-DRE-MUL-09, 10 | Estados vazios e leitura |
| AC-DRE-MUL-01–08 | Critérios acima |

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor Agent (implementação assistida)

### Completion Notes List

- Implementação P0: `DreUiSelection`, limite K (4 lg / 2 estreito), truncagem ao resize com `aria-live`, sidebar com toggle e anual disabled com ≥2 meses, tabela `single` vs `compare` com `buildDreMatrixViewModel` por mês.
- Teste `toBeDisabled` substituído por `expect(button.disabled).toBe(true)` (Vitest sem jest-dom estendido).
- Gates: `npm run lint` (0 erros), `npm run typecheck`, `npm test` na raiz do monorepo — verdes.
- **Follow-up QA (2026-04-06):** `DreMatrixTable.test.tsx` cobre modo `compare` (thead dois níveis, `colSpan`, linha Resultado, `aria-describedby`). `useDreMatrix.test.ts` garante um ciclo de fetch por `(userId, ano)` e novo fetch só ao mudar ano — mitiga ressalva de regressão do endpoint `dre-matrix`. Smoke manual aba **Por mês** continua recomendado na Definition of Done. CodeRabbit (WSL) permanece opcional no fluxo do projeto.

### File List (implementação)

- `frontend/src/utils/dreMatrix.ts`
- `frontend/src/utils/dreMatrix.test.ts`
- `frontend/src/hooks/useMediaQueryMinLg.ts`
- `frontend/src/hooks/useDreMatrix.test.ts`
- `frontend/src/components/orcamentos/DreBudgetPanel.tsx`
- `frontend/src/components/orcamentos/DrePeriodSidebar.tsx`
- `frontend/src/components/orcamentos/DrePeriodSidebar.test.tsx`
- `frontend/src/components/orcamentos/DreMatrixTable.tsx`
- `frontend/src/components/orcamentos/DreMatrixTable.test.tsx`

### Debug Log References

- N/A

### Change Log

- **2026-04-06** — Story criada (SM River) a partir do PRD, UX spec e arquitetura multi-mês.
- **2026-04-06** — Implementação P0 comparação multi-mês (Dex): utilitários, hook breakpoint, painel/sidebar/tabela, testes; correção assert disabled no teste da sidebar.
- **2026-04-06** — Follow-up ressalvas QA: testes RTL `DreMatrixTable` (compare + single) e `useDreMatrix` (fetch por ano).

---

## QA Results

### Revisão — 2026-04-06 (Quinn / QA assistido)

**Decisão de gate:** **PASS com ressalvas (CONCERNS)** — código alinhado à story e aos NFRs principais; falta cobertura automática do markup da tabela em modo `compare` e validação manual explícita da aba **Por mês** / regressão de fetch.

**Evidência executada**

- `npm test` na raiz do monorepo — **OK** (exit 0).
- Revisão estática dos ficheiros: `dreMatrix.ts`, `dreMatrix.test.ts`, `useMediaQueryMinLg.ts`, `DreBudgetPanel.tsx`, `DrePeriodSidebar.tsx`, `DrePeriodSidebar.test.tsx`, `DreMatrixTable.tsx`, `useDreMatrix.ts`.

**Rastreio aos critérios de aceite (implementação vs especificação)**

| Área | Veredicto | Notas |
|------|-----------|--------|
| Toggle meses + ordem cronológica | **Cumpre** | `toggleMonthInSelection` + `normalizeDreMonths`; colunas compare ordenadas em `DreBudgetPanel`; `aria-pressed` nos meses. |
| Limite K (4 lg / 2 estreito) + feedback | **Cumpre** | `useMediaQueryMinLg` + `maxMonths`; `rejected` → `role="status"` + `aria-live="polite"`. |
| Truncagem ao estreitar >2 meses | **Cumpre** | Efeito em `DreBudgetPanel` (lg→!lg) com `slice(0,2)` ordenado + anúncio. |
| Mês único ≡ tabela antiga | **Cumpre** | `variant === 'single'` com thead de uma linha. |
| Total anual exclusivo | **Cumpre** | `disabled` + `title`; `onSelectAnnual`; clique em mês a partir de anual → mês único. |
| Grelha compare (thead 2 linhas, colspan, resultado) | **Cumpre** | `scope="colgroup"` / `scope="col"`; `colSpan={4}` por mês; `compareColSpan = 1 + 4N`; linha resultado com monetário só em Realizado e "—" nos outros. |
| AC-DRE-MUL-01 paridade valores | **Cumpre** | Teste `AC-DRE-MUL-01 paridade coluna vs mês único` em `dreMatrix.test.ts`. |
| Métricas por mês (denominador do mês) | **Cumpre** | Cada coluna = `buildDreMatrixViewModel(..., month)` — mesma pipeline que mês único. |
| Realce por célula/mês | **Cumpre** | `DataRowsCompare` usa `highlight*` do VM de cada mês. |
| NFR sem HTTP extra | **Cumpre** | `useDreMatrix` continua um fetch por ano. |
| Acessibilidade barra (roving, setas) | **Cumpre** | `tabIndex` 0/-1; setas Up/Down (lg) / Left/Right (mobile). Enter/Space: sem teste dedicado — **comportamento nativo de `<button>`** (activação padrão). |
| Título "Comparando N meses…" | **Cumpre** | `tableTitle` com prefixo e lista de meses; `id` + `aria-describedby` na tabela compare. |

**Ressalvas / dívida de teste**

1. **Sem testes de componente** para `DreMatrixTable` em modo `compare` (estrutura `thead`/`colSpan`/linha resultado) — risco médio de regressão visual/a11y; mitigar com teste RTL ou smoke E2E na P1 ou antes do merge se a equipa quiser barra mais alta.
2. **Regressão "Por mês" + `dre-matrix`**: não há teste automático nesta story; **recomenda-se smoke manual** em `/orcamentos` (aba Por mês inalterada + DRE com multi-mês).
3. **CodeRabbit (WSL)**: não executado nesta revisão assistida; opcional antes do merge conforme processo do projeto.

**Conclusão**

Aprovação **PASS com CONCERNS** para merge após smoke manual mínimo (DRE: 1 / 2 / 4 meses, resize, anual ↔ mês; Por mês). Opcional: acrescentar teste(s) ao `DreMatrixTable` no modo compare para fechar a ressalva 1.

— Quinn, guardião da qualidade 🛡️
