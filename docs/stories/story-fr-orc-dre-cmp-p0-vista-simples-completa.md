# Story — FR-DRE-CMP (P0): Orçamentos — DRE **vista Simples / Completa** (densidade + persistência)

**ID:** STORY-FR-ORC-DRE-CMP-P0-UI-DENSIDADE  
**Prioridade:** P0 (Must — PRD onda MVP)  
**Depende de:** [story-fr-orc-dre-per-p0-elegibilidade-periodo-uni-compare.md](./story-fr-orc-dre-per-p0-elegibilidade-periodo-uni-compare.md) — *recomendado* (merge e revisão mais simples; não há dependência de domínio estrita)  
**Também assume:** [story-fr-orc-dre-mul-p0-frontend-comparacao-multiplos-meses.md](./story-fr-orc-dre-mul-p0-frontend-comparacao-multiplos-meses.md) — tabela `single` / `compare`  
**Bloqueia:** —  
**Fonte:** `docs/prd/PRD-orcamentos-dre-movimentacao-periodo-e-vista-compacta-2026-04-17.md` (FR-DRE-CMP-01–04, AC-DRE-CMP-01–03, NFR-DRE-CMP-01–02)  
**Especificação UX:** `docs/specs/ux-spec-orcamentos-dre-movimentacao-periodo-e-vista-compacta-2026-04-17.md` (§§4–6, checklist QA §12)  
**Arquitetura:** `docs/technical/architecture-orcamentos-dre-movimentacao-periodo-e-vista-compacta-2026-04-17.md` (§5)

## User story

**Como** utilizador na aba **DRE**,  
**quero** alternar entre uma vista **Simples** (só Planejado e Realizado) e **Completa** (com Atingimento e % Receita), com a minha preferência **guardada**,  
**para** ler o comparativo mais depressa ou aprofundar percentagens quando precisar.

## Contexto técnico

- **Tipo:** `DreTableDensity = 'simples' | 'completo'`.  
- **Persistência:** `localStorage`, chave `meu-financeiro:dre-table-density`; defeito **`simples`** sem chave (PRD §5.2, UX §3.2). Valor **inválido** ou desconhecido na leitura → tratar como **`simples`** (mesmo defeito que chave ausente; opcionalmente **corrigir** ou **remover** a chave inválida ao persistir de novo).  
- **Hook:** `useDreTableDensity()` — estado + *sync* storage (arquitetura §5.2); validação de enum na leitura.  
- **UI:** *segmented control* na **barra de densidade** acima do layout sidebar + tabela (UX §4.1), dentro do `planner-card`.  
- **`DreMatrixTable`:** prop `density`; **3** ou **5** colunas (*single*); **1+2N** ou **1+4N** (*compare*); `colSpan` em `GroupHeader`, `SubtotalRow`, linha Resultado (UX §6.1).  
- **Tooltips (`TOOLTIPS` em `DreBudgetPanel`):** no modo **Completo**, manter `title`/ajuda nas colunas **Atingimento** e **% Receita** como hoje; no modo **Simples**, **não** aplicar esses tooltips a células **inexistentes** (apenas Planejado / Realizado recebem conteúdo interactivo com ajuda, se houver).  
- **A11y:** `aria-pressed` ou *radiogroup*; `aria-live="polite"` ao mudar modo (UX §5.3, NFR-DRE-CMP-01).  
- **Sem alterar** dados nem *fetch* ao trocar densidade.

## Critérios de aceite

### Funcional (FR-DRE-CMP-01, AC-DRE-CMP-01)

- [ ] Controlo **Simples** / **Completo** visível na área DRE (UX §4.1).  
- [ ] **Simples:** cabeçalhos de dados **sem** Atingimento e **sem** % Receita; só **Planejado** e **Realizado** por bloco de período.  
- [ ] **Simples:** **sem** células ocultas com `title` das métricas removidas (tooltips de Atingimento / % Receita **só** no modo **Completo** — ver contexto técnico).  
- [ ] **Completo:** **quatro** colunas de métricas como hoje (paridade PRD matricial / modo anterior).  
- [ ] Aplica-se a **mês único**, **Total anual** e **comparação multi-mês** (incl. `colSpan` correcto para N meses — UX §6.1).

### Persistência e defeito (FR-DRE-CMP-02–03, AC-DRE-CMP-02)

- [ ] Primeira visita **sem** chave no `localStorage`: modo **Simples**.  
- [ ] Valor **inválido** ou não reconhecido na chave (ex.: texto arbitrário): comportamento **equivalente** a chave ausente — UI em modo **Simples** (defeito seguro).  
- [ ] Recarregar a página **mantém** o último modo **válido** seleccionado (Simples ou Completo).

### Orçamentos (FR-DRE-CMP-04)

- [ ] DRE continua **só leitura** para edição de valores orçados (fluxo no separador **Por mês**).

### Acessibilidade (NFR-DRE-CMP-01)

- [ ] Grupo de controlo com nome acessível; estado do modo anunciável; anúncio **sr-only** ao mudar densidade (mensagens UX §5.3).  
- [ ] Estrutura de `<table>` válida para o número de colunas visíveis (`scope` / cabeçalhos).

### i18n (NFR-DRE-CMP-02)

- [ ] *Copy* nova em **pt-BR** (rótulos Simples, Completo, legenda opcional).

### Qualidade (AC-DRE-CMP-03)

- [ ] `npm run lint`, `npm run typecheck`, `npm test` nos pacotes afectados.  
- [ ] Regressão: separador **Por mês** em `/orcamentos` sem alteração de comportamento.  
- [ ] Modo **Completo:** regressão visual aceitável *vs* estado pré-story (quatro colunas, compare multi-mês).

## Tasks (implementação)

1. [x] Criar `useDreTableDensity` (ou equivalente) + constante `STORAGE_KEY`; leitura com validação (`simples` | `completo`); inválido → `simples`.  
2. [x] Inserir barra **Simples / Completo** em `DreBudgetPanel` (UX §3.1–4.1).  
3. [x] Passar `density` a `DreMatrixTable`; ramificar cabeçalhos, células de dados, subtotais, resultado, `GroupHeader` `colSpan`.  
4. [x] Modo compare: ajustar segunda linha de `<thead>` e `colSpan` por mês (2 *vs* 4 subcolunas).  
5. [x] Região `aria-live` para mudança de modo (mensagens curtas — UX).  
6. [x] (Opcional) Teste RTL mínimo ou *snapshot* de número de colunas.  
7. [ ] QA manual: **§ Verificação manual sugerida** abaixo (incl. valor inválido no storage, se testável sem tooling extra).  
8. [x] `npm run lint`, `npm run typecheck`, `npm test`.

## Mitigações revisão QA (pós-implementação)

- **Região `aria-live` separada para densidade:** `DreBudgetPanel` usa dois `role="status"` com `aria-label` distintos (período/meses vs. mensagem ao alterar Simples/Completo) e `announceDensity` com *timer* próprio — evita misturar anúncios com o limite de meses.
- **Teste RTL:** `DreBudgetPanel.test.tsx` cobre radiogroup + anúncio na região de densidade após clicar em Completo.

## Fora de escopo

- Query string para densidade (P2 — PRD).  
- Tooltips P1 “Sem valor orçado neste período” (PRD §5.2).

## File list (checklist implementação)

- [x] `frontend/src/hooks/useDreTableDensity.ts` (nome acordado no *review*)  
- [x] `frontend/src/components/orcamentos/DreBudgetPanel.tsx`  
- [x] `frontend/src/components/orcamentos/DreBudgetPanel.test.tsx` (testes densidade / a11y)  
- [x] `frontend/src/components/orcamentos/DreMatrixTable.tsx`  
- [x] (se necessário) `frontend/src/components/orcamentos/DrePeriodSidebar.tsx` — **sem** mudança esperada

## Verificação manual sugerida (densidade + persistência)

Passos reutilizáveis para QA ou evidência na PR:

1. **Defeito Simples:** com chave `meu-financeiro:dre-table-density` **ausente** (ou após limpar só esta chave), abrir `/orcamentos` → DRE: controlo em **Simples** e tabela com **duas** métricas por período.  
2. **Alternar para Completo:** quatro colunas visíveis; subtotais e resultado com **quatro** colunas de dados onde aplicável hoje.  
3. **Recarregar** a página: modo **Completo** mantém-se.  
4. **Comparação multi-mês** (≥2 meses): repetir em **Simples** (2 subcolunas por mês) e **Completo** (4 subcolunas por mês); confirmar `colSpan` e *scroll* / coluna fixa conforme UX §12.  
5. **Total anual:** alternar Simples/Completo e confirmar número de colunas.  
6. **Storage inválido (opcional):** definir manualmente `meu-financeiro:dre-table-density` para um valor que **não** seja `simples` nem `completo` (ex.: `lixo`); ao recarregar, UI deve assumir **Simples**.  
7. **Opcional (evidência):** *screenshot* Simples vs Completo na mesma vista na descrição da PR.

## Definition of Done

- Checklist UX §12 da spec (toggle, colunas, sticky, a11y, persistência) verificado em desktop e *viewport* estreito; **§ Verificação manual sugerida** executada.  
- Gates de qualidade verdes.  
- Modo **Completo** indistinguível do comportamento anterior de métricas (quando Completo seleccionado).
