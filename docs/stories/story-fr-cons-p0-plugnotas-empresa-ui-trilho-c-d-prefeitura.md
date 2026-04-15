# Story — FR-CONS (P0): Guia MEI — trilhos **C** / **D** — campos **`nfse.config.prefeitura`** + fluxo híbrido

**ID:** STORY-FR-CONS-P0-PLUGNOTAS-UI-TRILHO-CD  
**Prioridade:** P0  
**Depende de:** [story-fr-cons-p0-plugnotas-empresa-spike-prefeitura-decisao-doc.md](./story-fr-cons-p0-plugnotas-empresa-spike-prefeitura-decisao-doc.md) *(PO escolheu **C** ou **D**; schema mínimo e labels no spike)*  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) — **FR-P0-OUT-01**, **FR-P0-OUT-02**, **NFR-P0-REG-01**; PRD §6 tensão com **NAT**  
**PRD (payload):** [`docs/prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](../prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) — **FR-PREF-API-01**, **FR-PREF-UX-01**  
**UX:** [`docs/specs/ux-spec-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../specs/ux-spec-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) — secções 4 (**P0-L3/L4**), 8 (wireframes **C/D**), 9  
**UX (PREF):** [`docs/specs/ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](../specs/ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) — IM ≠ prefeitura  
**Arquitetura:** [`docs/technical/architecture-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../technical/architecture-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) — secções 4.2, 4.3, 10

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — *whitelist* BFF + tipo TS; @ux-design-expert — hierarquia CTAs trilho **D**; @pm — nota explícita no **PRD NAT** se UI obrigar campos |

---

## User story

**Como** MEI numa conta em que o emissor exige dados adicionais de prefeitura na configuração NFS-e,  
**quero** preencher no site os campos mínimos definidos pelo spike **ou** seguir o fluxo híbrido (painel primeiro, depois dados),  
**para** conseguir **POST** bem-sucedido e consulta sem **404**, sem confundir com a inscrição municipal opcional (**trilhos C/D**).

---

## Contexto

- **Trilho C:** bloco “Dados pedidos pelo emissor” no formulário (spec UX 8.2); estender `NfEmissionCompanyForm` + `buildNfEmissionEmpresaPayload` em [`nfEmissionCompany.ts`](../frontend/src/utils/nfEmissionCompany.ts).  
- **Trilho D:** após **400** com **PREF-L1**, *card* / passo com duas vias (spec UX 8.3); revelar bloco **C** condicionalmente.  
- Backend: `getEmpresaPayloadFromRequest` deve aceitar apenas chaves *whitelist* para `nfse` — evitar injecção de estrutura arbitrária (arquitectura P0 secção 4.2).  
- **Se PO escolheu apenas A ou B:** marcar story **Cancelled** / **Won’t do**.

---

## Critérios de aceite

### Frontend

- [ ] Campos (trilho **C**) com labels, hints e validação mínima conforme spike; hint **não** afirma que IM substitui `nfse.config.prefeitura` (**FR-PREF-UX-01**).  
- [ ] Trilho **D:** um CTA primário por vista conforme spec UX 8.3; *scroll* ou *reveal* do bloco **C** funcional.  
- [ ] Callout modo NFS-e Nacional (spec **NAT**) permanece coerente; se campos novos contradizem “sem prefeitura no formulário”, **nota** no **PRD NAT** ligada nesta story (**PRD P0 §6.4**).

### Backend

- [ ] Payload recebido validado / normalizado; campos desconhecidos em `nfse` não são *merged* sem critério.  
- [ ] Mesmo endpoint `POST …/emissao-fiscal/empresa` — sem novo BFF salvo excepção arquitectural aprovada.

### Regressão e E2E

- [ ] **NFR-P0-REG-01:** com campos ocultos (conta só nacional), payload e UI iguais ao baseline.  
- [ ] **FR-P0-OUT-01 / 02:** cenário de teste acordado com PO — **POST** 2xx + **GET** sem 404 *(evidência sem PII no repo)*.

### Qualidade

- [ ] **NFR-P0-GATE-01:** gates verdes.  
- [ ] `nfEmissionCompany.test.ts` actualizado com fixture trilho **C**.

---

## Tasks (indicativas)

1. [x] Estender tipos e `buildNfEmissionEmpresaPayload`. — *N/A (story cancelada — trilho **B** apenas).*  
2. [x] UI em `GuidesMei.tsx` + componentes reutilizáveis (*Input*, *Select* existentes). — *N/A.*  
3. [x] Trilho **D:** estado React para *step* pós-400 **PREF-L1**. — *N/A.*  
4. [x] *Whitelist* / validação no controller ou serviço empresa. — *N/A.*  
5. [x] Testes + ADR se JSON canónico mudar. — *N/A.*  
6. [x] **File list** + **Dev Agent Record**. — *Concluído (registo cancelação + PRD NAT §6.4).*

---

## File list (indicativo)

- [ ] `frontend/src/utils/nfEmissionCompany.ts` — *não alterado*  
- [ ] `frontend/src/utils/nfEmissionCompany.test.ts` — *não alterado*  
- [ ] `frontend/src/pages/GuidesMei.tsx` — *não alterado*  
- [ ] `backend/src/controllers/mei-notas.controller.js` — *não alterado*  
- [ ] `backend/src/services/plugnotas/empresa.service.js` — *não alterado*  
- [ ] `backend/tests/plugnotas-empresa.test.js` — *não alterado*  
- [x] `docs/prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md` — **§6.4** (nota P0 trilho B vs C/D; critério aceite copy/NAT)  

---

## CodeRabbit Integration

- Focar: validação de *input* aninhado; XSS em labels controlados pelo servidor (se algum dia dinâmico); tamanho do payload.

---

## Dev Agent Record

### Status

Cancelled — *Won’t do neste P0*

### File list

- `docs/prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md` — §6.4 + change log (coerência FR-NAT vs trilho B).
- `docs/prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md` — **§6.4** (ponteiro canónico PRD P0 → PRD NAT; seguimento QA sobre «PRD P0 §6.4» vs NAT).

### Notes

- **Contexto § story:** *«Se PO escolheu apenas A ou B: marcar story Cancelled / Won’t do.»* O fecho do spike ([`NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md`](../evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md) §4) regista trilho principal **B** e trilhos **C/D** como *não implementados neste P0*.
- **NFR-P0-REG-01:** sem novos campos de prefeitura na UI; baseline preservado.
- **Reabertura:** se o PO decidir **C** ou **D** mais tarde, reactivar story (ou clonar) e actualizar §6.4 do PRD NAT.
- **Seguimento QA:** o aceite citava «PRD P0 §6.4»; existe agora **[§6.4 no PRD P0 acção](../prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md)** com ponteiro explícito ao **PRD NAT §6.4**. **Backlog / *velocity*:** estado **Cancelled** — alinhar com **@sm** se o quadro só contabilizar *Done* / *Ready for Review*.

### Change Log

- 2026-04-08 — Story cancelada; PRD NAT §6.4 para rastreio P0 / critério copy vs NAT.
- 2026-04-08 — PRD P0 §6.4 + notas (correcção rastreio QA; *velocity* @sm).

---

## QA Results

### Revisão — 2026-04-08 (Quinn)

**Gate:** **WAIVED / documental OK** — story **Cancelled** conforme regra explícita do **Contexto** (*«Se PO escolheu apenas A ou B»*) e alinhada ao fecho do spike (**trilho B**). Não há entrega de código C/D a validar com **NFR-P0-GATE-01**; a decisão de produto está **rastreada**.

#### Rastreio

| Área | Verificação |
|------|-------------|
| **Decisão vs spike** | [`NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md`](../evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md) §4 — trilhos C/D não implementados; story UI referenciada como **Cancelled**. |
| **Dev Agent Record** | Status **Cancelled — Won’t do neste P0**; notas com ponteiro ao spike; **NFR-P0-REG-01** preservado (sem campos novos na UI). |
| **Critério copy / NAT** (aceite original § Frontend, terceiro bullet) | **Atendido por documentação:** [`PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](../prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) **§6.4** explica trilho **B** vs C/D e coerência com **FR-NAT-UX-01**. *Nota:* o aceite citava «PRD P0 §6.4»; o registo canónico ficou no **PRD NAT** §6.4 (intenção alinhada). |
| **Tasks / file list** | Tarefas marcadas **N/A** com justificação; ficheiros de app listados como *não alterados* — coerente. |
| **Testes / E2E / FR-P0-OUT** | **N/A** para esta story cancelada; permanecem à cargo das stories de trilho **B** e evidência operacional externa. |

#### Observação (baixo risco)

- Se o **backlog** usar só estados *Done* / *Ready for Review*, alinhar com **@sm** o tratamento de **Cancelled** (métricas de *velocity*).

— Quinn, guardião da qualidade 🛡️
