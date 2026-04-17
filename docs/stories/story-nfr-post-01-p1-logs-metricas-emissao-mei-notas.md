# Story — NFR-POST-01 (P1): Observabilidade — logs e métricas de emissão (`document_type`, latência, outcome)

**ID:** STORY-NFR-POST-01-OBS-EMISSAO  
**Prioridade:** P1  
**Epic:** Epic 2 — Consolidação pós-brainstorm (`docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md`)  
**Depende de:** — *(caminho `emitirNota` já existente em brownfield)*  
**Bloqueia:** —  
**Fonte:** `docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md` (**NFR-POST-01**, **NFR-POST-02**)  
**UX:** `docs/specs/ux-spec-guia-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §10  
**Arquitetura:** `docs/technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §9  
**QA (opcional):** `docs/qa/plugnotas-multitipo-checklist.md` — cruzar se o incremento tocar em fluxo de emissão multitipo.

## User story

**Como** equipa de produto e engenharia,  
**quero** **telemetria agregada** do caminho de emissão (`document_type`, duração, sucesso/erro) **sem PII** em labels ou logs `info`,  
**para** monitorizar integração Plugnotas e regressões por tipo (**NFR-POST-01**, **NFR-POST-02**).

## Contexto técnico

- **Backend — ponto central:** [`emitirNota`](../../backend/src/services/mei-notas.service.js) — medir *duration* entre entrada e resposta Plugnotas / validação (alinhado a [architecture §9.1](../technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md)).  
- **Campos mínimos (não-PII):** `document_type`, `outcome` (*success* \| *validation_error* \| *plugnotas_error*), `duration_ms`, código Plugnotas quando existir.  
- **PRD (NFR-POST-01):** «taxa de erro da integração Plugnotas» e **latência** do caminho de emissão — esta story entrega **eventos por emissão** (`outcome`, `duration_ms`) que o stack de observabilidade existente (logs agregados, APM ou contadores §9.3) pode **agregar** em taxa (*ex.* proporção de `plugnotas_error` sobre total, por `document_type`) **sem** novo produto de analytics.  
- **Níveis de log (produção):**  
  - **`info`:** apenas linha estruturada com o conjunto mínimo acima; **sem** payload fiscal completo, **sem** CPF/CNPJ completos (**NFR-POST-02**).  
  - **`warn` / `error`:** podem incluir código de erro Plugnotas e identificadores técnicos já existentes no fluxo (ex.: *correlation* / id de pedido interno); **continuam proibidos** CPF/CNPJ completos e payload integral — alinhado ao PRD (*debug controlado* para payload completo **não** é escopo desta story).  
- **Métricas / labels (se o stack expuser contadores):** [architecture §9.3](../technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md) — *labels* limitados a `document_type` e `route` (ou equivalente acordado); **sem** `user_id` em *labels* públicos.  
- **Frontend:** [UX §10](../specs/ux-spec-guia-mei-nfe-nfce-pos-brainstorm-2026-04-16.md) — se existirem eventos analíticos no cliente, apenas tipo agregado e resultado; **sem** CPF/CNPJ, número de nota ou payload.

## BDD (aceite)

| Cenário | Dado | Quando | Então |
|--------|------|--------|--------|
| Sucesso | Pedido de emissão válido | `emitirNota` conclui com sucesso Plugnotas | Registo estruturado com `outcome=success`, `document_type`, `duration_ms` (e código Plugnotas se existir no contrato). |
| Erro de validação | Dados inválidos antes da chamada Plugnotas | Fluxo retorna erro de validação | Registo com `outcome=validation_error`, `document_type`, `duration_ms`; **sem** payload completo em `info`. |
| Erro Plugnotas | API Plugnotas falha ou resposta de erro | Fluxo classifica como falha de integração | Registo com `outcome=plugnotas_error`, código Plugnotas quando existir; `info`/`warn`/`error` **sem** PII completo nem payload integral (**NFR-POST-02**). |
| Privacidade | Qualquer ramo | Qualquer log `info` em produção | **Não** contém payload fiscal completo nem documentos pessoais completos. |

## Âmbito

| Must | Could | Fora |
|------|-------|------|
| Helper ou extensão de logging + instrumentação de `emitirNota` (todos os *returns* relevantes) | Contador/métrica agregada se já houver stack (labels §9.3); **consulta/documentação** de como derivar **taxa de erro** Plugnotas a partir de `outcome` nos logs ou métricas existentes (*Completion Notes*) | Novo produto de analytics ou biblioteca de *tracking* no cliente |
| Testes unitários do helper / campos permitidos | Auditar e alinhar eventos cliente **se** já existirem (UX §10) | *Payload* completo em `info` «para debug» sem processo e PRD futuro |
| Documentação do formato (ver DoR) | | `user_id` em *labels* públicos de métricas |

## Definition of Ready

- [ ] Taxonomia `outcome` (*success* / *validation_error* / *plugnotas_error*) e pontos de medição de `duration_ms` (início/fim) acordados em *refinement*.  
- [ ] **Documentação do formato:** JSDoc (ou bloco equivalente) no **cabeçalho do helper** listando campos permitidos e níveis; cópia ou resumo nas *Completion Notes* na conclusão.  
- [ ] **Owner QA** atribuído (ver *Dev Agent Record*) ou delegação com data.  
- [ ] Equipa leu [architecture §9](../technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md) e UX §10.

## Critérios de aceite

### (a) Instrumentação backend

- [x] Cada conclusão de emissão (sucesso ou erro) regista **log estruturado** ou métrica com `document_type`, `duration_ms` e `outcome` conforme taxonomia (**base** para latência e para **taxa de erro** agregada no stack — NFR-POST-01).  
- [x] Todos os ramos relevantes de `emitirNota` estão instrumentados **antes** de cada `return` (incluindo erros de validação e Plugnotas).

### (b) Privacidade e níveis

- [x] Logs `info` **não** contêm payload fiscal completo nem CPF/CNPJ completos (**NFR-POST-02**).  
- [x] `warn`/`error` não contêm CPF/CNPJ completos nem payload integral; podem incluir códigos Plugnotas e ids técnicos já previstos no fluxo.  
- [x] Se existirem métricas com *labels* públicos: conforme [§9.3](../technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md) (sem `user_id` em *labels* públicos) — **N/A** contadores no backend; logs JSON não usam `user_id`.

### (c) Frontend (condicional)

- [x] **Se** existirem eventos analíticos no caminho de emissão: apenas `document_type` agregado e resultado (*success*/*error*), **sem** PII (UX §10); **se** não existirem, registar nas *Completion Notes* «sem eventos de emissão — N/A».  
- [x] **NFR-POST-02 (cliente):** sem `console.log` de payload em produção; *devtools* só em modo debug explícito (UX §10).

### (d) Qualidade

- [x] Testes: unitário do helper de log ou *snapshot* / lista fechada de campos permitidos.  
- [x] Gates `AGENTS.md`: `npm run lint`, `npm run typecheck`, `npm run test` (ajustar *scope* ao monorepo se scripts raiz já cobrirem backend + frontend).

## Tasks (implementação)

1. [x] Introduzir helper `logMeiEmitOutcome` (nome ajustável) ou extensão do logging existente — **JSDoc com schema de campos** no ficheiro do helper.  
2. [x] Instrumentar `emitirNota` e ramos de erro até ao `return`.  
3. [x] Auditar frontend: caminho de emissão + [`reportUserErrorShown`](../../frontend/src/lib/reportUserErrorShown.ts) (e similares); cumprir UX §10 ou documentar N/A nas *Completion Notes*.  
4. [x] Se aplicável, *hook* de métricas com *labels* §9.3 — **N/A** (ver *Completion Notes*).  
5. [x] Testes + gates `AGENTS.md` (comandos explícitos na secção *Definition of Done*).

## QA manual (obrigatório)

| # | Acção | Resultado esperado |
|---|--------|---------------------|
| 1 | Emitir com sucesso (ou ambiente de *stub* se existir) | Log/métrica com `success`, `document_type`, `duration_ms` coerente. |
| 2 | Forçar erro de validação (payload inválido) | `validation_error`; sem payload completo em `info`. |
| 3 | Simular falha Plugnotas (teste integrado ou mock) | `plugnotas_error` + código quando existir; sem PII em `info`. |
| 4 | Cliente: se houver analytics no emit | Apenas tipo + resultado agregados; *sem* CPF/CNPJ/nota/payload — ou N/A documentado. |
| 5 | Logs/métricas no ambiente de QA ou stack de *staging* | É possível agregar **taxa** de falhas de integração (*ex.* `outcome=plugnotas_error` / tentativas) por `document_type` a partir dos registos — ou documentar *query*/*dashboard* equivalente nas *Completion Notes*. |

**Multitipo:** cruzar com [`docs/qa/plugnotas-multitipo-checklist.md`](../qa/plugnotas-multitipo-checklist.md) se emissão multitipo estiver no *scope* da sprint.

*Owner QA:* preencher **uma única vez** em **Dev Agent Record → Owner QA**.

## File list (checklist implementação)

- [x] [`backend/src/services/mei-notas.service.js`](../../backend/src/services/mei-notas.service.js)  
- [x] Novo helper em `backend/src/utils/` ou extensão do serviço de log existente  
- [x] [`frontend/src/lib/reportUserErrorShown.ts`](../../frontend/src/lib/reportUserErrorShown.ts) e/ou páginas de emissão MEI *(só se auditoria exigir alteração)* — **N/A**

## Definition of Done

- Critérios de aceite (a)–(d) cumpridos; QA manual executado; **Owner QA** preenchido.  
- Gates: `npm run lint`, `npm run typecheck`, `npm run test` (conforme `AGENTS.md`).  
- *Completion Notes* com schema final do helper (ou pointer para JSDoc), decisão frontend (eventos / N/A) e **como** a taxa de erro Plugnotas (NFR-POST-01) é obtida a partir dos `outcome` no stack existente.

## Refinamento

| Iteração | Data | Mudanças |
|----------|------|----------|
| 1 | 2026-04-16 | SM: BDD, âmbito Must/Could/Fora, DoR, AC (a)–(d), níveis `info`/`warn`/`error`, métricas §9.3, QA manual, gates explícitos, *frontend* condicional com N/A; alinhamento PRD/UX/architecture. |
| 2 | 2026-04-16 | Feedback PO 9,5/10: explicitar **taxa de erro** (PRD) como agregação de `outcome` no stack existente; Could + AC (a) + QA #5 + DoD *Completion Notes*; sem novo produto de observabilidade. |

## Dev Agent Record

### Agent Model Used

Composer / Dex

### Debug Log References

### Completion Notes List

- **Helper:** `backend/src/utils/logMeiEmitOutcome.js` — JSDoc com schema. Linha JSON única prefixada com `[mei-emit]`:
  - Sempre: `event`=`mei_emit_outcome`, `route`=`emitir_nota` (`MEI_EMIT_ROUTE_EMITIR_NOTA`), `document_type`, `duration_ms`, `outcome` ∈ `success` | `validation_error` | `plugnotas_error`.
  - Sucesso opcional: `plugnotas_status` (token sanitizado ASCII da situação devolvida).
  - Erro opcional: `failure_phase` (`resolve` \| `adapter` \| `build` \| `validate` \| `plugnotas_emit` \| `insert_record`) — distingue p.ex. falha na BD (`insert_record`) de falha HTTP Plugnotas (`plugnotas_emit`); só valores canónicos.
  - Erro opcional: `http_status` (erros `HttpError`), `plugnotas_path_masked`, `plugnotas_code` (de `errors.plugnotasCode` estável, sanitizado).
  - Níveis: `success` e `validation_error` → `console.info`; `plugnotas_error` → `console.warn`. Sem payload fiscal nem documentos em `info`.
- **`emitirNota`:** fases `resolve` → `adapter` → `build` → `validate` → `plugnotas_emit` → `insert_record`; `validation_error` se falha antes ou em validação local; `plugnotas_error` se falha em `adapter.emitir` ou `insertRecord` (agregar por `failure_phase` se precisar separar taxa Plugnotas vs persistência).
- **QA follow-up:** teste `mei-notas-emit-telemetry.test.js` garante pelo menos um caminho `emitirNota` → `mei_emit_outcome`; `plugnotas_status` aceita letras Unicode (ex.: «Concluída»).
- **Taxa de erro Plugnotas (NFR-POST-01):** no stack que indexa `stdout`/logs JSON (Datadog, CloudWatch, etc.), filtrar `event="mei_emit_outcome"` e `route="emitir_nota"`; **taxa de falha de integração** ≈ contagem `outcome="plugnotas_error"` / contagem total de linhas com mesmo `document_type` (ou global); latência p95/p99 em `duration_ms` por `document_type`. Sem novo produto de métricas — agregação a partir dos registos.
- **Frontend (UX §10):** não há eventos analíticos dedicados ao *submit* de emissão no Guia MEI; `reportUserErrorShown` continua só com `category` + `surfaceId` opcional (sem PII). Erros de emissão usam `console.warn('[mei-emission]', …)` já sem payload — **sem eventos de emissão analíticos — N/A**.
- **Métricas §9.3:** sem contador Prometheus no repo; labels futuros limitados a `document_type` + `route` se se integrar um exporter.

### File List (final)

- `backend/src/utils/logMeiEmitOutcome.js`  
- `backend/tests/log-mei-emit-outcome.test.js`  
- `backend/tests/mei-notas-emit-telemetry.test.js`  
- `backend/src/services/mei-notas.service.js`

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-04-16 | 1 | NFR-POST-01: `logMeiEmitOutcome`, instrumentação `emitirNota`, testes unitários | Dex |
| 2026-04-16 | 2 | QA: `failure_phase`, `plugnotas_code`, status Unicode, teste `emitirNota` | Dex |

### Status

Implementado — QA manual conforme tabela (Owner QA).

### Owner QA

*(nome / data — preencher após execução manual)*
