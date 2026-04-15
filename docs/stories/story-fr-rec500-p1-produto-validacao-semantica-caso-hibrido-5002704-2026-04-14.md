# Story — FR-REC500 (P1): Produto — validacao da semantica do caso hibrido `5002704`

**ID:** STORY-FR-REC500-P1-PRODUTO-VALIDACAO-SEMANTICA-CASO-HIBRIDO-5002704-2026-04-14  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** [`docs/stories/story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md`](./story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md), [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md)  
**Handoff obrigatorio para (conforme decisao):** [`story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md`](./story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md) *(alinhamento matriz/runbook)*; [`story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) *(Epic 2, apenas se `correcao controlada`)* — **paridade:** a story de evidencia ja aponta para esta em `Handoff obrigatorio para`.  
**Fonte PRD:** [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) — **FR-REC500-03**, **FR-REC500-09**, **DP-REC500-01**, **DP-REC500-02**, **DP-REC500-03**, **DP-REC500-04**, **NFR-REC500-02**, **CR-REC500-03**, **CR-REC500-04**  
**UX:** secao 3 (principios de UX), secao 7.3 (REC500-UX-L2), secao 7.4 (REC500-UX-L3), secao 7.5 (REC500-UX-L4), secao 12 (QA, operacao e runbook), secao 13 (fase 2 condicional), secao 14 (criterios)  
**Arquitetura:** secao 3 (decisao arquitetural), secao 6.1 (Epic 1), secao 6.2 (Epic 2 condicional), secao 7 (ponto de extensao recomendado), secao 8 (maquina de decisao), secao 13 (rollout), secao 14 (riscos tecnicos)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @po |
| **quality_gate** | @architect |
| **revisao** | @dev |
| **suporte execucao (opcional)** | `@dev` aplica diffs em Markdown sob orientacao de `@po` quando a decisao exigir atualizacao textual nos artefatos canonicos |
| **quality_gate_tools** | revisao de evidencias redigidas, alinhamento documental PRD/arquitetura e gates do repo conforme secao **Gates** desta story |

---

## User story

**Como** produto responsavel pelo caso recorrente `5002704`,  
**quero** validar a semantica do cenario hibrido `padraoNacionalEnabled = true` combinado com `requiresLogin` e/ou `requiresSenha`,  
**para** decidir formalmente entre manter a policy atual, aprovar uma correcao controlada ou abrir backlog fase 2 municipal.

---

## Contexto

- O PRD determina que `5002704` tenha uma unica decisao formal, e nao apenas nova rodada de triagem operacional.
- [`story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md`](./story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md) fecha a evidencia factual por ambiente; esta story transforma essa evidencia em decisao rastreavel.
- A UX spec e a arquitetura deixam claro que a decisao nao pode abrir expectativa de regra global para outros municipios.
- Se a conclusao for por excecao controlada, o resultado desta story vira gate obrigatorio do `Epic 2`.

### Registo canónico da decisão (PO)

- A decisao formal e o seu racional ficam registados em **dois locais obrigatorios**, com texto coerente entre si:
  1. [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) — secao dedicada e/ou entrada no **change log** do PRD, incluindo data e resultado (`manter policy vigente` \| `correcao controlada` \| `fase 2 municipal`).
  2. [`docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) — espelho da decisao e implicacao para `Epic 2` (condicional) ou para backlog fase 2 municipal.
- A evidencia em [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](../qa/rec500-preflight-5002704-ambientes-2026-04-14.md) e referenciada a partir do PRD/arquitetura; nao e a fonte unica da decisao.

---

## Critérios de aceite

### Decisão formal

- [ ] **AC-REC500-PD-01:** Existe leitura consolidada da semantica do caso hibrido.
Critério de encerramento: o registo referencia explicitamente [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](../qa/rec500-preflight-5002704-ambientes-2026-04-14.md) **e** uma posicao do fornecedor **ou** evidencia equivalente suficiente para sustentar a decisao sem inferencia fragil; *evidencia equivalente* = registo rastreavel (origem, data, resumo sem segredos) que `@architect` consiga validar sem extrapolacao injustificada — exemplos ilustrativos em **Dev Notes** (nao normativos).
- [ ] **AC-REC500-PD-02:** O caso `5002704` termina com uma unica decisao formal.
Critério de encerramento: o resultado final fica explicitamente registrado como `manter policy vigente`, `correcao controlada` ou `fase 2 municipal`, sem saidas paralelas, nos locais canonicos definidos em **Registo canónico da decisão**.
- [ ] **AC-REC500-PD-03:** A decisao respeita o escopo brownfield.
Critério de encerramento: qualquer aprovacao de correcao controlada explicita restricao por municipio/ambiente ou regra equivalente e proibe inversao global da precedencia `login/senha` vs `padraoNacional`.

### Handoff para backlog seguinte

- [ ] **AC-REC500-PD-04:** Se a decisao for por correcao controlada, o handoff tecnico do `Epic 2` fica pronto.
Critério de encerramento: PRD e arquitetura descrevem claramente as condicoes minimas para [`story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md), incluindo escopo estreito, fronteira BFF e preservacao do comportamento dos demais municipios.
- [ ] **AC-REC500-PD-05:** Se a decisao for por fase 2 municipal, o backlog seguinte fica apontado sem ambiguidade.
Critério de encerramento: PRD e arquitetura registam que nao se trata de bugfix do runtime atual e que o fluxo municipal e iniciativa separada; o `Epic 2` condicional **nao** deve ser iniciado como substituto.

### Gates

- [ ] **AC-REC500-PD-06:** Se o diff final desta story for **apenas** sob `docs/**`, registar nos `Debug Log References` que `npm run lint`, `npm run typecheck` e `npm test` sao **N/A** para esta entrega documental, com justificativa **ou** executar os tres comandos na raiz por disciplina unica da equipa e anexar a saida.
- [ ] **AC-REC500-PD-07:** Se existir alteracao fora de `docs/**`, executar obrigatoriamente `npm run lint`, `npm run typecheck` e `npm test` na raiz e anexar a saida.

---

## Matriz de rastreabilidade (AC -> Tasks)

| AC | Task principal |
|---|---|
| **AC-REC500-PD-01** | 1, 2 |
| **AC-REC500-PD-02** | 3 |
| **AC-REC500-PD-03** | 3 |
| **AC-REC500-PD-04** | 3, 4 |
| **AC-REC500-PD-05** | 3, 4 |
| **AC-REC500-PD-06** | 5 |
| **AC-REC500-PD-07** | 5 |

---

## Dev Notes

### File Locations

- `docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`
- `docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`
- `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`
- `docs/stories/story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`

### Technical Constraints

- Nao aprovar override tecnico sem base explicita na evidencia de [`story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md`](./story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md) e no artefato [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](../qa/rec500-preflight-5002704-ambientes-2026-04-14.md).
- Nao criar regra global para todos os municipios hibridos.
- Nao abrir coleta de credenciais municipais na UI.
- Nao alterar a rota publica nem a fronteira `frontend -> BFF -> PlugNotas`.

### Evidencia equivalente ao fornecedor (exemplos nao normativos)

Ilustrativo — nao acrescenta requisitos fora do PRD; serve para fechar **AC-REC500-PD-01** quando nao houver apenas citacao literal do fornecedor no registo:

- Identificador de ticket ou fio de correspondencia interna com sumario nao sensivel;
- Nota datada de reuniao ou canal acordado com o fornecedor, com conclusao explicita sobre a semantica em causa;
- Resumo de email ou documento externo com dados pessoais ou credenciais redigidos.

O registo deve permitir verificacao cruzada com [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](../qa/rec500-preflight-5002704-ambientes-2026-04-14.md).

### Testing

- Revisar coerencia entre a conclusao desta story e os riscos documentados no PRD/arquitetura.
- Confirmar que a decisao escolhida tem saida operacional e tecnica clara.
- Validar se o resultado desta story viabiliza ou bloqueia corretamente as stories do `Epic 2`.

### Template minimo — bloco a inserir no PRD e espelhar na arquitetura (obrigatorio)

Copiar/adaptar; manter redaction.

```md
## Decisao formal REC500 — municipio 5002704

- Data:
- Responsavel (@po):
- Evidencia base: docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md
- Posicao fornecedor ou evidencia equivalente (referencia rastreavel + resumo sem segredos; ver criterio em AC-REC500-PD-01 e exemplos em Dev Notes desta story):

### Resultado (um unico)
- [ ] manter policy vigente
- [ ] correcao controlada (restrita a 5002704 e ambiente autorizado)
- [ ] fase 2 municipal (sem bugfix de runtime como substituto)

### Implicacao
- Proximo passo documental: `docs/stories/story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md` (sempre que houver decisao a refletir em QA/runbook)
- Proximo passo tecnico: Epic 2 apenas se correcao controlada aprovada; caso contrario nao iniciar `docs/stories/story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`
```

---

## Tasks / Subtasks

1. [x] Revisar a evidencia consolidada em [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](../qa/rec500-preflight-5002704-ambientes-2026-04-14.md) e explicitar o estado factual do caso `5002704` (AC: **AC-REC500-PD-01**).
2. [x] Consolidar posicao do fornecedor ou evidencia equivalente (criterio e exemplos em **AC-REC500-PD-01** / **Dev Notes**) sobre a semantica do caso hibrido (AC: **AC-REC500-PD-01**).
3. [x] Registrar a decisao formal unica e o racional nos locais canonicos (PRD + arquitetura), usando o template minimo acima (AC: **AC-REC500-PD-02**, **AC-REC500-PD-03**).
4. [x] Deixar explicito o handoff: `Epic 2` condicional vs fase 2 municipal vs manter policy, conforme resultado (AC: **AC-REC500-PD-04**, **AC-REC500-PD-05**).
5. [x] Atualizar esta story com `File list`, notas finais e registro dos gates (AC: **AC-REC500-PD-06**, **AC-REC500-PD-07**).

---

## Registro de Preparacao para Execucao (DoR)

- [ ] [`story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md`](./story-fr-rec500-p1-operacao-qa-evidencia-preflight-5002704-ambiente-2026-04-14.md) concluida com evidencia por ambiente.
- [ ] PRD, UX spec e arquitetura revisados antes da decisao.
- [ ] Donos da aprovacao de produto identificados.
- [ ] Criterio para diferenciar `correcao controlada` de `fase 2 municipal` acordado.

---

## Registro de Pronto para Review (PO Gate)

- [ ] **AC-REC500-PD-01** a **AC-REC500-PD-05** satisfeitos no PRD e na arquitetura (texto coerente entre ambos).
- [ ] A justificativa usa evidencia factual e nao intuicao.
- [ ] O resultado deixa pronto o handoff para [`story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md`](./story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md) e, se aplicavel, para o `Epic 2` ou para backlog fase 2 municipal.
- [ ] `Dev Agent Record` e `File list` atualizados.
- [ ] **AC-REC500-PD-06** / **AC-REC500-PD-07** tratados conforme secao **Gates** (N/A com justificativa ou execucao completa).

---

## File list

- [x] `docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`
- [x] `docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`
- [x] `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`
- [x] `docs/stories/story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`
- [x] `docs/qa/rec500-p1-semantica-followup-gates-po-architect-2026-04-15.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Solidez da decisao frente a evidencias por ambiente.
- Rastreabilidade da posicao do fornecedor ou da evidencia equivalente (origem, data, resumo sem segredos), alinhada a **AC-REC500-PD-01**.
- Escopo restrito de qualquer excecao controlada aprovada.
- Separacao clara entre bugfix de runtime e backlog fase 2 municipal.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md` — v1.1; secao **18** decisao formal `manter policy vigente`.
- `docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md` — v1.1; secao **18** espelho + change log **19**.
- `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md` — evidencia base (referenciada; sem diff nesta story).
- `docs/stories/story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md` — esta story.
- `docs/qa/rec500-p1-semantica-followup-gates-po-architect-2026-04-15.md` — checklist **@po** / **@architect** (follow-up ao advisory Quinn na secao QA Results).

### Debug Log References

- **Gates (AC-REC500-PD-06 / PD-07):** Diff apenas sob `docs/**` — comandos `npm run lint`, `npm run typecheck`, `npm test` sao **N/A** para validacao de codigo; execucao opcional na raiz por disciplina (nao exigida para fecho documental).
- **Pos-revisao QA (2026-04-15):** `npm run lint`, `npm run typecheck`, `npm test` na raiz — exit `0`; `npm test` reportou **351** pass (sumario; saida completa nao versionada).

### Completion Notes

- Story criada por `@sm` para fechar a decisao de produto do caso `5002704`.
- Esta story e o gate formal entre o `Epic 1` obrigatorio e o `Epic 2` condicional.
- **Decisao registada:** `manter policy vigente` — PRD secao 18 + espelho na arquitetura; evidencia equivalente: OpenAPI publico PlugNotas (`api.json`) com resumo no PRD; **Epic 2** nao iniciado; **fase 2 municipal** nao selecionada (backlog futuro separado).
- **Handoff:** [`story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md`](./story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md).
- **Correcao pos-QA:** Quinn assinalou que **@po** e **@architect** devem confirmar formalmente (*Executor Assignment*). Checklist auditavel em [`docs/qa/rec500-p1-semantica-followup-gates-po-architect-2026-04-15.md`](../qa/rec500-p1-semantica-followup-gates-po-architect-2026-04-15.md). A secao **QA Results** nao foi alterada pelo dev (competencia Quinn).

### Change Log

- 2026-04-14 — Story criada por `@sm` a partir do PRD, da spec de UX e da arquitetura de `REC500`.
- 2026-04-14 — Refinamento PO/SM: executor `@po`, gates condicionais (`docs/**` vs codigo), IDs de AC (`AC-REC500-PD-01` a `07`), registo canónico da decisao em PRD+arquitetura, template minimo, matriz AC->Tasks, handoffs para matriz/runbook e `Epic 2`, links explicitos a story de evidencia.
- 2026-04-14 — Template minimo: caminhos desde a raiz do repo (paste no PRD/arquitetura sem links relativos quebrados).
- 2026-04-14 — Feedback PO: definicao operacional de *evidencia equivalente* em AC-REC500-PD-01; secao **Dev Notes** com exemplos nao normativos; alinhamento do template e da task 2.
- 2026-04-15 — Implementacao documental: decisao `manter policy vigente` em PRD v1.1 / arquitetura v1.1; status Ready for Review.
- 2026-04-15 — Pos-QA: artefato `docs/qa/rec500-p1-semantica-followup-gates-po-architect-2026-04-15.md` + registo de gates npm opcional no Debug Log; checklist PO/Architect.

---

## QA Results

### Revisao (Quinn / aiox-qa) — 2026-04-15

**Decisao de gate (advisory):** **PASS** — registo canónico completo e coerente entre PRD v1.1 e arquitetura v1.1; rastreio aos AC satisfeito com base apenas em artefatos versionados. O **quality gate** formal **`@po`** / **`@architect`** da tabela *Executor Assignment* permanece responsabilidade dessas personas (esta revisao nao substitui assinatura de produto ou arquitetura).

---

#### Rastreio por criterio de aceite

| AC | Avaliacao | Notas |
|----|-----------|--------|
| **AC-REC500-PD-01** | **PASS** | PRD §18 inclui leitura consolidada do hibrido; referencia explicita a [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](../qa/rec500-preflight-5002704-ambientes-2026-04-14.md); **evidencia equivalente** = OpenAPI publico (`api.json`) com origem, data (2026-04-15) e resumo sem segredos — validavel por `@architect` sem extrapolacao injustificada. |
| **AC-REC500-PD-02** | **PASS** | Resultado unico **`manter policy vigente`** com checkboxes mutuamente exclusivos no PRD §18; espelho na arquitetura §18. |
| **AC-REC500-PD-03** | **PASS** | Sem **correcao controlada** aprovada; texto explicita ausencia de excecao por municipio/ambiente e ausencia de inversao global da precedencia — coerente com **DP-REC500-02** / **DP-REC500-03**. |
| **AC-REC500-PD-04** | **N/A** *(condicional)* | Decisao **nao** e `correcao controlada`; criterio de handoff Epic 2 **nao** aplicavel. PRD §18 confirma **nao** iniciar Epic 2 / story P2. |
| **AC-REC500-PD-05** | **N/A** *(condicional)* | Decisao **nao** e `fase 2 municipal`; criterio especifico **nao** aplicavel. PRD §18 distingue backlog fase 2 de Epic 2 (sem ambiguidade). |
| **AC-REC500-PD-06** | **PASS** | `Debug Log References` regista N/A para `lint` / `typecheck` / `test` com diff apenas `docs/**` e justificativa. |
| **AC-REC500-PD-07** | **N/A** | Sem alteracao fora de `docs/**`. |

#### Coerencia PRD ↔ arquitetura

- **PASS:** Decisao, evidencia base, Epic 2 nao acionado e implicacao tecnica (sem mudanca de motor) alinhados entre [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) §18 e [`docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) §18.

#### Riscos / observabilidade (baixo)

- **Risco residual baixo:** Decisao **manter policy** com homologacao **inconclusiva** no artefato QA — aceite no racional do PRD; se a equipa reabrir **correcao controlada**, exige novo ciclo (ja referido no PRD).

#### Handoff seguinte

- **PASS:** Ponteiro para [`story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md`](./story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md) coerente com PRD §18 *Implicacao*.

---

**Assinatura:** Quinn (Test Architect) — revisao documental e de rastreio aos AC; sem execucao de codigo em escopo desta story.
