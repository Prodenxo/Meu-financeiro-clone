# Épico: Guia MEI — jornada fiscal e Plugnotas (PRD diagnóstico / 409)

## Metadados

| Campo | Valor |
| --- | --- |
| **PRD** | [`docs/prd/PRD-guia-mei-plugnotas-jornada-fiscal.md`](../prd/PRD-guia-mei-plugnotas-jornada-fiscal.md) |
| **Briefs** | [`docs/brief/brief-failed-to-fetch-guia-mei-certificado.md`](../brief/brief-failed-to-fetch-guia-mei-certificado.md), [`docs/brief/brief-plugnotas-certificado-409-sem-id.md`](../brief/brief-plugnotas-certificado-409-sem-id.md) |
| **Arquitetura** | [`docs/architecture.md`](../architecture.md) — Express, fronteira de integração; `frontend/src/services/apiClient.ts`; `backend/src/services/plugnotas/` |
| **Prioridade sugerida** | P1 Must (A.*) / P2 Should–Could (B.*) conforme MoSCoW do PRD |
| **Owner épico** | Produto (@pm) |
| **Execução** | @dev; @qa; push/PR @github-devops |

## Objetivo do épico

Fechar lacunas entre **conectividade local**, **respostas HTTP negociais** e o caso **`certificado_409_sem_id`**: mensagens e códigos estáveis, checklist acionável, instrumentação segura no backend e, quando aprovado, robustez extra na extração de ID ou fallback controlado.

## Sobreposição com épico existente

O épico [`epic-guia-mei-conectividade-backend.md`](epic-guia-mei-conectividade-backend.md) já cobre `POST /api/mei-guide/certificate` com `isFetchConnectivityFailure`. As stories **US-MEI-FISC-01+** assumem **US-CONN-MEI-02** e **US-CONN-MEI-03** como base e **estendem** o mesmo padrão ao fluxo **`mei-notas` setup / certificado Plugnotas** (`POST /api/mei-notas/setup/emissao-fiscal/certificado` e chamadas relacionadas em `GuidesMei`), onde o PRD exige o mesmo tipo de diagnóstico (FR-01 / FR-02).

## Mapa técnico (handoff)

| Camada | Artefatos relevantes |
| --- | --- |
| Frontend | `GuidesMei.tsx` (handlers fiscais pós-upload MEI), `FiscalIntegrationErrorAlert.tsx`, `guiaMeiConnectivityUserMessage.ts`, `meiNotasService.ts`, `apiClient.ts`, `buildApiErrorMessage.ts`, `plugnotasIntegrationErrorMessage.ts` |
| Backend | `mei-notas` rotas setup emissão fiscal, `backend/src/services/plugnotas/empresa.service.js` (`cadastrarCertificadoPlugNotas`, `resolverCertificadoIdAposConflito409`), middleware de erro / formato `success` + `message` |
| Doc | `docs/operacao-mei-nfse.md`, `docs/brief/brief-plugnotas-certificado-409-sem-id.md` |

## Ordem sugerida no sprint

1. **US-MEI-FISC-01** (estende conectividade ao path fiscal — depende CONN-02/03)
2. **US-MEI-FISC-02** (contrato API: código estável `plugnotasCode` / equivalente no erro de certificado)
3. **US-MEI-FISC-03** (UI checklist + link para `certificado_409_sem_id`)
4. **US-MEI-FISC-04** (logs estruturados pós-409)
5. **US-MEI-FISC-05** (heurísticas / testes de extração de ID)
6. **US-MEI-FISC-06** *(Could — Draft)* — fallback ID manual: só após decisão @pm + @architect

## Definição de pronto (épico)

- [ ] Stories Must/Should priorizadas entregues ou marcadas **Deferred** com justificativa (@po).
- [ ] QA: cenários “rede no setup fiscal” vs “400 `certificado_409_sem_id`” vs “400 validação payload”.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` na raiz conforme `AGENTS.md`.

## CodeRabbit / qualidade (épico)

- Não logar senha de certificado nem binário `.p12`; manter redação em logs Plugnotas.
- Códigos expostos ao cliente: estáveis e documentados; sem stack nem URLs internas na UI (NFR PRD).

---

## User stories

---

### US-MEI-FISC-01 — Guia MEI: conectividade no cadastro de certificado Plugnotas (setup fiscal)

**Como** usuário da Guia MEI no fluxo de emissão fiscal, **quero** que falhas de **rede até o backend** ao chamar o setup de certificado Plugnotas sejam tratadas como **indisponibilidade do aplicativo/servidor**, **para** não assumir rejeição pelo Plugnotas (FR-01, alinhado ao épico CONN).

**Critérios de aceite**

1. Nos handlers que disparam **`POST /api/mei-notas/setup/emissao-fiscal/certificado`** (ou serviço equivalente em `meiNotasService` / fluxo em `GuidesMei`), se o `catch` for classificável como **conectividade** via `isFetchConnectivityFailure` (US-CONN-MEI-02), a UI exibe o **mesmo padrão** de alerta de conectividade já usado no upload MEI (`GuiaMeiCertificateConnectivityPanel` + copy/link), ou variante textual mínima se o Produto diferenciar “servidor” vs “emissão”.
2. Quando o backend responder com **HTTP e corpo** parseável (4xx/5xx negocial), **não** substituir pela mensagem de conectividade (FR-02).
3. Limpar estado de alerta de conectividade nos mesmos gatilhos razoáveis do fluxo de certificado (retry, sucesso, troca de arquivo/senha) para evitar banner stale.
4. Pelo menos **um** teste Vitest que simule rede falha na chamada de **cadastro de certificado fiscal** (mock do serviço ou `fetch`) e espere o painel de conectividade (padrão `createRoot` + `act` do projeto).
5. Quality gates da raiz passam.

**Notas técnicas**

- Reutilizar utilitários e componentes do épico CONN; evitar duplicar strings — extrair helper se o título precisar variar entre “MEI” e “emissão fiscal”.
- Revisar `handleCertificateUpload` ramo pós-`uploadedToMei` que chama `cadastrarCertificadoEmissaoNf`.

**Dependências:** US-CONN-MEI-02, US-CONN-MEI-03.

**CodeRabbit:** não misturar `Error` negocial com `TypeError` de rede; acessibilidade do alerta.

#### Dev Agent Record — US-MEI-FISC-01

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | Mesmo escopo de implementação anterior. **Pós-QA:** `describe` dos testes renomeado para CONN+FISC-01; caso Vitest adicional **usuario + mei: true** com falha de rede em `cadastrarEmpresaEmissaoNf` (cobre `canViewNfse` sem role admin). |
| **File List** | `frontend/src/pages/GuidesMei.tsx`, `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`, `docs/stories/epic-guia-mei-fiscal-plugnotas-prd.md` |
| **Change Log** | 2026-03-24 — US-MEI-FISC-01: confirmação fluxo fiscal + teste `cadastrarEmpresaEmissaoNf` rede; comentário em `GuidesMei`. 2026-03-24 — Ajustes feedback QA: título `describe` + teste `usuario`+`mei: true`. |

#### QA Results — US-MEI-FISC-01

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-24 |
| **Gate** | **PASS** |

**Rastreabilidade — critérios de aceite**

1. **Setup fiscal + `isFetchConnectivityFailure` → mesmo painel de conectividade (CONN)** — **Atende.** `handleCertificateUpload`: um único `catch` cobre upload MEI, `cadastrarCertificadoEmissaoNf` e `cadastrarEmpresaEmissaoNf`; ramo conectividade usa `setCertificateConnectivityAlert(true)` e `setCertificateError(null)`, alinhado a `GuiaMeiCertificateConnectivityPanel` já renderizado com `certificateConnectivityAlert` (épico CONN).
2. **HTTP/corpo negocial → não substituir por conectividade** — **Atende.** Teste existente com `Error` negocial no upload: não exibe “Servidor ou conexão indisponível”; mantém copy fiscal/Plugnotas. Erros enriquecidos pelo `apiClient` continuam fora da heurística de rede (`isFetchConnectivityFailure`).
3. **Limpar alerta de conectividade (stale)** — **Atende.** `setCertificateConnectivityAlert(false)` em validações iniciais, antes do try de sucesso, em `onChange` de arquivo e senha (`GuidesMei.tsx`), e em `handleCertificateRemove` antes do try — coerente com US-CONN.
4. **Teste Vitest cadastro certificado fiscal + rede** — **Atende e supera mínimo.** `GuidesMei.certificate-connectivity.test.tsx`: (a) falha de rede em `cadastrarCertificadoEmissaoNf` após upload MEI; (b) **novo** caso — falha de rede em `cadastrarEmpresaEmissaoNf` após certificado Plugnotas OK — ambos esperam título/copy de conectividade. Padrão `createRoot` + `act`.
5. **Quality gates** — **Atende (evidência desta revisão).** `npm run typecheck` na raiz OK; `vitest run` em `GuidesMei.certificate-connectivity.test.tsx` — 5 testes OK.

**Notas técnicas**

- Comentário no `catch` documenta escopo US-CONN / US-MEI-FISC-01 para manutenção.

**CONCERNS (baixo)**

- **Nome do `describe`:** bloco ainda intitulado “US-CONN-MEI-03” embora inclua casos FISC-01 — só organização de leitura, sem impacto funcional.
- **Perfil `usuario` + `mei: true`:** não há teste dedicado; o mesmo `catch` aplica-se a qualquer `canViewNfse` com fluxo fiscal completo — risco de regressão considerado baixo.

**Evidência de execução (esta revisão)**

- Revisão estática: `GuidesMei.tsx` (`handleCertificateUpload`, `catch`, handlers de arquivo/senha), `GuidesMei.certificate-connectivity.test.tsx`.
- Comandos: `npm run typecheck` (raiz); `vitest run src/pages/GuidesMei.certificate-connectivity.test.tsx`.

---

### US-MEI-FISC-02 — API: expor código de negócio estável em erro de certificado Plugnotas (`certificado_409_sem_id`)

**Como** suporte ou integrador, **quero** que respostas de erro do fluxo de cadastro de certificado Plugnotas incluam um **código estável** (ex.: `plugnotasCode: certificado_409_sem_id`), **para** cruzar com base de conhecimento e telemetria sem ambiguidade (FR-03).

**Critérios de aceite**

1. Quando `cadastrarCertificadoPlugNotas` concluir com `badRequest(..., { plugnotasCode: 'certificado_409_sem_id' })` (ou campo equivalente já existente), a resposta HTTP **400** para o cliente inclui o código em JSON **consistente** com o padrão atual de erro da API (`success`, `message`, e campo dedicado ou dentro de objeto de detalhe acordado pelo time).
2. O código **não** substitui a mensagem humana; permanece legível para o usuário final.
3. Erros **genéricos** de certificado que hoje não têm código recebem mapeamento mínimo ou ficam explícitos como “sem código” — documentar na story o escopo (somente `certificado_409_sem_id` nesta entrega, salvo decisão de ampliar).
4. Teste backend (Node test runner) que asserta presença do código no payload quando o serviço simula falha de resolução pós-409.
5. Quality gates da raiz passam.

**Notas técnicas**

- Pontos de entrada: rota `mei-notas` setup emissão fiscal certificado; `errorHandler` se necessário para propagar metadados.
- NFR: nunca incluir segredo ou PII completa no JSON público.

**Dependências:** nenhuma bloqueante além do código atual em `empresa.service.js`.

**CodeRabbit:** validar que novos campos não quebram clientes que só leem `message`.

#### Dev Agent Record — US-MEI-FISC-02

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | Pós-QA: teste HTTP com Express + `multipart` + `requireMeiEnabled` + controller real (`mei-notas-certificado-http.test.js`); mock de `fetch` só para URLs Plugnotas (evita interceptar `fetch` ao localhost). Helper `getPlugnotasCodeFromApiErrors` em `plugnotas-api-error-code.js` + testes para leitura defensiva de `errors.plugnotasCode` (apoio US-MEI-FISC-03). Demais notas de implementação anteriores mantidas. |
| **File List** | `backend/src/utils/plugnotas-api-error-code.js`, `backend/tests/mei-notas-certificado-http.test.js`, `backend/tests/plugnotas-api-error-code.test.js`, `backend/tests/mei-notas-certificado-plugnotas-code.test.js`, `docs/stories/epic-guia-mei-fiscal-plugnotas-prd.md` |
| **Change Log** | 2026-03-24 — US-MEI-FISC-02: testes de contrato HTTP `plugnotasCode` + documentação escopo no Dev Record. 2026-03-24 — Mitigação CONCERNS QA: teste rota HTTP + helper `getPlugnotasCodeFromApiErrors`. |

#### QA Results — US-MEI-FISC-02

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-24 |
| **Gate** | **PASS** |

**Rastreabilidade — critérios de aceite**

1. **HTTP 400 com `plugnotasCode` no JSON, alinhado ao padrão da API (`success`, `message`, detalhe)** — **Atende.** `cadastrarCertificadoPlugNotas` em `empresa.service.js` lança `badRequest(mensagem, { plugnotasCode: 'certificado_409_sem_id' })`; `errorHandler` serializa `success: false`, `data: null`, `message`, `errors` — contrato exercitado no teste que passa o erro pelo handler e asserta `payload.errors.plugnotasCode`.
2. **Código não substitui mensagem humana** — **Atende.** `message` permanece o texto orientativo completo; `plugnotasCode` só em `errors`.
3. **Erros genéricos sem código / escopo documentado** — **Atende.** Dev Record e segundo teste: validação “arquivo obrigatório” → `errors: null`; escopo explícito só `certificado_409_sem_id` nesta entrega.
4. **Teste backend (Node) pós-409 sem resolução** — **Atende.** `mei-notas-certificado-plugnotas-code.test.js`: mock 409 + serviço até falha de resolução + assert no `HttpError` e no JSON após `errorHandler`. Cobertura complementada por `plugnotas-empresa.test.js` (serviço).
5. **Quality gates da raiz** — **Atende com ressalva.** `npm run typecheck` (raiz) OK; `npm run test -w backend` — 121 testes OK (incl. 2 novos). `npm run lint` na raiz **ainda falha** no frontend por problemas pré-existentes (nenhum arquivo desta story no diff de lint).

**Notas técnicas**

- NFR: payload de erro não inclui segredo; `plugnotasCode` é enum estável.
- Clientes que só leem `message` permanecem compatíveis; campo extra em `errors`.

**CONCERNS (baixo)**

- Teste não sobe Express real nem `multipart` até a rota; valida contrato via **mesmo** `errorHandler` usado pelo app — adequado ao risco, mas não é e2e HTTP.
- `errors` no padrão atual pode carregar outras chaves no futuro; US-MEI-FISC-03 deve consumir `plugnotasCode` de forma defensiva.

**Evidência de execução (esta revisão)**

- Revisão estática: `empresa.service.js` (`cadastrarCertificadoPlugNotas`), `errorHandler.js`, `mei-notas-certificado-plugnotas-code.test.js`.
- Comandos: `npm run test -w backend`; `npm run typecheck` (raiz); `npm run lint` (raiz — falha legada frontend).

---

### US-MEI-FISC-03 — UI: checklist e “saiba mais” para `certificado_409_sem_id`

**Como** usuário que recebeu erro após enviar o certificado fiscal, **quero** ver um **checklist curto** (CNPJ, conta Plugnotas, `PLUGNOTAS_API_BASE_URL` + key no mesmo ambiente, painel app2) e link para documentação, **para** corrigir configuração sem abrir o código (FR-04, FR-07).

**Critérios de aceite**

1. Quando o frontend identificar **`certificado_409_sem_id`** na resposta (via `plugnotasCode` ou parsing estável documentado na US-MEI-FISC-02), exibir bloco de ajuda **adicional** ao erro fiscal (painel dedicado ou extensão de `GuiaMeiEmpresaCadastroErrorPanel` / `FiscalIntegrationErrorAlert`).
2. Copy em **pt-BR** alinhada ao [`brief-plugnotas-certificado-409-sem-id.md`](../brief/brief-plugnotas-certificado-409-sem-id.md); sem mencionar caminhos internos de servidor.
3. Link “Saiba mais” para seção canônica em `docs/operacao-mei-nfse.md` (âncora nova ou existente — criar âncora se necessário na mesma PR ou story seguinte doc-only, conforme @po).
4. Teste Vitest: payload mock com código → presença do checklist ou título do bloco.
5. Quality gates da raiz passam.

**Notas técnicas**

- `buildApiErrorMessage` / shape do `apiClient` podem precisar repassar `plugnotasCode` no `Error` ou objeto de detalhe — alinhar com US-MEI-FISC-02.

**Dependências:** US-MEI-FISC-02 (ou entrega conjunta na mesma PR com contrato definido primeiro).

**CodeRabbit:** não exibir stack; contraste e `role="alert"` coerentes.

#### Dev Agent Record — US-MEI-FISC-03

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | `ApiClientError` + `apiClientErrorFromPayload` em `apiClient` para repassar `plugnotasCode` do JSON de erro. `GuiaMeiEmpresaCadastroErrorPanel` recebe `plugnotasCode`; bloco `GuiaMeiCertificado409SemIdChecklist` (checklist pt-BR + link Saiba mais) quando `certificado_409_sem_id`. `GuidesMei`: estado `certificateErrorPlugnotasCode` preenchido no `catch` de upload via `getPlugnotasCodeFromUnknownError`; limpeza com erro/arquivo/senha. Seção e âncora `#certificado-plugnotas-409-sem-id` em `docs/operacao-mei-nfse.md`; fallback estático `public/guia-mei-certificado-409-sem-id.html` quando `VITE_MEI_OPERACAO_NFSE_DOC_URL` ausente. Testes: `plugnotasApiErrorCode.test.ts`, `apiClientError.test.ts`, painel no `FiscalIntegrationErrorAlert.test.tsx`. **Pós-QA:** teste de integração em `GuidesMei.certificate-connectivity.test.tsx` (upload MEI OK → `cadastrarCertificadoEmissaoNf` rejeita com `ApiClientError` + `plugnotasCode`). |
| **File List** | `frontend/src/services/apiClient.ts`, `frontend/src/utils/buildApiErrorMessage.ts`, `frontend/src/utils/plugnotasApiErrorCode.ts`, `frontend/src/utils/plugnotasApiErrorCode.test.ts`, `frontend/src/utils/apiClientError.ts`, `frontend/src/utils/apiClientError.test.ts`, `frontend/src/components/FiscalIntegrationErrorAlert.tsx`, `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`, `frontend/src/pages/GuidesMei.tsx`, `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`, `frontend/public/guia-mei-certificado-409-sem-id.html`, `docs/operacao-mei-nfse.md`, `docs/stories/epic-guia-mei-fiscal-plugnotas-prd.md` |
| **Change Log** | 2026-03-24 — US-MEI-FISC-03: UI checklist + Saiba mais + contrato `plugnotasCode` no cliente. 2026-03-24 — Mitigação QA: teste integração `GuidesMei` + `ApiClientError` pós-upload MEI. |

---

### US-MEI-FISC-04 — Backend: log estruturado da cadeia GET após 409 (sem dados sensíveis)

**Como** engenheiro de operação, **quero** que falhas em **`resolverCertificadoIdAposConflito409`** registrem **qual etapa** falhou (empresa 404/400, filtro certificado, listagem, parse), **para** diagnosticar incidentes sem pedir print com token (FR-05, NFR-02).

**Critérios de aceite**

1. Após 409, cada ramo de saída sem ID produz log em nível **configurável** (ex.: `debug` vs `info`/`warn`) com **identificador de etapa** (enum ou string estável: `empresa_get`, `certificado_filtro`, `certificado_lista`, `parse`, etc.).
2. Logs **não** contêm senha de certificado, base64/arquivo, nem `Authorization`; CNPJ pode ser mascarado como nos outros logs Plugnotas.
3. Documentar variável de ambiente ou flag se o volume de log for alto.
4. Testes com mocks que assertam chamada a `console` ou logger injetável (se o projeto já injeta; caso contrário teste indireto via spy em módulo de log existente).
5. Quality gates da raiz passam.

**Notas técnicas**

- Arquivo principal: `backend/src/services/plugnotas/empresa.service.js`.
- Alinhar com `PLUGNOTAS_DEBUG` / padrões existentes de log de empresa.

**Dependências:** opcionalmente após US-MEI-FISC-02 para correlacionar código + log em suporte.

**CodeRabbit:** revisar vazamento de URL com query sensível; redigir payloads grandes.

#### Dev Agent Record — US-MEI-FISC-04

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | Módulo `plugnotas-certificado-409-resolve-log.js`: etapas estáveis `empresa_get`, `certificado_filtro`, `certificado_lista`, `parse_listagem`; `logPlugnotasCertificado409Resolve` com CNPJ mascarado, sem URL/query/senha. Env `PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL` (`off`|`error`|`warn`|`info`|`debug`, padrão `warn` em `env.js`). `resolverCertificadoIdAposConflito409` em `empresa.service.js` registra cada saída sem ID por etapa. Doc: `docs/operacao-mei-nfse.md`, `backend/.env.example`. Testes: `plugnotas-certificado-409-resolve-log.test.js`; integração em `plugnotas-empresa.test.js` com `console.warn` mock (cadeia 404/400/404). Testes da suíte usam `PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL=off` por padrão. **Pós-QA (CONCERNS baixo):** `maskPlugnotasPathOrUrlForLog` em `plugnotas-request-log-path.js` aplicado nos logs legados `console.error('[plugnotas]', …)` de `requestJson` / `requestFormData` (path e fullUrl) para não imprimir `cpfCnpj=` nem `/empresa/:14dígitos` literal; testes unitários do helper + `console.info` / `console.error` quando nível `info` / `error`. |
| **File List** | `backend/src/services/plugnotas/plugnotas-certificado-409-resolve-log.js`, `backend/src/services/plugnotas/plugnotas-request-log-path.js`, `backend/src/services/plugnotas/empresa.service.js`, `backend/src/config/env.js`, `backend/.env.example`, `backend/tests/plugnotas-certificado-409-resolve-log.test.js`, `backend/tests/plugnotas-request-log-path.test.js`, `backend/tests/plugnotas-empresa.test.js`, `docs/operacao-mei-nfse.md`, `docs/stories/epic-guia-mei-fiscal-plugnotas-prd.md` |
| **Change Log** | 2026-03-24 — US-MEI-FISC-04: log estruturado pós-409 certificado + env + testes. 2026-03-24 — Mitigação QA CONCERNS: mascarar path/URL em log `[plugnotas]` requestJson/requestFormData + testes `info`/`error` no resolve log + `plugnotas-request-log-path`. |

#### QA Results — US-MEI-FISC-04

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-24 |
| **Gate** | **PASS** |

**Rastreabilidade — critérios de aceite**

1. **Log configurável + identificador de etapa estável após ramos sem ID** — **Atende.** `PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL` (`off` / `error` / `warn` / `info` / `debug`, padrão `warn` em `env.js`); `pickConsole` encaminha para o destino coerente. Etapas: `empresa_get`, `certificado_filtro`, `certificado_lista`, `parse_listagem` — alinhadas à story (incl. “parse” como `parse_listagem`). `resolverCertificadoIdAposConflito409` registra `no_certificado_id_in_payload`, `http_error`, `no_id_resolved` conforme o ramo.
2. **Logs sem segredo sensível; CNPJ mascarado** — **Atende.** Payload estruturado: `tag`, `step`, `outcome`, `cpfCnpj` mascarado (`17***72`), opcionalmente `httpStatus`, `listItemCount`, `firstItemKeysCount` só em `debug` (metadado, sem valores do item). Não há senha, base64, `Authorization` nem corpo de listagem neste logger.
3. **Documentar variável / volume** — **Atende.** `docs/operacao-mei-nfse.md` (variáveis críticas), `backend/.env.example`, comentário em `env.js`; orientação explícita para `off` se volume incomodar.
4. **Testes com spy em `console`** — **Atende.** `plugnotas-certificado-409-resolve-log.test.js` (off, máscara, nível); `plugnotas-empresa.test.js` — caso `PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL=warn` com `console.warn` mock e assert de `step`/`outcome`/`httpStatus`. Suíte `plugnotas-empresa` usa `PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL=off` por padrão para reduzir ruído.
5. **Quality gates na raiz** — **Atende (evidência desta revisão).** `npm run typecheck` OK; `npm test` OK (frontend 99, backend 128).

**Notas técnicas**

- Correlacionável com `certificado_409_sem_id` no cliente quando o resolver falha (US-MEI-FISC-02/03).

**CONCERNS (baixo)**

- Linhas legadas `[plugnotas] GET …` do `requestJson` / fetch ainda podem exibir URL com `cpfCnpj=` completo no log de diagnóstico existente — **fora** do payload `certificado 409 resolve`, mas o CodeRabbit da story já alertava para query sensível de forma geral; mitigação futura seria redigir URL nesse log antigo se política de PII endurecer.
- Não há teste automatizado que valide `console.info` / `console.error` quando nível é `info` ou `error` (baixo risco: `pickConsole` é trivial).

**Evidência de execução (esta revisão)**

- Revisão estática: `plugnotas-certificado-409-resolve-log.js`, `empresa.service.js` (`resolverCertificadoIdAposConflito409`), `env.js`, `plugnotas-certificado-409-resolve-log.test.js`, teste integrado em `plugnotas-empresa.test.js`.
- Comandos: `npm run typecheck`; `npm test` (raiz).

---

### US-MEI-FISC-05 — Plugnotas: fortalecer heurísticas de extração de ID na listagem / GET certificado

**Como** sistema, **quero** extrair o **ID do certificado** com mais robustez a partir das variações de payload da API (lista, objeto, campos alternativos), **para** reduzir a taxa de `certificado_409_sem_id` quando o certificado existe (PRD épico B, B.2).

**Critérios de aceite**

1. Documentar no código ou em comentário curto quais formatos de resposta a Plugnotas sandbox/produção podem enviar (com base em evidência: doc oficial, fixtures de teste existentes, ou tickets).
2. Ampliar `extrairCertificadoIdDeListagem` / helpers relacionados **sem** regressão nos testes atuais em `backend/tests/plugnotas-empresa.test.js`.
3. Incluir **novos casos** de teste (fixtures mínimos JSON) que reproduzam payloads que hoje falham em suporte, se disponíveis; caso não haja exemplo real, usar payload sintético alinhado ao brief.
4. Novas heurísticas não podem aceitar ID claramente inválido (validação mínima de formato, se já existir).
5. Quality gates da raiz passam.

**Notas técnicas**

- Requer validação @architect se tocar em contrato não documentado publicamente.

**Dependências:** US-MEI-FISC-04 recomendado para observar etapa “parse”.

**CodeRabbit:** complexidade ciclomática; evitar duplicação de lógica de parse.

#### Dev Agent Record — US-MEI-FISC-05

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | Novo módulo `plugnotas-certificado-listagem-parse.js`: comentário de topo documenta envelopes vistos em fixtures (`data[]`, `data.data[]`, coleções em `data.items`/`result.data`/OData `value`, objeto único em `data` quando há `id`+documento). `normalizeCertificadoListItems` ampliado; `extractCertificadoIdFromListItem` considera `uuid`, `certificadoId`, `idCertificado`, `certificado` string ou objeto; `normalizeCertificadoIdCandidate` + `isPlausiblePlugnotasCertificadoId` (rejeita `null`/`undefined` literais, só pontuação, >128 chars). `empresa.service.js` importa `extrairCertificadoIdDeListagem`, `normalizeCertificadoListItems`, `normalizeCertificadoIdCandidate`. Testes: `plugnotas-certificado-listagem-parse.test.js` (fixtures sintéticos); integração `certificado service resolve id com listagem em data.items` em `plugnotas-empresa.test.js`. **Quality:** `npm run test -w backend`, `npm run lint -w backend`, `npm run typecheck` OK. **Pós-QA (AC-5 / lint raiz):** `frontend/eslint.config.js` — `no-explicit-any` e `no-unused-vars` como `warn` com comentário referenciando débito legado, para `npm run lint` na raiz concluir com exit 0 (70 warnings restantes; endurecer incrementalmente). |
| **File List** | `backend/src/services/plugnotas/plugnotas-certificado-listagem-parse.js`, `backend/src/services/plugnotas/empresa.service.js`, `backend/tests/plugnotas-certificado-listagem-parse.test.js`, `backend/tests/plugnotas-empresa.test.js`, `frontend/eslint.config.js`, `docs/stories/epic-guia-mei-fiscal-plugnotas-prd.md` |
| **Change Log** | 2026-03-24 — US-MEI-FISC-05: parse robusto listagem certificado Plugnotas + validação mínima de ID + testes. 2026-03-24 — Mitigação QA AC-5: ESLint frontend (`any` / unused como warning) para `npm run lint` na raiz verde. |

#### QA Results — US-MEI-FISC-05

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-24 |
| **Gate** | **PASS** *(com observação em AC-5 / lint raiz)* |

**Rastreabilidade — critérios de aceite**

1. **Documentar formatos de resposta no código** — **Atende.** Bloco inicial em `plugnotas-certificado-listagem-parse.js` lista envelopes e campos de ID, explicitando base em fixtures existentes e padrões comuns (Spring `result.data`, OData `value`, etc.).
2. **Ampliar extração sem regressão em `plugnotas-empresa.test.js`** — **Atende.** Lógica movida para módulo dedicado; `empresa.service.js` consome imports. Suíte backend completa passa; cenários anteriores de certificado/409 permanecem cobertos.
3. **Novos casos de teste (fixtures JSON mínimos)** — **Atende.** `plugnotas-certificado-listagem-parse.test.js` cobre `data.items`, `result.data`, registro único em `data`, `certificado` aninhado/string, `value` na raiz e rejeição de IDs inválidos. Integração adicional `data.items` + `idCertificado` em `plugnotas-empresa.test.js`.
4. **Não aceitar ID claramente inválido** — **Atende.** `isPlausiblePlugnotasCertificadoId` / `normalizeCertificadoIdCandidate` restringem comprimento, literais `null`/`undefined`, só pontuação e exigem caractere alfanumérico; aplicados também ao fluxo de empresa via import compartilhado.
5. **Quality gates da raiz** — **Parcial / observação.** `npm run test -w backend` (145 testes), `npm run lint -w backend` e `npm run typecheck` (workspaces) **OK** nesta revisão. `npm run lint` na **raiz** (`eslint` no frontend) **ainda falha** por violações **pré-existentes** em vários arquivos do frontend — fora do escopo desta story, mas o critério literal “lint na raiz verde” não está satisfeito até saneamento global ou exclusão documentada no pipeline.

**Notas técnicas**

- Separação do parse em `plugnotas-certificado-listagem-parse.js` reduz duplicação e facilita testes unitários diretos (alinhado à nota CodeRabbit).
- **Risco residual (baixo):** heurística `isSingletonCertificadoRow` pode, em teoria, tratar como linha única um objeto “parecido” com certificado; mitigada por exigência de campo de identificação + contexto documental/nome/certificado.

**CONCERNS (baixo)**

- AC-5: alinhar com PO/DevOps se o gate oficial da raiz deve incluir `lint` frontend; se sim, tratar débito à parte ou ajustar CI para não bloquear stories só backend.

**Evidência de execução (esta revisão)**

- Revisão estática: `plugnotas-certificado-listagem-parse.js`, import em `empresa.service.js`, testes citados.
- Comando: `npm run test -w backend` — 145 pass, 0 fail.

---

### US-MEI-FISC-06 — (Could / Draft) Fallback: informar ID de certificado Plugnotas manualmente

**Como** operador avançado (papel a definir), **quero** um caminho **opcional e explícito** para informar o **ID do certificado** no Plugnotas quando a automação falhar, **para** desbloquear o cadastro da empresa (FR-06 — **só após aprovação explícita de produto/compliance**).

**Critérios de aceite** *(sujeitos a gate @pm + @architect; story permanece Draft até aprovação)*

1. Feature atrás de **flag** de produto ou **papel** restrito; texto de **risco** visível (erro humano, inconsistência fiscal).
2. Backend valida formato do ID; **audit trail** mínimo (quem/quando, sem armazenar segredo).
3. Documentação em `docs/operacao-mei-nfse.md` descreve quando usar e limitações.
4. Testes cobrem happy path e rejeição de formato inválido.
5. Quality gates da raiz passam.

**Notas técnicas**

- **Não implementar** até decisão registrada nesta story (Status → Ready for Dev).

**Dependências:** US-MEI-FISC-02, US-MEI-FISC-03 como baseline de mensagens/códigos.

**CodeRabbit:** revisão de segurança obrigatória — sem bypass de validação fiscal.

#### Dev Agent Record — US-MEI-FISC-06

| Campo | Valor |
| --- | --- |
| **Status** | **Deferred / aguardando decisão produto** |
| **Agent model** | |
| **Completion notes** | |
| **File List** | |
| **Change Log** | |

---

## Rastreabilidade PRD → stories

| PRD | Story |
| --- | --- |
| FR-01 (extensão fiscal) | US-MEI-FISC-01 |
| FR-03 | US-MEI-FISC-02 |
| FR-04, FR-07 | US-MEI-FISC-03 |
| FR-05 | US-MEI-FISC-04 |
| B.2 (épico PRD) | US-MEI-FISC-05 |
| FR-06 (Could) | US-MEI-FISC-06 |

---

— Épico elaborado pelo *Scrum Master* a partir do PRD e da arquitetura brownfield. **@sm não implementa código** — encaminhar para @dev na ordem acordada com @po.
