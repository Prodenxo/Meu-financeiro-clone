# Story — FR-REC500 (P2): Backend/QA — regressao do caso hibrido governado `5002704`

**ID:** STORY-FR-REC500-P2-BACKEND-QA-REGRESSAO-CASO-HIBRIDO-5002704-2026-04-14  
**Prioridade:** P2  
**Status:** Ready for Review  
**Depende de:** [`docs/stories/story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) *(Epic 2 — regra governada no runtime; **não** merged enquanto PRD §18 for `manter policy vigente`)*, [`docs/stories/story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md`](./story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md) *(Epic 1 — matriz/runbook base)*, [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../specs/ux-spec-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md), [`docs/technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../technical/architecture-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md)  
**Fonte PRD:** [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) — **FR-REC500-05**, **FR-REC500-06**, **FR-REC500-07**, **NFR-REC500-03**, **NFR-REC500-05**, **CR-REC500-04**  
**UX:** secao 8.3 (ordem de prioridade na classificacao UX), secao 9 (regras de componentes), secao 12 (QA, operacao e runbook), secao 14 (criterios)  
**Arquitetura:** secao 9 (contrato BFF -> frontend), secao 10.2 (Epic 2 condicional), secao 11 (observabilidade), secao 12 (testabilidade), secao 13.2 (fase condicional)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisao** | @architect |
| **quality_gate_tools** | testes automatizados, regressao documental dirigida e gates do repo conforme secao **Gates** desta story |

---

## Nota de governanca do artefato

- O texto canónico da dependência Epic 2 assume **correcao controlada** aprovada. Com **PRD §18 `manter policy vigente`**, a story de runtime governado **não** foi implementada; mesmo assim a **regressão automatizada** do caso híbrido (bloqueio + brownfield) permanece válida e foi entregue neste recorte.
- Quando existir merge de [`story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md), deve acrescentar-se prova do ramo **autorizado** `(a)` sem remover as linhas de bloqueio já automatizadas (`RTCAD-REC500-02` e afins).
- O objetivo e proteger o brownfield; nao e abrir cobertura generica para municipios fora do escopo.

---

## User story

**Como** engenharia/QA do cluster RTCAD,  
**quero** cobrir com testes e regressao dirigida o caso hibrido governado `5002704`,  
**para** garantir que a excecao controlada nao regride o bloqueio atual dos demais municipios nem o contrato existente do fluxo fiscal.

---

## Contexto

- O PRD exige teste automatizado para o ramo `padraoNacionalEnabled = true` combinado com `requiresLogin` e/ou `requiresSenha`.
- A arquitetura lista explicitamente os cenarios minimos de backend e frontend que precisam ser protegidos.
- Mesmo que o frontend continue a receber sucesso operacional normal, a taxonomia publica nao pode regredir para os casos ainda bloqueados.
- Esta story precisa cobrir tambem a documentacao QA ligada ao ramo governado.

---

## Critérios de aceite

### Regressão automatizada

- [x] **AC-REC500-RG-01:** A suite backend cobre a regra governada presente e ausente.
Critério de encerramento: ha casos automatizados para `(a)` `5002704` autorizado, `(b)` `5002704` sem regra governada, `(c)` municipio fora do escopo mantendo bloqueio, e `(d)` preservacao do fluxo `POST` -> `PATCH`.
  - **`(a)`:** *N/A neste recorte* — sem Epic 2 / sem ramo BFF «autorizado» para `5002704` (PRD §18). Quando existir, acrescentar teste dedicado sem remover o bloqueio brownfield.
  - **`(b)` `(c)`:** `evaluateEmpresaCadastroMunicipioPreflight` + serviço HTTP (`5002704` e `3550308` híbridos) + `mei-notas` HTTP.
  - **`(d)`:** preservado por regressão existente (`empresa service reutiliza o mesmo preflight no fallback POST -> PATCH`, `RTCAD-07`); fluxo híbrido continua a não atingir `POST /empresa` quando bloqueado.
- [x] **AC-REC500-RG-02:** A regressao preserva o contrato brownfield.
Critério de encerramento: a cobertura demonstra que `prefeitura_login_required_blocked` continua valido fora do caso governado e que o sucesso controlado usa o contrato publico atual.

### Regressão UX/documental

- [x] **AC-REC500-RG-03:** O recorte QA e a matriz documental refletem o ramo governado.
Critério de encerramento: a matriz QA passa a diferenciar o caminho `governado/aprovado` do caminho `bloqueado`, sem contradizer o estado dos demais municipios.
- [x] **AC-REC500-RG-04:** O frontend nao regrede a classificacao estavel dos cenarios bloqueados.
Critério de encerramento: testes (ou ajustes de UX) demonstram que **REC500-UX-L1** e os requisitos de CTA da spec §9.1 partilhados com **REC500-UX-L4** (sem retry cego como acao principal) nao regredem; com **PRD §18 `manter policy vigente`**, **nao** ha sucesso operacional de cadastro para `5002704` no fluxo nacional neste recorte — apenas bloqueio honesto via `prefeitura_login_required_blocked`.

### Gates

- [x] **AC-REC500-RG-05:** Se o diff final desta story for **apenas** sob `docs/**`, registar nos `Debug Log References` que `npm run lint`, `npm run typecheck` e `npm test` sao **N/A** para esta entrega documental, com justificativa **ou** executar os tres comandos na raiz por disciplina unica da equipa e anexar a saida.
- [x] **AC-REC500-RG-06:** Se existir alteracao fora de `docs/**` (tipico desta story: codigo e testes), executar obrigatoriamente `npm run lint`, `npm run typecheck` e `npm test` na raiz e anexar a saida.

---

## Matriz de rastreabilidade (AC -> Tasks)

| AC | Task principal |
|---|---|
| **AC-REC500-RG-01** | 1 |
| **AC-REC500-RG-02** | 1, 2 |
| **AC-REC500-RG-03** | 3 |
| **AC-REC500-RG-04** | 4 |
| **AC-REC500-RG-05** | 5 |
| **AC-REC500-RG-06** | 5 |

---

## Dev Notes

### File Locations

- `backend/tests/empresa-cadastro-runtime-rec500-regression.test.js`
- `backend/tests/plugnotas-empresa.test.js`
- `backend/tests/mei-notas-empresa-http.test.js`
- `frontend/src/utils/nfEmissionCompany.test.ts`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`
- `frontend/src/lib/fiscalUserError.test.ts`
- `frontend/src/pages/GuidesMei.tsx` *(sem diff — comportamento via testes utilitários)*
- `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`
- `docs/stories/story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md`

### Technical Constraints

- Nao ampliar a cobertura para overrides nao aprovados.
- Nao usar heuristica textual como prova primaria quando houver classificacao estavel do BFF.
- Nao degradar a protecao do bloqueio para municipios ainda nao suportados.
- Se o frontend nao precisar de diff funcional, ainda assim o comportamento esperado deve ficar explicitado na regressao QA.

### Testing

- Cobrir backend unitario e/ou HTTP para o caso governado e para os casos nao governados.
- Cobrir preservacao do fluxo `POST` -> `PATCH` e da taxonomia de erro bloqueado.
- Atualizar a matriz QA para o novo ramo apos [`story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) estar implementada e merged.

---

## Tasks / Subtasks

1. [x] Adicionar cobertura automatizada para a regra governada presente e ausente (AC: **AC-REC500-RG-01**, **AC-REC500-RG-02**).
2. [x] Validar preservacao do comportamento brownfield para municipios fora do escopo (AC: **AC-REC500-RG-02**).
3. [x] Atualizar a matriz QA com o novo ramo governado, se aplicavel (AC: **AC-REC500-RG-03**).
4. [x] Verificar se ha necessidade de teste frontend adicional para o sucesso operacional normal (AC: **AC-REC500-RG-04**).
5. [x] Atualizar esta story com `File list`, notas finais e registro dos gates (AC: **AC-REC500-RG-05**, **AC-REC500-RG-06**).

---

## Registro de Preparacao para Execucao (DoR)

- [ ] [`story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) concluida (regra governada no runtime integrada). **Não satisfeito** enquanto PRD §18 for `manter policy vigente`; regressão P2 entregue na variante documentada em **Nota de governanca**.
- [x] Cenario governado e cenario bloqueado explicitados para a regressao.
- [x] Arquivos de teste alvo identificados.
- [x] Ramo QA documental a atualizar confirmado.

---

## Registro de Pronto para Review (PO Gate)

- [x] **AC-REC500-RG-01** a **AC-REC500-RG-04** satisfeitos (testes e documentacao QA alinhados ao ramo governado).
- [x] `Dev Agent Record` e `File list` atualizados.
- [x] **AC-REC500-RG-05** / **AC-REC500-RG-06** tratados conforme secao **Gates** (N/A com justificativa ou execucao completa).

---

## File list

- [x] `backend/tests/empresa-cadastro-runtime-rec500-regression.test.js` *(novo)*
- [x] `backend/tests/plugnotas-empresa.test.js`
- [x] `backend/tests/mei-notas-empresa-http.test.js`
- [x] `frontend/src/utils/nfEmissionCompany.test.ts`
- [x] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`
- [x] `frontend/src/lib/fiscalUserError.test.ts`
- [x] `frontend/src/pages/GuidesMei.tsx` *(sem alteracao — sem diff funcional requerido)*
- [x] `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`
- [x] `docs/stories/story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

### Manual Review Focus (fallback)

- Cobertura do ramo governado sem regressao global.
- Preservacao do bloqueio brownfield para os demais municipios.
- Coerencia entre testes automatizados e matriz QA.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `backend/tests/empresa-cadastro-runtime-rec500-regression.test.js`
- `backend/tests/plugnotas-empresa.test.js`
- `backend/tests/mei-notas-empresa-http.test.js`
- `frontend/src/utils/nfEmissionCompany.test.ts`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`
- `frontend/src/lib/fiscalUserError.test.ts`
- `docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`
- `docs/stories/story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md`

### Debug Log References

- **AC-REC500-RG-06:** alterações fora de `docs/**` — gates na raiz do repositório (workspace):
  - `npm run lint` — exit `0`
  - `npm run typecheck` — exit `0`
  - `npm run test` — exit `0` *(reexecução pós-correção QA 2026-04-15)*; backend `node:test` **358** pass; frontend Vitest **78** ficheiros de teste pass

### Completion Notes

- Story criada por `@sm` para proteger tecnicamente a eventual excecao controlada de `5002704`.
- **Execução 2026-04-15 (Dex):** com PRD §18 `manter policy vigente`, a suíte fixa o caso híbrido como **`prefeitura_login_required_blocked`**, documenta na matriz o contraste **bloqueado** vs **governado/aprovado** (futuro Epic 2) e acrescenta testes frontend de hints/payload sem credenciais municipais. **`(a) 5002704` autorizado** permanece fora do código até decisão `correcao controlada` + story de runtime governado.
- **Pos-QA 2026-04-15:** redação **AC-REC500-RG-04** alinhada ao PRD §18; teste `fiscalUserError` para CTA §9.1 (L1 / requisitos partilhados com L4).

### Change Log

- 2026-04-14 — Story criada por `@sm` a partir do PRD, da spec de UX e da arquitetura de `REC500`.
- 2026-04-14 — Refinamento PO/SM: IDs `AC-REC500-RG-01` a `06`, gates condicionais (`docs/**` vs codigo), links canonicos em vez de "Story 2.1", matriz AC->Tasks, DoR/PO Gate alinhados, rotulos em `Depende de`.
- 2026-04-15 — Implementacao: testes backend unidade + servico + HTTP `5002704`; testes frontend; matriz `RTCAD-REC500-02` + tabela de ramos; story e gates registados.
- 2026-04-15 — Revisao QA (Quinn): gate **PASS** advisory; matriz `RTCAD-REC500-02` evidência + `QA Results`.
- 2026-04-15 — Pos-QA dev: critério AC-REC500-RG-04 clarificado; `fiscalUserError.test.ts` §9.1 / L1–L4.

---

## QA Results

### Revisão (Quinn / aiox-qa) — 2026-04-15

**Decisão de gate (advisory):** **PASS** — a implementação está alinhada ao **PRD §18 `manter policy vigente`**: regressão automatizada do preflight **híbrido** (`padraoNacionalEnabled` + `requiresLogin`/`requiresSenha`), taxonomia `prefeitura_login_required_blocked`, brownfield fora do IBGE `5002704`, matriz com distinção explícita **bloqueado** vs **governado/aprovado** (futuro), e gates do repositório registados. O **quality gate `@architect`** na tabela *Executor Assignment* permanece para revisão técnica se a equipa o exigir; **`@po`** para aceite formal se aplicável.

---

#### Rastreio por critério de aceite

| AC | Avaliação | Notas |
|----|-----------|--------|
| **AC-REC500-RG-01** | **PASS** | **`(a)`** tratado como **N/A** com rastreio explícito (sem Epic 2 / sem ramo «autorizado») — coerente com PRD §18. **`(b)(c)`** cobertos por [`backend/tests/empresa-cadastro-runtime-rec500-regression.test.js`](../../backend/tests/empresa-cadastro-runtime-rec500-regression.test.js), serviço + HTTP com `5002704` e híbrido `3550308`. **`(d)`** não regrediu: `POST`→`PATCH` permanece coberto por testes pré-existentes (`RTCAD-07`); cenário híbrido continua a não atingir `POST /empresa` quando bloqueado. |
| **AC-REC500-RG-02** | **PASS** | `prefeitura_login_required_blocked` e `runtimeDecision` com semântica híbrida preservada nos novos testes; contrato público não inventa ramo de sucesso para `5002704` neste recorte. |
| **AC-REC500-RG-03** | **PASS** | Matriz: linha `RTCAD-REC500-02` + subsecção *Distinção de ramos REC500*; [`qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`](../qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md) diferencia bloqueado vs governado futuro sem contradizer outros municípios. |
| **AC-REC500-RG-04** | **PASS (com ressalva de redação)** | Novos testes em `nfseNacionalPlugnotasErrorHints` e `nfEmissionCompany` reforçam L1 / fronteira sem credenciais. O texto do AC fala em «sucesso de `5002704`»; com policy vigente o cadastro **não** é sucesso — interpretação correta na entrega: **não há regressão** da classificação estável de bloqueio. Cobertura explícita **REC500-UX-L4** neste diff é limitada; confiança repousa também na suíte fiscal existente. |
| **AC-REC500-RG-05** | **N/A** | Diff inclui código e testes — gate documental-only não aplicável. |
| **AC-REC500-RG-06** | **PASS** | `Debug Log References` com `lint` / `typecheck` / `test`; re-execução **2026-04-15**: `npm run test` exit `0` no workspace. |

#### Observações (não bloqueantes)

- **Follow-up Epic 2:** quando [`story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`](./story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) existir e houver ramo autorizado, é **obrigatório** acrescentar o caso **`(a)`** automatizado sem remover `RTCAD-REC500-02` / provas de bloqueio.
- **Matriz `RTCAD-REC500-02` — coluna evidência:** alinhada na revisão QA para incluir também `nfEmissionCompany.test.ts` (pós-revisão 2026-04-15).
- **DoR:** item Epic 2 runtime permanece não satisfeito por desenho (PRD §18) — já explicitado na story; OK para este gate QA.

---

**Assinatura:** Quinn (Test Architect) — revisão de implementação e consistência com artefactos canónicos; gate **PASS** advisory conforme tabela acima.

### Esclarecimento pós-dev (2026-04-15) — resposta aos apontamentos QA

- **Ressalva AC-REC500-RG-04 (redação):** o critério de aceite na story foi **clarificado** para refletir PRD §18 (`manter policy vigente`) e evitar ambiguidade com «sucesso» de cadastro.
- **REC500-UX-L4:** acrescentado teste em [`frontend/src/lib/fiscalUserError.test.ts`](../../frontend/src/lib/fiscalUserError.test.ts) para CTA §9.1 (sem retry cego como ação principal; requisitos alinhados entre L1 e L4 na spec).
