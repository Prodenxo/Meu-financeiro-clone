# Arquitetura técnica — Orçamentos: **DRE — comparação multi-mês**

**Versão:** 1.0  
**Data:** 2026-04-06  
**Autoria:** Aria (architect / fluxo AIOX)  
**Requisitos de origem:**  
- `docs/prd/PRD-orcamentos-dre-comparacao-multiplos-meses-2026-04-06.md`  
- `docs/specs/ux-spec-orcamentos-dre-comparacao-multiplos-meses-2026-04-06.md`

**Documento base (matriz anual — não substituído):**  
`docs/technical/architecture-orcamentos-dre-visao-matricial-2026-04-06.md`

**Implementação brownfield de referência:**

- `frontend/src/components/orcamentos/DreBudgetPanel.tsx`  
- `frontend/src/components/orcamentos/DrePeriodSidebar.tsx`  
- `frontend/src/components/orcamentos/DreMatrixTable.tsx`  
- `frontend/src/utils/dreMatrix.ts`, `frontend/src/utils/dreMatrix.test.ts`  
- `frontend/src/hooks/useDreMatrix.ts`, `frontend/src/services/categoryService.ts`  
- Backend: **sem alteração obrigatória no MVP** (PRD §5 — reutilizar `GET /categories/budgets/dre-matrix`)

---

## 1. Objetivo e decisão de arquitetura (resumo)

Permitir **seleção de 1–K meses** (K depende do viewport) ou **Total anual**, com **exclusividade** entre modo anual e conjunto de meses, **sem novos pedidos HTTP** por mês adicional (**NFR-DRE-MUL-01**): toda a comparação deriva de `DreMatrixCell[]` já carregado para o ano.

**Decisões canónicas:**

| Tema | Decisão |
|------|---------|
| **API** | Nenhum endpoint novo; mesmo contrato `dre-matrix` (§4 do doc matricial). |
| **Domínio / métricas** | Reutilizar `aggregateCategoryPeriod`, `buildRow`, `buildDreMatrixViewModel` com `DrePeriod = { kind: 'month', month: m }` **por coluna**. |
| **View model comparação** | **N instâncias** de `DreMatrixViewModel` (uma por mês), mesma ordem de categorias; a tabela “larga” faz *zip* por `categorias_id`. |
| **Estado UI** | União discriminada **`annual` \| `months[]`** normalizado (únicos, ordenados); **não** estender `DrePeriod` de forma ambígua no mesmo campo. |
| **K dinâmico** | `matchMedia('(min-width: 1024px)')` no painel; **truncagem** ao descer de `lg` conforme UX spec §4.5. |

---

## 2. Estado actual (delta face à matriz)

| Componente | Hoje | Depois |
|------------|------|--------|
| `DrePeriodSidebar` | Seleção **única**: um `DrePeriod` (mês ou anual) + `aria-current`. | **Toggles** por mês + botão anual; `aria-pressed` nos meses; anual `disabled` se ≥2 meses; teclado UX spec §5.1. |
| `DreBudgetPanel` | `useState<DrePeriod>({ kind: 'month', month })`. | Estado **`DreUiSelection`** + `maxMonths` derivado do viewport + efeito de truncagem. |
| `DreMatrixTable` | Um `DreMatrixViewModel`, 5 colunas. | **Ramo** `variant === 'single'`: layout actual; **`compare`**: `DreMatrixViewModel[]` + `months[]` → thead 2 linhas, `colSpan` 1+4N. |
| `dreMatrix.ts` | `buildDreMatrixViewModel(..., period)`. | Funções auxiliares opcionais: `normalizeSelectedMonths`, `trimMonthsToMax`; **opcional** `buildDreCompareViewModels` (wrapper de N× `buildDreMatrixViewModel`). |

---

## 3. Visão de sistema (componentes)

```text
┌────────────────────────────────────────────────────────────────────┐
│ Browser (React SPA) — tab DRE em Orcamentos.tsx                     │
│                                                                     │
│  DreBudgetPanel                                                     │
│    ├─ useDreMatrix(year)  ──► GET /categories/budgets/dre-matrix   │
│    │                              (inalterado — 1× por ano)         │
│    ├─ useDreMaxMonths()   ──► matchMedia 1024px → K = 4 | 2         │
│    ├─ dreSelection state  ──► { annual } | { months: number[] }     │
│    ├─ onResize / effect   ──► truncar months → primeiros 2 (UX)     │
│    ├─ DrePeriodSidebar    ──► toggles + Total anual                 │
│    └─ DreMatrixTable      ──► single | compare (N view models)      │
│                                                                     │
│  dreMatrix.ts (puro)                                                │
│    ├─ buildDreMatrixViewModel(period)  — mês único ou anual         │
│    └─ compare: map months → N × buildDreMatrixViewModel({month:m})  │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    (sem mudança de rotas backend no MVP)
```

---

## 4. Camada de dados e backend

- **Nenhuma** alteração obrigatória em `categories.routes.js` / `categories.service.js` para esta feature.  
- A matriz anual continua a ser a **fonte de verdade**; cada coluna de comparação é um “slice” lógico `DrePeriod = { kind: 'month', month }`.  
- **Paridade:** para o mês *m*, os números da coluna *m* em modo comparação devem coincidir com `buildDreMatrixViewModel` em modo **só esse mês* (**AC-DRE-MUL-01**).

---

## 5. Modelo de estado frontend (`DreUiSelection`)

### 5.1 Tipo canónico (sugestão TypeScript)

```typescript
/** Seleção de período na UI DRE — exclusividade anual vs meses (PRD §5). */
export type DreUiSelection =
  | { mode: 'annual' }
  | { mode: 'months'; months: number[] }; // 1–12, únicos, ordenados crescente, length ∈ [1, K]
```

**Invariantes:**

1. `mode === 'months'` ⇒ `months.length >= 1`.  
2. `months` sempre **ordenados** e **sem duplicados**.  
3. Nunca `annual` com lista de meses “activa” na sidebar (meses com `aria-pressed` falso e anual com `aria-pressed` true — UX spec §6.1).  
4. `months.length <= K` onde `K = isLg ? 4 : 2`.

### 5.2 Normalização

Função pura recomendada em `dreMatrix.ts` ou `dreSelection.ts`:

- Entrada: lista de toggles brutos + `maxK`.  
- Saída: array ordenado, truncado a `maxK`, filtrado 1..12.  
- Usada após cada `toggleMonth` e após **resize** (truncagem para os **dois primeiros** na ordem cronológica quando se passa a `< lg` com >2 meses — UX §4.5).

### 5.3 Mapeamento para `DrePeriod` (cálculo)

| `DreUiSelection` | Uso em `buildDreMatrixViewModel` |
|------------------|----------------------------------|
| `{ mode: 'annual' }` | Um período `{ kind: 'annual' }` → **um** view model → ramo **single** da tabela. |
| `{ mode: 'months', months: [m] }` | Um período `{ kind: 'month', month: m }` → **um** view model → ramo **single** (regressão visual **FR-DRE-MUL-02**). |
| `{ mode: 'months', months: [m1, m2, …] }` | **N** períodos mês → **N** view models → ramo **compare** da tabela. |

---

## 6. View model e domínio (`dreMatrix.ts`)

### 6.1 Estratégia: N × `DreMatrixViewModel`

Para `months = [m1, …, mN]`:

```text
const models = months.map((month) =>
  buildDreMatrixViewModel(categories, cells, year, { kind: 'month', month }, MESES)
);
```

**Propriedades:**

- **Ordem das linhas:** cada `buildDreMatrixViewModel` ordena receitas/despesas por `nome` (pt-BR) — com as **mesmas** `categories` e mesmas regras de elegibilidade, a ordem é **idêntica** entre meses.  
- **Subtotais e resultado** já correctos **por mês** dentro de cada model.  
- **Sem duplicar** fórmulas de atingimento, % receita ou `rowHighlights` (**NFR-DRE-MUL-04**).

### 6.2 Alinhamento de linhas na tabela compare

A tabela deve iterar categorias pela **ordem canónica** (ex.: primeira coluna = `models[0].receitas.rows` e `models[0].despesas.rows`). Para cada `categorias_id`, nas outras colunas, localizar a linha com o mesmo id (Map por id) **ou** confiar na mesma ordem — **recomendação:** teste unitário que verifica ordem igual entre dois meses com o mesmo conjunto de categorias elegíveis.

**Categorias só presentes nalguns meses:** a elegibilidade é **anual** (`isCategoryEligibleInYear`); se uma categoria aparece no ano, aparece em **todos** os meses da grelha (células possivelmente zero) — comportamento já coerente com `aggregateCategoryPeriod` em meses sem movimento.

### 6.3 Funções puras adicionais (opcional mas útil)

| Função | Responsabilidade |
|--------|------------------|
| `normalizeDreMonths(months, maxK)` | únicos, sort, slice(0, maxK). |
| `toggleMonthInSelection(selection, month, maxK)` | lógica de add/remove; se atingir K+1, retorna `selection` inalterado + flag `rejected` para `aria-live`. |
| `selectionFromAnnualToMonth(month)` | `{ mode: 'months', months: [month] }`. |
| `selectionToAnnual()` | `{ mode: 'annual' }`; limpa meses. |

---

## 7. Componentes React

### 7.1 `DreBudgetPanel`

- Estado: `dreSelection: DreUiSelection`.  
- `const maxMonths = useMediaQueryLg() ? 4 : 2` (hook local ou inline `matchMedia` + listener).  
- `useMemo` para `viewModels`:  
  - se `annual` → array `[buildDreMatrixViewModel(..., annual)]` e `variant='single'`;  
  - se `months.length === 1` → um model, `variant='single'`;  
  - se `months.length >= 2` → `months.map(...)` → `variant='compare'`.  
- `useEffect` quando `maxMonths` baixa e `months.length > maxMonths`: substituir `months` por `months.slice(0, maxMonths)` ordenados (primeiros 2 cronológicos se passou a mobile — UX §4.5) + set mensagem `liveRegion`.  
- **Inicialização:** alinhar ao PRD (mês civil no ano corrente) — preservar comportamento actual do `useState` inicial se já satisfizer PO.

### 7.2 `DrePeriodSidebar`

**Nova API (ilustrativa):**

```typescript
type DrePeriodSidebarProps = {
  selection: DreUiSelection;
  maxMonths: number;
  onToggleMonth: (month: number) => void;
  onSelectAnnual: () => void;
  /** quando em anual e utilizador clica num mês */
  onSelectSingleMonthFromAnnual: (month: number) => void;
  liveRegionMessage?: string; // limite K ou truncagem resize
};
```

- Implementar **roving tabindex** + `aria-pressed` em meses; botão anual com `disabled={selection.mode === 'months' && selection.months.length >= 2}` e tooltip (UX §4.4).  
- **Último mês:** se UX fechar com “não desmarcar último”, `onToggleMonth` no painel **no-op** quando `months.length === 1` e o mês seria removido.

### 7.3 `DreMatrixTable`

**Props alargadas:**

```typescript
type DreMatrixTableProps = {
  variant: 'single' | 'compare';
  /** single: usar [0]; compare: N modelos alinhados a months na mesma ordem */
  models: DreMatrixViewModel[];
  months: number[]; // redundante com models.length em compare; útil para headers
  year: number;
  monthLabels: string[];
  tooltips: { atingimento: string; pctReceita: string };
};
```

- **`single`:** `models.length === 1`; renderizar **exactamente** o markup actual (thead 1 linha, `colSpan={5}` nos grupos).  
- **`compare`:** thead 2 linhas (UX spec §5.3); `GroupHeader` com `colSpan={1 + 4 * N}`; linhas de dados com `4 * N` células; linha resultado com valor `models[i].resultadoRealizado` na coluna **Realizado** de cada bloco.  
- **Sticky:** manter `sticky left-0` na primeira coluna; `z-index` coerente em **duas** linhas de thead.

### 7.4 Hook `useMediaQueryMinLg`

- Um ficheiro pequeno reutilizável (ex.: `frontend/src/hooks/useMediaQueryMinLg.ts`) com `matchMedia('(min-width: 1024px)')` e `addEventListener('change')`, SSR-safe (`useState` inicial `false` ou `true` conforme estratégia do projeto — alinhar a `DrePeriodSidebar` existente).

---

## 8. Acessibilidade (implementação)

| Requisito UX | Implementação técnica |
|----------------|------------------------|
| `aria-pressed` nos meses | Prop derivada de `selection.mode === 'months' && selection.months.includes(m)`. |
| Modo anual | `aria-pressed` no botão Total anual quando `selection.mode === 'annual'`; meses todos `false`. |
| Limite K | `role="status"` + `aria-live="polite"` no painel; mensagem ao `rejected === true`. |
| Tabela 2 níveis | `scope="colgroup"` / `scope="col"` / `rowspan` na primeira célula “Categoria” (UX §5.3). |
| `aria-describedby` | Opcional: ligar `table` ao texto “Comparando N meses”. |

---

## 9. Testes

| Nível | Foco |
|-------|------|
| **Unitário (`dreMatrix.test.ts`)** | `normalizeDreMonths`; paridade `buildDreMatrixViewModel(month)` vs índice em `buildDreCompare*`; resultado por mês (**AC-DRE-MUL-04**). |
| **Unitário (hook / painel)** | Truncagem ao mudar `maxMonths` 4→2: entrada `[3,5,7,9]` → saída `[3,5]` + flag mensagem. |
| **Componente (opcional)** | Sidebar: anual `disabled` com 2 meses; toggle não ultrapassa K. |

**Gates:** `npm run lint`, `npm run typecheck`, `npm test` (**AC-DRE-MUL-08**).

---

## 10. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| **Ordem de linhas diverge** entre modelos | Teste de ordem; ou Map por `categorias_id` na renderização compare. |
| **`colSpan` / thead** quebra leitor de ecrã | Validar com NVDA/VoiceOver após implementação; ajustar `id` + `headers` se necessário. |
| **Re-renders** ao arrastar resize | Debounce opcional no listener `matchMedia`; estado de meses só muda ao cruzar breakpoint. |
| **Duplicação de markup** na tabela | Extrair subcomponentes `DreMatrixTheadSingle` / `DreMatrixTheadCompare` e partilhar `DataRows` parametrizado por “fatia” de métricas. |

---

## 11. Não objetivos (MVP)

- Query string `?dreMonths=` (P2).  
- Novo endpoint ou agregação server-side por subconjunto de meses.  
- Comparar anos diferentes.

---

## 12. Rastreabilidade PRD / UX → arquitetura

| ID | Onde |
|----|------|
| FR-DRE-MUL-01–03 | §5, §6.1, §7.2, §7.3 |
| FR-DRE-MUL-04–05 | §6.1 (reuso `buildDreMatrixViewModel`) |
| FR-DRE-MUL-06 | §5.1, §7.2 |
| FR-DRE-MUL-07 | §5.2, §7.1, §8 |
| FR-DRE-MUL-08 | §6.1 `rowHighlights` por coluna |
| NFR-DRE-MUL-01 | §1, §4 |
| NFR-DRE-MUL-02–03 | §7.1, §7.3 |
| NFR-DRE-MUL-04 | §6.1 |
| AC-DRE-MUL-01–02 | §6.1, §7.3 `variant single` |

---

## 13. Plano de entrega sugerido (fases)

| Fase | Conteúdo |
|------|----------|
| **1** | Tipos `DreUiSelection`, `normalizeDreMonths`, testes; hook `useMediaQueryMinLg` + truncagem. |
| **2** | `DrePeriodSidebar` novo contrato + integração no painel. |
| **3** | `DreMatrixTable` ramo compare + thead 2 níveis + resultado multi-coluna. |
| **4** | Testes de integração leves + revisão a11y (checklist UX §8). |

---

## 14. Histórico de versões

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-06 | Aria | Versão inicial a partir do PRD e UX spec multi-mês |

---

*Documento técnico para @dev e @sm (story + file list). Compatível com `architecture-orcamentos-dre-visao-matricial-2026-04-06.md` (mesma API `dre-matrix`).*
