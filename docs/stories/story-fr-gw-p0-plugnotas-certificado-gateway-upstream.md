# Story — FR-GW (P0): **Gateway upstream (502/503/504)** — normalização BFF + copy Guia MEI + documentação

**ID:** STORY-FR-GW-P0-PLUGNOTAS-CERT-GATEWAY  
**Prioridade:** P0  
**Depende de:** —  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-mei-plugnotas-certificado-gateway-upstream-502-2026-04-08.md`](../prd/PRD-mei-plugnotas-certificado-gateway-upstream-502-2026-04-08.md) — **FR-MEI-CERT-GW-01**, **FR-UX-FISC-GW-01**–**FR-UX-FISC-GW-03**, **FR-GW-QA-01**, **NFR-DOC-MEI-01**, **NFR-GW-01**–**03**, **CR-GW-01**–**03**  
**UX:** [`docs/specs/ux-spec-mei-plugnotas-certificado-gateway-upstream-502-2026-04-08.md`](../specs/ux-spec-mei-plugnotas-certificado-gateway-upstream-502-2026-04-08.md) — GW-L0–L4, microcopy §4, semântica §6  
**Arquitetura:** [`docs/technical/architecture-mei-plugnotas-certificado-gateway-upstream-502-2026-04-08.md`](../technical/architecture-mei-plugnotas-certificado-gateway-upstream-502-2026-04-08.md) — módulo `plugnotas-gateway-upstream-error.js`, integração `requestFormData` / `requestJson`, FE `mapMeiFiscalErrorToCopy`

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — paridade com doc técnica §3; não alargar normalização a respostas 2xx nem a 400 JSON |

---

## User story

**Como** MEI que envia o certificado A1 no Guia MEI (emissor fiscal Plugnotas),  
**quero** que erros **502, 503 ou 504** (ou respostas HTML de proxy) sejam mostrados como **indisponibilidade temporária do emissor**, com texto legível em português e **sem** HTML nem mensagens que pareçam “validação JSON” ou rejeição do meu ficheiro,  
**para** saber que devo **tentar de novo** ou verificar configuração no servidor, sem pânico nem confusão com validação de dados.

---

## Contexto

- **Estado actual:** `empresa.service.js` propaga corpo HTML do upstream em `message`; a UI trata como validação no provedor e pode duplicar o bloco longo (`LongFiscalErrorMessage` + rodapé genérico sobre JSON).  
- **Decisão PRD §6.3:** **dupla defesa** — BFF normaliza `message`; FE mantém heurística defensiva (status + HTML / código estável).  
- **404 GET empresa** após falha de certificado é **esperado** — apenas documentar em operação (**NFR-DOC-MEI-01**), não “corrigir” como bug nesta story.  
- **Stretch P2 (opcional na mesma sprint se esforço marginal):** **FR-MEI-CERT-GW-02** (`errors.plugnotasCode` `plugnotas_gateway_*`) + **FR-UX-FISC-GW-04** (link secundário sem misturar com `GUIMEI_CONNECTIVITY_CERTIFICATE_MESSAGE`). Se não couber, deferir com nota no Change Log.

---

## Critérios de aceite

### Backend (**FR-MEI-CERT-GW-01**, **NFR-GW-02**)

- [ ] Existe módulo dedicado (ex.: `backend/src/services/plugnotas/plugnotas-gateway-upstream-error.js`) com heurística **documentada** no ficheiro: status **502 / 503 / 504** e/ou corpo HTML de gateway (`text/html`, ou string que começa por `<` com marcadores acordados — alinhar à arquitetura §3.1).  
- [ ] `requestFormData` e `requestJson` em `empresa.service.js`, no ramo `!response.ok`, substituem `message` exposta ao cliente por texto **canónico PT** alinhado ao PRD §6.1 / UX spec §4.2 quando a normalização aplicar.  
- [ ] Merge de `errors` com `plugnotasRequestErrors(method, path)` existente **sem** quebrar clientes.  
- [ ] Logs: `method`, path mascarado, `status`, `content-type`; **não** registar HTML completo em destinos de produção (arquitetura §3.2).  
- [ ] **CR-GW-02:** resposta **400** com JSON Plugnotas de validação **não** passa pela substituição gateway (regressão por teste).

### Frontend (**FR-UX-FISC-GW-01**–**03**, **CR-GW-03**)

- [ ] `mapMeiFiscalErrorToCopy` (ou camada única) classifica gateway: título **GW-T-A ou GW-T-B** (UX §4.1 — escolher **uma** variante na implementação / PO), descrição §4.2.  
- [ ] Prioridade: se existir `plugnotasCode` com prefixo `plugnotas_gateway_` (**FR-MEI-CERT-GW-02** quando implementado), mapear **antes** de parse de HTML.  
- [ ] **FR-UX-FISC-GW-02:** `technicalDetail` / `LongFiscalErrorMessage` **não** exibem HTML bruto nem duplicam o mesmo parágrafo longo para este caso (`meiFiscalUserCopyToUserFacing` ou *call sites*).  
- [ ] **FR-UX-FISC-GW-03:** em `FiscalIntegrationErrorAlert.tsx`, rodapé **condicional** — não mostrar copy genérica de “validação de JSON / campos fiscais” como causa principal quando o erro for gateway (UX §4.3).  
- [ ] Manter `source` / categoria fiscal coerente com **CR-GW-03** (provedor fiscal; copy de indisponibilidade).

### Documentação (**NFR-DOC-MEI-01**)

- [ ] `docs/operacao-mei-nfse.md`: bullets — (1) 502/503/504 no POST certificado = indisponibilidade/gateway, checklist URL/chave/ambiente/retry; (2) 404 GET empresa após falha de certificado = esperado até sucesso; ligação ao PRD ou âncora interna.

### Qualidade (**FR-GW-QA-01**, **NFR-GW-01**)

- [ ] Testes unitários BE no módulo gateway (HTML + status, 502 sem HTML, 400 JSON intocado).  
- [ ] Testes unitários FE: `mapMeiFiscalErrorToCopy` com mensagem HTML 502 e com status 502; regressão com *fixture* 400 realista.  
- [ ] `npm run lint`, `npm run typecheck`, `npm test` — exit 0.

### Fora desta story

- Disponibilidade do Plugnotas; alteração do contrato **2xx** do multipart (**CR-GW-01**).  
- **FR-UX-FISC-GW-04** obrigatório — opcional P2.  
- i18n.

---

## Tasks (indicativas)

1. [x] Implementar `plugnotas-gateway-upstream-error.js` + testes.  
2. [x] Integrar em `requestFormData` / `requestJson` (`empresa.service.js`).  
3. [x] FE: `isMeiFiscalGatewayUpstreamError` + ramo em `mapMeiFiscalErrorToCopy`; constantes de copy alinhadas à UX spec.  
4. [x] FE: `meiFiscalUserCopyToUserFacing` / alerta — suprimir detalhe HTML; rodapé condicional em `FiscalIntegrationErrorAlert.tsx`.  
5. [x] *(Opcional P2)* `plugnotasCode` no `HttpError` + constantes em `plugnotasApiErrorCode.ts`.  
6. [x] Actualizar `docs/operacao-mei-nfse.md`.  
7. [x] Gates + **File list** + **Dev Agent Record**.

---

## File list (indicativo)

- [x] `backend/src/services/plugnotas/plugnotas-gateway-upstream-error.js` *(novo)*  
- [x] `backend/tests/plugnotas-gateway-upstream-error.test.js` *(novo)*  
- [x] `backend/src/services/plugnotas/empresa.service.js`  
- [x] `frontend/src/lib/fiscalUserError.ts`  
- [x] `frontend/src/lib/fiscalUserError.test.ts`  
- [x] `frontend/src/lib/meiFiscalUserCopyToUserFacing.ts`  
- [x] `frontend/src/components/FiscalIntegrationErrorAlert.tsx`  
- [x] `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`  
- [x] `frontend/src/utils/plugnotasApiErrorCode.ts`  
- [x] `frontend/src/utils/apiClientError.ts`  
- [x] `frontend/src/utils/apiClientError.test.ts`  
- [x] `frontend/src/services/apiClient.ts`  
- [x] `frontend/src/types/userFacingError.ts`  
- [x] `frontend/src/components/UserFacingErrorBlock.tsx`  
- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `docs/operacao-mei-nfse.md`

---

## CodeRabbit Integration

- Focar: não mascarar 400 JSON útil; não logar HTML completo; paridade copy FE com mensagem BFF; sem PII nova em logs.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### Agent Model Used

Cursor Agent (implementação)

### Completion Notes List

- BFF: `resolvePlugnotasGatewayUpstreamForClient` para HTTP 502/503/504; `errors` inclui `plugnotasRequest` + `plugnotasCode` `plugnotas_gateway_*`; logs de debug com `[gateway_upstream HTTP n]` em vez do corpo HTML.
- FE: `mapMeiFiscalErrorToCopy` prioriza gateway; `ApiClientError.httpStatus` + `GuidesMei` propagam status ao painel certificado; `UserFacingErrorBlock.sourceFootnote` para rodapé UX gateway; `npm run lint`, `typecheck`, `test` — exit 0.
- Pós-QA (obs. 1): `summarizePlugnotasErrorLogBody` — em debug/prod com `PLUGNOTAS_DEBUG`, erros **não** gateway deixam de logar HTML completo (placeholder + truncagem a 800 chars).
- Pós-QA (obs. 2): testes de integração em `plugnotas-empresa.test.js` — POST `/empresa` 502 HTML e POST `/certificado` 502 HTML + reforço CR-GW-02 no 400 existente.
- Pós-QA (obs. 3): copy do título corresponde a **GW-T-A** (indisponibilidade temporária); confirmação explícita PO no DoD se ainda necessária.

### File List

Ver secção **File list** acima (checklist actualizado).

### Debug Log References

—

### Change Log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | @sm | Story criada a partir do PRD, UX spec e arquitetura FR-GW (gateway certificado Plugnotas). |
| 2026-04-08 | @dev | Implementação FR-MEI-CERT-GW-01 + FE + `operacao-mei-nfse.md` + testes BE/FE. |
| 2026-04-08 | @dev | Follow-up QA: `summarizePlugnotasErrorLogBody`, testes integração empresa 502/400 CR-GW-02. |

---

## QA Results

*(preencher por @qa após implementação)*

### Revisão @qa — 2026-04-08

**Gate:** **PASS** (com observações menores abaixo)

#### Rastreio aos critérios de aceite

| Área | Verificação | Resultado |
|------|-------------|-----------|
| **BE — módulo** | `plugnotas-gateway-upstream-error.js` existe, comentário de heurística (502–504; 400 excluído; HTML documentado para `isLikelyGatewayHtmlBody`, uso principal = status). | Atende |
| **BE — integração** | `requestJson` / `requestFormData` aplicam `resolvePlugnotasGatewayUpstreamForClient(response.status)`, `message` canónica PT, `errors` = `plugnotasRequest` + `plugnotasCode`. | Atende |
| **BE — CR-GW-02** | Normalização só quando `shouldNormalizePlugnotasGatewayError` (502/503/504); 400 mantém `rawMessage` de validação. | Atende (lógica + teste `resolve(..., 400) → null`) |
| **BE — logs** | Com gateway, log de debug usa `[gateway_upstream HTTP n]` em vez do HTML; fora gateway em produção só com `PLUGNOTAS_DEBUG` (ou equivalente) — HTML completo ainda pode aparecer nesse modo de debug para erros não gateway. | Atende NFR para o caso gateway; ver observação 1 |
| **FE — GW-T** | Título **«Emissor fiscal temporariamente indisponível»** + descrição alinhada ao PRD/UX (paridade com `MEI_FISCAL_GATEWAY_UPSTREAM_DESCRIPTION` / BFF). | Atende (equivale a variante GW-T-A / indisponibilidade) |
| **FE — ordem** | Gateway avaliado **antes** de `certificado_409_sem_id` e restantes ramos; `plugnotas_gateway_*` priorizado via `isPlugnotasGatewayUpstreamCode`. | Atende |
| **FE — FR-UX-FISC-GW-02** | `gatewayUpstream` → sem `technicalDetail` em `meiFiscalUserCopyToUserFacing`; `GuiaMeiEmpresaCadastroErrorPanel` omite `LongFiscalErrorMessage` quando gateway. | Atende |
| **FE — FR-UX-FISC-GW-03** | Rodapé condicional (texto de validação JSON genérico substituído por copy de indisponibilidade). | Atende |
| **FE — CR-GW-03** | `category` / `source` mantidos `provedor_fiscal`; `sourceFootnote` específico para gateway. | Atende |
| **Doc — NFR-DOC-MEI-01** | `docs/operacao-mei-nfse.md` § «Gateway upstream Plugnotas» com 502/503/504, `plugnotasCode`, HTML, 404 GET pós-falha, links brief/PRD. | Atende |
| **Testes — FR-GW-QA-01** | BE: `plugnotas-gateway-upstream-error.test.js`. FE: `fiscalUserError.test.ts` (código + `httpStatus`), `FiscalIntegrationErrorAlert.test.tsx` (painel sem `<html>` / sem rodapé JSON genérico), regressão implícita via testes existentes de validação Plugnotas / JSON opaco. | Atende |
| **Gates** | `npm test` executado na revisão — **exit 0**. | Atende |

#### Observações (não bloqueantes)

1. **Debug em produção:** se `isPlugnotasDebugExplicitlyEnabled()` estiver ativo, logs de erros **não** gateway ainda podem incluir `rawMessage` longo (possível HTML). Aceitável para opt-in de diagnóstico; alinhar expectativa operacional com a story CodeRabbit (não logar HTML completo em destinos de produção «normais»).
2. **Teste BE de integração:** não há teste de `empresa.service` com `fetch` mockado que prove 400 JSON vs 502 no mesmo ficheiro; a cobertura é a nível de módulo + leitura estática do ramo `!response.ok`. **Sugestão P3:** um teste focado em `requestFormData`/`requestJson` com corpo 400 realista vs 502, se o time quiser fechar CR-GW-02 com prova de regressão no serviço.
3. **DoD / PO:** confirmar explicitamente **GW-T-A vs GW-T-B** na UX spec se ainda houver ambiguidade formal; a implementação segue claramente o tom «indisponibilidade temporária» (GW-T-A).

#### Given–When–Then (amostra)

- **Given** resposta Plugnotas HTTP 502 com corpo HTML **When** o BFF processa `requestFormData`/`requestJson` **Then** o cliente recebe `message` PT canónica e `errors.plugnotasCode` `plugnotas_gateway_502` (e logs de debug não repetem o HTML no ramo gateway).
- **Given** mensagem agregada de validação NF-e/NFC-e (400) **When** `mapMeiFiscalErrorToCopy` corre **Then** o ramo gateway **não** substitui a copy de validação do provedor (regressão preservada pelos testes POSQA existentes + ausência de `plugnotas_gateway_*` no 400).

**Assinatura:** revisão estática de código + testes automatizados; sem CodeRabbit CLI nesta sessão (ambiente Windows; integração documentada em WSL).

—

---

## Definition of Done (resumo)

- Critérios de aceite marcados e evidência nos testes / revisão manual (ausência de `<html` na UI com *mock* 502).  
- PO: confirmação rápida do título escolhido (GW-T-A vs GW-T-B) se ainda não estiver fechado na story.
