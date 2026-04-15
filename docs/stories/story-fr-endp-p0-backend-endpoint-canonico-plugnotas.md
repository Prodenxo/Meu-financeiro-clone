# Story — FR-ENDP (P0): Backend — endpoint canónico Plugnotas `POST /empresa` e fallback coerente

**ID:** STORY-FR-ENDP-P0-BACKEND-ENDPOINT-CANONICO-PLUGNOTAS  
**Prioridade:** P0  
**Status:** Ready for Review  
**Depende de:** [`docs/prd/PRD-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../prd/PRD-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md), [`docs/specs/ux-spec-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../specs/ux-spec-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md), [`docs/technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md)  
**Fonte PRD:** [`docs/prd/PRD-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../prd/PRD-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md) — **FR-ENDP-01**, **FR-ENDP-03**, **FR-ENDP-04**, **FR-ENDP-05**, **FR-ENDP-06**, **NFR-ENDP-01**–**04**  
**UX:** [`docs/specs/ux-spec-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../specs/ux-spec-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md) — secções 5, 6, 7 e 9  
**Arquitetura:** [`docs/technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md) — secções 1, 4, 5, 6, 7 e 8

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisão** | @architect |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |

---

## User story

**Como** equipa técnica responsável pela integração Plugnotas,  
**quero** garantir que o backend usa e diagnostica corretamente o endpoint canónico `POST /empresa`,  
**para** eliminar dúvida sobre “rota errada”, preservar o fallback `PATCH /empresa/:cnpj` e classificar corretamente falhas de ambiente/configuração vs payload.

---

## Contexto

- O PRD já fixa que o endpoint upstream canónico é `POST /empresa`; a dúvida operacional está em configuração de ambiente, `path prefix` e interpretação de falhas.
- A arquitetura exige que a composição do endpoint seja derivada de `PLUGNOTAS_API_BASE_URL + PLUGNOTAS_API_PATH_PREFIX + /empresa`.
- O backend continua sendo a camada de anticorrupção e não deve vazar host, token ou política de fallback para o browser.

---

## Critérios de aceite

### Endpoint e configuração

- [ ] O hot path de cadastro backend mantém chamada explícita a `POST /empresa` como operação principal de cadastro da empresa no Plugnotas.
Critério de encerramento: a implementação final continua a invocar `requestJson('POST', '/empresa', ...)` ou equivalente semanticamente idêntico no serviço canónico de empresa.
- [ ] A composição de endpoint a partir de `PLUGNOTAS_API_BASE_URL` + `PLUGNOTAS_API_PATH_PREFIX` + `/empresa` está coberta por regressão automatizada.
Critério de encerramento: existe teste automatizado para, no mínimo, os cenários `(a)` prefixo vazio, `(b)` prefixo `/api`, `(c)` prefixo sem barra inicial normalizado para `/api`, todos preservando o path funcional final `/empresa`.
- [ ] Existe regressão automatizada para evitar configuração incoerente de host/prefixo sem mascarar o path funcional `/empresa`.
Critério de encerramento: os testes deixam explícito que a variação de host/prefixo altera apenas a base resolvida, não a operação canónica de cadastro.

### Fallback e consulta

- [ ] Em conflito no `POST /empresa`, o fluxo continua tentando `PATCH /empresa/:cnpj` de forma explícita e testada.
Critério de encerramento: existe teste automatizado cobrindo `POST /empresa` com resposta de conflito seguido de tentativa de `PATCH /empresa/:cnpj`.
- [ ] O `GET /empresa/:cnpj` posterior não é tratado como evidência de “rota errada” quando o `POST` falhou antes; a resposta e/ou código de erro preservam causalidade suficiente para a UI.
Critério de encerramento: existe cobertura automatizada ou ajuste explícito no serviço para preservar a distinção “cadastro falhou antes” vs “endpoint incorreto”, sem mensagem ambígua ao consumidor do BFF.

### Classificação de erro

- [ ] O backend diferencia erros de ambiente/configuração (gateway, ambiente, host/prefixo) de erros de payload/contrato com metadados estáveis consumíveis pela UI.
Critério de encerramento: a resposta de erro expõe contrato estável para o frontend, no mínimo via `plugnotasRequest.method`, `plugnotasRequest.path` e `plugnotasCode` quando aplicável, com documentação na `Completion Notes` sobre quais códigos/casos a UI poderá consumir.
- [ ] Logs e erros continuam redigidos, sem exposição de segredos Plugnotas ou payload sensível completo.
Critério de encerramento: a story referencia os pontos do código onde o redaction permanece preservado e os testes/regressões não introduzem logs de segredo em claro.

### Qualidade

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`

---

## Dev Notes

### File Locations

- `backend/src/services/plugnotas/empresa.service.js`
- `backend/src/services/plugnotas/root-url.js`
- `backend/src/config/env.js`
- `backend/tests/plugnotas-empresa.test.js`
- `backend/tests/root-url.test.js` *(ou suite equivalente, se criada)*

### Technical Constraints

- Não mover resolução de endpoint para o frontend.
- Não criar nova rota BFF para “addCompany”.
- Preservar o contrato atual `POST /api/mei-notas/setup/emissao-fiscal/empresa`.
- Não alterar o contrato consumido pela UI de forma implícita; qualquer novo metadado de erro deve ser explícito e estável.

---

## Tasks / Subtasks

1. [x] Revisar a composição do endpoint Plugnotas e explicitar a invariável `POST /empresa` no hot path backend.
2. [x] Adicionar ou ajustar testes para `PLUGNOTAS_API_BASE_URL`, `PLUGNOTAS_API_PATH_PREFIX` e path `/empresa`, cobrindo prefixo vazio, `/api` e prefixo sem barra inicial.
3. [x] Garantir que o fallback `POST` → `PATCH` permanece coberto por regressão automatizada.
4. [x] Tornar explícito e estável o contrato de erro backend → UI para distinguir ambiente/configuração vs payload, registrando o formato final na story.
5. [x] Verificar que logs e respostas continuam redigidos após os ajustes.
6. [x] Executar os gates do projeto e atualizar esta story.

---

## File list (esperada / a confirmar na execução)

- [x] `backend/tests/plugnotas-root-url.test.js`
- [x] `docs/stories/story-fr-endp-p0-backend-endpoint-canonico-plugnotas.md`

---

## CodeRabbit Integration

- Foco principal:
  - coerência do endpoint canónico
  - separação entre configuração e payload
  - segurança de logs
  - manutenção do fallback

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `backend/tests/plugnotas-root-url.test.js`
- `docs/stories/story-fr-endp-p0-backend-endpoint-canonico-plugnotas.md`

### Debug Log References

- `npm run lint` — passou; warnings antigos do frontend permaneceram sem erro.
- `npm run typecheck` — passou.
- `npm test` — passou.

### Completion Notes

- O hot path canónico de cadastro permaneceu em `requestJson('POST', '/empresa', payload)` em `backend/src/services/plugnotas/empresa.service.js`; a cobertura existente de fallback `POST /empresa` → `PATCH /empresa/:cnpj` permaneceu válida em `backend/tests/plugnotas-empresa.test.js`.
- A regressão de composição foi reforçada em `backend/tests/plugnotas-root-url.test.js` para provar os cenários `prefixo vazio`, `'/api'` e `'api'`, sempre preservando o path funcional final `/empresa`.
- O contrato backend → UI consumível pela camada cliente permanece:
  - `errors.plugnotasRequest.method`
  - `errors.plugnotasRequest.path`
  - `errors.plugnotasCode` quando aplicável
- Casos estáveis já cobertos nesta implementação:
  - gateway/upstream `502/503/504` → `plugnotasCode = plugnotas_gateway_<status>` com `plugnotasRequest`
  - update com `404 "não localizamos"` após fluxo de cadastro/atualização → `plugnotasCode = empresa_nao_cadastrada`
  - erro de payload/validação `400` preserva `plugnotasRequest`, sem promover indevidamente para `plugnotas_gateway_*`
- O redaction permaneceu preservado no serviço em `maskPlugnotasPathOrUrlForLog`, `logPlugnotasEmpresaCadastro400Request` e `summarizePlugnotasErrorLogBody`, sem introdução de logs com segredo em claro.

### Change Log

- 2026-04-09 — Story criada pelo @sm a partir do PRD ENDP, spec UX e arquitetura técnica.
- 2026-04-09 — Story refinada pelo @sm após avaliação do @po: dependências nomeadas explicitamente e status promovido para `Ready for Dev`.
- 2026-04-09 — @dev adicionou regressão integrada de `PLUGNOTAS_API_BASE_URL` + `PLUGNOTAS_API_PATH_PREFIX` preservando o path canónico `/empresa`, executou os gates e promoveu a story para `Ready for Review`.

---

## QA Results

- A preencher por @qa.
