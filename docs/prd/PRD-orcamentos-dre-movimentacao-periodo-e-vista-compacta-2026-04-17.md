# PRD — Orçamentos: **DRE — linhas por movimentação/orçamento no período** e **vista compacta do comparativo**

**Versão:** 1.0  
**Data:** 2026-04-17  
**Tipo:** Brownfield — evolução da aba **DRE (visão anual)** em `/orcamentos` (frontend; **sem** novo endpoint obrigatório se o contrato `dre-matrix` existente for suficiente)  
**Fonte canónica do pedido:** `docs/brief/brief-dre-categorias-movimentacao-mes-e-comparativo-sucinto-2026-04-17.md`

**Relação com outros artefatos:**

- **Deriva de** o brief acima — este PRD **fecha** as decisões dos §§5.1–5.3 do brief.  
- **Alinha-se a** `docs/prd/PRD-orcamentos-dre-visao-matricial-2026-04-06.md` — fórmulas de **Atingimento**, **% Receita**, grupos (Receitas / Despesas), **Resultado (realizado)** e realce **mantêm-se** no modo **Completo**.  
- **Alinha-se a** `docs/prd/PRD-orcamentos-dre-comparacao-multiplos-meses-2026-04-06.md` — modo **multi-mês** continua a repetir blocos de métricas por mês; este PRD altera **quais linhas aparecem** por período e **quantas colunas** o utilizador vê por defeito.  
- **Contexto produto:** `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`.  
- **Implementação de referência:** `frontend/src/utils/dreMatrix.ts` (`buildDreMatrixViewModel`, elegibilidade de categorias), `DreMatrixTable.tsx`, `DreBudgetPanel.tsx`; backend `listCategoryBudgetsDreMatrix` em `backend/src/services/categories.service.js`.  
- **Downstream:** story em `docs/stories/` (**@sm**), UX copy / tokens (**@ux-design-expert** se necessário), nota técnica se houver gap de dados (**@architect**).

**Disclaimer:** “DRE” = **mapa de resultado pessoal** (orçado vs realizado), não documento fiscal.

---

## 1. Resumo executivo

Dois problemas motivam esta entrega:

1. **Linhas desalinhadas do período:** a elegibilidade actual no cliente usa **`isCategoryEligibleInYear`** (actividade em **qualquer** mês do ano), o que pode mostrar **categorias com valores zero no mês M** só porque houve movimento ou orçamento **outro** mês — em contradição com a expectativa “**movimentação do mês**”.

2. **Comparativo denso:** quatro subcolunas por período (**Planejado**, **Realizado**, **Atingimento**, **% Receita**) aumentam a carga cognitiva; o utilizador pede leitura **mais curta**, mantendo o par orçado vs realizado como foco.

Este PRD define requisitos rastreáveis (**FR-DRE-PER-***, **FR-DRE-CMP-***), critérios de aceite (**AC-DRE-PER-***, **AC-DRE-CMP-***), decisão canónica de **inclusão de linha** no período e o **modo de visualização** compacto **vs** completo.

---

## 2. Visão de produto (experiência)

- O utilizador continua na **aba DRE**, com **sidebar de meses**, **Total anual** e **comparação multi-mês** já existentes.  
- **Mês único ou cada bloco em multi-mês:** a lista de categorias reflecte **apenas** quem tem **orçamento ou movimento naquele sub-período** (definição §5.1).  
- **Total anual:** a lista inclui categorias com orçamento ou movimento **em qualquer mês do ano** ao agregar o ano (equivalente à união mensal sob a mesma regra §5.1).  
- **Vista compacta:** por defeito (ou mediante controlo explícito — §5.2), o utilizador vê **menos colunas** numéricas, priorizando **Planejado** e **Realizado**; as percentagens permanecem disponíveis no modo **Completo**.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|------------|
| Confiança na lista | Sensação de “só quem tem orçamento” ou linhas irrelevantes no mês. | Critério **claro e por período**: orçado **ou** realizado naquele intervalo. |
| Fantasmas no mês | Linha visível em M com tudo zero em M por causa de outro mês. | Filtrar elegibilidade por **`DrePeriod`** (mês / ano / cada coluna em compare). |
| Colunas | Quatro métricas competem pela atenção. | **Modo Compacto** com duas colunas principais; modo **Completo** para análise fina. |

---

## 4. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| Utilizador com gastos não orçados | Ver **toda** a despesa/receita do mês na DRE. | Categoria com lançamentos **sem** `valor_orcado` no mês **aparece** com Realizado correcto e Planejado 0/“—”. |
| Revisor mensal | Focar **quanto gastou vs plano** sem percentagens logo à frente. | Modo **Compacto**: só Planejado e Realizado; alternar para **Completo** para Atingimento e % Receita. |
| Comparação multi-mês | Coerência por coluna. | Cada mês seleccionado mostra apenas linhas com actividade **naquele** mês (regra §5.1 aplicada por coluna). |

**Stakeholders:** PO (cópia do toggle e mensagens), UX (hierarquia visual, breakpoint), Frontend, QA (regressão mês único, anual, compare), Backend (apenas se forem necessários ajustes ao `dre-matrix`).

---

## 5. Decisões de produto (fechamento do brief)

### 5.1 Inclusão de linha por período (canónico)

| Tema | **Decisão MVP** | Notas |
|------|-----------------|--------|
| **Regra “mostrar categoria”** | **Opção B (brief):** incluir linha se, **no período seleccionado**, **`realizado ≠ 0` OU `planejado > 0`** (com `planejado` = soma de `valor_orcado` do período no view model, coerente com `aggregateCategoryPeriod`). | Não adoptar **só** movimentação estrita (opção A), para **não ocultar** categorias **só planeadas** ainda sem lançamento no mês. |
| **Período = um mês** | Avaliar elegibilidade **apenas** com base nas células desse **mês** (receitas: `valor_recebido`; despesas: `valor_gasto`; orçado: `valor_orcado`). | Substitui a lógica “qualquer mês do ano” do `isCategoryEligibleInYear` para este caso. |
| **Período = Total anual** | Categoria incluída se a regra §5.1 se verifica **no agregado anual** (soma dos 12 meses): `realizado_anual ≠ 0` **ou** `planejado_anual > 0`. | Alinha com expectativa de ver **todo** o ano; equivalente a “há actividade em algum mês” sob B. |
| **Período = multi-mês (compare)** | Para **cada** coluna de mês, lista de linhas **independente** segundo §5.1 **só para esse mês**; o layout “largo” continua a alinhar linhas pelo `categorias_id` (comportamento actual de *zip*), mas **não** mostrar linha nessa coluna se a categoria for inelegível **naquele** mês — células **vazias/zero** ou **“—”** conforme política já usada para ausência de dados na célula. | Se o produto preferir **ocultar** a linha inteira se **todos** os meses visíveis forem inelegíveis, tratar como **P1** opcional; **MVP** mantém alinhamento por categoria com células vazias onde não há actividade. **Actualização:** para evitar linhas “órfãs” só com traços, o MVP deve **filtrar** linhas para a união das categorias elegíveis em **pelo menos um** dos meses comparados (cada categoria aparece se for elegível em ≥1 mês seleccionado); células dos meses sem actividade mostram **0** / **—** coerente com `DreMatrixCell` ausente. Esta decisão **fecha** a ambiguidade: **linha na tabela compare** ⇔ elegível em **algum** mês do conjunto; **células** do mês sem actividade ⇔ zeros/“—”. |

*Nota de implementação:* a tabela actual pode assumir o mesmo conjunto de linhas para todos os `models`; a story deve explicitar se o view model passa a incluir **máscara por mês** ou **lista unificada** com células neutras — **@architect** / **@sm**.

**Refinamento para compare (MVP):**  
- **FR canónico:** em modo compare, o conjunto de **categorias** mostradas é a **união** das categorias que satisfazem §5.1 em **pelo menos um** dos meses seleccionados.  
- Para o mês em que a categoria **não** satisfaz §5.1, **Planejado** = 0, **Realizado** = 0 (e percentagens “—” onde aplicável).

### 5.2 Vista compacta do comparativo (canónico)

| Tema | **Decisão MVP** | Notas |
|------|-----------------|--------|
| **Modos** | **Compacto** (por defeito na primeira visita à aba DRE **após** deploy desta feature **ou** por defeito global — preferência: **defeito = Compacto**) e **Completo**. Controlo: **toggle** “**Simples**” / “**Completo**” (rótulos finos na story; i18n pt-BR). | **Simples** mostra **apenas** **Planejado** e **Realizado** por período (por mês ou anual). **Completo** mostra as **quatro** colunas como hoje. |
| **Persistência** | Preferência guardada em **`localStorage`** (chave por utilizador ou global à app — **@architect**), com *fallback* Compacto se vazio. | Evita repetir cliques. |
| **Resultado e subtotais** | **Subtotais** e linha **Resultado (realizado)** mostram **sempre** as colunas visíveis no modo actual: em **Simples**, apenas **Planejado** e **Realizado** nas células correspondentes (sem forçar colunas escondidas). | A linha Resultado continua a ser **só** derivada de realizados (colunas “—” onde hoje já existem para métricas não aplicáveis). |
| **“Sem orçamento”** | Em modo **Completo**, quando `planejado = 0` e `realizado > 0` na linha, **Atingimento** permanece **“—”** (alinhado ao PRD matricial §6.1); opcionalmente, **tooltip** na célula Realizado: *“Sem valor orçado neste período.”* — **P1** se não couber no MVP. | Modo Simples não exige novo texto obrigatório. |

### 5.3 Dados e API

| Tema | **Decisão MVP** | Notas |
|------|-----------------|--------|
| **Endpoint** | **Sem** novo endpoint se `GET /categories/budgets/dre-matrix?year=` continuar a devolver células para `(categoria, mês)` com orçamento **ou** movimento. | Se *discovery* mostrar categorias com movimento em falta por **match** nome/classificação, abrir **bug / story** de dados separada. |
| **Backend** | Alterações **opcionais** e justificadas apenas se o contrato actual for insuficiente (**@architect**). | |

---

## 6. Escopo

### 6.1 Dentro do escopo (MVP)

- Nova regra de **elegibilidade por período** (§5.1) no *build* do view model DRE.  
- Comportamento correcto para **mês único**, **Total anual** e **comparação multi-mês** (§5.1 nota compare).  
- Toggle **Simples / Completo** com persistência (**§5.2**).  
- Regressão: fórmulas **Atingimento** e **% Receita** inalteradas no modo **Completo**.  
- Testes unitários actualizados / novos para `dreMatrix` (casos de elegibilidade e modos de período).  
- Documentação da story: **File List**, ACs, qualidade (`lint`, `typecheck`, `test`).

### 6.2 Fora do escopo (MVP)

- Novo motor de orçamento ou alteração da modelação fiscal de DRE.  
- Exportação PDF/Excel específica da vista compacta.  
- Redesenho completo da tabela (novos *cards* no lugar da grelha).  
- Query string para modo Simples/Completo (roadmap P2).  
- Trabalho profundo de **match** lançamento ↔ categoria **salvo** se bloquear ACs (então *spike* / story à parte).

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-DRE-PER-01** | Para **período** `{ kind: 'month', month: M }`, uma categoria aparece na lista de Receitas ou Despesas **se e só se** `realizado(M) ≠ 0` **ou** `planejado(M) > 0` para essa categoria (§5.1). | P0 |
| **FR-DRE-PER-02** | Para **período** `{ kind: 'annual' }`, uma categoria aparece **se e só se** a soma ao longo dos 12 meses cumpre §5.1 no agregado (planejado anual > 0 **ou** realizado anual ≠ 0). | P0 |
| **FR-DRE-PER-03** | Em **modo comparação multi-mês**, o conjunto de linhas é a **união** das categorias elegíveis em **pelo menos um** mês seleccionado; por célula de mês sem actividade sob §5.1, valores monetários **0** e percentagens **“—”** conforme regras existentes. | P0 |
| **FR-DRE-PER-04** | Categorias **sem** tipo entrada/saída válido continuam **excluídas** (paridade com lógica actual). | P0 |
| **FR-DRE-CMP-01** | O utilizador pode alternar entre vista **Simples** (só Planejado e Realizado por período) e **Completo** (quatro colunas). | P0 |
| **FR-DRE-CMP-02** | A preferência **Simples/Completo** é **persistida** entre sessões (**localStorage** ou equivalente acordado). | P0 |
| **FR-DRE-CMP-03** | O valor por defeito ao **primeiro** uso (sem chave guardada) é **Simples**. | P0 |
| **FR-DRE-CMP-04** | Modo DRE mantém-se **somente leitura** para edição de orçamentos (PRD matricial). | P0 |

### 7.1 Critérios de aceite (testáveis)

| ID | Critério |
|----|----------|
| **AC-DRE-PER-01** | Dados de teste: categoria com **realizado** no mês M e **sem** orçamento em M **aparece** na DRE em mês M com **Realizado** correcto e **Planejado** 0 (ou “—” se a formatação actual usar traço para zero orçado). |
| **AC-DRE-PER-02** | Categoria **sem** movimento **nem** orçamento no mês M **não** aparece** na lista em vista mês M. |
| **AC-DRE-PER-03** | Categoria com actividade **apenas** em mês ≠ M **não** aparece na vista **só** M (mês M isolado). |
| **AC-DRE-PER-04** | Vista **Total anual**: categoria com qualquer actividade em **algum** mês do ano aparece; **subtotais** e **Resultado** batem com a soma das linhas (tolerância de arredondamento já usada nos testes). |
| **AC-DRE-PER-05** | Modo **compare** com meses A e B: categoria com actividade só em A aparece na tabela; coluna B mostra **0** / **—** coerente para essa categoria em B. |
| **AC-DRE-CMP-01** | Em **Simples**, cabeçalhos de dados **não** incluem **Atingimento** nem **% Receita**; em **Completo**, as quatro colunas são visíveis e alinhadas ao PRD matricial. |
| **AC-DRE-CMP-02** | Recarregar a página **mantém** o último modo seleccionado. |
| **AC-DRE-CMP-03** | Regressão: `npm run lint`, `npm run typecheck`, `npm test` nos pacotes afectados; fluxo **Por mês** em `/orcamentos` sem regressão funcional. |

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|--------|
| **NFR-DRE-PER-01** | **Performance** | Sem aumento obrigatório de chamadas HTTP; reutilizar `dre-matrix` por ano. |
| **NFR-DRE-CMP-01** | **Acessibilidade** | O toggle Simples/Completo tem **rótulo acessível** (`aria-pressed` ou padrão equivalente); estrutura de tabela mantém **cabeçalhos** correctos para o número de colunas visíveis. |
| **NFR-DRE-CMP-02** | **i18n** | Strings novas em **pt-BR**. |
| **NFR-DRE-PER-02** | **Manutenção** | Centralizar elegibilidade numa função testável (ex.: `isCategoryEligibleInPeriod`) para evitar divergência entre modos. |

---

## 9. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Completude percebida | Em teste com utilizador ou UAT interno, **0** casos de “falta categoria com gasto no mês” quando há lançamento e categoria correctamente associada. |
| Clareza | Redução subjectiva de confusão com **menos colunas** no modo Simples (opcional: inquérito rápido pós-lançamento). |
| Estabilidade | Zero regressão nos ACs do PRD multi-mês **no modo Completo**. |

---

## 10. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Compare com união de linhas e células vazias | Confusão visual | Tooltip ou *copy* curta “Sem movimento neste mês” **P1**; MVP aceita zeros se documentado na story. |
| Match categoria ↔ lançamento | Dados incorrectos | Spike / bug separado; testes com dados reais anonimizados. |
| Regressão a11y ao mudar colunas | Exclusão | **NFR-DRE-CMP-01** + verificação manual com leitor de ecrã nas duas vistas. |

---

## 11. Priorização e dependências

| Onda | Conteúdo | IDs |
|------|----------|-----|
| **P0 — MVP** | Elegibilidade por período; compare união; toggle Simples/Completo + persistência; testes | FR-DRE-PER-01–04, FR-DRE-CMP-01–04; AC-DRE-PER-01–05, AC-DRE-CMP-01–03 |
| **P1** | Tooltips “Sem orçamento” / “Sem movimento neste mês” | Nice-to-have |

**Dependências:** PRD matricial (fórmulas); PRD multi-mês (layout); brief 2026-04-17.

---

## 12. Entregáveis downstream

1. Story em `docs/stories/` com **AC-DRE-PER-*** e **AC-DRE-CMP-***, **File List**, e decisão explícita sobre implementação de **união de linhas** no compare (tabela única *vs* máscaras).  
2. Actualização opcional da UX spec DRE (toggle, estados).  
3. Testes em `dreMatrix.test.ts` (e componentes se aplicável).

---

## 13. Histórico de versões (Change Log)

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-04-17 | 1.0 | Versão inicial a partir do brief DRE movimentação + comparativo sucinto; §§5.1–5.2 fechados | PM (Morgan) |

---

*PRD redigido para permitir implementação sem ambiguidade entre elegibilidade por período e vista compacta, em continuidade com a DRE matricial e multi-mês.*
