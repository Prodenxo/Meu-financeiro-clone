# Story — FR-ORC-ACT (P0): Orçamentos — coluna **Ações** (Editar / Remover planejamento)

**ID:** STORY-FR-ORC-ACT-P0-FRONTEND  
**Prioridade:** P0 (Must — MVP PRD)  
**Depende de:** nenhuma (backend **sem** alteração obrigatória; `POST /categories/budgets` com `valor_orcado: null` já suportado)  
**Fonte:** [`docs/prd/PRD-orcamentos-acoes-editar-excluir-2026-04-07.md`](../prd/PRD-orcamentos-acoes-editar-excluir-2026-04-07.md) — **FR-ORC-ACT-01** a **FR-ORC-ACT-09**, **AC-ORC-ACT-01** a **AC-ORC-ACT-06**  
**Especificação UX:** [`docs/specs/ux-spec-orcamentos-acoes-editar-excluir-2026-04-07.md`](../specs/ux-spec-orcamentos-acoes-editar-excluir-2026-04-07.md)  
**Arquitetura:** [`docs/technical/architecture-orcamentos-acoes-editar-excluir-2026-04-07.md`](../technical/architecture-orcamentos-acoes-editar-excluir-2026-04-07.md) §3–§7, §13  
**Épico (PRD §15):** Orçamentos — ações por linha (editar / remover planejamento)

## User story

**Como** utilizador na página **Orçamentos** (`/orcamentos`), aba **Por mês**,  
**quero** ver, em cada linha da tabela **Orçamento por Categoria**, ações **Editar** e **Remover planejamento** (com confirmação clara de que **não** apago lançamentos nem a categoria),  
**para** descobrir facilmente como ajustar o valor planejado e remover o orçamento daquele mês quando deixar de fazer sentido.

## Contexto técnico

- **Sem mudança de rota backend:** `saveCategoryBudget(userId, categoriasId, null, getMonthStartDate())` → mesmo `POST /categories/budgets` (arquitetura §4).  
- **Página:** `frontend/src/pages/Orcamentos.tsx` — nova coluna **Ações** após **Status**; ícones Lucide **Pencil** / **Trash2** (UX §4.2); área tocável ≥ 44×44 px.  
- **Editar:** `Map<number, HTMLInputElement>` (ou ref callback) por `categorias_id`; `focus()` no input **Planejado**; opcional `select()` com `matchMedia('(pointer: fine)')` (UX §6.1, PRD §6.1).  
- **Remover:** componente `OrcamentoRemovePlanningConfirmDialog` (nome sugerido na arquitetura) — espelhar acessibilidade de `MeiCatalogoDeleteCatalogConfirmDialog` (`role="dialog"`, `aria-modal`, foco inicial **Cancelar**, `Esc`, `data-testid="orcamento-remove-planning-confirm"`). **Não** reutilizar *copy* MEI.  
- **Copy:** módulo dedicado, ex. `frontend/src/copy/orcamentosRemovePlanning.ts` — título, parágrafos, botões, toast sucesso; corpo conforme PRD §10.2 / UX §5.  
- **Estados:** `deleteTarget`, `deletingCategoryId` (ou equivalente), `deleteDialogError`; durante `savingBudgetByCategory[id]` **e** durante delete, desabilitar **Editar** + **Excluir** + input na linha; com `addBudgetOpen`, desabilitar ações na tabela (UX §3.3, §6.4).  
- **Z-index:** diálogo de remoção não competir com modal **Novo Orçamento** (UX spec §8 — ex. `z-[60]` vs `z-50` ou bloqueio de abertura).  
- **Após sucesso:** `toast.success` + `refreshSummary` / mesmo fluxo que após gravação inline; linha desaparece (filtro `valor_orcado > 0`).  
- **Testes:** RTL estilo `MeiCatalogoClientes.test.tsx` — cancelar não chama API; confirmar chama `saveCategoryBudget` com `null` e `date` esperado (mock).

## Critérios de aceite

### Coluna e Editar (FR-ORC-ACT-01, FR-ORC-ACT-02, AC-ORC-ACT-06 parcial)

- [ ] Tabela na aba **Por mês** tem coluna **Ações** por último, cabeçalho **Ações** (ou sr-only acordado UX).  
- [ ] **Editar** foca o `input` **Planejado** da **mesma** linha; gravação continua em blur/Enter (`handleBudgetBlur`).  
- [ ] Com **Novo Orçamento** aberto, ações da tabela **desabilitadas** (ou equivalente que impeça fluxo concorrente).

### Remover — diálogo e API (FR-ORC-ACT-03, FR-ORC-ACT-04, AC-ORC-ACT-01)

- [ ] **Excluir** abre diálogo com *copy* canónica PRD §10.2 (categoria + mês/ano dinâmicos).  
- [ ] Confirmar envia payload com `categorias_id` correto, `valor_orcado: null`, `date` = primeiro dia do mês selecionado (formato já usado por `getMonthStartDate()`).

### Pós-sucesso e lista (FR-ORC-ACT-05, FR-ORC-ACT-06, AC-ORC-ACT-02, AC-ORC-ACT-03)

- [ ] Após OK: diálogo fecha; toast **Planejamento removido.**; linha some; **três cartões** recalculam.  
- [ ] Categoria volta ao select **Novo Orçamento** para o mesmo mês/ano.

### Erros e concorrência (FR-ORC-ACT-07, FR-ORC-ACT-08, AC-ORC-ACT-04, AC-ORC-ACT-05)

- [ ] Falha API: utilizador vê erro; linha e valores **não** limpam otimisticamente sem sucesso.  
- [ ] Durante pedido: botões do diálogo desabilitados; mitigar duplo submit; durante saving inline na linha, ícones da linha desabilitados.

### Regressão (FR-ORC-ACT-09, AC-ORC-ACT-06)

- [ ] **Novo Orçamento**, **Duplicar mês anterior**, mudança mês/ano e carregamento inicial intactos.

### Acessibilidade (NFR-ORC-ACT-01, UX §7)

- [ ] `aria-label` nos ícones; ordem de tab no diálogo (Cancelar antes do destrutivo); `Esc` fecha quando não está a eliminar.

### Gates (NFR-ORC-ACT-03)

- [ ] `npm run lint`, `npm run typecheck`, `npm test` verdes nos pacotes alterados (`AGENTS.md`).

## Tasks (implementação)

1. [x] Criar `frontend/src/copy/orcamentosRemovePlanning.ts` (ou nome acordado) com strings PRD/UX.  
2. [x] Criar `OrcamentoRemovePlanningConfirmDialog.tsx` (estrutura acessível alinhada a `MeiCatalogoDeleteCatalogConfirmDialog`).  
3. [x] (Opcional) `removeCategoryBudgetPlanning` em `categoryService.ts` como wrapper de `saveCategoryBudget(..., null, date)`.  
4. [x] Alterar `Orcamentos.tsx`: coluna Ações, refs, handlers, estados, integração diálogo, regras `addBudgetOpen` / saving / deleting.  
5. [x] Testes RTL em ficheiro dedicado ou `Orcamentos.test.tsx` — fluxos cancelar / confirmar / payload.  
6. [x] Correr `npm run lint`, `npm run typecheck`, `npm test` no frontend.

## Fora de escopo

- `DELETE /categories/budgets`; remoção física SQL.  
- Menu ⋯ mobile (P2).  
- **FR-ORC-ACT-10** / **AC-ORC-ACT-07** (DRE) — story P1 separada.

## File list (checklist implementação)

- [x] `frontend/src/pages/Orcamentos.tsx`  
- [x] `frontend/src/components/OrcamentoRemovePlanningConfirmDialog.tsx`  
- [x] `frontend/src/copy/orcamentosRemovePlanning.ts`  
- [x] `frontend/src/services/categoryService.ts` (opcional wrapper)  
- [x] `frontend/src/pages/Orcamentos.test.tsx` ou novo `*.test.tsx` para fluxos de remoção

## Definition of Done

- Critérios de aceite verificados (QA manual em `/orcamentos`, aba Por mês).  
- Gates npm verdes.  
- Regressão: fluxos do cabeçalho e tabela existentes sem quebra.

## Qualidade / CodeRabbit

- Não acoplar texto MEI ao domínio Orçamentos.  
- Centralizar *copy* no módulo `copy/` para revisão PO e testes estáveis.  
- Evitar duplicar lógica de `getMonthStartDate` / parse de moeda.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- Coluna **Ações** (Pencil / Trash2, min 44×44), cabeçalho **Ações**; **Editar** faz `focus` + `select()` com `pointer: fine` no input **Planejado**; refs em `Map` por `categorias_id`.
- **Remover planejamento:** `OrcamentoRemovePlanningConfirmDialog` (`z-[60]`, `data-testid="orcamento-remove-planning-confirm"`, botão rose, *A remover…*), copy em `copy/orcamentosRemovePlanning.ts`; confirmação chama `removeCategoryBudgetPlanning` → `POST` com `valor_orcado: null` e `date` do mês.
- Estados: `deleteTarget`, `deletingCategoryId`, `deleteDialogError`; ações da tabela desabilitadas com `addBudgetOpen` ou `deleteTarget` ou saving/deleting na linha; input bloqueado quando diálogo aberto para a linha ou saving/deleting.
- Toasts: sucesso `Planejamento removido.`; erro *Não foi possível remover o planejamento…* (inline no diálogo + toast).
- Testes RTL: cancelar sem API; confirmar com `userId`, `categorias_id`, `date` ISO; ações desabilitadas com modal Novo Orçamento; **seguimento QA:** rejeição `removeCategoryBudgetPlanning` (diálogo aberto, `role="alert"`, `toast.error`, linha); **Editar** com spies em `focus`/`select` e `matchMedia('(pointer: fine)')`; `saveCategoryBudget` pendente desabilita ícones da linha.

### File List (implementação)

- `frontend/src/copy/orcamentosRemovePlanning.ts`
- `frontend/src/components/OrcamentoRemovePlanningConfirmDialog.tsx`
- `frontend/src/services/categoryService.ts`
- `frontend/src/pages/Orcamentos.tsx`
- `frontend/src/pages/Orcamentos.test.tsx`

### Debug Log References

- `cd frontend && npx vitest run src/pages/Orcamentos.test.tsx` — 6 testes OK (incl. FR-ORC-ACT-07, -02, -08).
- `npm test` (raiz do repo) — OK.
- `npm run lint`, `npm run typecheck` (raiz) — OK (avisos pré-existentes noutros ficheiros).

### Change Log

- 2026-04-07 — Implementação P0 coluna Ações + diálogo remover planejamento + testes RTL.
- 2026-04-07 — Cobertura RTL adicional alinhada ao feedback QA (erro ao remover, foco/select em Editar, ações desativadas durante save pendente).

---

## QA Results

**Revisor:** Quinn (QA / AIOX)  
**Data:** 2026-04-07  
**Gate:** **CONCERNS** (implementação alinhada ao PRD/UX; cobertura automática incompleta em cenários de erro e foco Editar)

### Evidência executada

| Verificação | Resultado |
|-------------|-----------|
| `vitest run src/pages/Orcamentos.test.tsx` | **PASS** (3 testes) |
| Revisão estática `Orcamentos.tsx`, `OrcamentoRemovePlanningConfirmDialog.tsx`, `orcamentosRemovePlanning.ts`, `categoryService.removeCategoryBudgetPlanning` | **PASS** — rastreio aos FR-ORC-ACT-01…09 |

### Rastreio requisitos → implementação

| ID | Verificação | Estado |
|----|-------------|--------|
| FR-ORC-ACT-01 | Coluna **Ações** após Status; cabeçalho visível; ícones 44×44 | Coberto código + parcialmente testes (presença botões) |
| FR-ORC-ACT-02 | `focusBudgetInput` + `select()` com `pointer: fine` | Coberto código; **sem** teste RTL de foco |
| FR-ORC-ACT-03 | Copy PRD (3 parágrafos + resumo); diálogo `role="dialog"`, `z-[60]` | Coberto código + teste cancelar (heading + “não são apagados”) |
| FR-ORC-ACT-04 | `removeCategoryBudgetPlanning` com `date` `YYYY-MM-DD` | Coberto teste (arg 2); `null` via wrapper (equivalente a POST) |
| FR-ORC-ACT-05/06 | `refreshSummary`, toast sucesso, linha some | Coberto fluxo mock; cartões derivados de `rows` — coerente |
| FR-ORC-ACT-07 | Erro: `deleteDialogError` + `toast.error`; sem otimismo | **Código OK**; **sem** teste RTL de falha |
| FR-ORC-ACT-08 | `isDeleting` desativa diálogo; `actionsLocked` com saving/deleteTarget/addBudget | Coberto código; teste só `addBudgetOpen` |
| FR-ORC-ACT-09 | Regressão cabeçalho/tabela | Não coberto por teste dedicado; risco baixo com diff localizado |
| NFR-ORC-ACT-01 | `aria-label` nos ícones; foco inicial Cancelar; Esc | Coberto código |
| NFR-ORC-ACT-03 | Gates repo (Dev Record refere lint/typecheck/test OK) | Aceite por evidência em Dev Agent Record |

### Pontos fortes

- Separação de *copy* em `copy/orcamentosRemovePlanning.ts` (sem texto MEI).
- Diálogo dedicado espelha padrão acessível do catálogo (`data-testid`, `aria-labelledby`/`describedby`).
- Bloqueio de ações com **Novo Orçamento** aberto evita empilhamento com `z-50` vs `z-[60]`.

### Lacunas / dívida de testes (recomendações)

1. **P1:** Teste RTL — `removeCategoryBudgetPlanning` rejeita → diálogo permanece, `role="alert"` com mensagem, `toast.error`, linha inalterada (**FR-ORC-ACT-07**).  
2. **P2:** Teste RTL — após clicar **Editar**, o input da linha recebe foco (ou mock de `focus`/`select`).  
3. **P2:** Teste RTL — durante `savingBudgetByCategory` (simular `saveCategoryBudget` pendente), ícones da linha `disabled`.

### Decisão

**CONCERNS:** pronto para merge do ponto de vista funcional e de segurança (sem superfície nova no backend); **recomenda-se** smoke manual em `/orcamentos` (remover planejamento, cancelar, erro de rede) e, em sprint seguinte, fechar os testes P1/P2 acima antes de dar a story como **PASS** estrito em gate regressão.

— Quinn, guardião da qualidade
