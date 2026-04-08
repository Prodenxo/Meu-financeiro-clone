# Story — FR-ORQ-CERT (P1): **Endpoint composto** `POST …/emitente` (opcional)

**ID:** STORY-FR-ORQ-CERT-P1-ENDPOINT-EMITENTE  
**Prioridade:** P1 (opcional; só se PO priorizar na sprint)  
**Depende de:** [story-fr-orq-cert-p0-guidesmei-fases-retry-setup-plugnotas.md](./story-fr-orq-cert-p0-guidesmei-fases-retry-setup-plugnotas.md) recomendado como baseline cliente em duas chamadas.  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`](../prd/PRD-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md) — §5.3, §6.5 P1, Story D do épico  
**Arquitetura:** [`docs/technical/architecture-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`](../technical/architecture-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md) — secção 6

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @architect |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test`; revisão de contrato API e segurança multipart. |

---

## User story

**Como** integrador (ou app mobile futura),  
**quero** um **único endpoint** que envie certificado e registe a empresa no Plugnotas no servidor,  
**para** reduzir *round-trips*, correlacionar erros com um *request-id* e simplificar clientes não web.

---

## Contexto

- **CR-ORQ-CERT-01:** rotas `POST …/certificado` e `POST …/empresa` **permanecem**; o composto é **aditivo**.  
- Contrato sugerido na arquitetura §6: `multipart/form-data` + campo JSON `payload` (emitente + `documentosAtivos` quando aplicável).  
- Resposta unificada: `{ certificado: { id }, empresa: { cnpj, operation, message } }` (shape final na story de implementação + **@architect**).

---

## Critérios de aceite

- [ ] Nova rota registada (nome final acordado, ex.: `POST /mei-notas/setup/emissao-fiscal/emitente`) com `requireAuth`, `requireMeiEnabled`.  
- [ ] Handler reutiliza `cadastrarCertificadoPlugNotas` e `cadastrarEmpresaPlugNotas` (ou serviço fino partilhado) — **sem** duplicar lógica de 409/empresa.  
- [ ] Em falha na segunda fase, resposta de erro inclui metadado explícito de **fase** (`orchestrationPhase` ou equivalente) para alinhar a **NFR-ORQ-CERT-02**.  
- [ ] `persistDocumentosAtivosMirrorAfterEmpresa` chamado após sucesso de empresa quando `documentosAtivos` presente (**FR-ORQ-CERT-08**).  
- [ ] Testes HTTP em `backend/tests/` cobrindo sucesso, falha fase 1, falha fase 2.  
- [ ] Documentar em `docs/operacao-mei-nfse.md` se o fluxo for exposto a operadores.  
- [ ] Gates `AGENTS.md`.  
- [ ] *(Opcional na mesma story ou follow-up)* Frontend web continua em duas chamadas **ou** passa a usar o composto — decisão PO; não quebrar clientes que só usam rotas antigas.

---

## Tasks

1. [x] Desenhar contrato multipart + JSON com **@architect**; validar tamanho máximo de ficheiro alinhado ao existente.  
2. [x] Implementar controller + serviço; reutilizar espelho Supabase.  
3. [x] Testes de integração.  
4. [x] Atualizar documentação operacional.

---

## File list (indicativo)

- [x] `backend/src/routes/mei-notas.routes.js`  
- [x] `backend/src/controllers/mei-notas.controller.js`  
- [x] `backend/src/services/plugnotas/plugnotas-emitente-setup.service.js` (novo, nome ajustável)  
- [x] `backend/tests/*.test.js` (novo ou extensão)  
- [x] `docs/operacao-mei-nfse.md`  

---

## Fora de escopo

- Remover endpoints legados.  
- Transacção distribuída que reverta certificado no Plugnotas (impossível/ fora de produto).

---

## 🤖 CodeRabbit Integration

- Focar em: limites de upload, *path traversal* em nome de ficheiro, não logar binários/senha, consistência de erros com middleware actual.

---

## Dev Agent Record

### Status

Ready for Review

### Completion Notes

- Rota **`POST /api/mei-notas/setup/emissao-fiscal/emitente`** e alias **`POST …/setup/plugnotas/emitente`**: `requireAuth`, `requireMeiEnabled`, `upload.single('arquivo')` (limite **5 MiB**), campo multipart **`payload`** (JSON string) com corpo da empresa alinhado a `POST …/empresa` (sem `certificado` obrigatório no cliente).
- Serviço **`plugnotas-emitente-setup.service.js`**: `runPlugnotasEmitenteCompositeSetup` chama `cadastrarCertificadoPlugNotas` → injeta `certificado` → `cadastrarEmpresaPlugNotas`; `path.basename` no nome do ficheiro; erros **`HttpError`** ganham **`errors.orchestrationPhase`** `certificado` | `empresa` (NFR-ORQ-CERT-02).
- Controller: após sucesso, espelho via **`persistDocumentosAtivosMirrorAfterEmitenteComposite`** (default = `persistDocumentosAtivosMirrorAfterEmpresa`) com `{ ...empresaPayload, certificado: id }` (FR-ORQ-CERT-08); **`__setPersistDocumentosAtivosMirrorAfterEmitenteForTests`** só para testes.
- Testes: `mei-notas-emitente-composite-http.test.js` (sucesso, falha fase 1/2, espelho com `documentosAtivos`), `plugnotas-emitente-setup.service.test.js` (parse + fase + erro genérico), rotas em `mei-notas-routes.test.js`.
- Frontend web **inalterado** (continua em duas chamadas); rotas legadas preservadas (**CR-ORQ-CERT-01**).
- **Follow-up QA (2026-04-07):** `withOrchestrationPhase` normaliza erros não-`HttpError` (mensagem + `orchestrationPhase`; status 400–599 se duck-typed, senão 500). *Request-id* e CodeRabbit: inalterados (conforme ressalvas Quinn).

### File List

- `backend/src/routes/mei-notas.routes.js`  
- `backend/src/controllers/mei-notas.controller.js`  
- `backend/src/services/plugnotas/plugnotas-emitente-setup.service.js`  
- `backend/tests/mei-notas-emitente-composite-http.test.js`  
- `backend/tests/plugnotas-emitente-setup.service.test.js`  
- `backend/tests/mei-notas-routes.test.js`  
- `docs/operacao-mei-nfse.md`  

### Change Log

| Data | Nota |
|------|------|
| 2026-04-07 | Story P1 criada pelo SM; execução condicionada à priorização PO. |
| 2026-04-07 | Implementação (Dex): endpoint composto emitente, serviço, testes HTTP + unitários, doc operacional; gates verdes. |
| 2026-04-07 | Resposta QA: `withOrchestrationPhase` para erros genéricos; teste espelho `documentosAtivos`; `backend/tests` actualizado. |

---

## QA Results

### Revisão 2026-04-07 — Quinn (@qa)

**Decisão de gate:** **PASS** (critérios de aceite da story verificados por leitura de código + testes automatizados; **@architect** continua canónico para fecho formal do *quality_gate* da story e contrato público).

**Evidência recolhida**

- Leitura de: `backend/src/routes/mei-notas.routes.js`, `backend/src/controllers/mei-notas.controller.js` (`cadastrarPlugNotasEmitenteComposite`), `backend/src/services/plugnotas/plugnotas-emitente-setup.service.js`, `backend/tests/mei-notas-emitente-composite-http.test.js`, `backend/tests/plugnotas-emitente-setup.service.test.js`, excerto de `docs/operacao-mei-nfse.md` (endpoint + `orchestrationPhase`).
- Comando: `npm run test --workspaces --if-present` na raiz do repositório — **exit 0** nesta revisão.

**Rastreio critérios de aceite (requisito → verificação)**

| Critério | Veredito | Como foi verificado |
|----------|----------|---------------------|
| Rota `POST …/emitente` com `requireAuth`, `requireMeiEnabled` | OK | Rotas `…/emissao-fiscal/emitente` e alias `…/plugnotas/emitente` com a mesma cadeia que certificado; `mei-notas-routes.test.js` inclui ambas nas rotas protegidas. |
| Reutilizar `cadastrarCertificadoPlugNotas` + `cadastrarEmpresaPlugNotas` | OK | `runPlugnotasEmitenteCompositeSetup` delega aos dois exports de `empresa.service.js` — sem fork da lógica 409/PATCH empresa. |
| Erro fase 2 (e fase 1) com metadado de fase / NFR-ORQ-CERT-02 | OK | `withOrchestrationPhase` em `catch` das duas fases; `badRequest` sem ID de certificado inclui `orchestrationPhase: certificado`. Testes HTTP assertam `errors.orchestrationPhase` em falhas simuladas fase 1 e 2. |
| `persistDocumentosAtivosMirrorAfterEmpresa` pós-sucesso com `documentosAtivos` | OK | Controller chama após `runPlugnotasEmitenteCompositeSetup` com `{ ...empresaPayload, certificado }`, espelhando o padrão de `cadastrarPlugNotasEmpresa`. **Nota:** não há assert HTTP dedicado ao espelho (igual ao padrão de outros handlers; lógica de espelho coberta noutros testes de `mei-notas-documentos-mirror`). |
| Testes HTTP sucesso + falha fase 1 + fase 2 | OK | `mei-notas-emitente-composite-http.test.js` (3 casos) + `plugnotas-emitente-setup.service.test.js` (parse / `withOrchestrationPhase`). |
| `docs/operacao-mei-nfse.md` | OK | Secção de endpoints e mapa funcional descrevem contrato multipart, limite 5 MiB, `orchestrationPhase`, espelho e CR-ORQ-CERT-01. |
| Gates AGENTS | OK | Suíte de testes workspace verde nesta execução. |
| Frontend duas chamadas / não quebrar legados | OK | Sem alterações ao cliente web referidas no registo @dev; rotas antigas mantidas. |

**Ressalvas (não bloqueantes)**

1. **`withOrchestrationPhase`:** só enriquece erros que já são `HttpError`; excepções não normalizadas propagariam sem `orchestrationPhase` (baixa probabilidade no caminho Plugnotas actual).
2. **User story (valor):** o texto fala em correlacionar erros com *request-id* — **fora** dos critérios de aceite explícitos; não há cabeçalho/trace novo neste PR; alinhar com **@architect** se for requisito de observabilidade P1.
3. **CodeRabbit:** não executado nesta revisão (CLI WSL); recomendação do artefato da story mantém-se para *merge*.

**Sugestão de follow-up (opcional)**

- Teste HTTP (ou integração) que mocke `persistDocumentosAtivosMirrorAfterEmpresa` / `saveDocumentosAtivosMirror` e prove uma chamada quando `payload` inclui `documentosAtivos` válido — reduz risco de regressão só no fluxo composto.
