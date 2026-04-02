# Story — ADM-NFSE-CAT-03: Backend escrita + drawer “Gerir clientes” + copy e acessibilidade (admin NFSe)

**ID:** STORY-ADM-NFSE-CAT-03  
**Prioridade:** P0/P1 (delete **P1** — FR-ADM-NFSE-06; restante P0 conforme PRD)  
**Depende de:** [story-adm-nfse-cat-01-backend-listagem-catalogo-admin.md](./story-adm-nfse-cat-01-backend-listagem-catalogo-admin.md), [story-adm-nfse-cat-02-frontend-combobox-modal-emitir.md](./story-adm-nfse-cat-02-frontend-combobox-modal-emitir.md)  
**Fonte:** [`docs/prd/PRD-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md`](../prd/PRD-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md) — FR-ADM-NFSE-04 a 09, NFR-ADM-NFSE-01 a 06, §6.1 a §6.3  
**Especificação UX:** [`docs/specs/ux-spec-admin-nfse-catalogo-clientes-usuario-2026-04-02.md`](../specs/ux-spec-admin-nfse-catalogo-clientes-usuario-2026-04-02.md) §4 (drawer preferencial), §6.2–6.3, §7 (drawer copy), §8 (foco, Esc, pilha modal/drawer), §9 (mapeamento FR), §10 (`AdminUserMeiClientesDrawer`), §11 (checklist)

## User story

**Como** administrador a emitir NFSe em nome de **U**,  
**quero** abrir **“Gerir clientes deste utilizador”** num painel lateral (fluxo A preferencial), **criar e editar** clientes no catálogo de **U** (e **eliminar** com a mesma política que o utilizador no MEI), com copy e foco que deixem claro o contexto de **U**,  
**para** pré-cadastrar ou corrigir tomadores **sem** sair da emissão e com paridade percebida com o Guia MEI (FR-ADM-NFSE-08, 09).

## Contexto técnico

### Backend (escrita admin)

- **Rotas (PRD §10):** sob `admin.routes.js`, por exemplo:  
  - `POST /admin/users/:userId/mei-catalogo/clientes` → `meiNotasService.criarCatalogoCliente(userId, body)`  
  - `PATCH /admin/users/:userId/mei-catalogo/clientes/:id` → `meiNotasService.atualizarCatalogoCliente(userId, id, body)`  
  - `DELETE /admin/users/:userId/mei-catalogo/clientes/:id` → `meiNotasService.eliminarCatalogoCliente(userId, id)` **se** FR-ADM-NFSE-06 aplicável  
- **Autorização:** idêntica à story 01 — `requireAdmin` + `ensureCanViewUser` **antes** de delegar no serviço; **nunca** confiar no cliente para `userId`.  
- **Paridade de domínio (NFR-ADM-NFSE-02):** mesmas validações e limitações que as rotas utilizador (ex.: PATCH cliente — imutabilidade de `documento` / `dedupe_key` conforme [`story-cat-mei-02-backend-post-patch-catalogo.md`](./story-cat-mei-02-backend-post-patch-catalogo.md) e serviço actual).  
- **Exclusão (PRD §6.3):** alinhar a [story-cat-mei-06-backend-delete-catalogo-mei.md](./story-cat-mei-06-backend-delete-catalogo-mei.md) e [story-cat-mei-07-frontend-exclusao-clientes-catalogo.md](./story-cat-mei-07-frontend-exclusao-clientes-catalogo.md) — admin **só** elimina se o fluxo utilizador o permite, com a **mesma política** (confirmação UI, códigos HTTP, idempotência).  
- **Testes:** casos 403/404 para `userId` não autorizado; happy path mínimo POST/PATCH; DELETE conforme paridade; sem regressão nas rotas utilizador (CR-ADM-NFSE-02).

### Frontend (drawer + integração modal)

- **Disparo:** botão **“Gerir clientes deste utilizador”** (UX §3.1, §7) — estilo `planner-button-secondary(-compact)`, ícone opcional `Users`.  
- **Drawer (UX §4.1):** `fixed` à direita, `max-w-md`, z-index acima do modal principal; **focus trap**; foco inicial no título (`h2` + `tabIndex={-1}`); ao fechar, devolver foco ao botão que abriu; **Esc** fecha o drawer **antes** do modal pai (§8).  
- **Conteúdo:** cabeçalho **“Clientes para NFS-e”** ou variante com nome de U; subtítulo de confiança (UX §7); lista com busca (`q` + debounce); **Novo cliente**; editar por linha; eliminar com confirmação **se** backend expuser DELETE.  
- **Pós-mutação:** refrescar lista no drawer; ao fechar drawer, **invalidar/refetch** lista do combobox da story 02 para o novo registo aparecer **sem** hard refresh (UX §4.3).  
- **Modal secundário** em vez de drawer só se documentado na Completion Notes (UX §4.2 — maior risco de pilha de foco).

### Decisões PO

| Ref. | Nota |
|------|------|
| **§6.1** | Não adicionar “Atualizar cadastro com estes dados” até decisão PO explícita. |
| **§6.2** | Drawer e botão “Gerir” seguem a mesma política que o combobox (story 02). |

## Critérios de aceite

### Backend

- [ ] `POST` e `PATCH` admin criam/atualizam cliente de **U** via serviço existente (FR-ADM-NFSE-04, 05).  
- [ ] Se o produto mantém DELETE para utilizador, existe `DELETE` admin com mesma semântica de segurança (FR-ADM-NFSE-06); caso contrário, UI **omite** eliminar e rota **não** expõe bypass.  
- [ ] Todas as operações com `ensureCanViewUser` + `userId` da URL (NFR-ADM-NFSE-01).  
- [ ] Erros claros; sem vazamento de dados de utilizadores fora de **U** (FR-ADM-NFSE-07).  
- [ ] Testes automatizados para autorização e caminhos felizes mínimos.

### Frontend

- [ ] Botão **“Gerir clientes deste utilizador”** abre fluxo **A** (drawer preferencial) sem rota dedicada obrigatória (FR-ADM-NFSE-08).  
- [ ] CRUD UI completo conforme paridade; confirmação de eliminação alinhada ao produto MEI.  
- [ ] Copy do drawer e reforços de contexto **U** conforme UX §7 (FR-ADM-NFSE-09).  
- [ ] Acessibilidade: labels, foco, Esc, anúncio de erros (NFR-ADM-NFSE-04).  
- [ ] Após criar/editar/eliminar, combobox do modal principal actualiza dados disponíveis (checklist UX §11).  
- [ ] `npm run lint`, `npm run typecheck`, `npm test` conforme `AGENTS.md`.

## Fora de escopo

- Catálogo de serviços/produtos no modal admin (PRD §5.2).  
- Auditoria estruturada “quem alterou o catálogo de quem” (PRD §5.2 fase 2).  
- Importação em massa.

## File list (checklist implementação)

- [ ] `backend/src/routes/admin.routes.js`
- [ ] `backend/src/controllers/admin.controller.js`
- [ ] `backend/src/services/mei-notas.service.js` (apenas se for necessário expor helper; **evitar** duplicar regras)
- [ ] Testes backend (admin + catálogo)
- [ ] `frontend/src/services/adminUserDataService.ts` (POST/PATCH/DELETE)
- [ ] `frontend/src/pages/AdminUserData.tsx` e/ou `AdminUserMeiClientesDrawer` (+ integração combobox story 02)

## Definition of Done

- PRD §14: FR-ADM-NFSE-04 a 09 satisfeitos no âmbito deste incremento (com decisões §6.1–6.3 explícitas nas notas).  
- Checklist UX §11 completo para drawer + integração.

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration:** Disabled  
> `core-config.yaml` ausente — revisão manual + gates CLI.

**Story type (planeamento):** API + Frontend + Security — cruzar auth admin, paridade DELETE com CAT-MEI-06/07, a11y drawer/modal.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor agent (implementação CAT-03)

### Completion Notes List

- **§6.1 PRD:** não implementado “Atualizar cadastro com estes dados” (fora de escopo explícito).
- **§6.2 / MEI desativado:** botão “Gerir” e drawer seguem a mesma política que o combobox (story 02): só quando `mei !== false`; rotas admin de escrita usam `ensureMeiEnabledForUser` (paridade com `requireMeiEnabled` nas rotas utilizador).
- **DELETE:** exposto em admin com a mesma semântica do serviço `eliminarCatalogoCliente` (204, política CAT-MEI-06/07); UI com `MeiCatalogoDeleteClienteConfirmDialog`.
- **Esc:** listener em captura no documento enquanto o drawer está aberto para fechar o drawer antes do modal pai.
- **Refetch combobox:** `catalogRefreshToken` no combobox + incremento ao fechar o drawer e após mutações no drawer.
- **Mitigação QA (CONCERNS — testes escrita):** `admin-mei-nfse-catalog.controller.test.js` alargado com POST/PATCH/DELETE — happy paths (201 / payload 200 / 204), 403 sem `canViewUser`, 403 com `mei: false` no POST (via `listUsers` mock).

### File List (implementação)

- `backend/src/utils/response.js` — `sendCreated` (201 canónico).
- `backend/src/routes/admin.routes.js` — POST/PATCH/DELETE `mei-catalogo/clientes`.
- `backend/src/controllers/admin.controller.js` — handlers com `ensureCanViewUser`, `ensureMeiEnabledForUser`, delegação ao `mei-notas.service`.
- `backend/tests/admin-mei-catalog-routes.test.js` — asserts das novas rotas.
- `backend/tests/admin-mei-nfse-catalog.controller.test.js` — GET + POST/PATCH/DELETE admin catálogo (autorização e caminhos felizes com mocks).
- `frontend/src/services/adminUserDataService.ts` — create/update/delete admin catálogo.
- `frontend/src/components/MeiCatalogoClienteModal.tsx` — `catalogAdminUserId` + `elevatedStack`.
- `frontend/src/components/admin/AdminUserMeiClientesDrawer.tsx` — drawer (lista, pesquisa, CRUD, a11y base).
- `frontend/src/components/admin/AdminMeiCatalogClienteCombobox.tsx` — `catalogRefreshToken`.
- `frontend/src/pages/AdminUserData.tsx` — botão “Gerir clientes deste utilizador”, integração drawer + copy modal alinhada UX §7.
- `frontend/src/components/MeiCatalogoClienteModal.test.tsx`, `frontend/src/components/admin/AdminMeiCatalogClienteCombobox.test.tsx` — cobertura admin path / refresh.

### Debug Log References

—

### Change Log

| Data | Nota |
|------|------|
| 2026-04-02 | Story criada pelo SM (River) a partir do PRD e da UX spec admin NFSe. |
| 2026-04-02 | Implementação backend escrita + drawer admin + integração combobox; gates CLI. |
| 2026-04-02 | Testes de controller para escrita admin catálogo (mitigação feedback QA). |

---

## QA Results

### Revisão QA — 2026-04-02 (Quinn)

**Gate:** **CONCERNS** (implementação alinhada ao PRD/UX; dívida de testes backend em escrita admin).

**Evidência executada (CLI):** `frontend` — `npm run typecheck` OK; `vitest` em `MeiCatalogoClienteModal.test.tsx` e `AdminMeiCatalogClienteCombobox.test.tsx` OK (incl. ramo `catalogAdminUserId` e `catalogRefreshToken`). CodeRabbit desactivado na story — revisão manual.

---

#### Rastreio aos critérios (alto nível)

| Área | Verificação | Nota |
|------|-------------|------|
| **Backend POST/PATCH/DELETE** | Rotas em `admin.routes.js`; handlers delegam em `meiNotasService` com `userId` da URL | OK — paridade de domínio (NFR-ADM-NFSE-02). |
| **Autorização** | `ensureCanViewUser` + `ensureMeiEnabledForUser` nas escritas | OK — coerente com `requireMeiEnabled` nas rotas utilizador e §6.2 (política combobox). GET catálogo admin continua só com `ensureCanViewUser` (esperado face à story 01). |
| **DELETE** | `204` + mesmo serviço que utilizador | OK — alinhado CAT-MEI-06. |
| **Frontend drawer** | Fluxo A, `max-w-md`, z acima do modal Emitir, copy §7, busca com debounce, CRUD + confirmação delete | OK. |
| **Esc / pilha** | Captura no `document`; prioridade delete → fechar modal edição → fechar drawer; overlay delete `z-[75]` acima do modal `z-[70]` | OK — mitiga conflito UX §8. |
| **Refetch combobox** | `onInvalidateCatalog` + `catalogRefreshToken` | OK — UX §4.3. |
| **A11y** | `role="dialog"`, `aria-labelledby` / `aria-describedby`, labels em inputs, `role="alert"` em erros de lista, foco inicial no `h2`, `returnFocusRef` | **Bom**; focus trap por Tab é manual no painel — aceitável; **risco residual** se o foco saltar para o modal pai com sub-modais abertos (baixa probabilidade após ordem Esc). |
| **Testes automatizados** | `admin-mei-catalog-routes.test.js` (GET/POST/PATCH/DELETE — middlewares); `admin-mei-nfse-catalog.controller.test.js` só **GET** + 403 | **Lacuna:** a story pede “403/404” e happy path mínimo para escrita; **não há** testes de controller para `create` / `update` / `delete` admin (nem 403 `canViewUser: false`, nem 403 MEI desligado, nem 201/200/204 com mocks), ao contrário do GET já espelhado no ficheiro existente. |

---

#### Conclusão

- **Pode seguir para merge** do ponto de vista funcional e de segurança aparente (sem `userId` confiável só no cliente; serviço único).
- **Recomendação obrigatória (próximo incremento ou antes do merge, preferência equipa):** estender `backend/tests/admin-mei-nfse-catalog.controller.test.js` (ou ficheiro dedicado) com casos mínimos para `createAdminUserMeiCatalogoCliente`, `updateAdminUserMeiCatalogoCliente` e `deleteAdminUserMeiCatalogoCliente` — pelo menos: serviço **não** chamado com `canViewUser: false`; resposta **201** / **200** / **204** com mock de `meiNotasService`; opcional `ensureMeiEnabledForUser` → 403 quando `mei: false`.
- **Opcional:** teste de componente leve para `AdminUserMeiClientesDrawer` (montagem + Esc) ou smoke E2E admin — não bloqueante se a equipa aceitar cobertura indirecta.

— Quinn, guardião da qualidade 🛡️
