# Especificação de front-end e UX — Orçamentos: ações **Editar** e **Excluir** por linha (aba Por mês)

**Versão:** 1.0  
**Data:** 2026-04-07  
**Autoria:** Uma (UX / design system — fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-orcamentos-acoes-editar-excluir-2026-04-07.md`](../prd/PRD-orcamentos-acoes-editar-excluir-2026-04-07.md)  
**Brief de contexto:** [`docs/brief/brief-orcamentos-acoes-editar-excluir-2026-04-07.md`](../brief/brief-orcamentos-acoes-editar-excluir-2026-04-07.md)  
**Spec irmã (mesma rota):** [`docs/specs/ux-spec-orcamentos-dre-visao-matricial-2026-04-06.md`](ux-spec-orcamentos-dre-visao-matricial-2026-04-06.md)  
**Implementação de referência (brownfield):** `frontend/src/pages/Orcamentos.tsx` — `PageShell`, `PageTitle`, `planner-card`, `planner-input`, `planner-button`, `planner-button-secondary`, `LoadingOverlay`, `FetchErrorBanner`, `EmptyState`, `toast`  
**Referência de padrão de diálogo destrutivo:** `frontend/src/components/MeiCatalogoDeleteCatalogConfirmDialog.tsx` (shell acessível: overlay, `planner-card`, foco, `Esc`)

---

## 1. Objetivo deste documento

Contrato de **experiência, estrutura, *copy*, estados, acessibilidade e tokens** para:

1. **Coluna Ações** na tabela **Orçamento por Categoria** (aba **Por mês**).  
2. **Editar** — atalho que foca o input **Planejado** da mesma linha (sem modal novo).  
3. **Excluir** — fluxo de **remoção do planejamento mensal** com confirmação modal e feedback.

Mapeia **FR-ORC-ACT-01** a **FR-ORC-ACT-10**, **AC-ORC-ACT-01** a **AC-ORC-ACT-07**, **NFR-ORC-ACT-01** a **NFR-ORC-ACT-04** do PRD.

**Fora desta spec:** contrato HTTP além do já existente (`POST /categories/budgets` com `valor_orcado: null`); alterações na aba **DRE** além de **paridade de dados** (QA §8).

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Descoberta** | O utilizador **vê** ações por linha; não depende só de descobrir o input editável. |
| **Clareza destrutiva** | **Um passo** de confirmação dedicado antes de remover o planejamento; um toque no ícone da lixeira **não** remove. |
| **Expectativa honesta** | Cópia do diálogo deixa explícito: **só** o valor planejado daquele **mês**; **não** apaga lançamentos nem **categoria** (PRD §10.2). |
| **Continuidade com Orçamentos** | Mesmos tokens `planner-*`, mesma tabela e cartões; ícones **Lucide** coerentes com o resto da app (`Pencil`, `Trash2`). |
| **Paridade DRE** | Após sucesso, o modo **DRE** deve refletir ausência de planejado para aquele par mês/categoria (P1 — **FR-ORC-ACT-10**). |
| **Sem competir com ações globais** | Botões do cabeçalho (**Novo Orçamento**, **Duplicar…**) permanecem os fluxos **primários** de entrada em massa; a coluna Ações é **gestão fina por linha**. |

---

## 3. Arquitetura de informação

### 3.1 Âmbito da página

| Separador | Esta spec aplica-se? |
|-----------|---------------------|
| **Por mês** | **Sim** — único alvo do MVP. |
| **DRE (visão anual)** | **Não** — sem novos controlos de exclusão na grelha DRE; dados atualizam quando o utilizador volta ao modo mensal ou refetch. |

### 3.2 Hierarquia dentro da tabela “Orçamento por Categoria”

Ordem de colunas (desktop / leitura LTR):

```text
Categoria | Planejado | Realizado | Diferença | Progresso | Status | Ações
```

- **Ações** é sempre a **última** coluna (scan natural: dados → estado → o que posso fazer).  
- Quando não há linhas (`EmptyState`), **não** há coluna Ações.

### 3.3 Concorrência de modais

| Estado | Comportamento |
|--------|----------------|
| Modal **Novo Orçamento** aberto | A tabela por baixo está inativa; **não** é obrigatório desabilitar ícones por linha se o overlay já bloquear interação — preferir **z-index** do “Novo Orçamento” ≥ ao do diálogo de exclusão, e **não** abrir exclusão enquanto “Novo Orçamento” estiver aberto (implementação: fechar não necessário; ignorar clique ou desabilitar linhas — **recomendação:** desabilitar botões de ação na tabela quando `addBudgetOpen === true`). |
| Diálogo **Remover planejamento** aberto | Apenas um `categorias_id` alvo; fechar antes de abrir outro. |

---

## 4. Layout e wireframes lógicos

### 4.1 Cabeçalho da tabela (desktop)

```text
│ Categoria │ Planejado │ Realizado │ Diferença │ Progresso │ Status              │ Ações      │
```

- **Cabeçalho “Ações”:** texto visível **“Ações”** (recomendado para clareza). Alternativa aceitável: cabeçalho vazio com `scope="col"` + `<span class="sr-only">Ações</span>` se PO preferir só ícones no corpo.

### 4.2 Célula Ações (por linha)

```text
│ Salário   │ [ R$ 2.900,00 input ] │ R$ 2.200,00 │ … │ … │ Dentro do orçamento │ [✏️] [🗑] │
```

- **Editar:** ícone **lápis** (`Pencil`), botão `type="button"`, estilo **ghost/neutro**: `text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100`, fundo transparente ou `hover:bg-slate-100/60 dark:hover:bg-slate-800/50`, **borda arredondada** alinhada a botões icônicos existentes.  
- **Excluir:** ícone **lixo** (`Trash2`), estilo **destrutivo suave**: `text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300` (evitar fundo vermelho sólido no ícone para não competir com badge de Status).  
- **Agrupamento:** `flex items-center justify-end gap-1` ou `gap-2`; **alinhamento** à direita na célula (`text-right` no `<td>` + `inline-flex`).

### 4.3 Área mínima tocável

- Cada ícone-alvo: **mínimo 44×44 px** de área clicável (`min-h-[44px] min-w-[44px] inline-flex items-center justify-center` ou equivalente).

### 4.4 Mobile / overflow

- Manter **`overflow-x-auto`** no wrapper da tabela (já existente).  
- Se QA reportar **sobreposição** de Ações com Status em viewports estreitas: **P2** — menu **⋯** por linha com “Editar planejamento” / “Remover planejamento” (fora do MVP; documentar como melhoria).

### 4.5 Diálogo de confirmação — wireframe lógico

Alinhar ao padrão visual de `MeiCatalogoDeleteCatalogConfirmDialog` (overlay `bg-black/50`, cartão `planner-card`, botão fechar × no canto).

```text
┌────────────────────────────────────────────────────────────┐
│ Remover planejamento deste mês?                         [×] │
├────────────────────────────────────────────────────────────┤
│ (P1) Isto remove apenas o valor planejado de {categoria}   │
│ em {Mês por extenso} de {ano}.                             │
│ (P2) Os seus lançamentos e o valor realizado não são      │
│ apagados.                                                  │
│ (P3) Não é a mesma coisa que excluir a categoria.         │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ {categoria} · {Mês/ano resumido}                      │ │
│ └──────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│              [ Cancelar ]     [ Remover planejamento ]     │
│                              (botão destrutivo sólido)    │
└────────────────────────────────────────────────────────────┘
```

- **P1–P3** correspondem aos três esclarecimentos obrigatórios do PRD; podem ser **um parágrafo** ou **três parágrafos** — preferir **2–3 parágrafos curtos** para escaneabilidade.  
- **Bloco de resumo** (cartão interno): `nome da categoria` + **mês por extenso e ano** (ex.: *Salário · Abril de 2026*), tipografia `font-medium`, fundo `bg-slate-50 dark:bg-slate-900/60`, borda subtil (igual ao bloco *summary* do diálogo MEI).

---

## 5. *Copy* canónica (implementação)

Valores dinâmicos entre `{ }`.

| Elemento | Texto |
|----------|--------|
| **Título** | `Remover planejamento deste mês?` |
| **Corpo** | Ver PRD §10.2 — três ideias: (1) só planejamento da categoria naquele mês/ano; (2) lançamentos e realizado **não** apagados; (3) **não** é excluir categoria. Substituir **{nome da categoria}**, **{mês por extenso}**, **{ano}**. |
| **Linha de resumo** | `{nome da categoria} · {mês por extenso} de {ano}` (ex.: `Salário · Abril de 2026`) |
| **Cancelar** | `Cancelar` |
| **Confirmar** | `Remover planejamento` |
| **Toast sucesso** | `Planejamento removido.` |
| **Toast erro** | Reutilizar mensagem genérica de falha de gravação já usada em `Orcamentos.tsx` (ex.: *Erro ao salvar orçamento…* — alinhar texto a *“Não foi possível remover o planejamento…”* se o PO uniformizar cópia). |

**`aria-label` dos ícones na tabela (exemplos):**

- Editar: `Editar planejamento de {nome da categoria}`  
- Excluir: `Remover planejamento de {nome da categoria} em {mês por extenso} de {ano}`  

---

## 6. Comportamento e estados

### 6.1 Editar (atalho)

| Passo | Comportamento |
|-------|----------------|
| 1 | Utilizador clica **Editar** na linha L. |
| 2 | Foco move para o `<input>` **Planejado** da linha L (`focus()`). |
| 3 | (Opcional PRD) `select()` no texto do input para substituição rápida — **recomendado** em desktop; em **mobile** pode irritar (teclado cobre ecrã) — **permitir** `select()` só em `matchMedia('(pointer: fine)')` ou sempre; decisão @dev com default **com select em desktop**. |
| 4 | Utilizador edita; **blur** ou **Enter** dispara a mesma lógica que hoje (`handleBudgetBlur`). |
| 5 | Estados **saving** por linha já existentes desabilitam o input; **recomendação:** desabilitar também **Excluir** nessa linha enquanto `savingBudgetByCategory[id]`; **Editar** pode permanecer clicável para refoco (sem efeito colateral) ou desabilitar — **preferir desabilitar ambos os ícones** na linha em saving. |

### 6.2 Excluir — fluxo feliz

| Passo | Comportamento |
|-------|----------------|
| 1 | Clique em **Excluir** → abre diálogo; estado `deleteTarget = { id, nome }` (ou equivalente). |
| 2 | **Foco inicial:** botão **Cancelar** (paridade **NFR-ORC-ACT-01** e padrão `MeiCatalogoDeleteCatalogConfirmDialog`). |
| 3 | **Esc** ou clique no overlay ou **×** ou **Cancelar** → fecha sem API; **foco regressa** ao botão **Excluir** que abriu o diálogo (`useRef` por linha ou `restoreFocus` pattern). |
| 4 | **Remover planejamento** → `isDeleting true`: desabilitar ambos os botões do diálogo, botão destrutivo mostra *spinner* ou texto *Removendo…* (paridade FR-ORC-ACT-08). |
| 5 | Sucesso → fechar diálogo; `toast.success`; **refresh** da mesma origem que após salvar orçamento (`refreshSummary` / `loadBudgetPage` — sem refetch desnecessário de ano inteiro). |
| 6 | Linha desaparece; cartões atualizam. |

### 6.3 Excluir — erros

| Situação | UX |
|----------|-----|
| Rede / 5xx | `role="alert"` **dentro** do diálogo (paridade MEI) ou só `toast.error`; **reabilitar** botões; linha **permanece**. |
| 4xx genérico | Mensagem humana; não mostrar IDs técnicos. |

### 6.4 Estados da linha durante operações

| Estado | Editar | Excluir | Input Planejado |
|--------|--------|---------|-----------------|
| Idle | habilitado | habilitado | habilitado (se não saving) |
| `savingBudgetByCategory[id]` | desabilitado | desabilitado | desabilitado (já hoje) |
| `deletingBudgetByCategory[id]` ou diálogo aberto para `id` | desabilitado | N/A (diálogo) | desabilitado **recomendado** para evitar edição concorrente |
| `addBudgetOpen` | desabilitado na tabela | desabilitado na tabela | desabilitado na tabela |

### 6.5 *Loading* da página

- Se `loading === true` (`LoadingOverlay` na tabela), **não** renderizar corpo de linhas com Ações **ou** manter Ações desabilitadas — **preferir** não mostrar botões até haver dados (paridade com estado vazio de interação).

---

## 7. Acessibilidade (checklist mínima)

- Diálogo: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (título), `aria-describedby` (zona do corpo + resumo).  
- **Ordem de tab:** Cancelar antes de Remover planejamento (LTR).  
- Botão destrutivo no diálogo: texto **completo** `Remover planejamento` (não só ícone).  
- **Esc** fecha o diálogo quando `!isDeleting`.  
- Contraste de ícones e de botão destrutivo em **dark mode** (objetivo AA).  
- Tabela: cabeçalho **Ações** associado semanticamente às células (não usar `<div>` solto no `<th>` sem papel de coluna).  
- Se o projeto usar **React Testing Library**, `data-testid` sugerido no diálogo: `orcamento-remove-planning-confirm` (paridade com `mei-delete-cliente-confirm`).

---

## 8. Design system e tokens

| Elemento | Token / classe sugerida |
|----------|-------------------------|
| Cartão do diálogo | `planner-card`, `max-w-md`, `p-6`, `shadow-xl` |
| Overlay | `fixed inset-0 z-50 flex items-center justify-center bg-black/50` — **z-index:** ≥ modal “Novo Orçamento” se ambos coexistirem; típico `z-50` na página Orçamentos hoje → diálogo exclusão **z-[60]** se “Novo Orçamento” ficar em `z-50`, ou unificar. |
| Botão Cancelar | `planner-button-secondary` |
| Botão Remover planejamento | `bg-rose-600 text-white hover:bg-rose-700` (ou classe de botão destrutivo já usada no projeto); `disabled:opacity-50` durante `isDeleting` |
| Ícone Editar | Lucide `Pencil`, `size` 18–20 |
| Ícone Excluir | Lucide `Trash2`, mesmo tamanho |
| Célula Ações | `whitespace-nowrap` opcional para evitar quebra feia entre ícones |

**Sem** nova paleta de marca; **sem** alterar `PageTitle` ou tabs por causa desta entrega.

---

## 9. Implementação front-end (notas para @dev)

| Tópico | Diretriz |
|--------|----------|
| **Foco no input** | `useRef<Map<number, HTMLInputElement>>` ou ref por `categorias_id` registado no `ref` callback do input **Planejado**. |
| **Componente de diálogo** | Preferir **novo** componente pequeno (ex.: `OrcamentoRemovePlanningConfirmDialog`) que **copie** a estrutura acessível de `MeiCatalogoDeleteCatalogConfirmDialog` **ou** extrair um **ConfirmDialog** genérico para `components/` se a equipa quiser DRY — **não** importar texto/copy MEI no domínio Orçamentos. |
| **Copy** | Centralizar strings em `frontend/src/copy/orcamentosPlanning.ts` (ou módulo existente de copy de planner) para testes e revisão PO. |
| **Testes** | Paridade com `MeiCatalogoClientes.test.tsx`: abrir confirmação → Cancelar não chama API; confirmar chama `saveCategoryBudget` com `null` e fecha com toast. |

---

## 10. Mapeamento PRD → esta spec

| ID PRD | Onde está coberto |
|--------|-------------------|
| FR-ORC-ACT-01 | §3.2, §4.1–4.2 |
| FR-ORC-ACT-02 | §6.1 |
| FR-ORC-ACT-03 | §4.5, §5 |
| FR-ORC-ACT-04–06 | §6.2 |
| FR-ORC-ACT-07–08 | §6.3–6.4 |
| FR-ORC-ACT-09 | §3.3, regressão QA |
| FR-ORC-ACT-10 | menção §2; validação DRE fora do layout desta spec |
| NFR-ORC-ACT-01 | §7 |
| NFR-ORC-ACT-02–04 | §6.2, §9, gates `AGENTS.md` |

---

## 11. QA visual e de regressão (checklist)

- [ ] Coluna Ações alinhada à direita; cabeçalho “Ações” legível em claro/escuro.  
- [ ] Editar foca input correto com **duas** linhas na tabela (não “fuga” de foco para outra linha).  
- [ ] Excluir: cópia com nome da categoria e mês/ano corretos ao mudar seletor **antes** de abrir o diálogo.  
- [ ] Após exclusão, **Novo Orçamento** lista a categoria outra vez.  
- [ ] Com **Novo Orçamento** aberto, linha da tabela não dispara exclusão acidental.  
- [ ] (P1) DRE: planejado do mês/categoria removido não mostra valor antigo após navegar à DRE.

---

## 12. Histórico de versões

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-04-07 | Versão inicial a partir do PRD v1.0. |

---

*Spec redigida por Uma (UX design expert). Não substitui story em `docs/stories/`; alimenta critérios de aceite, *file list* e revisão visual.*
