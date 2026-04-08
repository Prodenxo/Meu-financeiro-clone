# Story — FR-CONS (P0): Serpro **5xx** no `emitirServico` → **503** + `errors.code` e copy **CONS-C** no Guia MEI

**ID:** STORY-FR-CONS-P0-SERPRO-503-VALIDATE  
**Prioridade:** P0  
**Depende de:** —  
**Bloqueia:** [story-fr-cons-p1-guidesmei-fr-cons-ux-paridade-sol.md](./story-fr-cons-p1-guidesmei-fr-cons-ux-paridade-sol.md) (opcional em paralelo após contrato JSON estável)  
**Fonte PRD:** [`docs/prd/PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../prd/PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — **FR-CONS-SERPRO-01**, **NFR-CONS-SERPRO-01**, **NFR-CONS-02**, **NFR-CONS-03**, **NFR-CONS-04**  
**UX:** [`docs/specs/ux-spec-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../specs/ux-spec-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — secção 6 (microcopy **CONS-C**), secção 8 (ficheiros), secção 9 (A11y)  
**Arquitetura:** [`docs/technical/architecture-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../technical/architecture-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — §2.1–2.3, §3, §6 critérios prontidão

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — contrato `errors` sem colisão com `plugnotasRequest`; @architect — **NFR-CONS-SERPRO-02** se se mantiver 400 temporariamente |

---

## User story

**Como** MEI na Guia MEI,  
**quando** a validação do guia falha por indisponibilidade do serviço da Receita Federal (Serpro),  
**quero** ver uma mensagem clara que **não** confunde com o cadastro da empresa no Plugnotas e, quando possível, um código HTTP que não sugira “pedido inválido”,  
**para** saber que posso tentar de novo mais tarde e focar o suporte no sistema certo.

---

## Contexto

- Hoje: `emitirServico` em `backend/src/services/gestao/emitir.service.js` faz `throw badRequest(result.message)` para **qualquer** resposta não-OK, incluindo **5xx** Serpro → o cliente recebe **400** e mensagens como **Internal Server Error** (`validateGuide` → `createGuide` / fluxo validate).  
- Alvo: `response.status >= 500` → **503** (ou `HttpError(503, …, errors)`), `message` em português **controlado**, `errors` com `code: MEI_GUIDE_SERPRO_UNAVAILABLE`, `integration: 'serpro'`, `upstreamStatus` (número).  
- `serviceUnavailable` em `errors.js` deve aceitar segundo argumento `errors` (refactor mínimo espelhando `badRequest`) **ou** usar `new HttpError(503, message, errors)` exportando `HttpError` se o refactor for rejeitado.  
- Frontend: `ApiClientError` deve expor `apiErrorCode` (ou equivalente) lido de `payload.errors.code`; `handleValidateBlur` em `GuidesMei.tsx` usa mapper `mapMeiGuideValidateErrorToUserMessage` com copy da spec UX secção 6; **fallback** se ainda vier 400 + mensagem genérica “Internal Server Error” no path de validate.  
- **NFR-CONS-SERPRO-02:** se PO exigir manter **400**, documentar no PRD/ADR e **obrigar** o mesmo `errors.code` para o frontend ramificar copy.

---

## Critérios de aceite

### Backend

- [ ] Serpro devolve **500** (teste com `fetch` mockado ou integração isolada): resposta BFF ao cliente tem **HTTP 503** (salvo excepção documentada **NFR-CONS-SERPRO-02**).  
- [ ] Corpo JSON: `success: false`, `message` **não** é apenas o *raw* `"Internal Server Error"` como única informação; `errors` objeto com pelo menos `code`, `integration`, `upstreamStatus`.  
- [ ] **4xx** Serpro: mantém **400** com mensagem adequada; opcional `errors.code` distinto (ex. `MEI_GUIDE_SERPRO_REJECT`) se o contrato Serpro permitir distinguir — **não** obrigatório no MVP se não houver evidência.  
- [ ] Logs em não-prod: não logar CNPJ completo; pode logar `upstreamStatus` + `integration` (alinhado arquitetura §2.5).  
- [ ] Teste automatizado cobre ramo **5xx** → **503** + `errors.code` (**NFR-CONS-03**).

### Frontend

- [ ] Utilizador vê título/corpo conforme spec UX **CONS-C** quando `httpStatus === 503` ou `apiErrorCode === 'MEI_GUIDE_SERPRO_UNAVAILABLE'`.  
- [ ] Mensagem **não** reutiliza copy de `GuiaMeiEmpresaCadastroErrorPanel` / NFS-e Nacional / `prefeitura`.  
- [ ] **Fallback:** mensagem genérica “Internal Server Error” no erro do `POST /mei-guide/validate` → mesma copy **CONS-C** até backend estar deployed (comentário no código com data/remoção opcional).  
- [ ] `role="alert"` / regiões: conforme spec UX secção 9 (um alert primário quando aplicável).

### Qualidade

- [ ] `npm run lint`, `npm run typecheck`, `npm test` — todos verdes (**NFR-CONS-04**).  
- [ ] **FR-CONS-EVID-01:** checklist da story referencia PRD CONS, brief consola, esta story e spec UX.

---

## Tasks (indicativas)

1. [x] Estender `serviceUnavailable` ou usar `HttpError(503, …, errors)` + constante `MEI_GUIDE_SERPRO_UNAVAILABLE` (módulo `backend/src/constants/mei-guide-error-codes.js` ou equivalente).  
2. [x] Alterar `emitir.service.js` — `emitirServico` — ramificação por `status`.  
3. [x] Testes backend (mock Response 500).  
4. [x] Estender `apiClientErrorFromPayload` / `ApiClientError` com `apiErrorCode`; helper `getApiErrorCodeFromUnknownError`.  
5. [x] Implementar `mapMeiGuideValidateErrorToUserMessage` + integrar em `handleValidateBlur` (`GuidesMei.tsx`).  
6. [x] Teste unitário frontend do mapper (opcional RTL no bloco de validação).  
7. [x] Atualizar **File list** e **Dev Agent Record**.

---

## File list (indicativo)

- [ ] `backend/src/utils/errors.js`  
- [ ] `backend/src/services/gestao/emitir.service.js`  
- [ ] `backend/src/constants/mei-guide-error-codes.js` *(novo, opcional)*  
- [ ] `backend/tests/…` *(novo ou existente mei-guide / emitir)*  
- [ ] `frontend/src/utils/apiClientError.ts`  
- [ ] `frontend/src/utils/mapMeiGuideValidateErrorToUserMessage.ts` *(novo, ou colocado em util próximo)*  
- [ ] `frontend/src/pages/GuidesMei.tsx`  
- [ ] `frontend/src/services/guidesMeiService.ts` *(se precisar propagar tipo)*  

---

## CodeRabbit Integration

- Focar: não vazar PII em `errors`; compatibilidade de `errors` como objeto vs array noutras rotas; garantir que `emitirRelatorio` ou outros consumidores de `emitirServico` não quebram com novo throw 503.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### File list

- `backend/src/constants/mei-guide-error-codes.js` (novo)
- `backend/src/utils/errors.js` — `serviceUnavailable` com `errors`
- `backend/src/services/gestao/authProcurador.service.js` — `serproApiFetch` (testes/mock)
- `backend/src/services/gestao/emitir.service.js` — 5xx→503 + `emitirRelatorio`
- `backend/tests/emitir-servico-serpro-503.test.js` (novo)
- `backend/tests/emitir-relatorio-serpro-503.test.js` (novo — follow-up QA CodeRabbit)
- `frontend/src/utils/buildApiErrorMessage.ts` — `errors.code` no tipo
- `frontend/src/utils/apiClientError.ts` — `apiErrorCode`, `getApiErrorCodeFromApiErrors`, `getApiErrorCodeFromUnknownError`
- `frontend/src/utils/apiClientError.test.ts` — cobertura `apiErrorCode`
- `frontend/src/utils/mapMeiGuideValidateErrorToUserMessage.ts` (novo)
- `frontend/src/utils/mapMeiGuideValidateErrorToUserMessage.test.ts` (novo)
- `frontend/src/pages/GuidesMei.tsx` — CONS-C no bloco de validação CNPJ (`useId` para título a11y)

### Notes

- Pedidos `POST …/Emitir` passam por `serproApiFetch` para alinhar com `__setHttpClientsForTests` (antes usavam `fetch` global e o teste 503 falhava).
- Gates: `npm run lint`, `npm run typecheck`, `npm test` na raiz — OK (2026-04-08).
- **FR-CONS-EVID-01:** trilho de evidência — PRD/spec UX/arquitetura no cabeçalho da story; brief de consola alinhado ao mesmo epic: [`docs/brief/brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md`](../brief/brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md). Runbook — mapa da tríade (GET 404 / POST prefeitura / validate Serpro): [`docs/operacao-mei-nfse.md#triagem-erros-consola-guia-mei`](../operacao-mei-nfse.md#triagem-erros-consola-guia-mei).
- **Follow-up QA (2026-04-08):** teste `emitir-relatorio-serpro-503.test.js` para 5xx→503; `useId()` no título CONS-C para ids únicos por instância (`GuidesMei`).

### Change Log

- 2026-04-08 — Implementação FR-CONS P0 Serpro 503 + copy CONS-C no validate Guia MEI.
- 2026-04-08 — Ajustes pós-QA: teste `emitirRelatorio` 5xx→503; `useId` no bloco CONS-C; nota FR-CONS-EVID-01 + brief consola no Dev Record.
- 2026-04-08 — FR-CONS-EVID-01: ligação explícita ao runbook [`operacao-mei-nfse.md#triagem-erros-consola-guia-mei`](../operacao-mei-nfse.md#triagem-erros-consola-guia-mei) (story P1 operação tríade).

---

## QA Results

### 2026-04-08 — Quinn (@qa)

**Decisão de gate:** **PASS** (observações não bloqueantes abaixo).

**Evidência de qualidade (NFR-CONS-04):** `npm run lint`, `npm run typecheck` e `npm test` na raiz do repositório — concluídos com sucesso (exit code 0) na revisão.

**Rastreabilidade face aos critérios de aceite**

| Área | Evidência |
|------|-----------|
| **Backend 503** | `emitir.service.js`: respostas Serpro com `status >= 500` → `serviceUnavailable` com mensagem em português; `errorHandler.js` serializa `success: false`, `message`, `errors`. |
| **Corpo JSON / `errors`** | Objeto com `code` (`MEI_GUIDE_SERPRO_UNAVAILABLE`), `integration` (`serpro`), `upstreamStatus` (número), alinhado a `mei-guide-error-codes.js`. |
| **4xx** | Teste `emitir-servico-serpro-503.test.js` confirma **400** + `badRequest` para resposta Serpro 400. |
| **Logs (não-prod)** | `console.info('[emitir] Serpro upstream erro', { integration, upstreamStatus })` — sem CNPJ. |
| **Teste 5xx→503 + code** | `backend/tests/emitir-servico-serpro-503.test.js` cobre 500 → `HttpError` 503 e `errors.code`. |
| **Frontend CONS-C** | `mapMeiGuideValidateErrorToUserMessage.ts` + testes Vitest; copy alinhada à spec UX §6.2 (título + corpo); não reutiliza componentes/copy de cadastro Plugnotas / NFS-e / prefeitura. |
| **Fallback “Internal Server Error”** | Mapper trata 400 + primeira linha genérica; comentário datado no util; `<details>` com detalhe técnico em `GuidesMei.tsx` quando aplicável. |
| **503 / `apiErrorCode`** | `ApiClientError.apiErrorCode` a partir de `errors.code`; ramos 502/503 e código estável mapeiam para CONS-C. |
| **A11y (spec §9)** | CONS-C: `role="region"` + `aria-labelledby` no título; erros “plain”: `role="alert"`. Coerente com região secundária quando outro alerta primário pode existir na página. |
| **Contrato `errors`** | `errors.code` é chave distinta de `plugnotasRequest` / `plugnotasCode` — baixo risco de colisão no payload tipado em `buildApiErrorMessage.ts`. |

**Observações (não bloqueantes)**

1. **`emitirRelatorio`:** o mesmo padrão 5xx→503 foi aplicado no fluxo de relatório; **não** há teste automatizado dedicado (a story centra-se no validate via `emitirServico`). Recomendação: considerar um caso de teste espelhado se a equipa quiser fechar integralmente a nota de integração CodeRabbit da story.
2. **FR-CONS-EVID-01:** o cabeçalho da story aponta PRD, spec UX e arquitetura; confirmar com PO se a referência ao *brief consola* exige linha explícita no corpo ou se trilhos no topo são suficientes.
3. **`id="mei-guide-validate-cons-c-title"`:** válido enquanto existir um único bloco CONS-C por vista; duplicar o padrão noutro sítio exigiria ids únicos.

**Conclusão:** implementação consistente com **FR-CONS-SERPRO-01** e microcopy **CONS-C**; recomendado seguir para revisão de arquitetura (@architect) e merge/push (@github-devops) conforme fluxo do projeto.

— Quinn, guardião da qualidade
