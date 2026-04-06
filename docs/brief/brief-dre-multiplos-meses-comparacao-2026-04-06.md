# Brief: DRE — **seleção múltipla de meses** para comparação

**Data:** 2026-04-06  
**Origem:** pedido de produto (persona Atlas — analista)  
**Produto:** Meu Financeiro — **Orçamentos** → aba **DRE (visão anual)** (`/orcamentos`, tab DRE)  
**Referência visual:** screenshot atual (barra de meses horizontal, um mês ativo por vez); cópia local em `assets/c__Users_Usu_rio_AppData_Roaming_Cursor_User_workspaceStorage_b524c017799653aecc51a9dda4eee1a8_images_image-f5bddb86-3d78-4a7d-8980-affe3bb4951b.png` (workspace Cursor).

**Documentos relacionados (não substituídos por este brief):**

- `docs/brief/brief-orcamentos-dre-visao-matricial-2026-04-06.md` — visão matricial anual e métricas DRE.  
- `docs/stories/story-fr-orc-dre-p0-backend-api-matriz.md` — backend matriz DRE (quando aplicável).

**Próximos passos típicos:** `@pm` — PRD ou critérios de aceite; `@architect` — modelo de estado `DrePeriod` vs comparação e impacto em `buildDreMatrixViewModel`; `@sm` — story com file list e testes.

---

## 1. Resumo executivo

Hoje, na aba **DRE**, a barra de **período** (`DrePeriodSidebar`) permite escolher **apenas um** entre: um **mês** (Janeiro–Dezembro) ou **Total anual**. O utilizador pretende **selecionar dois ou mais meses** (ex.: **Janeiro e Março**) para **comparar** métricas lado a lado na mesma tabela (Planejado, Realizado, Atingimento, % Receita), sem depender de exportação ou de alternar mês a mês de memória.

Esta evolução é **incremental** sobre a DRE já existente: os dados vêm do mesmo endpoint de matriz (`/categories/budgets/dre-matrix` + `useDreMatrix`); a mudança principal é **estado de seleção**, **layout da tabela** e **regras de agregação por coluna** quando há N meses selecionados.

---

## 2. Problema / oportunidade

| Dimensão | Situação atual | Oportunidade |
|----------|----------------|--------------|
| **Comparação temporal** | Um mês ou agregado anual único. | Ver **2+ meses** na mesma vista para contrastar desvios e pesos. |
| **Tarefa mental** | Memorizar valores ao mudar de mês. | **Colunas agrupadas por mês** (ou blocos) com a mesma semântica por coluna. |
| **Casos de uso** | Análise pontual. | Ex.: comparar **picos sazonais**, **mês corrente vs mês alvo**, **trimestres** escolhidos à mão (seleção livre). |

---

## 3. Utilizadores e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| Utilizador que acompanha orçamento | Comparar **realizado** entre meses distintos. | Selecionar Jan + Mar → ver Realizado e Atingimento por mês na mesma linha de categoria. |
| Utilizador focado em **% Receita** | Ver se o **peso** de uma categoria mudou entre meses. | Duas colunas “% Receita” (uma por mês), cada uma calculada com **receita total daquele mês** (coerência com definição atual). |
| Utilizador em ecrã pequeno | Não perder contexto. | Scroll horizontal ou limite de meses + mensagem clara (ver §8). |

---

## 4. Objetivos (produto)

1. **Comparabilidade:** suportar **mínimo 2 e máximo K** meses selecionados no mesmo ano (K a definir — sugestão: 2–4 no MVP para não explodir largura).  
2. **Previsibilidade:** comportamento explícito para **Total anual** quando o modo comparação está ativo (ex.: incompatível com multi-mês ou coluna extra “Ano” — ver §8.1).  
3. **Consistência:** reutilizar fórmulas existentes de **atingimento** e **% receita** por período, aplicadas **por mês** em cada subcoluna.  
4. **Acessibilidade:** padrão de **seleção múltipla** anunciável (ex.: `aria-pressed` em toggles ou grupo com legenda “Meses selecionados para comparação”).  
5. **Sem regressão:** modo **um único mês** (comportamento atual) permanece disponível como caso especial (ex.: um mês selecionado = vista idêntica à atual).

---

## 5. Proposta de experiência (recomendações)

### 5.1 Modo de interação

- **Opção A (recomendada):** cada mês na barra funciona como **interruptor** (clique adiciona/remove o mês da seleção). Indicador visual: **chip** ou **contorno** nos meses ativos; contador “2 meses” junto ao título.  
- **Opção B:** botão explícito **“Comparar meses”** que abre painel com checkboxes e **Aplicar**.  
- **Ordem das colunas:** ordem **cronológica** dos meses selecionados (independente da ordem dos cliques).

### 5.2 Tabela

- Para **cada mês selecionado**, repetir o bloco de colunas já usado hoje: **Planejado | Realizado | Atingimento | % Receita** (cabeçalho de grupo com nome do mês).  
- **Subtotais** (Receitas, Despesas) e **Resultado**: mesma lógica **por mês** (uma coluna de resultado por mês ou células alinhadas ao bloco).  
- **Destaque** (vermelho/âmbar): aplicar **por mês** como hoje, sem misturar meses numa única cor.

### 5.3 Dados

- Os dados já vêm por **mês** em `DreMatrixCell[]`; não é obrigatório novo endpoint se o cliente já tem o ano completo em memória.  
- Se no futuro existir paginação por mês, alinhar carregamento com a seleção (fora do MVP se o fluxo atual já carrega o ano).

### 5.4 Estado inicial

- Sugestão: ao abrir a aba DRE, manter **um mês** (ex.: mês atual do sistema), como hoje; o utilizador **ativa** o segundo mês para entrar em modo comparação.

---

## 6. Fora de âmbito (explícito)

- Comparar **anos diferentes** (ex.: Jan/2025 vs Jan/2026) — story futura.  
- **Exportação PDF/Excel** dedicada à comparação.  
- **Médias móveis** ou agregações custom (trimestre fixo) além da seleção manual de meses.  
- Alterar definição legal/contabilística de DRE (já fora no brief matricial).

---

## 7. Requisitos de aceite (rascunho para story / PRD)

1. O utilizador pode selecionar **pelo menos dois meses** do **mesmo ano** e ver a tabela DRE com **blocos de colunas** por mês.  
2. Com **um único** mês selecionado, a vista é **equivalente** à atual (layout e métricas).  
3. **Atingimento** e **% Receita** calculam-se **no âmbito de cada mês**, com as mesmas regras de divisão por zero que hoje (`dreMatrix`).  
4. **Total anual** na sidebar: comportamento definido em conjunto com UX (ver §8.1) — sem ambiguidade na UI.  
5. **Teclado e leitor de ecrã:** foco e estado de seleção dos meses são anunciáveis; roving tabindex na barra mantém-se ou é adaptado ao padrão multi-seleção.  
6. **Testes:** unitários para funções de agregação por **conjunto de meses**; testes de UI críticos se o projeto cobrir `DrePeriodSidebar` / `DreMatrixTable`.  
7. **Empty / parcial:** se um mês selecionado não tiver dados, células mostram zeros ou “—” conforme política já usada na DRE.

---

## 8. Decisões em aberto (para PM / UX / arquitetura)

1. **Interação Total anual + multi-mês:** desativar “Total anual” quando há 2+ meses, ou limpar seleção ao escolher anual, ou mostrar anual **em coluna extra** (complexidade maior).  
2. **Limite máximo de meses (K)** e mensagem quando o utilizador tenta exceder.  
3. **Mobile:** limite mais baixo (ex.: 2 meses) ou vista alternativa (cards empilhados).  
4. **Tipo `DrePeriod`:** evoluir para `DrePeriod = { kind: 'months'; months: number[] } | { kind: 'annual' }` ou estado paralelo `selectedMonths: number[]` — impacto direto em `buildDreMatrixViewModel` e testes em `dreMatrix.test.ts`.  
5. **Persistência:** query string (`?dreMonths=1,3`) para partilhar link — nice-to-have.

---

## 9. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Tabela muito larga | Cap K; scroll horizontal com **primeira coluna (categoria) fixa**; tipografia compacta só se já for padrão. |
| Confusão entre “soma de meses” e “comparação” | Título dinâmico: ex. “Janeiro 2026 · Março 2026”; não somar métricas incompatíveis numa única coluna sem rótulo. |
| Regressão no modo mês único | Testes de snapshot ou contrato de `buildDreMatrixViewModel` para `period` mês único. |

---

## 10. Referência de implementação (brownfield)

| Área | Ficheiros relevantes |
|------|----------------------|
| Barra de período | `frontend/src/components/orcamentos/DrePeriodSidebar.tsx` — hoje **single-select** + `aria-current`. |
| Painel DRE | `frontend/src/components/orcamentos/DreBudgetPanel.tsx` — `useState<DrePeriod>(...)`. |
| View model | `frontend/src/utils/dreMatrix.ts` — `DrePeriod`, `aggregateCategoryPeriod`, `buildDreMatrixViewModel`. |
| Tabela | `frontend/src/components/orcamentos/DreMatrixTable.tsx` — extensão para N blocos de colunas. |
| API | `frontend/src/services/categoryService.ts` — `fetchDreMatrix` / `dre-matrix`. |

---

## 11. Checklist de entregáveis *downstream*

- [ ] PRD ou addendum com decisões do §8 fechadas.  
- [ ] Spec UX (limite K, anual vs meses, mobile).  
- [ ] Story em `docs/stories/` com critérios mensuráveis e file list.  
- [ ] Atualização de testes `dreMatrix.test.ts` e, se existir, testes de componente da sidebar/tabela.

---

*Brief redigido por Atlas (analyst). Não substitui PRD nem story; serve de entrada para alinhamento e estimativa.*
