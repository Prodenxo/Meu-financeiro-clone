# Story — FR-RTCAD (P0): Backend — preflight municipal obrigatório no BFF para cadastro empresa PlugNotas

**ID:** STORY-FR-RTCAD-P0-PREFLIGHT-MUNICIPAL-BFF-PLUGNOTAS  
**Prioridade:** P0  
**Status:** Draft  
**Depende de:** [`docs/stories/story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md`](./story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md), [`docs/prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md), [`docs/specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md), [`docs/technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md), [`docs/stories/story-fr-natex-p0-backend-bloqueio-excecao-prefeitura-login-plugnotas.md`](./story-fr-natex-p0-backend-bloqueio-excecao-prefeitura-login-plugnotas.md), [`docs/stories/story-fr-plogin-backlog-dp02-bloqueio-prefeitura-incompleta-servidor.md`](./story-fr-plogin-backlog-dp02-bloqueio-prefeitura-incompleta-servidor.md)  
**Fonte PRD:** [`docs/prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — **FR-RTCAD-03**, **FR-RTCAD-04**, **FR-RTCAD-05**, **FR-RTCAD-06**, **NFR-RTCAD-02**, **NFR-RTCAD-03**, **NFR-RTCAD-04**, **CR-RTCAD-01**, **CR-RTCAD-02**, **CR-RTCAD-04**  
**UX:** [`docs/specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — secções 3, 6, 7.1, 7.6, 8.2, 9.1 e 13  
**Arquitetura:** [`docs/technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — secções 5, 7, 8, 11, 12 e 15

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisão** | @architect |
| **quality_gate_tools** | testes backend, revisão de decisão de fluxo e gates do projeto |

---

## User story

**Como** owner do BFF do cadastro empresa PlugNotas,  
**quero** consultar `/nfse/cidades/{codigoIbge}` antes de qualquer `POST /empresa` ou `PATCH /empresa/:cnpj` relevante,  
**para** decidir com base no município e no ambiente se o caminho nacional é permitido ou se o caso deve ser bloqueado antes do upstream.

---

## Contexto

- A arquitetura do MVP exige que a decisão municipal aconteça antes do cadastro cego no PlugNotas.
- O preflight deve usar `endereco.codigoCidade`, considerar `producao` ou `homologacao` e reutilizar o mesmo resultado no fluxo `POST` com eventual fallback `PATCH`.
- Se `endereco.codigoCidade` estiver ausente, inválido ou não puder ser normalizado localmente, o BFF deve bloquear antes do preflight com classificação estável de `payload_contrato`.
- Municípios com `login` ou `senha` obrigatórios devem ser bloqueados no MVP antes do `POST`.
- Os códigos estáveis mínimos esperados nesta story são `payload_contrato`, `prefeitura_login_required_blocked`, `prefeitura_ibge_apenas_insuficiente_dp02` e `ambiente_configuracao` ou gateway equivalente já canónico da app.
- O bloqueio estático por lista de IBGE (`DP02`) deixa de ser a fonte primária da decisão e pode, no máximo, permanecer como guarda emergencial de rollout.

---

## Critérios de aceite

### Preflight municipal

- [ ] Existe um helper backend dedicado para consultar e normalizar `/nfse/cidades/{codigoIbge}`.
Critério de encerramento: o resultado mínimo do preflight inclui `codigoIbge`, ambiente avaliado, `padraoNacionalEnabled`, `requiresLogin` e `requiresSenha`, sem expor segredos ao cliente.
- [ ] Dados locais inválidos bloqueiam antes do preflight com classificação estável explícita.
Critério de encerramento: se `endereco.codigoCidade` estiver ausente, inválido ou não puder ser normalizado para o formato esperado, o BFF não consulta `/nfse/cidades/{codigoIbge}`, não tenta `POST /empresa`, e devolve `payload_contrato` como classificação estável do bloqueio local.
- [ ] O preflight acontece antes de qualquer upstream call relevante do cadastro empresa.
Critério de encerramento: `POST /empresa` e `PATCH /empresa/:cnpj` só são tentados após a decisão do preflight, e o fluxo não segue de forma cega se a triagem falhar tecnicamente.

### Motor de decisão

- [ ] Municípios compatíveis com padrão nacional seguem pelo caminho principal.
Critério de encerramento: quando o preflight indicar `padraoNacional = true` no ambiente alvo e `login = false` / `senha = false`, o BFF continua para `POST /empresa` e eventual fallback `PATCH`.
- [ ] Municípios que exigem autenticação municipal são bloqueados antes do upstream.
Critério de encerramento: quando o preflight indicar `login = true` ou `senha = true`, o BFF bloqueia antes do upstream e devolve `prefeitura_login_required_blocked` como código/classificação estável da exceção municipal não suportada no MVP, sem tentar `POST /empresa`.
- [ ] Municípios sem caminho nacional elegível também são classificados antes do upstream.
Critério de encerramento: quando `padraoNacional` vier `false` ou `null` e não houver sinal explícito de `login` / `senha`, o BFF não trata o caso como sucesso potencial do nacional e devolve `prefeitura_ibge_apenas_insuficiente_dp02` como classificação estável coerente com a arquitetura.
- [ ] Falhas técnicas no preflight não geram `POST /empresa` cego.
Critério de encerramento: timeouts, `401`, `403`, `5xx` ou erro estrutural no preflight resultam em classificação técnica controlada com `ambiente_configuracao` ou código gateway equivalente já existente na app, sem tentativa cega de cadastro.

### Compatibilidade brownfield

- [ ] O fallback `POST` -> `PATCH` continua preservado.
Critério de encerramento: a story reutiliza o mesmo resultado do preflight no fluxo de conflito recuperável e não quebra o update explícito já existente.
- [ ] A story não reabre fase 2 municipal.
Critério de encerramento: não há aceite nem persistência de `prefeitura.login` / `senha`; a flag de credenciais municipais continua fora do MVP.
- [ ] O bloqueio estático legado não permanece como motor principal.
Critério de encerramento: se `prefeituraIbgeOnlyBlock` continuar a existir, fica explicitamente subordinado à decisão dinâmica por preflight, e não como fonte primária da classificação municipal.

### Qualidade

- [ ] Executar `npm run lint`.
- [ ] Executar `npm run typecheck`.
- [ ] Executar `npm test`.
- [ ] Cobrir a matriz mínima de preflight em backend.
Critério de encerramento: a suíte cobre, no mínimo, `(a)` `codigoCidade` ausente/inválido com bloqueio local `payload_contrato`, `(b)` município nacional compatível, `(c)` município com `login` ou `senha` obrigatórios, `(d)` município sem caminho nacional elegível, `(e)` falha técnica do preflight, e `(f)` reuso do resultado no fluxo `POST` com fallback `PATCH`.

---

## Dev Notes

### File Locations

- `backend/src/services/plugnotas/plugnotas-cidades.service.js`
- `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/src/controllers/mei-notas.controller.js`
- `backend/tests/plugnotas-empresa.test.js`
- `backend/tests/mei-notas-empresa-http.test.js`
- `docs/stories/story-fr-rtcad-p0-preflight-municipal-bff-plugnotas.md`

### Technical Constraints

- Não alterar a rota pública do BFF.
- Não chamar o PlugNotas do browser.
- Não introduzir persistência nova.
- Não consultar `/nfse/cidades/{codigoIbge}` quando `endereco.codigoCidade` estiver ausente/inválido; nesse caso o bloqueio é local com `payload_contrato`.
- Não deixar o preflight depender de heurística textual de `POST /empresa`.
- Não usar a lista estática de IBGE como fonte primária de decisão quando o preflight dinâmico estiver disponível.
- Reaproveitar códigos estáveis já canonizados pela iniciativa: `payload_contrato`, `prefeitura_login_required_blocked`, `prefeitura_ibge_apenas_insuficiente_dp02` e `ambiente_configuracao` ou gateway equivalente.

### Testing

- Validar normalização do preflight por ambiente.
- Validar bloqueio local com `payload_contrato` quando `codigoCidade` estiver ausente/inválido antes do preflight.
- Validar bloqueio antecipado sem upstream call para municípios não suportados no MVP.
- Validar emissão de `prefeitura_login_required_blocked` para auth municipal obrigatória.
- Validar emissão de `prefeitura_ibge_apenas_insuficiente_dp02` para município sem caminho nacional elegível e sem auth explícita.
- Validar emissão de `ambiente_configuracao` ou gateway equivalente nas falhas técnicas do preflight.
- Validar reuso do preflight no fluxo de conflito com `PATCH`.
- Validar preservação do caminho nacional para municípios compatíveis.

---

## Tasks / Subtasks

1. [x] Criar o helper backend para consulta e normalização de `/nfse/cidades/{codigoIbge}`.
2. [x] Tratar `codigoCidade` ausente/inválido antes do preflight, bloqueando localmente com `payload_contrato`.
3. [x] Introduzir o motor de decisão municipal do cadastro empresa no backend.
4. [x] Integrar o preflight ao fluxo de `POST /empresa`, ao fallback `PATCH` e ao fluxo explícito de atualização.
5. [x] Garantir bloqueio antecipado e classificação estável para municípios fora do caminho nacional do MVP, nomeando os códigos esperados por ramo.
6. [x] Rebaixar qualquer bloqueio estático legado para papel de fallback emergencial, se ele permanecer no código.
7. [x] Adicionar/atualizar regressões backend para os cenários mínimos de preflight, incluindo `payload_contrato`, `prefeitura_login_required_blocked`, `prefeitura_ibge_apenas_insuficiente_dp02` e `ambiente_configuracao`/gateway.
8. [x] Executar os gates do projeto e atualizar esta story com file list, notas e resultados.

---

## File list (esperada / a confirmar na execução)

- [x] `backend/src/services/plugnotas/plugnotas-cidades.service.js`
- [x] `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js`
- [x] `backend/src/services/plugnotas/empresa.service.js`
- [x] `backend/src/services/plugnotas/prefeituraIbgeOnlyBlock.js`
- [x] `backend/tests/plugnotas-empresa.test.js`
- [x] `backend/tests/mei-notas-empresa-http.test.js`
- [x] `backend/tests/mei-notas-emitente-composite-http.test.js`
- [x] `backend/tests/plugnotas-empresa-cadastro-debug.test.js`
- [x] `backend/tests/plugnotas-empresa-ibge-table-400-log.test.js`
- [x] `docs/stories/story-fr-rtcad-p0-preflight-municipal-bff-plugnotas.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Correção do motor de decisão municipal por ambiente.
- Ausência de `POST /empresa` cego quando o preflight falha ou bloqueia.
- Compatibilidade com fallback `PATCH` e com o bloqueio NATEX já existente.

---

## Dev Agent Record

### Status

QA Fixes Applied

### File list

- `backend/src/services/plugnotas/plugnotas-cidades.service.js`
- `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/src/services/plugnotas/prefeituraIbgeOnlyBlock.js`
- `backend/tests/plugnotas-empresa.test.js`
- `backend/tests/mei-notas-empresa-http.test.js`
- `backend/tests/mei-notas-emitente-composite-http.test.js`
- `backend/tests/plugnotas-empresa-cadastro-debug.test.js`
- `backend/tests/plugnotas-empresa-ibge-table-400-log.test.js`
- `docs/stories/story-fr-rtcad-p0-preflight-municipal-bff-plugnotas.md`

### Debug Log References

- `npm test -- tests/plugnotas-empresa.test.js` (workspace `backend`)
- `npm test -- tests/plugnotas-empresa.test.js tests/mei-notas-empresa-http.test.js` (workspace `backend`)
- `npm run lint`
- `npm run typecheck`
- `npx vitest run src/pages/Orcamentos.test.tsx --environment jsdom` (workspace `frontend`)
- `npm test`

### Completion Notes

- Story criada para a triagem municipal obrigatória do Epic 1 RTCAD.
- O objetivo é tirar a decisão municipal do texto tardio do `400` e colocá-la no BFF antes do cadastro da empresa.
- A fase 2 municipal continua fora do escopo; esta story só decide se o fluxo nacional do MVP pode ou não seguir.
- Refinamento PO aplicado: os códigos estáveis mínimos por ramo do preflight ficaram explícitos e o caso de `codigoCidade` ausente/inválido foi fechado como bloqueio local com `payload_contrato`.
- Refinamento PO adicional: a matriz mínima da suíte passou a exigir explicitamente o cenário `codigoCidade` ausente/inválido -> `payload_contrato`.
- QA fix aplicado: o backend passou a consultar `GET /nfse/cidades/{codigoIbge}` via helper dedicado (`plugnotas-cidades.service.js`) e a normalizar o resultado mínimo do preflight por ambiente (`padraoNacionalEnabled`, `requiresLogin`, `requiresSenha`).
- QA fix aplicado: a decisão municipal foi centralizada em `empresa-cadastro-runtime-decision.js`; `POST /empresa` e `PATCH /empresa/:cnpj` só seguem quando o preflight permite o caminho nacional do MVP.
- QA fix aplicado: `codigoCidade` ausente/inválido agora bloqueia localmente com `payload_contrato`; municípios com `login`/`senha` obrigatórios bloqueiam com `prefeitura_login_required_blocked`; municípios sem caminho nacional elegível bloqueiam com `prefeitura_ibge_apenas_insuficiente_dp02`; falhas técnicas do preflight não geram `POST` cego.
- O bloqueio estático legado por IBGE deixou de ser motor primário e ficou rebaixado a fallback emergencial em trilhos sem preflight aplicável.
- A regressão backend cobre bloqueio local, sucesso nacional, bloqueio municipal por auth, DP02 dinâmico, falha técnica no preflight, reuso do preflight no fallback `POST -> PATCH` e o fluxo HTTP do BFF para `payload_contrato` e `prefeitura_login_required_blocked`.
- Gates executados com sucesso após os fixes: `npm run lint`, `npm run typecheck` e `npm test`.

### Change Log

- 2026-04-14 — Story criada por @sm a partir do PRD, spec UX e arquitetura da iniciativa RTCAD, com foco no preflight municipal obrigatório do BFF.
- 2026-04-14 — Story refinada por @sm segundo avaliação @po: códigos estáveis do preflight explicitados e tratamento de `codigoCidade` inválido/ausente definido antes da consulta municipal.
- 2026-04-14 — Story refinada por @sm para incluir `payload_contrato` por `codigoCidade` ausente/inválido também na matriz mínima de regressão backend.
- 2026-04-14 — @dev aplicou os fixes do QA: helper de `/nfse/cidades/{codigoIbge}`, motor de decisão municipal, bloqueio local `payload_contrato`, integração preflight em `POST`/`PATCH`, fallback legado subordinado e regressões backend/HTTP do preflight.

---

## QA Results

- 2026-04-14 — Revisão QA (`@qa`) — **Gate: FAIL**
- Escopo revisto: `backend/src/services/plugnotas/empresa.service.js`, `backend/src/services/plugnotas/prefeituraIbgeOnlyBlock.js`, `backend/src/services/plugnotas/prefeituraPortalCredentials.js`, `backend/tests/plugnotas-empresa.test.js`, `backend/tests/mei-notas-empresa-http.test.js`.
- Evidência executada: `npm test -- tests/plugnotas-empresa.test.js tests/mei-notas-empresa-http.test.js` (workspace `backend`) — verde, mas sem cobrir a matriz de preflight exigida pela story.
- Observação estrutural: os artefactos esperados `backend/src/services/plugnotas/plugnotas-cidades.service.js` e `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js` não existem no estado atual do repositório.
- Achados:
  - **Alto:** o preflight municipal obrigatório não foi implementado; `cadastrarEmpresaPlugNotas` e `atualizarEmpresaPlugNotas` continuam a normalizar o payload e seguir diretamente para as policies locais / `POST` / `PATCH`, sem qualquer consulta prévia a `/nfse/cidades/{codigoIbge}` nem decisão por ambiente antes do upstream.
  - **Alto:** o bloqueio local por `codigoCidade` ausente/inválido com `payload_contrato` não existe; `normalizePayloadEnderecoCodigoCidade` apenas normaliza quando a chave está presente, e `payload_contrato` continua a ser inferido de um `400` tardio do `POST /empresa`, contrariando o critério de bloqueio antes do preflight.
  - **Médio:** o bloqueio estático legado `prefeituraIbgeOnlyBlock` continua a ser a fonte efetiva da classificação DP02; como não há preflight dinâmico a montante, a lista de IBGE permanece como motor primário do ramo municipal que a story mandava rebaixar para fallback emergencial.
  - **Médio:** a regressão backend não cobre a matriz mínima da story; os testes atuais validam o bloqueio por credenciais municipais e o bloqueio estático legado por lista, mas não validam `/nfse/cidades/{codigoIbge}`, `payload_contrato` local por `codigoCidade` inválido/ausente, falhas técnicas do preflight, decisão por ambiente, nem reuso explícito do resultado no fluxo `POST` com fallback `PATCH`.
