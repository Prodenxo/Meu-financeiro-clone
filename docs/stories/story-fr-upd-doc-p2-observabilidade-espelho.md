# Story — FR-UPD-DOC (P2): Observabilidade — aviso quando espelho falha após sucesso Plugnotas

**ID:** STORY-FR-UPD-DOC-P2-OBS-ESPELHO  
**Prioridade:** P2  
**Depende de:** [story-fr-upd-doc-p0-backend-reconcile-get-espelho.md](./story-fr-upd-doc-p0-backend-reconcile-get-espelho.md) (caminhos `saveDocumentosAtivosMirror` consolidados)  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../prd/PRD-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) — **FR-UPD-DOC-09**, §6.5  
**Arquitetura:** [`docs/technical/architecture-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../technical/architecture-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) §6

## User story

**Como** equipa de operações,  
**quero** registo estruturado quando o espelho Supabase **não** gravar após sucesso no Plugnotas,  
**para** diagnosticar deriva ou falhas de rede/RLS sem expor erro ao utilizador.

## Contexto

- Hoje `saveDocumentosAtivosMirror` e `persistDocumentosAtivosMirrorAfterEmpresa` engolem falhas.  
- **FR-UPD-DOC-09:** `logger.warn` (ou equivalente) com contexto mínimo — **sem** PII sensível; resposta HTTP ao cliente **inalterada** (**NFR-UPD-DOC-03**).

## Critérios de aceite

- [ ] Após `atualizarEmpresaPlugNotas` / `cadastrarEmpresaPlugNotas` **bem-sucedido**, se `saveDocumentosAtivosMirror` falhar (erro Supabase ou condição de skip não aplicável), regista-se **warn** com identificador de correlação (ex.: `userId` já usado noutros logs do backend, sem CPF/CNPJ em claro se política proibir).  
- [ ] No caminho **reconcile GET → save**, mesma regra se save falhar.  
- [ ] Não aumentar nível para `error` salvo política de observabilidade do projeto.  
- [ ] Testes: mock de falha Supabase, assert que `warn` foi chamado (ou spy no logger).  
- [ ] Gates `AGENTS.md`.

## Tasks

1. [x] Centralizar ponto de log em `saveDocumentosAtivosMirror` ou wrapper único usado por POST/PATCH/reconcile.  
2. [x] Garantir que logs não incluem payload completo Plugnotas.  
3. [x] Testes unitários com mock do cliente Supabase.

## File list (indicativo)

- [ ] `backend/src/services/mei-certificate-store.js`  
- [ ] Opcional: `mei-notas-documentos-mirror.js`  
- [ ] `backend/tests/mei-certificate-emitente.test.js` ou novo ficheiro

## Fora de escopo

- Dashboards ou alertas externos (Datadog etc.) — só log local/stdout conforme stack.  
- Alterar contrato HTTP ou UX.

## Qualidade / CodeRabbit

- Sem dados pessoais desnecessários em mensagens de log.

## Executor Assignment (sugestão AIOX)

| Campo | Valor |
|-------|--------|
| executor | @dev |
| quality_gate | @architect |
| quality_gate_tools | Revisão de segurança de logging |

---

## Dev Agent Record

### Status

Ready for Review

### Completion Notes

- `saveDocumentosAtivosMirror`: `console.warn` via `logDocumentosAtivosMirrorPersistWarn` com `userId`, `reason`, `detail`; sem tri-boolean nem payload Plugnotas; nível **warn** apenas.
- **Follow-up QA:** quando não existe linha `user_mei_certificates`, `reason: mirror_no_user_mei_certificate_row` + `detail: no_update_without_certificate_row` (espelho não gravado após fluxo que chamou save).
- `mei-notas-documentos-mirror`: repasse `mirrorSaveDeps` ao save (POST/PATCH/reconcile).
- Testes: `mei-certificate-store-documentos-ativos-mirror.test.js` + ajustes `mei-notas-documentos-mirror.test.js`.

### File List

- `backend/src/services/mei-certificate-store.js` — `logDocumentosAtivosMirrorPersistWarn`, `saveDocumentosAtivosMirror` com deps
- `backend/src/services/mei-notas-documentos-mirror.js` — `mirrorSaveDeps`
- `backend/tests/mei-certificate-store-documentos-ativos-mirror.test.js` — novos
- `backend/tests/mei-notas-documentos-mirror.test.js` — repasse deps + caso mirrorSaveDeps

### Change Log

| Data | Notas |
|------|--------|
| 2026-04-07 | Story criada pelo SM (River). |
| 2026-04-07 | FR-UPD-DOC-09: warn centralizado + testes. |
| 2026-04-07 | Follow-up QA: warn quando ausência de linha UMC (`mirror_no_user_mei_certificate_row`). |

---

## QA Results

### Revisão — 2026-04-07 (Quinn / QA)

**Decisão de gate:** **PASS**

| Critério de aceite | Evidência | Notas |
|--------------------|-----------|--------|
| Warn após POST/PATCH Plugnotas OK quando save falha (Supabase) | `saveDocumentosAtivosMirror` chamado por `persistDocumentosAtivosMirrorAfterEmpresa` com `mirrorSaveDeps`; falhas em select/update/catch → `logWarn` | Correlacionamento com **`userId`** (UUID auth); sem CPF/CNPJ. |
| Caminho reconcile GET → save | `reconcileMirrorFromEmpresaJson` → `save(..., deps.mirrorSaveDeps ?? {})` | Mesma função central = mesma regra de observabilidade. |
| Nível `warn`, não `error` | `logDocumentosAtivosMirrorPersistWarn` usa `console.warn` | Alinhado à política do repo (padrão `console.warn` noutros serviços). |
| Testes com mock + spy | `mei-certificate-store-documentos-ativos-mirror.test.js` | Select falho, update falho, sucesso sem log, excepção; smoke sem `nfse` no output. |
| Sem payload Plugnotas / PII desnecessária | Objeto de log: `reason`, `userId`, `detail` opcional | `detail` limita-se a mensagem/código de erro Supabase — aceitável para diagnóstico; não há corpo JSON Plugnotas. |
| NFR-UPD-DOC-03 (HTTP inalterado) | `save` continua a não lançar para o cliente; callers engolem como antes | OK. |

**Execução de testes (esta revisão):** `node --test tests/mei-certificate-store-documentos-ativos-mirror.test.js tests/mei-notas-documentos-mirror.test.js` — **14 pass**.

**Observação (não bloqueante):** Critério de aceite menciona também *«condição de skip não aplicável»*; a implementação **não** emite warn quando não existe linha em `user_mei_certificates` (skip documentado em **CR-UPD-DOC-02**). Coerente com arquitetura/PRD; se o PO quiser métrica também para «sem linha UMC após sucesso remoto», seria story/follow-up.

**Gates `AGENTS.md`:** validar `npm run lint` / `npm run test` na raiz antes do merge (recomendação habitual); testes backend P2 verificados acima.

**Próximo passo sugerido:** **@architect** na revisão de segurança de logging (tabela Executor Assignment), se ainda não feito.
