# Story — FR-UPD-DOC (P0): Backend — reconciliar espelho após **GET empresa**

**ID:** STORY-FR-UPD-DOC-P0-BACKEND-RECONCILE  
**Prioridade:** P0  
**Depende de:** [story-fr-cad-doc-p1-persistencia-documentos-ativos-supabase.md](./story-fr-cad-doc-p1-persistencia-documentos-ativos-supabase.md) (coluna `documentos_ativos` e `saveDocumentosAtivosMirror`)  
**Bloqueia:** [story-fr-upd-doc-p0-frontend-hidratacao-cache-patch.md](./story-fr-upd-doc-p0-frontend-hidratacao-cache-patch.md) (integração end-to-end opcional em paralelo com mocks)  
**Fonte PRD:** [`docs/prd/PRD-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../prd/PRD-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) — **FR-UPD-DOC-05**, **FR-UPD-DOC-06** (lado servidor: extract seguro), **CR-UPD-DOC-02**  
**UX:** [`docs/specs/ux-spec-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../specs/ux-spec-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) — base para estado remoto  
**Arquitetura:** [`docs/technical/architecture-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../technical/architecture-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) §2–4

## User story

**Como** sistema,  
**quero** derivar `documentosAtivos` do JSON de **GET empresa** e gravar o espelho em Supabase quando válido,  
**para** que a próxima leitura de status/UI alinhe com o emissor após consulta, sem exigir PATCH pelo utilizador.

## Contexto

- Hoje `consultarPlugNotasEmpresa` retorna o JSON Plugnotas mas **não** chama `saveDocumentosAtivosMirror`.  
- É necessário **`extractDocumentosAtivosFromEmpresaResponse`** defensivo + **`reconcileMirrorFromEmpresaJson(userId, empresaJson)`** (ou equivalente) conforme arquitetura.  
- Falhas de espelho **não** alteram HTTP 200 da consulta (**NFR-UPD-DOC-03**).

## Critérios de aceite

- [x] Existe função pura/testável `extractDocumentosAtivosFromEmpresaResponse(empresaJson)` em `plugnotas-empresa-documentos-ativos.js` (ou módulo dedicado), mapeando `nfse`/`nfe`/`nfce` → `{ nfse, nfe, nfce }` a partir de `ativo` (ou ausência = false).  
- [x] Se nenhum tipo estiver ativo no JSON, retornar `null` **ou** política acordada com PO — **não** chamar `saveDocumentosAtivosMirror` com seleção inválida (`assertAtLeastOneDocumentoAtivo`).  
- [x] Após `consultarEmpresaPlugNotas` **bem-sucedido**, o fluxo invoca reconciliação que chama `saveDocumentosAtivosMirror(userId, selection)` quando extract válido e linha UMC existir (**CR-UPD-DOC-02**).  
- [x] Erros de extract ou Supabase **engolidos** no caminho de consulta; resposta ao cliente inalterada em contrato base (corpo Plugnotas como hoje).  
- [x] Testes unitários: fixtures de JSON (só NFS-e, todos inativos, campos ausentes, shapes estranhos).  
- [x] Gates `AGENTS.md`: `npm run lint`, `npm run typecheck`, `npm test` (backend afectado).

## Tasks

1. [x] Implementar `extractDocumentosAtivosFromEmpresaResponse` + testes.  
2. [x] Implementar `reconcileMirrorFromEmpresaJson` em `mei-notas-documentos-mirror.js` (reutilizar `saveDocumentosAtivosMirror`, `assertAtLeastOneDocumentoAtivo` quando aplicável).  
3. [x] Acoplar em `consultarPlugNotasEmpresa` (controller ou serviço) **após** sucesso Plugnotas, com `userId` autenticado.  
4. [x] Documentar no código o contrato mínimo do JSON esperado (comentário + link `operacao-mei-nfse.md` se útil).

## File list (indicativo)

- [x] `backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js`  
- [x] `backend/src/services/mei-notas-documentos-mirror.js`  
- [x] `backend/src/controllers/mei-notas.controller.js` (e/ou `empresa.service.js` — onde for mais testável)  
- [x] `backend/tests/` — novo ou extensão de `plugnotas-empresa.test.js` / `mei-notas-documentos-mirror.test.js`

## Fora de escopo

- Novo endpoint HTTP só para reconciliar (MVP usa GET existente — arquitetura §3.1).  
- **FR-UPD-DOC-09** (logs P2) — story separada.

## Qualidade / CodeRabbit

- Não logar corpo completo de resposta Plugnotas em nível info em produção.  
- Parser defensivo: sem throw por shape inesperado; degradar a `null`.

## Executor Assignment (sugestão AIOX)

| Campo | Valor |
|-------|--------|
| executor | @dev |
| quality_gate | @architect |
| quality_gate_tools | Revisão de contrato GET→extract→save; testes de regressão |

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes

- `extractDocumentosAtivosFromEmpresaResponse` em `plugnotas-empresa-documentos-ativos.js`: lê `nfse`/`nfe`/`nfce`.`ativo`, retorna `null` se nenhum ativo ou entrada inválida (sem throw).
- Envelopes comuns (`data`, `empresa`, `data.empresa`) são considerados antes de desistir — alinhado à dívida QA sobre formato GET real.
- `reconcileMirrorFromEmpresaJson` em `mei-notas-documentos-mirror.js`: chama extract + `saveDocumentosAtivosMirror`; erros engolidos.
- `consultarEmpresaAndReconcileMirror` concentra GET + reconcile; `consultarPlugNotasEmpresa` usa esta função (testável com mocks).
- Testes: extract (+3 envelopes), `consultarEmpresaAndReconcileMirror` (ordem consult → reconcile uma vez).
- Gates: `npm run lint:backend` e `npm run test -w backend` verdes.

### File List

- `backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js`
- `backend/src/services/mei-notas-documentos-mirror.js`
- `backend/src/controllers/mei-notas.controller.js`
- `backend/tests/plugnotas-empresa-documentos-ativos-extract.test.js`
- `backend/tests/mei-notas-documentos-mirror.test.js`
- `docs/stories/story-fr-upd-doc-p0-backend-reconcile-get-espelho.md`

### Change Log

| Data | Notas |
|------|--------|
| 2026-04-07 | Story criada pelo SM (River). |
| 2026-04-07 | Implementação P0 backend reconcile GET → espelho. |
| 2026-04-07 | Follow-up QA: unwrap GET (`data`/`empresa`) + teste do fluxo `consultarEmpresaAndReconcileMirror`. |

---

## QA Results

**Revisor:** Quinn (QA) — revisão estática + `npm run test` no backend (exit 0).

### Decisão de gate: **PASS**

### Rastreio critérios de aceite

| Critério | Evidência |
|----------|-----------|
| `extractDocumentosAtivosFromEmpresaResponse` pura e testável | `plugnotas-empresa-documentos-ativos.js` L53–72; mapeia `nfse`/`nfe`/`nfce`.`ativo` com `toBool`. |
| Nenhum tipo ativo → `null`, sem `save` inválido | Extract L67–68; testes “todos inactivos” e `{}` → `null`. `reconcileMirrorFromEmpresaJson` só chama `save` se `selection` truthy. |
| Após GET bem-sucedido → reconciliação | `mei-notas.controller.js` L147–152: `reconcileMirrorFromEmpresaJson(req.user?.id, data)` após `consultarEmpresaPlugNotas`. |
| Erros engolidos; HTTP inalterado | `reconcileMirrorFromEmpresaJson` try/catch L42–48; resposta continua `sendSuccess(res, data, …)` com mesmo `data`. |
| Testes unitários (fixtures variadas) | `plugnotas-empresa-documentos-ativos-extract.test.js` (8 casos); `mei-notas-documentos-mirror.test.js` (+4 para reconcile). |
| Gates | `npm run test` (backend) executado nesta revisão: **OK**. |

### NFR / segurança

- Sem novo log do corpo Plugnotas nesta story.
- `assertAtLeastOneDocumentoAtivo` não é chamado em `reconcileMirrorFromEmpresaJson` — **aceitável**: `extract` só devolve objecto quando há ≥1 `ativo` verdadeiro; não há caminho para `save` com todos `false`.

### Riscos / dívida (não bloqueiam PASS)

1. **Formato GET real:** `extract` assume `nfse`/`nfe`/`nfce` no **nível raiz** do JSON. Se o Plugnotas passar a envolver empresa em `data` ou outro envelope, o extract pode devolver `null` e o espelho não atualiza — mitigar na story frontend ou com fixture de resposta real / teste de integração quando houver contrato estável.
2. **Teste HTTP do controller:** não há teste que mocke `consultarEmpresaPlugNotas` + assert `reconcileMirrorFromEmpresaJson` uma vez — cobertura actual via unidades; integração opcional.

### Condições para merge

- Nenhuma adicional além dos gates do repositório já verdes pelo dev.

**Data da revisão:** 2026-04-07
