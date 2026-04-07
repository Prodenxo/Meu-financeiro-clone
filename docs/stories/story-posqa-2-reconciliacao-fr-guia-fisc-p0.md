# Story — POSQA-2 (P0): Reconciliação **story FR-GUIA-FISC P0** com código e testes (pós-POSQA)

**ID:** STORY-POSQA-2-RECONCILIACAO-GUIA-FISC-P0  
**Prioridade:** P0  
**Depende de:** — *(processo de backlog; pode correr em paralelo a POSQA-1 e POSQA-3)*  
**Bloqueia:** **FR-POSQA-04** no PRD POSQA; transparência de planeamento para PO/SM.  
**Fonte:** `docs/prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md` (**FR-POSQA-04**, PRD §8.3)  
**Arquitetura:** —  
**UX:** —

## User story

**Como** PO ou Scrum Master,  
**quero** a story **FR-GUIA-FISC P0** (`story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md`) **reconciliada** com o estado actual do repositório (código + testes + notas de dev),  
**para** que checkboxes e critérios reflitam o que está **feito** vs **aberto** (ex.: P1 `localStorage`), sem duplicar requisitos do PRD funcional (**FR-POSQA-04**).

## Contexto técnico

- **Story alvo:** `docs/stories/story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md` — **Dev Agent Record**, **QA Results** e, após POSQA-2, secção **«Reconciliação 2026-04-07 (POSQA)»** com referência ao PRD POSQA (PRD §8.3 / **FR-POSQA-04**).  
- **Referências de verdade:** `GuidesMei.tsx`, componentes em `frontend/src/components/mei/`, `GuidesMei.permissions.test.tsx`, `meiNotasService.test.ts`.  
- **Não implementar código** nesta story — apenas documentação e checkboxes.

## Critérios de aceite (**FR-POSQA-04**)

- [x] Secção nova **“Reconciliação 2026-04-07 (POSQA)”** (ou data atual) no topo ou após **User story** da story FR-GUIA-FISC P0, com:  
  - [x] Referência explícita a `PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md`.  
  - [x] Tabela ou lista: **critério PRD/UX** → **estado** (entregue / parcial / Não aplicável) → **evidência** (ficheiro de teste ou componente).  
- [x] Checkboxes do corpo da story **actualizados** onde o código já satisfaz o critério (marcar `[x]` com nota breve se necessário).  
- [x] Itens **P1** explicitamente deixados em aberto com **ID** ou referência a story filha (ex.: persistência último tipo em `localStorage`).  
- [x] **Não** apagar histórico útil (**Dev Agent Record**, **QA Results**) — apenas acrescentar reconciliação.

## Tasks (implementação)

1. [x] Ler story FR-GUIA-FISC P0 e comparar com `GuidesMei` + testes listados no Dev Record.  
2. [x] Inserir secção de reconciliação e marcar checkboxes conforme verificação.  
3. [ ] Se PO exigir, abrir story filha mínima para itens P1 pendentes *(opcional — ID de backlog `FR-GUIA-FISC-01-P1-last-emission-type-storage` registado na reconciliação; sem novo ficheiro de story neste entregável)*.

## File list (checklist implementação)

- [x] `docs/stories/story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md` *(único ficheiro obrigatório)*

## Definition of Done

- Revisão por PO ou SM (ou dev lead) de que a reconciliação está **honesta**.  
- PRD POSQA §14 — **FR-POSQA-04** satisfeito.

## Qualidade / CodeRabbit

- Não aplicável a código; diff apenas Markdown.

## Dev Agent Record

### Status

Ready for Review

### Completion Notes List

- Secção **«Reconciliação 2026-04-07 (POSQA)»** adicionada após **User story** em `story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md`, com referência ao PRD POSQA e tabela critério → estado → evidência.  
- Checkboxes dos critérios de aceite actualizados: P0 alinhado a código + QA 2026-04-06; único item **em aberto**: P1 persistência último tipo em `localStorage` (**ID backlog** `FR-GUIA-FISC-01-P1-last-emission-type-storage`).  
- **Dev Agent Record** e **QA Results** da story FR-GUIA-FISC P0 mantidos; sem remoção de histórico.  
- Task 3 (story filha opcional) não executada — backlog documentado na reconciliação para PO/SM abrirem story quando priorizarem.  
- **Seguimento QA (2026-04-07):** gate **PASS** no artefacto documental (**FR-POSQA-04**); observação QA — **DoD** do corpo da story ainda prevê **revisão PO/SM** («reconciliação honesta»). Acrescentada **rubrica PO/SM** abaixo para fecho explícito; até lá o estado permanece «pronto para rubrica», não substitui a aceitação humana. **CodeRabbit:** N/A (diff só Markdown; alinhado a «Qualidade / CodeRabbit» da story).

### Rubrica PO/SM — DoD (preencher)

| Campo | Valor |
|--------|--------|
| Data (AAAA-MM-DD) | |
| Nome / papel (PO, SM ou dev lead) | |
| Confirmo que a reconciliação na story alvo reflecte honestamente o estado do repo (**sim** / **não** / **n/a**) | |
| Notas | |

### File List (final)

- `docs/stories/story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md`

---

## QA Results

### Revisão QA — 2026-04-07 (Quinn)

**Decisão de gate:** **PASS**

#### Rastreio — critérios de aceite (**FR-POSQA-04**, story POSQA-2)

| Critério | Veredicto | Evidência / notas |
|----------|-----------|---------------------|
| Secção **«Reconciliação 2026-04-07 (POSQA)»** após **User story** na story alvo | **Satisfeito** | `story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md` — secção presente com data e ligação à POSQA-2. |
| Referência ao PRD POSQA | **Satisfeito** | Link relativo a `PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md` + menção a **FR-POSQA-04** / §8.3. |
| Tabela critério PRD/UX → estado → evidência | **Satisfeito** | Tabela com linhas por FR/UX; estados **Entregue** / **Em aberto** coerentes com revisão QA anterior (2026-04-06) e ficheiros citados. |
| Checkboxes do corpo da story FR-GUIA-FISC P0 actualizados | **Satisfeito** | Critérios P0 marcados `[x]` com notas curtas; P1 `localStorage` explícito `[ ]` com ID **`FR-GUIA-FISC-01-P1-last-emission-type-storage`**. |
| P1 em aberto com ID / referência story filha | **Satisfeito** | Secção «Itens P1 explicitamente em aberto» + linha na tabela; Task 3 da POSQA-2 permanece opcional (aceitável). |
| Preservação de histórico | **Satisfeito** | **Dev Agent Record** e **QA Results** (2026-04-06) da story FR-GUIA-FISC P0 intactos por baixo da nova secção. |

#### Integridade documental

- **Sem código** alterado nesta story — alinhado ao âmbito; **NFR-POSQA-01** (secrets) não aplicável ao diff.
- **DoD** da POSQA-2 ainda prevê **revisão PO/SM** («reconciliação honesta») — recomenda-se confirmação formal; o gate **PASS** cobre **entregável documental** e rastreio.

#### Testes / automação

- **N/A** (Markdown apenas).

**CodeRabbit:** não executado nesta revisão (documentação).

— Quinn, guardião da qualidade 🛡️
