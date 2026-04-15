# Story — FR-REC500 (P2): Backend — regra governada de runtime para `5002704`

**ID:** STORY-FR-REC500-P2-BACKEND-REGRA-GOVERNADA-RUNTIME-5002704-2026-04-14  
**Prioridade:** P2  
**Status:** Cancelled — **DoR de produto não satisfeito:** decisão formal em [`PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) §18 é **`manter policy vigente`**, não **`correcao controlada`** (ver **Nota de governanca** e **Dev Agent Record**).  
**Depende de:** [`docs/stories/story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) *(Epic 1 — decisao formal do caso)*, [`docs/stories/story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md`](./story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md) *(Epic 1 — matriz/runbook base)*, [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md)  
**Handoff obrigatorio para (apos merge desta story, se aplicavel):** [`story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md) *(regressao + matriz QA)* — **paridade:** a story de regressao declara dependencia desta em `Depende de`.  
**Fonte PRD:** [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) — **FR-REC500-04**, **FR-REC500-05**, **DP-REC500-02**, **DP-REC500-03**, **DP-REC500-05**, **NFR-REC500-03**, **NFR-REC500-04**, **CR-REC500-01**, **CR-REC500-02**, **CR-REC500-04**  
**UX:** secao 7.4 (REC500-UX-L3), secao 8 (contrato minimo frontend -> BFF), secao 9 (regras de componentes), secao 14 (criterios)  
**Arquitetura:** secao 3 (decisao arquitetural), secao 6.2 (Epic 2), secao 7 (ponto de extensao recomendado), secao 8.2 (estado futuro condicional), secao 8.3 (pseudocodigo), secao 9.3 (comportamento se excecao for aprovada), secao 10.2 (impacto no frontend)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisao** | @architect |
| **quality_gate_tools** | testes backend, revisao de decisao governada e gates do repo conforme secao **Gates** desta story |

---

## Nota de governanca do artefato

- Esta story e **condicional**.
- So pode ser iniciada se [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) tiver registado explicitamente **`correcao controlada`** (PRD + arquitetura alinhados).
- Se a decisao formal for `manter policy vigente` ou `fase 2 municipal`, **esta** story deve ser **cancelada** ou permanecer em backlog sem sprint (sem implementacao).

---

## User story

**Como** owner do BFF do cadastro empresa PlugNotas,  
**quero** introduzir uma regra governada e estreita para `5002704` apos o preflight e antes do bloqueio atual,  
**para** permitir o caminho nacional apenas no caso aprovado, sem inverter a precedencia global do runtime para os demais municipios.

---

## Contexto

- A arquitetura ja definiu o ponto de extensao correto entre o preflight normalizado e a decisao final do runtime.
- O contrato publico nao precisa de novo endpoint nem de novo `plugnotasCode` para o caminho aprovado.
- A UX espera sucesso operacional normal no caso governado e preservacao do bloqueio atual para os demais cenarios.
- O principal risco desta story e transformar um override estreito em regra global; por isso a governanca e parte do AC.

---

## Critérios de aceite

> **Estado 2026-04-15:** Os AC **RT-01** a **RT-06** exigem implementação backend; ficam **N/A** para esta execução porque a story foi **cancelada** por decisão de produto (`manter policy vigente`). Voltam a aplicar-se se `@po` reabrir **`correcao controlada`** e atualizar PRD/arquitetura.

### Regra governada

- [ ] **N/A** — **AC-REC500-RT-01:** A camada de governanca entra apenas no ponto de decisao recomendado pela arquitetura. *(Story cancelada; sem diff backend.)*
Critério de encerramento: a implementacao intercepta o resultado do preflight antes do bloqueio `prefeitura_login_required_blocked`, sem mover a decisao para o frontend nem alterar a rota publica.
- [ ] **N/A** — **AC-REC500-RT-02:** A regra aprovada e estreita e governada. *(Story cancelada; sem diff backend.)*
Critério de encerramento: a regra considera `codigoIbge = 5002704` e ambiente autorizado, ou mecanismo equivalente explicitamente aprovado em [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) / PRD / arquitetura, sem afetar outros municipios.
- [ ] **N/A** — **AC-REC500-RT-03:** A ausencia da regra governada preserva o comportamento atual. *(Story cancelada; sem diff backend.)*
Critério de encerramento: se a governanca nao estiver presente ou nao casar com o caso, o fluxo continua bloqueando exatamente como hoje.

### Compatibilidade brownfield

- [ ] **N/A** — **AC-REC500-RT-04:** O fluxo `POST` -> `PATCH` continua preservado. *(Story cancelada; sem diff backend.)*
Critério de encerramento: quando a regra governada autorizar o caminho, o cadastro segue pelo fluxo canonico ja existente com eventual fallback `PATCH`.
- [ ] **N/A** — **AC-REC500-RT-05:** Nao ha proliferacao de contrato publico. *(Story cancelada; sem diff backend.)*
Critério de encerramento: o frontend continua recebendo sucesso operacional normal quando o caso governado passa e `prefeitura_login_required_blocked` permanece valido para os demais casos.
- [ ] **N/A** — **AC-REC500-RT-06:** Nao existe inversao global da precedencia `login/senha` vs `padraoNacional`. *(Story cancelada; sem diff backend.)*
Critério de encerramento: apenas o caso governado aprovado pode atravessar o bloqueio; municipios fora do escopo continuam sob a regra geral atual.

### Gates

- [x] **AC-REC500-RT-07:** Se o diff final desta story for **apenas** sob `docs/**`, registar nos `Debug Log References` que `npm run lint`, `npm run typecheck` e `npm test` sao **N/A** para esta entrega documental, com justificativa **ou** executar os tres comandos na raiz por disciplina unica da equipa e anexar a saida.
- [x] **AC-REC500-RT-08:** Se existir alteracao fora de `docs/**` (tipico desta story: backend), executar obrigatoriamente `npm run lint`, `npm run typecheck` e `npm test` na raiz e anexar a saida. *(**N/A** — sem alteracao fora de `docs/**`; cancelamento documental)*

---

## Matriz de rastreabilidade (AC -> Tasks)

| AC | Task principal |
|---|---|
| **AC-REC500-RT-01** | 1 |
| **AC-REC500-RT-02** | 1 |
| **AC-REC500-RT-03** | 2 |
| **AC-REC500-RT-04** | 3 |
| **AC-REC500-RT-05** | 4 |
| **AC-REC500-RT-06** | 4 |
| **AC-REC500-RT-07** | 5 |
| **AC-REC500-RT-08** | 5 |

---

## Dev Notes

### File Locations

- `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/src/services/plugnotas/plugnotas-cidades.service.js`
- `backend/src/services/plugnotas/prefeituraPortalCredentials.js`
- `docs/stories/story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`

### Technical Constraints

- Nao alterar a rota publica `POST /api/mei-notas/setup/emissao-fiscal/empresa`.
- Nao introduzir credenciais municipais no browser.
- Nao permitir que `padraoNacionalEnabled = true` passe a vencer sempre `requiresLogin`/`requiresSenha`.
- Nao criar regra governada sem correspondencia explicita com a decisao formal em [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) / PRD / arquitetura.

### Testing

- Validar regra governada presente e ausente.
- Validar que `5002704` autorizado segue pelo caminho nacional controlado.
- Validar que municipios fora do escopo continuam bloqueados como antes.
- Validar preservacao do fallback `POST` -> `PATCH`.

---

## Tasks / Subtasks

1. [ ] ~~Implementar a camada de governanca server-side no ponto de decisao recomendado e restringir a regra ao caso aprovado (AC: **AC-REC500-RT-01**, **AC-REC500-RT-02**).~~ **Cancelada** (DoR produto).
2. [ ] ~~Preservar o comportamento atual quando a regra governada nao se aplicar (AC: **AC-REC500-RT-03**).~~ **Cancelada** (DoR produto).
3. [ ] ~~Garantir preservacao do fluxo `POST` -> `PATCH` (AC: **AC-REC500-RT-04**).~~ **Cancelada** (DoR produto).
4. [ ] ~~Garantir contrato publico e precedencia sem inversao global (AC: **AC-REC500-RT-05**, **AC-REC500-RT-06**).~~ **Cancelada** (DoR produto).
5. [x] Atualizar esta story com `File list`, notas finais e registro dos gates (AC: **AC-REC500-RT-07**, **AC-REC500-RT-08**).

---

## Registro de Preparacao para Execucao (DoR)

- [ ] [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md) concluida com decisao **`correcao controlada`** refletida em PRD e arquitetura. **Não satisfeito:** decisão canónica **`manter policy vigente`** ([PRD §18](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md)).
- [ ] Escopo governado aprovado (municipio, ambiente e condicoes) explicitado. **N/A** (sem correção controlada).
- [ ] Arquitetura e pseudocodigo revisados antes da implementacao. **N/A** (story cancelada).
- [ ] Risco de regressao global revisado com `@architect`. **N/A** (story cancelada).

---

## Registro de Pronto para Review (PO Gate)

- [ ] **N/A** — **AC-REC500-RT-01** a **AC-REC500-RT-06** (implementacao + brownfield): nao aplicavel — story cancelada.
- [x] `Dev Agent Record` e `File list` atualizados (registo de cancelamento).
- [x] **AC-REC500-RT-07** / **AC-REC500-RT-08** tratados conforme secao **Gates** (N/A documental / sem código).

---

## File list

- [ ] `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js` *(sem alteracao — cancelada)*
- [ ] `backend/src/services/plugnotas/empresa.service.js` *(sem alteracao — cancelada)*
- [ ] `backend/src/services/plugnotas/plugnotas-cidades.service.js` *(sem alteracao — cancelada)*
- [ ] `backend/src/services/plugnotas/prefeituraPortalCredentials.js` *(sem alteracao — cancelada)*
- [x] `docs/stories/story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Escopo estreito da governanca por municipio/ambiente (**AC-REC500-RT-02**).
- Preservacao da regra atual fora do caso aprovado (**AC-REC500-RT-03**).
- Compatibilidade com o contrato publico, precedencia e fallback `POST` -> `PATCH` (**AC-REC500-RT-04** a **AC-REC500-RT-06**).

---

## Dev Agent Record

### Status

Cancelled (DoR produto)

### File list

- `docs/stories/story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md` *(único ficheiro alterado — registo de cancelamento)*

### Debug Log References

- **AC-REC500-RT-07:** Diff **apenas** `docs/stories/**` — `npm run lint`, `npm run typecheck` e `npm test` são **N/A** para validar esta entrega documental (sem mudança de código de aplicação). A equipa pode correr os três na raiz por disciplina; não são pré-requisito para fechar o cancelamento.
- **AC-REC500-RT-08:** N/A — nenhuma alteração fora de `docs/**`.

### Completion Notes

- Story criada por `@sm` como implementacao condicional do `Epic 2`.
- **Pos-QA 2026-04-15:** Formato dos checklists **RT-01…RT-06** e PO Gate alinhado à observação Quinn (prefixo **N/A** explícito).
- **2026-04-15 (Dex):** Não foi implementada regra governada no BFF: o **PRD §18** e a story P1 registam decisão **`manter policy vigente`**, não **`correcao controlada`**. Implementar `evaluateEmpresaCadastroMunicipioPreflight` com exceção para `5002704` **sem** alteração explícita de produto nos artefactos canónicos violaria **Nota de governanca** desta story e **NFR** de alinhamento a decisões formais.
- **Reabertura:** Se `@po` alterar a decisão para `correcao controlada` e atualizar PRD + arquitetura, reabrir esta story (ou clonar) e seguir tarefas 1–4; a story de regressão [`story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md) já documenta o ramo bloqueado com policy vigente.

### Change Log

- 2026-04-14 — Story criada por `@sm` a partir do PRD, da spec de UX e da arquitetura de `REC500`.
- 2026-04-14 — Refinamento PO/SM: IDs `AC-REC500-RT-01` a `08`, gates condicionais (`docs/**` vs codigo), links canonicos em vez de "Story 1.2", matriz AC->Tasks, handoff para story de regressao, DoR/PO Gate alinhados, rotulos em `Depende de`.
- 2026-04-15 — **Cancelada** sem código: PRD §18 `manter policy vigente`; DoR `correcao controlada` não satisfeito; RT-07/RT-08 documentais.
- 2026-04-15 — Revisão QA (Quinn): gate **PASS (governação)**; `QA Results` completos.
- 2026-04-15 — Pos-QA dev: prefixo **N/A** nos AC RT-01…RT-06 + nota em **QA Results**.

---

## QA Results

### Revisão (Quinn / aiox-qa) — 2026-04-15

**Decisão de gate (advisory):** **PASS (processo / governação)** — não há entrega de código backend a validar; o **cancelamento documental** está **alinhado** à **Nota de governança** da própria story e ao [**PRD §18**](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) (**`manter policy vigente`**). **Não** se esperava implementação de `empresa-cadastro-runtime-decision` neste recorte. O **quality gate `@architect`** e **`@po`** permanecem disponíveis para confirmação formal se a equipa exigir assinatura explícita de backlog/cancelamento.

---

#### Rastreio por critério de aceite

| AC | Avaliação | Notas |
|----|-----------|--------|
| **AC-REC500-RT-01** a **RT-06** | **N/A** *(esperado)* | Story **Cancelled**; ACs exigem diff backend — não aplicáveis até **`correcao controlada`** + PRD/arquitetura atualizados. Raciocínio e referências cruzadas ao PRD no **Dev Agent Record** estão **auditáveis**. |
| **AC-REC500-RT-07** | **PASS** | Diff apenas `docs/stories/**`; **Debug Log References** regista **N/A** para `lint` / `typecheck` / `test` com justificativa adequada. |
| **AC-REC500-RT-08** | **N/A** | Sem alteração fora de `docs/**` — coerente com cancelamento. |

#### DoR / dependências

| Item | Avaliação |
|------|-----------|
| Decisão **`correcao controlada`** | **Não satisfeita** — coerente com PRD §18 e com [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md). |
| Handoff **P2 regressão** | A story [`story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md) declara dependência desta; a entrega de regressão sob **policy vigente** já foi tratada **à parte** — **sem conflito** com o cancelamento do Epic 2 runtime. |

#### Observações (não bloqueantes)

- **Backlog:** Se `@po` reabrir **`correcao controlada`**, esta story (ou sucessora) deve voltar a listar **testes backend** obrigatórios conforme **Testing** e **AC-RT-08**.
- **Checkbox AC RT-01…RT-06:** permanecem `[ ]` no corpo da story com nota **N/A** — aceitável para leitura de arquivo; opcional futuro marcar como `[ ] N/A` ou mover para anexo só para evitar ambiguidade em relatórios automáticos.

---

**Assinatura:** Quinn (Test Architect) — revisão de consistência documental e de governação; sem execução de testes de aplicação em âmbito desta story.

### Esclarecimento pós-dev (2026-04-15)

- **Observação QA (checkboxes RT-01…RT-06):** linhas de critério passam a usar prefixo explícito **`N/A`** imediatamente após o marcador, para leitura humana e ferramentas que contem listas — sem alterar o parecer Quinn.

### Nota de encerramento (@dev — 2026-04-15)

Implementação backend **não aplicável** até decisão de produto compatível. **`@qa`** pode registar **N/A** ou **Cancelled** conforme processo interno.
