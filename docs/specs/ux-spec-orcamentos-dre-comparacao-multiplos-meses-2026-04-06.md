# Especificação de front-end e UX — Orçamentos: **DRE — comparação com múltiplos meses**

**Versão:** 1.0  
**Data:** 2026-04-06  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** `docs/prd/PRD-orcamentos-dre-comparacao-multiplos-meses-2026-04-06.md`  
**Brief de contexto:** `docs/brief/brief-dre-multiplos-meses-comparacao-2026-04-06.md`  
**Spec base (continuidade visual e semântica):** `docs/specs/ux-spec-orcamentos-dre-visao-matricial-2026-04-06.md`  
**Implementação de referência (brownfield):** `DrePeriodSidebar.tsx`, `DreBudgetPanel.tsx`, `DreMatrixTable.tsx`, `dreMatrix.ts` — tokens `planner-*`, `LoadingOverlay`, `FetchErrorBanner`, `EmptyState`

---

## 1. Objetivo deste documento

Contrato de experiência e implementação para a **evolução da aba DRE**: **seleção múltipla de meses** no mesmo ano, com **blocos de colunas** (Planejado, Realizado, Atingimento, % Receita) **por mês**, **exclusividade** com **Total anual**, **limites por breakpoint**, **feedback** ao atingir o limite, **redimensionamento** da janela e **acessibilidade** (toggle, tabela com dois níveis de cabeçalho, regiões vivas).

Mapeia **FR-DRE-MUL-01** a **FR-DRE-MUL-10**, **AC-DRE-MUL-01** a **AC-DRE-MUL-08** e **NFR-DRE-MUL-01** a **NFR-DRE-MUL-05** do PRD.

**Relação com a spec matricial:** onde não for contradito aqui, aplicam-se **§2–8** da spec DRE matricial (formatação, tooltips, grupos colapsáveis, realce, empty state, disclaimer). A spec matricial descreve **um período visível**; este documento define **N períodos** (1 mês, 2–K meses ou total anual **exclusivo**).

---

## 2. Princípios de experiência (delta face à spec matricial)

| Princípio | Implicação na UI |
|-----------|------------------|
| **Comparação explícita** | Com ≥2 meses, o utilizador vê **rótulos de mês** nos cabeçalhos e, opcionalmente, **linha de contexto** “Comparando N meses” (**AC-DRE-MUL-07**). |
| **Um modo de leitura por vez** | **Nunca** mostrar “Total anual” **ao mesmo tempo** que colunas de meses individuais na mesma grelha (PRD §5). |
| **Ordem temporal canónica** | Colunas seguem **Jan→Dez** independentemente da ordem dos cliques; evita interpretação errada. |
| **Limites honestos** | **K = 4** (`lg+`), **K = 2** (`< lg`); mensagem curta + anúncio acessível ao tentar exceder (**FR-DRE-MUL-07**). |
| **Sem compressão tipográfica** | Não reduzir `text-sm` nem `min-w` das colunas numéricas **só** para caber mais meses; **scroll horizontal** é aceitável (**NFR-DRE-MUL-02**). |

---

## 3. Arquitetura de informação

### 3.1 Modos de período (máquina de estados UX)

```text
                    ┌─────────────────┐
                    │  TOTAL ANUAL    │
                    │  (1 coluna      │
                    │   agregada)     │
                    └────────┬────────┘
                             │ clicar num mês
                             ▼
┌────────────────────────────────────────────────────────────┐
│  MÊS ÚNICO (1 mês selecionado)                               │
│  → Layout idêntico ao actual: 4 colunas + título "Mês YYYY"   │
└───────────────┬──────────────────────────────┬──────────────┘
                │ toggle 2.º mês ON            │ toggle para 0 meses*
                ▼                              (evitar; min 1 mês)
┌────────────────────────────────────────────────────────────┐
│  COMPARAÇÃO (2..K meses)                                      │
│  → Cabeçalho em 2 linhas; blocos de 4 colunas por mês       │
│  → "Total anual" DESABILITADO                                 │
└────────────────────────────────────────────────────────────┘
```

\*Manter **sempre pelo menos um** mês selecionado quando **não** está em modo anual; desmarcar o último mês **não** deve deixar a grelha sem período — comportamento recomendado: **impedir** desmarcar se for o único mês **ou** ao desmarcar o último, seleccionar automaticamente **Janeiro** do ano (preferir **bloquear** desmarque do último para simplicidade cognitiva).

### 3.2 Hierarquia do ecrã (inalterada no topo)

```text
Orçamentos [ Por mês | DRE ]
└── DRE
    ├── Disclaimer (linha existente)
    ├── Barra ano (← select ▶)
    ├── [NOVO] Resumo de contexto (condicional) — §5.7
    ├── Layout: [ Barra períodos ] [ Grelha ]
    └── … grupos Receitas / Despesas / Resultado (estrutura §4)
```

---

## 4. Layout e wireframes lógicos

### 4.1 Mês único (regressão visual)

Manter **exactamente** a estrutura actual da `DreMatrixTable`:

- Um `<thead>` com **uma** linha de cabeçalho: Categoria | Planejado | Realizado | Atingimento | % Receita.  
- `h3` com `model.periodLabel` (ex.: “Março 2026”).  
- **Sem** segunda linha de cabeçalho de meses.  
- `colSpan={5}` nos cabeçalhos de grupo (Receitas / Despesas).

### 4.2 Comparação (2 ≤ N ≤ K) — desktop

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ Comparando 3 meses · 2026                                    (opcional, §5.7)       │
├──────────────┬─────────────────────────────────────────────────────────────────────┤
│ [Jan] [Fev]  │  ┌──────────────────────────────────────────────────────────────────┐
│ [Mar✓][Abr]  │  │ thead L1:  Categoria │    Março 2026    │    Maio 2026    │  Junho…   │
│ …            │  │            (vazio)   │ colspan 4        │ colspan 4       │           │
│ ─────────    │  │ thead L2:  (vazio)   │Plaj│Real│Atg│%R  │ P │ R │ A │ % │ …         │
│ Total anual  │  ├──────────────────────────────────────────────────────────────────┤
│ (disabled)   │  │ GRUPO RECEITAS … (colspan 1+4N)                                   │
│              │  │   Linhas …                                                        │
│              │  │ RESULTADO … uma célula monetária por bloco de mês (§5.5)          │
│              │  └──────────────────────────────────────────────────────────────────┘
└──────────────┴─────────────────────────────────────────────────────────────────────────┘
```

- **Largura mínima da tabela:** `min-w` proporcional a **200 + N×(100+100+88+88)** px (arredondar para múltiplos de 8); não inferior ao actual `min-w-[520px]` quando N=1.  
- **Scroll:** `overflow-x-auto` no wrapper existente; **primeira coluna** mantém `sticky left-0` + fundo opaco (já em `DreMatrixTable`).

### 4.3 Barra de períodos (sidebar / horizontal)

| Viewport | Comportamento |
|----------|----------------|
| **≥ 1024px (`lg`)** | Lista **vertical** à esquerda (como hoje), com **toggle** por mês. |
| **< 1024px** | Lista **horizontal** rolável (como hoje), **toggle** por mês; **máx. 2** meses seleccionáveis. |

### 4.4 Total anual — estado desabilitado

- Quando **≥2 meses** seleccionados: botão **Total anual** com `disabled`, `aria-disabled="true"`, estilo `opacity-50 cursor-not-allowed`, **sem** remover do DOM.  
- **Tooltip / `title` / botão “i” adjacente** (se `disabled` bloquear tooltip nativo em alguns browsers): texto canónico:

> *“Para ver o total anual, deixe só um mês selecionado ou desmarque meses até ficar com um.”*

*(Variante PRD: “reduza a um mês ou limpe a seleção” — alinhar cópia final com PO; significado idêntico.)*

### 4.5 Redimensionamento (fecho **NFR-DRE-MUL-03**)

**Decisão UX canónica (MVP):**

1. Ao passar de **viewport ≥1024** para **<1024** com **mais de 2** meses seleccionados: **manter apenas os 2 primeiros meses na ordem cronológica**; descartar os restantes **sem diálogo modal**.  
2. Mostrar **mensagem não bloqueante** uma vez (ou até descartar): região `aria-live="polite"` + texto visível (§7.3).  
3. **Opcional:** *toast* discreto se o projeto já tiver padrão — não obrigatório se `aria-live` + faixa inline cumprir AC.

---

## 5. Componentes e padrões de UI

### 5.1 Itens da barra de meses — **toggle** (FR-DRE-MUL-01)

| Atributo / estilo | Especificação |
|-------------------|---------------|
| **Papel** | `role="button"` **ou** elemento `<button type="button">`. |
| **`aria-pressed`** | `true` se o mês está **no conjunto seleccionado**; `false` caso contrário. **Não** usar `aria-current` para multi-seleção (reservado a item único). |
| **Mês único + não comparação** | Pode manter-se **visual** igual ao estado actual (borda esmeralda) para **continuidade**; desde que `aria-pressed` reflita seleção. |
| **Dois ou mais meses** | Todos os meses seleccionados partilham o **mesmo** estilo “activo” (ex.: `bg-emerald-500/15` + borda); meses não seleccionados: estado repouso. |
| **Teclado** | **Roving `tabindex`:** apenas um botão na barra com `tabindex={0}`; `↑/↓` (desktop) ou `←/→` (mobile) movem foco **e** opcionalmente **não** alteram seleção até `Space`/`Enter` — **recomendação:** **Enter/Space** faz toggle do mês sob foco; setas **só** movem foco (evita alterações acidentais). |
| **Área tocável** | Mínimo **44×44 px** em mobile. |

### 5.2 Botão Total anual (FR-DRE-MUL-06)

- Em modo **anual activo:** não mostrar meses como `aria-pressed="true"`; o anual é o “modo” activo (ver §6.1).  
- **De anual → mês:** ao clicar “Janeiro”, passa a **mês único** com só Janeiro seleccionado.

### 5.3 Tabela — modo comparação (FR-DRE-MUL-03 a 05)

**Duas linhas de `<thead>`:**

1. **Linha 1:**  
   - Célula 1: `th scope="col"` “Categoria” com `rowspan={2}` **ou** célula vazia com `rowspan={2}` se o rótulo “Categoria” ficar só na L2 — **recomendação:** `rowspan=2` em “Categoria” alinhado ao sticky.  
   - Para cada mês: `th scope="colgroup" colSpan={4}` com texto **“{Mês} {ano}”** (ex.: “Março 2026”).  
2. **Linha 2:**  
   - Para cada mês, quatro `th scope="col"`: Planejado, Realizado, Atingimento, % Receita (tooltips iguais à spec matricial §7).

**Grupos Receitas / Despesas:**  
- `colSpan={1 + 4*N}` no `th` do cabeçalho de grupo.  
- `SubtotalRow` e linhas de dados: **4*N** células numéricas após a primeira coluna.

**Resultado (realizado)** (PRD: um valor **por mês**):

| Coluna no bloco do mês M | Conteúdo |
|--------------------------|----------|
| Planejado | `—` |
| Realizado | Valor **Resultado** do mês M (somatório receitas − despesas **realizado** nesse mês) |
| Atingimento | `—` |
| % Receita | `—` |

- Estilo do **Realizado** do resultado: manter `text-lg text-emerald-600 dark:text-emerald-400` (ou negativo com cor de alerta se o produto quiser saldo negativo destacado — **opcional P1**; MVP pode manter esmeralda e confiar no sinal `−`).

### 5.4 Realce condicional (FR-DRE-MUL-08)

- **Por célula e por mês:** cada métrica usa `rowHighlights` **com planejado/realizado daquele mês** para essa linha. **Não** propagar cor de um mês para outro.

### 5.5 Larguras mínimas (herança spec matricial §5.3)

Por **subcoluna** (cada mês):

| Coluna | `min-w` sugerido |
|--------|------------------|
| Planejado | `min-w-[100px]` |
| Realizado | `min-w-[100px]` |
| Atingimento | `min-w-[88px]` |
| % Receita | `min-w-[88px]` |

### 5.6 Estados vazios e carregamento

- **Igual à spec matricial** §7.4, §8.  
- Mudança de conjunto de meses: **sem** overlay de página inteira; opcional opacidade breve nas células se transição < 150 ms.

### 5.7 Resumo de contexto (AC-DRE-MUL-07)

Quando **≥2 meses** seleccionados, mostrar **uma** das opções (preferência **a**):

1. **Texto introdutório** acima da grelha (abaixo do `h3` ou substituindo-o):  
   *“Comparando {N} meses: {lista de nomes curtos separados por vírgula}.”*  
   Ex.: *“Comparando 3 meses: março, maio, junho.”*  
2. **`h3` único:** *“Março, maio e junho de 2026”* (pt-BR, conjunção natural).

Elemento com `id` referenciável para `aria-describedby` na `table` se útil.

---

## 6. Semântica ARIA e foco

### 6.1 Modo anual vs meses

- O `<nav aria-label="Período da DRE">` mantém-se.  
- Quando **Total anual** está activo: definir `aria-pressed="true"` **no botão Total anual** **e** `aria-pressed="false"` em **todos** os meses **ou** omitir `aria-pressed` nos meses e usar `data-state` — **recomendação mínima:** botão Total anual com `aria-pressed={annualActive}`; meses com `aria-pressed={selected}` apenas quando **não** anual.

### 6.2 Região de limite (FR-DRE-MUL-07)

- Elemento: `<p role="status" aria-live="polite" aria-atomic="true" className="sr-only">` **ou** visível abaixo da barra de períodos.  
- Conteúdo ao rejeitar (K+1)-ésimo mês:  
  *“Limite de N meses para comparação neste ecrã. Desmarque um mês para adicionar outro.”*  
  com **N = 4** ou **2** conforme breakpoint.  
- **Não** usar `assertive` salvo erro crítico.

### 6.3 Redimensionamento (`aria-live`)

- Texto sugerido (após truncagem §4.5):  
  *“Ecrã estreito: a comparação ficou limitada a dois meses. Mantidos: {mês1} e {mês2}.”*

---

## 7. Microcopy (pt-BR)

### 7.1 Tooltip Total anual desabilitado

Ver §4.4.

### 7.2 Limite K

Ver §6.2.

### 7.3 Truncagem por resize

Ver §6.3.

### 7.4 Tooltips de métricas

**Reutilizar** textos da spec matricial §7.1–7.2; acrescentar **opcional** na 2.ª linha do tooltip em modo comparação:

> *“Valores referem-se apenas a {Mês}.”*

(apenas se PO achar necessário; MVP pode omitir se cabeçalhos forem claros.)

### 7.5 Disclaimer e empty state

**Inalterados** (spec matricial §7.3–7.4).

---

## 8. Acessibilidade (checklist WCAG 2.2 AA — delta)

1. **Toggle:** `aria-pressed` sincronizado com estado; nome acessível = nome do mês.  
2. **Tabela:** dois níveis de cabeçalho com `scope` correcto; **NVDA/VoiceOver** leem mês antes das subcolunas.  
3. **Contraste:** estados `disabled` do Total anual mantêm contraste mínimo do **rótulo** (não só `opacity`).  
4. **Focus visible:** toggles e Total anual com anel de foco visível (`focus-visible:ring-*`).  
5. **Live regions:** não esvaziar imediatamente após anúncio se impede leitura — manter mensagem visível **≥ 5 s** na variante inline (opcional).

---

## 9. Mapeamento PRD → esta spec

| ID PRD | Onde está coberto |
|--------|-------------------|
| FR-DRE-MUL-01 | §3.1, §5.1 |
| FR-DRE-MUL-02 | §4.1 |
| FR-DRE-MUL-03 | §4.2, §5.3 |
| FR-DRE-MUL-04 | §2, §5.4 (+ spec matricial §6) |
| FR-DRE-MUL-05 | §5.3 Resultado |
| FR-DRE-MUL-06 | §3.1, §4.4, §5.2, §6.1 |
| FR-DRE-MUL-07 | §6.2, §7.2 |
| FR-DRE-MUL-08 | §5.4 |
| FR-DRE-MUL-09 | spec matricial §6 + células por mês |
| FR-DRE-MUL-10 | spec matricial §2 |
| AC-DRE-MUL-07 | §5.7, §6 |
| NFR-DRE-MUL-02 | §2, §4.2, §5.5 |
| NFR-DRE-MUL-03 | §4.5, §6.3 |

---

## 10. Entregáveis de implementação (para *dev*)

1. **Estender** `DrePeriodSidebar` (ou extrair `DreMonthToggle`): props `selectedMonths: number[]`, `maxSelectable`, `mode: 'annual' | 'months'`, callbacks `onToggleMonth`, `onSelectAnnual`, `onSelectSingleMonthFromAnnual`.  
2. **Estender** `DreMatrixTable` **ou** `DreMultiPeriodMatrixTable`: prop `periods: DrePeriod[]` normalizada (só meses em modo comparação) **ou** view model já com **N** blocos — alinhar com **@architect**.  
3. **`useMediaQuery` / listener** em `DreBudgetPanel` para K dinâmico e **efeito** de truncagem §4.5.  
4. **Testes:** casos de cabeçalho `colspan`, truncagem resize, `aria-pressed`, Total anual `disabled`.  
5. **Storybook** opcional: estados 1 mês, 2 meses, 4 meses, anual, anual disabled.

---

## 11. Histórico de versões

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-06 | Uma | Versão inicial a partir do PRD v1.0; **NFR-DRE-MUL-03** fechado com truncagem + `aria-live` |

---

*Especificação de UX para comparação multi-mês na DRE; iterar cópia fina com PO após primeiro build.*
