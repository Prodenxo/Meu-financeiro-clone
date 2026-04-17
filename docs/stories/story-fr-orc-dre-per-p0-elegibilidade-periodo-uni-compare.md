# Story — FR-DRE-PER (P0): Orçamentos — DRE **elegibilidade por período** e **união no compare**

**ID:** STORY-FR-ORC-DRE-PER-P0-DOMINIO  
**Prioridade:** P0 (Must — PRD onda MVP)  
**Depende de:** [story-fr-orc-dre-p0-frontend-modo-dre.md](./story-fr-orc-dre-p0-frontend-modo-dre.md); [story-fr-orc-dre-mul-p0-frontend-comparacao-multiplos-meses.md](./story-fr-orc-dre-mul-p0-frontend-comparacao-multiplos-meses.md) — `dre-matrix`, `DreUiSelection`, compare multi-mês  
**Bloqueia:** [story-fr-orc-dre-cmp-p0-vista-simples-completa.md](./story-fr-orc-dre-cmp-p0-vista-simples-completa.md) — *recomenda-se* concluir esta story antes para reduzir conflitos em `DreBudgetPanel.tsx`  
**Fonte:** `docs/prd/PRD-orcamentos-dre-movimentacao-periodo-e-vista-compacta-2026-04-17.md` (FR-DRE-PER-01–04, AC-DRE-PER-01–05, NFR-DRE-PER-01–02)  
**Especificação UX:** `docs/specs/ux-spec-orcamentos-dre-movimentacao-periodo-e-vista-compacta-2026-04-17.md` (§6.4 compare / linhas da união)  
**Arquitetura:** `docs/technical/architecture-orcamentos-dre-movimentacao-periodo-e-vista-compacta-2026-04-17.md` (§§3–4)

## User story

**Como** utilizador na aba **DRE**,  
**quero** que a lista de categorias reflita **só** quem tem **orçamento ou movimento no período** que estou a ver (mês isolado, total anual ou cada coluna na comparação multi-mês),  
**para** confiar que o mapa de resultado corresponde ao mês (ou meses) seleccionados e não mostrar “linhas fantasmas” só por causa de outro mês no ano.

## Contexto técnico

- **Sem backend novo:** `GET /categories/budgets/dre-matrix` inalterado (PRD §5.3).  
- **Substituir** o critério **`isCategoryEligibleInYear`** no *build* do view model por **`isCategoryEligibleInPeriod`** (PRD §5.1 opção B: `realizado ≠ 0` **ou** `planejado > 0` **no período**).  
- **Compare:** `unionIds = ⋃_m eligible(m)`; cada `buildDreMatrixViewModel(..., { kind: 'month', month: m }, { categoryIdsAllowlist: unionIds })` — ver arquitetura §3.3–4.  
- **Ordenação:** dentro de Receitas e de Despesas, linhas por **`nome` com `localeCompare` pt-BR**, igual ao comportamento actual e à arquitetura §3.3 (evitar regressão de ordem no compare).  
- **Manutenção:** função pura testável centralizada (**NFR-DRE-PER-02**).  
- **Ficheiros previstos:** `dreMatrix.ts`, `dreMatrix.test.ts`, `DreBudgetPanel.tsx` (cálculo de união + passagem de opções ao *build*).

## Critérios de aceite

### Regra de inclusão — mês único (FR-DRE-PER-01, AC-DRE-PER-01–03)

- [ ] Com vista **um mês M**, uma categoria **aparece** em Receitas ou Despesas **se e só se** `realizado(M) ≠ 0` **ou** `planejado(M) > 0` (§5.1).  
- [ ] Categoria com **realizado** em M e **sem** orçamento em M **aparece** com **Realizado** correcto e **Planejado** 0 (ou formatação actual equivalente).  
- [ ] Categoria **sem** movimento **nem** orçamento em M **não** aparece na lista em vista **só** M.  
- [ ] Categoria com actividade **apenas** noutro mês **não** aparece na vista **só** M.  
- [ ] **Estado vazio:** se **não** houver nenhuma categoria elegível no período visível (mês único ou total anual), mantém-se o **empty state** já usado na DRE (`DreBudgetPanel` / `isEmpty` do view model) — **sem** obrigatoriedade de nova *copy* nesta story; o importante é **não** mostrar grelha de categorias vazia **sem** esse estado.

### Total anual (FR-DRE-PER-02, AC-DRE-PER-04)

- [ ] Vista **Total anual:** elegibilidade no **agregado** dos 12 meses (mesma regra §5.1 sobre somas).  
- [ ] **Subtotais** e **Resultado (realizado)** coerentes com a soma das linhas (tolerância de testes existentes).

### Comparação multi-mês (FR-DRE-PER-03, AC-DRE-PER-05)

- [ ] Conjunto de **linhas** = **união** das categorias elegíveis em **pelo menos um** mês seleccionado.  
- [ ] **Ordem:** dentro de cada grupo (Receitas / Despesas), linhas ordenadas por nome **pt-BR** como na vista mês único (arquitetura §3.3).  
- [ ] Categoria com actividade **só** no mês A: **aparece** na tabela; na coluna do mês B **sem** actividade sob §5.1, valores **0** e percentagens **“—”** conforme regras actuais.  
- [ ] **Paridade com modo mês único:** para cada mês *m* do compare, os valores numéricos da categoria nessa coluna são **iguais** aos obtidos ao seleccionar **apenas** *m* (mesmo ano, mesmos dados) — alinhado ao **AC-DRE-MUL-01** da story [story-fr-orc-dre-mul-p0-frontend-comparacao-multiplos-meses.md](./story-fr-orc-dre-mul-p0-frontend-comparacao-multiplos-meses.md).  
- [ ] **Compare + estado vazio:** se a **união** for vazia (caso limite improvável com meses seleccionados), o comportamento segue o *empty state* actual; se houver pelo menos uma categoria na união, a grelha **não** deve ficar sem linhas de dados por erro de *build*.

### Paridade de tipos (FR-DRE-PER-04)

- [ ] Categorias sem tipo entrada/saída válido **excluídas** como hoje.

### Qualidade (NFR-DRE-PER-01)

- [ ] **Sem** chamadas HTTP adicionais; reutilizar `DreMatrixCell[]` do ano.

### Testes automáticos

- [x] `dreMatrix.test.ts` cobre: mês isolado, anual, união de dois meses com categoria só num deles; **ordenação pt-BR em Despesas**; **união vazia** (`isEmpty` com allowlist vazio).

## Mitigações revisão QA (automático)

- **Gap ordenação Despesas:** teste `linhas despesas ordenadas por nome pt-BR` em `dreMatrix.test.ts`.
- **União vazia / empty state no compare:** teste `compare: união vazia — allowlist vazio implica isEmpty`.
- **Semântica `isCategoryEligibleInYear`:** JSDoc em `dreMatrix.ts` (agregado anual vs “qualquer mês”).

## Tasks (implementação)

1. [x] Implementar `isCategoryEligibleInPeriod` + (opcional) `unionEligibleCategoryIds` em `dreMatrix.ts`.  
2. [x] Estender `buildDreMatrixViewModel` com `options?: { categoryIdsAllowlist?: Set<number> }`; ajustar filtro de categorias conforme arquitetura §4.  
3. [x] Actualizar `DreBudgetPanel`: mês único / anual sem allowlist; compare com `unionIds` e N× *build* com allowlist comum.  
4. [x] Remover uso de `isCategoryEligibleInYear` no *build* (ou marcar *deprecated* se ainda referenciado noutros testes).  
5. [x] Testes unitários novos + regressão `dreMatrix.test.ts` (incl. ordenação **pt-BR** se testável de forma estável).  
6. [ ] QA manual (sign-off opcional): **§ Verificação manual sugerida** em browser; paridade coluna vs mês único e empty state **também cobertos por testes** em `dreMatrix.test.ts` (mitigações na secção acima).  
7. [x] `npm run lint`, `npm run typecheck`, `npm test` (frontend).

## Fora de escopo

- Tooltips “Sem movimento neste mês” (P1 — PRD).  
- Alteração ao *match* lançamento ↔ categoria no backend.  
- Vista Simples / Completo — story [story-fr-orc-dre-cmp-p0-vista-simples-completa.md](./story-fr-orc-dre-cmp-p0-vista-simples-completa.md).

## File list (checklist implementação)

- [x] `frontend/src/utils/dreMatrix.ts`  
- [x] `frontend/src/utils/dreMatrix.test.ts`  
- [x] `frontend/src/components/orcamentos/DreBudgetPanel.tsx`  
- [ ] `frontend/src/components/orcamentos/DreMatrixTable.tsx` — **só** se for necessário ajustar *zip* de linhas por `categorias_id` ou `emptyRow` face ao novo allowlist; caso contrário **não** incluir na PR. *(não alterado — `emptyRow` mantém-se como rede de segurança; allowlist comum alinha linhas entre colunas.)*

## Verificação manual sugerida (paridade AC-DRE-MUL-01)

Passos **reutilizáveis** para QA ou evidência na PR (valores concretos dependem dos dados da conta; não são requisitos numéricos novos):

1. Escolher um **ano** e um **mês M** com pelo menos uma categoria com dados.  
2. Na DRE, modo **só M** (um mês seleccionado): para **uma ou duas** linhas (Receitas/Despesas), registar **Planejado** e **Realizado** apresentados.  
3. Passar a **comparação** com **M** e **pelo menos outro** mês **N** (mesmo ano).  
4. Na **coluna do mês M**, confirmar que **Planejado** e **Realizado** dessas mesmas categorias são **iguais** aos do passo 2.  
5. **Opcional (evidência):** na descrição da PR, *screenshot* ou tabela com os valores do passo 2 vs passo 4 para uma categoria.

## Definition of Done

- Critérios de aceite verificados (QA manual: `/orcamentos` → DRE, mês único, anual, compare 2 meses; **§ Verificação manual sugerida** para paridade; empty state quando aplicável; ordem alfabética por grupo).  
- Gates `lint` / `typecheck` / `test` verdes.  
- Sem regressão no layout compare existente (colunas e alinhamento) além do conjunto de linhas.

---

**Notas de refinamento**

- Se `DreMatrixTable` ainda usar `emptyRow` como rede de segurança no *zip*, documentar na PR se ficar redundante com allowlist comum (ver também *file list* acima).
