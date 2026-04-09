# Story — FR-BRIEFOP (P1): Rastreio documental — PRD / spec UX / arquitectura **briefing de ação** (400 prefeitura / 404 GET)

**ID:** STORY-FR-BRIEFOP-P1-DOC-RASTREIO-BRIEFING-PRD-UX-ARCH  
**Prioridade:** P1  
**Depende de:** Nenhuma *(complementa [story-fr-prefb-p1-operacao-mei-nfse-env-trilho-b-derive-ibge.md](./story-fr-prefb-p1-operacao-mei-nfse-env-trilho-b-derive-ibge.md) — pode correr em paralelo se não houver conflito de secção)*  
**Relaciona com:** [PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md](../prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md) — **FR-BRIEF-OP-01** a **FR-BRIEF-OP-06** (rastreio); critérios §9  
**Fonte PRD:** [`docs/prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md)  
**UX:** [`docs/specs/ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../specs/ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md) — secção 6 (checklist doc equipas), **BRIEF-OP-UX**  
**Arquitetura:** [`docs/technical/architecture-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../technical/architecture-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md) — triagem, superfícies, §8 rastreio **FR-BRIEF-OP-***  
**Brief:** [`docs/brief/briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../brief/briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md)

**Estimativa:** **S** — só documentação; ordem de grandeza **menos de 1 h** *(exclui resolução de conflitos de merge se outra story editar a mesma secção em paralelo).*  
**Backlog:** **Ready for development** — critérios de aceite e DoD fechados; **grooming @po** em **2026-04-09** *(avaliação quantitativa: acta / comentário de refinamento, não neste ficheiro).* *Se o @po reabrir grooming, actualizar esta linha.*

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | Revisão de links; verificação manual dos três links no runbook (**DoD QA**); `npm run lint` se tocar apenas docs (geralmente N/A) |
| **revisão** | @po — paridade runbook ↔ PRD briefing; @architect — coerência com `architecture-briefing-acao-…` |

---

## User story

**Como** membro da equipa que usa o runbook `docs/operacao-mei-nfse.md`,  
**quero** ligações explícitas ao **PRD briefing**, à **spec UX briefing** e à **arquitectura briefing** (programa operacional **FR-BRIEF-OP-***),  
**para** encontrar requisitos formais, guardrails de UX e diagramas de triagem sem procurar só pelo brief curto.

---

## Contexto

- A subsecção **Trilho B** (`#prefb-trilho-b-env-derive-ibge`) em `operacao-mei-nfse.md` já cobre trilho B e **FR-PREFB**; este incremento fecha o **rastreio** dos artefactos **briefing PRD / UX / arquitectura** aprovados pelo PM e pelo **@architect**.  
- **Não** duplicar parágrafos longos: **ponteiros** + uma linha de propósito por artefacto.  
- **NFR-BRIEF-OP-01:** sem PII nem secrets.

### Convenção de links (evitar PR com links partidos)

- Os links na **implementação** em `docs/operacao-mei-nfse.md` são relativos **à pasta `docs/`** (o ficheiro está em `docs/operacao-mei-nfse.md`). Usar por exemplo:  
  - `prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`  
  - `specs/ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`  
  - `technical/architecture-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`  
- **Não** copiar caminhos `../prd/...` desta story (paths válidos **desde** `docs/stories/`, não desde o runbook).

---

## Critérios de aceite

### `docs/operacao-mei-nfse.md`

- [x] Na secção do trilho B / PREFB (ou bloco imediatamente após), existe um bullet ou subsecção curta **“Programa briefing (FR-BRIEF-OP)”** com **três** links Markdown, relativos a `docs/`, para os ficheiros:  
  - `prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md` (PRD formal do programa briefing)  
  - `specs/ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md` (guardrails UX)  
  - `technical/architecture-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md` (triagem / superfícies)  
- [x] Cada entrada tem **uma linha curta** de propósito (requisitos / UX / arquitectura), sem colar parágrafos longos dos artefactos.

### `docs/brief/briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`

- [x] **Passo obrigatório antes de editar:** abrir o ficheiro e verificar se já existe ligação explícita ao PRD formal `docs/prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md` (metadados após título ou secção “Onde está documentado” / equivalente).  
- [x] **Se já existir:** não duplicar; registar em **Dev Agent Record → Notes** uma linha `Brief PRD formal: já presente (N/A)` e marcar este critério como cumprido sem diff no brief.  
- [x] **Se não existir:** acrescentar **uma** ligação clara ao PRD formal (caminho relativo correcto **desde** `docs/brief/`: `../prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`).

### Qualidade

- [x] Todos os links novos/alterados resolvem no repositório (Markdown válido).  
- [x] Sem PII nem secrets.

### Definition of Done (QA)

- [x] **@qa:** com o branch à frente, abrir `docs/operacao-mei-nfse.md` no preview Markdown (ou IDE) e **clicar/abrir** os três links do bloco **Programa briefing (FR-BRIEF-OP)** — todos devem abrir o ficheiro certo.  
- [x] Se o brief tiver sido alterado: confirmar que o link ao PRD formal abre o PRD briefing.

---

## Tasks (indicativas)

1. [x] Inserir bloco de rastreio em `operacao-mei-nfse.md` com caminhos relativos a `docs/` (ver **Convenção de links**).  
2. [x] Executar verificação **brief ↔ PRD formal** (feito vs N/A) e agir conforme critérios de aceite do brief.  
3. [x] **File list** + **Dev Agent Record** (incluir linha N/A se aplicável) + change log.  
4. [x] Handoff: @qa valida **Definition of Done (QA)**.

---

## File list (indicativo)

- `docs/operacao-mei-nfse.md`  
- `docs/brief/briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md` *(se necessário)*

---

## CodeRabbit Integration

- N/A para código de aplicação.

---

## Dev Agent Record

### Status

Done

### File list

- `docs/operacao-mei-nfse.md` — subsecção **Programa briefing (FR-BRIEF-OP)** após Trilho B (âncora `#prefb-trilho-b-env-derive-ibge`).
- `docs/brief/briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md` — linha **PRD formal (programa briefing — FR-BRIEF-OP)** no cabeçalho.

### Notes

- Brief: **não** era N/A — faltava ligação explícita ao PRD formal; **acrescentada** uma linha com `../prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`.
- Gates: `npm run lint`, `npm run typecheck`, `npm test` na raiz — **verde** (2026-04-09).
- Pós-**@qa:** gate **PASS** (2026-04-09); ver tabela e DoD em **QA Results**. Task 4 (handoff QA) concluída pelo **@dev** após revisão.

### Change Log

- 2026-04-09 — Story criada pelo @sm a partir do **PRD briefing**, **spec UX briefing** e **arquitectura briefing**.  
- 2026-04-09 — Refinamento @sm com critérios @po: convenção de paths desde `operacao-mei-nfse.md`, critério binário brief (feito vs N/A + nota em Dev Agent Record), **DoD QA** (abrir os três links).  
- 2026-04-09 — Refinamento @sm com sugestões opcionais @po: **Estimativa S (menos de 1 h)**, linha **Ready for development** + nota de re-grooming.  
- 2026-04-09 — Refinamento @sm com critério @po: linha **Backlog** sem nota numérica fixa; grooming datado; avaliação em acta/comentário.  
- 2026-04-09 — **@dev:** implementação — bloco **Programa briefing (FR-BRIEF-OP)** em `operacao-mei-nfse.md`; PRD formal no `briefing-acao-…md`; gates na raiz verdes.  
- 2026-04-09 — **@dev:** pós-QA — task 4 marcada; **Status** → **Done**; critérios de aceite marcados **[x]** alinhados à revisão **@qa** (gate **PASS** em **QA Results**).

---

## QA Results

### Revisão @qa (2026-04-09)

**Story:** `STORY-FR-BRIEFOP-P1-DOC-RASTREIO-BRIEFING-PRD-UX-ARCH`  
**Âmbito:** documentação (`docs/operacao-mei-nfse.md`, `docs/brief/briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`).

#### Rastreio aos critérios de aceite

| Critério | Evidência |
|----------|-----------|
| Subsecção **Programa briefing (FR-BRIEF-OP)** após Trilho B | Presente em `operacao-mei-nfse.md` (após bullets do trilho B, antes de `#cadastro-post-404-get-empresa`). Três links relativos a `docs/`: `prd/…`, `specs/…`, `technical/…`. |
| Uma linha de propósito por artefacto | Cada bullet descreve PRD / UX / arquitectura; parágrafo introdutório curto + link ao brief curto. |
| Brief — PRD formal | Linha **PRD formal (programa briefing — FR-BRIEF-OP)** com `../prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`. |
| Links resolvem no repo | Ficheiros alvo confirmados em `docs/prd/`, `docs/specs/`, `docs/technical/`; link do brief para `docs/prd/…` válido. |
| NFR-BRIEF-OP-01 | Sem PII nem secrets nos diffs revistos. |

#### Definition of Done (QA)

- **Três links** do bloco **Programa briefing (FR-BRIEF-OP):** caminhos relativos desde `docs/operacao-mei-nfse.md` verificados por resolução para ficheiros existentes (equivalente funcional a abrir no IDE/preview).
- **Brief alterado:** link ao PRD formal aponta para `PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md` em `docs/prd/`.

#### Gates (confiança no registo @dev)

- **Dev Agent Record → Notes** indica `npm run lint`, `npm run typecheck`, `npm test` na raiz **verde** (2026-04-09). **Não** foi reexecutada a suite nesta revisão; risco **baixo** (só Markdown).

#### Decisão de gate

**PASS** — implementação alinhada à story; critérios de aceite e DoD satisfeitos para entrega documental.

#### Seguimento processual (não bloqueante)

- Marcar **task 4** e checkboxes de **critérios de aceite** na story fica a cargo de **@dev** / **@sm** / **@po** conforme convenção do repo *(secções fora do âmbito de edição do @qa)*.

---

*(revisão: Quinn @qa)*
