# Story — FR-TRO (P1): Operacao/QA — protocolo canonico de triagem e evidencia (`prefeitura_login_required_blocked`)

**ID:** STORY-FR-TRO-P1-OPERACAO-QA-PROTOCOLO-TRIAGEM-EVIDENCIA-PREFEITURA-LOGIN-REQUIRED-BLOCKED-2026-04-13  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** [`docs/prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md), [`docs/specs/ux-spec-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../specs/ux-spec-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md), [`docs/technical/architecture-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../technical/architecture-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md), [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md), [`docs/stories/story-fr-top-p1-operacao-qa-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md`](./story-fr-top-p1-operacao-qa-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md)  
**Fonte PRD:** [`docs/prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md) — **FR-TRO-01**, **FR-TRO-02**, **FR-TRO-03**, **FR-TRO-04**, **FR-TRO-05**, **FR-TRO-06**, **NFR-TRO-01**, **NFR-TRO-02**, **NFR-TRO-04**, **DP-TRO-01**, **DP-TRO-02**, **DP-TRO-03**  
**UX:** secao 5 (traducao FR), secao 6 (fluxo), secao 8 (estados), secao 9 (evidencia/privacidade), secao 11 (criterios)  
**Arquitetura:** secao 3 (invariantes), secao 6 (componentes), secao 7 (contrato de evidencia), secao 8 (motor de decisao), secao 10 (rastreabilidade), secao 11 (criterios)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisao** | @architect |
| **quality_gate_tools** | validacao documental, revisao de runbook/evidencias e gates de codigo apenas se houver regressao com alteracao de aplicacao |

---

## User story

**Como** equipa de operacao e QA,  
**quero** um protocolo canonico unico de triagem para o caso `prefeitura_login_required_blocked`, com evidencia minima obrigatoria e decisao binaria padronizada,  
**para** evitar reclassificacao indevida como erro de endpoint e reduzir retrabalho entre suporte, QA, produto e engenharia.

---

## Contexto

- O PRD de 2026-04-13 oficializa esta tratativa como processo operacional, nao como correcao tecnica de rota.
- A arquitetura define que a resposta com `plugnotasCode = prefeitura_login_required_blocked` deve conduzir decisao operacional padrao no fluxo nacional vigente.
- O roteiro TOP de 2026-04-10 ja cobre execucao operacional; esta story consolida a governanca FR-TRO (classificacao, rastreabilidade e encerramento binario).

---

## Criterios de aceite

- [x] **AC-TRO-OP-01:** Casos com `plugnotasCode = prefeitura_login_required_blocked` sao classificados como `nao suportado no fluxo nacional` (**FR-TRO-01**, **DP-TRO-02**).
- [x] **AC-TRO-OP-02:** O protocolo operacional proibe diagnostico de "erro de endpoint" para esse codigo quando o contrato de erro estiver presente (**FR-TRO-02**, **DP-TRO-03**).
- [x] **AC-TRO-OP-03:** Evidencia minima obrigatoria registrada com os 5 campos de FR-TRO-03: `message`, `errors.plugnotasCode`, `errors.plugnotasRequest.method`, `errors.plugnotasRequest.path`, `errors.httpStatus`.
- [x] **AC-TRO-OP-04:** Causalidade e preservada: `GET` negativo posterior e documentado como consequencia do `POST` falho (**FR-TRO-04**).
- [x] **AC-TRO-OP-05:** Cada ocorrencia possui vinculo com ticket interno e referencia a artefato local de evidencia versionado por ocorrencia em `docs/qa/`, sem sobrescrever historico anterior; aceitar nomenclatura legado `top-...` e priorizar novo padrao `tro-...` para ocorrencias desta tratativa (**FR-TRO-05**, **NFR-TRO-04**).
- [x] **AC-TRO-OP-06:** Encerramento do caso sempre com decisao binaria explicita: `esperado pela politica vigente` ou `regressao tecnica a corrigir` (**FR-TRO-06**).
- [x] **AC-TRO-OP-07:** Evidencias seguem redaction obrigatoria, sem segredo, credenciais, certificado ou payload sensivel (**NFR-TRO-01**).
- [x] **AC-TRO-OP-08:** Processo e reproduzivel com ambiente identificado (local/homologacao/producao controlada) e sem documentacao paralela divergente (**NFR-TRO-02**, **NFR-TRO-04**).

---

## Matriz de rastreabilidade (AC -> Tasks -> Evidencia)

| AC | Task principal | Evidencia esperada |
|---|---|---|
| **AC-TRO-OP-01** | 1 | Classificacao explicita `nao suportado no fluxo nacional` no runbook/artefato |
| **AC-TRO-OP-02** | 1 | Regra operacional proibindo diagnostico de "erro de endpoint" para o codigo |
| **AC-TRO-OP-03** | 2 | Bloco de evidencia com os 5 campos FR-TRO-03 |
| **AC-TRO-OP-04** | 3 | Registro causal `POST` falho -> `GET` consequente (quando aplicavel) |
| **AC-TRO-OP-05** | 4 | Ticket interno (ID/link) + artefato `docs/qa/` novo por ocorrencia |
| **AC-TRO-OP-06** | 5 | Decisao final binaria registrada (`esperado` ou `regressao`) |
| **AC-TRO-OP-07** | 6 | Checklist de redaction preenchido sem dados sensiveis |
| **AC-TRO-OP-08** | 6 | Ambiente identificado e protocolo reproduzivel no artefato |

---

## Dev Notes

### File Locations

- `docs/operacao-mei-nfse.md`
- `docs/qa/top-prefeitura-login-required-blocked-2026-04-10.md` (referencia historica)
- `docs/qa/tro-prefeitura-login-required-blocked-YYYY-MM-DD-<ticket-ou-incidente>.md` (artefato da ocorrencia atual desta story)
- `docs/stories/story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md`

### Technical Constraints

- Nao alterar politica funcional do endpoint para concluir esta story.
- Nao introduzir solicitacao de credenciais municipais.
- Reusar runbook canonico e evitar duplicacao contraditoria.
- Nao sobrescrever artefato historico em `docs/qa/`; criar novo arquivo por ocorrencia com identificador de ticket/incidente.
- Para compatibilidade com runbook historico, `top-...` permanece valido como legado; para novas ocorrencias desta tratativa, priorizar `tro-prefeitura-login-required-blocked-YYYY-MM-DD-<ticket-ou-incidente>.md`.

### Testing

- Validacao operacional manual por checklist do protocolo.
- Confirmar captura dos campos FR-TRO-03, causalidade `POST -> GET`, redaction e decisao binaria.
- Confirmar registro do ticket interno no artefato versionado em `docs/qa/`.
- Se houver regressao tecnica com alteracao de codigo: executar `npm run lint`, `npm run typecheck` e `npm test`.

### Template minimo do artefato `docs/qa/` (obrigatorio)

```md
# Evidencia TRO Operacao/QA — prefeitura_login_required_blocked

- Data da execucao:
- Responsavel:
- Story ID:
- Ticket interno (ID/link):
- Ambiente (local/homologacao/producao controlada):

## Evidencia minima FR-TRO-03
- message:
- errors.plugnotasCode:
- errors.plugnotasRequest.method:
- errors.plugnotasRequest.path:
- errors.httpStatus:

## Causalidade operacional (quando aplicavel)
- Registro do POST falho:
- Registro do GET posterior:
- Interpretacao: GET negativo como consequencia do POST falho

## Decisao final
- Classificacao: nao suportado no fluxo nacional | outro
- Decisao: esperado pela politica vigente | regressao tecnica a corrigir

## Checklist de redaction
- [ ] Sem token/certificado/credenciais em claro
- [ ] Sem payload sensivel bruto
```

---

## Tasks / Subtasks

1. [x] Consolidar no runbook o protocolo FR-TRO com classificacao padrao e proibicao de "endpoint errado" (AC: **AC-TRO-OP-01**, **AC-TRO-OP-02**).
2. [x] Padronizar checklist de evidencia minima FR-TRO-03 no artefato operacional (AC: **AC-TRO-OP-03**).
3. [x] Incluir regra causal explicita `POST` falho -> `GET` consequente (AC: **AC-TRO-OP-04**).
4. [x] Garantir rastreabilidade por ticket interno + criacao de novo artefato por ocorrencia em `docs/qa/` (AC: **AC-TRO-OP-05**).
5. [x] Definir formato de encerramento binario no artefato operacional (AC: **AC-TRO-OP-06**).
6. [x] Revisar redaction e reproducibilidade do processo (AC: **AC-TRO-OP-07**, **AC-TRO-OP-08**).

---

## Checklist de Preparacao para Execucao (DoR)

- [x] Ticket interno da ocorrencia criado e disponivel para referencia em `docs/qa/`.
- [x] Ambiente de validacao definido (`local`, `homologacao` ou `producao controlada`).
- [x] Roteiro operacional (`docs/operacao-mei-nfse.md`) disponivel para consulta durante a triagem.
- [x] Nome do artefato reservado com padrao `docs/qa/tro-prefeitura-login-required-blocked-YYYY-MM-DD-<ticket-ou-incidente>.md`.
- [x] Quando houver referencia a artefato legado (`top-...`), registrar no resumo da execucao o mapeamento legado -> ocorrencia atual.
- [x] PRD, UX spec e arquitetura da tratativa FR-TRO lidos antes da execucao.

---

## Definicao de Pronto para Review (PO Gate)

- [x] Todos os ACs **AC-TRO-OP-01** a **AC-TRO-OP-08** foram validados com evidencia.
- [x] O artefato `docs/qa/tro-prefeitura-login-required-blocked-YYYY-MM-DD-<ticket-ou-incidente>.md` foi criado para a ocorrencia atual.
- [x] Se houver referencia a artefato legado `top-...`, o resumo da execucao explicita a relacao com o novo registro da ocorrencia atual.
- [x] O ticket interno da ocorrencia foi registrado no artefato e no resumo da execucao.
- [x] A decisao final binaria foi documentada com causalidade `POST -> GET` quando aplicavel.
- [x] Se houve alteracao de codigo por regressao, os resultados de `npm run lint`, `npm run typecheck` e `npm test` foram anexados no Dev Agent Record.
- [x] `Dev Agent Record` e `File list` foram atualizados para handoff de `@dev` para `@qa`.

---

## File list (esperada / a confirmar na execucao)

- [x] `docs/operacao-mei-nfse.md`
- [x] `docs/qa/tro-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`
- [x] `docs/stories/story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in core-config.yaml.

### Manual Review Focus (fallback)

- Coerencia entre classificacao FR-TRO e runbook.
- Preservacao de causalidade `POST -> GET`.
- Redaction e rastreabilidade ticket + artefato local.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `docs/operacao-mei-nfse.md`
- `docs/qa/tro-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`
- `docs/stories/story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md`

### Debug Log References

- Protocolo FR-TRO consolidado no runbook em `docs/operacao-mei-nfse.md` (secao `2i) TRO — protocolo canonico de triagem e evidencia operacional`), incluindo classificacao canonica e regra anti-"endpoint errado".
- Artefato canonicamente versionado por ocorrencia criado em `docs/qa/tro-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`.
- Mitigacao do risco residual QA aplicada no artefato TRO: secao `Anexo tecnico de evidencias (response/log redigido)` com transcricao sanitizada do response e correlacao backend.
- Mapeamento legado -> atual registrado no artefato TRO:
  - legado: `docs/qa/top-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`
  - atual: `docs/qa/tro-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`
- Base de evidencias reutilizada da ocorrencia manual UI/Network (POST 400 `prefeitura_login_required_blocked` + GET consequente `empresa_nao_cadastrada`) com redaction mantida.

### Completion Notes

- Story concluida com foco documental/operacional, sem alteracao funcional de aplicacao.
- AC-TRO-OP-01..08 atendidos via consolidacao do protocolo FR-TRO no runbook + novo artefato `tro-...` versionado.
- Regra de compatibilidade de nomenclatura atendida: historico `top-...` preservado e mapeado explicitamente para o novo registro `tro-...`.
- Ajuste pos-QA executado: evidencia operacional agora inclui anexo tecnico redigido de response/log para reduzir ambiguidade em auditoria.
- NFR-TRO-03 mantido: sem patch de codigo, logo gates `lint`, `typecheck` e `test` nao foram necessarios nesta execucao.

### Change Log

- 2026-04-13 — Story criada por @sm a partir do PRD/UX spec/arquitetura da tratativa operacional FR-TRO.
- 2026-04-13 — Story refinada por @sm conforme criterios do @po: status de prontidao, matriz AC->Tasks->Evidencia, governanca de artefato por ocorrencia em `docs/qa/`, checklist DoR e PO Gate para handoff.
- 2026-04-13 — Story refinada por @sm para compatibilidade de nomenclatura de evidencia (`top-...` legado vs `tro-...` atual) sem perda de rastreabilidade.
- 2026-04-13 — @dev implementou o protocolo FR-TRO no runbook, criou artefato `tro-...` da ocorrencia com mapeamento de legado `top-...`, e atualizou checklist/Dev Agent Record para handoff ao QA.
- 2026-04-13 — @dev corrigiu ponto residual do QA no artefato TRO: anexou transcricao redigida de response/log (Network + correlacao backend) e atualizou o Dev Agent Record para reteste.

---

## QA Results

- 2026-04-13 — Revisao @qa (Quinn)
- **Gate:** **PASS**
- **Resumo:** implementacao aderente aos ACs da story FR-TRO-OP; protocolo operacional consolidado no runbook e evidencia da ocorrencia registrada em artefato `tro-...` versionado, com rastreabilidade de legado.
- **Achados:** sem findings de severidade HIGH/MEDIUM nesta revisao.
- **Evidencias verificadas:**
  - Secao `2i) TRO — protocolo canonico de triagem e evidencia operacional` em `docs/operacao-mei-nfse.md`, com regras de classificacao, anti-"endpoint errado", causalidade `POST -> GET`, decisao binaria e padrao de nomeacao `tro-...`.
  - Artefato `docs/qa/tro-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md` contendo os 5 campos FR-TRO-03, causalidade operacional, decisao final e checklist de redaction.
  - Mapeamento legado `top-...` -> atual `tro-...` presente no artefato, conforme regra de compatibilidade da story.
- **Risco residual (baixo):** a evidencia operacional permanece textual/redigida (sem anexo bruto de response/log), o que e aceitavel para NFR-TRO-01 mas pode exigir complemento visual se a auditoria interna solicitar.

