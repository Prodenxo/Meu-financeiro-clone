# Story — FR-PREF (P1): Plugnotas — payload **`nfse.config.prefeitura`** (trilhos B / C / D)

**ID:** STORY-FR-PREF-P1-PAYLOAD-PREFITURA-BCD  
**Prioridade:** P1  
**Depende de:**  
- **NFR-PREF-EV-01:** evidência citável (doc Plugnotas, sandbox ou ticket) sobre schema mínimo de `nfse.config.prefeitura`, compatibilidade com `nfse.nacional: true`, e (se aplicável) endpoint de lookup.  
- **Decisão PO** explícita de trilho **B** (derivação), **C** (campos UI) ou **D** (híbrido) — ver PRD §6.1–6.2.  
- Recomendado: [story-fr-pref-p0-plugnotas-prefeitura-config-ux-variant-im-hint.md](./story-fr-pref-p0-plugnotas-prefeitura-config-ux-variant-im-hint.md) concluída (UX/copy estável antes de pedir dados extra).  
**Bloqueia:** — (até desbloqueios acima)  
**Fonte PRD:** [`docs/prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](../prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) — **FR-PREF-API-01**; **NFR-PREF-01**, **NFR-PREF-02**, **NFR-PREF-EV-01**  
**UX:** [`docs/specs/ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](../specs/ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) — secção 7 (trilhos B/C/D)  
**Arquitetura:** [`docs/technical/architecture-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](../technical/architecture-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) — §4, §5.2, §7, §9

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — alteração de contrato JSON, ADR, fronteira BFF ↔ Plugnotas |

---

## User story

**Como** MEI cuja conta Plugnotas **exige** `nfse.config.prefeitura` no cadastro da empresa,  
**quero** que o produto envie os dados **corretos** no `POST`/`PATCH` empresa (por derivação automática, campos explícitos ou fluxo híbrido conforme decisão PO),  
**para** concluir o registo no emissor sem adivinhar chaves JSON nem depender só do suporte.

---

## Contexto

- **NFR-PREF-01:** nenhuma chave nova em `nfse.config` sem actualização do [`docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`](../adr/ADR-plugnotas-nfse-nacional-empresa-spike.md) (ou apêndice) com exemplo redigido.  
- **NFR-PREF-02:** manter política “apenas NFS-e” e `documentosAtivos` intactos salvo aprovação explícita.  
- **Trilho B:** derivação no backend (ex.: IBGE) — UI pode não mudar.  
- **Trilho C/D:** campos ou máquina de estados no cliente (spec UX §7); **D** pode reutilizar estado “último erro” da story P0.

---

## Pré-condições (gate antes de “Ready for Dev”)

- [ ] PO registou trilho **B**, **C** ou **D** no PRD (change log) ou nota ligada.  
- [ ] Evidência **NFR-PREF-EV-01** anexada ou referenciada (link interno ao repositório `docs/`, sem PII).  
- [ ] @architect validou risco de **B** (schema por município) ou escopo de **C** (sem catálogo nacional completo salvo decisão explícita).

---

## Critérios de aceite

*(detalhar na refinamento após escolha B/C/D; lista mínima comum)*

- [ ] **FR-PREF-API-01:** O corpo enviado a `POST /empresa` (e `PATCH` na mesma política MEI, se aplicável) inclui `nfse.config.prefeitura` conforme schema **documentado no ADR** após implementação.  
- [ ] Testes de contrato: `nfEmissionCompany.test.ts` e/ou testes backend de montagem de payload **actualizados** com o *shape* acordado.  
- [ ] **NFR-PREF-02:** regressão “apenas NFS-e” e documentos activos — CI verde.  
- [ ] Se **C/D:** UI conforme spec UX §7 (rótulo “só se o emissor exigir”, `role="region"` onde aplicável).  
- [ ] Gates: `npm run lint`, `npm run typecheck`, `npm test`.

---

## Tasks (indicativas — preencher após decisão B/C/D)

1. [ ] Actualizar ADR com schema `prefeitura` + exemplo redigido (**NFR-PREF-EV-01**).  
2. [ ] Backend: `empresa.service.js` e/ou `plugnotas-empresa-documentos-ativos.js` — montagem de `nfse.config.prefeitura` (**B**) ou repasse de campos do cliente (**C**).  
3. [ ] Frontend: `nfEmissionCompany.ts` (+ formulário se **C/D**).  
4. [ ] Testes de contrato + regressão hints/variantes P0.  
5. [ ] Actualizar `docs/operacao-mei-nfse.md` se o fluxo operacional mudar (ex.: novos passos de preenchimento).

---

## File list (indicativo)

- [ ] `docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md` *(ou novo apêndice ADR)*  
- [ ] `backend/src/services/plugnotas/empresa.service.js`  
- [ ] `backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js`  
- [ ] `frontend/src/utils/nfEmissionCompany.ts`  
- [ ] `frontend/src/utils/nfEmissionCompany.test.ts`  
- [ ] `frontend/src/pages/GuidesMei.tsx` *(se C/D)*  
- [ ] `docs/operacao-mei-nfse.md` *(se necessário)*

---

## CodeRabbit Integration

- Focar: validação de entrada (C/D), ausência de PII em logs, consistência BFF com ADR, feature flag / *kill switch* se PO exigir desligar derivação **B** em produção.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Blocked — pré-condições P1 não satisfeitas (aguardar PO + evidência)

### Agent Model Used

Cursor agent (implementação assistida)

### Debug Log References

—

### Completion Notes

- **HALT @dev (2026-04-08):** não há implementação de **FR-PREF-API-01** neste ciclo.
- **Pré-condições da story (secção «Pré-condições»):** continuam **por marcar** até PO/architect (trilho B/C/D; evidência real; validação de risco).
- **Resposta às recomendações QA (2026-04-08):** (1) Ponteiro **`docs/evidence/NFR-PREF-EV-01-plugnotas-nfse-config-prefeitura-TEMPLATE.md`** — modelo para **NFR-PREF-EV-01** (substitui evidência vazia; **não** desbloqueia a pré-condição até preenchimento); linha no **PRD** change log §13 com esse link. (2) **`docs/qa/test-design-story-fr-pref-p1-payload-bcd.md`** — cenários Given-When-Then (contrato FE+BFF, nacional-only, `documentosAtivos`, UI C/D). (3) Trilho **B:** secção *kill switch* no test design (nome de env na implementação futura).
- **Item QA 4:** nova revisão **QA Results** cabe exclusivamente a @qa após código + CI.
- **NFR-PREF-01 / §6.2:** inalterados — sem payload até ADR + evidência fechada.

### File List

- `docs/evidence/NFR-PREF-EV-01-plugnotas-nfse-config-prefeitura-TEMPLATE.md`
- `docs/qa/test-design-story-fr-pref-p1-payload-bcd.md`
- `docs/prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md` *(change log §13 — linha de rastreio)*

### Change Log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | @sm | Story criada (placeholder P1; bloqueada por evidência + PO até Ready for Dev). |
| 2026-04-08 | @dev | Tentativa de implementação: HALT por pré-condições e PRD §6 em aberto; Dev Agent Record actualizado. |
| 2026-04-08 | @dev | Follow-up QA P1: modelo NFR-PREF-EV-01 + test design + entrada PRD change log; story continua Blocked. |

---

## QA Results

*(preencher por @qa após implementação)*

### 2026-04-08 — Quinn (@qa) — revisão da story P1 (payload B/C/D)

**Âmbito:** a story **não** entregou **FR-PREF-API-01** (sem alterações a `nfEmissionCompany`, BFF Plugnotas, ADR com `nfse.config.prefeitura`, nem testes de contrato listados na story).

**Decisão de gate (implementação):** **WAIVED** — *não há diff de produto a inspeccionar*. Isto **não** equivale a PASS de release: os critérios de aceite da story permanecem **por verificar**.

**Conformidade de processo (positivo)**

- O **Dev Agent Record** regista **HALT** coerente com: pré-condições por marcar (PO trilho B/C/D, **NFR-PREF-EV-01**, @architect), **PRD §6.2** em aberto e **NFR-PREF-01** (sem chave nova em `nfse.config` sem ADR + evidência).
- **Tasks** e **file list** indicativos mantêm-se `[ ]`, alinhado a “sem implementação”.

**Rastreio de critérios de aceite**

| Critério | Estado |
|----------|--------|
| **FR-PREF-API-01** | Não aplicável neste ciclo (sem payload). |
| Testes de contrato (`nfEmissionCompany` / backend) | Não actualizados. |
| **NFR-PREF-02** | Sem mudança de código P1 — regressão não avaliada *nesta* story. |
| UI C/D §7 | Não aplicável. |
| Gates CI nesta entrega | N/A para delta P1 (zero ficheiros de código). |

**Recomendações quando a story for desbloqueada**

1. **Antes** de @dev: marcar pré-condições, trilho único no PRD (change log) e ponteiro **NFR-PREF-EV-01** em `docs/`.  
2. **Test design mínimo:** asserts no *shape* de `nfse.config.prefeitura` no frontend **e** no BFF (espelho do ADR); cenário “conta só nacional” sem regressão de `documentosAtivos`.  
3. Se trilho **B:** considerar *kill switch* em env (mencionado na story) e testes com flag off/on.  
4. Reabrir **QA Results** após implementação real com gate **PASS / CONCERNS / FAIL** sobre código e CI.

— Quinn, guardião da qualidade 🛡️
