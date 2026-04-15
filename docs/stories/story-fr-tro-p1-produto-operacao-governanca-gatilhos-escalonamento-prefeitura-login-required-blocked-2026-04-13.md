# Story — FR-TRO (P1): Produto/Operacao — governanca dos gatilhos de escalonamento para iniciativa nova

**ID:** STORY-FR-TRO-P1-PRODUTO-OPERACAO-GOVERNANCA-GATILHOS-ESCALONAMENTO-PREFEITURA-LOGIN-REQUIRED-BLOCKED-2026-04-13  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** [`docs/stories/story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md`](./story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md), [`docs/prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`](../prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md), [`docs/specs/ux-spec-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`](../specs/ux-spec-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md), [`docs/technical/architecture-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`](../technical/architecture-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md), [`docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`](../architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md)  
**Fonte PRD:** [`docs/prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`](../prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md) — **FR-TRO-05**, **FR-TRO-07**, **FR-TRO-08**, **NFR-TRO-04**, **NFR-TRO-05**, **CR-TRO-03**, **CR-TRO-04** (alinhado as metricas da secao 12 e aos riscos da secao 13)  
**UX:** secao 3 (principios de design), secao 6.3 (fluxo C - decisao de escalonamento), secao 11 (mapeamento PRD -> UX), secao 12 (criterios), secao 13 (handoff)  
**Arquitetura:** secao 4 (invariantes), secao 9.2 (escalonamento governado), secao 9.3 (saidas obrigatorias por cluster), secao 10 (compatibilidade brownfield), secao 13 (riscos tecnicos), secao 14 (rastreabilidade PRD + UX -> arquitetura), secao 15 (criterios tecnicos)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @pm |
| **revisao** | @po / @architect |
| **quality_gate_tools** | revisao de governanca documental, consistencia com PRD/arquitetura e verificacao de rastreabilidade com ticket interno |

---

## User story

**Como** produto e operacao,  
**quero** um protocolo unico de escalonamento para quando houver recorrencia relevante do caso `prefeitura_login_required_blocked`,  
**para** abrir iniciativa nova somente quando os gatilhos FR-TRO-08 ocorrerem e evitar tanto escalonamento precoce quanto atraso estrategico.

---

## Contexto

- O PRD de resolucao governada separa explicitamente o trilho A (tratativa imediata) do trilho B (escalonamento condicional por gatilho).
- O escalonamento para iniciativa nova nao e automatico: depende exclusivamente dos 3 gatilhos FR-TRO-08 e da decisao formal por ocorrencia/cluster.
- A arquitetura reforca que a saida operacional deve registrar ticket, evidencia redigida, decisao binaria e proxima revisao para produto decidir sem ambiguidade.

---

## Mapa de fontes canonicas

- [PRD §9.2 — Trilho B de escalonamento](../prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#prd-fr-tro-trilho-b-escalonamento): define que o escalonamento depende exclusivamente dos gatilhos FR-TRO-08.
- [PRD §12 — Metricas de sucesso](../prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#prd-fr-tro-metricas-sucesso): fornece as metricas usadas como entrada obrigatoria da decisao de produto.
- [PRD §13 — Riscos e mitigacao](../prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#prd-fr-tro-riscos-mitigacao): contextualiza os riscos de deriva operacional e atraso estrategico mitigados por esta governanca.
- [PRD §14 / Story 1.2](../prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#prd-fr-tro-story-12): registra a origem desta story na decomposicao do Epic 1.
- [UX §6.3 — Fluxo C de escalonamento](../specs/ux-spec-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#ux-fr-tro-fluxo-c-escalonamento): descreve o fluxo de decisao produto/operacao por gatilho.
- [UX §12 — Criterios de aceite UX/front-end](../specs/ux-spec-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#ux-fr-tro-criterios-aceite): valida a coerencia do handoff e da decisao governada.
- [UX §13 — Handoff](../specs/ux-spec-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#ux-fr-tro-handoff): reforca a continuidade entre operacao, produto e proximos passos.
- [Arquitetura §9.2 — Escalonamento governado](../technical/architecture-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#arch-fr-tro-escalonamento-governado): define a regra tecnica do trilho B.
- [Arquitetura §9.3 — Saidas obrigatorias por cluster](../technical/architecture-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#arch-fr-tro-saidas-cluster): fixa as saidas documentais obrigatorias por ocorrencia/cluster.
- [Arquitetura §13 — Riscos tecnicos](../technical/architecture-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md#arch-fr-tro-riscos-tecnicos): apoia a leitura do risco residual e da manutencao continua.
- [Artefato canonico de governanca TRO](../architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md#tro-gov-gatilhos): consolida os gatilhos, entradas, decisao e manutencao do cluster.
- [Runbook TRO](../operacao-mei-nfse.md#tro-protocolo-operacional-prefeitura-login-required-blocked): ponto operacional de consulta e cross-link para a governanca.

---

## Nota de governanca do artefato

- Este arquivo e um artefato vivo de story: as secoes canonicas de requisito e preparo de execucao vao de `Executor Assignment` ate `Tasks / Subtasks`.
- As secoes a partir de `Historico de execucao do cluster auditado` preservam a execucao documental revisada da ocorrencia/cluster e nao alteram os requisitos canonicos; `CodeRabbit Integration` permanece como metadado canonico de revisao do template.
- O `executor` acima foi alinhado ao historico auditado desta entrega, mantendo coerencia com `Dev Agent Record` e com o artefato canonico de governanca.

---

## Criterios de aceite

- [x] **AC-TRO-GOV-01:** Existe artefato de governanca documentando os gatilhos FR-TRO-08 sem alterar a politica funcional vigente.
- [x] **AC-TRO-GOV-02:** O artefato explicita os 3 gatilhos de escalonamento conforme PRD: volume recorrente com impacto operacional, demanda comercial explicita, decisao estrategica de ampliar cobertura municipal (**FR-TRO-08**).
- [x] **AC-TRO-GOV-03:** O processo de encerramento de ocorrencia exige vinculo com ticket interno + referencia runbook/evidencia local (**FR-TRO-05**).
- [x] **AC-TRO-GOV-04:** Ha decisao formal de produto por ocorrencia/cluster: `manter politica vigente` ou `abrir PRD dedicado de iniciativa nova` (**FR-TRO-07**).
- [x] **AC-TRO-GOV-05:** O processo inclui leitura das metricas operacionais do PRD (diagnostico consistente, qualidade de evidencia, tempo de triagem, governanca de escalonamento) para suportar decisao.
- [x] **AC-TRO-GOV-06:** Fluxo documental evita duplicidade e segue baixo overhead operacional com referencia canonica unica (**NFR-TRO-04**).

---

## Matriz de rastreabilidade (AC -> Tasks -> Evidencia)

| AC | Task principal | Evidencia esperada |
|---|---|---|
| **AC-TRO-GOV-01** | 1 | Artefato de governanca criado sem alterar politica funcional vigente |
| **AC-TRO-GOV-02** | 1 | Registro explicito dos 3 gatilhos FR-TRO-08 no artefato |
| **AC-TRO-GOV-03** | 2 | Estrutura por ocorrencia contendo ticket + runbook/evidencia local |
| **AC-TRO-GOV-04** | 2 | Decisao formal documentada: manter politica | abrir PRD dedicado |
| **AC-TRO-GOV-05** | 3 | Secao de metricas do PRD usada como entrada obrigatoria de decisao |
| **AC-TRO-GOV-06** | 4 | Referencia canonica unica e sem duplicidade documental contraditoria |

---

## Dev Notes

### File Locations

- `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md` *(artefato principal de governanca)*
- `docs/operacao-mei-nfse.md` *(adicionar link para o artefato de governanca, se necessario)*
- `docs/qa/tro-prefeitura-login-required-blocked-YYYY-MM-DD-<ticket-ou-incidente>.md` *(evidencias por ocorrencia usadas como base de decisao)*
- `docs/stories/story-fr-tro-p1-produto-operacao-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`

### Technical Constraints

- Nao criar novos gatilhos fora dos 3 definidos em FR-TRO-08.
- Nao introduzir thresholds numericos que nao estejam nos artefatos de origem.
- Nao transformar esta story em implementacao de suporte municipal.
- Manter compatibilidade com evidencias historicas (`top-...`) e aceitar novo padrao por ocorrencia (`tro-...`) sem perda de rastreabilidade.

### Testing

- Revisao por amostra de ocorrencias para verificar aplicacao consistente dos gatilhos.
- Validar se cada caso possui ticket, evidencia local e decisao formal registrada.
- Entrega documental: gates de codigo sao N/A, salvo se houver alteracao inesperada de aplicacao.

### Template minimo do artefato de governanca (obrigatorio)

```md
# Governanca TRO — Gatilhos de escalonamento (`prefeitura_login_required_blocked`)

- Data de atualizacao:
- Responsavel:
- Story ID:
- Fonte PRD:

## Gatilhos FR-TRO-08 (sem extensoes)
- [ ] Volume recorrente com impacto operacional
- [ ] Demanda comercial explicita
- [ ] Decisao estrategica de ampliar cobertura municipal

## Entradas obrigatorias para decisao
- Tickets internos relacionados:
- Referencias de evidencia local (`docs/qa/`):
- Referencia de runbook:
- Leitura das metricas PRD secao 12:

## Decisao de produto (por ocorrencia/cluster)
- Resultado: manter politica vigente | abrir PRD dedicado de iniciativa nova
- Justificativa:
- Responsavel pela aprovacao:

## Rastreabilidade e follow-up
- Link para PRD dedicado (quando abrir):
- Proxima revisao:
```

---

## Tasks / Subtasks

1. [x] Elaborar artefato de governanca com gatilhos FR-TRO-08 e fluxo de decisao produto/operacao (AC: **AC-TRO-GOV-01**, **AC-TRO-GOV-02**).
2. [x] Definir estrutura minima de registro por ocorrencia (ticket, referencia runbook/evidencia, decisao formal final) (AC: **AC-TRO-GOV-03**, **AC-TRO-GOV-04**).
3. [x] Incluir uso das metricas do PRD como entrada obrigatoria da decisao de escalonamento (AC: **AC-TRO-GOV-05**).
4. [x] Garantir fonte canonica unica e baixo overhead documental (AC: **AC-TRO-GOV-06**).

---

## Historico de execucao do cluster auditado

As secoes abaixo registram a execucao documental auditada desta story e preservam o contexto do cluster avaliado para revisoes futuras.

---

## Checklist de Preparacao para Execucao (DoR)

- [x] Tickets/ocorrencias representativas selecionados para amostra de revisao.
- [x] Referencias de evidencia local (`docs/qa/`) disponiveis e vinculadas aos tickets.
- [x] Runbook `docs/operacao-mei-nfse.md` disponivel para cross-link.
- [x] Caminho do artefato principal reservado: `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`.
- [x] PRD, UX spec e arquitetura FR-TRO revisados antes da consolidacao.

---

## Definicao de Pronto para Review (PO Gate)

- [x] Todos os ACs **AC-TRO-GOV-01** a **AC-TRO-GOV-06** foram validados com evidencia documental.
- [x] Artefato principal de governanca foi criado/atualizado no caminho definido.
- [x] Decisao formal por ocorrencia/cluster foi registrada como `manter politica vigente` ou `abrir PRD dedicado`.
- [x] Tickets e evidencias locais estao vinculados no artefato sem lacunas de rastreabilidade.
- [x] Metricas da secao 12 do PRD foram explicitamente usadas na decisao.
- [x] `Dev Agent Record` e `File list` foram atualizados para handoff do executor para quality gate.

---

## File list do cluster auditado

- [x] `docs/prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md` *(ancoras adicionadas para trilho B, metricas, riscos e origem da story 1.2)*
- [x] `docs/specs/ux-spec-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md` *(ancoras adicionadas para fluxo C e handoff)*
- [x] `docs/technical/architecture-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md` *(ancoras adicionadas para escalonamento governado, saidas por cluster e riscos tecnicos)*
- [x] `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`
- [x] `docs/operacao-mei-nfse.md` *(cross-link adicionado para o artefato de governanca FR-TRO-07/08)*
- [x] `docs/stories/story-fr-tro-p1-produto-operacao-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in core-config.yaml.

### Manual Review Focus (fallback)

- Aderencia estrita aos gatilhos FR-TRO-08.
- Rastreabilidade obrigatoria ticket + evidencia.
- Coerencia entre decisao operacional e decisao de produto.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `docs/prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`
- `docs/specs/ux-spec-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`
- `docs/technical/architecture-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`
- `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`
- `docs/operacao-mei-nfse.md`
- `docs/stories/story-fr-tro-p1-produto-operacao-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`

### Debug Log References

- Ancoras estaveis adicionadas em PRD/UX spec/arquitetura para navegabilidade da story 1.2 e rastreabilidade precisa por secao.
- Artefato principal criado em `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`, com os 3 gatilhos FR-TRO-08 sem extensoes e com decisao formal por cluster.
- Cross-link de governanca adicionado ao runbook em `docs/operacao-mei-nfse.md`, secao `2i) TRO`.
- Entradas obrigatorias de decisao vinculadas no artefato (ticket, runbook e evidencias locais `docs/qa/`), incluindo compatibilidade legado `top-...` + atual `tro-...`.
- Mitigacao pos-QA aplicada no artefato de governanca: secao `Protocolo de manutencao continua` + tabela `Registro de manutencao` para reforcar atualizacao disciplinada por ocorrencia/cluster.

### Completion Notes

- Story concluida com foco documental de produto/operacao, sem alteracao funcional de aplicacao.
- Governanca FR-TRO-07/08 consolidada em fonte canonica unica (`docs/architecture/project-decisions/...`) para baixo overhead e sem duplicidade contraditoria.
- Decisao do cluster atual registrada como `manter politica vigente`, pois nenhum gatilho FR-TRO-08 foi marcado.
- Leitura das metricas do PRD secao 12 incorporada como entrada obrigatoria da decisao.
- Ajuste pos-QA concluido: risco residual de deriva reduzido com regra explicita de manutencao continua (evento de atualizacao, responsabilidades e checklist por update).
- Gates de codigo N/A nesta execucao (nenhuma alteracao de frontend/backend).

### Change Log

- 2026-04-13 — Story criada por @sm para governanca de escalonamento de iniciativa nova na tratativa FR-TRO.
- 2026-04-13 — Story refinada por @sm conforme criterios do @po: status de prontidao, matriz AC->Tasks->Evidencia, artefato de governanca com caminho concreto, DoR/PO Gate e template minimo obrigatorio.
- 2026-04-13 — Story alinhada por @sm aos artefatos de resolucao governada (PRD, UX spec e arquitetura) mantendo o historico de execucao FR-TRO.
- 2026-04-13 — Story refinada por @sm conforme reavaliacao do @po: ownership alinhado ao executor auditado, mapa de fontes canonicas com links por secao/ancora e correcao da referencia de metricas do PRD para a secao 12.
- 2026-04-13 — @dev implementou governanca FR-TRO-07/08: criou artefato canonico de gatilhos/escalonamento, adicionou cross-link no runbook e atualizou checklist/Dev Agent Record para handoff ao quality gate.
- 2026-04-13 — @dev corrigiu ponto residual do QA: adicionou protocolo explicito de manutencao continua no artefato de governanca e reforcou a obrigatoriedade de atualizacao no runbook.

---

## QA Results

- 2026-04-13 — Revisao @qa (Quinn)
- **Gate:** **PASS**
- **Resumo:** implementacao documental aderente aos ACs de governanca FR-TRO-GOV-01..06, com artefato canonico de escalonamento criado, cross-link no runbook e decisao formal por cluster registrada.
- **Achados:** sem findings de severidade HIGH/MEDIUM nesta revisao.
- **Evidencias verificadas:**
  - Artefato principal de governanca em `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md` com os 3 gatilhos FR-TRO-08, entradas obrigatorias, leitura de metricas PRD §12 e decisao formal (`manter politica vigente`).
  - Vinculo de rastreabilidade com ticket interno, runbook e evidencias locais `docs/qa/` (incluindo mapeamento legado `top-...` e atual `tro-...`).
  - Fonte canonica de baixo overhead reforcada no runbook em `docs/operacao-mei-nfse.md` (secao TRO com referencia ao artefato de governanca).
- **Risco residual (baixo):** a governanca depende de atualizacao disciplinada por ocorrencia/cluster futuro; se nao houver manutencao do artefato canonico, pode haver deriva operacional ao longo do tempo.
- 2026-04-13 — Revisao @qa (Quinn) — reteste independente da governanca FR-TRO-07/08
- **Gate:** **PASS**
- **Resumo:** reteste confirma aderencia aos ACs FR-TRO-GOV-01..06; o artefato canonico continua coerente com a story, o runbook referencia a fonte unica correta e a manutencao continua foi explicitada sem introduzir gatilhos ou thresholds fora do PRD.
- **Achados:** sem findings de severidade HIGH/MEDIUM nesta revisao.
- **Evidencias verificadas:**
  - `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md` com 3 gatilhos FR-TRO-08, entradas obrigatorias, decisao formal, follow-up e protocolo de manutencao continua.
  - `docs/operacao-mei-nfse.md` com cross-link canonico e regra operacional de atualizacao do artefato apos cada encerramento de ocorrencia/cluster TRO.
  - Story e Dev Agent Record consistentes com a implementacao documental entregue.
- **Validacoes executadas:** `npm run lint` (PASS com 68 warnings preexistentes no frontend), `npm run typecheck` (PASS), `npm test` (PASS).
- **Risco residual (baixo):** a qualidade da governanca segue dependente de atualizacao disciplinada do registro de manutencao a cada nova ocorrencia/cluster.
