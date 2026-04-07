# Brief: ações **Editar** e **Excluir** na tabela “Orçamento por Categoria” (aba Por mês)

**Data:** 2026-04-07  
**Origem:** pedido de produto / UX (persona Atlas — analista)  
**Produto:** Meu Financeiro — **Orçamentos** (`/orcamentos`), aba **Por mês**  
**Referência visual:** captura do ecrã atual com tabela (Categoria, Planejado, Realizado, Diferença, Progresso, Status); cópia local em `assets/c__Users_Usu_rio_AppData_Roaming_Cursor_User_workspaceStorage_b524c017799653aecc51a9dda4eee1a8_images_image-79c94aa4-0b3f-4b8c-a2db-86d7c4056290.png` (workspace Cursor).

**Documentos relacionados (não substituídos por este brief):**

- `docs/brief/brief-orcamentos-dre-visao-matricial-2026-04-06.md` — visão DRE na mesma página.  
- `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` — contexto geral do produto.

**Próximos passos típicos:** `@pm` — critérios de aceite e cópia de UI; `@dev` — implementação; `@qa` — cenários de regressão na aba Por mês e impacto na DRE (se houver).

---

## 1. Resumo executivo

O utilizador pretende **ações explícitas por linha** na tabela **Orçamento por Categoria**: **editar** e **excluir** o orçamento daquela categoria **no mês selecionado**. Hoje o valor **planejado** já é editável **inline** (campo na coluna “Planejado”, gravação em `onBlur`); não há coluna **Ações** nem botões dedicados, o que reduz a **descoberta** e não oferece um fluxo claro de **remoção** do orçamento.

Este brief define o problema, cenários, proposta de UX, implicações técnicas (API já existente vs extensão) e critérios de aceite para story/PRD.

---

## 2. Estado atual no código (brownfield)

| Área | Detalhe |
|------|---------|
| **Página** | `frontend/src/pages/Orcamentos.tsx` — tabela na aba **Por mês**; linhas derivadas de `fetchCategoryBudgetsSummary` filtradas a `valor_orcado > 0`. |
| **Gravar orçamento** | `saveCategoryBudget` → `POST /categories/budgets` (`categoryService.ts`). |
| **Edição** | Input monetário na coluna “Planejado”; `handleBudgetBlur` persiste alterações. |
| **Exclusão** | **Sem** botão dedicado. **Não** existe rota `DELETE` em `categories.routes.js` para orçamentos; apenas `POST` (`upsertCategoryBudget`). |
| **Backend** | `categories.service.js` — `upsertCategoryBudget` aceita `valor_orcado` normalizado; `parseValorOrcado` mapeia `null` / vazio → `null` e faz **update** da linha em `orçamentos` com `valor_orçado` nulo. |

**Implicação:** uma primeira versão de “**excluir**” pode ser **remover o planejamento** para aquele mês/categoria enviando `valor_orcado: null` com a mesma `date` (início do mês), alinhado ao fluxo de gravação atual. Opcionalmente, o produto pode exigir **DELETE físico** da linha em `orçamentos` (novo endpoint + política de dados) — decisão em aberto (§8).

---

## 3. Problema / oportunidade

| Dimensão | Situação atual | Oportunidade |
|----------|----------------|--------------|
| **Descoberta** | Edição só óbvia ao interagir com o input. | Coluna **Ações** com ícones ou botões (ex.: lápis / lixeira) alinhados ao design system. |
| **Exclusão** | Utilizador não tem caminho explícito para “tirar esta categoria do orçamento deste mês”. | **Excluir** com confirmação e feedback (toast), atualizando totais e lista. |
| **Consistência** | Botões superiores (“Novo Orçamento”, “Duplicar…”) já são explícitos. | Ações por linha **completam** o modelo mental “gerir linhas do orçamento”. |

---

## 4. Utilizadores e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| Utilizador casual | Encontrar como **apagar** um orçamento errado. | Clica **Excluir** na linha → confirma → linha some dos totais; categoria volta a aparecer como elegível em “Novo Orçamento” (se aplicável). |
| Utilizador que prefere botões | **Editar** sem “adivinhar” o input. | **Editar** foca o campo “Planejado” da linha **ou** abre o mesmo fluxo do modal “Novo Orçamento” pré-preenchido (decisão UX §5). |
| Utilizador cauteloso | Evitar apagar por engano. | Diálogo de confirmação com nome da categoria e mês/ano. |

---

## 5. Proposta de experiência (recomendações)

### 5.1 Coluna **Ações** (MVP)

- Nova coluna à direita (após **Status**), cabeçalho **“Ações”** (ou só ícones com `aria-label` / `title`).  
- **Editar:**  
  - **Opção A (recomendada — menor escopo):** botão/ícone que **foca** o `input` da coluna Planejado da mesma linha (e opcionalmente `select()` no valor), mantendo a lógica atual de gravação no blur.  
  - **Opção B:** modal de edição reutilizando padrão de “Novo Orçamento” (categoria bloqueada, valor editável).  
- **Excluir:** botão/ícone destrutivo (estilo coerente com outras telas do app, ex. catálogo MEI) → **confirmação** → chamada API para remover planejamento no mês (§6).

### 5.2 Acessibilidade e mobile

- Áreas de toque ≥ 44px onde o design permitir; `aria-label` em ícones (“Editar orçamento de {categoria}”, “Remover orçamento de {categoria}”).  
- Em **mobile**, considerar menu compacto (⋯) se a linha ficar apertada — pode ser fase 2 se a tabela já tiver scroll horizontal aceitável.

### 5.3 Relação com a aba **DRE**

- Alterar orçamento no **Por mês** já reflete nos dados agregados; após exclusão, a DRE não deve mostrar planejado para essa categoria/mês. Validar que `valor_orcado` nulo é tratado de forma consistente em `fetchCategoryBudgetsYearly` / `dre-matrix` (paridade já testada noutros fluxos).

---

## 6. Implicações técnicas (resumo)

1. **Frontend:** `Orcamentos.tsx` — coluna Ações; estado de “a excluir” / loading por linha; confirmação (`window.confirm` mínimo ou componente de diálogo existente no projeto).  
2. **Cliente API:** reutilizar `saveCategoryBudget(userId, categoriasId, null, getMonthStartDate())` para **MVP de exclusão**, **se** PO/arquitetura aceitarem semântica “remover = valor nulo” (linha pode permanecer na BD com `valor_orçado` null).  
3. **Backend (opcional):** `DELETE /categories/budgets` (ou similar) com `categorias_id` + `date`/`year`+`month` para apagar a linha — apenas se for requisito de dados ou relatórios admin.  
4. **Testes:** contrato da rota existente com `null`; teste de UI na tabela (se o projeto já cobre páginas semelhantes).

---

## 7. Requisitos de aceite (rascunho para story)

1. Na aba **Por mês**, cada linha da tabela “Orçamento por Categoria” exibe ações **Editar** e **Excluir** (ou equivalente acessível).  
2. **Editar** permite alterar o planejamento de forma clara (foco no input **ou** modal, conforme decisão §5.1).  
3. **Excluir** pede confirmação; após sucesso, a linha **deixa de aparecer** na tabela (coerente com filtro `valor_orcado > 0`) e os **três cartões de resumo** atualizam.  
4. Mensagens de erro/sucesso via padrão existente (`toast`).  
5. Não regressar **Novo Orçamento**, **Duplicar mês anterior** nem mudança de mês/ano.  
6. (Se aplicável) Após excluir, a categoria volta a poder ser escolhida em “Novo Orçamento” para o mesmo mês.

---

## 8. Decisões em aberto

1. **Editar:** apenas foco no input (Opção A) vs modal dedicado (Opção B).  
2. **Exclusão:** `valor_orcado = null` (reuso de `POST`) vs **DELETE** físico da linha.  
3. **Cópia da confirmação de exclusão:** texto exato (mencionar que movimentos/realizado histórico **não** são apagados — apenas o **planejamento** daquele mês).  
4. **DRE / exportações:** confirmar com PO se “excluir orçamento” deve esconder a linha em todas as vistas com a mesma semântica.

---

## 9. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Utilizador confunde “excluir orçamento” com “excluir categoria” | Cópia explícita no diálogo; não reutilizar ícone de apagar categoria noutro contexto sem rótulo. |
| Duplo clique / double submit | Desabilitar botões durante `saving` / request, como já em `savingBudgetByCategory`. |
| Largura da tabela em mobile | Scroll horizontal existente; ou menu ⋯ em breakpoint pequeno. |

---

## 10. Checklist de entregáveis *downstream*

- [ ] Story em `docs/stories/` com file list (`Orcamentos.tsx`, `categoryService.ts`, eventual rota backend).  
- [ ] Critérios de aceite fechados para decisões do §8.  
- [ ] Revisão visual rápida (ícones Lucide já usados na app, ex. `Pencil`, `Trash2`) para consistência com tema claro/escuro.

---

*Brief redigido por Atlas (analyst). Não substitui PRD nem story; serve de entrada para alinhamento e estimativa.*
