# Story — CAT-MEI-07: Frontend — exclusão de clientes do catálogo NFS-e

**ID:** STORY-CAT-MEI-07  
**Prioridade:** P0  
**Depende de:** [story-cat-mei-06-backend-delete-catalogo-mei.md](./story-cat-mei-06-backend-delete-catalogo-mei.md), [story-cat-mei-03-frontend-pagina-clientes-catalogo.md](./story-cat-mei-03-frontend-pagina-clientes-catalogo.md)  
**Fonte:** `docs/prd/PRD-catalogo-mei-exclusao-clientes-produtos-2026-03-30.md` (FR-CAT-10, FR-CAT-12, FR-CAT-13, FR-CAT-14)  
**Especificação UX:** [`docs/specs/ux-spec-catalogo-mei-exclusao-2026-03-30.md`](../specs/ux-spec-catalogo-mei-exclusao-2026-03-30.md) §3–§8, §9 (emissão), §12

## User story

**Como** utilizador com acesso MEI na página de **clientes do catálogo**,  
**quero** **excluir** um cliente após **confirmar** num diálogo claro (incluindo aviso de que **notas já emitidas não são anuladas**),  
**para** limpar erros ou duplicados sem manter lixo nos atalhos da NFS-e.

## Contexto técnico

- **API:** método em `frontend/src/services/meiNotasService.ts` (ou equivalente) que chama `DELETE` alinhado ao **CAT-MEI-06** (path final conforme backend).
- **Páginas / componentes:** `MeiCatalogoClientes.tsx` — ação **Excluir** por linha (e/ou cartão mobile); `MeiCatalogoClienteModal.tsx` — **zona perigosa** só em modo edição, abrindo o **mesmo** diálogo de confirmação (UX spec §3.1, §4.3).
- **Diálogo:** título, corpo, *copy* **FR-CAT-13** / tabela §8 da UX spec; botões **Cancelar** e **Excluir do catálogo**; `role="dialog"`, `aria-modal`, foco e **Esc** para cancelar (§6 UX).
- **Estados:** desabilitar botões durante request; toast sucesso/erro; em sucesso fechar diálogo e modal de edição se aberto; **refetch** da lista (`loadClientes` existente).
- **FR-CAT-12:** após exclusão, registo **não** reaparece nos selects/atalhos de `GuidesMei` após o mesmo mecanismo já usado para criar/editar (refetch ao separador NFS-e / `visibilitychange` — paridade FR-CAT-07); confirmar manualmente ou teste se viável.
- **Ícone sugerido:** `Trash2` com `aria-label` que inclui nome do cliente (UX §6).
- **Testes:** RTL — abrir confirmação, cancelar não chama API; confirmar chama delete mock e remove linha ou fecha fluxo; pelo menos um caso de erro amigável (PRD / spec §5.2).

## Critérios de aceite

- [ ] Existe fluxo de **exclusão** apenas após **diálogo de confirmação** (FR-CAT-10); **Cancelar** e **Esc** não persistem eliminação.
- [ ] *Copy* inclui aviso de **irreversibilidade no catálogo** e de que **notas fiscais já emitidas não são anuladas** (FR-CAT-13; UX spec §8).
- [ ] Utilizador pode iniciar exclusão da **lista** e da **zona perigosa** do modal de **edição** (não no fluxo “Novo cliente”).
- [ ] Sucesso: toast, lista atualizada **sem** hard refresh obrigatório; erro: mensagem compreensível (rede, 404, etc.).
- [ ] Duplo submit **mitigado** (botão desabilitado durante pedido — PRD risco §13).
- [ ] `npm run lint`, `npm run typecheck`, `npm test` no frontend verdes nos ficheiros tocados.
- [ ] **Checklist UX §12** relevante para clientes verificado (mínimo: diálogo, não eliminar sem confirmar, dark mode legível).

## Fora de escopo

- Exclusão de serviços/produtos (**CAT-MEI-08**).  
- Alterações profundas em `GuidesMei` salvo necessário mínimo para FR-CAT-12.  
- FR-CAT-15.

## File list (checklist implementação)

- [ ] `frontend/src/services/meiNotasService.ts`
- [ ] `frontend/src/services/meiNotasService.test.ts` (ou extensão existente)
- [ ] `frontend/src/pages/MeiCatalogoClientes.tsx`
- [ ] `frontend/src/components/MeiCatalogoClienteModal.tsx`
- [ ] Componente reutilizável opcional: `MeiCatalogoDeleteConfirmDialog.tsx` (ou similar)
- [ ] `frontend/src/pages/MeiCatalogoClientes.test.tsx` e/ou `MeiCatalogoClienteModal.test.tsx` (extensão)

## Definition of Done

- QA manual: excluir cliente de teste → desaparece da lista → Mei Infinito → NFS-e não mostra atalho após refetch acordado.  
- Atualizar **story CAT-MEI-03** *Dev Agent Record* **não** é obrigatório aqui; remover referência “sem exclusão” apenas se editar secções autorizadas numa passagem de higiene (coordenar com PO).

## Qualidade / CodeRabbit

- Reutilizar padrão de modal/toast já usado no catálogo.  
- Não duplicar strings longas em 4 sítios — extrair constantes de *copy* se útil.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- **API:** `eliminarCatalogoNfseCliente(id)` em `meiNotasService.ts` → `DELETE /mei-notas/catalogo/clientes/:id` (paridade CAT-MEI-06).
- **Copy:** constantes em `frontend/src/copy/meiCatalogoClienteDelete.ts` (FR-CAT-13 / UX §4.2); diálogo `MeiCatalogoDeleteClienteConfirmDialog.tsx` com `role="dialog"`, `aria-modal`, foco inicial em Cancelar, **Esc** cancela, botões desativados durante pedido, `data-testid` para testes estáveis.
- **Lista:** ação **Excluir** (ícone `Trash2` + texto) em tabela (md+) e cartões mobile; `aria-label` com nome do cliente.
- **Modal edição:** zona perigosa com CTA que abre o **mesmo** diálogo (`onRequestDelete`); fluxo “Novo cliente” sem zona perigosa.
- **Pós-sucesso:** `toast.success`, `loadClientes`, fecho do diálogo e do modal de edição se aberto.
- **Erro:** `toast.error` + `role="alert"` no diálogo.
- **FR-CAT-12 / Guards:** comentário em `GuidesMei.tsx` (useEffect `visibilitychange` + `loadNfseCatalog`) documenta paridade com refetch dos atalhos NFS-e após alterações no catálogo; comportamento já existente.
- **QA (CONCERNS):** teste RTL adicional — modal edição → zona perigosa → mesmo diálogo de confirmação → DELETE.

### File List (implementação)

- `frontend/src/copy/meiCatalogoClienteDelete.ts`
- `frontend/src/components/MeiCatalogoDeleteClienteConfirmDialog.tsx`
- `frontend/src/services/meiNotasService.ts`
- `frontend/src/services/meiNotasService.test.ts`
- `frontend/src/pages/MeiCatalogoClientes.tsx`
- `frontend/src/pages/MeiCatalogoClientes.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/components/MeiCatalogoClienteModal.tsx`
- `frontend/src/components/MeiCatalogoClienteModal.test.tsx`

### Debug Log References

- `cd frontend && npm test -- --run` — 196 testes verdes.
- `npm run typecheck` — OK.
- `npm run lint` — OK (avisos pré-existentes noutros ficheiros).

### Change Log

| Data | Nota |
|------|------|
| 2026-03-30 | Story criada pelo SM (River) a partir do PRD e da UX spec de exclusão. |
| 2026-03-30 | Implementação exclusão clientes + testes RTL + serviço DELETE; Ready for Review. |
| 2026-03-30 | Mitigação QA: teste exclusão via modal edição; documentação FR-CAT-12 em GuidesMei. |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-03-30  
**Decisão de gate:** **PASS com CONCERNS** — critérios e UX cobertos no código e nos testes RTL; pontos abaixo são **confirmação manual** ou **melhoria opcional**, não bloqueantes para merge.

### Evidência executada (repo)

- `cd frontend && npm test -- --run` — **32** ficheiros, **195** testes, **0** falhas (reexecução na revisão).
- **CodeRabbit:** não executado nesta revisão (WSL/ambiente).

### Rastreabilidade critérios de aceite → implementação / testes

| Critério | Verificação |
|----------|-------------|
| Exclusão só após confirmação; Cancelar e Esc sem API | `MeiCatalogoDeleteClienteConfirmDialog`: overlay/cancelar/fechar; `Esc` em `onKeyDown` com `!isDeleting`; testes “Cancelar não chama API” e “Esc cancela sem chamar API”. |
| Copy irreversibilidade + notas não anuladas (FR-CAT-13) | `meiCatalogoClienteDelete.ts` + corpo no diálogo; teste confirma texto “Notas fiscais já emitidas não são anuladas”. |
| Lista + zona perigosa em edição; não em “Novo” | `MeiCatalogoClientes` — Excluir em cartão (md:hidden) e tabela; `MeiCatalogoClienteModal` — zona perigosa condicional `isEdit && onRequestDelete`; testes modal sem zona em create e com callback em edição. |
| Sucesso: toast + refetch; erro compreensível | `toast.success` / `loadClientes` / fecho modal; `toast.error` + `role="alert"` no diálogo; teste erro simulado. |
| Duplo submit mitigado | Botões confirmar/cancelar/fechar e overlay desativados ou ignorados quando `isDeleting`; texto “A eliminar…”. |
| Lint / typecheck / test | Testes e `tsc` conforme Dev Record; `eslint` no projeto ainda emite **avisos** noutros ficheiros (exit 0) — não introduzidos por esta story. |
| UX §12 (diálogo, sem eliminar sem confirmar, dark) | Classes `dark:` no diálogo e cartões; fluxo obriga diálogo antes do DELETE. |

### Observações (não bloqueantes)

1. **FR-CAT-12 / `GuidesMei`:** implementação explícita fora de escopo; **DoD** pede QA manual (lista → Mei Infinito → NFS-e sem atalho após refetch). Recomendado validar uma vez em ambiente integrado.
2. **RTL:** coberto fluxo lista → confirmação; **modal → mesmo diálogo → DELETE** está desmembrado (callback `onRequestDelete` testado no modal; diálogo e API na página). Aceitável; E2E opcional se a equipa quiser prova única no fio.
3. **`data-testid`:** uso legítimo para estabilidade após `cleanup` entre testes; não substitui `role`/`aria` no produto.

### Resumo

Serviço `eliminarCatalogoNfseCliente`, diálogo acessível, copy alinhada à UX spec, lista mobile/desktop e zona perigosa em edição, com testes que cobrem cancelamento, confirmação, erro e tecla Esc. **PASS com CONCERNS** resume sobretudo **validação manual FR-CAT-12** e o facto de o lint global do repo não estar “limpo” de avisos (fora do âmbito estrito desta story).

— Quinn, guardião da qualidade 🛡️
