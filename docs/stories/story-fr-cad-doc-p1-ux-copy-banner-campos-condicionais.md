# Story — FR-CAD-DOC (P1): UX — copy dinâmica, banner e campos condicionais

**ID:** STORY-FR-CAD-DOC-P1-UX-COPY-CAMPOS  
**Prioridade:** P1  
**Depende de:** [story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md](./story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md)  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](../prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) — **FR-CAD-DOC-08**, **FR-CAD-DOC-09**, **FR-CAD-DOC-10**  
**UX:** [`docs/specs/ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](../specs/ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) §5–§7

## User story

**Como** MEI com **mais de um** tipo de documento ativo (ou com NF-e/NFC-e ativos sem emissão desses tipos na app),  
**quero** ver **títulos neutros**, **banner informativo** e **campos obrigatórios** quando aplicável,  
**para** entender o que falta e não assumir que a app já emite NF-e/NFC-e só pelo cadastro (**FR-CAD-DOC-08**–**10**).

## Escopo

1. **Título do bloco de dados mínimos** (UX §5.1):  
   - só NFS-e → manter *"Dados mínimos para emissão de NFS-e"* (ou equivalente);  
   - dois ou mais tipos → **"Configuração fiscal do emitente"** ou variante canónica escolhida com PO.

2. **Banner informativo** (FR-CAD-DOC-10, UX §5.2): quando NF-e ou NFC-e está **ativo** e o produto **ainda não** expõe emissão desses tipos na Guia MEI (feature flag ou constante de build), mostrar faixa **info** com texto e link para guia interno / `operacao-mei-nfse.md`.

3. **Campos condicionais** (FR-CAD-DOC-09): revelar secção ou campos adicionais quando NFE/NFCE ativos **e** o backend/story backend definir pré-requisitos (CSC, etc.); se o backend P0 ainda não exigir campos extra, esta story pode entregar apenas **estrutura UI** (accordion vazio ou hint) + critérios de aceite atualizados no Completion Notes.

## Critérios de aceite

- [ ] **FR-CAD-DOC-08:** título neutro quando `count(documentosAtivos true) >= 2`.  
- [ ] **FR-CAD-DOC-10:** banner visível nas condições do PRD §6.1 (definir flag no código).  
- [ ] **FR-CAD-DOC-09:** campos extras ou mensagem "preencha no painel/conte com contador" conforme decisão PO — não regressão no fluxo só NFS-e.  
- [ ] Contraste e dark mode alinhados a tokens existentes (`admin-*`, `planner-*`).  
- [ ] Testes de UI ou snapshot mínimo se o projeto usar.  
- [ ] Gates `AGENTS.md`.

## Tasks

1. [x] Derivar `tituloBlocoDados` a partir de `documentosAtivos`.  
2. [x] Componente de banner + link.  
3. [x] Secção condicional para requisitos NFE/NFCE (ou placeholder documentado).  
4. [ ] Revisão de copy com PO.

## File list (checklist)

- [x] `frontend/src/pages/GuidesMei.tsx` e/ou `frontend/src/components/mei/*`  
- [x] Testes associados

## Definition of Done

- PO valida copy do banner e título neutro.

## Qualidade / CodeRabbit

- Não prometer emissão NF-e/NFC-e na app se a feature não existir (honestidade PRD §6.1).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

*(Cursor — implementação assistida)*

### Completion Notes

- **FR-CAD-DOC-08:** `guiaMeiCadastroDocumentosAtivos.ts` — `getTituloBlocoDadosMinimosEmitente` / `getHintBlocoDadosMinimosEmitente` (título neutro quando não é «só NFS-e»; ≥2 tipos ou só NF-e/NFC-e → «Configuração fiscal do emitente»).
- **FR-CAD-DOC-10:** `MeiCadastroNfeNfceInfoBanner` + `VITE_GUIA_MEI_EMISSAO_NFE_NFCE_UI` (omissão `true` = emissão NF-e/NFC-e disponível na UI; `false` mostra banner + link `getGuiaMeiCadastroFiscalDocHref()`).
- **FR-CAD-DOC-09:** `MeiCadastroRequisitosNfeNfcePlaceholder` (`<details>`) quando NF-e ou NFC-e activos — texto orientação painel Plugnotas; campos CSC/backend em story futura.
- Testes: `guiaMeiCadastroDocumentosAtivos.test.ts`. Gates: `npm run typecheck`, `npm test` (frontend) verdes.
- **Task 4 (PO):** copy canónica alinhada à UX spec §5; **Definition of Done** — validação PO pendente.
- **Pós-QA (mitigação observações Quinn):** banner usa token `admin-alert-info` (critério «admin-*»); placeholder de requisitos usa `planner-card-muted` («planner-*»). `frontend/.env.example` clarifica omissão/`true` vs `false` para demo do banner. **2026-04-07:** `npm run lint`, `npm run typecheck`, `npm test` na raiz do repositório — concluídos com sucesso (avisos de eslint pré-existentes noutros ficheiros; sem erros novos nos componentes desta story).

### File List

- `frontend/src/utils/guiaMeiCadastroDocumentosAtivos.ts`
- `frontend/src/utils/guiaMeiCadastroDocumentosAtivos.test.ts`
- `frontend/src/components/mei/MeiCadastroNfeNfceInfoBanner.tsx`
- `frontend/src/components/mei/MeiCadastroRequisitosNfeNfcePlaceholder.tsx`
- `frontend/src/pages/GuidesMei.tsx`
- `frontend/.env.example`

### Change Log

- **2026-04-07:** Entrega UX P1 — título/hint centralizados, banner condicional, placeholder requisitos NF-e/NFC-e.
- **2026-04-07:** Ajuste pós-QA — classes `admin-alert-info` / `planner-card-muted`; comentários `.env.example`; gates na raiz registados em Completion Notes.

### Debug Log References

- Nenhum.

---

## QA Results

### Revisão QA — 2026-04-07 (Quinn)

**Decisão de gate:** **PASS — com observações** (implementação alinhada à UX spec e PRD; **Definition of Done** continua a depender de **validação PO** — Task 4 em aberto.)

---

#### 1. Rastreio aos critérios de aceite

| ID | Verificação | Notas |
|----|-------------|--------|
| **FR-CAD-DOC-08** | OK | `getTituloBlocoDadosMinimosEmitente` em `guiaMeiCadastroDocumentosAtivos.ts`: título específico NFS-e só no caso **só NFS-e** (`nfse && !nfe && !nfce`). Caso contrário → **«Configuração fiscal do emitente»**. Testes cobrem ≥2 tipos e o caso **só NF-e** (um tipo) com título neutro — coerente com **UX §5.1** (além do literal `count >= 2` da story). |
| **FR-CAD-DOC-10** | OK | Flag `VITE_GUIA_MEI_EMISSAO_NFE_NFCE_UI` documentada em `.env.example`; omissão/`true` oculta o banner (produto actual com emissão NF-e/NFC-e na Guia MEI). `false` + NF-e/NFC-e activos → `MeiCadastroNfeNfceInfoBanner` + `getGuiaMeiCadastroFiscalDocHref()` (env ou página em `public/`). |
| **FR-CAD-DOC-09** | OK | `MeiCadastroRequisitosNfeNfcePlaceholder` (`<details>`) quando NF-e ou NFC-e activos; texto orienta painel Plugnotas/CSC sem prometer emissão plena na app (**Qualidade / CodeRabbit**). |
| Contraste / dark mode | OK | Banner (sky) e placeholder (slate) com variantes `dark:`; padrão visual consistente com restantes blocos Guia MEI (bordas `slate`, fundos semânticos). |
| Testes | OK | `guiaMeiCadastroDocumentosAtivos.test.ts` cobre títulos, banner condicional e secção requisitos; sem regressão obrigatória de teste E2E visual (story admite «snapshot mínimo» — cumprido ao nível unitário). |
| Gates AGENTS.md | Por confiança no registo Dev | Recomendação: `npm run lint` / `typecheck` / `test` na raiz no CI do PR. |

---

#### 2. Itens em aberto (não bloqueiam merge técnico)

1. **Task 4 — Revisão de copy com PO** e **Definition of Done** («PO valida copy do banner e título neutro»): copy já espelha UX spec; falta **sign-off PO** explícito.
2. **Critérios de aceite** na secção superior da story permanecem com checkboxes por fechar após PO/PM se a equipa usar o mesmo ficheiro como controlo formal (fora do âmbito desta revisão QA).

---

#### 3. Risco residual

- **Baixo:** utilizadores não vêem o banner informativo em builds por omissão (emissão multi-tipo já na UI); comportamento esperado para Limitação D-01 **resolvida** no código actual. Para demonstrar o banner, usar `VITE_GUIA_MEI_EMISSAO_NFE_NFCE_UI=false`.

---

#### 4. Conclusão

Entrega **adequada** à story e à **honestidade** PRD §6.1 (microcopy não afirma emissão NF-e/NFC-e só pelo cadastro). **Aprovação QA técnica** com ressalva operacional: concluir **DoD** com PO quando possível.

— Quinn, QA
