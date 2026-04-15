# Story — FR-CONS (P0): Spike Plugnotas **`nfse.config.prefeitura`** + decisão de trilho + **FR-P0-DOC-01**

**ID:** STORY-FR-CONS-P0-PLUGNOTAS-SPIKE-PREF-DOC  
**Prioridade:** P0  
**Depende de:** —  
**Bloqueia:** [story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md](./story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md), [story-fr-cons-p0-plugnotas-empresa-ux-p0-overlay-bloqueio-sucesso.md](./story-fr-cons-p0-plugnotas-empresa-ux-p0-overlay-bloqueio-sucesso.md), [story-fr-cons-p0-plugnotas-empresa-ui-trilho-c-d-prefeitura.md](./story-fr-cons-p0-plugnotas-empresa-ui-trilho-c-d-prefeitura.md) *(implementação condicional só após decisão PO)*  
**Fonte PRD:** [`docs/prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) — **FR-P0-SPIKE-01**, **FR-P0-DEC-01**, **FR-P0-DOC-01**, **NFR-P0-EV-01**, **NFR-P0-TIME-01**  
**UX:** [`docs/specs/ux-spec-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../specs/ux-spec-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) — contexto trilhos **A–D** (sem alterar copy até spike fechado)  
**Arquitetura:** [`docs/technical/architecture-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../technical/architecture-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) — secção 2 (saídas spike), secção 10 (rastreabilidade)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @architect *(liderança técnica)* + @pm *(decisão trilho)*; @dev *(sandbox/cURL reproduzível, sem merge de payload inventado)* |
| **quality_gate** | @qa *(verificação documental + checklist evidência)* |
| **quality_gate_tools** | N/A código — validar que **nenhum** PII entrou em `docs/` |
| **revisão** | @po — **FR-P0-DEC-01** assinado com trilho **A/B/C/D** |

---

## User story

**Como** equipa de produto e engenharia,  
**quero** fechar o spike sobre o contrato Plugnotas para `nfse.config.prefeitura` e registar **qual** trilho (A–D) seguimos, com evidência **sem PII**,  
**para** desbloquear implementação **sem** violar **NFR-N04** / **FR-P0-SPIKE-01** e cumprir **FR-P0-DOC-01**.

---

## Contexto

- O **POST** `…/emissao-fiscal/empresa` falha com **400** `fields.nfse.config.prefeitura` enquanto o payload canónico não envia `prefeitura`; o **GET** segue com **404** por ausência de cadastro.  
- **Antes** de qualquer merge que altere `nfse.config.prefeitura` ou campos de UI **C/D**, o spike deve responder às perguntas do brief de acção (formato, `nacional`, lookup, compatibilidade).  
- Template de evidência: [`docs/evidence/NFR-PREF-EV-01-plugnotas-nfse-config-prefeitura-TEMPLATE.md`](../evidence/NFR-PREF-EV-01-plugnotas-nfse-config-prefeitura-TEMPLATE.md).  
- **Trilho A apenas:** se painel/conta Plugnotas resolver sem código, documentar ticket/checklist **sem PII** e fechar story de implementação como N/A — ainda assim **FR-P0-DOC-01** e **FR-P0-DEC-01** são obrigatórios.

---

## Critérios de aceite

### Spike (**FR-P0-SPIKE-01**)

- [ ] Artefacto de evidência preenchido (template ou doc equivalente) com respostas às quatro perguntas mínimas da arquitetura P0 secção 2; **sem** CNPJ/PII em texto versionado.  
- [ ] **NFR-P0-TIME-01:** data de início e fim do spike registada na story ou no doc de evidência.

### Decisão (**FR-P0-DEC-01**)

- [ ] PO (ou delegado) documenta **trilho principal**: **A**, **B**, **C**, **D** ou combinação explícita; ligação ao ficheiro de evidência.  
- [ ] Se **B/C/D:** confirmação de que **NFR-PREF-EV-01** está satisfeito antes de abrir PRs de código dependentes.

### Documentação (**FR-P0-DOC-01**)

- [ ] **Registo único** actualizado: pelo menos uma de — ADR (apêndice ou novo parágrafo), [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) com âncora ou secção P0, ou nota na story com ponteiro canónico; todos referenciam o [`PRD P0`](../prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md).  
- [ ] **NFR-P0-EV-01:** revisão manual de que commits não introduzem PII em exemplos JSON.

### Trilho **A** (se escolhido)

- [ ] Checklist painel Plugnotas + ambiente (homologação vs produção) documentado; resultado: **POST** 2xx no CNPJ de teste **redigido** internamente (não colar CNPJ real no repo) **ou** conclusão “A não resolve” com encaminhamento a **B/C/D**.

---

## Tasks (indicativas)

1. [x] Preencher template de evidência / doc spike (Architect + contacto Plugnotas se aplicável).  
2. [x] Reunião ou async PO: **FR-P0-DEC-01** — trilho escolhido. *(Registo técnico **B** no artefacto de evidência; confirmação formal PO em canal interno se exigido pela governança.)*  
3. [x] Actualizar `operacao-mei-nfse.md` e/ou ADR conforme trilho.  
4. [x] Se **A:** executar checklist e registar resultado; marcar stories dependentes como canceladas ou ready. *(Trilho **A** não é o principal; checklist painel permanece no runbook — sem N/A de stories B.)*  
5. [x] Handoff: listar nas stories filhas os ficheiros e schema mínimo (para **B/C/D**). *(Ver evidência §3 + story trilho B.)*

---

## File list (indicativo)

- [x] `docs/evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md` *(fecho spike; template TEMPLATE mantido vazio)*  
- [x] `docs/operacao-mei-nfse.md` — âncora `#p0-prefeitura-spike-trilho-b`  
- [x] `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` — ponteiro FR-P0-DOC-01  
- [x] `docs/stories/story-fr-cons-p0-plugnotas-empresa-spike-prefeitura-decisao-doc.md` *(esta story — Dev Agent Record)*  

---

## CodeRabbit Integration

- N/A código; se algum script de exemplo for adicionado ao repo, garantir *sanitização* e ausência de secrets.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `docs/evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md` — respostas arquitectura P0 §2; **NFR-P0-TIME-01**; **FR-P0-DEC-01** trilho **B**; schema redigido sem PII.
- `docs/operacao-mei-nfse.md` — subsecção spike P0 + ligação PRD P0 e evidência.
- `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` — rastreio FR-P0-SPIKE/DOC + âncora runbook.

### Notes

- **Trilho B** alinhado à implementação existente [`story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md`](./story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md). **C/D** ficam por stories dedicadas.
- **NFR-PREF-EV-01** operacional por conta: evidência no Git é **registo técnico**; validação **POST/GET** real sem PII em ticket interno ou QA Results.
- **NFR-P0-EV-01:** diff só documentação; sem CNPJ/credenciais em exemplos.
- **Seguimento QA (recomendações):** evidência §7 (tabela **FR-P0-DEC-01** para @po — metadados); §8 (níveis **NFR-PREF-EV-01** repo vs produção); §9 (ordem temporal doc vs código). Runbook: bullet release + flag em `operacao-mei-nfse.md`.

### Change Log

- 2026-04-08 — Fecho documental spike: evidência P0, `operacao-mei-nfse.md`, ADR, tasks/file list.
- 2026-04-08 — Ajustes pós-QA: §7–9 no fecho; runbook § release **NFR-PREF-EV-01** nível B.

---

## QA Results

### Revisão documental — 2026-04-08 (Quinn)

**Gate:** **PASS com observações** (entrega documental adequada ao **FR-P0-SPIKE-01** e **FR-P0-DOC-01**; itens de governança PO e evidência operacional **NFR-PREF-EV-01** ficam explícitos abaixo).

#### Rastreio aos critérios de aceite

| Critério | Verificação |
|----------|-------------|
| **FR-P0-SPIKE-01** — artefacto + 4 perguntas arquitectura P0 §2, sem PII | **OK:** [`docs/evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md`](../evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md) cobre §3.1–3.4 (schema, `nacional`, lookup, compatibilidade). **NFR-P0-EV-01 (amostragem):** revista a redacção do fecho — sem CNPJ de 14 dígitos; exemplo JSON usa só `codigoIbge` público e texto proibitivo explícito. |
| **NFR-P0-TIME-01** | **OK:** tabela início/fim **2026-04-08** no doc de evidência. |
| **FR-P0-DEC-01** — PO documenta trilho + ligação evidência | **Parcial / observação:** trilho **B** está **registado** no fecho e no runbook; a story e o doc admitem **confirmação formal PO em canal interno**. A célula **revisão @po** no cabeçalho da story **não** substitui minuta/ticket assinado — **@po** deve fechar se a governança exigir assinatura explícita. |
| **FR-P0-DEC-01** — **NFR-PREF-EV-01** satisfeito antes de PRs dependentes | **Observação:** o próprio fecho declara **NFR-PREF-EV-01** operacional **pendente fora do Git** (sandbox/conta). O critério literal da story é **ambíguo** face a PRs de trilho **B** já existentes no tempo: interpretação QA — **baseline técnica + testes *mock*** OK no repo; **aceitação por conta** continua **pré-requisito operacional** antes de activar `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE` em produção (alinhado ao ADR e ao fecho §3.4). |
| **FR-P0-DOC-01** — registo único + PRD P0 | **OK:** `docs/operacao-mei-nfse.md` (`#p0-prefeitura-spike-trilho-b` + link PRD P0) e `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` (ponteiro ao fecho e âncora runbook). |
| **Trilho A** (se escolhido) | **N/A** como trilho **único**; runbook mantém checklists gerais — coerente com o texto do fecho e da task 4. |

#### Riscos / dívidas (não bloqueantes para merge de docs)

1. Ordem temporal spike vs implementação trilho **B:** documentação **retroactiva** coerente, mas equipas devem tratar o fecho como **fonte canónica** para futuras alterações de contrato.  
2. **FR-P0-OUT-01 / 02:** permanecem dependentes de evidência interna (sem PII), como indicado no runbook.

#### Recomendações

1. **@po:** uma linha em acta ou ticket interno: “Trilho **B** aprovado para P0” + link a este path de evidência (opcional mas fecha **revisão @po**).  
2. **Operação:** ao primeiro deploy com flag `true`, anexar resultado redigido ao processo de release (fecha **NFR-PREF-EV-01** no sentido operacional).

— Quinn, guardião da qualidade 🛡️
