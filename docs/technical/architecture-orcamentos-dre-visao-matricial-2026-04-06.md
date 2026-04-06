# Arquitetura técnica — Orçamentos: **DRE / matriz anual**

**Versão:** 1.0  
**Data:** 2026-04-06  
**Autoria:** Aria (architect / fluxo AIOX)  
**Requisitos de origem:**  
- `docs/prd/PRD-orcamentos-dre-visao-matricial-2026-04-06.md`  
- `docs/specs/ux-spec-orcamentos-dre-visao-matricial-2026-04-06.md`

**Implementação brownfield de referência:**

- Frontend: `frontend/src/pages/Orcamentos.tsx`, `frontend/src/services/categoryService.ts`  
- Backend: `backend/src/routes/categories.routes.js`, `backend/src/controllers/categories.controller.js`, `backend/src/services/categories.service.js`

---

## 1. Objetivo e decisão de arquitetura (resumo)

Garantir que o modo **DRE** em `/orcamentos` obtenha, para um **ano** e um **utilizador**, os valores **planejado / realizado (gasto ou recebido)** por **categoria × mês**, com **uma experiência de carregamento previsível** e **sem 12 idas sequenciais** ao servidor (**NFR-DRE-01**, PRD §5).

**Decisão recomendada (MVP):** expor um **novo endpoint HTTP** agregador no backend que devolve a matriz (ou formato equivalente normalizado) em **uma resposta**, reutilizando a **mesma semântica** que `listCategoryBudgetsSummary` (normalização de nome de categoria, regras de `lancamentos_id`, `status` em entradas).

**Alternativa aceitável só para spike / protótipo interno:** `Promise.all` com **12 pedidos paralelos** a `GET /categories/budgets/summary?year=&month=` — reduz latência percebida vs sequencial, mas **multiplica carga** no servidor e no Supabase; tratar como **dívida técnica** e não como solução final.

---

## 2. Estado atual (análise)

| Artefacto | Comportamento relevante |
|-----------|-------------------------|
| `GET /categories/budgets/summary` | Devolve **todas** as categorias com `valor_orcado`, `valor_gasto`, `valor_recebido` para **um** mês (`year` + `month`). Agrega transações do intervalo do mês; entradas com `status === 'recebido'`. |
| `GET /categories/budgets/yearly` | Devolve linhas `(categorias_id, valor_orcado, month)` **apenas** de `orçamentos` — **sem** gasto/recebido por mês. **Insuficiente** sozinho para a DRE. |

**Conclusão:** a UI DRE precisa, por categoria e mês, dos mesmos três números que o summary já calcula. A lacuna é **escala temporal** (12 meses + total anual derivado no cliente) com **custo de rede e de query** controlado.

---

## 3. Visão de sistema (componentes)

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                       │
│  Orcamentos.tsx                                                   │
│    ├─ Tab "Por mês" → fluxo existente (sem alterar contratos)   │
│    └─ Tab "DRE"     → DrePanel                                   │
│                         ├─ DrePeriodSidebar                      │
│                         ├─ DreMatrixTable                        │
│                         └─ hooks: useDreMatrix(year)              │
│                              └─ categoryService.fetchDreMatrix   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS + JWT (cookie/header)
┌───────────────────────────────▼─────────────────────────────────┐
│              API Node (backend/src)                              │
│  GET /categories/budgets/dre-matrix?year=YYYY   [NOVO]           │
│    → categories.controller.listCategoryBudgetsDreMatrix          │
│    → categories.service.listCategoryBudgetsDreMatrix            │
│         • 1× categorias (user + global) — igual ao summary       │
│         • 1× orçamentos no ano (já existe lógica yearly)         │
│         • 1× saídas no ano (gasto por mês × nome categoria)      │
│         • 1× entradas recebidas no ano (recebido por mês)        │
│         • montagem da matriz em memória (12 buckets × categoria) │
└───────────────────────────────┬─────────────────────────────────┘
                                │ service role (padrão atual)
┌───────────────────────────────▼─────────────────────────────────┐
│                     Supabase (Postgres)                         │
│  orçamentos · lancamentos_id · categorias_id                  │
└─────────────────────────────────────────────────────────────────┘
```

**Frontend — módulos sugeridos (alinhado à UX spec §11):**

| Módulo / ficheiro (sugestão) | Responsabilidade |
|------------------------------|------------------|
| `frontend/src/services/categoryService.ts` | `fetchCategoryBudgetsDreMatrix(userId, year)` + tipos TS |
| `frontend/src/utils/dreMatrix.ts` (ou `lib/`) | Funções puras: elegibilidade de linhas, subtotais, resultado, % receita, atingimento, modo **Total anual** |
| `frontend/src/hooks/useDreMatrix.ts` | Fetch, `loading` / `error`, invalidação ao mudar ano |
| `frontend/src/components/orcamentos/Dre*.tsx` | UI: sidebar, tabela, grupo colapsável, resultado |

**Regra:** toda fórmula documentada no PRD/UX deve poder ser **testada unitariamente** em `dreMatrix.ts` com *fixtures* (NFR-DRE-04).

---

## 4. Contrato de API proposto

### 4.1 Endpoint

`GET /categories/budgets/dre-matrix?year={YYYY}`

- **Auth:** `requireAuth` (igual às rotas atuais de categorias).  
- **Validação:** `year` inteiro; opcionalmente limitar a janela (ex.: ±10 anos do atual) para evitar abuso.  
- **Resposta:** `200` + JSON conforme §4.2.  
- **Erros:** `400` ano inválido; `401` não autenticado; mensagens alinhadas ao padrão existente.

### 4.2 Formato de resposta (canónico sugerido)

Array de células **normalizadas** (fácil de validar e versionar):

```json
[
  {
    "categorias_id": 12,
    "month": 3,
    "valor_orcado": 2000.0,
    "valor_gasto": 1800.0,
    "valor_recebido": 0.0
  }
]
```

**Semântica por mês (`month` 1–12):**

- Para categorias tipo **saída**, o cliente usa `valor_gasto` como **Realizado** e ignora `valor_recebido` (ou espera 0).  
- Para tipo **entrada**, usa `valor_recebido` como **Realizado** e ignora `valor_gasto` (ou espera 0).  
- `valor_orcado` segue a mesma regra que hoje no summary (pode ser `null`).

**Categorias sem linha em `orçamentos` para um mês:** omitir entrada **ou** incluir com `valor_orcado: null` e realizados 0 — **recomendação:** incluir sempre todas as combinações **(categoria elegível × mês)** apenas se necessário para simplificar UI; caso contrário omitir células vazias e deixar o cliente tratar como 0. **Preferência arquitetural:** devolver **só pares (categoria, mês) com dados** (orçado não nulo ou realizado ≠ 0) para reduzir payload; o cliente aplica elegibilidade UX (§3.3 da spec) sobre categorias carregadas via `GET /categories` ou lista embutida.

**Opcional (otimização):** segundo campo `categories: [{ id, nome, tipo }]` na mesma resposta para evitar terceiro pedido — útil se a DRE for a única vista aberta; senão reutilizar `fetchCategories` já existente.

### 4.3 Paridade com o modo mensal

Os valores para `(year, month)` devem ser **bit a bit** consistentes com `GET /categories/budgets/summary?year=&month=` para o mesmo utilizador, salvo *race* de dados concorrentes. Isto é requisito de **confiança** (AC-DRE-01).

**Implementação recomendada:** extrair funções internas em `categories.service.js`, por exemplo:

- `loadAllCategoriesForUser(db, userId)`  
- `aggregateSpentByCategoryAndMonth(transactions, year)`  
- `aggregateReceivedByCategoryAndMonth(transactions, year)`  
- `buildBudgetMapByCategoryAndMonth(budgetRows, year)`  

e usar `listCategoryBudgetsSummary` como *thin wrapper* que chama a lógica de **um** mês, enquanto `listCategoryBudgetsDreMatrix` chama agregações **do ano**. Refactor mínimo na primeira entrega: **duplicação controlada** só se o risco de regressão for alto — preferir extrair após testes de paridade.

---

## 5. Backend — estratégia de dados

### 5.1 Queries Supabase (alto nível)

1. **Categorias** — igual ao `listCategoryBudgetsSummary` (user + `user_id` null).  
2. **Orçamentos** — `from('orçamentos').select(...).eq('user_id').gte('date', startYear).lte('date', endYear)` (já alinhado a `listCategoryBudgetsYearly`).  
3. **Saídas** — `from('lancamentos_id').select('classificacao, valor, data').eq('user_id').in('tipo', ['saida','saída']).gte('data', startYear).lte('data', endYear)`.  
4. **Entradas recebidas** — mesma janela, `tipo === 'entrada'`, `status === 'recebido'`.

**Agregação:** em Node, percorrer transações uma vez, derivar `month = new Date(data).getMonth() + 1`, acumular em `Map` com chave `(normalizeCategoryName(classificacao), month)` e depois mapear `categoria.id` via `normalizeCategoryName(categoria.nome)` — **mesma função** `normalizeCategoryName` que o serviço já usa.

### 5.2 Complexidade e índices

- Volume típico finanças pessoais: agregação em memória é aceitável.  
- Se o tempo de query crescer, **@data-engineer** pode avaliar índices compostos em `lancamentos_id (user_id, data)` e filtros por `tipo` — fora do MVP se métricas não exigirem.

### 5.3 Segurança

- Manter **isolamento por `user_id`** em todas as queries (como hoje).  
- O cliente usa `apiClient` autenticado; **não** expor dados de outros utilizadores.  
- Admin: rotas em `admin.routes.js` podem reutilizar o **mesmo serviço** com `userId` do path numa story futura — **fora do escopo** do PRD DRE MVP.

---

## 6. Frontend — estado e fluxo

### 6.1 Estado local (modo DRE)

- `selectedYear` — **sincronizar** com o modo mensal quando o utilizador alterna tabs (UX spec).  
- `selectedPeriod` — `0–11` para Janeiro–Dezembro **ou** literal `'annual'` para Total anual.  
- `collapsedGroups` — `Set<'receitas' | 'despesas'>` ou booleanos persistidos só em sessão (sem localStorage no MVP, salvo PO pedir).

### 6.2 Carregamento

- Ao entrar na tab DRE: se dados do ano ainda não existem em memória, chamar `fetchCategoryBudgetsDreMatrix`.  
- **Loading:** `LoadingOverlay` ou *skeleton* (UX spec §8).  
- **Erro:** `FetchErrorBanner` + *retry*.  
- **Opcional:** React Query / SWR se o projeto já os usar noutras páginas; caso contrário `useState` + `useEffect` é suficiente.

### 6.3 URL (opcional V1)

Query `?view=dre&year=2026&period=3` — `react-router` `useSearchParams`; ao mudar tab/ano/período, atualizar URL de forma **não obrigatória** na primeira entrega.

---

## 7. Lógica de domínio no cliente (`dreMatrix.ts`)

Funções puras sugeridas (assinaturas ilustrativas):

- `buildEligibleCategories(categories, matrixCells): Category[]` — PRD + UX §3.3.  
- `getCell(cells, categoriasId, month): DreCell` — defaults a zeros / null.  
- `computeAttainment(planned, realized, tipo): { display: string; highlight: ... }` — PRD §6.1 + UX §6.2.  
- `computePercentOfRevenue(realizedLine, totalRevenueRealized): string` — PRD §5; `totalRevenueRealized` = soma realizados das categorias entrada no período.  
- `rollupAnnual(cells): Map<categoriasId, AnnualRollup>` — somas para modo Total anual.  
- `subtotalsByGroup(...)` e `resultadoRealizado(receitas, despesas)` — AC-DRE-03/04.

**Testes:** `frontend` — Vitest/Jest conforme repo; casos AC-DRE-05 e AC-DRE-06 como *golden*.

---

## 8. Não objetivos e limites

- **Sem** novo modelo relacional obrigatório para MVP (matriz derivada de tabelas existentes).  
- **Sem** cache server-side ou Edge na V1, salvo necessidade de performance.  
- **Sem** GraphQL; REST alinhado ao backend atual.

---

## 9. Plano de entrega (fases)

| Fase | Conteúdo |
|------|----------|
| **1** | Endpoint `dre-matrix` + testes de integração mínimos (ou testes manuais documentados na story) + paridade spot-check vs summary para 2–3 meses. |
| **2** | `categoryService` + `useDreMatrix` + componentes DRE + tabs em `Orcamentos.tsx`. |
| **3** | Testes unitários `dreMatrix.ts` + teste de componente crítico (ex.: subtotal / resultado). |
| **4** | Refactor extração de helpers no `categories.service.js` se duplicação for > risco aceitável. |

---

## 10. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| **Divergência** summary vs matrix | Testes de paridade; funções compartilhadas no backend. |
| **Payload grande** | Enviar só células não vazias; gzip HTTPS padrão. |
| **Timezone em `data`** | Usar apenas **data civil** (string `YYYY-MM-DD`) como hoje; não alterar sem revisão global. |

---

## 11. Rastreabilidade PRD / UX

| ID | Onde na arquitetura |
|----|---------------------|
| NFR-DRE-01 | §1, §4, §5 |
| NFR-DRE-02 | Layout/CSS — responsabilidade frontend (UX spec); sem alteração API |
| NFR-DRE-04 | §3, §7 |
| FR-DRE-02–06 | §4.2, §7 |
| FR-DRE-08 | §6.2 |

---

## 12. Histórico de versões

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-06 | Aria | Versão inicial após leitura do código `categories.service.js` |

---

*Documento técnico para @dev e @sm (story + file list). Ajustar nome final do path da rota com convenção do backend (kebab-case já usada).*
