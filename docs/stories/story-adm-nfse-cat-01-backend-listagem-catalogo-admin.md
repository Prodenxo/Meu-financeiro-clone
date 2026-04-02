# Story — ADM-NFSE-CAT-01: Backend — listagem do catálogo de clientes NFS-e para admin (por utilizador U)

**ID:** STORY-ADM-NFSE-CAT-01  
**Prioridade:** P0  
**Depende de:** Nenhuma (reutiliza `meiNotasService.listarCatalogoClientes` e middlewares admin existentes)  
**Fonte:** [`docs/prd/PRD-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md`](../prd/PRD-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md) — FR-ADM-NFSE-01, FR-ADM-NFSE-07 (listagem), NFR-ADM-NFSE-01 a 03, CR-ADM-NFSE-02  
**Especificação UX:** [`docs/specs/ux-spec-admin-nfse-catalogo-clientes-usuario-2026-04-02.md`](../specs/ux-spec-admin-nfse-catalogo-clientes-usuario-2026-04-02.md) §5.1 (carga, `q`, `limit`), §6.1

## User story

**Como** administrador autenticado com permissão para ver o utilizador **U**,  
**quero** obter via API a **lista de clientes do catálogo NFS-e de U** (com pesquisa e limite coerentes com o catálogo MEI),  
**para** o painel admin poder preencher o modal “Emitir NFSe” sem duplicar regras de negócio nem confiar no cliente quanto ao dono dos dados.

## Contexto técnico

- **Autorização (NFR-ADM-NFSE-01):** mesmo padrão que `listAdminUserMeiNfse` / `emitirNotaAsAdmin` — `requireAuth`, `requireAdmin`, e **`ensureCanViewUser(req.accessToken, userId)`** antes de qualquer operação; **`user_id` para o serviço vem sempre de `req.params.userId`**, nunca do corpo do cliente.
- **Delegação:** `meiNotasService.listarCatalogoClientes(userId, { q, limit, documentType })` — paridade com [`backend/src/controllers/mei-notas.controller.js`](../../backend/src/controllers/mei-notas.controller.js) (`listarCatalogoClientes`); não reimplementar validações de catálogo.
- **Rota sugerida (PRD §10):** `GET /admin/users/:userId/mei-catalogo/clientes` em [`backend/src/routes/admin.routes.js`](../../backend/src/routes/admin.routes.js); query: `q`, `limit` (e `documentType` se o serviço já o expuser e fizer sentido manter paridade).
- **Compatibilidade (CR-ADM-NFSE-02):** rotas utilizador em `mei-notas.routes.js` permanecem inalteradas; admin usa prefixo **distinto** com `:userId` validado no servidor.
- **Documentação canónica de domínio:** [`docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`](../technical/catalogo-mei-persistencia-e-api-2026-03-30.md).
- **Testes:** padrão existente para admin — 403/404 (ou equivalente do projeto) quando o token **não** pode ver `userId`; happy path de listagem (mock/stub de DB ou serviço conforme suite atual); garantir que respostas **não** vazam clientes de outro utilizador.

## Decisões PO / produto (explicitar na implementação)

| Ref. PRD | Decisão | Nota para @dev |
|----------|---------|----------------|
| **§6.2** MEI não habilitado | **A fechar com PO** | Esta story é só **GET**; se PO escolher bloquear listagem quando MEI desabilitado, o handler pode devolver **403** com mensagem clara **ou** a lista vazia — **registar a opção fechada** no PR / Completion Notes. |

## Critérios de aceite

- [ ] Existe `GET /admin/users/:userId/mei-catalogo/clientes` (path final documentado se divergir ligeiramente, com justificativa) protegido por `requireAdmin` + `ensureCanViewUser`.
- [ ] A listagem utiliza **`userId` da URL** ao chamar `listarCatalogoClientes` (FR-ADM-NFSE-01).
- [ ] Suporta **`limit`** e **`q`** alinhados ao comportamento de `listarCatalogoClientes` (NFR-ADM-NFSE-03).
- [ ] Admin **sem** permissão para ver **U** não obtém dados de catálogo desse utilizador (comportamento seguro acordado com rotas admin existentes).
- [ ] Erros de API com mensagem clara ao cliente (FR-ADM-NFSE-07 — vertente listagem).
- [ ] Testes automatizados cobrem autorização (casos negativos) e happy path de listagem.
- [ ] `npm run lint`, `npm run typecheck` (se aplicável ao backend), `npm test` / suite backend relevante conforme `AGENTS.md`.

## Fora de escopo

- **POST/PATCH/DELETE** admin do catálogo — [story-adm-nfse-cat-03-frontend-drawer-crud-backend-escrita-copy-a11y.md](./story-adm-nfse-cat-03-frontend-drawer-crud-backend-escrita-copy-a11y.md).  
- UI do modal / combobox — [story-adm-nfse-cat-02-frontend-combobox-modal-emitir.md](./story-adm-nfse-cat-02-frontend-combobox-modal-emitir.md).  
- Alteração do payload de `POST .../mei-nfse/emitir` (CR-ADM-NFSE-01).

## File list (checklist implementação)

- [x] `backend/src/routes/admin.routes.js`
- [x] `backend/src/controllers/admin.controller.js` (handler + `ensureCanViewUser` antes do serviço)
- [x] Reutilização de `backend/src/services/mei-notas.service.js` (**sem** fork de regras)
- [x] Testes em ficheiro existente ou novo (ex.: `backend/tests/admin-*.test.js`) — alinhar ao padrão da suite admin

## Definition of Done

- Gates do projeto (`AGENTS.md`) verdes para o âmbito desta story.  
- Contrato da rota alinhado ao que @architect validar (se houver ADR/spec de API admin).

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration:** Disabled  
> CodeRabbit CLI is not enabled (`core-config.yaml` ausente no repo). Validação por revisão manual + gates CLI.

**Story type (planeamento):** API + Security — foco em `ensureCanViewUser`, ausência de bypass de `user_id`, erros HTTP consistentes.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor Agent (implementação 2026-04-02)

### Completion Notes List

- Rota `GET /admin/users/:userId/mei-catalogo/clientes` com `requireAuth`, `requireAdmin`, `ensureCanViewUser` e delegação a `meiNotasService.listarCatalogoClientes` com `q`, `limit` e `documentType` em paridade com as rotas utilizador via **`parseCatalogLimit`** em `backend/src/utils/mei-catalog-query.js` (20 default, máx. 50).
- **§6.2 PRD (MEI desabilitado):** alinhado a `listAdminUserMeiNfse` — sem `ensureMeiEnabledForUser` neste GET; catálogo é dados persistidos do utilizador, não bloqueado pelo flag MEI na listagem admin.
- `meiNotasServiceRef` + `__setMeiNotasServiceForTests` para testes; `listAdminUserMeiNfse` / `emitirNotaAsAdmin` passam a usar o mesmo ref.
- **Pós-QA:** observações Quinn — (1) helper partilhado `mei-catalog-query.js` + `mei-notas.controller.js` migrado para o mesmo util; (2) smoke de montagem Express `admin-mei-catalog-routes.test.js` (`requireAuth`, `requireAdmin`, handler).

### File List (implementação)

- `backend/src/routes/admin.routes.js`
- `backend/src/controllers/admin.controller.js`
- `backend/src/controllers/mei-notas.controller.js`
- `backend/src/utils/mei-catalog-query.js`
- `backend/tests/admin-mei-nfse-catalog.controller.test.js`
- `backend/tests/admin-mei-catalog-routes.test.js`

### Debug Log References

—

### Change Log

| Data | Nota |
|------|------|
| 2026-04-02 | Story criada pelo SM (River) a partir do PRD e da UX spec admin NFSe. |
| 2026-04-02 | Implementado GET admin catálogo clientes NFS-e + testes de autorização e happy path. |
| 2026-04-02 | Pós-QA: util partilhado `parseCatalogLimit` + teste de rota admin catálogo. |

---

## QA Results

### Revisão (Quinn) — 2026-04-02

**Gate:** **PASS** (com observações não bloqueantes)

#### Rastreio critérios de aceite

| Critério | Verificação |
|----------|-------------|
| `GET /admin/users/:userId/mei-catalogo/clientes` + `requireAdmin` + `ensureCanViewUser` | **OK** — Rota em `admin.routes.js` com `requireAuth`, `requireAdmin`; handler chama `ensureCanViewUser` antes do serviço. |
| `userId` sempre da URL no serviço | **OK** — `listAdminUserMeiCatalogoClientes` usa só `req.params.userId` em `listarCatalogoClientes`. |
| `q`, `limit` (e paridade catálogo) | **OK** — `parseCatalogLimit` espelha `parseLimit` do `mei-notas.controller.js` (20 default, máx. 50); `q` e `documentType` com trim alinhados ao controller utilizador. |
| Admin sem permissão não vê dados de U | **OK** — Teste garante 403 e que `listarCatalogoClientes` **não** é invocado; alinhado a `forbidden()` das outras rotas admin (a story menciona 404 “ou equivalente”; aqui o projeto usa 403, coerente). |
| Mensagens de erro claras (listagem) | **OK** — Erros do serviço (`badRequest`, etc.) propagam via `next(error)` como nas rotas existentes; 403 com mensagem padrão de `forbidden()`. |
| Testes automatizados | **OK** — Happy path + caso negativo de autorização; ficheiro `backend/tests/admin-mei-nfse-catalog.controller.test.js`. |
| Gates CLI | **OK** — Suite alvo executada com sucesso nesta revisão (`npm run test --workspace=backend -- tests/admin-mei-nfse-catalog.controller.test.js`). Recomenda-se manter `lint` / `typecheck` / `test` completos no CI antes do merge. |

#### NFRs (resumo)

- **Segurança:** Sem bypass de `user_id`; ordem middleware + `ensureCanViewUser` correta.
- **CR-ADM-NFSE-02:** Rotas utilizador não alteradas; prefixo admin distinto.
- **§6.2 PRD:** Decisão documentada nas Completion Notes (sem `ensureMeiEnabledForUser`, alinhado a `listAdminUserMeiNfse`).

#### Observações (dívida / melhorias opcionais)

1. **`parseCatalogLimit` duplicado** face a `mei-notas.controller.js` — risco de divergência futura; follow-up de baixa prioridade: extrair helper partilhado (fora do âmbito desta story).
2. **Cobertura:** Não há teste HTTP integrado com `requireAdmin` na cadeia Express (igual a outros testes de `admin.controller`); aceitável para o padrão atual; opcional: smoke de rota montada.

#### CodeRabbit

Desativado na story; revisão manual apenas.

---

**Assinatura:** Quinn (QA) — revisão de implementação concluída.
