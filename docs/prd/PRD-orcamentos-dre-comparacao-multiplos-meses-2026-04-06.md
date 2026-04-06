# PRD — Orçamentos: **DRE — comparação com múltiplos meses**

**Versão:** 1.0  
**Data:** 2026-04-06  
**Tipo:** Brownfield — evolução da aba **DRE (visão anual)** em `/orcamentos` (frontend; sem novo endpoint obrigatório no MVP)  
**Fonte canónica do pedido:** `docs/brief/brief-dre-multiplos-meses-comparacao-2026-04-06.md`

**Relação com outros artefatos:**

- **Deriva de** o brief acima — este PRD **fecha** as decisões listadas no §8 do brief.  
- **Alinha-se a** `docs/prd/PRD-orcamentos-dre-visao-matricial-2026-04-06.md` — fórmulas de **Atingimento**, **% Receita**, grupos (Receitas / Despesas / Resultado), realce e política de linhas elegíveis **mantêm-se por mês**; este PRD acrescenta **seleção múltipla** e **layout multi-coluna**.  
- **Contexto produto:** `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`.  
- **Implementação de referência:** `DrePeriodSidebar.tsx`, `DreBudgetPanel.tsx`, `dreMatrix.ts`, `DreMatrixTable.tsx`, `categoryService` (`dre-matrix`).  
- **Downstream:** atualização ou addendum à UX spec DRE (se existir), story em `docs/stories/` (**@sm**), detalhe de tipos/view model (**@architect**).

**Disclaimer:** Igual ao PRD DRE matricial — “DRE” = **mapa de resultado pessoal** (orçado vs realizado), não documento fiscal.

---

## 1. Resumo executivo

Na aba **DRE**, o utilizador só consegue ver **um período de cada vez**: um **mês** ou **Total anual**. Para comparar (ex.: **Janeiro vs Março**) tem de alternar meses e memorizar valores.

Este PRD define o MVP de **comparação lateral**: seleção de **dois a K meses** do **mesmo ano**, com **blocos de colunas** repetidos por mês (**Planejado**, **Realizado**, **Atingimento**, **% Receita**), ordem **cronológica**, **sem** alterar a fonte de dados da matriz anual já carregada. Inclui decisões sobre **exclusividade com Total anual**, **limites por largura de ecrã**, **acessibilidade** e **critérios de aceite** testáveis (**FR-DRE-MUL-***, **AC-DRE-MUL-***).

---

## 2. Visão de produto (experiência)

O utilizador continua a usar a **mesma aba DRE** e o **mesmo ano**. A barra de meses passa a suportar:

- **Um mês selecionado:** comportamento **equivalente** ao atual (uma coluna de métricas + título “Mês YYYY”).  
- **Dois ou mais meses selecionados:** **modo comparação** — cabeçalhos agrupados por mês; cada mês aplica as **mesmas regras** que o PRD matricial para esse mês isolado.  
- **Total anual:** **exclusivo** em relação à comparação multi-mês (ver §5).

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| Comparação | Só um período visível. | **N meses** na mesma grelha, lado a lado. |
| Carga cognitiva | Memorizar ao trocar de mês. | **Variação** de Realizado, Atingimento e % Receita **explícita** entre meses. |
| Casos de uso | Análise pontual. | Picos sazonais, mês atual vs mês de referência, conjuntos ad hoc (ex.: meses com eventos). |

---

## 4. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| Orçamentista | Contrastar **realizado** entre meses. | Selecionar Jan + Mar → mesma linha de categoria com dois blocos de métricas. |
| Utilizador de “peso sobre rendimento” | Ver **% Receita** por mês. | Cada bloco usa **receita total realizada desse mês** como denominador (igual ao modo mês único). |
| Utilizador mobile | Legibilidade. | No máximo **2 meses**; scroll horizontal se necessário; primeira coluna fixa mantida. |

**Stakeholders:** PO (cópia de limites e mensagens), UX (estados desabilitado/tooltip), Frontend, QA (a11y, regressão modo mês único e anual).

---

## 5. Decisões de produto (fechamento do brief §8)

| Tema | **Decisão MVP (canónica neste PRD)** | Notas |
|------|--------------------------------------|--------|
| **Interação** | **Opção A (brief):** cada mês na barra é um **interruptor** (toggle): clique **adiciona ou remove** o mês do conjunto selecionado. | Não é obrigatório painel modal “Comparar meses” no MVP. |
| **Ordem das colunas** | **Sempre cronológica** (1→12), **independente** da ordem dos cliques. | Meses duplicados **impossíveis** na UI (conjunto). |
| **Estado inicial** | Ao abrir a aba DRE: **um mês** — o **mês civil atual** se pertencer ao ano selecionado; caso contrário **Janeiro** desse ano (ou manter regra já implementada hoje se diferente — **sem regressão** de comportamento atual preferível: se hoje é “mês atual do sistema”, manter). | Documentar na story o comportamento exacto se o ano selecionado ≠ ano corrente. |
| **Total anual × multi-mês** | **Exclusividade mútua.** (1) Com **2 ou mais meses** selecionados, o controlo **Total anual** fica **desabilitado** (`disabled` + tooltip: ex. *“Para ver o total anual, reduza a um mês ou limpe a seleção.”*). (2) Ao activar **Total anual**, a selecção de meses é **limpa** e a vista passa ao **agregado anual** único (comportamento actual de coluna única anual). (3) Em modo **Total anual**, clicar num **mês** **sai** do anual e passa a haver **apenas esse mês** seleccionado (vista mês único). | Evita coluna “Ano” extra ao lado de N meses no MVP. |
| **Limite K (máx. meses)** | **Desktop / `lg` e acima:** máximo **4** meses em comparação. **Abaixo de `lg`:** máximo **2** meses. | Alinhar breakpoint ao usado em `DrePeriodSidebar` (`min-width: 1024px`). |
| **Exceder K** | Ao tentar seleccionar o **(K+1)-ésimo** mês: **não adicionar**; mostrar **feedback** não bloqueante (ex.: `aria-live` + mensagem curta visível ou toast, conforme padrão da app). | Mensagem sugerida: *“Só é possível comparar até N meses neste ecrã.”* |
| **Um mês vs dois** | **Um** mês seleccionado = **não** é “modo comparação” na cópia; layout **idêntico** ao actual (quatro colunas globais, sem repetir cabeçalho de mês em grupo duplicado desnecessário — se a implementação mantiver estrutura interna de “array de um elemento”, ok desde que **visual e leitores de ecrã** equivalham ao hoje). | **AC-DRE-MUL-02** cobre equivalência. |
| **Fórmulas** | **Por mês e por bloco:** idênticas a `docs/prd/PRD-orcamentos-dre-visao-matricial-2026-04-06.md` §5 e §6.1 para **Atingimento**, **% Receita**, **subtotais**, **Resultado (realizado)** e **realce**. | **Resultado:** para cada mês, `receitas realizadas (mês) − despesas realizadas (mês)`; **não** somar colunas de meses num único “Resultado” sem rótulo. |
| **Dados / API** | **MVP:** **sem** novo endpoint; usar `DreMatrixCell[]` já obtido para o ano (**mesma chamada** que hoje). | Se no futuro a matriz for paginada por mês, rever este PRD. |
| **Modelo de estado (preferência para arquitetura)** | Representação lógica: ou modo **`annual`** ou conjunto **`months`** com 1–K índigos **únicos** ordenados; **não** combinar anual com lista de meses simultaneamente na UI. | Implementação concreta (`DrePeriod` estendido vs estado composto) — **@architect**. |
| **Query string / partilha de URL** | **Fora do MVP** (roadmap P2). | Ex.: `?dreMonths=1,3` numa story futura. |

---

## 6. Escopo

### 6.1 Dentro do escopo (MVP)

- Toggle de seleção por mês na **sidebar / barra de período** da DRE.  
- Vista com **2 a K meses** com **grupo de colunas** por mês: **Planejado | Realizado | Atingimento | % Receita** + rótulo de cabeçalho com **nome do mês e ano** (ou ano no título global, se já existir).  
- **Subtotais** de Receitas e Despesas **por mês** (repetir lógica actual por período).  
- **Linha Resultado (realizado)** **por mês** (valor alinhado ao bloco desse mês).  
- **Realce** (`rose` / `âmbar` / `emerald`) **por célula e por mês**, mesmas regras que `rowHighlights` / PRD matricial.  
- **Total anual** com regras de §5 (exclusividade, desabilitar com 2+ meses).  
- **Acessibilidade:** cada toggle de mês com estado **seleccionado** anunciável (`aria-pressed="true|false"` recomendado); região ou texto **resumido** “Meses seleccionados para comparação” quando ≥2; **navegação por teclado** (setas / Home / End) mantida ou adaptada sem perda de usabilidade.  
- **Responsividade:** NFR abaixo; primeira coluna (categoria) **sticky** mantida em scroll horizontal.  
- **Testes:** unitários para agregação **por mês** e para view model com **N períodos**; regressão **mês único** e **anual**.

### 6.2 Fora do escopo (MVP)

- Comparar **anos diferentes** (ex.: Jan/2025 vs Mar/2026).  
- Exportação PDF/Excel dedicada à comparação.  
- Médias móveis, trimestres fixos automáticos, “cenarios”.  
- Persistência em URL (**§5**).  
- Alterar definição legal de DRE ou regras fiscais.

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-DRE-MUL-01** | Na aba DRE, o utilizador pode **adicionar e remover** meses do ano corrente na barra de período mediante **clique em toggle**, até ao limite **K** definido em §5. | P0 |
| **FR-DRE-MUL-02** | Com **exactamente um** mês seleccionado, a apresentação da tabela e o significado das métricas são **equivalentes** ao comportamento **pré-multi-mês** (mês único). | P0 |
| **FR-DRE-MUL-03** | Com **dois ou mais** meses seleccionados, a tabela exibe **blocos de colunas** por mês em **ordem cronológica**, cada um com as quatro métricas do PRD matricial. | P0 |
| **FR-DRE-MUL-04** | **Atingimento** e **% Receita** são calculados **no âmbito de cada mês**, com as mesmas regras de **divisão por zero** e denominador de receita que o modo mês único (`dreMatrix` / PRD matricial). | P0 |
| **FR-DRE-MUL-05** | **Subtotais** (Receitas, Despesas) e **Resultado (realizado)** existem **por mês** em modo comparação, coerentes com a soma das linhas desse mês. | P0 |
| **FR-DRE-MUL-06** | **Total anual:** ao seleccionar, **limpa** meses e mostra só vista anual; com ≥2 meses, o controlo **Total anual** está **desabilitado** com ajuda contextual; de anual, clicar num mês passa a **só esse mês**. | P0 |
| **FR-DRE-MUL-07** | Ao atingir o limite **K**, tentativa de adicionar outro mês **não altera** a seleção e dispara **feedback** acessível (ex. `aria-live`). | P0 |
| **FR-DRE-MUL-08** | **Realce** condicional aplica-se **independentemente por mês** (sem misturar desvios de meses diferentes numa só cor). | P1 |
| **FR-DRE-MUL-09** | **Sem dados** num mês seleccionado: células seguem a política já usada na DRE (zeros / “—” para percentagens conforme regras existentes). | P0 |
| **FR-DRE-MUL-10** | Modo DRE permanece **somente leitura** para orçamentos (edição no modo mensal), alinhado ao PRD matricial. | P0 |

### 7.1 Critérios de aceite (testáveis)

| ID | Critério |
|----|----------|
| **AC-DRE-MUL-01** | Dados fixos de teste: com Jan e Mar seleccionados, o **Realizado** de uma categoria na coluna Jan igual ao valor obtido ao ver **só Jan** no build anterior (mesmo `cells` + ano). |
| **AC-DRE-MUL-02** | Com um único mês, **snapshot** de labels, totais e número de colunas de dados **equivalente** ao comportamento antes da feature (regressão visual/estrutural acordada na story). |
| **AC-DRE-MUL-03** | Com dois meses, **% Receita** de uma linha no mês M usa como denominador a **soma do realizado das entradas no mês M** (tolerância de arredondamento ±0,1 p.p. vs implementação). |
| **AC-DRE-MUL-04** | **Resultado** do mês M = subtotal receitas realizado (M) − subtotal despesas realizado (M). |
| **AC-DRE-MUL-05** | Com 2 meses seleccionados, **Total anual** não é activável; ao clicar **Total anual** (estando com 0 ou 1 mês), a vista é **só anual** e **nenhum** mês aparece como seleccionado na barra. |
| **AC-DRE-MUL-06** | Em viewport &lt; 1024px, não é possível seleccionar mais de **2** meses; em ≥ 1024px, não mais de **4**. |
| **AC-DRE-MUL-07** | Leitor de ecrã anuncia estado **seleccionado/não seleccionado** por mês e, com ≥2 meses, existe **texto ou legenda** que comunica “comparação” (copy aprovada na story). |
| **AC-DRE-MUL-08** | `npm run lint`, `npm run typecheck`, `npm test` passam nos pacotes tocados; sem regressão nos fluxos da aba **Por mês** em `/orcamentos`. |

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|--------|
| **NFR-DRE-MUL-01** | **Performance** | Sem pedidos HTTP adicionais obrigatórios para cada mês extra na mesma vista (reutilizar dados do ano). |
| **NFR-DRE-MUL-02** | **Layout** | Com N meses, **scroll horizontal** permitido; **primeira coluna** (categoria) **sticky**; não reduzir tipografia abaixo do padrão DRE existente só para caber mais meses. |
| **NFR-DRE-MUL-03** | **Breakpoints** | Limite K conforme §5; ao redimensionar a janela de ≥1024 para &lt;1024 com 3–4 meses seleccionados, política: **truncar** para os **primeiros 2 meses na ordem cronológica** **ou** mostrar aviso e pedir desmarcação — **decisão UX na story** (preferência: manter os **dois primeiros** cronologicamente e `aria-live` a informar). |
| **NFR-DRE-MUL-04** | **Manutenção** | Lógica de métricas **reutiliza** funções existentes em `dreMatrix` por período-mês; evitar duplicar fórmulas na tabela. |
| **NFR-DRE-MUL-05** | **i18n** | Mensagens novas em **pt-BR**, tom alinhado ao resto de Orçamentos. |

---

## 9. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Utilidade | Utilizador completa tarefa de “comparar mês A com B” **sem alternar** abas nem anotar valores externos (teste moderado ou UAT). |
| Qualidade | Zero regressão em **mês único**, **Total anual** e carregamento da matriz. |
| Clareza | Baixa taxa de dúvidas internas sobre **limite K** e **Total anual desabilitado** (opcional pós-lançamento). |

---

## 10. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Tabela larga demais | Frustração, scroll excessivo | K por breakpoint (**§5**); sticky coluna. |
| Confusão “soma de meses” | Interpretação errada do Resultado | **Um resultado por mês**; título/lista de meses explícitos. |
| Regressão a11y em toggles | Exclusão | **AC-DRE-MUL-07**; revisão com checklist WCAG 2.2 AA nos controlos novos. |
| Redimensionar com 4 meses | Estado inválido | **NFR-DRE-MUL-03** + decisão na story. |

---

## 11. Priorização e dependências

| Onda | Conteúdo | IDs |
|------|----------|-----|
| **P0 — MVP** | Toggle meses, 2–K colunas, fórmulas por mês, exclusividade anual, limites, feedback K, subtotais/resultado por mês, regressão mês único | FR-DRE-MUL-01–07, 09–10; AC-DRE-MUL-01–06, 08 |
| **P1** | Realce fino multi-mês se gaps vs mês único | FR-DRE-MUL-08 |
| **P2** | Query string, painel “Comparar meses” | Fora do MVP |

**Dependências:** PRD matricial (fórmulas); story + file list; possível extensão de tipos `DreMatrixViewModel` (**@architect**).

---

## 12. Entregáveis downstream

1. Story em `docs/stories/` com **critérios AC-DRE-MUL-***, **File List** e decisão explícita para **NFR-DRE-MUL-03** (redimensionamento).  
2. Addendum à spec UX DRE (se existir ficheiro dedicado) — toggles, estados desabilitado, mensagens K, foco.  
3. Testes em `dreMatrix.test.ts` (e componentes se aplicável).

---

## 13. Histórico de versões (Change Log)

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-04-06 | 1.0 | Versão inicial a partir do brief DRE multi-mês; decisões §5 fechadas | PM (Morgan) |

---

*PRD redigido para encerrar decisões do brief e permitir story de implementação sem ambiguidade entre comparação mensal e total anual.*
