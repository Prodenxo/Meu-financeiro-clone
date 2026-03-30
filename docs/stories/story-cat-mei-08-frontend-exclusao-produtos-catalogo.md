# Story — CAT-MEI-08: Frontend — exclusão de serviços/produtos do catálogo NFS-e

**ID:** STORY-CAT-MEI-08  
**Prioridade:** P0  
**Depende de:** [story-cat-mei-06-backend-delete-catalogo-mei.md](./story-cat-mei-06-backend-delete-catalogo-mei.md), [story-cat-mei-04-frontend-pagina-servicos-produtos-catalogo.md](./story-cat-mei-04-frontend-pagina-servicos-produtos-catalogo.md)  
**Fonte:** `docs/prd/PRD-catalogo-mei-exclusao-clientes-produtos-2026-03-30.md` (FR-CAT-11, FR-CAT-12, FR-CAT-13, FR-CAT-14)  
**Especificação UX:** [`docs/specs/ux-spec-catalogo-mei-exclusao-2026-03-30.md`](../specs/ux-spec-catalogo-mei-exclusao-2026-03-30.md) §3–§8 (variante item), §9, §12

## User story

**Como** utilizador com acesso MEI na página de **serviços e produtos do catálogo**,  
**quero** **excluir** um item após **confirmar** num diálogo que mostra discriminação/código e o aviso fiscal (sem anular notas emitidas),  
**para** remover itens obsoletos dos atalhos da NFS-e.

## Contexto técnico

- **API:** método `DELETE` em `meiNotasService.ts` (ou equivalente) para produto, path alinhado ao **CAT-MEI-06**.
- **UI:** `MeiCatalogoServicosProdutos.tsx` — ação por linha/cartão; `MeiCatalogoProdutoModal.tsx` — zona perigosa em **edição** apenas; mesmo padrão de diálogo que **CAT-MEI-07** (reutilizar componente partilhado se existir após 07).
- **Título / corpo do diálogo:** variante UX *“Excluir item do catálogo?”* + resumo do item (discriminação truncada, código se houver) — spec §4.2.
- **FR-CAT-12 / FR-CAT-07:** mesma exigência de sincronização com `GuidesMei` após exclusão.
- **Testes RTL:** espelhar cobertura mínima da CAT-MEI-07 para a entidade produto.

## Critérios de aceite

- [ ] Exclusão **só** após confirmação (FR-CAT-11); *copy* **FR-CAT-13** presente.
- [ ] Pontos de entrada: **lista** + **modal de edição** (zona perigosa).
- [ ] Sucesso e erro tratados como na CAT-MEI-07; lista atualizada sem F5 obrigatório.
- [ ] Mitigação de duplo submit durante o pedido.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` no frontend verdes.
- [ ] Checklist UX §12 aplicável a esta página cumprida.

## Fora de escopo

- Exclusão de clientes (**CAT-MEI-07**).  
- Exclusão em massa.  
- FR-CAT-15.

## File list (checklist implementação)

- [ ] `frontend/src/services/meiNotasService.ts`
- [ ] `frontend/src/services/meiNotasService.test.ts`
- [ ] `frontend/src/pages/MeiCatalogoServicosProdutos.tsx`
- [ ] `frontend/src/components/MeiCatalogoProdutoModal.tsx`
- [ ] Partilha de diálogo com CAT-MEI-07 se aplicável
- [ ] `MeiCatalogoServicosProdutos.test.tsx` e/ou `MeiCatalogoProdutoModal.test.tsx`

## Definition of Done

- QA manual: excluir item → lista e atalhos NFS-e coerentes após refetch acordado.

## Qualidade / CodeRabbit

- Paridade visual e de *copy* com CAT-MEI-07; evitar drift entre dois modais duplicados.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- **API:** `eliminarCatalogoNfseProduto(id)` → `DELETE /mei-notas/catalogo/produtos/:id` (CAT-MEI-06).
- **Copy partilhada:** `meiCatalogoDeleteCatalogShared.ts` (corpo FR-CAT-13 + botões); `meiCatalogoProdutoDelete.ts` (título item §4.2, resumo discriminação truncada + código, zona perigosa).
- **Diálogo:** `MeiCatalogoDeleteCatalogConfirmDialog.tsx` genérico; `MeiCatalogoDeleteClienteConfirmDialog` refatorado para o reutilizar (paridade com CAT-MEI-07, sem drift de layout); `MeiCatalogoDeleteProdutoConfirmDialog.tsx` + `data-testid="mei-delete-produto-confirm"`.
- **Lista:** ação Excluir (ícone + texto) em tabela e cartões; `aria-label` com preview da discriminação.
- **Modal edição:** zona perigosa + `onRequestDelete` → mesmo diálogo de confirmação.
- **Pós-sucesso / erro:** alinhado a CAT-MEI-07 (toast, `loadProdutos`, fecho modais, `role="alert"` no erro, botões desativados durante pedido).
- **FR-CAT-12:** comentário em `GuidesMei.tsx` actualizado (CAT-MEI-08 + clientes); refetch existente em `visibilitychange` / separador NFS-e.
- **Mitigação QA (CONCERNS):** guard `deleteRequestInFlightRef` em `confirmDeleteProduto` (UX §12.3 / duplo clique); RTL §12.2 e §12.3; JSDoc no diálogo genérico e referência §12.7 no copy partilhado.

### File List (implementação)

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/copy/meiCatalogoDeleteCatalogShared.ts`
- `frontend/src/copy/meiCatalogoClienteDelete.ts`
- `frontend/src/copy/meiCatalogoProdutoDelete.ts`
- `frontend/src/components/MeiCatalogoDeleteCatalogConfirmDialog.tsx`
- `frontend/src/components/MeiCatalogoDeleteClienteConfirmDialog.tsx`
- `frontend/src/components/MeiCatalogoDeleteProdutoConfirmDialog.tsx`
- `frontend/src/services/meiNotasService.ts`
- `frontend/src/services/meiNotasService.test.ts`
- `frontend/src/pages/MeiCatalogoServicosProdutos.tsx`
- `frontend/src/pages/MeiCatalogoServicosProdutos.test.tsx`
- `frontend/src/components/MeiCatalogoProdutoModal.tsx`
- `frontend/src/components/MeiCatalogoProdutoModal.test.tsx`

### Debug Log References

- `cd frontend && npm test -- --run` — 205 testes verdes.
- `npm run typecheck` — OK.
- `npm run lint` — OK (avisos pré-existentes noutros ficheiros); ficheiros desta story sem avisos (`eslint … --max-warnings 0` nos paths tocados na mitigação QA).

### Change Log

| Data | Nota |
|------|------|
| 2026-03-30 | Story criada pelo SM (River) a partir do PRD e da UX spec de exclusão. |
| 2026-03-30 | Implementação exclusão produtos + diálogo partilhado + testes RTL; Ready for Review. |
| 2026-03-30 | Mitigação QA: FR-CAT-12/CAT-MEI-08 em GuidesMei; guard duplo submit; testes UX §12.2–§12.3; 205 testes. |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-03-30  
**Decisão de gate:** **PASS com CONCERNS** — critérios funcionais e de testes automáticos satisfeitos; permanece confirmação manual do DoD (atalhos NFS-e) e nota sobre *lint* global.

### Rastreio → critérios de aceite

| Critério | Verificação |
|----------|-------------|
| FR-CAT-11 — exclusão só após confirmação | Diálogo obrigatório (`MeiCatalogoDeleteProdutoConfirmDialog` / genérico); testes cobrem cancelar sem API e Esc. |
| FR-CAT-13 — copy | `meiCatalogoDeleteCatalogShared.ts` + título variante item em `meiCatalogoProdutoDelete.ts`; teste assegura texto sobre notas não anuladas. |
| Lista + modal (zona perigosa) | `MeiCatalogoServicosProdutos.tsx` (Excluir em cartão/tabela); `MeiCatalogoProdutoModal` com `onRequestDelete`; teste “zona perigosa → mesmo diálogo → DELETE”. |
| Sucesso / erro / re-listagem | Paridade CAT-MEI-07: `toast`, `loadProdutos`, `role="alert"` no erro, fecho de modais. |
| Duplo submit | `deleteSubmitting` + botões e overlay desativados no diálogo genérico durante pedido. |
| Paridade visual / sem drift | `MeiCatalogoDeleteCatalogConfirmDialog` partilhado com cliente; `MeiCatalogoDeleteClienteConfirmDialog` refatorado para o mesmo shell. |

### Evidência executada (repo)

- `eliminarCatalogoNfseProduto` → `DELETE .../catalogo/produtos/:id` codificado (`meiNotasService.ts` + teste dedicado).
- RTL: `MeiCatalogoServicosProdutos.test.tsx` (8 casos: confirmação, DELETE, erro, modal, Esc); `MeiCatalogoProdutoModal.test.tsx` (zona perigosa).
- Comando de verificação (revisor): `npm test -- --run src/pages/MeiCatalogoServicosProdutos.test.tsx src/services/meiNotasService.test.ts` — verde.

### CONCERNS (não bloqueantes)

1. **DoD manual (Definition of Story):** validar em ambiente real: excluir item → lista correta e atalhos NFS-e em `GuidesMei` após o refetch acordado (FR-CAT-12); o código segue o mesmo padrão que clientes, mas o gate humano fecha com smoke manual.
2. **`npm run lint` global:** o *Dev Agent Record* reporta avisos pré-existentes noutros ficheiros; nenhum erro novo identificado na revisão estática dos ficheiros desta story. Manter política de *lint* limpo como dívida transversal se aplicável.
3. **Checklist UX §12:** cumprimento inferido por paridade com o diálogo de exclusão de cliente (foco inicial, `aria-*`, Esc, `data-testid`); não foi feita auditoria linha-a-linha da spec §12 nesta revisão.

### Notas

- NFR segurança: sem novos segredos; DELETE via cliente API existente com auth herdada do `apiClient`.
- **Sugestão pós-merge:** @sm/@po podem marcar os checkboxes dos “Critérios de aceite” e do “File list” no corpo da story quando aceitarem o gate (fora do âmbito de edição do QA).

— Quinn, guardião da qualidade 🛡️
