# Story — FR-ORC-DRE (P0): API **dre-matrix** (matriz orçado × realizado por ano)

**ID:** STORY-FR-ORC-DRE-P0-BACKEND  
**Prioridade:** P0 (Must — PRD onda MVP)  
**Depende de:** — (nenhuma; base para a story frontend)  
**Bloqueia:** [story-fr-orc-dre-p0-frontend-modo-dre.md](./story-fr-orc-dre-p0-frontend-modo-dre.md)  
**Fonte:** `docs/prd/PRD-orcamentos-dre-visao-matricial-2026-04-06.md` (§5 decisão API, §7 FR-DRE-02–06 dados, NFR-DRE-01)  
**Arquitetura:** `docs/technical/architecture-orcamentos-dre-visao-matricial-2026-04-06.md` §4–§5  
**UX (contrato de consumo):** `docs/specs/ux-spec-orcamentos-dre-visao-matricial-2026-04-06.md` §11 (payload esperado pelo cliente)

## User story

**Como** API do Meu Financeiro,  
**quero** expor um endpoint agregador que devolve, para um **ano** e o **utilizador autenticado**, os valores **valor_orcado**, **valor_gasto** e **valor_recebido** por **categoria × mês (1–12)** com a mesma semântica que `GET /categories/budgets/summary`,  
**para** o frontend poder renderizar o modo DRE com **uma ida ao servidor** por ano (NFR-DRE-01).

## Contexto técnico

- **Serviço existente:** `backend/src/services/categories.service.js` — `listCategoryBudgetsSummary` (lógica de categorias, `orçamentos`, `lancamentos_id`, normalização `normalizeCategoryName`, filtros `tipo` saída/entrada + `status === 'recebido'` nas entradas).  
- **Rotas:** `backend/src/routes/categories.routes.js`; **controller:** `backend/src/controllers/categories.controller.js`.  
- **Endpoint alvo (arquitetura):** `GET /categories/budgets/dre-matrix?year={YYYY}` com `requireAuth`.  
- **Resposta:** array de objetos `{ categorias_id, month, valor_orcado, valor_gasto, valor_recebido }` — ver arquitetura §4.2; omitir células totalmente vazias **ou** incluir apenas onde há orçamento ou movimento (alinhar com uma regra única documentada na story de implementação).

## Critérios de aceite

### API e contrato

- [x] `GET /categories/budgets/dre-matrix?year=YYYY` registado **antes** de rotas genéricas que possam colidir (ordem no router).  
- [x] `year` obrigatório e válido; `400` com mensagem alinhada ao padrão do projeto se inválido; `401` sem sessão.  
- [x] Corpo JSON: array de células com `categorias_id` (número), `month` (1–12), `valor_orcado` (número ou `null`), `valor_gasto` e `valor_recebido` (números, default 0 onde aplicável).

### Paridade com summary (AC-DRE-01)

- [x] Para pelo menos **dois** meses de teste (ex.: março e julho) e um conjunto de dados conhecido (fixture ou staging), os valores por categoria devolvidos pela **matriz** para `(year, month)` coincidem com o resultado de `listCategoryBudgetsSummary(userId, { year, month })` (tolerância: apenas arredondamento de ponto flutuante se existir).  
- [x] Documentar no **Completion Notes** do dev o método de verificação (teste automatizado, script ou checklist manual).

### Segurança e isolamento

- [x] Apenas `user_id` do token/sessão; nunca expor dados de outro utilizador.

## Tasks (implementação)

1. [x] Implementar `listCategoryBudgetsDreMatrix` em `categories.service.js` (queries ano completo + agregação por mês; reutilizar/extrair helpers com `listCategoryBudgetsSummary` quando reduzir duplicação sem regressão).  
2. [x] Expor `listCategoryBudgetsDreMatrix` no `categories.controller.js`.  
3. [x] Registar rota `GET /budgets/dre-matrix` sob o prefixo de categorias (caminho final: `/categories/budgets/dre-matrix`).  
4. [x] Adicionar teste automatizado **ou** documento de verificação de paridade obrigatório na DoD (preferência: teste em `backend/tests/` com mock de Supabase ou teste de contrato HTTP se o projeto já tiver padrão).

## Fora de escopo

- Rota admin espelhada (`/admin/users/:id/...`) — story futura.  
- Alteração de schema SQL / novas tabelas.

## File list (checklist implementação)

- [x] `backend/src/services/categories.service.js`  
- [x] `backend/src/controllers/categories.controller.js`  
- [x] `backend/src/routes/categories.routes.js`  
- [x] `backend/tests/categories-dre-matrix.routes.contract.test.js`  
- [x] `backend/tests/categories-dre-matrix.month-parse.test.js`
- [x] `backend/tests/categories-dre-matrix.summary-parity.test.js`

## Definition of Done

- Paridade documentada ou testada (critério acima).  
- `npm test` (backend) e `npm run lint` no pacote tocado sem novos erros.  
- Contrato consumível pelo `categoryService` na story frontend.

## Qualidade / CodeRabbit

- Evitar N+1: no máximo **poucas** queries ao Supabase por pedido (arquitetura §5.1).  
- Não alterar comportamento de `listCategoryBudgetsSummary` / `listCategoryBudgetsYearly` sem teste de regressão manual ou automático.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- Endpoint `GET /categories/budgets/dre-matrix?year=YYYY` — resposta em `sendSuccess`: `data` é array de `{ categorias_id, month (1–12), valor_orcado, valor_gasto, valor_recebido }`; células omitidas se não há linha de `orçamentos` naquele mês e gasto/recebido são 0 (cliente trata ausência como zeros + orçamento inexistente).
- **Paridade com `listCategoryBudgetsSummary`:** mesma origem de dados (categorias user+global; `orçamentos` no mês; `lancamentos_id` saídas `saida`/`saída` no intervalo do mês; entradas `entrada`+`recebido`); mesma `normalizeCategoryName` e mesma agregação por nome de categoria. Para qualquer `(year, month)`, filtrar a matriz por `month` e comparar com o summary — valores devem coincidir célula a célula para categorias presentes na matriz; categorias só com zeros no summary não têm célula na matriz (equivalente a null/0/0).
- **Verificação:** testes `categories-dre-matrix.routes.contract.test.js` (rota + auth), `categories-dre-matrix.month-parse.test.js` (parsing de mês) e **`categories-dre-matrix.summary-parity.test.js`** — paridade **AC-DRE-01** com mock Supabase: para **março e julho** de 2025, cada linha de `listCategoryBudgetsSummary(userId, { year, month })` alinha-se à fatia da matriz (`month`); células ausentes na matriz implicam summary com gasto/recebido 0 e sem linha de orçamento naquele mês. Hook de teste: `__setCategoriesBudgetReadClientForTests` em `categories.service.js` (apenas leituras usadas por summary + dre-matrix). Checklist manual em staging continua útil antes de release.

### File List (implementação)

- `backend/src/services/categories.service.js`
- `backend/src/controllers/categories.controller.js`
- `backend/src/routes/categories.routes.js`
- `backend/tests/categories-dre-matrix.routes.contract.test.js`
- `backend/tests/categories-dre-matrix.month-parse.test.js`
- `backend/tests/categories-dre-matrix.summary-parity.test.js` (paridade matriz × mês vs summary, mock Supabase)

### Debug Log References

- `npm test` (backend) — suite completa com `categories-dre-matrix.summary-parity.test.js` (exit 0).

### Change Log

- **2026-04-06** — `listCategoryBudgetsDreMatrix`, rota, controller, testes de contrato e parsing de mês.
- **2026-04-06** — Resposta a QA (gate CONCERNS): teste automatizado de paridade summary vs matriz (março/julho) + `getCategoriesBudgetReadClient` / `__setCategoriesBudgetReadClientForTests`.

---

## QA Results

**Revisor:** Quinn (QA / advisory)  
**Data:** 2026-04-06  
**Decisão de gate:** **CONCERNS** (aprovável para avançar o frontend; reforçar evidência de paridade antes de produção)

### Rastreio critérios → evidência

| Critério | Veredicto | Evidência |
|----------|-----------|-----------|
| Rota `GET /categories/budgets/dre-matrix` + ordem no router | **OK** | `categories.routes.js`: `/budgets/dre-matrix` declarada **antes** de `GET /budgets`; prefixo `/categories` em `routes/index.js`. |
| `requireAuth` | **OK** | `categories-dre-matrix.routes.contract.test.js` confirma `requireAuth` e handler `listCategoryBudgetsDreMatrix`. |
| Validação de `year` → 400 | **OK** | `listCategoryBudgetsDreMatrix`: `NaN`, não inteiro, `< 1900` ou `> 2100` → `badRequest('Ano inválido')`. |
| Contrato JSON (células) | **OK** | Serviço emite `categorias_id`, `month` (1–12), `valor_orcado`, `valor_gasto`, `valor_recebido`; payload espelhado nas Completion Notes. |
| NFR poucas queries | **OK** | Quatro leituras Supabase por pedido (categorias ×2 lógicas, orçamentos, saídas, entradas recebidas). |
| Paridade com `listCategoryBudgetsSummary` (AC-DRE-01) | **CONCERNS** | Lógica **espelha** summary (mesmos filtros de `tipo`/`status`, mesma `normalizeCategoryName`). **Não há** teste automatizado que compare matriz filtrada por mês vs `listCategoryBudgetsSummary` com dados fixos; a story marcou o critério com base em inspeção + checklist manual sugerido — **risco médio** se o frontend assumir paridade sem validação em staging. |
| Testes automatizados | **CONCERNS** | Cobertura: contrato de rota + parsing de mês. **Falta:** teste de integração ou propriedade paridade (mock Supabase) para fechar AC-DRE-01 de forma repetível. |
| Superfície pública extra | **Observação** | `parseMonthFromLancamentoDate` e `parseMonthFromBudgetDate` exportados do serviço **apenas** para testes — aceitável; alternativa futura: módulo interno só de teste. |

### Testes executados (gate)

- `npm test` (backend, suite completa) — **exit 0** (2026-04-06); inclui `categories-dre-matrix.routes.contract.test.js` e `categories-dre-matrix.month-parse.test.js`.

### Recomendações (não bloqueantes para story frontend)

1. **Antes de release:** executar checklist manual em staging (dois meses, várias categorias) comparando `GET .../dre-matrix?year=` filtrado por `month` com `GET .../summary?year=&month=` — ou adicionar `backend/tests/` com mock de cliente Supabase.  
2. **Documentar no cliente:** resposta esparsa — células ausentes = sem linha de orçamento naquele mês e realizados 0 (já notado nas Completion Notes).

### Resumo

Implementação **coerente** com arquitetura e com `listCategoryBudgetsSummary`; rota e auth corretos. **Gate CONCERNS** reflete sobretudo a **ausência de prova automatizada de paridade** exigida pelo texto do AC-DRE-01, não um defeito lógico identificado no código nesta revisão estática.
