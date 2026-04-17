# Brief: DRE — **categorias com movimentação no mês** e **comparativo mais sucinto**

**Data:** 2026-04-17  
**Origem:** pedido de produto (persona Atlas — analista)  
**Produto:** Meu Financeiro — **Orçamentos** → aba **DRE (visão anual)** (`/orcamentos`, tab DRE)  
**Referência visual:** screenshot atual (tabela mensal com colunas Planejado, Realizado, Atingimento, % Receita); cópia local em `assets/c__Users_Usu_rio_AppData_Roaming_Cursor_User_workspaceStorage_b524c017799653aecc51a9dda4eee1a8_images_image-3db40fe4-8e2c-4d30-9e47-31c3d9698546.png` (workspace Cursor).

**Documentos relacionados (não substituídos por este brief):**

- `docs/brief/brief-orcamentos-dre-visao-matricial-2026-04-06.md` — visão matricial e métricas DRE.  
- `docs/prd/PRD-orcamentos-dre-comparacao-multiplos-meses-2026-04-06.md` — comparação multi-mês.  
- Implementação: `frontend/src/utils/dreMatrix.ts`, `DreMatrixTable.tsx`, `DreBudgetPanel.tsx`; backend `listCategoryBudgetsDreMatrix` em `backend/src/services/categories.service.js`.

**Próximos passos típicos:** `@pm` — PRD ou critérios de aceite; `@architect` — regras de elegibilidade por período vs contrato `dre-matrix`; `@ux-design-expert` — layout do comparativo; `@sm` — story com file list e testes.

---

## 1. Resumo executivo

O utilizador pretende duas melhorias na **DRE**:

1. **Cobertura de linhas (por mês):** a tabela não deve parecer limitada a categorias **com orçamento**; deve incluir **todas as categorias com movimentação no mês selecionado** (lançamentos/realizado relevante para o período), para o mapa de resultado refletir a realidade das transações mesmo sem linha de orçamento naquele mês.

2. **Comparativo:** as colunas de comparação (**Planejado**, **Realizado**, **Atingimento**, **% Receita**) são percecionadas como **densas e confusas**; pretende-se uma leitura **mais curta e clara**, mantendo o valor principal (orçado vs realizado) sem sobrecarga cognitiva.

---

## 2. Problema / oportunidade

| Dimensão | Situação percebida | Oportunidade |
|----------|-------------------|--------------|
| **Completude das linhas** | Utilizador associa a lista a “só quem tem orçamento” e deixa de confiar na DRE para ver **todo** o gasto/receita do mês. | Tornar explícito e correto o critério: **linhas = categorias com atividade relevante no período** (definir “atividade” abaixo). |
| **Escopo temporal da elegibilidade** | No frontend, `isCategoryEligibleInYear` marca categoria elegível se **em qualquer mês do ano** houver orçamento ou movimento (`dreMatrix.ts`), o que pode **mostrar linhas no mês M com tudo zero em M** só porque houve movimento/outro mês. | Para vista **mensal**, alinhar elegibilidade ao **mês (ou meses) selecionado(s)** — coerente com “movimentação **do** mês”. |
| **Fonte de dados** | O endpoint `GET /categories/budgets/dre-matrix` já emite célula quando `hasBudget \|\| valorGasto ≠ 0 \|\| valorRecebido ≠ 0` (comentário em `categories.service.js`). | Validar em discovery se há **lacunas** (ex.: classificação de lançamento vs nome de categoria, categorias sem match). |
| **Comparativo** | Quatro subcolunas por período exigem varredura horizontal e interpretação de percentagens (incl. “—” quando plano = 0). | **Reduzir colunas visíveis por defeito**, **agrupar métricas derivadas**, ou **progressive disclosure** (detalhe sob pedido). |

---

## 3. Objetivos de produto

1. **Fidelidade ao mês:** Na seleção **de um mês** (e, por extensão, comparação multi-mês já existente), as linhas de Receitas/Despesas devem corresponder a categorias com **movimentação ou orçamento naquele intervalo**, conforme regra de negócio fechada no PRD (ver §5.1).

2. **Transparência:** Se uma categoria tiver **só movimento** e **sem orçamento** no mês, o utilizador deve ver **Realizado** e compreender **Planejado** como vazio/zero/“—” de forma consistente (sem parecer erro).

3. **Legibilidade:** O “comparativo” deve priorizar **uma leitura rápida** (ex.: orçado vs realizado + um indicador único de desvio), com percentagens secundárias acessíveis mas não competindo com o valor monetário.

4. **Continuidade brownfield:** Reutilizar `dre-matrix` e o view model atual sempre que possível; alterações de contrato só com justificação em `@architect`.

---

## 5. Proposta e decisões em aberto (para PRD/UX)

### 5.1 Definição de “incluir linha” no mês (a fechar com PO)

Candidatos (escolher **um** como canónico):

- **A — Movimentação estrita:** incluir se `realizado ≠ 0` no mês (receita ou despesa conforme tipo).  
- **B — Movimentação ou orçamento:** incluir se `realizado ≠ 0` **ou** `valor_orcado > 0` no mês (reflete intenção + execução).  
- **C — Igual a B, mas orçamento anual espelhado no mês:** apenas se o produto distribuir orçamento de outra forma (hoje a matriz é por mês).

O pedido do utilizador enfatiza **movimentação**; recomenda-se **B** para não esconder linhas “só planeadas” ainda sem lançamento, **salvo** se o PO quiser priorizar apenas **A**.

### 5.2 Vista anual e subtotais

- **Total anual:** a elegibilidade deve agregar **12 meses** (categoria aparece se tiver atividade em **qualquer** mês do ano **ou** critério alinhado ao §5.1 aplicado ao agregado anual).  
- Garantir que **subtotais e % Receita** continuam coerentes com as definições existentes nos PRDs matriciais.

### 5.3 Comparativo mais sucinto (direções de UX — escolher no PRD)

Sugestões não exclusivas:

- **Coluna única “Real vs plano”:** mostrar realizado + desvio % numa célula (ex.: `R$ X · 112 %`) com legenda/tooltip.  
- **Ocultar por defeito:** `Atingimento` e/ou `% Receita` atrás de “Detalhes” ou ícone de expansão por linha.  
- **Modo compacto:** *toggle* “Simples | Completo” na toolbar da DRE.  
- **Menos “—”:** quando `planejado = 0` e `realizado > 0`, rotular explicitamente “Sem orçamento” ou ocultar atingimento em vez de traço genérico.

### 5.4 Critérios de aceite (rascunho para QA)

- **AC-DRE-MOV-01:** Dado um mês M com lançamento numa categoria **sem** orçamento em M, essa categoria **aparece** na DRE em modo mês M com **Realizado** correto.  
- **AC-DRE-MOV-02:** Dado mês M, uma categoria **sem** orçamento e **sem** movimento em M **não** aparece (para a definição §5.1 escolhida).  
- **AC-DRE-MOV-03:** Alternar entre meses não mostra “linhas fantasmas” com todos os valores zero no mês atual por causa apenas de outro mês no ano (ajuste de `isCategoryEligibleInYear` → elegibilidade por período).  
- **AC-DRE-UX-01:** Em modo “simples”, o número de colunas numéricas visíveis é menor ou a hierarquia visual deixa claro o par **Planejado / Realizado** antes das percentagens.

---

## 6. Riscos e dependências

- **Matching categoria ↔ lançamento:** se `classificacao` e nome de categoria divergirem, movimentos podem não surgir na célula esperada — pode exigir revisão de normalização (`normalizeCategoryName`) ou modelo de dados.  
- **Multi-mês:** qualquer mudança na elegibilidade deve ser testada em `variant === 'compare'` (`DreMatrixTable`).  
- **Acessibilidade:** reduzir colunas não pode remover rótulos ou relações de cabeçalho exigidas por leitores de ecrã.

---

## 7. Fora de âmbito (sugestão)

- Alterar definição fiscal de DRE ou exportação para contabilidade.  
- Novo motor de orçamento fora do fluxo mensal existente, salvo necessidade comprovada pelo `@architect`.
