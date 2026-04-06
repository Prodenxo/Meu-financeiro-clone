# PRD — Orçamentos: **DRE / visão matricial** (mapa de resultado anual)

**Versão:** 1.0  
**Data:** 2026-04-06  
**Tipo:** Brownfield — evolução da área **Orçamentos** (frontend; possível endpoint agregado conforme arquitetura)  
**Fonte canónica do pedido:** `docs/brief/brief-orcamentos-dre-visao-matricial-2026-04-06.md`  
**Referência visual:** mock “Orçamento” com grelha mensal (imagem no brief; cópia em workspace `assets/…` citada no brief)

**Relação com outros artefatos:**

- **Deriva de** `docs/brief/brief-orcamentos-dre-visao-matricial-2026-04-06.md` — este PRD **fecha** as decisões listadas no §8 do brief.  
- **Contexto produto:** `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`.  
- **Implementação atual:** `frontend/src/pages/Orcamentos.tsx`; `frontend/src/services/categoryService.ts` (`fetchCategoryBudgetsSummary`, `fetchCategoryBudgetsYearly`, etc.).  
- **Downstream:** `docs/specs/ux-spec-orcamentos-dre-…` (UX), story em `docs/stories/`, contrato técnico se houver API nova (**@architect** + **@dev**).

**Disclaimer:** “DRE” aqui designa **mapa de resultado para finanças pessoais** na app (orçado vs realizado por categoria e período), **não** demonstração contabilística legal nem obrigação fiscal.

---

## 1. Resumo executivo

O ecrã **Orçamentos** (`/orcamentos`) cobre bem o **mês corrente** (edição de orçados, lista por categoria). Falta uma **visão anual densa** que responda: *como evolui o meu resultado mês a mês, linha a linha, face ao planeado?*

Este PRD define requisitos rastreáveis (**FR-DRE-***), critérios de aceite (**AC-DRE-***), NFRs e **decisões de MVP** para uma **segunda modalidade** na mesma área: grelha **mês × métricas** (Planejado, Realizado, Atingimento, % Receita), **sidebar** de meses com modo **Total anual**, **grupos hierárquicos** com subtotais e **realce** de desvios — alinhada ao espírito da referência visual, sem duplicar configuração de dados já existente na app.

---

## 2. Visão de produto (experiência)

O utilizador deve **alternar** entre:

1. **Modo mensal (atual):** planear e editar orçamentos do mês.  
2. **Modo DRE / visão anual (novo):** **ler** a matriz anual (e total anual) com comparação planejado vs realizado e percentagens, **sem** obrigar edição na grelha na V1.

A transição deve ser **óbvia** (abas ou equivalente), preservando o fluxo atual para utilizadores habituados.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| Horizonte temporal | Foco forte num único mês. | Visão **12 meses + total anual** com a mesma semântica orçado/realizado. |
| Densidade | Poucas colunas por linha. | **Quatro submétricas por mês** (e por ano no modo total). |
| Hierarquia | Lista plana por categoria. | **Grupos** com subtotais e colapso. |
| Alertas | Estados sobretudo textuais. | **Cor/estilo** para desvios relevantes (despesa acima do plano, receita abaixo do plano). |

---

## 4. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| Orçamentista por categoria | Ver tendência **sem exportar** para folha. | Ano selecionado → percorrer meses na sidebar → comparar Planejado vs Realizado. |
| Utilizador de “peso sobre rendimento” | Ver **% Receita** coerente. | Valores batem com a fórmula do §7.1 (casos de teste com dados conhecidos). |
| Utilizador avançado | Reduzir ruído visual. | Colapsar grupo de despesas mantendo **subtotal** visível (comportamento detalhado na UX spec). |

**Stakeholders:** PO (escopo e cópia), UX (layout, sticky, mobile), Frontend, Backend (se endpoint agregado), QA (a11y, regressão `/orcamentos`).

---

## 5. Decisões de produto (fechamento do brief §8)

| Tema | **Decisão MVP (canónica neste PRD)** | Notas |
|------|--------------------------------------|--------|
| **Definição de “Receita” para % Receita** | **Receita do mês** = soma do **Realizado** de todas as categorias com `tipo === 'entrada'` nesse mês (mesma base que `valor_recebido` agregado por categoria). | Denominador **0** → % Receita mostra **“—”** (ou “N/A”), nunca divisão por zero. |
| **Numerador % Receita (linha)** | Para categoria **entrada:** `Realizado_linha / Receita_mês` (100 % se for a única receita e houver receita). Para categoria **saída:** `Realizado_linha / Receita_mês` (peso da despesa sobre a receita do mês). | Alinha “peso sobre rendimento” do brief; **Resultado** (linha calculada) usa células já definidas na UX spec. |
| **Grupos DRE** | **MVP:** três grupos **derivados automaticamente** do tipo de categoria: **Receitas**, **Despesas**, **Resultado** (bloco calculado por mês: soma receitas realizadas − soma despesas realizadas; opcionalmente também planejado net se UX spec definir). **Sem** metadado novo de “Essencial / Estilo / Investimentos” na V1. | Roadmap: etiquetas ou mapeamento personalizado (**fora deste PRD**). |
| **Legenda 50/30/20** | **Fora do MVP.** A imagem de referência é **inspiração visual**; regra de alocação 50/30/20 **não** é obrigatória na V1. | Story futura se o PO quiser metas globais por pilar. |
| **Edição na grelha DRE** | **Somente leitura** na V1. Orçamentos continuam a ser editados no **modo mensal** atual. | Reduz risco e duplicação de validação. |
| **Dados / API** | **Preferência:** um **único endpoint** (ou query agregada) que devolva, para o ano e utilizador, por `(categoria_id, mês)` os campos necessários a `valor_orcado`, `valor_gasto`, `valor_recebido` — **ou** composição no cliente a partir de APIs existentes **sem** 12 round-trips bloqueantes. Decisão final **@architect**; o PRD exige **uma experiência de carregamento** clara (NFR). | Evitar regressão de performance. |

---

## 6. Escopo

### 6.1 Dentro do escopo (MVP)

- Entrada de UI **“DRE”** ou **“Visão anual”** em `/orcamentos` (aba secundária **recomendada**; subrota aceitável se a equipa preferir isolar código).  
- **Seletor de ano** partilhado ou consistente com o modo mensal.  
- **Grelha:** linhas = categorias com orçamento **ou** movimento no ano (política de linhas vazias na UX spec; predefinição: mostrar categorias que tenham pelo menos um mês com planejado > 0 **ou** realizado ≠ 0).  
- Por **cada mês (1–12):** subcolunas **Planejado**, **Realizado**, **Atingimento (%)**, **% Receita**, com formatação **pt-BR** (moeda; percentagem com **1 casa decimal** ou inteiro — seguir padrão já usado em Orçamentos se existir).  
- **Atingimento:** se `Planejado > 0` → `Realizado / Planejado × 100`; se `Planejado = 0` e `Realizado = 0` → **“—”**; se `Planejado = 0` e `Realizado > 0` → tratar como **100 %+** ou **“—”** conforme UX spec (recomendação: mostrar **“—”** e realce opcional na célula Realizado).  
- **Sidebar:** meses Jan–Dez + **Total anual**; seleção altera o conjunto de colunas visíveis (**um mês** ou **agregado anual** com as mesmas 4 métricas sobre somas do ano).  
- **Grupos** Receitas / Despesas com **subtotais** por mês (ou por ano no modo total); **Resultado** como secção calculada.  
- **Realce condicional:** despesas com `Realizado > Planejado` e `Planejado > 0` → destacar **Realizado** e **Atingimento** (ex.: vermelho); receitas com `Realizado < Planejado` e `Planejado > 0` → destacar com cor de **atenção** (ex.: âmbar); receitas acima do plano → **positivo** (ex.: verde). Tokens do tema claro/escuro.  
- **Estados:** carregamento e erro **reutilizando** padrões da página (`LoadingOverlay`, `FetchErrorBanner` ou equivalentes).  
- **Empty state:** sem dados no ano — mensagem + CTA para o modo mensal / criar orçamento.  
- **Acessibilidade:** tabela semântica ou padrão equivalente; sidebar navegável por **teclado**; cabeçalhos associados às células.

### 6.2 Fora do escopo (MVP)

- DRE fiscal/legal, exportação para contabilidade certificada.  
- Configuração pelo utilizador de **pilares** 50/30/20 ou grupos personalizados.  
- Edição inline de orçados na grelha DRE.  
- Previsões, ML, cenários “o que se”.  
- Consolidação multi-utilizador / empresa.

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-DRE-01** | Na rota de Orçamentos existe um controlo claro (ex.: abas) para alternar entre **modo mensal (existente)** e **modo DRE / visão anual**. | P0 |
| **FR-DRE-02** | No modo DRE, com **ano** selecionado, a grelha apresenta, para o **mês selecionado na sidebar**, as subcolunas **Planejado**, **Realizado**, **Atingimento**, **% Receita** para cada linha de categoria elegível (**AC-DRE-01**). | P0 |
| **FR-DRE-03** | A sidebar lista **12 meses** e a opção **Total anual**; em **Total anual**, as quatro métricas refletem **agregação** do ano conforme §5 (somas; atingimento com base em totais; % Receita com denominador = receita anual total) (**AC-DRE-02**). | P0 |
| **FR-DRE-04** | **Grupos** “Receitas” e “Despesas” agrupam categorias por `tipo`; **subtotais** por grupo são corretos para o período visível (mês ou ano) (**AC-DRE-03**). | P0 |
| **FR-DRE-05** | A secção **Resultado** exibe, por período visível, o **saldo** receitas − despesas com base em **Realizado** (definição exata de linhas auxiliares na UX spec) (**AC-DRE-04**). | P0 |
| **FR-DRE-06** | **% Receita** segue §5 (denominador = receita total do período; tratamento de denominador zero) (**AC-DRE-05**). | P0 |
| **FR-DRE-07** | **Realce** visual aplica as regras de §6.1 para desvio de despesa e de receita (**AC-DRE-06**). | P1 |
| **FR-DRE-08** | **Empty state** e mensagens de erro quando não há dados ou falha de API (**AC-DRE-07**). | P0 |
| **FR-DRE-09** | **Acessibilidade:** navegação por teclado na sidebar; estrutura de cabeçalhos e células compreensível para leitores de ecrã (**AC-DRE-08**). | P0 |
| **FR-DRE-10** | Não há **edição** de valores orçados no modo DRE na V1; alterações continuam no modo mensal (**AC-DRE-09**). | P0 |

### 7.1 Critérios de aceite (testáveis)

| ID | Critério |
|----|----------|
| **AC-DRE-01** | Dado um ano com dados, ao selecionar março na sidebar, os valores da grelha coincidem com as fontes de verdade (API ou regras documentadas) para março. |
| **AC-DRE-02** | Em **Total anual**, a soma dos **Planejados** mensais de uma categoria iguala o agregado exibido (se a API agregar da mesma forma); **Realizado** idem. |
| **AC-DRE-03** | Soma das linhas de despesas = subtotal **Despesas**; soma das receitas = subtotal **Receitas**. |
| **AC-DRE-04** | **Resultado** = total receitas realizadas − total despesas realizadas no período visível. |
| **AC-DRE-05** | Para receita total do mês > 0, % Receita de uma linha = (Realizado_linha / Receita_total) × 100 com tolerância de arredondamento definida na implementação (ex.: ±0,1 p.p.). |
| **AC-DRE-06** | Para despesa com planejado 100 e realizado 150, Realizado e Atingimento usam estilo de **alerta** configurado. |
| **AC-DRE-07** | Sem dados: empty state; falha de rede: mensagem recuperável. |
| **AC-DRE-08** | Checklist a11y da UX spec ou auditoria rápida WCAG 2.2 AA nos controlos novos. |
| **AC-DRE-09** | Campos de edição de orçamento **não** aparecem no modo DRE (apenas leitura). |

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|--------|
| **NFR-DRE-01** | **Performance** | Carregar modo DRE sem congelar a UI; **evitar 12 pedidos sequenciais** para o mesmo ecrã — preferir agregação server-side ou composição eficiente (**§5 decisão API**). |
| **NFR-DRE-02** | **Responsividade** | Desktop primeiro; em **largura reduzida**, scroll horizontal com **primeira coluna (categoria)** fixa ou alternativa equivalente definida na UX spec. |
| **NFR-DRE-03** | **Qualidade** | `npm run lint`, `npm run typecheck`, `npm test` nos pacotes alterados; regressão da rota `/orcamentos`. |
| **NFR-DRE-04** | **Manutenção** | Lógica de agregação e percentagens **centralizada** (hook ou util) para não divergir do Dashboard/outros ecrãs. |
| **NFR-DRE-05** | **i18n** | Rótulos em **pt-BR** alinhados ao resto da app. |

---

## 9. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Utilidade | Utilizadores conseguem identificar **mês com maior desvio** em relação ao plano **sem sair** da app (teste com tarefa moderada ou feedback PO). |
| Qualidade | Zero regressão nos fluxos de **edição mensal** de orçamento. |
| Clareza | **Tooltips** ou texto de ajuda sobre **% Receita** e **Atingimento** com taxa baixa de dúvidas internas pós-lançamento (opcional). |

---

## 10. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Grelha **ilegível** em mobile | Frustração | NFR-DRE-02; modo “um mês” destacado em ecrãs pequenos. |
| **Divergência** de totais vs modo mensal | Perda de confiança | Mesma fonte de dados e testes **AC-DRE-01–02**; util partilhado. |
| Confusão “DRE” = documento legal | Expectativa errada | Disclaimer no §1 e microcopy na UI (“Visão de resultado pessoal”). |
| Sobrecarga de **API** | Lentidão | NFR-DRE-01; endpoint agregado. |

---

## 11. Priorização e dependências

| Onda | Conteúdo | IDs |
|------|----------|-----|
| **P0 — MVP** | Abas/modo DRE, grelha mês + total anual, grupos, subtotais, resultado, empty/erro, leitura apenas, a11y base | FR-DRE-01–06, 08–10 |
| **P1** | Realce condicional refinado, tooltips de fórmula | FR-DRE-07 |
| **Roadmap** | Grupos personalizados, legenda 50/30/20, edição na grelha | Fora deste PRD |

**Dependências:** UX spec; possível migração/API (**@architect**); story com file list (**@sm**).

---

## 12. Entregáveis downstream

1. `docs/specs/ux-spec-orcamentos-dre-visao-matricial-2026-04-06.md` (ou nome alinhado à convenção do repo) — sticky, colapso, breakpoints, **Total anual**.  
2. Story em `docs/stories/` com tarefas, checklist e **File List**.  
3. Documento técnico ou OpenAPI se existir **endpoint** novo.

---

## 13. Histórico de versões

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-06 | PM (Morgan) | Versão inicial a partir do brief Atlas |

---

*PRD redigido para encerrar decisões do brief e permitir especificação UX e story de implementação.*
