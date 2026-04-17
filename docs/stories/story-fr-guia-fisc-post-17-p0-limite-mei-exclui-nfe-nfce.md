# Story — FR-GUIA-FISC-17 (P0): Limite MEI — exclusão de NF-e e NFC-e do somatório (UI + agregação)

**ID:** STORY-FR-GUIA-FISC-POST-17-LIMITE-MEI  
**Prioridade:** P0  
**Epic:** Epic 2 — Consolidação pós-brainstorm (`docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md`)  
**Depende de:** [story-fr-guia-fisc-p0-lista-filtro-tipos-documento.md](./story-fr-guia-fisc-p0-lista-filtro-tipos-documento.md) (lista com `document_type`); baseline do bloco de limite no Guia MEI — [story-lim-mei-03-integracao-guidesmei-refresco-pos-nfse.md](./story-lim-mei-03-integracao-guidesmei-refresco-pos-nfse.md) *(dependência branda: se o bloco já estiver integrado em `GuidesMei`, esta story ajusta agregação + copy; caso contrário, alinhar ordem com PO)*  
**Bloqueia:** —  
**Fonte:** `docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md` (**FR-GUIA-FISC-17**)  
**UX:** `docs/specs/ux-spec-guia-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §9  
**Arquitetura:** `docs/technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §8  
**QA (opcional):** `docs/qa/plugnotas-multitipo-checklist.md` — actualizar quando este incremento fechar, se aplicável.

## User story

**Como** utilizador MEI,  
**quero** que o **limite de faturamento** mostrado no Guia MEI **não inclua** valores de notas **NF-e** e **NFC-e** no agregado,  
**para** não interpretar incorrectamente o teto do MEI (**FR-GUIA-FISC-17**), até decisão futura de produto.

## Contexto técnico

- **Backend:** [`agregarLimiteFaturamento`](../../backend/src/services/mei-notas.service.js) e [`meiLimitePayloadSum.js`](../../backend/src/utils/meiLimitePayloadSum.js) — somatório restrito a **`NFSE`** (e `null` se aplicável), conforme [architecture pós-brainstorm §8](../technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md) e [architecture baseline §4](../technical/architecture-mei-emissao-nfe-nfce-guia-2026-04-06.md#4-listagem-e-filtros--get-mei-notas). **Não** incluir `NFE` / `NFCE` até PRD futuro explícito.  
- **Frontend:** [`meiLimiteFaturamento.ts`](../../frontend/src/utils/meiLimiteFaturamento.ts) / [`MeiLimiteFaturamentoBlock.tsx`](../../frontend/src/components/MeiLimiteFaturamentoBlock.tsx) — paridade com backend; preferir **uma** função utilitária `isDocumentTypeMeiLimiteRelevante(docType)` (architecture §8.2).  
- **Listagem:** valores de NFE/NFC-e **podem** continuar visíveis na **tabela** de histórico; **não** entram no *widget* de limite (UX §9.2).

## BDD (aceite)

| Cenário | Dado | Quando | Então |
|--------|------|--------|--------|
| Agregado do limite | Existem notas **NFSE**, **NFE** e **NFCE** no período | O sistema calcula o progresso do limite MEI | O valor **principal** (barra, % ou total do *widget*) considera **apenas** linhas relevantes para o limite (**NFSE**; regra alinhada ao backend). |
| Transparência | Utilizador vê o bloco de limite | Consulta *footnote* / **«Como calculamos»** (UX §9.3) | Copy indica que **NF-e** e **NFC-e** **não** entram no somatório (texto aprovado ou *placeholder* PO — UX §9.2). |
| Lista completa | Mesmas notas na lista | Utilizador percorre a tabela de histórico | NFE/NFC-e **continuam** listadas com os seus valores; **sem** esconder o histórico (UX §9.2). |

## Âmbito

| Must | Could | Fora |
|------|-------|------|
| Paridade backend ↔ cliente no somatório do limite; **NFSE** only para agregado | *Wording* legal refinado numa passagem PO posterior | Incluir NFE/NFCE no teto MEI sem novo PRD |
| *Footnote* ou **«Como calculamos»** acessível (UX §9.3) | Duplicar explicação noutros relatórios do mesmo ecrã se já existirem | Alterar regras fiscais fora do texto PRD |
| Testes de regressão com notas mistas | | Remover colunas NFE/NFCE da listagem |

## Definition of Ready

*(Fecho retroativo na implementação — alinhado ao *refinement* técnico e à revisão QA.)*

- [x] [P0 lista](./story-fr-guia-fisc-p0-lista-filtro-tipos-documento.md) e tipos **NFSE/NFE/NFCE** compreendidos pela equipa.  
- [x] **Copy** do *tooltip* / *footnote* / **«Como calculamos»** — texto informativo entregue; *wording* legal fino em passagem PO posterior (**Could**; ver *Completion Notes*).  
- [x] Confirmado: `meiLimitePayloadSum.js` e `meiLimiteFaturamento.ts` são os pontos de paridade (`isDocumentTypeMeiLimiteRelevante`).  
- [x] **Owner QA:** delegação + roteiro em **Dev Agent Record → Roteiro QA manual (staging)**; preenchimento de nome/data na execução.

## Critérios de aceite

### (a) Agregação e paridade

- [x] O valor **principal** do limite (barra, percentagem ou total exibido no *widget*) **não** incorpora registos com `document_type` **NFE** nem **NFCE** (apenas **NFSE** / regra backend).  
- [x] Com notas **mistas** na lista, o agregado do limite **coincide** com a regra do servidor (`GET` agregado ou paridade documentada cliente/servidor).  
- [x] **Sem** alterar a listagem completa: NFE/NFC-e **continuam** visíveis na tabela de histórico com valores (UX §9.2).

### (b) Copy e acessibilidade

- [x] **Footnote** ou **tooltip** no ícone de informação **e/ou** botão **«Como calculamos»** (UX §9.3) explica a exclusão de NF-e/NFC-e; equivalente para **teclado** (*popover* focável — UX §9.3).  
- [x] Texto final alinhado ao **PO** (UX §9.2); se *placeholder*, registado nas *Completion Notes*.

### (c) Qualidade

- [x] Testes: regressão com lista mista (unitário `meiLimiteFaturamento` / `meiLimitePayloadSum` + smoke UI se aplicável); gates `AGENTS.md`.  
- [x] **NFR-POST-02:** mensagens e logs **sem PII**; sem *console.log* de payloads em produção (UX §10 / NFR).

## Tasks (implementação)

1. [x] Auditar `agregarLimiteFaturamento` / `meiLimitePayloadSum.js` e `meiLimiteFaturamento.ts` + `GuidesMei.tsx` / `MeiLimiteFaturamentoBlock.tsx` para todas as agregações.  
2. [x] Centralizar regra (`isDocumentTypeMeiLimiteRelevante` ou equivalente) — **uma** fonte de verdade no cliente alinhada ao backend.  
3. [x] Implementar *footnote* / **«Como calculamos»** conforme UX §9.2–§9.3.  
4. [x] Testes + gates `AGENTS.md`.

## QA manual (obrigatório)

| # | Acção | Resultado esperado |
|---|--------|---------------------|
| 1 | Dados: pelo menos uma NFS-e, uma NF-e e uma NFC-e no ano | *Widget* de limite **não** soma NFE/NFCE; coincide com API agregada ou regra documentada. |
| 2 | Abrir **«Como calculamos»** / *tooltip* | Copy correcta; focável por teclado (UX §9.3). |
| 3 | Ver tabela de notas | Linhas NFE/NFC-e **com** valores; sem dupla contagem no *widget*. |

**Multitipo:** cruzar com [`docs/qa/plugnotas-multitipo-checklist.md`](../qa/plugnotas-multitipo-checklist.md) se o checklist incluir cenário de limite.

*Owner QA:* preencher **uma única vez** em **Dev Agent Record → Owner QA** (fim deste documento). Roteiro passo a passo: secção **Roteiro QA manual (staging)** no *Dev Agent Record*.

## File list (checklist implementação)

- [x] `backend/src/services/mei-notas.service.js`  
- [x] `backend/src/utils/meiLimitePayloadSum.js`  
- [x] `frontend/src/utils/meiLimiteFaturamento.ts`  
- [x] `frontend/src/components/MeiLimiteFaturamentoBlock.tsx`  
- [x] `frontend/src/pages/GuidesMei.tsx` *(auditoria: sem alteração — agregação via `computeMeiLimiteProgresso` + GET limite)*  
- [x] `backend/tests/mei-limite-payload-sum.test.js`  
- [x] `frontend/src/utils/meiLimiteFaturamento.test.ts`  
- [x] `frontend/src/components/MeiLimiteFaturamentoBlock.test.tsx`  
- [x] `docs/qa/plugnotas-multitipo-checklist.md`

## Definition of Done

- Critérios de aceite (a)–(c) cumpridos; QA manual executado (**Roteiro QA manual (staging)** + tabela **Owner QA**); gates `AGENTS.md` na entrega de código.  
- **NFR-POST-02** verificada para copy e logs.  
- `docs/qa/plugnotas-multitipo-checklist.md` — secção limite incluída; marcar checkboxes após QA manual.

## Refinamento

| Iteração | Data | Mudanças |
|----------|------|----------|
| 1 | 2026-04-16 | Alinhamento padrão epic (POST-15): Epic+PRD, dependências (P0 lista + LIM-MEI-03 dependência branda), BDD, âmbito, DoR, AC (a)–(c), QA, NFR, ficheiros concretos; feedback PO ~7→meta *Ready*. |
| 2 | 2026-04-16 | Feedback PO 9,5/10: correcção textual **dependência branda** no cabeçalho **Depende de** (evitar truncatura «branda»). |

## Dev Agent Record

### Agent Model Used

Implementação assistida (Cursor / agente Dex — AIOX *dev*); revisão QA (Quinn — AIOX *qa*).

### Debug Log References

— *(n/a — incremento sem incidente de debug registado)*

### Completion Notes List

- **Paridade:** `agregarLimiteFaturamento` já filtrava `document_type` NFSE ou `null`; `isNfseDocumentoRow` / `isNfseDocumento` passam a usar **`isDocumentTypeMeiLimiteRelevante`** (só `NFSE`) para tipo explícito — alinhado a architecture §8 / FR-GUIA-FISC-17.
- **UI:** botão de divulgação renomeado para **«Como calculamos»** / «Fechar explicação»; *footnote* «Base (MVP)» e painel mantêm exclusão explícita de NF-e/NFC-e (copy já existente, reforçada).
- **Copy PO:** texto informativo (não jurídico); refinamento legal em passagem PO posterior (Could na story).
- **Risco residual (QA):** linhas com `document_type` **vazio** continuam a ser inferidas por `servico` no payload (legado); monitorizar dados reais se houver divergência — fora do âmbito deste incremento.
- **Checklist multitipo:** secção «Guia MEI — limite de faturamento» em `docs/qa/plugnotas-multitipo-checklist.md` actualizada para este fluxo.

### File List (final)

- `backend/src/utils/meiLimitePayloadSum.js`
- `backend/src/services/mei-notas.service.js`
- `backend/tests/mei-limite-payload-sum.test.js`
- `frontend/src/utils/meiLimiteFaturamento.ts`
- `frontend/src/utils/meiLimiteFaturamento.test.ts`
- `frontend/src/components/MeiLimiteFaturamentoBlock.tsx`
- `frontend/src/components/MeiLimiteFaturamentoBlock.test.tsx`
- `docs/qa/plugnotas-multitipo-checklist.md`

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-04-16 | — | Pós-QA: DoR fechado, Agent Model, roteiro QA staging, Owner QA tabular, risco legado `document_type` null | Equipa |

### Status

Implementado (agregação + UI + testes). **QA manual em staging:** pendente de execução (preencher *Owner QA* abaixo após o roteiro).

### Roteiro QA manual (staging)

Executar com conta MEI e dados de teste (ou ambiente com NFSE + NFE + NFCE no mesmo ano civil):

1. Abrir **Guia MEI** → separador com lista de notas e *widget* «Limite de faturamento (MEI)» visível.  
2. Confirmar na **tabela** que existem linhas **NFS-e**, **NF-e** e **NFC-e** (filtro por tipo se necessário) e anotar valores à parte **não** usados no limite.  
3. No *widget*, verificar que o **total / % / barra** corresponde **só** à soma das NFS-e concluídas (não deve subir com o valor das linhas NF-e/NFC-e isoladamente). Opcional: comparar com resposta de `GET …/limite-faturamento` (network).  
4. Clicar em **«Como calculamos»**; confirmar copy sobre exclusão de NF-e/NFC-e; **Tab** até ao botão, **Enter** para abrir/fechar; **Escape** fecha o painel.  
5. Marcar itens aplicáveis em `docs/qa/plugnotas-multitipo-checklist.md` (secção limite) e registar evidência (nota ou anexo).

### Owner QA

| Campo | Valor |
|--------|--------|
| **Nome** | *(preencher na execução)* |
| **Data** | *(AAAA-MM-DD)* |
| **Ambiente** | *(ex.: staging / local / produção)* |
| **Evidência** | *(link PR, screenshot, ou «checklist multitipo § limite preenchido»)* |
| **Resultado** | [ ] Pass [ ] Fail *(marcar um)* |

**Delegação:** equipa QA ou owner do release executa o roteiro acima **antes de homologação**; esta tabela fecha o DoD em relação ao QA manual obrigatório.
