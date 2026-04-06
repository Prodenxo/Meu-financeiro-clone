# Especificação de front-end e UX — Orçamentos: **DRE / visão matricial**

**Versão:** 1.0  
**Data:** 2026-04-06  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** `docs/prd/PRD-orcamentos-dre-visao-matricial-2026-04-06.md`  
**Brief de contexto:** `docs/brief/brief-orcamentos-dre-visao-matricial-2026-04-06.md`  
**Implementação de referência (brownfield):** `frontend/src/pages/Orcamentos.tsx` — `PageShell`, `PageTitle`, `planner-card`, `planner-input`, `planner-button*`, `LoadingOverlay`, `FetchErrorBanner`, `EmptyState`

---

## 1. Objetivo deste documento

Contrato de experiência e implementação para a **segunda modalidade** da rota `/orcamentos`: **modo DRE / visão anual** — grelha **leitura apenas** com período selecionável (mês ou total anual), quatro métricas por período, grupos hierárquicos, subtotais, secção **Resultado**, realce de desvios, estados vazios/erro/carregamento e requisitos de acessibilidade.

Mapeia **FR-DRE-01** a **FR-DRE-10**, **AC-DRE-01** a **AC-DRE-09** e **NFR-DRE-01** a **NFR-DRE-05** do PRD.

Não substitui stories em `docs/stories/`; alimenta critérios de aceite, *file list* e revisão visual.

---

## 2. Princípios de experiência

| Princípio | Implicação na UI |
|-----------|------------------|
| **Continuidade com o modo mensal** | O utilizador reconhece a mesma página (**Orçamentos**), os mesmos tokens `planner-*` e o mesmo subtítulo de valor (planejado vs realizado). **Não** introduzir um “produto dentro do produto” com cromática destoante. |
| **Leitura primeiro (MVP)** | Na DRE **não há** inputs de orçamento; CTA claro para **“Ir ao mês atual”** ou mudar para o separador **Mês** quando quiser editar (**FR-DRE-10**, **AC-DRE-09**). |
| **Densidade controlada** | Uma **única fatia temporal** visível de cada vez (um mês **ou** total anual), não 12×4 colunas em simultâneo — reduz sobrecarga e cumpre o espírito da referência (sidebar que **foca** o período). |
| **Hierarquia óbvia** | Grupos **Receitas** e **Despesas** são blocos visuais distintos (cor de fundo suave + tipografia); **Resultado** é **sempre** o bloco final, destacado. |
| **Confiança nos números** | Tooltips curtos nas métricas **Atingimento** e **% Receita** com a fórmula em linguagem natural (§7). Disclaimer: *mapa de resultado pessoal*, não documento fiscal (**PRD §1**). |

---

## 3. Arquitetura de informação

### 3.1 Navegação principal na página (`/orcamentos`)

| Separador (tab) | Rótulo sugerido | Conteúdo |
|-----------------|-----------------|----------|
| **A** | **Mês** (ou manter título atual **Orçamento mensal** como subtítulo da página + tab “Mês”) | UI **existente**: seletor mês/ano, cartões de totais, tabela editável, modais, duplicar mês. |
| **B** | **DRE** ou **Visão anual** | Nova UI: seletor de **ano**, sidebar de **mês / Total anual**, grelha de leitura, grupos, resultado. |

**Recomendação:** `PageTitle` permanece neutro (ex.: **Orçamentos**) com subtítulo único alinhado ao PRD, **ou** título **Orçamentos** + tabs logo abaixo com **“Por mês”** | **“DRE (visão anual)”** — validar cópia final com PO.

**Estado da URL (opcional V1):** query `?view=dre&year=2026&period=3` para partilha e *refresh*; se não houver tempo, estado só em React.

### 3.2 Hierarquia dentro do modo DRE

```text
Orçamentos [tabs: Por mês | DRE]
└── DRE
    ├── Barra de contexto: ano (← 2026 →) + texto de ajuda / disclaimer (1 linha)
    ├── Layout principal (desktop): [ Sidebar períodos ] [ Grelha ]
    ├── Grupo Receitas (colapsável)
    │   ├── Linhas: categorias tipo entrada (elegíveis)
    │   └── Subtotal Receitas
    ├── Grupo Despesas (colapsável)
    │   ├── Linhas: categorias tipo saída (elegíveis)
    │   └── Subtotal Despesas
    └── Bloco Resultado (fixo, não colapsável)
        ├── Resultado realizado (receitas − despesas)
        └── (Opcional P1) Resultado planejado net — só se produto quiser paridade; PRD permite UX spec definir: **MVP = linha única “Resultado (realizado)”**)
```

### 3.3 Elegibilidade de linhas (categoria)

**Predefinição canónica (PRD §6.1):** mostrar categoria se, **no ano selecionado**, existir pelo menos um mês com **Planejado > 0** **ou** **Realizado ≠ 0** (entrada: realizado = recebido; saída: realizado = gasto).

Categorias **sem** linha em nenhum mês do ano **não** aparecem na DRE (evita lista infinita vazia).

---

## 4. Layout e wireframes lógicos

### 4.1 Desktop (≥ `lg` / 1024px) — referência

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Orçamentos    [ Por mês ]  [ DRE ]                                            │
│ Mapa de resultado pessoal — não é documento contabilístico.        [ⓘ ajuda]   │
├──────────────────────────────────────────────────────────────────────────────┤
│  Ano:  ◀  2026  ▀                                                            │
├──────────────┬───────────────────────────────────────────────────────────────┤
│ Receita mês  │  [ Março 2026 ]     Planejado │ Realizado │ Atingim. │ % Receita│
│ (sidebar)    │  (título período)   🎯        │ ✓         │ 📈       │ ▂        │
│ ┌──────────┐ │ ┌────────────────────────────────────────────────────────────────┤
│ │ Janeiro  │ │ │ GRUPO RECEITAS                              [▼ recolher]        │
│ │ Fevereiro│ │ │   Salário      R$    │ R$    │  — %    │  — %                   │
│ │ Março  * │ │ │   Freelance    …     │ …     │ …       │ …                     │
│ │ …        │ │ │   Subtotal     Σ     │ Σ     │ …       │ 100 % *               │
│ │          │ │ ├────────────────────────────────────────────────────────────────┤
│ │──────────│ │ │ GRUPO DESPESAS                              [▼]                  │
│ │Total anual│ │ │   Moradia      …     │ …     │ 🔴      │ …                     │
│ └──────────┘ │ │   Subtotal     Σ     │ Σ     │ …       │ …                     │
│              │ ├────────────────────────────────────────────────────────────────┤
│              │ │ RESULTADO (realizado)   R$  XXXX,XX  (receitas − despesas)      │
│              │ └────────────────────────────────────────────────────────────────┘
└──────────────┴───────────────────────────────────────────────────────────────┘
```

*Nota:* ícones 🎯/✓/📈 são **opcionais** (P1); podem ser substituídos por rótulos abreviados para reduzir ruído.

### 4.2 Tablet / mobile (`< lg`)

- **Sidebar** de meses deixa de ser coluna fixa: transformar em **lista horizontal rolável** (*chip* / segmento) **acima** da grelha, **ou** `<select>` nativo “Período” com opções Janeiro…Dezembro + Total anual.  
- **Grelha:** `overflow-x-auto`; **primeira coluna (Categoria / grupo)** com `position: sticky; left: 0` + `background` opaco (token de superfície) para não sobrepor texto ao scroll.  
- **Cabeçalho** das 4 métricas pode quebrar em **duas linhas** de sub-rótulos se necessário; manter ordem: Planejado → Realizado → Atingimento → % Receita.

### 4.3 Comportamento “Total anual”

Ao selecionar **Total anual**:

- Título da área da grelha: **“Total anual · {ano}”**.  
- Cada célula: **soma** dos 12 meses para **Planejado** e **Realizado**.  
- **Atingimento:** se soma Planejado > 0 → `soma Realizado / soma Planejado × 100`; caso contrário seguir §6.2.  
- **% Receita:** denominador = **receita anual total realizada** (soma das entradas); numerador = realizado anual da linha.  
- **Subtotais** e **Resultado** usam as **mesmas** regras sobre totais anuais.

---

## 5. Componentes e padrões de UI

### 5.1 Tabs (FR-DRE-01)

- Padrão: **lista de tabs** com `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, foco por teclado (←/→ onde aplicável).  
- Tab ativa: estilo consistente com outros ecrãs do *planner* (borda inferior ou `bg` suave); **contraste** mínimo AA.  
- Ao mudar de **DRE** → **Mês**, **não** perder ano selecionado se o utilizador já escolheu o mesmo ano no modo mensal (preferível sincronizar `selectedYear`).

### 5.2 Sidebar de períodos (FR-DRE-02, FR-DRE-03)

| Elemento | Especificação |
|----------|----------------|
| Itens | Janeiro … Dezembro (nomes completos em pt-BR), depois separador visual, depois **Total anual**. |
| Seleção | Item selecionado: `bg-emerald-500/15` + `text-emerald-700` (claro) / `dark:text-emerald-300` + borda esquerda `border-emerald-500` **ou** equivalente `planner-*` se existir token de “selected”. |
| Teclado | Lista vertical (desktop): `↑/↓` move foco; `Enter`/`Space` seleciona; **roving tabindex** (`tabindex="0"` só no focado). |
| Mobile | Se usar *chips* horizontais, cada chip ≥ **44×44 px** área tocável. |

### 5.3 Cabeçalho da grelha (subcolunas)

| Coluna | Largura mín. sugerida | Alinhamento |
|--------|------------------------|-------------|
| Nome (categoria / grupo / resultado) | `min-w-[200px]` (desktop) | Esquerda |
| Planejado | `min-w-[100px]` | Direita (valores monetários) |
| Realizado | `min-w-[100px]` | Direita |
| Atingimento (%) | `min-w-[88px]` | Direita |
| % Receita | `min-w-[88px]` | Direita |

**Cabeçalho de grupo de colunas:** opcionalmente uma linha única **“Março 2026”** centrada sobre as 4 colunas (colspan) quando o layout permitir; caso contrário repetir o nome do período só no título acima da tabela.

### 5.4 Linhas de grupo (Receitas / Despesas)

- **Cabeçalho de grupo:** linha de tabela `<th scope="colgroup">` ou `<tr>` com `<td colspan="5">` com:  
  - botão **recolher/expandir** (ícone `ChevronDown`/`ChevronRight` + `aria-expanded`);  
  - rótulo **“Receitas”** ou **“Despesas”**;  
  - fundo: `bg-emerald-50/80 dark:bg-emerald-950/30` (Receitas) e `bg-slate-100/80 dark:bg-slate-800/50` (Despesas) — ajustar para não conflituar com tema.  
- **Colapsado:** ocultar linhas folha do grupo; **subtotal do grupo permanece visível** abaixo do cabeçalho (recomendação PRD brief) — implementação: ordem visual `[header grupo] [subtotal colado]` **ou** subtotal sempre na última linha visível do grupo; **específico:** **subtotal fica sempre visível** quando colapsado (uma linha “Receitas — subtotal”).  
- **Subtotal:** texto **“Subtotal”** + células numéricas em **negrito**; mesmas 4 métricas calculadas sobre o conjunto de linhas do grupo.

### 5.5 Bloco Resultado (FR-DRE-05, AC-DRE-04)

- **MVP:** uma linha (ou cartão imediatamente abaixo da tabela) com rótulo **“Resultado (realizado)”** e valor **Subtotal Receitas (realizado) − Subtotal Despesas (realizado)** para o período visível.  
- Estilo: `font-semibold` ou `text-lg`; fundo `planner-card` ou faixa `border-t-2 border-emerald-500/50`.  
- **Não** colapsar com os grupos.  
- **Opcional (P1):** segunda linha **“Resultado (planejado)”** = soma planejada receitas − soma planejada despesas, se PO quiser paridade; fora do MVP mínimo se não houver tempo.

### 5.6 Realce condicional (FR-DRE-07, P1 fino / base P0)

| Caso | Células afetadas | Estilo (alinhado a `Orcamentos.tsx`) |
|------|------------------|----------------------------------------|
| Despesa: `Realizado > Planejado` e `Planejado > 0` | **Realizado**, **Atingimento** | `text-rose-500` ou `text-rose-400` (dark); opcional `font-semibold` |
| Receita: `Realizado < Planejado` e `Planejado > 0` | **Realizado**, **Atingimento** | `text-amber-500` / `dark:text-amber-400` |
| Receita: `Realizado > Planejado` e `Planejado > 0` | **Realizado**, **Atingimento** | `text-emerald-600` / `dark:text-emerald-400` (positivo) |
| `Planejado = 0` e `Realizado > 0` (despesa) | **Atingimento** | Mostrar **“—”**; **Realizado** pode levar realce âmbar (opcional) |

---

## 6. Regras de conteúdo e formatação

### 6.1 Moeda e percentagens

- **Moeda:** `pt-BR`, `BRL`, **2 casas decimais** — igual ao modo mensal (`formatCurrency`).  
- **Percentagem:** **1 casa decimal** para Atingimento e % Receita (alinhado ao cartão “Total Realizado” que usa `toFixed(1)`).  
- **Valores nulos / não aplicável:** **“—”** (en dash tipográfico opcional; consistente com tabela mensal que usa `-` onde aplicável).

### 6.2 Atingimento (PRD §6.1 + AC)

| Condição | Exibição |
|----------|----------|
| `Planejado > 0` | `(Realizado / Planejado) × 100` com 1 decimal + `%` |
| `Planejado = 0` e `Realizado = 0` | **“—”** |
| `Planejado = 0` e `Realizado > 0` | **“—”** (recomendação PRD); realce opcional em Realizado (§5.6) |

### 6.3 % Receita (PRD §5)

| Condição | Exibição |
|----------|----------|
| Receita total do período **> 0** | `(Realizado_linha / Receita_total) × 100` — 1 decimal + `%` |
| Receita total do período **= 0** | **“—”** para todas as linhas |

**Subtotal Receitas:** na linha de subtotal, **% Receita** = **100,0 %** se receita total > 0; caso contrário **“—”**.  
**Subtotal Despesas:** % Receita = `(Subtotal despesas realizado / Receita_total) × 100` se receita > 0; senão **“—”**.  
**Resultado:** % Receita **“—”** ou **100 %** do saldo sobre si — **MVP:** mostrar **“—”** na coluna % Receita para a linha Resultado (evita interpretação ambígua); apenas valor monetário do saldo.

---

## 7. Microcopy, tooltips e disclaimer

### 7.1 Tooltip / `aria-description` — Atingimento

> *“Percentagem do realizado face ao planejado neste período. ‘—’ quando não há valor planejado.”*

### 7.2 Tooltip — % Receita

> *“Peso desta linha sobre a receita total realizada no período (soma das categorias de entrada).”*

### 7.3 Disclaimer (linha sob tabs ou sob título DRE)

> *“Visão de resultado pessoal com base nas categorias e movimentos da app. Não substitui demonstrações contabilísticas ou obrigações fiscais.”*

### 7.4 Empty state (FR-DRE-08, AC-DRE-07)

- **Título:** *“Sem dados para este ano”*  
- **Descrição:** *“Defina orçamentos ou registe movimentos no modo Por mês para ver a DRE.”*  
- **CTA primário:** mudar para tab **Por mês** (ou botão *“Ir para orçamento do mês”*).  
- Ilustração: reutilizar padrão `EmptyState` com ícone `Wallet` ou `Table`.

### 7.5 Erro de rede

- Reutilizar **`FetchErrorBanner`** com *retry*; mensagem neutra; `role="alert"`.

---

## 8. Estados de interface

| Estado | Comportamento |
|--------|----------------|
| **Carregamento inicial DRE** | `LoadingOverlay` ou *skeleton* da sidebar + primeira coluna da tabela (preferência: mesmo padrão do modo mensal). |
| **Carregamento ao mudar ano** | *Spinner* inline na barra do ano **ou** *skeleton* curto sem remover layout (evitar *layout shift* brusco). |
| **Carregamento ao mudar mês na sidebar** | Transição leve: opacidade 0,6 na grelha **ou** *skeleton* só nas células numéricas (< 200 ms pode omitir). |
| **Sucesso sem linhas elegíveis** | Empty state §7.4. |

---

## 9. Acessibilidade (NFR + AC-DRE-08)

Checklist mínima **WCAG 2.2 nível AA** nos controlos novos:

1. **Tabs:** foco visível; ordem de tabulação: tabs → sidebar → grelha.  
2. **Tabela:** `<table>` com `<thead>`, `<tbody>`; células de dados com cabeçalhos associados (`scope="col"` / `scope="row"`).  
3. **Grupos colapsáveis:** botão com `aria-expanded` e `aria-controls` apontando para `id` do `<tbody>` do grupo.  
4. **Realce só por cor:** não depender apenas de cor — manter **“—”** ou texto de status onde fizer sentido; desvios podem incluir `font-semibold`.  
5. **Contraste:** texto `text-rose-*` / `text-amber-*` sobre fundo claro/escuro verificado (ajustar tonalidade se falhar).  
6. **Redução de movimento:** respeitar `prefers-reduced-motion` em transições de tab/sidebar.  
7. **Touch targets:** ≥ 44×44 px para itens da sidebar mobile.

---

## 10. Mapeamento PRD → esta spec

| ID PRD | Onde está coberto |
|--------|-------------------|
| FR-DRE-01 | §3.1, §5.1 |
| FR-DRE-02 | §3.2, §4.1, §5.3 |
| FR-DRE-03 | §4.3 |
| FR-DRE-04 | §3.2, §5.4 |
| FR-DRE-05 | §5.5 |
| FR-DRE-06 | §6.3 |
| FR-DRE-07 | §5.6 |
| FR-DRE-08 | §7.4, §8 |
| FR-DRE-09 | §9 |
| FR-DRE-10 | §2, §7.4 CTA |
| NFR-DRE-02 | §4.2 |
| NFR-DRE-05 | §7 (pt-BR) |

---

## 11. Entregáveis de implementação (para *dev*)

1. Componentes sugeridos (nomes indicativos): `OrcamentosViewToggle` (tabs), `DrePeriodSidebar`, `DreMatrixTable`, `DreGroupSection`, `DreResultBanner`.  
2. Lógica de agregação e formatação: **hook ou util partilhado** (`useDreMatrix` / `buildDreRows`) — **NFR-DRE-04**.  
3. Testes visuais / unitários: casos **AC-DRE-05** e **AC-DRE-06** com dados *fixtures*.  
4. Storybook **opcional** se o projeto já o usar; caso contrário exemplos na story de QA.

---

## 12. Histórico de versões

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-06 | Uma | Versão inicial a partir do PRD v1.0 |

---

*Especificação de UX para implementação do modo DRE em Orçamentos; iterar com PO em cópia e tokens finos após primeiro *build*.*
