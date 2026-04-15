# Story — FR-REC500 (P2): Operacao — rollout controlado da excecao `5002704`

**ID:** STORY-FR-REC500-P2-OPERACAO-ROLLOUT-CONTROLADO-5002704-2026-04-14  
**Prioridade:** P2  
**Status:** Closed — encerramento documental (**sem rollout técnico**; PRD §18 `manter policy vigente`; pré-requisito [`story-fr-rec500-p2-backend-regra-governada-runtime`](./story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) **Cancelled**)  
**Depende de:** [`docs/stories/story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) *(Epic 2 — regra governada no runtime)*, [`docs/stories/story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md) *(Epic 2 — regressao + matriz QA tecnica)*, [`docs/stories/story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md`](./story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md) *(Epic 1 — matriz/runbook base)*, [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md)  
**Fonte PRD:** [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) — **FR-REC500-07**, **FR-REC500-08**, **NFR-REC500-02**, **NFR-REC500-03**, **NFR-REC500-05**, **CR-REC500-04**  
**UX:** secao 7.4 (REC500-UX-L3), secao 12.2 (runbook), secao 13 (fase 2 condicional), secao 14 (criterios)  
**Arquitetura:** secao 11 (observabilidade, evidencia e redaction), secao 13.2 (fase condicional), secao 13.3 (fallback), secao 14 (riscos tecnicos)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @qa |
| **quality_gate** | @po |
| **revisao** | @dev e @architect |
| **quality_gate_tools** | validacao de rollout, evidencia redigida, revisao de runbook/matriz e gates do repo conforme secao **Gates** desta story |

---

## Nota de governanca do artefato

- Esta story e **condicional** e so pode ser iniciada se [`story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) e [`story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md) estiverem concluidas com sucesso (implementacao + regressao).
- O rollout continua restrito ao caso governado aprovado; ele nao autoriza expansao para outros municipios.
- Se qualquer validacao falhar, o fallback obrigatorio e voltar ao bloqueio atual e registrar o caso como rollback ou como backlog fase 2, conforme decisao de produto.

### Encerramento 2026-04-15 (implementação `@dev`)

- A story de **runtime governado** está **Cancelled** (PRD §18 `manter policy vigente`). Não existe excepção BFF a activar nem build a promover; o **rollout operacional executável** fica **fora de escopo**.
- Entrega = **encerramento documental**: evidência **N/A — sem ativação** em [`docs/qa/rec500-rollout-controlado-5002704-2026-04-14.md`](../qa/rec500-rollout-controlado-5002704-2026-04-14.md), plano futuro condicional (secções 2+), alinhamento runbook + matriz. Validação remota adicional do caminho «governado» é **N/A**.
- Executor canónico na tabela *Executor Assignment* permanece **`@qa`** / gate **`@po`**; esta implementação foi pedida via **`@dev`** (Dex).

---

## User story

**Como** operacao responsavel pelo rollout do caso governado `5002704`,  
**quero** validar a ativacao controlada da excecao aprovada e seu fallback,  
**para** introduzir a mudanca com baixo risco e manter rastreabilidade completa caso seja necessario reverter.

---

## Contexto

- O PRD e a arquitetura deixam claro que a introducao da excecao, se aprovada, deve ocorrer em fases e com rollback definido.
- O frontend nao deve exibir "modo especial"; por isso a observabilidade e a documentacao operacional ganham peso maior nesta story.
- O rollout precisa deixar evidenciado se `5002704` passou a funcionar como sucesso operacional normal ou se houve necessidade de recuar para o bloqueio atual.

---

## Critérios de aceite

### Plano de rollout

- [x] **AC-REC500-RO-01:** Existe plano explicito de ativacao e rollback para `5002704`.
Critério de encerramento: o plano define ambiente(s) autorizados, sinal de entrada, validacoes obrigatorias, responsavel pela aprovacao e caminho de reversao para o bloqueio atual. **Satisfeito** no artefacto QA: secção **1** (estado actual **N/A**, **ambiente alvo do rollout** **N/A** no presente encerramento, rollback como manter policy) e secções **2 / 2.1 / 2.2** (plano futuro condicional).
- [x] **AC-REC500-RO-02:** O rollout nao amplia o escopo aprovado.
Critério de encerramento: a documentacao e a execucao deixam claro que a ativacao vale apenas para `5002704` no recorte governado aprovado. **Satisfeito:** artefacto e matriz reforçam âmbito único `5002704`; sem capacidade global.

### Evidência operacional

- [x] **AC-REC500-RO-03:** Existe evidencia redigida do resultado do rollout.
Critério de encerramento: o artefato final em [`docs/qa/rec500-rollout-controlado-5002704-2026-04-14.md`](../qa/rec500-rollout-controlado-5002704-2026-04-14.md) *(ou local equivalente acordado)* regista se o caso entrou em sucesso operacional normal, se permaneceu bloqueado ou se houve rollback, sempre com ambiente, data e responsavel. **Satisfeito:** resultado **N/A — sem ativação**; **ambiente alvo do rollout** explícito (**N/A**) na tabela §1; data e responsável documental; estado operacional = bloqueio vigente (`prefeitura_login_required_blocked`).
- [x] **AC-REC500-RO-04:** Runbook e matriz QA ficam alinhados ao estado pos-rollout.
Critério de encerramento: [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) e [`docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`](../qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md) refletem o status final do caso e o caminho de fallback, sem contradizer o PRD nem a arquitetura. **Satisfeito:** linha de tabela REC500 no runbook + bullets/story na matriz e subsecção rollout.

### Gates

- [x] **AC-REC500-RO-05:** Se o diff final desta story for **apenas** sob `docs/**`, registar nos `Debug Log References` que `npm run lint`, `npm run typecheck` e `npm test` sao **N/A** para esta entrega documental, com justificativa **ou** executar os tres comandos na raiz por disciplina unica da equipa e anexar a saida. **Satisfeito:** ver `Debug Log References`.
- [x] **AC-REC500-RO-06:** Se existir alteracao fora de `docs/**`, executar obrigatoriamente `npm run lint`, `npm run typecheck` e `npm test` na raiz e anexar a saida. **N/A** — diff apenas `docs/**`.

---

## Matriz de rastreabilidade (AC -> Tasks)

| AC | Task principal |
|---|---|
| **AC-REC500-RO-01** | 1, 2 |
| **AC-REC500-RO-02** | 1, 2 |
| **AC-REC500-RO-03** | 3 |
| **AC-REC500-RO-04** | 4 |
| **AC-REC500-RO-05** | 5 |
| **AC-REC500-RO-06** | 5 |

---

## Dev Notes

### File Locations

- `docs/operacao-mei-nfse.md`
- `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`
- `docs/qa/rec500-rollout-controlado-5002704-2026-04-14.md`
- `docs/stories/story-fr-rec500-p2-operacao-rollout-controlado-5002704-2026-04-14.md`

### Technical Constraints

- Nao ampliar o rollout para outros municipios.
- Nao remover o caminho de rollback para o bloqueio atual.
- Nao documentar a excecao como capacidade global do produto.
- Manter redaction em qualquer evidencia operacional gerada.

### Testing

- Validar o caso governado no ambiente autorizado.
- Confirmar que a observabilidade e os artefatos documentais registram o resultado do rollout.
- Confirmar que o plano de rollback e executavel se houver falha.

---

## Tasks / Subtasks

1. [x] Preparar o plano de ativacao controlada e rollback para `5002704` (AC: **AC-REC500-RO-01**, **AC-REC500-RO-02**). *(Entregue no artefacto QA — secções 2+; estado actual sem sinal técnico de entrada.)*
2. [x] Executar a validacao operacional no ambiente autorizado (AC: **AC-REC500-RO-01**, **AC-REC500-RO-02**). *(**N/A** — não há excepção governada merged nem ambiente alvo distinto do já descrito no PRD; validação “real” de promoção não aplicável.)*
3. [x] Registrar evidencia redigida do resultado do rollout (AC: **AC-REC500-RO-03**).
4. [x] Atualizar runbook e matriz QA com o estado final do caso (AC: **AC-REC500-RO-04**).
5. [x] Atualizar esta story com `File list`, notas finais e registro dos gates (AC: **AC-REC500-RO-05**, **AC-REC500-RO-06**).

---

## Registro de Preparacao para Execucao (DoR)

- [ ] [`story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) concluida (regra governada integrada). **Não satisfeito para execução de rollout** — story **Cancelled** (PRD §18).
- [x] [`story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md) *(estado **Ready for Review**; regressão do ramo bloqueado + matriz `RTCAD-REC500-02` alinhadas — ver própria story)*.
- [ ] Ambiente autorizado para rollout definido. **N/A** para promoção técnica — sem build a deslocar.
- [x] Responsavel por aprovacao e rollback identificado *(futuro: `@po` + engenharia; documentado no artefacto QA)*.
- [x] Artefato de evidencia do rollout reservado — [`rec500-rollout-controlado-5002704-2026-04-14.md`](../qa/rec500-rollout-controlado-5002704-2026-04-14.md).

---

## Registro de Pronto para Review (PO Gate)

- [x] **AC-REC500-RO-01** a **AC-REC500-RO-04** satisfeitos no modo **documental** (plano, escopo, evidencia, runbook/matriz).
- [x] `Dev Agent Record` e `File list` atualizados.
- [x] **AC-REC500-RO-05** / **AC-REC500-RO-06** tratados conforme secao **Gates** (N/A com justificativa ou execucao completa).

**Opcional `@po`:** rubrica formal se a equipa exigir assinatura explícita de encerramentos **N/A** (recomendado em auditorias).

---

## File list

- [x] `docs/operacao-mei-nfse.md`
- [x] `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`
- [x] `docs/qa/rec500-rollout-controlado-5002704-2026-04-14.md`
- [x] `docs/stories/story-fr-rec500-p2-operacao-rollout-controlado-5002704-2026-04-14.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Clareza do plano de rollout e rollback (**AC-REC500-RO-01**).
- Restricao do escopo ao caso `5002704` (**AC-REC500-RO-02**).
- Coerencia entre evidencia operacional (**AC-REC500-RO-03**), runbook e matriz QA (**AC-REC500-RO-04**).

---

## Dev Agent Record

### Status

Closed — encerramento documental (sem rollout técnico).

### File list

- `docs/operacao-mei-nfse.md` — linha de tabela REC500 «Rollout controlado (Epic 2 operação)» + link para evidência.
- `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md` — story em «Stories que governam»; tabela de ramos + subsecção rollout P2.
- `docs/qa/rec500-rollout-controlado-5002704-2026-04-14.md` — artefacto canónico (resultado N/A; plano futuro).
- `docs/stories/story-fr-rec500-p2-operacao-rollout-controlado-5002704-2026-04-14.md` — esta story.

### Debug Log References

- **AC-REC500-RO-05:** Diff apenas `docs/**` — `npm run lint`, `npm run typecheck` e `npm test` são **N/A** para esta entrega (sem código executável alterado).

### Completion Notes

- Story criada por `@sm` para fechar a introducao controlada da excecao `5002704`, se ela vier a ser aprovada.
- Esta story e o ultimo passo do `Epic 2` e depende integralmente do gate documental e tecnico anterior.
- **2026-04-15 (`@dev`):** Com PRD §18 `manter policy vigente` e runtime Epic 2 **Cancelled**, não há «ativação» a documentar como sucesso operacional do caso governado. Entrega = evidência **N/A**, plano futuro explícito, runbook/matriz alinhados. Executor primário na story é `@qa`; implementação documental solicitada via comando **aiox-dev**.
- **2026-04-15 (follow-up `@dev`):** Ponto cosmético da revisão `@qa` (AC-RO-03): tabela §1 do artefacto `rec500-rollout-controlado-5002704-2026-04-14.md` passou a incluir **Ambiente alvo do rollout (promoção técnica)** = **N/A**.

### Change Log

- 2026-04-14 — Story criada por `@sm` a partir do PRD, da spec de UX e da arquitetura de `REC500`.
- 2026-04-14 — Refinamento PO/SM: IDs `AC-REC500-RO-01` a `06`, gates condicionais (`docs/**` vs codigo), links canonicos em vez de "Stories 2.1/2.2", matriz AC->Tasks, DoR/PO Gate alinhados, rotulos em `Depende de`, caminhos explicitos no AC de evidencia e runbook/matriz.
- 2026-04-15 — Encerramento documental: artefacto QA, atualizações runbook + matriz, story fechada (sem rollout técnico).
- 2026-04-15 — Ajuste pós-revisão `@qa`: linha **Ambiente alvo do rollout** = **N/A** em `rec500-rollout-controlado-5002704-2026-04-14.md` §1; QA Results actualizado.

---

## QA Results

### Revisão `@qa` (Quinn) — 2026-04-15

**Âmbito:** apenas artefactos em `docs/**` listados no *File list*; sem alteração de código.

| AC | Veredito | Notas |
|----|-----------|--------|
| **RO-01** | **Satisfeito** | Plano futuro explícito em `rec500-rollout-controlado-5002704-2026-04-14.md` §2 / 2.1 / 2.2; estado actual §1 documenta ausência de sinal técnico e «rollback» = policy vigente. |
| **RO-02** | **Satisfeito** | §3 do artefacto + linhas na matriz e guardrail no runbook reforçam só `5002704` e não capacidade global. |
| **RO-03** | **Satisfeito** | Evidência redigida com data, resultado **N/A**, responsável documental, política de redaction no cabeçalho do artefacto; tabela §1 inclui linha **Ambiente alvo do rollout (promoção técnica)** = **N/A** (após revisão `@qa`). |
| **RO-04** | **Satisfeito** | Runbook (tabela REC500) e matriz (stories que governam + ramos + subsecção rollout) apontam para o mesmo estado e para o artefacto canónico. |
| **RO-05** | **Satisfeito** | `Debug Log References` regista N/A para `lint` / `typecheck` / `test` com justificativa (`docs/**` apenas). |
| **RO-06** | **N/A** | Sem diff fora de `docs/**`. |

**DoR vs nota de governança (linhas 22–26):** a pré-condição «runtime + regressão concluídas com sucesso» **não** se cumpre para um rollout *executável* (runtime **Cancelled**). O encerramento documental está **explicitamente motivado** no cabeçalho da story e no artefacto QA — **não** há contradição lógica; evita-se falso positivo de «rollout feito».

**Dependência regressão P2:** DoR assinala regressão em **Ready for Review**; para *esta* story (só documentação de N/A e alinhamento), o risco residual é **baixo** — não depende de novo código merged.

### Decisão de gate (advisory — `@qa`)

**PASS** para revisão documental e rastreio AC → artefactos, no modo **encerramento N/A**.

**Recomendação para `@po`:** rubrica formal opcional se política interna exigir assinatura explícita de encerramentos sem promoção técnica (já mencionado no *PO Gate* da story).

---

- Encerramento documental registado; gate **`@po`** permanece canónico para aceite de produto (*Executor Assignment*).
