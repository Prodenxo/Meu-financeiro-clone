# Brief: área **DRE** em Orçamentos (visão matricial estilo referência)

**Data:** 2026-04-06  
**Origem:** pedido de produto / descoberta (persona Atlas — analista)  
**Produto:** Meu Financeiro — **Orçamentos** (`/orcamentos`)  
**Referência visual:** imagem anexada ao pedido (mock de dashboard “Orçamento” com grelha mensal e métricas por coluna); cópia local em `assets/c__Users_Usu_rio_AppData_Roaming_Cursor_User_workspaceStorage_b524c017799653aecc51a9dda4eee1a8_images_image-f594360f-abb5-407d-b0bb-b73b29f71f65.png` (workspace Cursor).

**Estado atual no código (brownfield):**

- Página: `frontend/src/pages/Orcamentos.tsx` — foco em **um mês** de cada vez, lista de categorias com orçado vs realizado, totais e edição de valores orçados.  
- API cliente: `frontend/src/services/categoryService.ts` — `fetchCategoryBudgetsSummary` (mês/ano), `fetchCategoryBudgetsYearly` (orçados por mês no ano), `duplicateMonthlyBudgets`, etc.

**Documentos relacionados (não substituídos por este brief):**

- `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` — contexto geral do produto (quando aplicável a orçamento / finanças pessoais).

**Próximos passos típicos:** `@pm` — PRD ou critérios de aceite finos; `@architect` — contrato de API agregada e modelo de dados DRE; `@sm` — story com tarefas e file list.

---

## 1. Resumo executivo

Pretende-se acrescentar, dentro da experiência de **Orçamentos**, uma **área de DRE** (Demonstração do Resultado do Exercício, no sentido de **mapa de resultado** para o utilizador: receitas, grupos de custo e linhas derivadas) apresentada no **mesmo espírito visual e estrutural** da referência: **grelha larga**, **mês a mês**, **quatro métricas por mês** (planejado, realizado, atingimento, peso sobre receita), **barra lateral de meses** e **cabeçalhos de grupo** coloridos e colapsáveis.

Hoje o ecrã de Orçamentos é **essencialmente mensal e tabular simples**. A DRE proposta é uma **segunda camada de leitura** (aba, secção expansível ou rota filha) que responde à pergunta: *“Como evolui o meu resultado ao longo do ano, linha a linha e grupo a grupo, face ao que planejei?”*

---

## 2. Problema / oportunidade

| Dimensão | Situação atual | Oportunidade |
|----------|----------------|--------------|
| **Horizonte temporal** | Utilizador vê detalhe forte **no mês selecionado**. | Oferecer **visão anual (ou janela de N meses)** com a mesma semântica orçado vs realizado. |
| **Densidade de informação** | Poucas colunas por categoria. | **Matriz** alinhada à referência: por mês, **Planejado**, **Realizado**, **Atingimento (%)**, **% da receita** (ou equivalente definido no §5). |
| **Hierarquia** | Lista plana de categorias (com tipo entrada/saída). | **Grupos DRE** (ex.: receitas operacionais, custos variáveis, despesas operacionais, resultado) com **subtotais** e **expandir/recolher**. |
| **Alertas** | Estados textuais (dentro/acima do orçamento). | **Realce condicional** (ex.: vermelho quando atingimento > 100 % em despesa ou desvios graves), como na referência. |

---

## 3. Utilizadores e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| Utilizador que orça por categoria | Ver **tendência mensal** sem exportar para folha de cálculo. | Selecionar ano → percorrer meses na sidebar → comparar colunas Planejado vs Realizado. |
| Utilizador focado em **% da receita** | Entender **peso** de cada grupo face ao rendimento. | Coluna “% Receita” coerente com total de receitas do período (definição em §5.2). |
| Power user | **Recolher grupos** para impressão ou revisão rápida. | Cabeçalhos de grupo colapsam filhas mantendo subtotal visível (comportamento a especificar na UX spec). |

---

## 4. Objetivos (produto)

1. **Continuidade:** a DRE deve **reutilizar** dados já suportados pelo produto (categorias, orçamentos mensais, movimentos agregados) **sem obrigar** o utilizador a duplicar configuração noutro módulo.  
2. **Legibilidade:** hierarquia clara (grupo → linhas), tipografia e cores consistentes com o design system existente.  
3. **Comparabilidade:** para cada linha e mês, permitir comparar **orçamento** vs **realizado** e derivados (percentagens).  
4. **Escalabilidade:** comportamento estável com **12 meses** e dezenas de linhas (scroll horizontal/vertical, *sticky* de primeira coluna — a confirmar com UX).  
5. **Acessibilidade:** estrutura de tabela semântica ou equivalente, foco e leitores de ecrã (herdar requisitos das specs globais de UX do projeto).

---

## 5. Proposta de experiência (recomendações)

### 5.1 Onde colocar (MVP)

- **Preferência:** dentro de `/orcamentos`, como **segundo modo de visualização** (ex.: *tabs* “Mês atual” | “DRE / Visão anual”) ou **secção** abaixo do bloco atual, para não regressar quem já usa o fluxo mensal.  
- **Alternativa:** subrota `/orcamentos/dre` com o mesmo *shell* de página, se a equipa quiser isolar bundle e permissões.

### 5.2 Conteúdo da grelha (espelho da referência)

Por **mês** (coluna pai) com **quatro subcolunas**:

| Subcoluna | Significado sugerido | Notas |
|-----------|----------------------|--------|
| **Planejado** | Valor orçado para a linha no mês | Já existe via orçamento por categoria/mês (`fetchCategoryBudgetsYearly` + regras de agregação). |
| **Realizado** | Valor efetivo no mês | Entradas: `valor_recebido`; saídas: `valor_gasto` (como em `CategoryBudgetSummary`). |
| **Atingimento** | `Realizado / Planejado` (%) | Tratar divisão por zero (mostrar “—” ou 0 % conforme política de produto). |
| **% Receita** | Peso da linha sobre **receita total do mês** | **Decisão em aberto:** receita = soma de categorias tipo entrada, ou apenas um subconjunto “receita operacional”. Documentar no PRD. |

**Linhas e grupos DRE (MVP sugerido):**

- Mapear **categorias existentes** para **grupos DRE** via metadado futuro (campo em categoria ou tabela de mapeamento) **ou**, na primeira versão, grupos fixos alinhados aos **pilares da referência** (ex.: Essencial, Estilo de vida, Investimentos) **se** o produto já os modelar — caso contrário, usar grupos neutros contábeis: **Receitas**, **Custos/Despesas**, **Resultado**.  
- Linhas de **subtotal** por grupo e **linhas calculadas** (ex.: **Resultado do período** = receitas − despesas) com estilo distinto (negrito, fundo suave).

### 5.3 Cabeçalho e sidebar (referência)

- **Título** da página ou secção: “Orçamento” / “DRE” com ícone coerente com o resto da app.  
- **Seletor de ano** (`< 2026 >`).  
- **Legenda** no topo (ex.: percentagens ou pesos por grupo), **se** o produto mantiver política de alocação tipo 50/30/20 — opcional e dependente de regra de negócio.  
- **Sidebar esquerda:** lista Janeiro–Dezembro + entrada **“Total anual”** que altera o conjunto de colunas exibidas ou mostra agregados (comportamento a fechar em UX spec).  
- **Cabeçalhos de grupo** com cor de fundo suave (verde/azul/amarelo na referência) — mapear para **tokens** do tema (claro/escuro).

### 5.4 Regras de realce (exemplo)

- Para **despesas**: `Realizado > Planejado` → destacar **Realizado** e **Atingimento** (ex.: vermelho) quando `Atingimento` ultrapassa limiar (100 % ou configurável).  
- Para **receitas**: inverter semântica (abaixo do plano pode ser âmbar, acima verde) — alinhar com PO para não confundir.

### 5.5 Dados e performance

- Reutilizar `fetchCategoryBudgetsYearly` e estender backend se for necessário **um único endpoint** que devolva, por ano, por mês e por categoria: `valor_orcado`, `valor_gasto`, `valor_recebido` — evitando **12 chamadas** síncronas na montagem.  
- Cache e estados de carregamento/erro alinhados a `FetchErrorBanner` / `LoadingOverlay` já usados na página.

---

## 6. Fora de âmbito (explícito para evitar creep)

- **Contabilidade oficial** ou exportação legal de DRE (lucro presumido, etc.).  
- **Multi-utilizador / consolidado** de empresa, salvo story futura.  
- **Previsão/ML** de fechamento — apenas dados já existentes na app na V1.

---

## 7. Requisitos de aceite (rascunho para story / PRD)

1. Na área de Orçamentos existe um caminho claro para a **visão DRE** descrita no §5.1.  
2. Com ano selecionado, a grelha mostra **até 12 meses** com as **quatro subcolunas** por mês (§5.2).  
3. **Grupos** aparecem com **subtotais**; linhas folha refletem categorias (ou mapeamento definido).  
4. **Total anual** (sidebar) apresenta agregados corretos ou colunas consolidadas conforme spec UX acordada.  
5. **Formatação monetária** pt-BR e percentagens com precisão acordada (ex.: 1 casa ou inteiro).  
6. **Acessibilidade:** navegação por teclado na sidebar e cabeçalhos de tabela compreensíveis.  
7. **Empty state:** quando não há orçamentos nem movimentos, mensagem honesta e CTA para configurar orçamento no modo mensal.  
8. Testes: pelo menos **unitários** para funções de agregação/percentagem e **teste de UI** crítico se o projeto já usar padrão para páginas semelhantes.

---

## 8. Decisões em aberto (para PM / arquitetura)

1. **Definição canónica de “Receita”** para a coluna **% Receita** (todas as entradas vs subconjunto).  
2. **Modelo de grupos DRE:** fixos no código, configuráveis pelo utilizador, ou derivados de etiquetas/categorias pai.  
3. **Sincronização com a imagem “50/30/20”:** é regra de produto obrigatória ou apenas ilustrativa na referência?  
4. **Edição inline** na grelha DRE vs **somente leitura** na V1 (recomendação: leitura na V1, edição no modo mensal atual).  
5. **Endpoint agregado** vs múltiplas chamadas — impacto em backend e RLS (Supabase), se aplicável.

---

## 9. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Sobrecarga visual em ecrãs pequenos | Scroll horizontal com primeira coluna fixa; considerar “mês único” em *breakpoint* móvel. |
| Inconsistência % Receita | Documentar fórmula na UI (ícone de ajuda) e testes com dados conhecidos. |
| Duplicação de lógica Orçamentos vs Dashboard | Centralizar cálculos em hook ou serviço partilhado (`categoryService` / util). |

---

## 10. Checklist de entregáveis de *downstream*

- [ ] PRD ou atualização de PRD com decisões do §8 fechadas.  
- [ ] `docs/specs/ux-spec-…` com comportamento *sticky*, colapsar grupos, “Total anual”.  
- [ ] Story em `docs/stories/` com file list e critérios de aceite mensuráveis.  
- [ ] Contrato de API (OpenAPI ou documento técnico) se houver endpoint novo.

---

*Brief redigido por Atlas (analyst). Não substitui PRD nem story; serve de entrada para alinhamento e estimativa.*
