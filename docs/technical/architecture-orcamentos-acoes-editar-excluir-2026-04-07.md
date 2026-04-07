# Arquitetura técnica — Orçamentos: ações **Editar** e **Excluir** por linha (aba Por mês)

**Versão:** 1.0  
**Data:** 2026-04-07  
**Autoria:** Aria (architect / fluxo AIOX)  
**Requisitos de origem:**

- [`docs/prd/PRD-orcamentos-acoes-editar-excluir-2026-04-07.md`](../prd/PRD-orcamentos-acoes-editar-excluir-2026-04-07.md)  
- [`docs/specs/ux-spec-orcamentos-acoes-editar-excluir-2026-04-07.md`](../specs/ux-spec-orcamentos-acoes-editar-excluir-2026-04-07.md)

**Artefactos relacionados:**

- Irmão na mesma rota: [`architecture-orcamentos-dre-visao-matricial-2026-04-06.md`](architecture-orcamentos-dre-visao-matricial-2026-04-06.md) — paridade de dados **DRE** após alteração no modo mensal (**FR-ORC-ACT-10**).  
- Padrão de diálogo destrutivo: `frontend/src/components/MeiCatalogoDeleteCatalogConfirmDialog.tsx`.

**Implementação brownfield de referência:**

- `frontend/src/pages/Orcamentos.tsx`  
- `frontend/src/services/categoryService.ts` — `saveCategoryBudget`, `fetchCategoryBudgetsSummary`  
- `backend/src/services/categories.service.js` — `upsertCategoryBudget`, `parseValorOrcado`  
- `backend/src/routes/categories.routes.js` — `POST /categories/budgets`

---

## 1. Objetivo e decisão de arquitetura (resumo)

Entregar **ações por linha** na tabela **Orçamento por Categoria** (aba **Por mês**) com **mínima superfície de mudança** no sistema: reutilizar o contrato HTTP e a persistência já existentes para **atualizar** o orçamento mensal com `valor_orcado: null`, e concentrar a complexidade em **estado de UI**, **acessibilidade** e **foco** no cliente React.

**Decisão canónica (MVP):**

| Camada | Decisão |
|--------|---------|
| **Backend** | **Sem alterações obrigatórias.** `POST /categories/budgets` com `valor_orcado: null` + `date` (início do mês) já é suportado por `upsertCategoryBudget` (update da linha em `orçamentos` com `valor_orçado` nulo). |
| **API nova** | **Não** expor `DELETE /categories/budgets` na V1 (PRD §6.3). Reavaliar apenas se política de dados ou relatórios exigirem remoção física da linha. |
| **Frontend** | Estender `Orcamentos.tsx` + **um** componente de confirmação dedicado + módulo de *copy*; **refs** por `categorias_id` para foco no input **Planejado**. |
| **DRE** | **Sem** novo endpoint; paridade garantida por **fonte de dados comum** (matriz DRE lê `orçamentos` com os mesmos valores). Após remoção, **refetch** ao voltar à aba DRE ou invalidação de cache local se existir (ver §6). |

---

## 2. Estado atual (análise técnica)

| Componente | Comportamento relevante |
|------------|------------------------|
| `saveCategoryBudget` | `POST` com `{ categorias_id, valor_orcado, date? }`. `valor_orcado: null` → `parseValorOrcado` → `null` → `UPDATE orçamentos SET valor_orçado = null` na linha do mês. |
| `listCategoryBudgetsSummary` | Para cada categoria, `valor_orcado` vem do mapa de linhas em `orçamentos` (pode ser `null` se a linha existir com nulo). |
| `Orcamentos.tsx` — `rows` | `useMemo` filtra `valor_orcado > 0`; categorias só com planejamento positivo aparecem na tabela. |
| `duplicateMonthlyBudgets` | Origem: `.not('valor_orçado', 'is', null)` — linhas com nulo **não** entram como fonte de duplicação; compatível com “remover planejamento”. |
| `listCategoryBudgetsDreMatrix` | Agrega orçamentos no ano; células com `valor_orcado: null` tratadas como sem plano — paridade com summary mensal. |

**Conclusão:** a semântica de “excluir planejamento” = **persistir nulo** é **consistente** com listagens, DRE e duplicação, **sem** migração SQL.

---

## 3. Visão de sistema (MVP)

```text
┌──────────────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                           │
│  Orcamentos.tsx (aba Por mês)                                     │
│    ├─ Tabela: coluna Ações [Pencil] [Trash2]                     │
│    ├─ refs: budgetInputRefs.get(categorias_id) → HTMLInputElement │
│    ├─ Estados: deleteTarget, deletingId, deleteError             │
│    ├─ OrcamentoRemovePlanningConfirmDialog                        │
│    └─ handleBudgetBlur / refreshSummary (existentes)              │
│         └─ categoryService.saveCategoryBudget(..., null, date)    │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTPS + auth (existente)
┌───────────────────────────────▼──────────────────────────────────┐
│  API Node — categories.routes.js                                  │
│    POST /categories/budgets  [SEM MUDANÇA DE ROTA]                │
│      → upsertCategoryBudget                                       │
└───────────────────────────────┬──────────────────────────────────┘
                                │ Supabase client service role
┌───────────────────────────────▼──────────────────────────────────┐
│  Postgres: tabela orçamentos (user_id, categorias_id, date, …)     │
└──────────────────────────────────────────────────────────────────┘
```

**Aba DRE (mesma página):**

- `DreBudgetPanel` / hooks existentes continuam a consumir `GET /categories/budgets/dre-matrix` (ou fluxo atual).  
- **Não** é necessário alterar o contrato DRE para o MVP; **é** necessário que, após remoção no modo mensal, o utilizador veja dados atualizados ao reabrir ou refocar a DRE (**§6**).

---

## 4. Contrato HTTP (referência — sem alteração)

### 4.1 Pedido de “remover planejamento”

`POST /categories/budgets`

**Corpo JSON (canónico):**

```json
{
  "categorias_id": 42,
  "valor_orcado": null,
  "date": "2026-04-01"
}
```

- **`date`:** primeiro dia do mês visível no seletor, no formato `YYYY-MM-DD` já produzido por `getMonthStartDate()` em `Orcamentos.tsx` (alinhado a **AC-ORC-ACT-01**).  
- **Auth / RLS:** inalterados; mesmo utilizador da sessão.

### 4.2 Resposta

Comportamento atual de `upsertCategoryBudget`: devolve objeto com `categorias_id` e `valor_orcado` (nulo após update). O cliente deve tratar sucesso como **OK** e **refetch** `fetchCategoryBudgetsSummary` para o par `year/month` atual (mesmo padrão que após edição inline).

### 4.3 Evolução futura (não MVP)

`DELETE /categories/budgets?categorias_id=&year=&month=` — apenas se produto exigir remoção física; implica decisão de idempotência (404 vs 204) e possível ajuste em relatórios admin. Documentar em ADR antes de implementar.

---

## 5. Front-end — limites de módulo

| Artefacto | Responsabilidade |
|-----------|------------------|
| `frontend/src/pages/Orcamentos.tsx` | Orquestração: coluna Ações, handlers `onEditRow`, `onRequestRemove`, `onConfirmRemove`, flags `addBudgetOpen` → desabilitar ações; composição do diálogo. |
| `frontend/src/components/OrcamentoRemovePlanningConfirmDialog.tsx` (nome sugerido) | Shell acessível: `role="dialog"`, foco inicial em Cancelar, `Esc`, `isDeleting`, `errorMessage`, `data-testid="orcamento-remove-planning-confirm"`. **Não** acoplar copy MEI. |
| `frontend/src/copy/orcamentosRemovePlanning.ts` (ou `orcamentosPlanning.ts`) | Strings: título, parágrafos, botões, toast sucesso; função `buildOrcamentoRemovePlanningSummaryLine(nome, mesLabel, ano)`. |
| `frontend/src/services/categoryService.ts` | **Opcional:** wrapper `removeCategoryBudgetPlanning(userId, categoriasId, monthStartDate)` que chama `saveCategoryBudget(..., null, date)` — melhora legibilidade e testes; **não** obrigatório se a equipa preferir chamada directa. |

**Refs para foco:**

- Preferência: `useRef<Map<number, HTMLInputElement>>(new Map())` atualizado via `ref={el => { ... map.set(row.id, el) }}` no input Planejado, ou `useCallback` ref por linha.  
- **Editar:** `map.get(id)?.focus()` e, se UX spec, `select()` condicionado a `pointer: fine`.

**Empilhamento de modais (UX spec §8):**

- Modal **Novo Orçamento** e diálogo de remoção **não** devem estar abertos em simultâneo; implementação: `z-50` no overlay existente de novo orçamento e `z-[60]` no diálogo de remoção **ou** unificar ambos em `z-50` e **bloquear** abertura do segundo (`addBudgetOpen` desabilita ações na tabela).

---

## 6. Paridade com a aba DRE e cache

| Cenário | Diretriz arquitetural |
|---------|------------------------|
| Utilizador remove planejamento no **Por mês** e muda para **DRE** | `DreBudgetPanel` deve refazer fetch do ano ao **montar** ou quando `year` / dependência de invalidação mudar. Se o painel DRE mantiver dados em estado sem refetch ao **re**-seleccionar o separador, introduzir **chave** `key={\`${userId}-${year}-budgetGen\`}` incrementada após remoção bem-sucedida **ou** `useEffect` que refetch quando `budgetTab === 'dre'` após evento de mutação — **decisão @dev** com teste **AC-ORC-ACT-07** (P1). |
| Utilizador permanece só no Por mês | `refreshSummary` existente é suficiente. |

**Regra:** nunca assumir que a DRE “vê” alterações sem **invalidação explícita** ou **remount** com dados frescos se o componente DRE fizer cache em memória entre toggles de tab.

---

## 7. Modelo de estado (máquina lógica)

Estados recomendados na página (podem ser derivados / fundidos):

| Estado | Efeito |
|--------|--------|
| `deleteTarget: { categoriasId, nomeCategoria } \| null` | Controla visibilidade do diálogo e conteúdo dinâmico. |
| `deletingCategoryId: number \| null` | Durante `saveCategoryBudget`; desabilita diálogo e, na linha correspondente, input + ações. |
| `deleteDialogError: string \| null` | Erro inline no diálogo (paridade MEI) + opcional `toast.error`. |
| `savingBudgetByCategory` (existente) | Já bloqueia input; **estender** para bloquear **Excluir** e **Editar** na mesma linha. |

**Concorrência:** um único `deleteTarget` por vez; segundo clique **Excluir** noutra linha só após fechar o diálogo anterior (ou substituir alvo — **não** recomendado; preferir ignorar cliques com diálogo aberto).

---

## 8. Segurança e autorização

- **Sem mudança:** mesmo `requireAuth` e validação de `user_id` no serviço (service role + filtros por utilizador nas queries).  
- **Não** aceitar `categorias_id` de categorias que o utilizador não pode usar: `ensureUserCategory` já invocado em `upsertCategoryBudget`.  
- **Rate limiting:** herdado da API global; feature não exige endpoint novo.

---

## 9. Observabilidade e erros

- **Logs:** manter `console.error` existente em falhas de orçamento; opcional correlacionar com `categorias_id` em modo *dev* apenas.  
- **Toast:** sucesso `Planejamento removido.`; erro mensagem genérica + não mutar estado local de `summary` / `budgetsByCategory` até resposta OK (**AC-ORC-ACT-04**).

---

## 10. Testes (estratégia)

| Nível | Âmbito |
|-------|--------|
| **RTL** | `Orcamentos` (ou extrair sub-componente testável): abrir diálogo → Cancelar não chama API; confirmar chama `saveCategoryBudget` com `null` e `date` esperado; mock `categoryService`. |
| **Integração manual** | Duas linhas na tabela — Editar foca o input certo; exclusão atualiza cartões. |
| **Backend** | **Não** obrigatório novo teste de rota se o payload `null` já estiver coberto; caso contrário um teste unitário em `upsertCategoryBudget` com `valor_orcado: null` (se ainda não existir). |
| **P1** | Cenário DRE após remoção (**AC-ORC-ACT-07**). |

---

## 11. NFRs (mapeamento)

| ID PRD | Tratamento técnico |
|--------|-------------------|
| NFR-ORC-ACT-01 | Componente de diálogo segue checklist UX (§7 da spec); foco e `aria-*`. |
| NFR-ORC-ACT-02 | Um POST + um GET summary por operação de exclusão; sem refetch anual desnecessário. |
| NFR-ORC-ACT-03 | Gates `npm run lint`, `typecheck`, `test` nos pacotes tocados. |
| NFR-ORC-ACT-04 | Sem exposição cross-user; contrato inalterado. |

---

## 12. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| DRE “stale” ao trocar de tab | §6 — invalidação ou `key` de remount. |
| Duplo submit na exclusão | `deletingCategoryId` + botões `disabled` no diálogo. |
| Foco perdido após fechar diálogo | `useRef` no botão que abriu; restaurar em `onCancel` / após sucesso (opcional `focus()` no Excluir da linha removida — linha desaparece; focar **primeira** linha da tabela ou cabeçalho — UX spec §6.2). |

---

## 13. File list indicativo (story)

| Ficheiro | Acção |
|----------|--------|
| `frontend/src/pages/Orcamentos.tsx` | Alterar |
| `frontend/src/components/OrcamentoRemovePlanningConfirmDialog.tsx` | Criar |
| `frontend/src/copy/orcamentosRemovePlanning.ts` (ou nome acordado) | Criar |
| `frontend/src/services/categoryService.ts` | Opcional (wrapper) |
| `frontend/src/pages/Orcamentos.test.tsx` ou ficheiro de teste novo | Criar / alterar |
| `backend/**` | **Nenhum** no MVP |

---

## 14. Histórico de versões

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-04-07 | Versão inicial; MVP sem backend novo; paridade DRE §6. |

---

*Documento redigido por Aria (architect). Implementação: @dev; schema SQL dedicado não necessário neste MVP — @data-engineer apenas se futuro `DELETE` físico exigir políticas RLS adicionais.*
