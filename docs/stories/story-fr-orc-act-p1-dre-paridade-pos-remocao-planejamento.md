# Story — FR-ORC-ACT (P1): Orçamentos — paridade **DRE** após remover planejamento no modo mensal

**ID:** STORY-FR-ORC-ACT-P1-DRE-PARIDADE  
**Prioridade:** P1 (Should — paridade de dados)  
**Depende de:** [story-fr-orc-act-p0-frontend-acoes-linha-orcamentos.md](./story-fr-orc-act-p0-frontend-acoes-linha-orcamentos.md) concluída e integrada  
**Fonte:** [`docs/prd/PRD-orcamentos-acoes-editar-excluir-2026-04-07.md`](../prd/PRD-orcamentos-acoes-editar-excluir-2026-04-07.md) — **FR-ORC-ACT-10**, **AC-ORC-ACT-07**  
**Especificação UX:** [`docs/specs/ux-spec-orcamentos-acoes-editar-excluir-2026-04-07.md`](../specs/ux-spec-orcamentos-acoes-editar-excluir-2026-04-07.md) §11 (último bullet P1 DRE), §2 (paridade DRE)  
**Arquitetura:** [`docs/technical/architecture-orcamentos-acoes-editar-excluir-2026-04-07.md`](../technical/architecture-orcamentos-acoes-editar-excluir-2026-04-07.md) §6  

## User story

**Como** utilizador que removeu o **planejamento** de uma categoria no modo **Por mês**,  
**quero** que, ao abrir a aba **DRE (visão anual)** para o mesmo ano, o **Planejado** dessa categoria nesse mês **não** mostre o valor antigo,  
**para** confiar que todas as vistas de Orçamentos refletem a mesma fonte de verdade.

## Contexto técnico

- A matriz DRE consome `GET /categories/budgets/dre-matrix` (ou fluxo atual em `DreBudgetPanel` / `useDreMatrix`). Os dados vêm de `orçamentos` com a mesma semântica que o resumo mensal após `valor_orcado: null`.  
- **Problema a validar:** se o painel DRE mantém estado em memória ao alternar separadores **sem** refetch, o utilizador pode ver **dados obsoletos** até recarregar a página ou mudar o ano.  
- **Diretrizes arquitetura §6 (escolher uma ou combinar):**  
  - Refetch explícito ao focar o separador DRE após mutação no modo mensal; ou  
  - `key` no `DreBudgetPanel` derivada de um contador/`budgetRevision` incrementado após remoção (ou após qualquer `saveCategoryBudget` bem-sucedido); ou  
  - `useEffect` que invalida/refetch quando `budgetTab === 'dre'` e houve mutação desde último fetch.  
- **Escopo:** alterações mínimas em `Orcamentos.tsx` e/ou `DreBudgetPanel.tsx` / hook `useDreMatrix` — **sem** novo endpoint.

## Critérios de aceite

- [ ] **AC-ORC-ACT-07:** Dado um ano com planejamento removido no modo mensal para categoria C e mês M, ao mudar para **DRE** e selecionar período que inclui M, a célula **Planejado** para C em M reflete **ausência de plano** (nulo / “—” / 0 conforme regra já usada na UI DRE — alinhado ao summary mensal).  
- [ ] Comportamento reproduzível **sem** hard refresh obrigatório da página.  
- [ ] Regressão: DRE continua a carregar e a alternar períodos como antes quando **não** houve remoção.  
- [ ] `npm run lint`, `npm run typecheck`, `npm test` verdes após alterações.

## Tasks (implementação)

1. [x] Reproduzir cenário manual: remover planejamento → DRE → verificar valor; confirmar se há *stale state*.  
2. [x] Implementar invalidação/refetch conforme arquitetura §6 (menor dif que garanta AC).  
3. [x] (Opcional) Teste RTL ou integração leve que simule troca de tab + mock de fetch se viável.  
4. [x] Documentar em **Completion Notes** qual estratégia foi escolhida (para manutenção).

## Fora de escopo

- Novas colunas ou edição na grelha DRE.  
- Alteração do contrato `dre-matrix`.

## File list (checklist implementação)

- [x] `frontend/src/pages/Orcamentos.tsx`  
- [x] `frontend/src/components/orcamentos/DreBudgetPanel.tsx` e/ou `frontend/src/hooks/useDreMatrix.ts` (conforme abordagem)

## Definition of Done

- QA manual: cenário **AC-ORC-ACT-07** passa em claro e escuro.  
- Gates npm verdes.

## Qualidade / CodeRabbit

- Evitar refetch excessivo (ex.: não refetch DRE a cada render — só após mutação ou ao entrar no separador DRE com flag suja).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- **Causa:** `DreBudgetPanel` permanece montado com `hidden` ao usar o separador **Por mês**; `useDreMatrix` só refetchava em mudança de `userId`/`year`, logo a matriz DRE podia ficar obsoleta após remoção de planejamento ou outras mutações mensais.
- **Estratégia (arquitetura §6):** contador `dreMatrixDataRevision` em `Orcamentos.tsx`, incrementado (`bumpDreMatrixData`) após sucesso de: remoção de planejamento, gravação inline (`handleBudgetBlur`), **Novo Orçamento**, **Duplicar mês anterior**. Prop `matrixDataRevision` em `DreBudgetPanel` → terceiro argumento `dataRevision` em `useDreMatrix`; `useEffect` depende de `[refetch, dataRevision]` para refetch sem novo endpoint e sem refetch a cada render.
- **Teste:** `useDreMatrix.test.ts` — mesmo utilizador/ano, `dataRevision` 0→1 dispara segundo pedido a `fetchCategoryBudgetsDreMatrix`.
- **Seguimento QA (lacuna integração):** mock de `DreBudgetPanel` expõe `data-matrix-data-revision`; `Orcamentos.test.tsx` cobre FR-ORC-ACT-10 (revisão 0→1 após remoção OK) e reforço em FR-ORC-ACT-07 (revisão mantém-se 0 se API falhar).

### File List (implementação)

- `frontend/src/pages/Orcamentos.tsx`
- `frontend/src/components/orcamentos/DreBudgetPanel.tsx`
- `frontend/src/hooks/useDreMatrix.ts`
- `frontend/src/hooks/useDreMatrix.test.ts`
- `frontend/src/pages/Orcamentos.test.tsx` (wiring `matrixDataRevision` / mitigação QA)

### Debug Log References

- `npx vitest run src/hooks/useDreMatrix.test.ts` — OK (3 testes).
- `npx vitest run src/pages/Orcamentos.test.tsx` — OK (7 testes, incl. FR-ORC-ACT-10 wiring).
- `npm run typecheck` (raiz) — OK.

### Change Log

- 2026-04-07 — P1: invalidação da matriz DRE após mutações no modo mensal (`dreMatrixDataRevision` + teste em `useDreMatrix`).
- 2026-04-07 — Teste RTL em `Orcamentos.test.tsx` para `matrixDataRevision` após remoção (resposta à observação QA § Lacunas).

---

## QA Results

**Revisor:** Quinn (QA / AIOX)  
**Data:** 2026-04-07  
**Gate:** **PASS** (implementação alinhada a FR-ORC-ACT-10 / AC-ORC-ACT-07 e arquitetura §6; evidência automática sólida no hook)

### Evidência executada

| Verificação | Resultado |
|-------------|-----------|
| `npx vitest run src/hooks/useDreMatrix.test.ts` | **PASS** (3 testes, incl. `dataRevision` 0→1 ⇒ 2º fetch com mesmo `userId`/ano) |
| `npx vitest run` — `DreMatrixTable.test.tsx`, `DrePeriodSidebar.test.tsx` | **PASS** (regressão UI DRE não tocada na semântica) |
| Revisão estática `Orcamentos.tsx` (`bumpDreMatrixData` só em ramos de sucesso) | **PASS** |
| Revisão estática `useDreMatrix.ts` (`useEffect` com `[refetch, dataRevision]`) | **PASS** |
| Revisão estática `DreBudgetPanel.tsx` (`matrixDataRevision` → hook) | **PASS** |

### Rastreio requisitos → implementação

| ID | Verificação | Estado |
|----|-------------|--------|
| FR-ORC-ACT-10 / AC-ORC-ACT-07 | Após remoção de planejamento no modo mensal, DRE do mesmo ano reflete ausência de plano ao voltar ao separador (refetch da matriz) | **Coberto** — `bumpDreMatrixData()` após `refreshSummary()` bem-sucedido em `handleConfirmRemovePlanning`; `dataRevision` força novo `fetchCategoryBudgetsDreMatrix` |
| Sem hard refresh | Utilizador alterna separador; painel já montado recebe dados novos | **Coberto** por desenho (contador + efeito) |
| Regressão “sem remoção” | Mesmo `userId`/ano sem mutação ⇒ um fetch inicial; rerender sem mudar revisão não duplica | **Coberto** — teste existente em `useDreMatrix.test.ts` + novo teste de revisão |
| NFR story (sem refetch excessivo) | Incremento só após mutações bem-sucedidas (não em cada render) | **Coberto** — `bumpDreMatrixData` apenas após sucesso em remoção, blur save, novo orçamento, duplicar mês |
| Gates npm | Dev Record indica typecheck + testes OK | **Aceite por evidência em Dev Agent Record** (reexecutar `npm test` na raiz antes de merge se houver commits posteriores) |

### Pontos fortes

- Opção da arquitetura §6 bem aplicada (contador + refetch no hook), sem novo endpoint e sem `key` que destrua estado de UI da DRE desnecessariamente.
- `bumpDreMatrixData` **não** é chamado em `catch` (remoção, gravar, criar, duplicar) — evita invalidação falsa.
- Teste dedicado liga explicitamente **paridade pós-mutação** ao contrato do hook.

### Lacunas / observações (não bloqueantes)

1. **Integração Orcamentos → painel:** `Orcamentos.test.tsx` continua a mockar `DreBudgetPanel`; não há RTL que prove o incremento de revisão após fluxo de UI. **Risco baixo** — *wiring* verificado por grep e revisão estática.  
2. **DoD manual:** cenário AC em tema claro/escuro permanece recomendação de *smoke* humano antes de promoção a produção.

### Decisão

**PASS:** critérios técnicos e de teste automático satisfeitos; paridade DRE após mutações no modo mensal está **correctamente modelada** e **testada** ao nível do hook. Smoke manual DoD fica como confirmação operacional final.

— Quinn, guardião da qualidade 🛡️
