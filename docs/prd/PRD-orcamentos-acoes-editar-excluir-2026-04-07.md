# PRD — Orçamentos: ações **Editar** e **Excluir** por linha (aba Por mês)

**Versão:** 1.0  
**Data:** 2026-04-07  
**Tipo:** Brownfield — evolução da área **Orçamentos** (frontend; reutilização de API existente)  
**Fonte canónica do pedido:** [`docs/brief/brief-orcamentos-acoes-editar-excluir-2026-04-07.md`](../brief/brief-orcamentos-acoes-editar-excluir-2026-04-07.md)

**Relação com outros artefatos:**

- **Contexto produto:** [`docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`](PRD-meu-financeiro-produto-brownfield-2026-03-26.md).  
- **Mesma página:** [`docs/prd/PRD-orcamentos-dre-visao-matricial-2026-04-06.md`](PRD-orcamentos-dre-visao-matricial-2026-04-06.md) — modo DRE deve permanecer **coerente** com alterações de orçamento no modo mensal (§5.3 do brief).  
- **Implementação atual:** `frontend/src/pages/Orcamentos.tsx`; `frontend/src/services/categoryService.ts` (`saveCategoryBudget`, `fetchCategoryBudgetsSummary`, …); `backend/src/services/categories.service.js` (`upsertCategoryBudget`); `backend/src/routes/categories.routes.js`.  
- **Downstream:** story em `docs/stories/`; QA regressão aba **Por mês** + spot-check **DRE**.

---

## 1. Resumo executivo

Na aba **Por mês** de `/orcamentos`, o utilizador já pode **alterar o valor planejado** por categoria através de um **campo inline** na coluna “Planejado” (persistência em `onBlur`). Não existe, contudo, uma **coluna de ações** nem um fluxo explícito de **remoção** do orçamento daquela categoria **para o mês selecionado**, o que prejudica a **descoberta** da edição e impede um caminho claro para “desfazer” um planejamento sem apagar movimentos ou categorias.

Este PRD **fecha** as decisões em aberto do brief, define requisitos rastreáveis (**FR-ORC-ACT-***), critérios de aceite (**AC-ORC-ACT-***), NFRs e escopo MVP para: (1) **Editar** — atalho que conduz à edição do planejado na própria linha; (2) **Excluir** — remoção do **planejamento mensal** com confirmação, via contrato já suportado pelo backend (`valor_orcado` nulo no mês/categoria).

---

## 2. Análise brownfield

| Aspeto | Estado atual |
|--------|----------------|
| **Listagem** | `fetchCategoryBudgetsSummary` + filtro de apresentação `valor_orcado > 0` em `Orcamentos.tsx`. |
| **Criar / atualizar** | `POST /categories/budgets` → `upsertCategoryBudget`; `parseValorOrcado` aceita `null` e persiste `valor_orçado` nulo na tabela `orçamentos`. |
| **Edição UX** | Input monetário na coluna Planejado; `handleBudgetBlur` chama `saveCategoryBudget`. |
| **Exclusão** | Sem botão; **sem** rota `DELETE` dedicada a orçamentos. |
| **DRE** | Dados anuais / matriz derivados dos mesmos orçamentos; linhas com planejamento nulo devem **não** exibir planejado positivo naquele mês. |

**Lacuna de produto:** ações **visíveis e consistentes** com “Novo Orçamento” / “Duplicar mês anterior”, mais **cópia** que distingue “remover orçamento do mês” de “apagar categoria” ou “apagar lançamentos”.

---

## 3. Visão e objetivos

**Visão:** O ecrã **Orçamento por Categoria** é um **gestor de linhas** do plano mensal: além de criar e duplicar, o utilizador **edita com clareza** e **remove o planejamento** de uma linha quando já não faz sentido para aquele mês.

**Objetivos:**

1. Aumentar a **descoberta** da edição do planejado sem obrigar o utilizador a “adivinhar” que o campo é editável.  
2. Oferecer **exclusão segura** do **valor orçado** da categoria **no mês atualmente selecionado**, com confirmação e feedback.  
3. Manter **paridade de dados** com a aba **DRE** e com duplicação de meses (sem regressões nos totais).  
4. **Não** alargar o MVP a novo endpoint **salvo** decisão explícita de arquitetura (§11).

---

## 4. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| Descoberta | Edição só evidente após foco no input. | **Editar** explícito (foco no campo da linha). |
| Remoção | Sem caminho para “tirar esta categoria do orçamento deste mês”. | **Excluir** + confirmação + atualização de cartões e tabela. |
| Expectativa | Risco de confundir com exclusão de categoria ou de movimentos. | Cópia canónica no diálogo (§10). |
| Consistência | Ações globais já existem no topo da página. | Coluna **Ações** alinha o modelo mental **por linha**. |

---

## 5. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| Utilizador casual | Corrigir ou remover um orçamento errado. | **Excluir** → confirma → linha desaparece; cartões atualizam; categoria volta a **Novo Orçamento** para o mesmo mês. |
| Utilizador que prefere botões | Editar sem explorar a célula. | **Editar** → foco no input Planejado da linha; altera e sai (blur/Enter) → gravação como hoje. |
| Utilizador cauteloso | Evitar cliques acidentais. | Diálogo com nome da categoria e mês/ano; botão destrutivo claro. |

**Stakeholders:** PO (cópia), UX (densidade mobile), Frontend, QA; **Backend** apenas se a decisão §8.2 evoluir para `DELETE` dedicado.

---

## 6. Decisões de produto (fechamento do brief §8)

| Tema | **Decisão MVP (canónica neste PRD)** | Notas |
|------|--------------------------------------|--------|
| **6.1 — Modo Editar** | **Opção A:** botão/ícone **Editar** que **foca** o `input` da coluna **Planejado** da mesma linha (opcional: `select()` no valor numérico editável). **Sem** modal dedicado na V1. | Reduz escopo e reutiliza validação/salvamento existentes. Modal (Opção B) fica **fora do MVP** salvo pedido explícito de UX. |
| **6.2 — Semântica de Excluir** | **Remover o planejamento** enviando `saveCategoryBudget(userId, categoriasId, null, monthStartDate)` — ou seja, **mesmo** `POST /categories/budgets` com `valor_orcado: null` e `date` = primeiro dia do mês selecionado. | A linha em `orçamentos` pode permanecer com `valor_orçado` nulo; o produto trata “sem orçamento” como **ausência de valor planejado** para a UI. **Não** é obrigatório `DELETE` HTTP/SQL na V1. |
| **6.3 — Endpoint DELETE dedicado** | **Fora do MVP.** Reabrir apenas se relatórios, admin ou política de dados exigirem remoção física da linha — gate **@architect** + atualização deste PRD. | |
| **6.4 — DRE e outras vistas** | Após exclusão (valor nulo), a categoria **não** deve aparecer como linha com **planejado &gt; 0** na tabela **Por mês**; na **DRE**, células de **Planejado** para esse mês/categoria refletem **nulo/zero** conforme regras já usadas na agregação (paridade com resumo mensal). | Teste de regressão recomendado (§14). |
| **6.5 — Cópia da confirmação** | Texto canónico em §10.2 (obrigatório para implementação). | |

---

## 7. Escopo

### 7.1 Dentro do escopo (MVP)

- Nova coluna **Ações** à direita da coluna **Status** na tabela **Orçamento por Categoria** (aba **Por mês**).  
- Controlo **Editar** (ícone lápis ou rótulo equivalente) com `aria-label` / `title` descritivos.  
- Controlo **Excluir** (ícone lixeira ou rótulo “Remover planejamento”) com estilo **destrutivo** alinhado ao resto da app.  
- **Diálogo de confirmação** antes de excluir (modal acessível **ou** padrão nativo mínimo **apenas** se o projeto ainda não tiver componente de diálogo — preferência: **modal reutilizável** igual a outras áreas).  
- Chamada a `saveCategoryBudget` com `null` em caso de confirmação; estados de **loading** por linha nos botões durante o pedido; **toast** sucesso/erro (`toast` existente).  
- Atualização da lista e dos **três cartões** (Total planejado, Realizado, Excesso) após sucesso.  
- **Acessibilidade:** rótulos ARIA nas ações; foco gerível após fechar modal; área de toque ≥ 44px onde o layout permitir.  
- **Testes:** pelo menos um teste que cubra fluxo de exclusão (mock de API) **se** o repositório já usar RTL/Vitest nesta página ou padrão equivalente; teste de contrato backend **se** alterar payload (MVP não exige mudança de rota).

### 7.2 Fora do escopo (MVP)

- `DELETE /categories/budgets` ou remoção física da linha em `orçamentos`.  
- Exclusão em massa (multi-select).  
- Desfazer (undo) após excluir.  
- Alterar o comportamento do **modo DRE** para além da **consistência de dados** com o modo mensal.  
- Menu “⋯” compacto em mobile (**P2** — opcional se a tabela já tiver scroll horizontal aceitável).

---

## 8. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-ORC-ACT-01** | Na aba **Por mês**, cada linha da tabela com orçamento ativo exibe, na coluna **Ações**, controlos **Editar** e **Excluir** (ou equivalente acessível com os mesmos efeitos). | P0 |
| **FR-ORC-ACT-02** | **Editar** move o foco para o campo **Planejado** da **mesma** linha, permitindo alterar o valor com o mesmo comportamento de gravação já existente (blur / Enter). | P0 |
| **FR-ORC-ACT-03** | **Excluir** abre confirmação com o **texto canónico** do §10.2, identificando **categoria** e **mês/ano** selecionados. | P0 |
| **FR-ORC-ACT-04** | Ao confirmar exclusão, o cliente chama `saveCategoryBudget` com `valor_orcado: null` e `date` coerente com o mês visível (**AC-ORC-ACT-01**). | P0 |
| **FR-ORC-ACT-05** | Após exclusão bem-sucedida, a linha **deixa de ser listada** na tabela (coerente com `valor_orcado > 0`), os **cartões de resumo** recalculam e aparece toast de sucesso (**AC-ORC-ACT-02**). | P0 |
| **FR-ORC-ACT-06** | A categoria excluída do planejamento **volta a estar disponível** no fluxo **Novo Orçamento** para o **mesmo** mês/ano, se não tiver outro orçamento positivo (**AC-ORC-ACT-03**). | P0 |
| **FR-ORC-ACT-07** | Em erro de rede ou API, o utilizador vê mensagem de erro (toast) e o estado da UI **não** assume sucesso (**AC-ORC-ACT-04**). | P0 |
| **FR-ORC-ACT-08** | Durante pedido de exclusão (e, se aplicável, durante salvamento inline já existente na mesma linha), os controlos de ação **destrutiva** ficam **desabilitados** ou ignoram cliques repetidos (**AC-ORC-ACT-05**). | P0 |
| **FR-ORC-ACT-09** | Não há regressão nos fluxos **Novo Orçamento**, **Duplicar mês anterior**, mudança de **mês/ano** nem no carregamento inicial (**AC-ORC-ACT-06**). | P0 |
| **FR-ORC-ACT-10** | (P1) Após exclusão, ao abrir **DRE** para o mesmo ano, o **Planejado** daquele mês/categoria **não** reapresenta o valor antigo (paridade com fonte de dados) (**AC-ORC-ACT-07**). | P1 |

### 8.1 Critérios de aceite (testáveis)

| ID | Critério |
|----|----------|
| **AC-ORC-ACT-01** | Dado mês M e categoria C com orçamento &gt; 0, ao confirmar exclusão, o payload enviado ao backend inclui `categorias_id` = C, `valor_orcado` = `null`, `date` = primeiro dia de M no fuso/ formato já usado por `getMonthStartDate()`. |
| **AC-ORC-ACT-02** | Após resposta OK, a linha de C não aparece na tabela até que um novo orçamento &gt; 0 seja criado; totais dos três cartões coincidem com a soma das linhas remanescentes. |
| **AC-ORC-ACT-03** | O diálogo **Novo Orçamento** lista C entre as categorias elegíveis para M após exclusão. |
| **AC-ORC-ACT-04** | Se a API falhar, a linha permanece e o valor planejado visível não é limpo sem confirmação do servidor. |
| **AC-ORC-ACT-05** | Duplo clique rápido em Excluir não gera estado inconsistente (um único fluxo ativo ou requests serializados). |
| **AC-ORC-ACT-06** | Testes manuais ou automatizados cobrem regressão dos botões do cabeçalho e dos seletores de período. |
| **AC-ORC-ACT-07** | (P1) Cenário DRE: para o mês M, célula de planejado de C reflete ausência de plano após exclusão (conforme implementação atual de agregação). |

---

## 9. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|--------|
| **NFR-ORC-ACT-01** | **Acessibilidade:** nomes acessíveis nas ações; foco visível; modal (se usado) fecha com Escape e devolve foco de forma previsível. | |
| **NFR-ORC-ACT-02** | **Performance:** mesma ordem de grandeza que um `saveCategoryBudget` atual; sem refetch desnecessário de **todo** o ano. | |
| **NFR-ORC-ACT-03** | **Qualidade:** `npm run lint`, `npm run typecheck`, `npm test` nos pacotes alterados, conforme `AGENTS.md`. | |
| **NFR-ORC-ACT-04** | **Segurança:** mesma autenticação que as rotas atuais de categorias/orçamentos; sem exposição de dados de outros utilizadores. | |

---

## 10. Experiência de interface

### 10.1 Componentes

| Elemento | Diretriz |
|----------|----------|
| **Coluna Ações** | Cabeçalho **“Ações”** ou cabeçalho vazio com `scope="col"` e texto sr-only “Ações”, se a equipa preferir só ícones. |
| **Editar** | Ícone **Pencil** (Lucide) ou equivalente já usado na app; cor neutra; hover/foco visível. |
| **Excluir** | Ícone **Trash2** ou equivalente; cor destrutiva (ex.: `rose` / token alinhado ao tema). |
| **Mobile** | Manter `overflow-x-auto` da tabela; se em QA a linha ficar ilegível, planear **P2** menu ⋯ (fora MVP). |

### 10.2 Cópia canónica — confirmação de exclusão

- **Título (sugestão):** `Remover planejamento deste mês?`  
- **Corpo (obrigatório incluir variáveis):**  
  `Isto remove apenas o valor planejado de **{nome da categoria}** em **{mês por extenso} de {ano}**. Os seus lançamentos e o valor realizado **não** são apagados. **Não** é a mesma coisa que excluir a categoria.`  
- **Botões:** `Cancelar` (secundário), `Remover planejamento` (destrutivo).  

*(Ajustes finos de microcopy podem ser feitos pelo PO desde que preservem os três esclarecimentos: só planejamento do mês; não apaga movimentos; não apaga categoria.)*

### 10.3 Toasts (sugestão)

- **Sucesso:** `Planejamento removido.`  
- **Erro:** reutilizar padrão genérico já usado em `Orcamentos.tsx` para falhas de gravação.

---

## 11. Restrições técnicas e integração

| Tema | Diretriz |
|------|----------|
| **API MVP** | Reutilizar `POST /categories/budgets` com `valor_orcado: null` e `date` opcional já suportada por `saveCategoryBudget`. |
| **Frontend** | Preferência por **refs** por `categorias_id` para focar o input da linha; evitar duplicar lógica de parse/format de moeda. |
| **Backend** | Sem alteração obrigatória na V1. Se no futuro existir `DELETE`, atualizar este PRD e o contrato OpenAPI / doc técnica. |
| **Duplicar mês** | O serviço já filtra orçamentos com `valor_orçado` não nulo na origem; comportamento após exclusão permanece válido. |

---

## 12. Compatibilidade e regressão

| ID | Requisito |
|----|-----------|
| **CR-ORC-ACT-01** | Comportamento da coluna **Planejado** (edição inline) **mantém-se** para quem não usa o botão Editar. |
| **CR-ORC-ACT-02** | Endpoints existentes de resumo anual / DRE **não** alteram semântica pública salvo bugfix acordado. |
| **CR-ORC-ACT-03** | Admin ou outras páginas que listem orçamentos **não** são escopo deste PRD; regressão apenas se código partilhado for tocado. |

---

## 13. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Utilidade | Redução de pedidos de suporte do tipo “como apago o orçamento da categoria X” (se houver canal); ou validação qualitativa em UAT. |
| Qualidade | Zero regressões P0 nos fluxos §7.1 e **DRE** (P1). |
| Acessibilidade | Sem violações novas críticas em verificação manual ou axe (se integrado). |

---

## 14. Riscos e mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Confusão com “excluir categoria” | Erro de utilizador / stress | Cópia §10.2; ícone/rótulo **não** igual ao de exclusão de categoria sem contexto. |
| Double submit | Duplicar requests | FR-ORC-ACT-08; desabilitar durante fetch. |
| Paridade DRE | Dados “fantasma” | AC-ORC-ACT-07; QA explícito. |

---

## 15. Épico e histórias sugeridas

**Épico:** “Orçamentos — ações por linha (editar / remover planejamento)”.

| # | História (título sugerido) | Valor |
|---|----------------------------|-------|
| 1 | UI: coluna Ações + Editar (foco no input) + Excluir com modal e `saveCategoryBudget(null)` | MVP |
| 2 | Testes RTL / E2E smoke na página Orçamentos (exclusão + regressão cabeçalho) | Qualidade |
| 3 | (P1) Checklist QA: DRE após exclusão | Paridade |

**File list provável (indicativa):** `frontend/src/pages/Orcamentos.tsx`; eventual componente de diálogo reutilizado; `frontend/src/services/categoryService.ts` (apenas se for necessário wrapper ou tipo); **sem** `categories.routes.js` na V1.

---

## 16. Glossário

| Termo | Significado neste PRD |
|-------|------------------------|
| **Planejamento / orçamento da linha** | Valor `valor_orcado` &gt; 0 para a categoria no mês selecionado. |
| **Excluir** | Remover esse planejamento (persistir `null`), **não** apagar `categorias_id` nem `lancamentos_id`. |
| **Editar** | Atalho para o mesmo mecanismo de edição inline já existente. |

---

## 17. Histórico de versões

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-07 | Morgan (PM) | Versão inicial a partir do brief; decisões §6 fechadas para MVP. |

---

*PRD redigido por Morgan (Product Manager). Critérios mensuráveis: §8 e §8.1. Implementação: @dev; breakdown fino: @sm.*
