# Story — FR-TRO (P1): Lideranca de produto/operacao — qualidade de governanca e operacao continua do cluster

**ID:** STORY-FR-TRO-P1-QUALIDADE-GOVERNANCA-OPERACAO-CONTINUA-PREFEITURA-LOGIN-REQUIRED-BLOCKED-2026-04-13  
**Prioridade:** P1  
**Status:** Draft  
**Depende de:** [`docs/stories/story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md`](./story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md), [`docs/stories/story-fr-tro-p1-produto-operacao-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`](./story-fr-tro-p1-produto-operacao-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md), [`docs/prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`](../prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md), [`docs/specs/ux-spec-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`](../specs/ux-spec-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md), [`docs/technical/architecture-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`](../technical/architecture-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md), [`docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`](../architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md), [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)  
**Fonte PRD:** [`docs/prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`](../prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md) — **FR-TRO-07**, **FR-TRO-08**, **NFR-TRO-04**, **NFR-TRO-05**, secao 12 (metricas de sucesso), secao 13 (riscos e mitigacao), secao 15 (plano de rollout e operacao)  
**UX:** secao 3.2 (metas de usabilidade), secao 6.3 (fluxo C - decisao por gatilho), secao 11 (mapeamento PRD -> UX), secao 12 (criterios), secao 13 (handoff)  
**Arquitetura:** secao 3 (objetivos arquiteturais), secao 4 (invariantes), secao 9.2 (escalonamento governado), secao 9.3 (saidas obrigatorias por ocorrencia/cluster), secao 11 (seguranca, observabilidade e compliance), secao 13 (riscos tecnicos), secao 14 (rastreabilidade PRD + UX -> arquitetura)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @analyst |
| **quality_gate** | @pm |
| **revisao** | @po / @qa |
| **quality_gate_tools** | revisao de governanca documental, consistencia de metricas por cluster e verificacao de rastreabilidade entre runbook, `docs/qa/` e artefato canonico |

---

## User story

**Como** lideranca de produto e operacao,  
**quero** revisar metricas, riscos e historico de decisao do cluster TRO em um ciclo continuo e rastreavel,  
**para** evitar deriva de processo e sustentar futuras decisoes de escalonamento sem extensoes ad hoc.

---

## Contexto

- O PRD de resolucao governada define esta story como o terceiro bloco do Epic 1, focado em metricas e revisao continua do cluster `prefeitura_login_required_blocked`.
- A arquitetura mantem o runtime atual e desloca o valor desta entrega para disciplina de observacao, governanca e versionamento de decisao por cluster.
- As stories 1.1 e 1.2 consolidam evidencias e gatilhos; esta story garante manutencao recorrente desses insumos para evitar retrabalho e perda de contexto entre ciclos.

---

## Mapa de fontes canonicas

- [PRD §12 — Metricas de sucesso](../prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#prd-fr-tro-metricas-sucesso): define as 4 metricas obrigatorias desta revisao continua.
- [PRD §13 — Riscos e mitigacao](../prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#prd-fr-tro-riscos-mitigacao): orienta a manutencao recorrente dos riscos do cluster.
- [PRD §14 / Story 1.3](../prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#prd-fr-tro-story-13): registra a origem desta story no Epic 1.
- [PRD §15 — Plano de rollout e operacao](../prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#prd-fr-tro-rollout-operacao): estabelece o ritual de formalizacao da decisao e agendamento da proxima revisao.
- [UX §6.3 — Fluxo C de escalonamento](../specs/ux-spec-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#ux-fr-tro-fluxo-c-escalonamento): descreve o fluxo de decisao produto/operacao por gatilho.
- [UX §12 — Criterios de aceite UX/front-end](../specs/ux-spec-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#ux-fr-tro-criterios-aceite): reforca a coerencia do handoff e da decisao governada.
- [UX §13 — Handoff](../specs/ux-spec-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#ux-fr-tro-handoff): apoia a passagem do ciclo atual para a proxima revisao.
- [Arquitetura §9.2 — Escalonamento governado](../technical/architecture-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#arch-fr-tro-escalonamento-governado): delimita o trilho B e os gatilhos validos.
- [Arquitetura §9.3 — Saidas obrigatorias por cluster](../technical/architecture-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#arch-fr-tro-saidas-cluster): fixa as saidas minimas de decisao e proxima revisao.
- [Arquitetura §13 — Riscos tecnicos](../technical/architecture-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#arch-fr-tro-riscos-tecnicos): complementa a leitura de risco residual e mitigacoes do ciclo.
- [Artefato canonico TRO — metricas e decisao](../architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md#tro-gov-metricas): concentra metricas e decisao atual do cluster.
- [Artefato canonico TRO — manutencao continua](../architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md#tro-gov-manutencao): registra o protocolo de atualizacao disciplinada do cluster.

---

## Nota de governanca do artefato

- Este arquivo permanece em `Draft` ate a primeira execucao do ciclo continuo; checklists e registros apos `CodeRabbit Integration` devem ser preenchidos somente durante a execucao real da revisao.
- `docs/qa/`, runbook e o artefato canonico de governanca sao fontes complementares do mesmo cluster e nao devem gerar fontes paralelas de decisao.

---

## Criterios de aceite

- [ ] **AC-TRO-CONT-01:** Metricas de diagnostico consistente, qualidade de evidencia, tempo de triagem e governanca de escalonamento sao revisadas por cluster com data, responsavel e fontes de entrada identificadas (**NFR-TRO-05**).
- [ ] **AC-TRO-CONT-02:** Riscos e mitigacoes do cluster permanecem atualizados no artefato canonico de governanca, com vinculo aos tickets internos e evidencias locais do ciclo revisado (**NFR-TRO-04**, **NFR-TRO-05**).
- [ ] **AC-TRO-CONT-03:** Mudancas de decisao entre ciclos ficam versionadas no artefato canonico e no `change log` do PRD; quando houver iniciativa nova, registrar link cruzado para o PRD dedicado e a proxima revisao (**FR-TRO-07**, **FR-TRO-08**, **NFR-TRO-05**).

---

## Matriz de rastreabilidade (AC -> Tasks -> Evidencia)

| AC | Task principal | Evidencia esperada |
|---|---|---|
| **AC-TRO-CONT-01** | 1 | Bloco de metricas do cluster com data, responsavel e fontes (`ticket`, `docs/qa/`, runbook, artefato canonico) |
| **AC-TRO-CONT-02** | 2 | Secao de riscos/mitigacoes revisada e vinculada a ocorrencias do ciclo |
| **AC-TRO-CONT-03** | 3 | Registro de manutencao/versionamento no artefato canonico + entrada correspondente no `change log` do PRD, com decisao atual, diferenca para ciclo anterior e proxima revisao |

---

## Dev Notes

### File Locations

- `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`
- `docs/operacao-mei-nfse.md`
- `docs/qa/tro-prefeitura-login-required-blocked-YYYY-MM-DD-<ticket-ou-incidente>.md`
- `docs/prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`
- `docs/stories/story-fr-tro-p1-qualidade-governanca-operacao-continua-prefeitura-login-required-blocked-2026-04-13.md`

### Technical Constraints

- Reusar somente as 4 metricas da secao 12 do PRD e os 3 gatilhos FR-TRO-08 ja definidos; nao criar thresholds numericos ou gatilhos novos fora dos artefatos de origem.
- Preservar a fonte canonica unica de governanca no artefato `docs/architecture/project-decisions/...`, usando o runbook e `docs/qa/` como entradas rastreaveis.
- Nao introduzir alteracao funcional de endpoint, UI ou contrato tecnico para atender esta story.
- Se algum gatilho FR-TRO-08 ativar iniciativa nova, a continuidade historica deve ocorrer por link cruzado com PRD dedicado, sem quebrar o historico do cluster atual.

### Testing

- Revisao documental do cluster com conferencias cruzadas entre ticket interno, artefato `docs/qa/`, runbook e artefato canonico de governanca.
- Validar que o bloco de metricas usa exatamente os sinais do PRD: diagnostico consistente, qualidade de evidencia, tempo de triagem e governanca de escalonamento.
- Validar que riscos, mitigacoes, decisao atual e proxima revisao ficam versionados no mesmo artefato canonico.
- Gates de codigo (`npm run lint`, `npm run typecheck`, `npm test`) sao N/A, salvo se houver alteracao inesperada de aplicacao durante a execucao.

### Template minimo do registro de revisao continua (obrigatorio)

```md
# Revisao continua do cluster TRO — prefeitura_login_required_blocked

- Data da revisao:
- Responsavel:
- Story ID:
- Periodo/cluster analisado:

## Entradas da revisao
- Tickets internos relacionados:
- Evidencias locais (`docs/qa/`):
- Referencia de runbook:
- Artefato canonico de governanca:

## Metricas do PRD secao 12
- Diagnostico consistente:
- Qualidade de evidencia:
- Tempo de triagem:
- Governanca de escalonamento:

## Riscos e mitigacoes do ciclo
- Risco:
- Mitigacao:

## Decisao e versionamento
- Resultado atual: manter politica vigente | abrir PRD dedicado
- Diferenca em relacao ao ciclo anterior:
- Referencia no change log do PRD (quando houver mudanca de decisao):
- Link cruzado para PRD dedicado (quando aplicavel):
- Proxima revisao:
```

---

## Tasks / Subtasks

1. [ ] Consolidar no artefato canonico o bloco de metricas obrigatorias do cluster com fontes de entrada e responsavel da revisao (AC: **AC-TRO-CONT-01**).
2. [ ] Revisar e atualizar riscos/mitigacoes do cluster com vinculo explicito aos tickets internos e evidencias locais usados no ciclo (AC: **AC-TRO-CONT-02**).
3. [ ] Registrar protocolo de versionamento da decisao do cluster, incluindo diferenca para o ciclo anterior, atualizacao do `change log` do PRD quando houver mudanca de decisao, link cruzado para PRD dedicado quando aplicavel e proxima revisao (AC: **AC-TRO-CONT-03**).
4. [ ] Confirmar que a revisao continua preserva baixo overhead e nao cria novos gatilhos, thresholds ou fontes canonicas paralelas (AC: **AC-TRO-CONT-01**, **AC-TRO-CONT-02**, **AC-TRO-CONT-03**).

---

## Checklist de Preparacao para Execucao (DoR)

- [ ] Stories 1.1 e 1.2 revisadas e disponiveis como contexto do cluster.
- [ ] Artefato canonico de governanca existente e acessivel para atualizacao.
- [ ] Tickets internos e evidencias `docs/qa/` do ciclo atual identificados.
- [ ] PRD, UX spec e arquitetura de resolucao governada lidos antes da revisao.
- [ ] Responsaveis por aprovacao do ciclo (produto/operacao) identificados.

---

## Definicao de Pronto para Review (PO Gate)

- [ ] Todos os ACs **AC-TRO-CONT-01** a **AC-TRO-CONT-03** foram validados com evidencia documental.
- [ ] O artefato canonico contem metricas, riscos/mitigacoes, decisao atual e proxima revisao do cluster.
- [ ] Tickets e evidencias locais estao vinculados sem lacunas de rastreabilidade.
- [ ] Se houve mudanca de decisao do cluster, o `change log` do PRD foi atualizado com a versao correspondente.
- [ ] Se houve iniciativa nova, o link cruzado para o PRD dedicado foi registrado no artefato canonico.
- [ ] `Dev Agent Record` e `File list` foram atualizados para handoff ao quality gate.

---

## File list (esperada / a confirmar na execucao)

- [ ] `docs/qa/tro-prefeitura-login-required-blocked-YYYY-MM-DD-<ticket-ou-incidente>.md` *(evidencia revisada do ciclo atual)*
- [ ] `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`
- [ ] `docs/operacao-mei-nfse.md`
- [ ] `docs/prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md` *(quando houver mudanca de decisao do cluster para atualizar `change log`, ou abertura de iniciativa nova)*
- [ ] `docs/stories/story-fr-tro-p1-qualidade-governanca-operacao-continua-prefeitura-login-required-blocked-2026-04-13.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in core-config.yaml.

### Manual Review Focus (fallback)

- Consistencia das 4 metricas do PRD no ciclo de revisao.
- Versionamento da decisao do cluster sem perda de historico.
- Rastreabilidade entre ticket, `docs/qa/`, runbook e artefato canonico.

---

## Dev Agent Record

### Status

Draft

### File list

*(preencher durante a execucao da story)*

### Debug Log References

*(preencher durante a execucao da story)*

### Completion Notes

*(preencher durante a execucao da story)*

### Change Log

- 2026-04-13 — Story criada por @sm a partir do PRD, UX spec e arquitetura de resolucao governada do cluster TRO.
- 2026-04-13 — Story refinada por @sm conforme criterios do @po: mapa de fontes canonicas com links por secao/ancora, obrigatoriedade de `docs/qa/` no handoff e versionamento da decisao no artefato canonico + `change log` do PRD.

---

## QA Results

Pendente.
