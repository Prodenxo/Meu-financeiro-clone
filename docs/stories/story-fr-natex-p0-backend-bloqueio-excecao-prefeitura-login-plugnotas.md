# Story — FR-NATEX (P0): Backend — bloquear exceção `prefeitura.login` sem expandir o contrato do fluxo MEI

**ID:** STORY-FR-NATEX-P0-BACKEND-BLOQUEIO-EXCECAO-PREFEITURA-LOGIN-PLUGNOTAS  
**Prioridade:** P0  
**Status:** Ready for Review  
**Depende de:** [`docs/prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](../prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md), [`docs/specs/ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../specs/ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md), [`docs/technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md)  
**Fonte PRD:** [`docs/prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](../prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md) — **FR-NATEX-03**, **FR-NATEX-05**, **FR-NATEX-08**, **FR-NATEX-09**, **NFR-NATEX-01**, **NFR-NATEX-03**, **NFR-NATEX-04**, **NFR-NATEX-05**  
**UX:** [`docs/specs/ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../specs/ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md) — secções 6, 8, 9 e 11  
**Arquitetura:** [`docs/technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md) — secções 3, 5, 6, 8, 9 e 10

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisão** | @architect |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |

---

## User story

**Como** equipa responsável pelo BFF do emissor fiscal,  
**quero** bloquear e classificar corretamente o caso `prefeitura.login` obrigatório sem aceitar credenciais municipais no fluxo MEI,  
**para** preservar o contrato nacional-first do produto e devolver à UI uma narrativa estável de exceção não suportada.

---

## Contexto

- O PRD fixou a **Policy B**: não coletar, aceitar nem encaminhar login/senha de prefeitura neste fluxo.
- A arquitetura determina que o BFF continua sendo a única fronteira com o PlugNotas e que a classificação do erro deve continuar no backend.
- O fluxo `POST /empresa` e o fallback `PATCH` permanecem válidos; o que muda é a interpretação funcional do erro de credencial municipal.

---

## Critérios de aceite

### Contrato e segurança

- [x] O backend não aceita `nfse.config.prefeitura.login` nem `nfse.config.prefeitura.senha` no contrato do fluxo MEI.
Critério de encerramento: existe cobertura automatizada provando uma semântica única de bloqueio: quando esses campos chegarem ao BFF, a requisição é recusada explicitamente com erro estável **antes** de qualquer chamada ao serviço canónico de empresa, sem expansão silenciosa do contrato.
- [x] O backend não encaminha login/senha de prefeitura ao PlugNotas neste fluxo.
Critério de encerramento: os testes ou inspeções do serviço tornam explícito que o payload final para `POST /empresa` / `PATCH /empresa/:cnpj` permanece sem credenciais municipais, tanto no hot path de sucesso quanto nos cenários de erro e fallback.

### Classificação do erro

- [x] Quando o upstream devolver erro explícito de `prefeitura.login` / `prefeitura.senha`, o backend classifica o caso como exceção municipal não suportada neste fluxo.
Critério de encerramento: a resposta do BFF preserva metadados estáveis consumíveis pela UI, no mínimo `plugnotasRequest.method`, `plugnotasRequest.path`, `plugnotasCode = prefeitura_login_required_blocked` e `httpStatus`, sem depender de heurística textual para classificar este caso.
- [x] A classificação do caso não sugere “rota errada” nem quebra a causalidade `POST` falho → `GET` negativo.
Critério de encerramento: existe teste automatizado cobrindo `(a)` `POST /empresa` com erro explícito de `prefeitura.login` classificado como `prefeitura_login_required_blocked` e `(b)` `GET /empresa/:cnpj` posterior devolvendo ausência de empresa sem sobrescrever a causa raiz; o teste afirma explicitamente que o `GET` negativo é consequência do cadastro não concluído, não evidência de endpoint incorreto.

### Regressão do fluxo actual

- [x] O fluxo nacional existente permanece sem regressão para sucesso padrão e fallback `PATCH`.
Critério de encerramento: a suite mantém cobertura para `POST /empresa` e conflito seguido de `PATCH /empresa/:cnpj`, sem reabrir o contrato para credenciais.
- [x] Logs e erros continuam redigidos.
Critério de encerramento: a story documenta os pontos de redaction preservados e não introduz segredo em claro nos testes ou logs.

### Qualidade

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`

---

## Dev Notes

### File Locations

- `backend/src/services/plugnotas/empresa.service.js`
- `backend/src/controllers/mei-notas.controller.js`
- `backend/tests/plugnotas-empresa.test.js`
- `backend/tests/mei-notas-routes.test.js` *(ou suite equivalente)*

### Technical Constraints

- Não introduzir login/senha de prefeitura no body público do fluxo.
- Não mover a classificação do erro para o frontend.
- Não alterar a rota BFF `POST /api/mei-notas/setup/emissao-fiscal/empresa`.
- Preservar o contrato de metadados já consumido pela UI.

---

## Tasks / Subtasks

1. [x] Revisar o contrato do fluxo MEI e garantir que login/senha de prefeitura não são aceites neste percurso.
2. [x] Ajustar a classificação backend do erro `prefeitura.login` / `senha` obrigatório para o caso “exceção municipal bloqueada”.
3. [x] Garantir que `POST`, `PATCH` e `GET` preservam a causalidade correcta na resposta do BFF.
4. [x] Adicionar ou ajustar testes automatizados para:
   `a)` proibição de credenciais no contrato,  
   `b)` erro `prefeitura.login` classificado com `plugnotasCode = prefeitura_login_required_blocked`,  
   `c)` `GET` negativo após `POST` falho preservando a causa raiz no diagnóstico,  
   `d)` não regressão do fallback `PATCH`.
5. [x] Verificar e documentar a preservação de redaction e segurança.
6. [x] Executar os gates do projeto e atualizar esta story.

---

## File list (esperada / a confirmar na execução)

- [x] `backend/src/services/plugnotas/empresa.service.js`
- [ ] `backend/src/controllers/mei-notas.controller.js`
- [x] `backend/tests/plugnotas-empresa.test.js`
- [x] `backend/tests/mei-notas-empresa-http.test.js` *(equivalente HTTP à rota BFF)*
- [x] `backend/tests/prefeituraPortalCredentials.test.js`
- [x] `docs/stories/story-fr-natex-p0-backend-bloqueio-excecao-prefeitura-login-plugnotas.md`

---

## CodeRabbit Integration

- Foco principal:
  - não expansão do contrato com credenciais
  - classificação backend → UI
  - segurança e redaction
  - regressão do fluxo `POST` / `PATCH` / `GET`

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `backend/src/services/plugnotas/empresa.service.js`
- `backend/src/services/plugnotas/prefeituraPortalCredentials.js`
- `backend/tests/plugnotas-empresa.test.js`
- `backend/tests/prefeituraPortalCredentials.test.js`
- `backend/tests/mei-notas-empresa-http.test.js`
- `docs/stories/story-fr-natex-p0-backend-bloqueio-excecao-prefeitura-login-plugnotas.md`

### Debug Log References

- 2026-04-10 — bloqueio local de `nfse.config.prefeitura.login` / `.senha` consolidado no helper de policy antes de qualquer chamada ao PlugNotas.
- 2026-04-10 — `requestJson` passou a reclassificar 400 upstream com `fields.nfse.config.prefeitura.login|senha` para `plugnotasCode = prefeitura_login_required_blocked`, preservando `plugnotasRequest` e `httpStatus`.
- 2026-04-10 — adicionadas regressões de serviço e HTTP para bloqueio BFF, classificação upstream e causalidade `POST` falho → `GET` negativo.

### Completion Notes

- O backend deixou de usar a semântica antiga baseada em flag para aceitar/normalizar credenciais municipais neste fluxo MEI; qualquer presença das chaves `login` / `senha` agora é bloqueada no BFF com `prefeitura_login_required_blocked`.
- Quando o PlugNotas devolve 400 explícito exigindo `prefeitura.login` / `senha`, o BFF reclassifica o caso como exceção municipal não suportada e devolve metadados estáveis para a UI: `plugnotasRequest.method`, `plugnotasRequest.path`, `plugnotasCode` e `httpStatus`.
- A causalidade `POST /empresa` falho seguido de `GET /empresa/:cnpj` negativo ficou coberta por regressão dedicada; o `GET` não sobrescreve a causa raiz do cadastro não concluído.
- Redaction preservado: os testes novos não registram segredos em claro em logs nem exigem exposição de `login` / `senha` fora do payload de entrada controlado pela suite.
- Gates executados na raiz: `npm run lint`, `npm run typecheck`, `npm test`.

### Change Log

- 2026-04-10 — Story criada pelo @sm a partir do PRD NATEX, spec UX e arquitetura técnica, com foco em bloqueio da exceção municipal no backend sem introdução de credenciais.
- 2026-04-10 — Story refinada pelo @sm após avaliação do @po: semântica única de bloqueio no contrato, `plugnotasCode` estável (`prefeitura_login_required_blocked`) e cenário `POST` → `GET` tornado explicitamente verificável.
- 2026-04-10 — @dev implementou o bloqueio backend `prefeitura_login_required_blocked`, a reclassificação do 400 upstream e as regressões de serviço/HTTP correspondentes; story promovida para `Ready for Review`.

---

## QA Results

- A preencher por @qa.
