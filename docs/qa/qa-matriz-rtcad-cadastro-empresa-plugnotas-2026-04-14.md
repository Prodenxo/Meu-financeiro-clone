# QA Matrix — RTCAD: cadastro empresa PlugNotas por município e ambiente

- Data da consolidação: 2026-04-14
- Responsável pela consolidação: `@dev` (Dex), como correção dos apontamentos de `@qa` desta story
- Story ID: `STORY-FR-RTCAD-P1-QA-MATRIZ-VALIDACAO-MUNICIPIO-AMBIENTE-PLUGNOTAS`
- Decisão final de gate: pendente de re-review de `@qa` e aceite do MVP por `@po`
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
- A decisão final de gate (`PASS`, `CONCERNS` ou `FAIL`) continua reservada à revisão de `@qa`, mas este artefato já fecha a base de evidência necessária para esse re-review.

## Riscos residuais

- Falta ainda evidência manual remota em `homologacao` e, se exigido pelo aceite do MVP, também em `producao` controlada fora do fixture local.
- As linhas automatizadas com `3550308` representam fixtures da suíte; qualquer generalização para município real precisa de evidência operacional redigida.
- O ramo `ambiente_configuracao` continua aceitando códigos gateway equivalentes (`plugnotas_gateway_*`), portanto a leitura final deve usar a classificação estável e não depender de um código literal único.

## Rastreabilidade

- Base técnica do contrato oficial: `docs/stories/story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md`
- Base técnica do preflight municipal: `docs/stories/story-fr-rtcad-p0-preflight-municipal-bff-plugnotas.md`
- Base técnica de classificação e UX: `docs/stories/story-fr-rtcad-p0-classificacao-fluxo-causalidade-plugnotas.md`
- Runbook canónico: `docs/operacao-mei-nfse.md`
