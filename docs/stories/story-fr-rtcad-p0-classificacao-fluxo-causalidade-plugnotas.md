# Story — FR-RTCAD (P0): Full-stack — classificação de fluxo, UX e causalidade no cadastro empresa PlugNotas

**ID:** STORY-FR-RTCAD-P0-CLASSIFICACAO-FLUXO-CAUSALIDADE-PLUGNOTAS  
**Prioridade:** P0  
**Status:** Draft  
**Depende de:** [`docs/stories/story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md`](./story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md), [`docs/stories/story-fr-rtcad-p0-preflight-municipal-bff-plugnotas.md`](./story-fr-rtcad-p0-preflight-municipal-bff-plugnotas.md), [`docs/prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md), [`docs/specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md), [`docs/technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md), [`docs/stories/story-fr-rob-p0-backend-classificacao-cenarios-fallback-causalidade-plugnotas.md`](./story-fr-rob-p0-backend-classificacao-cenarios-fallback-causalidade-plugnotas.md), [`docs/stories/story-fr-rob-p0-frontend-ux-cenarios-cadastro-empresa-plugnotas.md`](./story-fr-rob-p0-frontend-ux-cenarios-cadastro-empresa-plugnotas.md)  
**Fonte PRD:** [`docs/prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — **FR-RTCAD-06**, **FR-RTCAD-07**, **FR-RTCAD-08**, **NFR-RTCAD-01**, **NFR-RTCAD-04**, **NFR-RTCAD-05**, **CR-RTCAD-01**, **CR-RTCAD-02**, **CR-RTCAD-04**  
**UX:** [`docs/specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — secções 3, 6, 7, 8, 9, 10, 11 e 13  
**Arquitetura:** [`docs/technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — secções 8, 9, 10, 11, 12 e 15

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisão** | @architect e @ux-design-expert |
| **quality_gate_tools** | testes frontend/backend, revisão de copy, acessibilidade e gates do projeto |

---

## User story

**Como** frontend, operação e QA da Guia MEI,  
**quero** receber uma classificação estável do caminho de cadastro da empresa e manter a causalidade correta entre `POST`, `PATCH` e `GET`,  
**para** distinguir sucesso nacional, sincronização, erro de contrato, erro de ambiente, exceção municipal do MVP e ausência posterior da empresa sem reintroduzir retry cego ou diagnóstico textual frágil.

---

## Contexto

- A story anterior passa a decidir o município antes do cadastro; esta story transforma essa decisão em contrato estável para UI, operação e QA.
- A UX spec exige priorização de classificação estável do BFF sobre substring de mensagem.
- Casos bloqueados antecipadamente podem não ter `plugnotasRequest` de `POST /empresa`; a UI precisa continuar coerente mesmo assim.
- O fluxo continua com duas fases visíveis (`certificado` e `empresa`), sem rota nova e sem coleta de credenciais municipais.
- Decisão de recorte desta story: o contrato **obrigatório** desta entrega continua a ser `plugnotasCode`, `httpStatus`, `plugnotasRequest` quando houver e `operation`; `runtimeDecision` pode existir apenas como enriquecimento opcional e **não** é requisito obrigatório desta story.
- As classificações estáveis mínimas em escopo para a UX desta story são `prefeitura_login_required_blocked`, `prefeitura_ibge_apenas_insuficiente_dp02`, `payload_contrato`, `ambiente_configuracao` e `empresa_nao_cadastrada`; sucesso e sincronização continuam a ser distinguidos por `operation = created | updated | existing`.
- Nesta story, `prefeitura_login_required_blocked`, `prefeitura_ibge_apenas_insuficiente_dp02` e `empresa_nao_cadastrada` devem ser distinguíveis via `plugnotasCode`; já `payload_contrato` e `ambiente_configuracao` devem ser classificáveis de forma estável a partir do contrato atual (`plugnotasCode`, `httpStatus` e `plugnotasRequest` quando houver) e podem ser enriquecidos por `runtimeDecision` sem passar a depender dele.

---

## Critérios de aceite

### Contrato backend -> frontend

- [ ] Esta story fecha o contrato obrigatório do MVP sem criar dependência nova em `runtimeDecision`.
Critério de encerramento: respostas de sucesso continuam a expor `operation` (`created`, `updated`, `existing`), respostas de erro continuam a expor `plugnotasCode`, `httpStatus` e `plugnotasRequest` quando aplicável, e `runtimeDecision` continua permitido apenas como enriquecimento opcional e sanitizado, nunca como campo obrigatório para frontend, QA ou operação nesta entrega.
- [ ] As classificações estáveis mínimas esperadas nesta story ficam explícitas e verificáveis sem ambiguidade contratual.
Critério de encerramento: o contrato funcional desta story explicita e cobre, no mínimo, `prefeitura_login_required_blocked`, `prefeitura_ibge_apenas_insuficiente_dp02`, `payload_contrato`, `ambiente_configuracao` e `empresa_nao_cadastrada`; para evitar ambiguidade, `prefeitura_login_required_blocked`, `prefeitura_ibge_apenas_insuficiente_dp02` e `empresa_nao_cadastrada` devem ser identificáveis via `plugnotasCode`, enquanto `payload_contrato` e `ambiente_configuracao` devem ser identificáveis de forma estável a partir do contrato atual e só podem usar `runtimeDecision` como enriquecimento opcional.
- [ ] Casos bloqueados no preflight são distinguíveis dos casos que falharam após upstream call.
Critério de encerramento: quando o BFF bloquear antes do `POST /empresa`, `plugnotasCode` é obrigatório, `plugnotasRequest` pode vir ausente sem ser tratado como erro de contrato pela UI, e, se `runtimeDecision` existir, ele só pode aparecer como enriquecimento opcional com `upstreamCallSkipped = true`; a story não pode inventar erro de request que não aconteceu.

### Classificação e UX

- [ ] O frontend prioriza a classificação estável do BFF sobre heurística textual.
Critério de encerramento: a ordem mínima de decisão na UI é `(a)` código/classificação estável, `(b)` `operation`, `(c)` `plugnotasRequest` + `httpStatus`, `(d)` heurística textual residual.
- [ ] O frontend trata explicitamente o caso de bloqueio antecipado sem `plugnotasRequest`.
Critério de encerramento: ausência de `plugnotasRequest` em casos de bloqueio antecipado não degrada a experiência para erro genérico; a UI continua a decidir por `plugnotasCode` e, quando presente, por `runtimeDecision` opcional, preservando a decisão do BFF sem cair para heurística textual.
- [ ] A UI cobre os estados UX do cluster RTCAD.
Critério de encerramento: a experiência contempla, no mínimo, sucesso nacional, sincronização/fallback, erro de payload/contrato, erro de ambiente, exceção municipal do MVP e `GET` negativo posterior, sem copy de endpoint/rota como narrativa principal.
- [ ] O caso municipal do MVP não incentiva retry cego.
Critério de encerramento: quando o BFF classificar o fluxo como municipal não suportado, a UI não pede `login`/`senha`, não sugere retry cego como CTA principal e mantém `Editar dados` apenas como ação secundária quando fizer sentido.
- [ ] Hints textuais continuam como camada secundária.
Critério de encerramento: `nfseNacionalPlugnotasErrorHints.ts` não contradiz o código estável do BFF e continua apenas como fallback para mensagens cruas ou incompletas.

### Causalidade e operação

- [ ] O `GET` negativo posterior não apaga a causa raiz do cadastro mal sucedido.
Critério de encerramento: `empresa_nao_cadastrada` continua a ser tratada como consequência da tentativa anterior, e não como um novo erro primário da experiência.
- [ ] O fallback `PATCH` continua comunicando sincronização.
Critério de encerramento: `updated` e `existing` continuam a gerar narrativa de sincronização/atualização, não de falha do cadastro.

### Acessibilidade, privacidade e qualidade

- [ ] O alerta principal continua acessível e único por cenário.
Critério de encerramento: `role="alert"` ou equivalente permanece reservado ao erro principal, o foco vai para o bloco relevante após falha e não há duplicação de alertas com a mesma conclusão.
- [ ] Nenhum dado sensível municipal aparece em copy, logs visíveis ou detalhe técnico da UI.
Critério de encerramento: a story não expõe `login`, `senha`, token, certificado ou payload bruto ao utilizador.
- [ ] Executar `npm run lint`.
- [ ] Executar `npm run typecheck`.
- [ ] Executar `npm test`.
- [ ] Cobrir regressão de classificação e UX.
Critério de encerramento: a suíte cobre, no mínimo, `(a)` `success_nacional`, `(b)` `fallback_sync`, `(c)` `payload_contrato`, `(d)` `ambiente_configuracao`, `(e)` fluxo municipal não suportado no MVP, e `(f)` `empresa_nao_cadastrada` preservando a causa raiz.

---

## Dev Notes

### File Locations

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/utils/plugnotasEmitenteSetup.ts`
- `frontend/src/services/meiNotasService.ts`
- `frontend/src/lib/fiscalUserError.ts`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- `frontend/src/utils/apiClientError.ts`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/src/controllers/mei-notas.controller.js`
- `backend/tests/plugnotas-empresa.test.js`
- `frontend/src/lib/fiscalUserError.test.ts`
- `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`
- `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`
- `docs/stories/story-fr-rtcad-p0-classificacao-fluxo-causalidade-plugnotas.md`

### Technical Constraints

- Não criar nova rota visual ou nova fase obrigatória além de `certificado` e `empresa`.
- Não introduzir dependência da UI em detalhes de endpoint como narrativa principal.
- Não reabrir credenciais municipais.
- Manter compatibilidade com o contrato já consumido pelo frontend; `runtimeDecision` não pode virar pré-requisito desta story.
- Tratar `plugnotasRequest` como opcional apenas nos casos de bloqueio antecipado decididos pelo BFF antes do upstream.
- As classificações estáveis mínimas desta story são `prefeitura_login_required_blocked`, `prefeitura_ibge_apenas_insuficiente_dp02`, `payload_contrato`, `ambiente_configuracao` e `empresa_nao_cadastrada`; `created`, `updated` e `existing` continuam a ser os únicos sinais obrigatórios de sucesso/fallback.
- Não exigir que `payload_contrato` e `ambiente_configuracao` sejam novos valores obrigatórios de `plugnotasCode`; estas duas classificações podem nascer do mapeamento estável do contrato atual e, quando existir, ser enriquecidas por `runtimeDecision`.
- Preservar o comportamento de retry parcial apenas quando a ação fizer sentido.

### Testing

- Validar que esta story continua funcional sem depender de `runtimeDecision`.
- Validar prioridade da classificação estável do BFF sobre mensagens cruas.
- Validar explicitamente o caso de bloqueio antecipado com `plugnotasCode` presente e `plugnotasRequest` ausente.
- Validar a origem contratual de cada classificação: `plugnotasCode` para os cenários municipais e de causalidade, e mapeamento estável do contrato atual para `payload_contrato` e `ambiente_configuracao`.
- Validar que estados municipais do MVP não exibem formulário de credenciais nem CTA principal de retry cego.
- Validar que `updated` / `existing` continuam a gerar narrativa de sincronização.
- Validar que `empresa_nao_cadastrada` aparece como consequência do cadastro anterior e não como causa primária.

---

## Tasks / Subtasks

1. [ ] Ajustar o contrato backend -> frontend para expor a classificação estável necessária sem breaking change, mantendo como contrato obrigatório `plugnotasCode`, `httpStatus`, `plugnotasRequest` quando houver e `operation`, sem tornar `runtimeDecision` obrigatório.
2. [ ] Centralizar a interpretação frontend do fluxo RTCAD a partir do contrato do BFF.
3. [ ] Explicitar em código e testes as classificações estáveis mínimas da story, bem como a origem contratual de cada uma: `plugnotasCode` quando aplicável e mapeamento estável do contrato atual para `payload_contrato` e `ambiente_configuracao`.
4. [ ] Atualizar copy, CTA e estados dos componentes da Guia MEI conforme os estados UX do MVP.
5. [ ] Garantir que o painel de erro e o painel de retry respeitam a decisão municipal do BFF, incluindo o caso de bloqueio antecipado sem `plugnotasRequest`.
6. [ ] Manter hints heurísticos apenas como fallback secundário.
7. [ ] Adicionar/atualizar regressões frontend e backend para classificação, causalidade e UX, incluindo o caso sem `plugnotasRequest`.
8. [ ] Executar os gates do projeto e atualizar esta story com file list, notas e resultados.

---

## File list (esperada / a confirmar na execução)

- [ ] `frontend/src/pages/GuidesMei.tsx`
- [ ] `frontend/src/utils/plugnotasEmitenteSetup.ts`
- [ ] `frontend/src/services/meiNotasService.ts`
- [ ] `frontend/src/lib/fiscalUserError.ts`
- [ ] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`
- [ ] `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- [ ] `frontend/src/utils/apiClientError.ts`
- [ ] `backend/src/services/plugnotas/empresa.service.js`
- [ ] `backend/src/controllers/mei-notas.controller.js`
- [ ] `backend/tests/plugnotas-empresa.test.js`
- [ ] `frontend/src/lib/fiscalUserError.test.ts`
- [ ] `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`
- [ ] `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`
- [ ] `docs/stories/story-fr-rtcad-p0-classificacao-fluxo-causalidade-plugnotas.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Coerência entre contrato do BFF, copy e estados UX.
- Preservação da causalidade `POST` -> `PATCH` -> `GET`.
- Ausência de retry cego e de narrativa baseada em endpoint.

---

## Dev Agent Record

### Status

QA Fixes Applied — aguarda re-review de `@qa`

### File list

- `backend/src/services/plugnotas/empresa.service.js`
- `backend/tests/plugnotas-empresa.test.js`
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`
- `frontend/src/lib/fiscalUserError.ts`
- `frontend/src/lib/fiscalUserError.test.ts`
- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`

### Debug Log References

- `npm test -- backend/tests/plugnotas-empresa.test.js` (workspace `backend`)
- `npm test -- src/lib/fiscalUserError.test.ts src/components/FiscalIntegrationErrorAlert.test.tsx src/pages/GuidesMei.certificate-connectivity.test.tsx` (workspace `frontend`)
- `npm run lint`
- `npm run typecheck`
- `npm test`

### Completion Notes

- Story criada para a camada de classificação estável, UX e causalidade do Epic 1 RTCAD.
- Esta story presume o contrato oficial e o preflight municipal já preparados nas stories anteriores.
- O objetivo não é criar uma nova taxonomia isolada, mas adaptar e estender de forma coerente o contrato e os estados que a UI já consome.
- Refinamento PO aplicado: `runtimeDecision` permanece opcional nesta story, os códigos estáveis mínimos foram explicitados e o caso de bloqueio antecipado sem `plugnotasRequest` foi fechado como comportamento contratual esperado.
- Refinamento semântico adicional: `payload_contrato` e `ambiente_configuracao` ficam definidos como classificações estáveis derivadas do contrato atual, não como novos valores obrigatórios de `plugnotasCode`.
- QA fix aplicado em `GuidesMei`: o CTA principal deixa de incentivar retry cego quando o BFF classifica o fluxo como cenário municipal bloqueado (`prefeitura_login_required_blocked` / `prefeitura_ibge_apenas_insuficiente_dp02`).
- Os fluxos de `consultar` / `sincronizar` / `patch` da UI agora preservam `plugnotasCode`, `httpStatus` e `plugnotasRequest` até ao `GuiaMeiEmpresaCadastroErrorPanel`, reduzindo dependência de heurística textual.
- O backend passou a tratar `GET /empresa/:cnpj` com `404` como `empresa_nao_cadastrada` apenas quando a mensagem do emissor realmente indica ausência de empresa; os restantes `404` ficam classificados como `ambiente_configuracao`.
- O painel inline da Guia MEI mantém apenas um alerta principal por cenário e recebeu regressões cobrindo acessibilidade, causalidade e contrato estruturado.
- `npm run typecheck` e `npm test` passaram; `npm run lint` ficou apenas com warnings pré-existentes do repositório.

### Change Log

- 2026-04-14 — Story criada por @sm a partir do PRD, spec UX e arquitetura da iniciativa RTCAD, com foco em classificação estável, UX e causalidade do cadastro empresa PlugNotas.
- 2026-04-14 — Story refinada por @sm segundo avaliação @po: contrato obrigatório desta entrega explicitado, lista mínima de códigos estáveis documentada e comportamento de bloqueio antecipado sem `plugnotasRequest` fechado.
- 2026-04-14 — Story refinada por @sm para separar `plugnotasCode` obrigatório de classificações estáveis de UX, removendo ambiguidade entre contrato atual e `runtimeDecision` opcional.
- 2026-04-14 — `@dev` aplicou correções dos apontamentos de QA: bloqueio de retry cego municipal na Guia MEI, preservação do contrato estruturado na UI, ajuste da classificação backend para `GET /empresa` 404 e correção de a11y com regressões.

---

## QA Results

- Pendente.
