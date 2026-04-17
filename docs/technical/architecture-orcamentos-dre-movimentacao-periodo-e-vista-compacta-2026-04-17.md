# Arquitetura técnica — Orçamentos: **DRE — elegibilidade por período** e **densidade da tabela (Simples / Completo)**

**Versão:** 1.0  
**Data:** 2026-04-17  
**Autoria:** Aria (architect / fluxo AIOX)  
**Requisitos de origem:**  
- `docs/prd/PRD-orcamentos-dre-movimentacao-periodo-e-vista-compacta-2026-04-17.md`  
- `docs/specs/ux-spec-orcamentos-dre-movimentacao-periodo-e-vista-compacta-2026-04-17.md`

**Documentos base (não substituídos):**  
- `docs/technical/architecture-orcamentos-dre-visao-matricial-2026-04-06.md` (se existir no repositório; caso contrário PRD matricial)  
- `docs/technical/architecture-orcamentos-dre-comparacao-multiplos-meses-2026-04-06.md` — comparação multi-mês, `DreUiSelection`, `N` view models.

**Implementação brownfield de referência:**

- `frontend/src/components/orcamentos/DreBudgetPanel.tsx`  
- `frontend/src/components/orcamentos/DrePeriodSidebar.tsx`  
- `frontend/src/components/orcamentos/DreMatrixTable.tsx` (`variant: 'single' | 'compare'`, `emptyRow`, *zip* por `categorias_id`)  
- `frontend/src/utils/dreMatrix.ts`, `frontend/src/utils/dreMatrix.test.ts`  
- `frontend/src/hooks/useDreMatrix.ts`, `frontend/src/services/categoryService.ts`  
- Backend: **`GET /categories/budgets/dre-matrix`** — **sem alteração obrigatória** no MVP (PRD §5.3).

---

## 1. Objetivo e decisão de arquitetura (resumo)

| Tema | Decisão |
|------|---------|
| **API** | Reutilizar **`DreMatrixCell[]`** do ano (`listCategoryBudgetsDreMatrix`); **nenhum** endpoint novo. |
| **Elegibilidade** | Substituir o critério **anual** (`isCategoryEligibleInYear`) por **`isCategoryEligibleInPeriod`** alinhado ao **PRD §5.1** (opção B: `planejado > 0` **ou** `realizado ≠ 0` **no período**). |
| **Compare** | Conjunto de **`categorias_id`** = **união** das elegíveis em **cada** mês seleccionado; cada `DreMatrixViewModel` usa o **mesmo conjunto ordenado** de categorias; valores por mês vêm de `aggregateCategoryPeriod` (zeros naturais quando não há actividade). |
| **Densidade** | Estado **`DreTableDensity = 'simples' \| 'completo'`** persistido em **`localStorage`**, lido no cliente; **não** altera dados nem *fetch*. |
| **Apresentação** | `DreMatrixTable` recebe `density` e ajusta **colunas**, **`colSpan`** e ramos de célula (Atingimento / % Receita **omitidos** em Simples). |

---

## 2. Estado actual vs alvo

| Camada | Hoje | Alvo |
|--------|------|------|
| **`dreMatrix.ts`** | `buildDreMatrixViewModel` filtra com `isCategoryEligibleInYear` (qualquer mês do ano). | Filtrar com **`isCategoryEligibleInPeriod`** para `DrePeriod` **mês** ou **anual**; expor **`buildDreMatrixViewModel`** com **`categoryIdsAllowlist?: Set<number>`** (ou equivalente) para modo **compare** com **união** de IDs. |
| **`DreBudgetPanel`** | Sem estado de densidade. | `useDreTableDensity()` + barra de segmento (spec UX §4.1); passar `density` a `DreMatrixTable`. |
| **`DreMatrixTable`** | 5 colunas de dados (ou `1+4N` em compare); sempre Atingimento + % Receita. | Prop **`density`**; **3** ou **5** colunas (*single*); **`1+2N`** ou **`1+4N`** (*compare*); subtotais / resultado alinhados à tabela §6.1 da spec UX. |
| **Backend** | Células só quando há orçamento ou movimento naquele `(categoria, mês)`. | Inalterado; gaps de *match* nome/classificação continuam fora deste *scope* (PRD riscos). |

---

## 3. Domínio: elegibilidade por período

### 3.1 Função canónica

```ts
/** PRD §5.1 opção B — período = mês único ou agregado anual (12 meses). */
export function isCategoryEligibleInPeriod(
  categoriasId: number,
  tipo: string,
  period: DrePeriod,
  cells: DreMatrixCell[]
): boolean
```

**Lógica:**

- Obter `{ planejado, realizado } = aggregateCategoryPeriod(categoriasId, tipo, period, cells)`.  
- Retornar **`realizado !== 0` OU `planejado > 0`** (comparar `planejado` como número; tolerância zero — igual ao resto de `dreMatrix`).

**Substituição:** `isCategoryEligibleInYear` deixa de ser usada **dentro** de `buildDreMatrixViewModel` para decidir inclusão (pode permanecer exportada por compatibilidade de testes até refactor, ou ser marcada *deprecated*).

### 3.2 Modo mês único e total anual

- **`period.kind === 'month'`:** elegibilidade avaliada **só** nesse mês.  
- **`period.kind === 'annual'`:** `aggregateCategoryPeriod` já soma 12 meses; mesma regra sobre o agregado.

### 3.3 Modo comparação (vários meses)

**Passo 1 — união de IDs:**

```text
unionIds = ⋃_{m ∈ monthsSelected} { id : isCategoryEligibleInPeriod(id, tipo, { kind: 'month', month: m }, cells) }
```

Avaliado separadamente para categorias **entrada** e **saída**; o conjunto final de linhas é a união respeitando o *split* Receitas/Despesas (como hoje).

**Passo 2 — view models por coluna:**

Para cada `m` em `monthsSelected` (ordenado):

```text
vm[m] = buildDreMatrixViewModel(categories, cells, year, { kind: 'month', month: m }, monthNames, { categoryIdsAllowlist: unionIds })
```

Onde **`categoryIdsAllowlist`** restringe a lista de categorias **antes** do mapeamento para linhas; **não** volta a aplicar `isCategoryEligibleInPeriod` por linha para excluir — assim uma categoria na união aparece em **todas** as colunas, com **planejado/realizado = 0** no mês sem actividade (via `aggregateCategoryPeriod`).

**Ordem das linhas:** manter **`localeCompare` pt-BR** por `nome` dentro de Receitas/Despesas, **igual** ao comportamento actual, sobre o conjunto **filtrado** por `unionIds`.

**Subtotais e resultado:** recalculados **por** `vm[m]` (já consistentes se todas as linhas forem a mesma lista de IDs).

### 3.4 Paridade com `DreMatrixTable` existente

O ficheiro já define `emptyRow` e lógica de *zip* por `categorias_id` entre *models* no compare. Com **allowlist comum**, todas as `models` devem ter **o mesmo conjunto de `DreRowViewModel`** (mesmos IDs e nomes); se algum *build* antigo gerava linhas só para um subconjunto, o *zip* preenchia com `emptyRow`. **Alvo:** cada `buildDreMatrixViewModel` com o **mesmo** allowlist produz **as mesmas** linhas sem precisar de `emptyRow` por *missing* — opcionalmente `emptyRow` mantém-se como rede de segurança (**defensive**) se `categorias_id` divergir.

---

## 4. API de `buildDreMatrixViewModel` (assinatura alvo)

```ts
export type BuildDreMatrixOptions = {
  /** Se definido, só estas categorias (já filtradas por tipo entrada/saída) entram nas linhas. */
  categoryIdsAllowlist?: Set<number>;
};

export function buildDreMatrixViewModel(
  categories: Category[],
  cells: DreMatrixCell[],
  year: number,
  period: DrePeriod,
  monthNames: string[],
  options?: BuildDreMatrixOptions
): DreMatrixViewModel
```

- **Sem** `categoryIdsAllowlist`: usar **`isCategoryEligibleInPeriod`** por categoria (comportamento mês único / anual).  
- **Com** `categoryIdsAllowlist`: `categories.filter(c => allowlist.has(c.id) && (entrada|saída))` — **sem** segundo filtro de elegibilidade por período (a união já foi calculada em `DreBudgetPanel` ou helper dedicado).

**Helper opcional** (painel):

```ts
export function unionEligibleCategoryIds(
  categories: Category[],
  cells: DreMatrixCell[],
  months: number[]
): Set<number>
```

Itera `months`, agrega IDs com `isCategoryEligibleInPeriod(..., { kind: 'month', month: m }, ...)`.

---

## 5. Densidade da tabela (`Simples` / `Completo`)

### 5.1 Tipo e persistência

```ts
export type DreTableDensity = 'simples' | 'completo';

const STORAGE_KEY = 'meu-financeiro:dre-table-density';
```

| Decisão | Detalhe |
|---------|---------|
| **Armazenamento** | `window.localStorage` (SPA Vite; sem SSR obrigatório). |
| **Chave** | `meu-financeiro:dre-table-density` (spec UX §3.2). |
| **Escopo** | **Dispositivo** (não multi-conta). Se no futuro existir `userId` estável no cliente, pode evoluir para chave composta — **fora do MVP**. |
| **Defeito** | `'simples'` quando chave ausente ou valor inválido. |

### 5.2 Hook recomendado

```text
useDreTableDensity(): { density: DreTableDensity; setDensity: (d: DreTableDensity) => void }
```

- Na **montagem**, `read localStorage` → validar enum → estado React.  
- **`setDensity`:** atualiza estado + `localStorage`.  
- **Hidratação:** evitar *flash* incorrecto em testes — inicializar estado com `'simples'` e `useEffect` para ler storage (padrão comum em SPAs).

### 5.3 Props e *layout*

| Componente | Nova prop |
|------------|-----------|
| `DreBudgetPanel` | Usa `useDreTableDensity`; renderiza **segmented control** (spec UX); passa `density` a `DreMatrixTable`. |
| `DreMatrixTable` | `density: DreTableDensity` |

**Cálculo derivado:**

```ts
const metricColumnCount = density === 'simples' ? 2 : 4;
// single: colSpan group = 1 + metricColumnCount
// compare: colspan header month block = metricColumnCount; total data cols = metricColumnCount * N
```

**Tooltips:** props `tooltips.atingimento` / `pctReceita` só aplicam-se a células **renderizadas** (modo Completo).

---

## 6. Diagrama de fluxo de dados

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ DreBudgetPanel                                                               │
│  ├─ useDreMatrix(year) ──► GET /categories/budgets/dre-matrix (1× ano)      │
│  ├─ useDreTableDensity() ──► localStorage ('simples' | 'completo')            │
│  ├─ dreSelection (annual | months[]) ──► inalterado (doc multi-mês)         │
│  ├─ useMemo view models:                                                     │
│  │    • annual → buildDreMatrixViewModel(..., { kind:'annual' })              │
│  │    • single month → buildDreMatrixViewModel(..., { kind:'month', m })     │
│  │    • compare → unionIds = unionEligibleCategoryIds(months)                │
│  │                 map m → buildDreMatrixViewModel(..., month m, { allowlist })│
│  ├─ DrePeriodSidebar                                                         │
│  └─ DreMatrixTable(models, density, ...)                                     │
└─────────────────────────────────────────────────────────────────────────────┘

dreMatrix.ts (puro)
  ├─ isCategoryEligibleInPeriod
  ├─ unionEligibleCategoryIds (opcional)
  └─ buildDreMatrixViewModel(..., options?)
```

---

## 7. Backend e contrato HTTP

- **`listCategoryBudgetsDreMatrix`:** inalterado; já omite células “vazias” sem orçamento nem movimento — coerente com agregações **0** quando o frontend precisa de linha na união: a categoria **ainda** precisa de célula **ou** o cliente trata *missing* como 0 via `getPlanejadoCell` / `getRealizadoCell` (**já** o caso em `aggregateCategoryPeriod`).  
- Se **não** existir `DreMatrixCell` para `(cat, mês)` porque o backend omitiu a linha, `aggregateCategoryPeriod` já devolve **0** — OK para linhas da união.

---

## 8. Testes (alvo)

| Área | Ficheiro / tipo |
|------|-----------------|
| Elegibilidade | `dreMatrix.test.ts` — casos mês com actividade só noutro mês (não aparece); mês com só orçamento ou só movimento (aparece); anual; união de dois meses. |
| Build com allowlist | Dois meses A/B; categoria só em A — linha presente em ambos os *models*; coluna B com zeros. |
| Densidade | Teste de componente ou RTL mínimo: *snapshot* de número de `<th>` / colunas em Simples vs Completo (opcional na story). |

---

## 9. Riscos e mitigações técnicas

| Risco | Mitigação |
|-------|-----------|
| **Regressão compare** | Manter testes existentes de `DreMatrixTable` / `dreMatrix`; acrescentar casos **union + allowlist**. |
| **Duplicação de filtros** | Uma única fonte de verdade: `isCategoryEligibleInPeriod` + `unionEligibleCategoryIds`; não reintroduzir `isCategoryEligibleInYear` no *build* sem `deprecated` explícito. |
| **Performance** | União = `O(|months| × |categories|)` com *sets* pequenos — negligenciável face ao *render* da tabela. |

---

## 10. Entregáveis e dependências

| Entregável | Responsável |
|------------|-------------|
| Alterações `dreMatrix.ts` + testes | **@dev** |
| `useDreTableDensity` + UI segmento + *wiring* `DreBudgetPanel` / `DreMatrixTable` | **@dev** |
| Story em `docs/stories/` com File List e ACs do PRD | **@sm** |

**Dependências:** PRD e spec UX citados; arquitectura multi-mês para `DreUiSelection` e `compare`.

---

## 11. Histórico de versões

| Data | Versão | Descrição |
|------|--------|-----------|
| 2026-04-17 | 1.0 | Versão inicial — elegibilidade por período, allowlist compare, densidade + localStorage |

---

*Documento técnico para implementação brownfield sem novo contrato HTTP; alinhado a **FR-DRE-PER-***, **FR-DRE-CMP-*** e **NFR-DRE-PER-01** do PRD.*
