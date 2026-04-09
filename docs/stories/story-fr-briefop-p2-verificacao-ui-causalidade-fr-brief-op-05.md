# Story — FR-BRIEFOP (P2): Verificação UX — causalidade **POST → GET** (**FR-BRIEF-OP-05** / **BRIEF-OP-UX**)

**ID:** STORY-FR-BRIEFOP-P2-VERIFICACAO-UI-CAUSALIDADE-FR-BRIEF-OP-05  
**Prioridade:** P2  
**Depende de:** Opcional — [story-fr-briefop-p1-doc-rastreio-artefactos-briefing-prd-ux-arch.md](./story-fr-briefop-p1-doc-rastreio-artefactos-briefing-prd-ux-arch.md) *(doc-only, sem bloqueio técnico)*  
**Fonte PRD:** [`docs/prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md) — **FR-BRIEF-OP-05**  
**UX:** [`docs/specs/ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../specs/ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md) — §4.4, §8 (QA UX), **BRIEF-OP-UX-L1**  
**Arquitetura:** [`docs/technical/architecture-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../technical/architecture-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md) — §5 plano de apresentação  
**Relaciona com:** [`ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](../specs/ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) — **SOL**; [`ux-spec-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../specs/ux-spec-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) — **PREFB** / regressão

**Estimativa:** **S** — auditoria + testes, **sem diff** de código *(típico: menos de 2 h)*. **M** — ajuste de copy ou ordem de mensagens em **mais do que um** ficheiro ou fluxo *(típico: até meio dia; escalar se surgir refactor).*  
**Backlog:** **P2** — priorização e “ready for development” na **ferramenta de backlog / acta @po** *(não neste ficheiro).* *Re-grooming: actualizar decisão de prioridade fora do repo.*

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | Ver **Gates** abaixo; DoD QA (manual se necessário). |
| **revisão** | @ux-design-expert — alinhamento **BRIEF-OP-UX**; @architect — sem violação da fronteira FE (sem env no cliente) |

---

## User story

**Como** utilizador MEI na Guia MEI após falha de cadastro empresa seguida de consulta sem registo,  
**quero** que a interface **não** sugira que o **404** / “não encontrámos empresa” é o problema principal **sem** contexto de falha do **POST**,  
**para** alinhar a **FR-BRIEF-OP-05** e a narrativa **SOL** já definida nas specs.

---

## Contexto

- **Won’t** do PRD briefing: **não** implementar credenciais de prefeitura nem nova derivação — só **verificação** e ajuste **mínimo** de copy se QA encontrar gap.  
- Ficheiros de referência: `GuidesMei.tsx`, `nfseNacionalPlugnotasErrorHints.ts`, painéis SOL/PREF existentes.  
- Se **nenhum** gap for encontrado, a story fecha com **“sem diff”** + nota no Dev Agent Record.

---

## Critérios de aceite

### Causalidade **FR-BRIEF-OP-05** (conteúdo)

- [x] Revisão estática (e/ou testes existentes) confirma que não há *string* que inverta a causalidade **POST falho → GET 404** — validar contra [`ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../specs/ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md), secções **4.4** e **8** (primeiro bullet de QA UX).  
- [x] **Anti-padrão (não cumprir):** mensagens que façam o utilizador crer que o problema é **só** a consulta / **404** / “não encontrámos empresa” **sem** contexto de que o **cadastro (POST)** falhou ou não concluiu — alinhado à tabela da spec (cenário **400** seguido de **404** ou equivalente) e à verificação de regressão na **mesma spec**, secção **4.4** (*strings* que mencionem **404** ou “consulta” **não** devem aparecer **antes** ou **sem** contexto de falha de **POST** quando o fluxo veio de cadastro falhado).

### Regressão e privacidade

- [x] Variante **prefeitura-config** / testes `nfseNacionalPlugnotasErrorHints` permanecem alinhados à **ux-spec PREFB** (**FR-PREFB-QA-01**) após qualquer alteração.  
- [x] Estados **SOL** (quando aplicável) permanecem coerentes com [`ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](../specs/ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md).  
- [x] **NFR-BRIEF-OP-01:** nenhum texto novo incentiva partilha de PII em canais públicos.

### Gates (qualidade de código)

- [x] Conforme [`AGENTS.md`](../../AGENTS.md) na **raiz do repositório**: `npm run lint`, `npm run typecheck`, `npm test`. Os scripts da raiz delegam a **workspaces** (`frontend`, `backend`) — ver [`package.json`](../../package.json) na raiz.  
- [x] **Sem diff** de código: documentar **N/A** nos gates (ou correr na mesma a suite na raiz e registar verde) no **Dev Agent Record**. **Com diff** só em `frontend/`: a mesma suite na raiz continua a ser o gate canónico do projeto; se falhar noutro workspace **sem** relação com este PR, escalar com **@qa**.

### Definition of Done (QA)

- [x] **@qa:** confirmar paridade com [`ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../specs/ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md), secção **8** (causalidade, compatibilidade PREFB, SOL).  
- [x] Se os testes automatizados **não** cobrirem o cenário **400 → 404**, **spot-check** manual na Guia MEI (fluxo cadastro falho + consulta) ou evidência equivalente acordada com **@qa**.

---

## Tasks (indicativas)

1. [x] Auditar `GuidesMei.tsx` e fluxos de mensagem 404 vs 400 no contexto cadastro empresa (conforme spec UX briefing §10).  
2. [x] Correr / rever `nfseNacionalPlugnotasErrorHints.test.ts` (e painéis relacionados se aplicável).  
3. [x] Se gap: diff **mínimo** de copy ou ordem de mensagens; caso contrário documentar “nenhuma alteração necessária”.  
4. [x] **File list** + **Dev Agent Record** + change log.  
5. [x] Handoff: **@qa** valida **Gates** e **Definition of Done (QA)**.

---

## File list (indicativo)

- `frontend/src/pages/GuidesMei.tsx` *(se alteração)*  
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` *(se alteração)*  
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts` *(se alteração)*

---

## CodeRabbit Integration

- Se houver diff TSX: revisão de regressão em heurísticas PREF/SOL.

---

## Dev Agent Record

### Status

Done

### File list

- `frontend/src/components/PlugnotasEmpresaCadastroSolContextPanel.tsx` — `aria-label` SOL-L1 (cadastro antes da consulta; FR-BRIEF-OP-05).
- `frontend/src/components/PlugnotasEmpresaCadastroSolContextPanel.test.tsx` — teste de ordem cadastro vs consulta no `aria-label`.

### Notes

- **Auditoria:** `GuidesMei.tsx` já aplica `withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable` nos erros de consulta/sincronização empresa quando `plugnotasPendingRetry` ou flag de sessão fase 2; textos SOL em `plugnotasEmpresaCadastroSolUx.ts` priorizam cadastro. Sem gap em *strings* visíveis que invertam POST→GET.
- **Diff mínimo:** apenas nome acessível da região SOL-L1 (antes: consulta primeiro no `aria-label`).
- **Gates (raiz):** `npm run lint`, `npm run typecheck`, `npm test` — **verde** (2026-04-09).
- Pós-**@qa:** gate **PASS** (2026-04-09); ver **QA Results** — paridade secção **8**; spot-check manual **WAIVED** com evidência equivalente (documentado pelo @qa).

### Change Log

- 2026-04-09 — Story criada pelo @sm a partir do **PRD briefing**, **spec UX briefing** e **arquitectura briefing**.  
- 2026-04-09 — Refinamento @sm com critérios @po: **Estimativa S/M**, **Backlog P2** (prioridade fora do ficheiro), **anti-padrão** + âncoras **§4.4 / §8** da spec UX briefing, **Gates** via **AGENTS.md** + workspaces na raiz, **DoD QA** + spot-check manual opcional, task de handoff **@qa**.  
- 2026-04-09 — **@dev:** auditoria FR-BRIEF-OP-05; ajuste mínimo **aria-label** SOL-L1 + teste; suite na raiz verde.  
- 2026-04-09 — **@dev:** pós-QA — task **5** e **Definition of Done (QA)** marcados; **Status** → **Done** (gate **PASS** em **QA Results**).

---

## QA Results

### Revisão @qa (2026-04-09)

**Story:** `STORY-FR-BRIEFOP-P2-VERIFICACAO-UI-CAUSALIDADE-FR-BRIEF-OP-05`

#### Rastreio aos critérios (spec UX briefing secção **8**)

| Tema | Verificação |
|------|-------------|
| **Causalidade (primeiro bullet §8)** | **PASS** — `PlugnotasEmpresaCadastroSolContextPanel.tsx`: `REGION_LABEL_L1` passa a priorizar **cadastro** antes de **consulta** no `aria-label` da região SOL-L1; comentário **FR-BRIEF-OP-05**. Texto visível continua a usar `PLUGNOTAS_SOL_L1_TITLE` / `PLUGNOTAS_SOL_L1_BODY` (`plugnotasEmpresaCadastroSolUx.ts`), já alinhados ao encadeamento POST→GET. |
| **Compatibilidade PREFB** | **PASS** — sem alterações a `nfseNacionalPlugnotasErrorHints.ts` / testes de variante **prefeitura-config**; regressão **FR-PREFB-QA-01** não afectada pelo diff. |
| **SOL** | **PASS** — alteração limitada ao nome acessível L1; estados L2/L3 inalterados. |

#### Testes

- Novo teste em `PlugnotasEmpresaCadastroSolContextPanel.test.tsx`: garante que **cadastro** aparece antes de **consulta** no `aria-label` — cobre o anti-padrão em superfície de teste automatizado.
- Confiança no registo **@dev:** suite na raiz (`lint` / `typecheck` / `test`) **verde**; **não** reexecutada nesta revisão.

#### Definition of Done (QA) — story

- **Paridade secção 8:** cumprida pelo rastreio acima.
- **Spot-check manual Guia MEI (400→404):** **WAIVED** com evidência equivalente — cobertura por (1) teste de regressão do `aria-label`, (2) notas de auditoria **@dev** sobre `withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable` em `GuidesMei.tsx` e copy SOL existente, (3) ausência de mudanças em heurísticas PREF além do painel SOL. *Recomendação opcional:* smoke manual antes de release se houver alteração de copy adicional na mesma área.

#### NFR-BRIEF-OP-01

- **PASS** — diff sem novos textos que incentivem PII em canais públicos.

#### Decisão de gate

**PASS** — implementação adequada à story; risco residual **baixo**.

#### Seguimento

- **@dev** / **@sm:** marcar **task 5** e checkboxes **Definition of Done (QA)** na story *(fora do âmbito de edição do @qa)*.

---

*(revisão: Quinn @qa)*
