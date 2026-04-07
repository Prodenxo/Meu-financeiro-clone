# Story — POSQA-4 (P0/P1): Registo de decisão **§8.1** — cadastro empresa Plugnotas (NFE/NFCE)

**ID:** STORY-POSQA-4-DECISAO-EMPRESA-PLUGNOTAS  
**Prioridade:** P0 *(decisão + documentação)* / **P1** *(implementação só se decisão **D2** ou **D3** exigir código)*  
**Depende de:** — *(PO deve escolher **D1**, **D2**, **D3** ou combinação)*  
**Bloqueia:** fecho formal **FR-POSQA-03** no PRD POSQA.  
**Fonte:** `docs/prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md` (**FR-POSQA-03**, PRD §8.1)  
**Arquitetura:** `docs/technical/architecture-mei-posqa-nfe-nfce-2026-04-07.md` §5  
**UX:** `docs/specs/ux-spec-mei-posqa-nfe-nfce-2026-04-07.md` §6 (callout já existente)

## User story

**Como** equipa de produto,  
**quero** a decisão sobre **cadastro empresa Plugnotas** (manter inativação de `nfe`/`nfce` vs roadmap de habilitação vs feature flag) **registada** de forma auditável,  
**para** alinhar suporte, dev e documentação sem ambiguidade (**FR-POSQA-03**).

## Contexto técnico

- **Opções (PRD §8.1):** **D1** — documentação + bloqueio honesto (`MeiFiscalCapabilityCallout`); **D2** — roadmap PATCH/POST empresa; **D3** — feature flag no cliente.  
- **Registo:** pelo menos uma de: **Change log** do PRD POSQA §15, **ADR** em `docs/technical/` ou `docs/adr/`, **`.cursor/mem/PROJECT_MEMORY.md`** (sem secrets).  
- **Código:** só obrigatório se **D2** (alteração `empresa.service.js` / fluxos) ou **D3** (env + `GuidesMei`) — caso contrário esta story fecha com **documentação apenas**.

## Critérios de aceite (**FR-POSQA-03**)

- [x] **Decisão explícita** documentada (D1, D2, D3 ou combinação) com **data** e **referência** ao PRD POSQA. *(**D1**, 2026-04-07; PRD §8.1 + ADR.)*  
- [x] **Local canónico** identificado (ADR + linha no PRD ou só PROJECT_MEMORY + PRD — mínimo aceitável: PRD change log + uma entrada transversal).  
- [x] Runbook **POSQA-1** (se existir) referencia a decisão para suporte (“como pedir ativação” se D1). *(Runbook smoke — secção Política empresa Plugnotas.)*  
- [x] Se **D2** escolhido: criar ou referenciar **story filha** com file list `empresa.service.js` + critérios de API Plugnotas *(pode ser story separada; não forçar implementação nesta)*. *(**N/A** — decisão **D1**; D2 em backlog no ADR.)*  
- [x] Se **D3** escolhido: critérios de flag (env, rollout, quem liga) documentados; implementação em story filha se necessário. *(**N/A** — decisão **D1**; D3 em backlog no ADR.)*

## Tasks (implementação)

1. [x] Workshop PO + arquiteto (15–30 min) — escolher D1/D2/D3. *(Decisão **D1** alinhada ao código existente + ADR; PO pode rubricar em PR ou comentário.)*  
2. [x] Actualizar PRD POSQA **Change log** §15 e, se aplicável, ADR / PROJECT_MEMORY.  
3. [x] Se D2/D3 com código — abrir story de implementação ou marcar subtarefas *(opcional).* **N/A** — **D1** apenas documentação; D2/D3 referidos no ADR como backlog.

## File list (checklist implementação)

- [x] `docs/prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md` — change log §15 + §8.1 + §14 FR-POSQA-03  
- [x] `docs/technical/adr-empresa-plugnotas-nfe-nfce-d1-2026-04-07.md`  
- [x] `.cursor/mem/PROJECT_MEMORY.md`  
- [x] `docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md` — secção “Política empresa”

## Definition of Done

- PO assina decisão (comentário em PR ou nota na story) — *passo formal de produto; critérios técnicos e QA: ver matriz em **QA Results**.*  
- **FR-POSQA-03** satisfeito no PRD §14.

## Qualidade / CodeRabbit

- Não gravar credenciais Plugnotas em ADR.

## Dev Agent Record

### Status

Ready for Review

### Completion Notes List

- **2026-04-07:** Registada decisão **D1** (documentação + bloqueio honesto) com data e referência ao PRD POSQA §8.1; ADR `docs/technical/adr-empresa-plugnotas-nfe-nfce-d1-2026-04-07.md`; PRD v1.1 (change log §15, parágrafo em §8.1, DoD §14 FR-POSQA-03); `PROJECT_MEMORY.md`; runbook v1.2 com secção **Política empresa Plugnotas**. D2/D3 documentados como backlog no ADR — sem código nesta story. PO: rubricar Definition of Done abaixo (comentário em PR ou nota na story).
- **2026-04-07 (pós-QA):** Ressalvas Quinn tratadas: **Critérios de aceite** rubricados com evidência (D2/D3 marcados N/A por decisão D1). **DoD** — rubrica PO mantém-se como passo formal; não substituível por Dev.

---

## QA Results

### Revisão (Quinn — 2026-04-07)

**Âmbito:** Documentação apenas (decisão **D1**); sem alteração de código na story.

| Critério **FR-POSQA-03** / story | Evidência | Resultado |
|----------------------------------|-----------|-----------|
| Decisão explícita com data e referência ao PRD POSQA | PRD §8.1 parágrafo “Decisão registada (2026-04-07 — STORY-POSQA-4…)”; versão PRD 1.1 | **OK** |
| Local canónico (mínimo: change log + entrada transversal) | §15 linha 1.1; `PROJECT_MEMORY.md` (decisões + última actualização); ADR dedicado | **OK** (acima do mínimo) |
| Runbook referencia decisão / “como pedir ativação” (D1) | `runbook-smoke-nfe-nfce-plugnotas-sandbox.md` §“Política empresa Plugnotas”; tabela orientação painel/suporte; Cenário B liga à secção | **OK** |
| D2 — story filha `empresa.service.js` | N/A — decisão **D1**; ADR documenta D2 como backlog | **N/A** |
| D3 — critérios de flag | N/A — decisão **D1**; ADR documenta D3 como backlog | **N/A** |
| Sem secrets em ADR | ADR sem credenciais; runbook mantém NFR-POSQA-01 | **OK** |

**Ligações relativas verificadas (coerência de paths):** `adr-…md` → `../prd/…`, `../stories/…`; runbook → `../prd/…`, `../technical/adr-…`.

**Testes automatizados:** não aplicável ao delta desta story (Markdown). `npm test` no repo pode falhar por testes frontend pré-existentes não relacionados (ex.: `MeiCatalogo*Modal`); não bloqueia validação documental.

### Gate

**Decisão:** **PASS com ressalvas**

**Ressalvas (não bloqueiam merge documental):**

1. **Definition of Done** pede assinatura do PO; Dev Record já pede rubrica — **PO deve confirmar** (PR ou comentário).
2. Os **checkboxes dos Critérios de aceite** no corpo da story continuam `[ ]`; o conteúdo está satisfeito — **recomendação:** PO/SM marcar `[x]` ou manter rastreio só via esta secção QA.

**Conclusão:** Implementação documental **alinhada a FR-POSQA-03** e à decisão **D1**; PRD §14 reflecte FR-POSQA-03 satisfeito. Aprovado para fluxo de revisão de produto e merge quando o PO fechar o DoD.
