# Story — FR-ROB (P0): Backend — classificação de cenários, fallback e causalidade no cadastro empresa PlugNotas

**ID:** STORY-FR-ROB-P0-BACKEND-CLASSIFICACAO-CENARIOS-FALLBACK-CAUSALIDADE-PLUGNOTAS  
**Prioridade:** P0  
**Status:** Ready for Review  
**Depende de:** [`docs/prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md), [`docs/specs/ux-spec-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../specs/ux-spec-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md), [`docs/technical/architecture-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../technical/architecture-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md), [`docs/stories/story-fr-endp-p0-backend-endpoint-canonico-plugnotas.md`](./story-fr-endp-p0-backend-endpoint-canonico-plugnotas.md), [`docs/stories/story-fr-natex-p0-backend-bloqueio-excecao-prefeitura-login-plugnotas.md`](./story-fr-natex-p0-backend-bloqueio-excecao-prefeitura-login-plugnotas.md)  
**Fonte PRD:** [`docs/prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md) — **FR-ROB-02** a **FR-ROB-09**, **NFR-ROB-01** a **NFR-ROB-06**  
**UX:** [`docs/specs/ux-spec-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../specs/ux-spec-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md) — secções 7, 8, 10 e 12  
**Arquitetura:** [`docs/technical/architecture-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../technical/architecture-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md) — secções 6, 7, 8, 10 e 12

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisão** | @architect |
| **quality_gate_tools** | testes backend, revisão de contrato e gates do projeto |

---

## User story

**Como** backend owner do fluxo de cadastro empresa,  
**quero** classificar de forma estável os cenários do cadastro PlugNotas, preservar fallback e manter a causalidade entre `POST`, `PATCH` e `GET`,  
**para** que frontend, operação e QA recebam um contrato coerente e não confundam ambiente, payload, conflito, exceção municipal e ausência posterior da empresa.

---

## Contexto

- O endpoint canónico `POST /empresa` já foi consolidado.
- A exceção municipal `prefeitura.login` já foi bloqueada pela policy NATEX.
- Falta consolidar a robustez do backend como uma taxonomia única de cenários, com precedência estável e preservação explícita da cadeia causal.

---

## Critérios de aceite

### Classificação de cenários

- [x] O backend classifica, no mínimo, os cenários `success_nacional`, `ambiente_configuracao`, `payload_contrato`, `fallback_sync`, `prefeitura_login_required_blocked` e `empresa_nao_cadastrada`.
Critério de encerramento: a classificação está centralizada e documentada no código, sem branches contraditórias espalhadas.
- [x] A precedência de classificação segue a arquitetura.
Critério de encerramento: quando múltiplos sinais coexistirem, a ordem mínima respeitada é:
  `a)` `prefeitura_login_required_blocked`,  
  `b)` `ambiente_configuracao`,  
  `c)` `fallback_sync`,  
  `d)` `payload_contrato`,  
  `e)` `empresa_nao_cadastrada`,  
  `f)` `success_nacional`.

### Contrato backend -> frontend/operação

- [x] O backend devolve metadados estáveis consumíveis por frontend e operação.
Critério de encerramento: quando aplicáveis, a resposta mantém `plugnotasRequest.method`, `plugnotasRequest.path`, `plugnotasCode` e `httpStatus`, e a story não introduz um novo campo obrigatório `scenarioCode`; a classe final do cenário continua a ser inferida a partir desse contrato estável centralizado.
- [x] O backend não reabre credenciais municipais no contrato.
Critério de encerramento: `prefeitura.login` / `senha` continuam rejeitados ou reclassificados como exceção bloqueada conforme a policy NATEX já implementada.

### Ambiente/configuração

- [x] A classe `ambiente_configuracao` fica objetivamente delimitada.
Critério de encerramento: `ambiente_configuracao` só é usada quando a evidência útil apontar, no mínimo, para um destes grupos:
  `a)` host/base URL/prefixo incoerente,  
  `b)` token/ambiente incompatível,  
  `c)` gateway/upstream indisponível ou resposta estruturalmente incompatível com sucesso/validação de payload,  
  e não deve capturar erros claros de payload, conflito resolvido por fallback ou exceção municipal bloqueada.

### Fallback e causalidade

- [x] O fluxo `POST` -> `PATCH` continua encapsulado no backend.
Critério de encerramento: resultado com fallback satisfatório devolve estado operacional compatível com sincronização/atualização, sem erro arquitectural residual para a UI.
- [x] O backend preserva a causalidade `POST` falho -> `GET` negativo.
Critério de encerramento: quando a empresa não é encontrada após falha prévia, `empresa_nao_cadastrada` é tratada como consequência do `POST` anterior e não apaga a causa raiz.

### Qualidade

- [x] Executar `npm run lint`.
- [x] Executar `npm run typecheck`.
- [x] Executar `npm test`.
- [x] Cobrir os seis cenários mínimos de teste desta story.
Critério de encerramento: a suíte backend cobre, no mínimo:
  `a)` `POST /empresa` 2xx classificado como `success_nacional`,  
  `b)` erro classificado como `ambiente_configuracao`,  
  `c)` erro de validação/contrato classificado como `payload_contrato`,  
  `d)` conflito com resolução por `PATCH` classificado como `fallback_sync`,  
  `e)` erro explícito `prefeitura.login`/`senha` classificado como `prefeitura_login_required_blocked`,  
  `f)` `GET /empresa/:cnpj` negativo posterior mantendo causalidade como `empresa_nao_cadastrada`.

---

## Dev Notes

### File Locations

- `backend/src/services/plugnotas/empresa.service.js`
- `backend/src/services/plugnotas/prefeituraPortalCredentials.js`
- `backend/src/services/plugnotas/root-url.js`
- `backend/tests/plugnotas-empresa.test.js`
- `backend/tests/mei-notas-empresa-http.test.js`
- `backend/tests/plugnotas-root-url.test.js`

### Technical Constraints

- Não alterar o endpoint upstream principal `POST /empresa`.
- Não mover lógica de classificação para o frontend.
- Não expor segredo PlugNotas nem payload bruto em logs ou respostas.
- Não reabrir suporte a `login`/`senha` de prefeitura neste ciclo.

---

## Tasks / Subtasks

1. [x] Centralizar a taxonomia de cenários do cadastro empresa no backend.
2. [x] Garantir a precedência mínima de classificação definida na arquitetura.
3. [x] Preservar e/ou ajustar o contrato `plugnotasRequest` / `plugnotasCode` / `httpStatus`, sem criar `scenarioCode` obrigatório neste ciclo.
4. [x] Reforçar a narrativa operacional do fallback `POST` -> `PATCH`.
5. [x] Cobrir explicitamente a causalidade `POST` falho -> `GET` negativo.
6. [x] Delimitar objetivamente quando usar `ambiente_configuracao`.
7. [x] Adicionar/atualizar regressões backend para os seis cenários mínimos enumerados nesta story.
8. [x] Atualizar esta story com file list, notas e resultados dos gates.

---

## File list (esperada / a confirmar na execução)

- [x] `backend/src/services/plugnotas/empresa.service.js`
- [ ] `backend/src/services/plugnotas/prefeituraPortalCredentials.js`
- [x] `backend/tests/plugnotas-empresa.test.js`
- [ ] `backend/tests/mei-notas-empresa-http.test.js`
- [ ] `backend/tests/plugnotas-root-url.test.js`
- [x] `docs/stories/story-fr-rob-p0-backend-classificacao-cenarios-fallback-causalidade-plugnotas.md`

---

## CodeRabbit Integration

- Focar em:
  - coerência da taxonomia de cenários
  - ausência de regressão no fallback
  - redaction
  - causalidade `POST` / `GET`

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `backend/src/services/plugnotas/empresa.service.js`
- `backend/tests/plugnotas-empresa.test.js`
- `docs/stories/story-fr-rob-p0-backend-classificacao-cenarios-fallback-causalidade-plugnotas.md`

### Debug Log References

- `npm run lint`
- `npm run typecheck`
- `npm test` (executado fora do sandbox após `spawn EPERM` no runner dentro do sandbox)

### Completion Notes

- Centralizei a classificação de cenários do cadastro empresa em `empresa.service.js`, sem introduzir `scenarioCode` obrigatório.
- Tornei estáveis os códigos `payload_contrato`, `ambiente_configuracao` e `empresa_nao_cadastrada` dentro do contrato já existente com `plugnotasRequest` e `httpStatus`.
- Passei a mapear `GET /empresa/:cnpj` 404 para `empresa_nao_cadastrada` com mensagem orientativa e mantive a exceção municipal bloqueada e o fallback `POST` -> `PATCH`.
- As regressões backend agora cobrem explicitamente os seis cenários mínimos da story.

### Change Log

- 2026-04-10 — Story criada pelo @sm a partir do PRD, spec UX e arquitetura da iniciativa ROB, com foco em taxonomia backend, fallback e causalidade do cadastro empresa PlugNotas.
- 2026-04-10 — Implementação concluída pelo @dev: taxonomia backend centralizada, códigos estáveis ampliados (`payload_contrato`, `ambiente_configuracao`, `empresa_nao_cadastrada`) e regressões adicionadas para os seis cenários mínimos.

---

## QA Results

- 2026-04-10 — QA review by @qa
- Gate: PASS
- Nenhum finding.
- Verifiquei a centralização da taxonomia em `backend/src/services/plugnotas/empresa.service.js`, incluindo precedência entre `prefeitura_login_required_blocked`, `ambiente_configuracao`, `fallback_sync`, `payload_contrato` e `empresa_nao_cadastrada`, sem introdução de `scenarioCode` obrigatório.
- Verifiquei a preservação do contrato `plugnotasRequest.method`, `plugnotasRequest.path`, `plugnotasCode` e `httpStatus`, bem como a remapagem orientativa de `GET /empresa/:cnpj` 404 para `empresa_nao_cadastrada`.
- Evidência executada nesta revisão: `node backend/tests/plugnotas-empresa.test.js` passou com 40/40 testes.
- Risco residual baixo: a classificação continua dependente da combinação de metadados existentes, portanto qualquer alteração futura no frontend deve continuar a usar o contrato estável definido nesta story e não heurísticas novas fora dele.
