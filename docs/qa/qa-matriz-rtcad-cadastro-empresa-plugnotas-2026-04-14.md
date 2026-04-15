# QA Matrix — RTCAD: cadastro empresa PlugNotas por município e ambiente

- Data da consolidação: 2026-04-15 *(linha REC500 `5002704` alinhada à decisão formal PRD §18; regressão P2 `RTCAD-REC500-02` em 2026-04-15)*
- Responsável pela consolidação: `@dev` (Dex), como correção dos apontamentos de `@qa` desta story
- **Stories que governam este artefacto:**
  - **Baseline RTCAD (matriz executável `RTCAD-01` … `RTCAD-08`):** `STORY-FR-RTCAD-P1-QA-MATRIZ-VALIDACAO-MUNICIPIO-AMBIENTE-PLUGNOTAS` — gate MVP / `@po` pode permanecer específico dessa iniciativa.
  - **Extensão REC500 (linha `RTCAD-REC500-01`, IBGE `5002704`):** `STORY-FR-REC500-P1-QA-DOCS-ALINHAMENTO-MATRIZ-RUNBOOK-5002704-2026-04-14` — revisão documental `@qa` (**PASS** advisory, 2026-04-15); quality gate `@po` conforme *Executor Assignment* dessa story.
  - **Regressão REC500 P2 (linha `RTCAD-REC500-02`):** `STORY-FR-REC500-P2-BACKEND-QA-REGRESSAO-CASO-HIBRIDO-5002704-2026-04-14` — suíte automatizada + distinção bloqueado vs governado futuro.
  - **Rollout controlado REC500 P2 (operação):** `STORY-FR-REC500-P2-OPERACAO-ROLLOUT-CONTROLADO-5002704-2026-04-14` — encerramento documental **sem ativação** em 2026-04-15 (PRD §18 `manter policy vigente`); evidência em [`rec500-rollout-controlado-5002704-2026-04-14.md`](./rec500-rollout-controlado-5002704-2026-04-14.md).
- Escopo: preflight municipal -> `POST /empresa` -> fallback `PATCH /empresa/:cnpj` -> `GET /empresa/:cnpj`
- Política de evidência: usar apenas conteúdo redigido, sem `x-api-key`, certificado, `login`/`senha` da prefeitura, CNPJ completo ou payload bruto sensível

## Como ler esta matriz

1. Cada linha representa um cenário RTCAD por `município/IBGE` e `ambiente`.
2. A coluna `status da linha` distingue `automatizado executado`, `manual executado` e `preparo controlado`.
3. A taxonomia base vem de ROB/NATEX/TRO; esta matriz acrescenta explicitamente `prefeitura_ibge_apenas_insuficiente_dp02` para o bloqueio municipal identificado no preflight sem auth explícita.
4. Quando a linha vier de teste automatizado, o `município/IBGE` representa um fixture controlado da suíte, não uma afirmação sobre o comportamento real e permanente daquele município no emissor.
5. O eixo `producao`/`homologacao` precisa aparecer de forma auditável mesmo quando a execução for automatizada; ausência de prova manual remota fica listada em riscos residuais.

## Matriz executável RTCAD

| caso | município / IBGE | ambiente | status da linha | resultado do preflight | chamada de cadastro | classificação BFF esperada | estado UX esperado | observações operacionais | evidência base |
|---|---|---|---|---|---|---|---|---|---|
| `RTCAD-01` | `n/a` (`codigoCidade` ausente localmente) | `producao` | `automatizado executado` | não consultado; bloqueio local com `consultedMunicipio=false` e `upstreamCallSkipped=true` | nenhuma chamada a `POST /empresa` ou `PATCH /empresa/:cnpj` | `payload_contrato` | estado de erro orientado a `revisar dados`, sem narrativa de endpoint e sem retry cego como ação principal | prova o bloqueio antes do upstream e fecha o caso mínimo de dado local inválido | `backend/tests/plugnotas-empresa.test.js`; `backend/tests/mei-notas-empresa-http.test.js` |
| `RTCAD-02` | `3550308` (fixture controlado da suíte) | `producao` | `automatizado executado` | consultado com caminho nacional elegível (`padraoNacionalEnabled=true`, sem `login`/`senha`) | `POST /empresa` -> `200`, `operation=created` | `success_nacional` | narrativa de sucesso nacional para `cadastrar a empresa no emissor` | linha base do hot path oficial nacional | `backend/tests/plugnotas-empresa.test.js` |
| `RTCAD-03` | `3550308` (fixture controlado da suíte) | `homologacao` | `automatizado executado` | consultado no ambiente alvo com caminho nacional elegível para `producao=false` | `PATCH /empresa/:cnpj` explícito -> `200` | `success_nacional` | narrativa de sucesso/sincronização, sem abrir etapa municipal separada | cobre efetivamente `homologacao`; serve como comparação do mesmo IBGE com ambiente alvo distinto, embora ainda sem prova manual remota | `backend/tests/plugnotas-empresa.test.js` |
| `RTCAD-04` | `3550308` (fixture controlado da suíte) | `producao` | `automatizado executado` + `manual executado` | consultado; município exige auth municipal (`requiresLogin=true` ou `requiresSenha=true`) | `GET /nfse/cidades/{codigoIbge}` executado; `POST /empresa` bloqueado antes do upstream final | `prefeitura_login_required_blocked` | estado UX de exceção municipal bloqueada, sem formulário de credenciais municipais e sem retry cego | classificação final operacional: `não suportado no fluxo nacional`; evidência manual já existe em TOP/TRO | `backend/tests/plugnotas-empresa.test.js`; `backend/tests/mei-notas-empresa-http.test.js`; `docs/qa/top-prefeitura-login-required-blocked-2026-04-10.md`; `docs/qa/tro-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md` |
| `RTCAD-05` | `3550308` (fixture controlado da suíte) | `producao` | `automatizado executado` | consultado; `padraoNacionalEnabled=false` e sem auth municipal explícita | `POST /empresa` bloqueado antes do upstream | `prefeitura_ibge_apenas_insuficiente_dp02` | estado UX municipal bloqueado, sem tratar o caso como simples erro de IBGE e sem pedir credenciais | distingue o ramo DP02 dinâmico do `payload_contrato` e do bloqueio por auth municipal | `backend/tests/plugnotas-empresa.test.js`; `docs/operacao-mei-nfse.md#dp02-prefeitura-ibge-apenas-bloqueio` |
| `RTCAD-06` | `3550308` (fixture controlado da suíte) | `producao` | `automatizado executado` | `GET /nfse/cidades/{codigoIbge}` falha tecnicamente (`503` no fixture) | nenhuma chamada a `POST /empresa` ou `PATCH /empresa/:cnpj` | `ambiente_configuracao` como classificação estável; no fixture o código observado é `plugnotas_gateway_503` | estado UX de problema técnico/ambiente, distinto de revisão de dados | manter separação entre erro de integração/upstream e rejeição de payload | `backend/tests/plugnotas-empresa.test.js` |
| `RTCAD-07` | `3550308` (fixture controlado da suíte) | `producao` | `automatizado executado` | consultado uma vez; preflight elegível é reutilizado no mesmo fluxo | `POST /empresa` -> `409`; fallback `PATCH /empresa/:cnpj` -> `200`, `operation=updated` | `fallback_sync` | estado UX de `sincronizar cadastro`, não de erro | não abrir incidente arquitetural quando o conflito é resolvido por sincronização | `backend/tests/plugnotas-empresa.test.js` |
| `RTCAD-08` | `3550308` (fixture controlado + ocorrência redigida) | `producao` | `automatizado executado` + `manual executado` | a causa raiz já foi decidida no `POST` anterior; o `GET` posterior apenas confirma ausência de cadastro concluído | `GET /empresa/:cnpj` -> `404` após `POST` bloqueado | `empresa_nao_cadastrada`, preservando a causa raiz anterior | estado UX de `o cadastro ainda não foi concluído`, sem apagar o erro primário e sem narrativa de rota errada | linha obrigatória de causalidade `POST` bloqueado -> `GET` negativo | `backend/tests/plugnotas-empresa.test.js`; `docs/qa/top-prefeitura-login-required-blocked-2026-04-10.md`; `docs/qa/tro-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md` |
| `RTCAD-REC500-01` | `5002704` (município real — caso REC500) | `producao` | `manual executado` + evidência em artefacto dedicado | consultado; preflight **híbrido** (`padraoNacionalEnabled=true`, `requiresLogin=true`, `requiresSenha=false`) | nenhum `POST /empresa` após bloqueio por policy do motor (upstream final não atingido no caminho bloqueado) | `prefeitura_login_required_blocked` | **REC500-UX-L1** — exceção municipal bloqueada; sem credenciais; sem retry cego | **Decisão atual do caso (PRD §18):** `manter policy vigente`. Não tratar como bug de endpoint. **Não** extrapolar para outros IBGEs só por também exigirem `login`/`senha` no preflight. Homologação: comparável **inconclusiva** no artefacto QA até nova coleta. | [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](./rec500-preflight-5002704-ambientes-2026-04-14.md); [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) §18; [`docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) §18; [`docs/specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) §7.2 |
| `RTCAD-REC500-02` | `5002704` (fixture controlado — mesma semântica híbrida que evidência REC500) | `producao` | `automatizado executado` | consultado; preflight híbrido alinhado ao caso real | `GET /nfse/cidades/5002704`; `POST /empresa` **não** executado (bloqueio local após preflight) | `prefeitura_login_required_blocked` | **REC500-UX-L1** | **Regressão P2 (`STORY-FR-REC500-P2-BACKEND-QA-REGRESSAO-CASO-HIBRIDO-5002704`):** prova automatizada do ramo **bloqueado** com policy vigente. **Ramo governado/aprovado:** *não aplicável* enquanto PRD §18 for `manter policy vigente` e Epic 2 não estiver implementado; quando existir `correcao controlada`, acrescentar prova do caminho aprovado **sem** remover esta linha de brownfield. | `backend/tests/empresa-cadastro-runtime-rec500-regression.test.js`; `backend/tests/plugnotas-empresa.test.js`; `backend/tests/mei-notas-empresa-http.test.js`; `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`; `frontend/src/utils/nfEmissionCompany.test.ts`; `frontend/src/lib/fiscalUserError.test.ts` |

### Distinção de ramos REC500 (matriz)

| Caminho | Estado em PRD §18 `manter policy vigente` | Quando existe prova automatizada |
|--------|-------------------------------------------|-----------------------------------|
| **Bloqueado** (precedência login/senha vs nacional) | Comportamento de produção + regressão P2 | `RTCAD-REC500-01` (manual + artefactos), `RTCAD-REC500-02` (suíte) |
| **Governado / aprovado** (exceção estreita BFF) | *Não implementado* — Epic 2 condicional não iniciado; story runtime **Cancelled** | *Futuro:* apenas após decisão `correcao controlada` + reabertura técnica da [`story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`](../stories/story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) |
| **Rollout operacional (ativação ambiente)** | **Não executado** — sem build/feature a promover; ver [`rec500-rollout-controlado-5002704-2026-04-14.md`](./rec500-rollout-controlado-5002704-2026-04-14.md) | *N/A* enquanto não existir ramo governado merged |

### Rollout controlado (story operação P2)

| Momento | Estado (2026-04-15) | Evidência |
|--------|---------------------|-----------|
| Ativação de exceção governada `5002704` em ambiente autorizado | **Não aplicável** — decisão PRD §18 `manter policy vigente`; pré-requisito técnico (runtime governado) cancelado | [`rec500-rollout-controlado-5002704-2026-04-14.md`](./rec500-rollout-controlado-5002704-2026-04-14.md) |
| Plano futuro condicional (ativação + rollback) | Documentado no mesmo artefacto para reabertura por `@po` | Secções 2 e 2.2 do artefacto |

## Cobertura mínima do MVP

- `payload_contrato` antes do preflight: coberto por `RTCAD-01`.
- Município compatível com padrão nacional: coberto por `RTCAD-02`.
- Município com `login` ou `senha` requeridos: coberto por `RTCAD-04`.
- Município sem caminho nacional elegível: coberto por `RTCAD-05`.
- Falha técnica de preflight/ambiente: coberto por `RTCAD-06`.
- Conflito com resolução via `PATCH`: coberto por `RTCAD-07`.
- `GET` negativo posterior preservando a causa raiz: coberto por `RTCAD-08`.

## Cobertura do eixo de ambiente

- `producao`: coberta nas linhas `RTCAD-01`, `RTCAD-02`, `RTCAD-04`, `RTCAD-05`, `RTCAD-06`, `RTCAD-07` e `RTCAD-08`.
- `homologacao`: coberta na linha `RTCAD-03`, com validação automatizada do ambiente alvo em `PATCH` explícito.
- Cenário comparável por `municipio/IBGE`: `RTCAD-02` e `RTCAD-03` usam o mesmo `codigoCidade` (`3550308`) para demonstrar que o motor lê o ambiente alvo antes do upstream.
- Limitação registada: nesta correção não houve execução manual remota em ambiente externo de homologação/produção controlada; a cobertura atual do eixo de ambiente é forte no nível de lógica BFF e regressão automatizada, mas ainda depende de reexecução manual controlada se o gate do MVP exigir prova operacional remota.

## Leitura de prontidão para re-review

- A matriz agora consolida, num único artefato, os campos mínimos pedidos pela story: `município/IBGE`, `ambiente`, `resultado do preflight`, `chamada de cadastro`, `classificação BFF esperada`, `estado UX esperado` e `observações operacionais`.
- O cluster RTCAD passa a ficar rastreável num único documento, sem espalhar a leitura entre ROB, NATEX e TRO.
- A decisão final de gate (`PASS`, `CONCERNS` ou `FAIL`) para a **baseline** `RTCAD-01`…`08` continua reservada ao processo da story RTCAD P1; a **linha REC500** (`RTCAD-REC500-01`) foi revista em revisão QA documental (**PASS** advisory, 2026-04-15) no âmbito de `STORY-FR-REC500-P1-QA-DOCS-ALINHAMENTO-MATRIZ-RUNBOOK-5002704-2026-04-14`.

## Riscos residuais

- Falta ainda evidência manual remota em `homologacao` e, se exigido pelo aceite do MVP, também em `producao` controlada fora do fixture local.
- As linhas automatizadas com `3550308` representam fixtures da suíte; qualquer generalização para município real precisa de evidência operacional redigida.
- O ramo `ambiente_configuracao` continua aceitando códigos gateway equivalentes (`plugnotas_gateway_*`), portanto a leitura final deve usar a classificação estável e não depender de um código literal único.

## Rastreabilidade

- Base técnica do contrato oficial: `docs/stories/story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md`
- Base técnica do preflight municipal: `docs/stories/story-fr-rtcad-p0-preflight-municipal-bff-plugnotas.md`
- Base técnica de classificação e UX: `docs/stories/story-fr-rtcad-p0-classificacao-fluxo-causalidade-plugnotas.md`
- Runbook canónico: `docs/operacao-mei-nfse.md`
- Caso recorrente **IBGE `5002704` (REC500)** — decisão formal e operação: linha `RTCAD-REC500-01` acima; PRD [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) §18; runbook [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) (ancora `#rec500-ibge-5002704-caso-recorrente`)
