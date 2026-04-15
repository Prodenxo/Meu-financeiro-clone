# Governanca TRO — Gatilhos de escalonamento (`prefeitura_login_required_blocked`)

- Data de atualizacao: 2026-04-13
- Responsavel: @dev (Dex)
- Story ID: STORY-FR-TRO-P1-PRODUTO-OPERACAO-GOVERNANCA-GATILHOS-ESCALONAMENTO-PREFEITURA-LOGIN-REQUIRED-BLOCKED-2026-04-13
- Fonte PRD: `docs/prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md` (FR-TRO-05, FR-TRO-07, FR-TRO-08, NFR-TRO-04; metricas na secao 12)

<a id="tro-gov-gatilhos"></a>

## Gatilhos FR-TRO-08 (sem extensoes)
- [ ] Volume recorrente com impacto operacional
- [ ] Demanda comercial explicita
- [ ] Decisao estrategica de ampliar cobertura municipal

Regra de governanca: somente estes 3 gatilhos podem abrir escalonamento para iniciativa nova no contexto TRO.

## Entradas obrigatorias para decisao
- Tickets internos relacionados:
  - `INC-TRO-2026-04-13-PLOGIN-BLOCKED`
- Referencias de evidencia local (`docs/qa/`):
  - `docs/qa/tro-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`
  - (legado) `docs/qa/top-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`
- Referencia de runbook:
  - `docs/operacao-mei-nfse.md#tro-protocolo-operacional-prefeitura-login-required-blocked`
- Leitura das metricas PRD secao 12:
  - Diagnostico consistente
  - Qualidade de evidencia
  - Tempo de triagem
  - Governanca de escalonamento

<a id="tro-gov-metricas"></a>

## Leitura operacional das metricas (PRD secao 12)
- Diagnostico consistente: sem reclassificacao para "erro de endpoint" no cluster atual; classificacao mantida como `nao suportado no fluxo nacional`.
- Qualidade de evidencia: ocorrencia com ticket interno e evidencias redigidas FR-TRO-03/causalidade documentadas.
- Tempo de triagem: fluxo de decisao executado no ciclo operacional da ocorrencia sem bloqueio tecnico.
- Governanca de escalonamento: nenhum dos gatilhos FR-TRO-08 foi ativado no cluster atual.

<a id="tro-gov-decisao"></a>

## Decisao de produto (por ocorrencia/cluster)
- Resultado: manter politica vigente
- Justificativa: cluster atual sem ativacao de gatilho FR-TRO-08; tratativa operacional e decisao binaria da ocorrencia estao completas.
- Responsavel pela aprovacao: produto/operacao (quality gate da story)

## Rastreabilidade e follow-up
- Link para PRD dedicado (quando abrir): N/A no cluster atual (sem gatilho FR-TRO-08 ativo)
- Proxima revisao: na proxima recorrencia relevante registrada em ticket interno TRO
- Regra de saida: se qualquer gatilho FR-TRO-08 for confirmado, abrir PRD dedicado e atualizar este artefato com link cruzado.

<a id="tro-gov-manutencao"></a>

## Protocolo de manutencao continua (mitigacao do risco residual QA)

Objetivo: evitar deriva operacional por falta de atualizacao disciplinada deste artefato canonico.

- Evento obrigatorio de atualizacao:
  - encerramento de cada ocorrencia/cluster TRO com ticket interno;
  - mudanca de decisao de produto (de `manter politica vigente` para `abrir PRD dedicado`, ou vice-versa).
- Responsabilidades minimas:
  - operacao/qa: consolidar ticket + evidencias redigidas + cadeia causal;
  - produto: registrar decisao formal e justificativa com base nos gatilhos FR-TRO-08.
- Checklist minimo por atualizacao:
  - [ ] reavaliar os 3 gatilhos FR-TRO-08 (sem extensoes)
  - [ ] atualizar lista de tickets/evidencias de entrada
  - [ ] registrar decisao formal do cluster e aprovador
  - [ ] atualizar campo `Proxima revisao` no bloco de follow-up

### Registro de manutencao

| Data | Ticket/cluster | Acao de manutencao | Responsavel | Resultado |
|---|---|---|---|---|
| 2026-04-13 | `INC-TRO-2026-04-13-PLOGIN-BLOCKED` | Criacao do artefato + avaliacao inicial dos gatilhos + decisao formal | @dev (Dex) | `manter politica vigente` |
