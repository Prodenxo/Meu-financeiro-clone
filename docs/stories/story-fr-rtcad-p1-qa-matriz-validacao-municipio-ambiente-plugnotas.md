# Story — FR-RTCAD (P1): QA — matriz de validação por município e ambiente no cadastro empresa PlugNotas

**ID:** STORY-FR-RTCAD-P1-QA-MATRIZ-VALIDACAO-MUNICIPIO-AMBIENTE-PLUGNOTAS  
**Prioridade:** P1  
**Status:** Draft  
**Depende de:** [`docs/stories/story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md`](./story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md), [`docs/stories/story-fr-rtcad-p0-preflight-municipal-bff-plugnotas.md`](./story-fr-rtcad-p0-preflight-municipal-bff-plugnotas.md), [`docs/stories/story-fr-rtcad-p0-classificacao-fluxo-causalidade-plugnotas.md`](./story-fr-rtcad-p0-classificacao-fluxo-causalidade-plugnotas.md), [`docs/prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md), [`docs/specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md), [`docs/technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md), [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)  
**Fonte PRD:** [`docs/prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — **FR-RTCAD-03**, **FR-RTCAD-04**, **FR-RTCAD-05**, **FR-RTCAD-06**, **FR-RTCAD-07**, **FR-RTCAD-08**, **NFR-RTCAD-01**, **NFR-RTCAD-03**, **NFR-RTCAD-05**  
**UX:** [`docs/specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../specs/ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — secções 6, 7, 8, 10, 11 e 13  
**Arquitetura:** [`docs/technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — secções 7.5, 8, 9, 12, 13 e 15

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @qa |
| **quality_gate** | @po *(aceite do MVP)* |
| **quality_gate_tools** | execução manual controlada, evidência redigida e gates do projeto |
| **revisão** | @dev e @architect |

---

## User story

**Como** QA do fluxo fiscal da Guia MEI,  
**quero** uma matriz executável por município e ambiente que cubra preflight, cadastro, fallback e causalidade,  
**para** comprovar com evidência quais casos entram no caminho nacional do MVP e quais ficam corretamente bloqueados como exceção municipal ou erro técnico.

---

## Contexto

- O PRD posiciona esta story como validação final do Epic 1 do MVP.
- A arquitetura exige que a decisão municipal considere o ambiente alvo e aconteça antes do `POST /empresa`.
- A UX spec exige distinção explícita entre sucesso nacional, sincronização, payload, ambiente, exceção municipal e `GET` negativo posterior.
- Como o preflight varia por ambiente, a matriz precisa comprovar cobertura efetiva de `producao` e `homologacao`, e não apenas carregar a coluna `ambiente` como metadado passivo.
- Esta story pode gerar um artefato em `docs/qa/` e atualizar o runbook operacional se a triagem precisar de reforço textual.
- **Relacionado (epic PFLNAT):** matriz híbrido nacional vs login municipal e evidência reexecutável — [`story-fr-pflnat-p1-qa-regressao-matriz-preflight-hibrido.md`](./story-fr-pflnat-p1-qa-regressao-matriz-preflight-hibrido.md), artefato [`docs/qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md`](../qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md).

---

## Critérios de aceite

### Matriz de validação

- [ ] Existe uma matriz executável por município e ambiente para o cluster RTCAD.
Critério de encerramento: a matriz documenta, no mínimo, `município/IBGE`, `ambiente`, `resultado do preflight`, `chamada de cadastro`, `classificação BFF esperada`, `estado UX esperado` e `observações operacionais`, deixando explícito qual código/classificação estável é esperado em cada caso.
- [ ] A matriz cobre os cenários obrigatórios do MVP.
Critério de encerramento: há pelo menos um caso para `(a)` `payload_contrato` por dado local inválido antes do preflight, `(b)` município compatível com padrão nacional, `(c)` município com `login` ou `senha` requeridos, `(d)` município sem caminho nacional elegível, `(e)` falha técnica de preflight/ambiente, `(f)` conflito com resolução via `PATCH`, e `(g)` `GET` negativo posterior preservando a causa raiz.
- [ ] A matriz cobre efetivamente o eixo de ambiente do MVP.
Critério de encerramento: existe pelo menos um caso documentado para `producao` e um para `homologacao`; quando possível, a matriz inclui um cenário comparável entre ambientes para o mesmo município/IBGE ou para a mesma categoria de decisão, e qualquer impossibilidade prática fica registrada como risco operacional explícito.

### Evidência e privacidade

- [ ] A evidência final é auditável e sem exposição de segredo.
Critério de encerramento: a matriz ou artefato de QA registra data, ambiente, executor e resultado, usando CNPJ/IBGE mascarados quando necessário e sem expor credenciais, token ou payload bruto sensível.
- [ ] O runbook canónico permanece alinhado ao comportamento validado.
Critério de encerramento: `docs/operacao-mei-nfse.md` é verificado contra o comportamento entregue; se houver lacuna de triagem, ela entra no diff desta story ou fica explicitamente anotada como follow-up.

### Gates e readiness do MVP

- [ ] `npm run lint`, `npm run typecheck` e `npm test` foram executados no recorte final da entrega.
- [ ] O resultado da matriz permite assinar ou bloquear o MVP com rastreabilidade.
Critério de encerramento: a story termina com resultado claro de QA (`PASS`, `CONCERNS` ou `FAIL`), riscos residuais e ligação às stories 1.1, 1.2 e 1.3.

---

## Tasks / Subtasks

1. [x] Montar a matriz de validação RTCAD em artefato dedicado de QA.
2. [x] Executar ou preparar a execução controlada dos cenários mínimos por município e ambiente, incluindo cobertura explícita de `producao` e `homologacao`.
3. [x] Incluir na matriz o cenário `payload_contrato` por dado local inválido antes do preflight.
4. [x] Validar a narrativa UX esperada para cada cenário da matriz.
5. [x] Confirmar no runbook a triagem por `padraoNacional`, `login` e `senha` e registrar lacunas, se existirem.
6. [x] Consolidar evidência final, riscos residuais e decisão de gate, explicitando qualquer limitação de cobertura por ambiente.
7. [x] Executar os gates do projeto e atualizar esta story com file list e resultados.

---

## File list (indicativo)

- [x] `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`
- [x] `docs/operacao-mei-nfse.md` *(ajuste aplicado para apontador canónico RTCAD e triagem por ambiente)*
- [x] `docs/stories/story-fr-rtcad-p1-qa-matriz-validacao-municipio-ambiente-plugnotas.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Cobertura real da matriz por município e ambiente.
- Coerência entre preflight, classificação BFF e estado UX esperado.
- Preservação de privacidade e de causalidade operacional.

---

## Dev Agent Record

### Status

QA Fixes Applied — aguarda re-review de `@qa`

### File list

- `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`
- `docs/operacao-mei-nfse.md`
- `docs/stories/story-fr-rtcad-p1-qa-matriz-validacao-municipio-ambiente-plugnotas.md`

### Debug Log References

- `npm run lint`
- `npm run typecheck`
- `npm test`

### Notes

- Story criada para o gate de validação do Epic 1 RTCAD.
- O artefato principal esperado é uma matriz de QA reutilizável para rollout controlado do MVP.
- Esta story não substitui as stories técnicas; ela valida o comportamento final integrado e documenta o resultado.
- Refinamento PO aplicado: a matriz mínima agora inclui `payload_contrato` e exige cobertura efetiva do eixo `producao`/`homologacao`.
- QA fix aplicado: o artefato `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md` agora consolida, num único documento, `payload_contrato`, `success_nacional`, `prefeitura_login_required_blocked`, `prefeitura_ibge_apenas_insuficiente_dp02`, `ambiente_configuracao`, `fallback_sync` e `empresa_nao_cadastrada`, incluindo a coluna de UX esperada.
- QA fix aplicado: o runbook `docs/operacao-mei-nfse.md` ganhou o apontador canónico `RTCAD — matriz executável por município e ambiente`, deixando explícita a extensão RTCAD sobre a taxonomia ROB/NATEX/TRO e o ramo `prefeitura_ibge_apenas_insuficiente_dp02`.
- A cobertura por ambiente passa a ser auditável com linhas dedicadas para `producao` e `homologacao`; a comparação usa fixture controlado do mesmo `codigoCidade`, com risco residual explícito por ainda não haver prova manual remota nesta correção.
- Gates do projeto executados na raiz com sucesso: `npm run lint`, `npm run typecheck` e `npm test`; o lint permaneceu apenas com warnings pré-existentes em ficheiros frontend não alterados por esta story.

### Change Log

- 2026-04-14 — Story criada por @sm a partir do PRD, spec UX e arquitetura da iniciativa RTCAD, com foco em matriz de QA por município e ambiente.
- 2026-04-14 — Story refinada por @sm segundo avaliação @po: inclusão explícita de `payload_contrato` na matriz mínima e cobertura efetiva por ambiente (`producao` e `homologacao`).
- 2026-04-14 — `@dev` aplicou os fixes do QA: criou o artefato dedicado `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`, alinhou o runbook com a referência RTCAD por ambiente e executou `npm run lint`, `npm run typecheck` e `npm test` para anexar evidência final ao re-review.

---

## QA Agent Record

### Status

Draft

### Resultado

- Pendente

### Evidência

- Pendente

---

## QA Results

- 2026-04-14 — Revisão QA (`@qa`) — **Gate: FAIL**
- Escopo revisto: `docs/stories/story-fr-rtcad-p1-qa-matriz-validacao-municipio-ambiente-plugnotas.md`, `docs/operacao-mei-nfse.md`, `docs/qa/top-prefeitura-login-required-blocked-2026-04-10.md`, `docs/qa/top-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`, `docs/qa/tro-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`.
- Evidência executada:
  - `git status --short`
  - `git diff -- docs/stories/story-fr-rtcad-p1-qa-matriz-validacao-municipio-ambiente-plugnotas.md docs/qa docs/operacao-mei-nfse.md`
  - `rg "qa-matriz-rtcad|matriz de validação RTCAD|município/IBGE|resultado do preflight|classificação BFF esperada" docs`
  - `rg "padraoNacional|login|senha|preflight|nfse/cidades" docs/operacao-mei-nfse.md`
- Achados:
  - **Alto:** o artefacto principal exigido pela story não foi implementado. O ficheiro indicado em `File list` (`docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`) não existe, e não há documento equivalente em `docs/qa/` que materialize a matriz executável por município e ambiente com os campos mínimos pedidos (`município/IBGE`, `ambiente`, `resultado do preflight`, `chamada de cadastro`, `classificação BFF esperada`, `estado UX esperado`, `observações operacionais`).
  - **Alto:** a matriz mínima obrigatória do MVP continua incompleta. Os artefactos operacionais hoje presentes cobrem sobretudo o ramo NATEX de `prefeitura_login_required_blocked` e a causalidade `POST` falho -> `GET` negativo, mas não consolidam num único artefacto RTCAD os cenários `payload_contrato` antes do preflight, município compatível com padrão nacional, município sem caminho nacional elegível (`prefeitura_ibge_apenas_insuficiente_dp02`), falha técnica de preflight/ambiente e conflito com resolução via `PATCH`.
  - **Médio:** o eixo de ambiente exigido pela story não foi validado de forma auditável. Não existe caso RTCAD documentado para `producao` e `homologacao`, nem cenário comparável por ambiente para o mesmo município/IBGE ou categoria de decisão, o que deixa sem evidência o critério de cobertura efetiva do preflight por ambiente.
  - **Médio:** a story não fecha readiness do MVP nem rastreabilidade final. O `QA Agent Record` permanece em `Draft`/`Pendente`, não há resultado consolidado `PASS`/`CONCERNS`/`FAIL` com riscos residuais e ligação às stories dependentes, e também não existe evidência de execução específica desta entrega para `npm run lint`, `npm run typecheck` e `npm test`.
