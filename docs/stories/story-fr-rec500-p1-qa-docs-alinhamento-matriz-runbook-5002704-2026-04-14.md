# Story — FR-REC500 (P1): QA/Docs — alinhamento de matriz RTCAD e runbook para `5002704`

**ID:** STORY-FR-REC500-P1-QA-DOCS-ALINHAMENTO-MATRIZ-RUNBOOK-5002704-2026-04-14  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** [`docs/stories/story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md`](./story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md) *(Epic 1 — evidencia por ambiente)*, [`docs/stories/story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) *(Epic 1 — decisao formal do caso)*, [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](../qa/rec500-preflight-5002704-ambientes-2026-04-14.md) *(artefacto de preflight consolidado)*, [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`](../qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md), [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)  
**Fonte PRD:** [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) — **FR-REC500-07**, **FR-REC500-08**, **FR-REC500-09**, **NFR-REC500-02**, **CR-REC500-04**  
**UX:** secao 7.2 (REC500-UX-L1), secao 7.3 (REC500-UX-L2), secao 7.4 (REC500-UX-L3), secao 7.5 (REC500-UX-L4), secao 12.1 (matriz QA), secao 12.2 (runbook), secao 14 (criterios)  
**Arquitetura:** secao 9 (contrato BFF -> frontend), secao 10 (impacto no frontend), secao 11 (observabilidade, evidencia e redaction), secao 12.3 (QA documental), secao 13 (rollout)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @qa |
| **quality_gate** | @po |
| **revisao** | @dev e @architect |
| **quality_gate_tools** | revisao documental, consistencia de matriz e runbook, verificacao manual de cross-links e gates do repo conforme secao **Gates** desta story |

---

## User story

**Como** QA/documentacao operacional do cluster RTCAD,  
**quero** alinhar a matriz QA e o runbook ao resultado final do caso `5002704`,  
**para** impedir que a recorrencia volte a ser tratada como bug de endpoint ou como regra global para outros municipios.

---

## Contexto

- O PRD exige cobertura explicita de `5002704` na matriz QA e no runbook.
- A UX spec define estados distintos para `em descoberta`, `excecao controlada` e `fase 2 municipal`; a documentacao precisa refletir isso sem ambiguidade.
- A arquitetura determina que a eventual excecao controlada continue invisivel como regra global no frontend, o que aumenta a importancia da rastreabilidade documental.
- Esta story so deve fechar depois de [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) ter registado a decisao formal unica do caso (PRD + arquitetura alinhados).

---

## Critérios de aceite

### Matriz QA

- [ ] **AC-REC500-QA-01:** A matriz RTCAD ganha linha dedicada para `5002704`.
Critério de encerramento: a linha registra, no minimo, ambiente, resultado do preflight **coerente com** [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](../qa/rec500-preflight-5002704-ambientes-2026-04-14.md), classificacao BFF esperada, estado UX esperado e decisao atual do caso.
- [ ] **AC-REC500-QA-02:** A matriz reflete corretamente o estado decidido para `5002704`.
Critério de encerramento: se o caso estiver `em descoberta`, `excecao controlada` ou `fase 2 municipal`, a matriz deixa isso explicito sem contradizer [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) e os artefatos canonicos (PRD/arquitetura).

### Runbook operacional

- [ ] **AC-REC500-QA-03:** O runbook passa a tratar `5002704` como caso recorrente conhecido.
Critério de encerramento: `docs/operacao-mei-nfse.md` explica de forma objetiva se o municipio segue bloqueado, se entrou em descoberta dirigida ou se recebeu excecao controlada.
- [ ] **AC-REC500-QA-04:** O runbook nao generaliza a decisao para outros municipios.
Critério de encerramento: a documentacao deixa claro que a conclusao vale apenas para o caso governado e nao para todos os cenarios com `requiresLogin`/`requiresSenha`.

### Rastreabilidade

- [ ] **AC-REC500-QA-05:** Cross-links entre PRD, UX spec, arquitetura, QA e runbook ficam consolidados.
Critério de encerramento: o leitor consegue sair da linha `5002704` na matriz e encontrar o racional do caso nos artefatos de origem, sem documentacao paralela contraditoria.

### Gates

- [ ] **AC-REC500-QA-06:** Se o diff final desta story for **apenas** sob `docs/**`, registar nos `Debug Log References` que `npm run lint`, `npm run typecheck` e `npm test` sao **N/A** para esta entrega documental, com justificativa **ou** executar os tres comandos na raiz por disciplina unica da equipa e anexar a saida.
- [ ] **AC-REC500-QA-07:** Se existir alteracao fora de `docs/**`, executar obrigatoriamente `npm run lint`, `npm run typecheck` e `npm test` na raiz e anexar a saida.

---

## Matriz de rastreabilidade (AC -> Tasks)

| AC | Task principal |
|---|---|
| **AC-REC500-QA-01** | 1 |
| **AC-REC500-QA-02** | 1 |
| **AC-REC500-QA-03** | 2 |
| **AC-REC500-QA-04** | 2, 4 |
| **AC-REC500-QA-05** | 3 |
| **AC-REC500-QA-06** | 5 |
| **AC-REC500-QA-07** | 5 |

---

## Dev Notes

### File Locations

- `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md` *(coerencia do "resultado do preflight" na matriz; diff tipicamente nulo)*
- `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`
- `docs/operacao-mei-nfse.md`
- `docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`
- `docs/specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`
- `docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`
- `docs/stories/story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md`

### Technical Constraints

- Nao reescrever a narrativa do caso sem a decisao formal registada por [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) (PRD + arquitetura).
- Nao classificar `5002704` como bug de endpoint.
- Nao transformar a documentacao de `5002704` em policy para municipios fora do escopo.
- Manter redaction e rastreabilidade nos artefatos atualizados.

### Testing

- Validar coerencia entre linha da matriz, runbook e decisao formal em [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) / PRD / arquitetura.
- Conferir se os estados UX (`REC500-UX-L1` a `REC500-UX-L4`) foram refletidos corretamente no texto operacional.
- Confirmar que a documentacao deixa clara a diferenca entre estado atual, descoberta e eventual excecao controlada.

---

## Tasks / Subtasks

1. [x] Atualizar a matriz RTCAD com linha dedicada para `5002704` (AC: **AC-REC500-QA-01**, **AC-REC500-QA-02**).
2. [x] Atualizar o runbook operacional com a classificacao final do caso (AC: **AC-REC500-QA-03**, **AC-REC500-QA-04**).
3. [x] Consolidar cross-links entre PRD, UX spec, arquitetura, QA e runbook (AC: **AC-REC500-QA-05**).
4. [x] Revisar a documentacao para garantir que `5002704` nao e apresentado como regra global nem como bug de endpoint (AC: **AC-REC500-QA-04**).
5. [x] Atualizar esta story com `File list`, notas finais e registro dos gates (AC: **AC-REC500-QA-06**, **AC-REC500-QA-07**).

---

## Registro de Preparacao para Execucao (DoR)

- [ ] [`story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md`](./story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md) concluida (evidencia por ambiente + artefato de preflight).
- [ ] [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) concluida com decisao formal unica refletida em PRD e arquitetura.
- [ ] Estado atual do caso (`em descoberta`, `excecao controlada` ou `fase 2 municipal`) definido e alinhado a esses artefatos.
- [ ] Matriz QA e runbook lidos no estado anterior ao diff.
- [ ] Cross-links canonicos a serem usados identificados.

---

## Registro de Pronto para Review (PO Gate)

- [ ] **AC-REC500-QA-01** a **AC-REC500-QA-05** satisfeitos na matriz, no runbook e nos cross-links.
- [ ] `Dev Agent Record` e `File list` atualizados.
- [ ] **AC-REC500-QA-06** / **AC-REC500-QA-07** tratados conforme secao **Gates** (N/A com justificativa ou execucao completa).

---

## File list

- [x] `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`
- [x] `docs/operacao-mei-nfse.md`
- [x] `docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`
- [x] `docs/specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md` *(referenciada na matriz; sem diff obrigatorio)*
- [x] `docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`
- [x] `docs/stories/story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Coerencia entre decisao final ([`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md)), matriz QA e runbook.
- Coerencia do "resultado do preflight" na matriz com [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](../qa/rec500-preflight-5002704-ambientes-2026-04-14.md).
- Ausencia de generalizacao indevida para outros municipios.
- Clareza do racional operacional para `5002704`.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md` — linha `RTCAD-REC500-01`; data consolidacao; rastreabilidade REC500.
- `docs/operacao-mei-nfse.md` — subsecção `#rec500-ibge-5002704-caso-recorrente` + bullet em referencias RTCAD.
- `docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md` — v1.2; §18 *Implicacao* com ponteiro matriz/runbook.
- `docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md` — v1.2; §18 rastreabilidade QA/docs.
- `docs/stories/story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md` — esta story.

### Debug Log References

- **Gates (AC-REC500-QA-06 / QA-07):** Diff apenas sob `docs/**` — `npm run lint`, `npm run typecheck`, `npm test` **N/A** para validacao de codigo; execucao opcional na raiz por disciplina (sumario abaixo).
- **2026-04-15:** `npm run lint`, `npm run typecheck`, `npm test` na raiz — exit `0`; testes **351** pass.

### Completion Notes

- Story criada por `@sm` para garantir rastreabilidade operacional de ponta a ponta para `5002704`.
- Esta story encerra o `Epic 1` do ponto de vista de QA e documentacao.
- **Entrega:** decisao formal `manter policy vigente` reflectida na linha `RTCAD-REC500-01` (preflight coerente com artefacto QA); runbook com guardrail anti-generalizacao; PRD/arquitetura v1.2 com ponteiros cruzados.
- **Pos-QA (2026-04-15):** cabeçalho de [`docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`](../qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md) alinhado — distincao explicita entre story RTCAD P1 (baseline) e story REC500 (linha `RTCAD-REC500-01` + gate documental). Secção **QA Results** nao alterada pelo dev.
- **Pos-QA (2026-04-15, follow-up):** secção **Leitura de prontidão para re-review** da matriz actualizada — baseline `RTCAD-01`…`08` vs revisão documental **PASS** da linha `RTCAD-REC500-01` (story REC500), sem contradizer a observação não bloqueante do Quinn sobre o cabeçalho.

### Change Log

- 2026-04-14 — Story criada por `@sm` a partir do PRD, da spec de UX e da arquitetura de `REC500`.
- 2026-04-14 — Refinamento PO/SM: IDs `AC-REC500-QA-01` a `07`, gates condicionais (`docs/**` vs codigo), links canonicos em vez de "Story 1.1/1.2", dependencia do artefato [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](../qa/rec500-preflight-5002704-ambientes-2026-04-14.md), matriz AC->Tasks, DoR/PO Gate alinhados.
- 2026-04-15 — Implementacao: matriz `RTCAD-REC500-01`, runbook REC500, PRD/arquitetura 1.2; gates npm opcionais registados.
- 2026-04-15 — Correcao observacao QA: cabeçalho da matriz RTCAD (stories baseline vs REC500; gate documental).
- 2026-04-15 — Matriz: secção *Leitura de prontidão para re-review* alinhada (baseline RTCAD vs linha REC500 revista).

---

## QA Results

### Revisao (Quinn / aiox-qa) — 2026-04-15

**Decisao de gate (advisory):** **PASS** — matriz, runbook e ponteiros PRD/arquitetura estao alinhados à decisao formal **`manter policy vigente`** e ao artefacto de preflight; guardrails anti-generalizacao presentes. O **quality gate `@po`** da tabela *Executor Assignment* permanece para aceite formal de documentacao se a equipa o exigir.

---

#### Rastreio por criterio de aceite

| AC | Avaliacao | Notas |
|----|-----------|--------|
| **AC-REC500-QA-01** | **PASS** | Linha `RTCAD-REC500-01` com `producao`, preflight hibrido coerente com [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](../qa/rec500-preflight-5002704-ambientes-2026-04-14.md), `prefeitura_login_required_blocked`, **REC500-UX-L1**, decisao explicita na coluna de observacoes. |
| **AC-REC500-QA-02** | **PASS** | Decisao **`manter policy vigente`** (nao `excecao controlada` nem `fase 2 municipal`) reflectida sem contradizer PRD §18 / arquitetura §18 / story de decisao semantica. *(O criterio AC lista tres estados UX; aqui o estado decidido e a manutencao da policy — fora desse enumerado, mas coerente com os canonicos.)* |
| **AC-REC500-QA-03** | **PASS** | Runbook [`#rec500-ibge-5002704-caso-recorrente`](../operacao-mei-nfse.md#rec500-ibge-5002704-caso-recorrente) explica bloqueio + decisao fechada + ausencia de Epic 2 / distincao fase 2; **descoberta dirigida** no sentido Epic 1 encontra-se **concluida** (decisao registada), nao como promessa de mudanca imediata ao MEI. |
| **AC-REC500-QA-04** | **PASS** | Paragrafo **Guardrail** na subseccao REC500 do runbook proibe extrapolacao a outros IBGEs. |
| **AC-REC500-QA-05** | **PASS** | Cadeia matriz (`RTCAD-REC500-01`) → PRD §18 / arquitetura §18 / spec §7.2 / evidencia QA; PRD §18 *Implicacao* aponta para matriz e runbook; secção **Rastreabilidade** da matriz inclui REC500. |
| **AC-REC500-QA-06** | **PASS** | `Debug Log References` com N/A + execucao opcional resumida (351 testes pass). |
| **AC-REC500-QA-07** | **N/A** | Diff apenas `docs/**`. |

#### Observacoes (nao bloqueantes)

- **Cabeçalho da matriz** (`docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`): linhas iniciais ainda citam `STORY-FR-RTCAD-P1-QA-MATRIZ-...` e *gate pendente* — historicos da story RTCAD original; nao invalida a linha REC500; opcional alinhar texto introdutorio numa iteracao futura para evitar ambiguidade.

#### Epic 1 — encerramento documental

- **PASS:** Do ponto de vista QA/docs, o pacote REC500 para `5002704` fica rastreavel em matriz + runbook + PRD/arquitetura v1.2.

---

**Assinatura:** Quinn (Test Architect) — revisao documental e de consistencia; sem alteracao de codigo de aplicacao em escopo desta story.
