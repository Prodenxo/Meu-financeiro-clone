# Story — CAT-MEI-02: Backend — POST/PATCH catálogo de clientes e de serviços/produtos

**ID:** STORY-CAT-MEI-02  
**Prioridade:** P0  
**Depende de:** [story-cat-mei-01-spike-persistencia-catalogo-rest.md](./story-cat-mei-01-spike-persistencia-catalogo-rest.md) (contrato fechado)  
**Fonte:** `docs/prd/PRD-catalogo-clientes-servicos-produtos-mei-2026-03-30.md` §7 (FR-CAT-03 a 06), §11, §14 (história 1.2)  
**Especificação UX:** `docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md` §6.6 (erros), §7

## User story

**Como** backend da aplicação,  
**quero** expor operações **autenticadas** de **criação e atualização** do catálogo de clientes e do catálogo de serviços/produtos alinhadas ao spike,  
**para** o frontend poder gravar dados que os **GET** existentes continuam a servir à emissão (CR-CAT-01, CR-CAT-02).

## Contexto técnico

- **Contrato e persistência (spike CAT-MEI-01):** [`docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`](../technical/catalogo-mei-persistencia-e-api-2026-03-30.md) — implementar `POST`/`PATCH` conforme §7; `dedupe_key` §5.3; matriz §6.
- **PATCH cliente (QA / doc §7.2):** no MVP, **não** permitir alterar `documento` nem `dedupe_key` via `PATCH` (evitar conflitos com índice único e duplicados); apenas `nome`, `email`, `metadata_json` (ou subconjunto acordado no serviço).
- Rotas atuais: `router.get('/catalogo/clientes'|'/catalogo/produtos', …)` em `backend/src/routes/mei-notas.routes.js`.
- Adicionar **POST** e **PATCH** (ou PUT, se o spike assim definir) conforme artefato **CAT-MEI-01**; respeitar `requireAuth` e `requireMeiEnabled` como nos GETs.
- Validar payload no servidor (documento, e-mail, campos fiscais mínimos).
- Respostas de erro **normalizadas** para a UI (mensagem amigável + opcional código; FR-CAT-08).
- Testes: estender `backend/tests/mei-notas-routes.test.js` (ou equivalente) para os novos verbos e casos 401/403/400/422.

## Critérios de aceite

- [x] Existem endpoints documentados no artefato do spike e implementados para **criar** e **atualizar** registo de **cliente** e de **serviço/produto** (MVP sem DELETE, salvo spike ditar o contrário).
- [x] Utilizador sem sessão ou sem MEI habilitado **não** consegue escrita (mesma política que listagem).
- [x] Após **POST** bem-sucedido, um **GET** subsequente à listagem devolve o novo registo no contexto do utilizador (paridade com FR-CAT-07 do lado servidor).
- [x] Após **PATCH**, o GET reflete alterações.
- [x] Os **GET** existentes permanecem funcionais sem regressão (CR-CAT-01).
- [x] Testes automatizados cobrem pelo menos: sucesso criar/editar (mock/stub do integrador se necessário), validação rejeitada, auth negada.
- [x] `PATCH /catalogo/clientes/:id` **rejeita** tentativa de mudar `documento` (e `dedupe_key`) com `400` e mensagem clara (alinhado ao doc técnico §7.2).

## Fora de escopo

- UI e rotas React.  
- Importação CSV.  
- Exclusão/arquivamento (fase 2, salvo spike incluir baixo risco).

## File list (checklist implementação)

- [x] `backend/src/routes/mei-notas.routes.js` (ou router dedicado se o spike recomendar)
- [x] Controladores/serviços em `backend/src/` tocados pelo fluxo `mei-notas`
- [x] `backend/tests/mei-notas-routes.test.js` (ou novos ficheiros de teste)
- [x] Atualização do artefato técnico do spike se o contrato real divergir ligeiramente (versão datada) — **não necessária** (contrato mantido)

## Definition of Done

- `npm test` no backend (ou suite relevante) verde para os novos casos.  
- `npm run lint` conforme projeto no pacote backend.  
- QA manual opcional via cliente HTTP/documentação do spike.

## Qualidade / CodeRabbit

- Não logar PII completa em texto claro (NFR-CAT-05).  
- Evitar duplicar lógica de validação CPF/CNPJ se já existir util partilhado no backend.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- Rotas: `POST/PATCH /catalogo/clientes`, `POST/PATCH /catalogo/produtos` (antes de `PATCH /:id`); `requireAuth` + `requireMeiEnabled`.
- Serviço: `criarCatalogoCliente` (upsert + `buildClienteCatalogEntry`), `atualizarCatalogoCliente` (só `nome`, `email`, `metadata_json`; rejeita `documento`, `dedupe_key`, `document_type`), `criarCatalogoProduto` (`dedupe_key` = `manual:{uuid}`), `atualizarCatalogoProduto`.
- Respostas POST: **201** com envelope `{ success, data, message, errors }`.
- Testes: `mei-notas-catalog-write.test.js` (validações sem DB); `mei-notas-routes.test.js` estendido com os 4 verbos protegidos.
- **Pós-QA (CONCERNS):** `__setGetDbForTests` / `__resetGetDbForTests` em `mei-notas.service.js`; fluxos felizes POST/PATCH cliente e produto com mock Supabase; `mei-notas-catalog-auth-http.test.js` — HTTP **401** sem `Authorization` nas 4 rotas de escrita do catálogo.

### File List (implementação)

- `backend/src/services/mei-notas.service.js`
- `backend/src/controllers/mei-notas.controller.js`
- `backend/src/routes/mei-notas.routes.js`
- `backend/tests/mei-notas-catalog-write.test.js`
- `backend/tests/mei-notas-catalog-auth-http.test.js`
- `backend/tests/mei-notas-routes.test.js`

### Debug Log References

- `cd backend && npm test` — 194 pass (incl. happy path + HTTP 401 catálogo).
- `cd backend && npm run lint` — OK.

### Change Log

| Data | Nota |
|------|------|
| 2026-03-30 | Story criada pelo SM (River) a partir do PRD e da spec UX. |
| 2026-03-30 | Implementação backend POST/PATCH catálogo + testes; status Ready for Review. |
| 2026-03-30 | Resposta ao QA: stub `getDb` em testes, casos de sucesso criar/editar, testes HTTP 401 nas rotas de catálogo. |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-03-30  
**Decisão de gate:** **CONCERNS** (aprovável para merge com dívidas explícitas)

### Rastreio aos critérios de aceite

| Critério | Evidência | Nota |
|----------|-----------|------|
| POST/PATCH cliente e produto alinhados ao spike | `mei-notas.routes.js` (antes de `PATCH /:id`); `criarCatalogoCliente`, `atualizarCatalogoCliente`, `criarCatalogoProduto`, `atualizarCatalogoProduto` em `mei-notas.service.js`; controlador com `sendCreated` (201) para POST | OK |
| Auth + MEI na escrita | Mesma cadeia `requireAuth` + `requireMeiEnabled` que nos GET; `mei-notas-routes.test.js` inclui os quatro verbos na lista protegida | OK (presença de middleware); não há teste HTTP 401/403 específico destas rotas |
| POST/PATCH → GET refletem dados | Lógica coerente (`user_id`, upsert/insert/update); **sem** teste automatizado de fluxo feliz com Supabase mockado/stub | **Lacuna** face ao critério “sucesso criar/editar” |
| GET sem regressão | Suite backend completa verde | OK |
| Testes: sucesso, validação, auth negada | `mei-notas-catalog-write.test.js`: validações + imutabilidade PATCH; rotas: só verificação de middleware | Validação e PATCH imutável **OK**; sucesso persistido e resposta HTTP 401/403 **não** cobertos como na story |
| PATCH cliente rejeita `documento` / `dedupe_key` com 400 | `atualizarCatalogoCliente` rejeita `documento`, `document_type`/`documentType`, `dedupe_key`; testes dedicados | OK (mensagens claras) |

### Execução de gates (CLI)

- `cd backend && npm test` — **186** pass, **0** fail (2026-03-30).
- `npm run lint` no backend — conforme Dev Agent Record (OK).

### Riscos e NFR

- **Baixo:** documento apenas por comprimento (11/14 dígitos), sem validação de dígitos verificadores — aceitável para MVP se alinhado ao spike.
- **Baixo:** POST cliente usa `upsert`; resposta **201** em atualização por conflito é nuance REST menor.
- **NFR-CAT-05:** novas funções não evidenciam log de PII em texto claro na revisão estática focada.

### Recomendações (não bloqueantes)

1. Considerar testes com **stub de `getDb()`** (ou integração com env de teste) para um POST/PATCH feliz e asserção de `user_id`/campos persistidos.
2. Opcional: um caso HTTP (supertest ou equivalente) para 401 nas novas rotas, para fechar literalmente o critério “auth negada”.

### Resumo

Implementação **consistente** com o contrato do spike e com as restrições de PATCH documentadas. A suite **passa** e a arquitetura (isolamento por `user_id`, envelope POST 201) está correta. **CONCERNS** reflete sobretudo a **parcialidade** da cobertura de testes face ao texto dos critérios (fluxo feliz e auth HTTP), não falhas de implementação identificadas nesta revisão.
