# Story — CAT-MEI-06: Backend — DELETE catálogo de clientes e de serviços/produtos

**ID:** STORY-CAT-MEI-06  
**Prioridade:** P0  
**Depende de:** [story-cat-mei-02-backend-post-patch-catalogo.md](./story-cat-mei-02-backend-post-patch-catalogo.md) (escrita já exposta)  
**Fonte:** `docs/prd/PRD-catalogo-mei-exclusao-clientes-produtos-2026-03-30.md` §6–§11, §14 (2.1, 2.2, 2.5 doc)  
**Especificação UX:** `docs/specs/ux-spec-catalogo-mei-exclusao-2026-03-30.md` §5.2 (erros), §11 (mapeamento)

## User story

**Como** backend da aplicação,  
**quero** expor **DELETE** autenticado para registos de **cliente** e de **serviço/produto** do catálogo NFS-e, **apenas** para o dono (`user_id` da sessão),  
**para** o frontend poder remover atalhos do catálogo com a mesma política que POST/PATCH (FR-CAT-14, NFR-CAT-10).

## Contexto técnico

- **Gate (PRD §6.3):** antes de implementar, **validar** no schema/repo se `mei_nfse` (ou outras tabelas) referenciam por FK o `id` de `mei_nfse_clientes` / `mei_nfse_produtos`. Se existir dependência que impeça DELETE físico, **escalar** para PO/arquiteto (soft delete) e **não** fechar esta story com hard delete. Documentar decisão no PR / [`docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`](../technical/catalogo-mei-persistencia-e-api-2026-03-30.md).
- **Rotas sugeridas (PRD §11):** `DELETE /catalogo/clientes/:id` e `DELETE /catalogo/produtos/:id` sob o mesmo router `mei-notas` que os GET/POST/PATCH (confirmar path absoluto em `mei-notas.routes.js`).
- **Middlewares:** `requireAuth` + `requireMeiEnabled` (paridade com escrita atual).
- **Autorização:** apagar só se a linha existir e `user_id` === `req.user.id`; caso contrário **404** (ou convenção do projeto para não vazar existência — alinhar com PRD §6.1).
- **Resposta:** **204 No Content** em sucesso; segundo DELETE idempotente conforme NFR-CAT-06 (documentar 404 vs 204 na doc técnica).
- **Persistência:** Supabase via service role, igual às outras operações de catálogo.
- **Testes:** estender `backend/tests/mei-notas-routes.test.js` (ou ficheiro dedicado) — sucesso, 404 para id alheio/inexistente, 401 sem auth, idempotência se aplicável.
- **Documentação:** atualizar o artefato canónico [`docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`](../technical/catalogo-mei-persistencia-e-api-2026-03-30.md) com verbos DELETE, exemplos de resposta e semântica de erro.

## Critérios de aceite

- [ ] Existem endpoints **DELETE** para **cliente** e **produto** do catálogo, alinhados ao contrato documentado após implementação.
- [ ] Utilizador sem sessão ou sem MEI habilitado **não** consegue eliminar (mesma política que POST/PATCH).
- [ ] Não é possível eliminar registo **de outro** utilizador (comportamento seguro acordado — ex. 404).
- [ ] Após DELETE bem-sucedido, **GET** de listagem **não** devolve o registo para esse utilizador.
- [ ] Segundo DELETE no mesmo id tem comportamento **idempotente** acordado e documentado (NFR-CAT-06).
- [ ] Testes automatizados cobrem sucesso (com mock/stub de DB se necessário), recurso inexistente/alheio, auth negada.
- [ ] Doc técnico canónico atualizado com a secção DELETE.
- [ ] **Gate de schema** registado (texto curto em Completion Notes ou no doc técnico): hard delete **aprovado** ou desvio para soft delete com nova story.

## Fora de escopo

- UI React.  
- FR-CAT-15 (auditoria estruturada P1) — opcional em story futura.  
- Exclusão em massa.

## File list (checklist implementação)

- [ ] `backend/src/routes/mei-notas.routes.js`
- [ ] `backend/src/controllers/mei-notas.controller.js`
- [ ] `backend/src/services/mei-notas.service.js`
- [ ] `backend/tests/mei-notas-routes.test.js` e/ou `mei-notas-catalog-delete.test.js` (nome ajustável)
- [ ] `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`

## Definition of Done

- `cd backend && npm test` e `npm run lint` verdes.  
- Revisão de segurança mínima: sem bypass de `user_id`.

## Qualidade / CodeRabbit

- Não logar PII completa em claro (NFR-CAT-05 / política do projeto).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- **Gate schema:** `public.mei_nfse` não declara FK para `mei_nfse_clientes.id` nem `mei_nfse_produtos.id`; dados da nota em `payload_json` / colunas derivadas — **hard delete** do catálogo aprovado (alinhado PRD §6.3-A).
- **Rotas:** `DELETE /catalogo/clientes/:id` e `DELETE /catalogo/produtos/:id` com `requireAuth` + `requireMeiEnabled`; resposta **204**; **404** só quando existe linha com o `id` mas `user_id` ≠ sessão; segundo DELETE idempotente → **204**; **400** se `:id` não for UUID válido.
- **Serviço:** `eliminarCatalogoCliente`, `eliminarCatalogoProduto`; `ensureCatalogRecordId` reforçado com validação UUID; PATCH catálogo usa `recordId` normalizado.
- **Testes:** `mei-notas-catalog-delete.test.js` (sucesso, idempotência, 404 outro dono, 400); `mei-notas-catalog-auth-http.test.js` (401 DELETE); `mei-notas-routes.test.js` (middlewares nas novas rotas).
- **Mitigação observações QA (pós-revisão):** `mei-notas-catalog-http.test.js` — **204** + corpo vazio no wire (DELETE clientes/produtos com sessão simulada + `requireMeiEnabled`); **403** com `mei=false` nos dois DELETE; fluxo **GET listagem → DELETE → GET** com mock partilhado (registo removido); segundo **DELETE** idempotente no wire com mock partilhado.
- **Doc:** `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md` v1.1 — §7 com DELETE, §7.5–7.6, tabela executiva §1.

### File List (implementação)

- `backend/src/services/mei-notas.service.js`
- `backend/src/controllers/mei-notas.controller.js`
- `backend/src/routes/mei-notas.routes.js`
- `backend/tests/mei-notas-catalog-delete.test.js`
- `backend/tests/mei-notas-catalog-http.test.js`
- `backend/tests/mei-notas-catalog-auth-http.test.js`
- `backend/tests/mei-notas-routes.test.js`
- `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`

### Debug Log References

- `cd backend && npm test` — suite completa verde (206 testes, incl. HTTP DELETE catálogo pós-QA).
- `cd backend && npm run lint` — OK (`node --check src/server.js`).

### Change Log

| Data | Nota |
|------|------|
| 2026-03-30 | Story criada pelo SM (River) a partir do PRD e da UX spec de exclusão. |
| 2026-03-30 | Implementação DELETE catálogo + testes + doc técnico v1.1; Ready for Review. |
| 2026-03-30 | Testes HTTP adicionais (`mei-notas-catalog-http.test.js`; antes `mei-notas-catalog-delete-http.test.js`) para fechar observações QA (204, 403 MEI, GET após DELETE, idempotência wire). |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-03-30  
**Decisão de gate:** **PASS com CONCERNS (aprovável para merge)** — implementação alinhada ao contrato documentado e aos critérios; lacunas abaixo são **não bloqueantes** e espelham o padrão já visto no CAT-MEI-02 (cobertura HTTP parcial).

### Evidência executada (repo)

- `cd backend && npm test` — **201** testes, **0** falhas (reexecução na revisão).
- `cd backend && npm run lint` — OK (`node --check src/server.js`).
- **CodeRabbit:** não executado nesta revisão estática (WSL/ambiente).

### Rastreabilidade critérios de aceite → implementação / testes

| Critério | Verificação |
|----------|-------------|
| Endpoints **DELETE** cliente e produto | `mei-notas.routes.js`: `DELETE /catalogo/clientes/:id`, `DELETE /catalogo/produtos/:id` antes de `PATCH /:id` da nota. |
| Sem sessão / sem MEI | `mei-notas-routes.test.js` — `requireAuth` + `requireMeiEnabled` nas duas rotas; `mei-notas-catalog-auth-http.test.js` — **401** sem `Authorization` nos dois DELETE. |
| Não apagar registo de outro utilizador | `eliminarCatalogoCliente` / `eliminarCatalogoProduto`: após delete vazio, `select` por `id`; se `user_id` ≠ sessão → `notFound` (**404**). Teste em `mei-notas-catalog-delete.test.js` (cliente e produto). |
| GET listagem não devolve registo após DELETE | Lógica coerente (linha removida por `id`+`user_id`); **sem** teste automatizado de fluxo GET após DELETE (integração/DB). |
| Segundo DELETE idempotente (NFR-CAT-06) | Serviço retorna sem erro quando delete devolve 0 linhas e lookup não encontra dono alheio; teste dedicado “idempotente” para cliente. Doc §7.5. |
| Testes automatizados | `mei-notas-catalog-delete.test.js` — sucesso, idempotência, 404 outro dono, **400** id inválido; auth e rotas como acima. |
| Doc técnico | `catalogo-mei-persistencia-e-api-2026-03-30.md` v1.1 — tabela §7, §7.5–7.6, §1 executiva. |
| Gate schema / hard delete | Registado no Dev Record e no doc: sem FK `mei_nfse` → ids do catálogo; `payload_json` nas notas. |

### Observações (não bloqueantes)

1. **HTTP 204:** não há teste **supertest** com sessão válida que assegure corpo vazio e status **204** no wire; a semântica está no controlador e coberta ao nível de **serviço** + **401** nas rotas públicas.
2. **403 MEI desabilitado:** não há caso HTTP explícito para `DELETE` com token válido e `mei=false` (paridade com outras rotas de catálogo — confiança no middleware partilhado).
3. **`ensureCatalogRecordId` + UUID:** reforço positivo para `:id` malformado; regex de versão UUID aceita [1–8] no nibble de versão — compatível com `gen_random_uuid()` (v4).

### Resumo

Rotas e serviço implementam **autorização por dono**, **404** para id alheio, **204** idempotente e **400** para id inválido, em linha com o PRD e o doc técnico v1.1. **PASS com CONCERNS** reflete sobretudo ausência de prova integrada **GET após DELETE** e de **204** via HTTP com auth mockada — recomendável como dívida leve ou reforço na CAT-MEI-07/08 quando o frontend exercitar as rotas.
