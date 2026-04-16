# Story — CAT-MEI-09: Backend — `GET` catálogo de códigos de serviço (`codigosservicos`)

**ID:** STORY-CAT-MEI-09  
**Prioridade:** P0  
**Depende de:** Tabela `public.codigosservicos` existir e estar acessível ao Supabase do backend (criação/povoamento em **ops** ou migração futura; **não** há ficheiro em `supabase/migrations/` neste repositório à data 2026-04-16 — confirmar readiness antes do sprint). Independente de [story-cat-mei-02-backend-post-patch-catalogo.md](./story-cat-mei-02-backend-post-patch-catalogo.md) (já entregue).  
**Bloqueia:** [story-cat-mei-10-frontend-combobox-codigo-interno-catalogo.md](./story-cat-mei-10-frontend-combobox-codigo-interno-catalogo.md)  
**Fonte:** [`docs/prd/PRD-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md`](../prd/PRD-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md) (FR-CAT-COD-01, FR-CAT-COD-02, FR-CAT-COD-08 parcial, FR-CAT-COD-09; NFR-CAT-01, NFR-CAT-02, NFR-CAT-05)  
**Arquitetura:** [`docs/technical/architecture-catalogo-mei-codigosservicos-combobox-2026-04-16.md`](../technical/architecture-catalogo-mei-codigosservicos-combobox-2026-04-16.md) §4–5

## User story

**Como** utilizador com sessão válida e **MEI habilitado**,  
**quero** que a aplicação obtenha **códigos de serviço de referência** (código + descrição) de forma pesquisável,  
**para** escolher o código interno no catálogo com menos erro e sem consultar listas externas.

**Nota técnica (implementação):** a leitura expõe-se apenas no **BFF** (`GET` sob `/api/mei-notas/...`), com `getDb()` e service role no servidor — alinhado ao PRD e à arquitetura (sem Supabase no browser).

## Contexto técnico

- **Rota:** `GET /catalogo/codigos-servicos` no router `mei-notas` (prefixo global `/api/mei-notas`), **antes** de rotas que possam capturar `/:id`.  
- **Middlewares:** `requireAuth`, `requireMeiEnabled` — paridade com `GET /catalogo/produtos`.  
- **Query:** `q` opcional (string trim); `limit` via `parseCatalogLimit` em `backend/src/utils/mei-catalog-query.js` (máx. **50**, default **20**).  
- **Serviço:** nova função (ex.: `listarCodigosServicosReferencia`) em `mei-notas.service.js` usando `getDb()` + `from('codigosservicos').select('codigo, descricao')` + `order('codigo')` + `limit`; pesquisa com `ilike` em `codigo` e `descricao` reutilizando a **mesma semântica** de `sanitizeSearchTerm` / `applyCatalogSearch` (extrair helper partilhado se evitar duplicação).  
- **Resposta:** envelope `sendSuccess`; `data` = array de `{ codigo, descricao }` (seguir convenção snake_case das outras rotas mei-notas se for o padrão actual).  
- **Tabela vazia:** retornar `[]` sem erro 500.

## Critérios de aceite

- [x] `GET /api/mei-notas/catalogo/codigos-servicos` com utilizador autenticado e MEI habilitado devolve lista (pode ser vazia) com `codigo` e `descricao`.  
- [x] Com **`q` ausente ou vazio** (após trim): devolve até **`limit`** linhas, ordenadas por `codigo` ascendente (primeiros códigos da referência; comportamento base para abrir o combobox).  
- [x] Com **`q` preenchido:** filtra por substring em **código** ou **descrição** (case-insensitive, mesma família que `applyCatalogSearch` no catálogo MEI).  
- [x] `limit` respeita teto **50** e default coerente com `parseCatalogLimit` (`mei-catalog-query.js`).  
- [x] **Erros HTTP (fonte de verdade no código):**  
  - **401** — pedido **sem** `Authorization` / token inválido (`requireAuth`).  
  - **403** — utilizador não admin com **MEI desabilitado** (`requireMeiEnabled` → `forbidden('Acesso MEI desabilitado')` em `backend/src/middlewares/requireMei.js`).  
  - Replicar para a nova rota o padrão de teste **401 sem Bearer** já usado em `backend/tests/mei-notas-catalog-auth-http.test.js` (mesmo helper `runCatalogAuthCases` ou equivalente para `GET` neste path).  
  - **403 (evidência QA):** **preferencial** — teste HTTP automatizado com token válido e contexto **MEI desligado** (se o repo já tiver fixture/`__setGetRequesterContextForTests` ou padrão equivalente para `requireMeiEnabled`). **Alternativa aceitável** — registo no PR (screenshot de `curl`/Insomnia ou nota de revisão) com **403** e corpo `success: false` para esta rota, para não bloquear entrega se o harness não existir.  
- [x] Rota registada em `mei-notas-routes.test.js` (lista de paths).  
- [x] Testes de serviço com mock de `getDb` (`__setGetDbForTests`) ou equivalente, cobrindo pelo menos: **`q` vazio**, **`q` com texto**, **`limit` no máximo** (50).  
- [x] `npm run lint`, `npm test` (backend) verdes nos ficheiros tocados.

## Fora de escopo

- Índices Postgres / `pg_trgm` (owner: `@data-engineer`, PRD).  
- Alteração a `POST/PATCH /catalogo/produtos`.  
- Leitura directa Supabase no browser.

## File list (checklist implementação)

- [x] `backend/src/routes/mei-notas.routes.js` — nova rota `GET /catalogo/codigos-servicos`  
- [x] `backend/src/controllers/mei-notas.controller.js` — handler (parse `q`, `parseCatalogLimit`)  
- [x] `backend/src/services/mei-notas.service.js` — `listarCodigosServicosReferencia` (+ helper partilhado opcional)  
- [x] `backend/tests/mei-notas-routes.test.js`  
- [x] `backend/tests/mei-notas-catalog-auth-http.test.js` (ou ficheiro dedicado HTTP)  
- [x] Novo teste de serviço (ex.: `mei-notas-codigos-servicos.test.js`) se o padrão do repo o preferir

## Definition of Done

- Contrato alinhado à secção §4 da arquitetura; revisão rápida por par para **CAT-MEI-10** poder integrar.  
- Smoke manual: `curl`/Insomnia com token válido e MEI ON.  
- **401** obrigatoriamente coberto por teste (padrão `mei-notas-catalog-auth-http`). **403** coberto por teste **ou** evidência explícita no PR (ver AC “403 (evidência QA)”).

## Dev Agent Record

### Status

Done

### Agent Model Used

—

### Completion Notes List

- `GET /api/mei-notas/catalogo/codigos-servicos`: `requireAuth` + `requireMeiEnabled`, `q` + `parseCatalogLimit`, serviço `listarCodigosServicosReferencia` em `codigosservicos` com `applyCatalogSearch` (paridade com catálogo MEI).
- Testes: 401 (`mei-notas-catalog-auth-http`), 403 + GET 200 wire (`mei-notas-catalog-http`), rotas (`mei-notas-routes`), serviço com `__setGetDbForTests` (`mei-notas-codigos-servicos.test.js`).

### File List (implementação)

- `backend/src/routes/mei-notas.routes.js`
- `backend/src/controllers/mei-notas.controller.js`
- `backend/src/services/mei-notas.service.js`
- `backend/tests/mei-notas-routes.test.js`
- `backend/tests/mei-notas-catalog-auth-http.test.js`
- `backend/tests/mei-notas-catalog-http.test.js`
- `backend/tests/mei-notas-codigos-servicos.test.js`

### Change Log

| Data | Nota |
|------|------|
| 2026-04-16 | Story criada pelo SM (River) a partir do PRD, spec UX e arquitetura. |
| 2026-04-16 | Refinamento pós-revisão PO (Pax): user story centrada no utilizador; AC para `q` vazio; 401/403 amarrados a `requireAuth` / `requireMeiEnabled` e `mei-notas-catalog-auth-http.test.js`; pré-requisito de tabela sem migração no repo documentado. |
| 2026-04-16 | Refinamento PO (nota 9→10): AC explícito para **403** — teste automatizado com fixture MEI off **ou** evidência no PR; DoD alinhado. |
| 2026-04-16 | Pós-revisão QA: `mei-notas-catalog-delete-http.test.js` renomeado para `mei-notas-catalog-http.test.js`; teste HTTP **GET 200** `/catalogo/codigos-servicos` com mock (`buildCatalogWireApp`). |
