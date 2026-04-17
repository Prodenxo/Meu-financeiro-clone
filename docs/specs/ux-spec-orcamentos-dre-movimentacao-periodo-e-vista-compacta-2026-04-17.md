# Especificação de front-end e UX — Orçamentos: **DRE — período (linhas)** e **vista Simples / Completa**

**Versão:** 1.0  
**Data:** 2026-04-17  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** `docs/prd/PRD-orcamentos-dre-movimentacao-periodo-e-vista-compacta-2026-04-17.md`  
**Brief de contexto:** `docs/brief/brief-dre-categorias-movimentacao-mes-e-comparativo-sucinto-2026-04-17.md`  
**Specs base (continuidade):**  
- `docs/specs/ux-spec-orcamentos-dre-visao-matricial-2026-04-06.md` — grelha, grupos, realce, formatação, *empty state*.  
- `docs/specs/ux-spec-orcamentos-dre-comparacao-multiplos-meses-2026-04-06.md` — comparação multi-mês, sidebar, limites K, cabeçalhos em duas linhas.  

**Implementação de referência (brownfield):** `DreBudgetPanel.tsx`, `DrePeriodSidebar.tsx`, `DreMatrixTable.tsx`, `dreMatrix.ts` — classes `planner-*`, `LoadingOverlay`, `FetchErrorBanner`, `EmptyState`.

---

## 1. Objetivo deste documento

Contrato de experiência e implementação para:

1. **Elegibilidade de linhas por período** — lista de categorias alinhada ao mês, ao total anual ou à **união** em modo comparação (com células neutras onde não há actividade naquele mês), sem inventar regras fora do PRD §5.1.

2. **Vista Simples vs Completa** — controlo persistente que reduz ou expande o número de colunas numéricas (**Planejado** / **Realizado** vs **+ Atingimento** / **% Receita**), com **acessibilidade**, **regressão visual** e **colSpan** coerentes em todos os modos de período.

Mapeia **FR-DRE-PER-01** a **FR-DRE-PER-04**, **FR-DRE-CMP-01** a **FR-DRE-CMP-04**, **AC-DRE-PER-01** a **AC-DRE-PER-05**, **AC-DRE-CMP-01** a **AC-DRE-CMP-03** e **NFR-DRE-CMP-01**, **NFR-DRE-CMP-02** do PRD.

**Relação com specs anteriores:** onde não for contradito aqui, aplicam-se **formatação monetária**, **tooltips existentes** (`TOOLTIPS` em `DreBudgetPanel`), **grupos colapsáveis**, **realce condicional**, **disclaimer** e **comportamento da sidebar** das specs matricial e multi-mês. Este documento é **delta**: colunas variáveis e implicações de *layout*.

---

## 2. Princípios de experiência

| Princípio | Implicação na UI |
|-----------|------------------|
| **Orçado vs realizado primeiro** | No modo **Simples** (defeito), só **duas** métricas monetárias por bloco; percentagens passam a opcionais via modo **Completo**. |
| **Continuidade cognitiva** | O mesmo *toggle* aplica-se a **mês único**, **total anual** e **comparação multi-mês**; não há modo diferente por período. |
| **Sem surpresas na grelha** | Ao mudar Simples ↔ Completo, **não** alterar ano, meses seleccionados nem dados; apenas colunas visíveis e `colSpan`. |
| **Comparação legível** | Em **compare**, linhas da **união** podem mostrar **0** em meses sem actividade; células mantêm alinhamento numérico `tabular-nums` e hierarquia de cabeçalhos clara (§6). |
| **Acessibilidade** | Estrutura de `<table>` válida para **N** ou **2N** subcolunas de dados por mês; leitor de ecrã anuncia mudança de densidade (**§5.3**). |

---

## 3. Arquitetura de informação

### 3.1 Hierarquia do ecrã (delta)

Inserir **barra de densidade** na área da DRE **antes** da grelha (ou no topo da coluna principal à direita da sidebar), **sem** alterar a ordem global:

```text
Orçamentos [ Por mês | DRE ]
└── DRE
    ├── Disclaimer (existente)
    ├── Barra ano (← select ▶) (existente)
    ├── [NOVO] Barra densidade DRE — §4.1
    ├── Layout: [ DrePeriodSidebar ] [ DreMatrixTable ]
    └── …
```

A **sidebar de períodos** mantém-se à esquerda; o **toggle Simples/Completo** vive no **painel principal** (stack vertical: densidade → título/descrição da tabela → grelha).

### 3.2 Estados de densidade (MVP)

| Estado | Nome na UI (pt-BR) | Colunas de dados por bloco de período* |
|--------|-------------------|----------------------------------------|
| **simples** | **Simples** | Planejado, Realizado |
| **completo** | **Completo** | Planejado, Realizado, Atingimento, % Receita |

\*“Bloco de período” = um mês na comparação, ou o único período em mês único / total anual.

**Persistência (PRD §5.2):** chave sugerida `meu-financeiro:dre-table-density` com valores `'simples' | 'completo'`. Valor por defeito quando a chave **não** existe: **`simples`**. Implementação exacta (**localStorage** vs *scope* por utilizador) — **@architect** / story.

---

## 4. Componentes e colocação

### 4.1 Barra de densidade (“Ferramentas da DRE”)

**Localização:** dentro do `planner-card` que envolve a DRE, **acima** do `flex` que contém `DrePeriodSidebar` + `DreMatrixTable`, **alinhada ao eixo horizontal** da grelha (largura total da card, não só da coluna da tabela), para não competir com os botões de mês na sidebar.

**Layout sugerido:**

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tabela:  [ Simples ●────────○ Completo ]     (opcional: texto de ajuda §4.3) │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Controlo:** par de botões estilo **segmented control** (dois botões adjacentes com cantos partilhados) **ou** *switch* de dois estados com etiqueta visível — preferência **segmented** para corresponder a “dois modos equiparáveis” (não “ligado/desligado” binário ambíguo).

**Estilo (design system):**

- Reutilizar tokens já usados em Orçamentos: fundo `slate` / borda suave, estado activo com **borda ou fundo** distinto (`planner-button` / `planner-button-secondary` ou variante compacta consistente com a barra de ano).
- **Área tocável** mínima **44×44 px** em *touch* (mobile); em `lg`, pode compactar altura se o *padding* global já garantir alvo.

**Copy:**

| Elemento | Texto |
|----------|--------|
| Rótulo do grupo (visível ou `aria-label`) | `Densidade da tabela` ou `Colunas da DRE` |
| Opção activa — Simples | `Simples` |
| Opção activa — Completo | `Completo` |

Evitar “Modo compacto” isolado sem paralelo — o PRD fixa **Simples** / **Completo**.

### 4.2 Texto de ajuda opcional (linha única, `text-xs`)

- **Simples seleccionado:** *“Mostra só planejado e realizado. Active Completo para atingimento e % sobre a receita.”*  
- **Completo seleccionado:** *“Inclui percentagens. Passe a Simples para uma leitura mais rápida.”*

**MVP:** texto **opcional**; se ocupar demasiada altura em mobile, mostrar só **ícone de informação** com `popover`/`title` (decisão na story).

---

## 5. Comportamento e interacção

### 5.1 Mudança de modo

- **Ao clicar** em **Completo:** a grelha **anima-se** opcionalmente com transição mínima (sem obrigatoriedade); colunas novas surgem à direita de **Realizado** (ordem canónica do PRD matricial).  
- **Ao clicar** em **Simples:** colunas **Atingimento** e **% Receita** **ocultam-se**; **não** truncar valores monetários.  
- **Foco:** após troca, foco permanece no botão activo do par (evitar saltos para o corpo da tabela).

### 5.2 Sincronização com dados

- Nenhum *refetch* ao trocar densidade.  
- **Tooltips** (`atingimento`, `pctReceita`) só se aplicam no modo **Completo** (células existentes).

### 5.3 Acessibilidade (**NFR-DRE-CMP-01**)

| Requisito | Implementação |
|-----------|----------------|
| Nome acessível do controlo | `role="group"` + `aria-label="Densidade da tabela DRE"` **ou** `fieldset` + `legend` visível/oculto. |
| Estado | Dois `button type="button"` com `aria-pressed="true"` no seleccionado e `false` no outro **ou** `radiogroup` + duas `radio` estilizadas como segmentos. |
| Anúncio de mudança | `aria-live="polite"` numa região **sr-only** (padrão já usado para limite de meses): mensagem curta, ex.: *“DRE em modo Simples. Duas colunas numéricas por período.”* / *“DRE em modo Completo. Quatro colunas numéricas por período.”* — **disparar só** ao mudar modo (não no primeiro render). |
| Tabela | Em modo Simples, `<th>` apenas para colunas visíveis; **sem** células vazias reservadas para colunas ocultas. `scope="col"` mantido. |

### 5.4 Teclado

- **Tab** entra no grupo; **setas esquerda/direita** podem mover entre Simples e Completo se implementado como *toolbar* (opcional, melhora); **Enter** / **Space** activa o botão focado.

---

## 6. Layout da grelha e `colSpan`

### 6.1 Contagem de colunas

Símbolos: **C** = Categoria (1ª coluna), **P** = Planejado, **R** = Realizado, **A** = Atingimento, **%** = % Receita.

| Modo período | Modo densidade | Colunas totais | Cabeçalho de grupo Receitas/Despesas (`colSpan`) |
|--------------|----------------|----------------|---------------------------------------------------|
| Mês único | Simples | C + P + R → **3** | **3** |
| Mês único | Completo | C + P + R + A + % → **5** | **5** (actual) |
| Total anual | Simples | **3** | **3** |
| Total anual | Completo | **5** | **5** |
| Compare **N** meses | Simples | **1 + 2N** | **1 + 2N** |
| Compare **N** meses | Completo | **1 + 4N** | **1 + 4N** (actual) |

**GroupHeader** e **SubtotalRow** devem receber `colSpan` **dinâmico** derivado de `density` + `variant` + `N` (compare).

### 6.2 Mês único — modo Simples (wireframe lógico)

```text
┌────────────────┬────────────┬────────────┐
│ Categoria      │ Planejado  │ Realizado  │
├────────────────┼────────────┼────────────┤
│ ▼ Receitas     │            │            │
│   Salário      │   R$ …     │   R$ …     │
│ Subtotal       │   R$ …     │   R$ …     │
│ ▼ Despesas     │            │            │
│   …            │   R$ …     │   R$ …     │
│ Subtotal       │   R$ …     │   R$ …     │
│ Resultado (…)  │     —      │   R$ …     │
└────────────────┴────────────┴────────────┘
```

- Linha **Resultado (realizado):** manter **“—”** na primeira coluna monetária do resultado (Planejado) como hoje quando não aplicável; na segunda coluna, **só** realizado do resultado (**PRD §5.2**).

### 6.3 Comparação multi-mês — modo Simples

- **Primeira linha de cabeçalho:** `Categoria` | `[Mês₁]` (colspan 2) | `[Mês₂]` (colspan 2) | …  
- **Segunda linha:** vazio sob Categoria | P | R | P | R | …  
- Alinhar à spec multi-mês existente, substituindo **4** por **2** subcolunas por mês.

**Largura e scroll:** **NFR** — não reduzir `text-sm` nem `min-w` das colunas só para caber mais dados; **scroll horizontal** permitido; **primeira coluna** (`Categoria`) **sticky** mantida (paridade com spec multi-mês).

### 6.4 Modo compare — linhas da união (implicação visual)

- Quando uma categoria tem **0** em **Planejado** e **0** em **Realizado** num dado mês (inelegível naquele mês), mostrar **R$ 0,00** ou **—** conforme política já usada para células sem dados — **alinhar à implementação actual** e ao **AC-DRE-PER-05**.  
- **P1 (PRD):** *tooltip* “Sem movimento neste mês” na célula **Realizado** — opcional; não bloquear MVP.

---

## 7. Conteúdo e formatação

### 7.1 Moeda e percentagens

- **Simples:** apenas formatação **pt-BR** de moeda nas colunas P e R (igual à grelha actual).  
- **Completo:** inalterado face à spec matricial (Atingimento e % Receita com **1** casa decimal e **“—”** quando aplicável).

### 7.2 Empty state

- Mensagem actual: *“Sem dados para este ano”* + CTA *“Ir para orçamento do mês”*.  
- Após a lógica de elegibilidade por período, se o ano continuar sem **nenhuma** categoria elegível, o *empty state* **mantém-se**; não é obrigatório alterar *copy* no MVP.  
- Se o produto quiser maior precisão (P1): *“Não há orçamento nem movimentos neste ano para mostrar na DRE.”*

---

## 8. Estados de carregamento e erro

- **Sem alteração:** `LoadingOverlay`, *banner* de erro, *overlay* “A atualizar…” na card — comportamentos da spec matricial.  
- Ao trocar **Simples/Completo**, **não** mostrar *spinner* completo; a tabela permanece visível.

---

## 9. Responsividade

| Viewport | Notas |
|----------|--------|
| **&lt; lg** | Toggle em largura total ou *wrap* abaixo da barra de ano; alvos tácteis ≥ 44px. Compare limitado a **2** meses (spec multi-mês) — **independente** da densidade. |
| **≥ lg** | Toggle à direita ou centrado na largura da card; compare até **4** meses. |

---

## 10. Mapa PRD → UX (rastreio)

| ID PRD | Secção desta spec |
|--------|-------------------|
| FR-DRE-CMP-01–03 | §§3.2, 4, 5, 6 |
| FR-DRE-PER-01–03 | §6.4 (comportamento visual compare); lógica de dados — `dreMatrix` / story |
| AC-DRE-CMP-01 | §§6.1–6.3 |
| AC-DRE-CMP-02 | §3.2 persistência |
| NFR-DRE-CMP-01 | §5.3 |

---

## 11. Fora do âmbito desta spec (MVP)

- Novo *illustration* ou *empty state* ilustrado.  
- Animações elaboradas entre colunas.  
- Sincronizar densidade com *query string* (**PRD P2**).

---

## 12. Checklist de QA visual (handoff)

- [ ] Toggle visível e operável em **mês único**, **anual** e **compare** (N=2 e N=4).  
- [ ] **Simples:** exactamente **2** colunas numéricas por bloco; **Completo:** **4**.  
- [ ] `colSpan` dos cabeçalhos de grupo e subtotais coincide com a tabela de §6.1.  
- [ ] Primeira coluna **sticky** e scroll horizontal em compare **mantidos** em ambos os modos.  
- [ ] `aria-pressed` ou *radiogroup* + anúncio `aria-live` ao mudar modo.  
- [ ] Persistência: recarregar página mantém último modo (**AC-DRE-CMP-02**).  
- [ ] Tema claro/escuro: contraste dos botões do segmento ≥ requisitos já usados em `planner-button*`.

---

## 13. Histórico de versões

| Data | Versão | Descrição |
|------|--------|-----------|
| 2026-04-17 | 1.0 | Spec inicial — densidade Simples/Completo, colSpan, posição do controlo, a11y, compare |

---

*Documento redigido para implementação front-end alinhada ao PRD de movimentação por período e vista compacta, em continuidade com as specs DRE matricial e multi-mês.*
