# Story — FR-TRO (P1): Produto/Operacao — governanca dos gatilhos de escalonamento para iniciativa nova

**ID:** STORY-FR-TRO-P1-PRODUTO-OPERACAO-GOVERNANCA-GATILHOS-ESCALONAMENTO-PREFEITURA-LOGIN-REQUIRED-BLOCKED-2026-04-13  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** [`docs/stories/story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md`](./story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md), [`docs/prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md), [`docs/specs/ux-spec-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../specs/ux-spec-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md), [`docs/technical/architecture-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../technical/architecture-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md)  
**Fonte PRD:** [`docs/prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md) — **FR-TRO-05**, **FR-TRO-07**, **FR-TRO-08**, **NFR-TRO-04** (alinhado a metricas da secao 10 e riscos da secao 11)  
**UX:** secao 5 (FR mapeados), secao 6.4 (decisao e encaminhamento), secao 11 (criterios)  
**Arquitetura:** secao 8 (motor de decisao), secao 9 (observabilidade), secao 10 (rastreabilidade), secao 11 (criterios)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @analyst |
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

- O PRD define que a tratativa padrao atual e operacional, com decisao `esperado` vs `regressao`.
- O escalonamento para nova iniciativa nao e automatico: depende de gatilhos de recorrencia/impacto.
- A arquitetura reforca que a saida operacional deve registrar decisao e contexto suficiente para produto decidir sem ambiguidade.

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
- Leitura das metricas PRD secao 10:

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
- [x] Metricas da secao 10 do PRD foram explicitamente usadas na decisao.
- [x] `Dev Agent Record` e `File list` foram atualizados para handoff do executor para quality gate.

---

## File list (esperada / a confirmar na execucao)

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

- `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`
- `docs/operacao-mei-nfse.md`
- `docs/stories/story-fr-tro-p1-produto-operacao-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`

### Debug Log References

- Artefato principal criado em `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`, com os 3 gatilhos FR-TRO-08 sem extensoes e com decisao formal por cluster.
- Cross-link de governanca adicionado ao runbook em `docs/operacao-mei-nfse.md`, secao `2i) TRO`.
- Entradas obrigatorias de decisao vinculadas no artefato (ticket, runbook e evidencias locais `docs/qa/`), incluindo compatibilidade legado `top-...` + atual `tro-...`.
- Mitigacao pos-QA aplicada no artefato de governanca: secao `Protocolo de manutencao continua` + tabela `Registro de manutencao` para reforcar atualizacao disciplinada por ocorrencia/cluster.

### Completion Notes

- Story concluida com foco documental de produto/operacao, sem alteracao funcional de aplicacao.
- Governanca FR-TRO-07/08 consolidada em fonte canonica unica (`docs/architecture/project-decisions/...`) para baixo overhead e sem duplicidade contraditoria.
- Decisao do cluster atual registrada como `manter politica vigente`, pois nenhum gatilho FR-TRO-08 foi marcado.
- Leitura das metricas do PRD secao 10 incorporada como entrada obrigatoria da decisao.
- Ajuste pos-QA concluido: risco residual de deriva reduzido com regra explicita de manutencao continua (evento de atualizacao, responsabilidades e checklist por update).
- Gates de codigo N/A nesta execucao (nenhuma alteracao de frontend/backend).

### Change Log

- 2026-04-13 — Story criada por @sm para governanca de escalonamento de iniciativa nova na tratativa FR-TRO.
- 2026-04-13 — Story refinada por @sm conforme criterios do @po: status de prontidao, matriz AC->Tasks->Evidencia, artefato de governanca com caminho concreto, DoR/PO Gate e template minimo obrigatorio.
- 2026-04-13 — @dev implementou governanca FR-TRO-07/08: criou artefato canonico de gatilhos/escalonamento, adicionou cross-link no runbook e atualizou checklist/Dev Agent Record para handoff ao quality gate.
- 2026-04-13 — @dev corrigiu ponto residual do QA: adicionou protocolo explicito de manutencao continua no artefato de governanca e reforcou a obrigatoriedade de atualizacao no runbook.

---

## QA Results

- 2026-04-13 — Revisao @qa (Quinn)
- **Gate:** **PASS**
- **Resumo:** implementacao documental aderente aos ACs de governanca FR-TRO-GOV-01..06, com artefato canonico de escalonamento criado, cross-link no runbook e decisao formal por cluster registrada.
- **Achados:** sem findings de severidade HIGH/MEDIUM nesta revisao.
- **Evidencias verificadas:**
  - Artefato principal de governanca em `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md` com os 3 gatilhos FR-TRO-08, entradas obrigatorias, leitura de metricas PRD §10 e decisao formal (`manter politica vigente`).
  - Vinculo de rastreabilidade com ticket interno, runbook e evidencias locais `docs/qa/` (incluindo mapeamento legado `top-...` e atual `tro-...`).
  - Fonte canonica de baixo overhead reforcada no runbook em `docs/operacao-mei-nfse.md` (secao TRO com referencia ao artefato de governanca).
- **Risco residual (baixo):** a governanca depende de atualizacao disciplinada por ocorrencia/cluster futuro; se nao houver manutencao do artefato canonico, pode haver deriva operacional ao longo do tempo.

