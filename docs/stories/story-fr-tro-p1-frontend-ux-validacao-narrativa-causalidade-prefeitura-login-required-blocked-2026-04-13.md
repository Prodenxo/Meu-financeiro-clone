# Story — FR-TRO (P1): Frontend/UX — validacao da narrativa e causalidade (`prefeitura_login_required_blocked`)

**ID:** STORY-FR-TRO-P1-FRONTEND-UX-VALIDACAO-NARRATIVA-CAUSALIDADE-PREFEITURA-LOGIN-REQUIRED-BLOCKED-2026-04-13  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** [`docs/stories/story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md`](./story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md), [`docs/prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md), [`docs/specs/ux-spec-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../specs/ux-spec-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md), [`docs/technical/architecture-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../technical/architecture-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md), [`docs/stories/story-fr-top-p1-frontend-ux-validacao-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md`](./story-fr-top-p1-frontend-ux-validacao-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md)  
**Fonte PRD:** [`docs/prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md) — **FR-TRO-01**, **FR-TRO-02**, **FR-TRO-03**, **FR-TRO-04**, **FR-TRO-05**, **FR-TRO-06**, **NFR-TRO-01**, **NFR-TRO-03**, **DP-TRO-01**, **DP-TRO-02**, **DP-TRO-03**  
**UX:** secao 3 (principios), secao 6 (fluxo), secao 7 (copy), secao 8 (matriz de estados), secao 9 (privacidade), secao 10 (pontos frontend), secao 11 (criterios)  
**Arquitetura:** secao 4 (fluxo logico), secao 6 (componentes), secao 7 (contrato de evidencia), secao 8 (motor de decisao), secao 9 (observabilidade)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisao** | @ux-design-expert / @architect |
| **quality_gate_tools** | validacao manual UI+Network, testes direcionados de frontend e gates de codigo apenas se houver alteracao funcional |

---

## User story

**Como** QA e desenvolvedor da Guia MEI,  
**quero** validar que a UI e a camada de erro frontend narram corretamente `prefeitura_login_required_blocked`, sem pedir credenciais municipais e mantendo causalidade com o `GET` posterior,  
**para** impedir diagnostico tecnico indevido e manter aderencia ao fluxo nacional vigente.

---

## Contexto

- O PRD estabelece que este caso e excecao operacional esperada no fluxo atual, nao bug de endpoint.
- A UX spec define regras objetivas de copy, estados e evidencias.
- A arquitetura reforca invariantes: sem mudanca funcional para encerrar tratativa, salvo regressao comprovada.

---

## Criterios de aceite

- [x] **AC-TRO-FE-01:** A narrativa em UI para `prefeitura_login_required_blocked` segue regra objetiva de copy:
  `a)` **deve conter** referencia a limite do fluxo nacional (`NFS-e Nacional` ou `nao suportado no fluxo nacional`),
  `b)` **nao deve conter** termos de diagnostico indevido (`endpoint errado`, `rota errada`, `corrigir endpoint`) (**FR-TRO-02**, **DP-TRO-03**).
- [x] **AC-TRO-FE-02:** A interface nao instrui utilizador a informar `login`/`senha` municipal no fluxo atual (**DP-TRO-01**, **DP-TRO-02**).
- [x] **AC-TRO-FE-03:** Captura Network do `POST /setup/emissao-fiscal/empresa` contempla os campos FR-TRO-03 com redaction (**FR-TRO-03**, **NFR-TRO-01**).
- [x] **AC-TRO-FE-04:** `GET` negativo posterior e documentado como consequencia do `POST` falho, nao como causa raiz (**FR-TRO-04**).
- [x] **AC-TRO-FE-05:** Conclusao operacional da execucao manual fica binaria (`esperado` vs `regressao`) no artefato associado (**FR-TRO-06**).
- [x] **AC-TRO-FE-06:** Entrega respeita NFR-TRO-03: sem alteracao de comportamento de codigo para encerrar tratativa; se regressao for confirmada, alteracao minima e justificada.
- [x] **AC-TRO-FE-07:** Se houver alteracao de codigo por regressao, executar e registrar `npm run lint`, `npm run typecheck` e `npm test`.
- [x] **AC-TRO-FE-08:** Cada execucao da story referencia **ticket interno obrigatorio** (ID ou link) e registra esse identificador no artefato de evidencia em `docs/qa/` (**FR-TRO-05**).
- [x] **AC-TRO-FE-09:** O artefato de evidencia frontend/UX e versionado por ocorrencia com padrao de nome `docs/qa/top-prefeitura-login-required-blocked-YYYY-MM-DD-<ticket-ou-incidente>.md`, evitando sobrescrever historico anterior.

---

## Matriz de rastreabilidade (AC -> Tasks -> Evidencia)

| AC | Task principal | Evidencia esperada |
|---|---|---|
| **AC-TRO-FE-01** | 1 | Captura de copy/narrativa em UI contendo limite nacional e sem termos proibidos |
| **AC-TRO-FE-02** | 1 | Evidencia de interface sem solicitacao de `login`/`senha` municipal |
| **AC-TRO-FE-03** | 2 | Bloco `POST` com os 5 campos FR-TRO-03 e redaction |
| **AC-TRO-FE-04** | 3 | Registro causal `POST` falho -> `GET` consequente (quando aplicavel) |
| **AC-TRO-FE-05** | 4 | Decisao final binaria no artefato (`esperado` ou `regressao`) |
| **AC-TRO-FE-06** | 6 | Declaracao de ausencia de patch funcional ou justificativa tecnica de regressao |
| **AC-TRO-FE-07** | 6 | Registro dos resultados de `lint`, `typecheck` e `test` quando houver patch |
| **AC-TRO-FE-08** | 5 | Ticket interno (ID/link) no artefato e no resumo da execucao |
| **AC-TRO-FE-09** | 5 | Novo arquivo versionado por ocorrencia em `docs/qa/`, sem sobrescrita de historico |

---

## Dev Notes

### File Locations

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/lib/fiscalUserError.ts`
- `frontend/src/utils/apiClientError.ts`
- `docs/qa/top-prefeitura-login-required-blocked-2026-04-10.md` (referencia historica)
- `docs/qa/top-prefeitura-login-required-blocked-YYYY-MM-DD-<ticket-ou-incidente>.md` (artefato da execucao desta story)
- `docs/stories/story-fr-tro-p1-frontend-ux-validacao-narrativa-causalidade-prefeitura-login-required-blocked-2026-04-13.md`

### Technical Constraints

- Nao introduzir novo fluxo municipal de credenciais.
- Preservar contrato atual de erro e narrativa nacional-first.
- Alterar codigo somente com evidencia objetiva de regressao tecnica.
- Nao sobrescrever artefato historico; criar novo arquivo por ocorrencia com identificador novo de ticket/incidente.

### Testing

- Validacao manual em ambiente controlado: UI + DevTools Network.
- Revisao de copy com checklist objetivo:
  `a)` contem referencia a limite nacional,
  `b)` nao contem termos proibidos de diagnostico indevido,
  `c)` nao solicita credenciais municipais.
- Revisao de causalidade `POST -> GET` com conclusao final binaria.
- Confirmar registro do ticket interno no artefato `docs/qa/` versionado para a execucao.
- Preencher template minimo do artefato `docs/qa/` com: `ticketInterno`, `ambiente`, `responsavel`, bloco `POST` (5 campos FR-TRO-03 redigidos), bloco `GET` posterior (se houver) e `decisaoFinal`.
- Em caso de regressao com patch de codigo, executar suite completa (`lint`, `typecheck`, `test`).

### Template minimo do artefato `docs/qa/` (obrigatorio)

```md
# Evidencia TRO — prefeitura_login_required_blocked

- Data da execucao:
- Responsavel:
- Story ID:
- Ticket interno (ID/link):
- Ambiente (local/homologacao/producao controlada):

## POST /api/mei-notas/setup/emissao-fiscal/empresa (FR-TRO-03)
- message:
- errors.plugnotasCode:
- errors.plugnotasRequest.method:
- errors.plugnotasRequest.path:
- errors.httpStatus:

## GET causal (quando aplicavel)
- Endpoint consultado:
- Resultado:
- Interpretacao causal (consequencia do POST falho):

## Decisao operacional final
- Classificacao:
- Decisao final: esperado pela politica vigente | regressao tecnica

## Checklist de redaction
- [ ] Sem token/certificado/credenciais em claro
- [ ] Sem payload sensivel bruto
```

---

## Tasks / Subtasks

1. [x] Executar roteiro manual na Guia MEI para o caso `prefeitura_login_required_blocked` (AC: **AC-TRO-FE-01**, **AC-TRO-FE-02**).
2. [x] Capturar e registrar resposta de Network com os 5 campos FR-TRO-03 redigidos (AC: **AC-TRO-FE-03**).
3. [x] Validar e registrar causalidade `POST` falho -> `GET` consequente (AC: **AC-TRO-FE-04**).
4. [x] Consolidar decisao binaria da execucao no artefato de evidencia (AC: **AC-TRO-FE-05**).
5. [x] Criar novo artefato de evidencia versionado por ocorrencia em `docs/qa/` com ID/link do ticket interno, sem atualizar arquivo historico anterior (AC: **AC-TRO-FE-08**, **AC-TRO-FE-09**).
6. [x] Corrigir frontend apenas se regressao comprovada e reexecutar gates (AC: **AC-TRO-FE-06**, **AC-TRO-FE-07**).

---

## Checklist de Preparacao para Execucao (DoR)

- [x] Ticket interno da ocorrencia criado e disponivel para referencia em `docs/qa/`.
- [x] Ambiente de validacao definido (`local`, `homologacao` ou `producao controlada`).
- [x] Acesso a UI da Guia MEI e DevTools Network confirmado.
- [x] Nome do artefato de evidencia reservado com padrao `docs/qa/top-prefeitura-login-required-blocked-YYYY-MM-DD-<ticket-ou-incidente>.md`.
- [x] Dependencias de contexto lidas: PRD, UX spec, arquitetura e story de protocolo operacional.

---

## Definicao de Pronto para Review (PO Gate)

- [x] Todos os ACs **AC-TRO-FE-01** a **AC-TRO-FE-09** foram validados com evidencia.
- [x] O artefato `docs/qa/top-prefeitura-login-required-blocked-YYYY-MM-DD-<ticket-ou-incidente>.md` foi criado para a ocorrencia atual (sem sobrescrever historico).
- [x] O ticket interno da ocorrencia foi registrado no artefato e no resumo da execucao.
- [x] A decisao final binaria (`esperado` vs `regressao`) foi documentada com causalidade `POST -> GET` quando aplicavel.
- [x] Se houve patch de codigo, os resultados de `npm run lint`, `npm run typecheck` e `npm test` foram anexados no Dev Agent Record.
- [x] `Dev Agent Record` e `File list` foram atualizados para handoff de `@dev` para `@qa`.

---

## File list (esperada / a confirmar na execucao)

- [x] `docs/qa/top-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`
- [x] `docs/stories/story-fr-tro-p1-frontend-ux-validacao-narrativa-causalidade-prefeitura-login-required-blocked-2026-04-13.md`
- [x] `frontend/src/pages/GuidesMei.tsx` *(nao aplicavel nesta execucao: sem regressao confirmada e sem patch)*
- [x] `frontend/src/lib/fiscalUserError.ts` *(nao aplicavel nesta execucao: sem regressao confirmada e sem patch)*
- [x] `frontend/src/utils/apiClientError.ts` *(nao aplicavel nesta execucao: sem regressao confirmada e sem patch)*

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in core-config.yaml.

### Manual Review Focus (fallback)

- Coerencia de copy para `prefeitura_login_required_blocked`.
- Propagacao de `plugnotasCode` e `httpStatus`.
- Causalidade correta `POST`/`GET` no diagnostico.
- Ausencia de solicitacao de credenciais municipais.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `docs/stories/story-fr-tro-p1-frontend-ux-validacao-narrativa-causalidade-prefeitura-login-required-blocked-2026-04-13.md`
- `docs/qa/top-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`

### Debug Log References

- Evidencia de referencia da ocorrencia operacional/manual registrada no artefato `docs/qa/top-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md` com ticket interno `INC-TRO-2026-04-13-PLOGIN-BLOCKED`.
- Mitigacao de rastreabilidade visual adicionada no mesmo artefato: secao `Anexo tecnico da aba Network (transcricao redigida)` com preview sanitizado da resposta `POST` (HTTP 400 + `prefeitura_login_required_blocked`).
- Validacao automatizada de narrativa e causalidade executada em frontend:
  - `npm run test -- src/lib/fiscalUserError.test.ts src/pages/GuidesMei.certificate-connectivity.test.tsx`
  - Resultado: `2` suites aprovadas, `29` testes aprovados, `0` falhas.
- Referencias de cobertura funcional usadas nesta validacao:
  - `frontend/src/lib/fiscalUserError.test.ts` (copy para `prefeitura_login_required_blocked`, sem "rota errada", sem pedido de credenciais municipais).
  - `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx` (causalidade `POST` falho -> `GET` consequente, sem exposicao de endpoints como narrativa de causa raiz).

### Completion Notes

- Story concluida como validacao frontend/UX da tratativa FR-TRO, sem necessidade de alterar comportamento de codigo.
- Novo artefato por ocorrencia criado em `docs/qa/` com padrao de versionamento e rastreabilidade por ticket interno (AC-TRO-FE-08/09).
- Decisao operacional final registrada como `esperado pela politica vigente`, com classificacao `nao suportado no fluxo nacional` e causalidade `POST` -> `GET`.
- NFR-TRO-03 respeitado: nenhum patch funcional aplicado; por isso os gates completos (`lint`/`typecheck`/`test`) nao foram obrigatorios nesta execucao.
- Como validacao complementar objetiva, testes direcionados do frontend foram executados e aprovados (29/29).
- Ajuste pos-QA aplicado: artefato `docs/qa/` agora inclui anexo tecnico da aba Network em formato textual redigido, reduzindo ambiguidade de evidencia manual para reteste.

### Change Log

- 2026-04-13 — Story criada por @sm para validacao frontend/UX da tratativa operacional FR-TRO.
- 2026-04-13 — Story refinada por @sm conforme feedback @po: criterios objetivos de copy, rastreabilidade obrigatoria por ticket e versionamento de evidencia por ocorrencia.
- 2026-04-13 — Story ajustada por @sm para reforcar rastreabilidade FR-TRO-05 no cabecalho, template minimo de evidencia e regra explicita de nao sobrescrever historico em `docs/qa/`.
- 2026-04-13 — Story refinada por @sm conforme novo criterio do @po: status de prontidao atualizado para review, template explicito do artefato `docs/qa/` e checklist DoD de handoff.
- 2026-04-13 — Story refinada por @sm com matriz AC->Tasks->Evidencia, checklist DoR de preparacao e formato padrao de referencia da fonte PRD.
- 2026-04-13 — @dev executou validacao TRO frontend/UX, criou novo artefato versionado em `docs/qa/`, marcou ACs/tasks/DoR/DoD e registrou evidencias (manual + testes direcionados) no Dev Agent Record.
- 2026-04-13 — @dev aplicou ajuste pos-QA para mitigar risco residual de evidencias manuais: adicionou transcricao redigida da aba Network no artefato TRO e atualizou o Dev Agent Record para reteste.

---

## QA Results

- 2026-04-13 — Revisao @qa (Quinn)
- **Gate:** **PASS**
- **Resumo:** implementacao aderente aos ACs da story para tratativa FR-TRO, sem alteracao funcional de codigo e com evidencia versionada por ocorrencia em `docs/qa/`.
- **Achados:** sem findings de severidade HIGH/MEDIUM nesta revisao.
- **Evidencias verificadas:**
  - Artefato da ocorrencia com campos minimos FR-TRO-03, causalidade `POST -> GET`, decisao binaria e redaction em `docs/qa/top-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`.
  - Cobertura de narrativa/causalidade em `frontend/src/lib/fiscalUserError.test.ts` e `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`.
  - Reexecucao QA dos testes direcionados: `npm run test -- src/lib/fiscalUserError.test.ts src/pages/GuidesMei.certificate-connectivity.test.tsx` -> 2 suites pass, 29 testes pass, 0 falhas.
- **Risco residual (baixo):** evidencia manual UI/Network permanece textual (registro operacional interno) sem anexo de screenshot/export da aba Network; rastreabilidade minima exigida foi atendida.
