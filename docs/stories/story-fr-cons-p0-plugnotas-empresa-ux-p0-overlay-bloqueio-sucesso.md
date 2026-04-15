# Story — FR-CONS (P0): Guia MEI — overlay UX **P0-L1** (bloqueio honesto) + **P0-L2** (sucesso de fase)

**ID:** STORY-FR-CONS-P0-PLUGNOTAS-UX-P0-OVERLAY  
**Prioridade:** P0  
**Depende de:** [story-fr-cons-p0-plugnotas-empresa-spike-prefeitura-decisao-doc.md](./story-fr-cons-p0-plugnotas-empresa-spike-prefeitura-decisao-doc.md) *(para copy **P0-L1** aprovada por PO quando ramo “impossibilidade” existir; implementação técnica do *flag* pode usar spec UX como base antes do fecho do spike)*  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) — **FR-P0-OUT-01**, **FR-P0-OUT-02**, **NFR-P0-REG-01**, **NFR-P0-GATE-01**  
**UX:** [`docs/specs/ux-spec-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../specs/ux-spec-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) — secções 3 (**P0-L1/L2**), 5 (composição SOL+PREF), 6, 7, 10  
**Arquitetura:** [`docs/technical/architecture-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../technical/architecture-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) — secções 5 (config), 6 (composição estado), 7 (*cache*)  
**SOL (existente):** [`docs/technical/architecture-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](../technical/architecture-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) — **SOL-L***, *cache*

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @ux-design-expert — copy secções 6–7; @architect — `resolvePlugnotasEmpresaP0Overlay` + env |

---

## User story

**Como** MEI no Guia MEI (fase registro da empresa no emissor),  
**quero** ver, quando aplicável, um aviso honesto de que o site **não** consegue concluir o cadastro sozinho (**P0-L1**) **ou** um feedback claro quando o cadastro foi concluído com sucesso (**P0-L2**),  
**para** alinhar expectativa ao que a engenharia consegue entregar (**FR-P0-OUT-01** / **FR-P0-OUT-02**) sem contradizer os painéis **PREF** e **SOL**.

---

## Contexto

- Variável de ambiente (ou equivalente acordado na arquitectura P0 secção 5), ex. modo `blocked_externally`, activa **P0-L1** — **sem** CNPJ na config.  
- **P0-L1** renderiza **abaixo** do erro **400** / painel **PREF-L1** quando visível (spec UX secção 5); suprime CTA de “tentar de novo” como primário quando PO exigir.  
- **P0-L2:** após **POST** 2xx e **GET** com dados, *toast* ou *banner* sucinto + limpeza de painéis de erro anteriores; invalidar *cache* GET conforme arquitectura P0 secção 7.  
- **NFR-P0-REG-01:** com *flag* desactivada e sem outros trilhos, fluxo actual permanece igual (paridade **P0-L0**).

---

## Critérios de aceite

### UX / UI

- [ ] **P0-L1:** copy conforme spec UX secção 6 (título + corpo + CTAs); `role="region"` + `aria-label` acessível.  
- [ ] **P0-L2:** feedback conforme spec UX secção 7; **não** *spam* de *toast* a cada *poll*.  
- [ ] Composição com **PREF** + **SOL:** ordem de leitura conforme spec UX secção 5 (PREF primeiro, SOL causal, P0-L1 depois).  
- [ ] Com **P0-L1** activo, utilizador **não** vê CTA primário que prometa sucesso só com clique local se PO definiu essa regra na story spike.

### Técnico

- [ ] Função pura `resolvePlugnotasEmpresaP0Overlay` (ou equivalente) testada em Vitest; compõe com `resolvePlugnotasEmpresaCadastroSolUxState` existente sem duplicar *strings*.  
- [ ] Leitura de `import.meta.env` (Vite) ou config central existente — nome final da variável documentado no `.env.example` se o projeto usar.  
- [ ] Limpeza de estado: painéis âmbar/vermelho de tentativa anterior ao entrar em **P0-L2**.

### Qualidade

- [ ] **NFR-P0-GATE-01:** gates verdes.  
- [ ] Testes RTL ou unitários para: *flag* off → sem P0-L1; *flag* on → P0-L1 visível; transição para P0-L2 *mockada*.

---

## Tasks (indicativas)

1. [x] Adicionar util `resolvePlugnotasEmpresaP0Overlay` + testes.  
2. [x] Integrar em `GuidesMei.tsx` (fase 2 empresa) com props para painéis existentes.  
3. [x] Documentar variável de ambiente no README ou `.env.example`.  
4. [x] **File list** + **Dev Agent Record**.  

---

## File list (indicativo)

- [x] `frontend/src/utils/plugnotasEmpresaP0Overlay.ts` *(novo — nome @dev)*  
- [x] `frontend/src/utils/plugnotasEmpresaP0Overlay.test.ts` *(novo)*  
- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `frontend/.env.example` ou `README` *(se aplicável)*  

---

## CodeRabbit Integration

- Focar: não quebrar fluxos **SOL-L1/L2**; evitar dois `role="alert"` com texto quase igual; *hydration* / SSR se existir.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `frontend/src/utils/plugnotasEmpresaP0Overlay.ts` — `resolvePlugnotasEmpresaP0Overlay`, `readMeiPlugnotasEmpresaCadastroBlockedExternally`, copy P0-L1/L2 (spec UX §6–7).  
- `frontend/src/utils/plugnotasEmpresaP0Overlay.test.ts` — Vitest resolver + env `blocked_externally`.  
- `frontend/src/utils/plugnotasEmpresaP0Overlay.rtl.test.tsx` — RTL (`@testing-library/react`): flag off sem L1; flag on L1; P0-L2 `role="status"`.  
- `frontend/src/pages/GuidesMei.tsx` — composição PREF → SOL (existente) → P0-L1; P0-L2 `role="status"`; `finalizePlugnotasEmpresaCadastroSuccess` limpa `nfEmissionCompanySyncError`; CTA primário retry suprimido com env.  
- `frontend/.env.example` — `VITE_MEI_PLUGNOTAS_EMPRESA_CADASTRO_MODE`.

### Notes

- **P0-L2:** mostrado na transição para `phaseSuccess` (POST ok + GET sem erro «não encontrado»); auto-oculta em 6s; não depende de poll — só de mudança de `kind` no resolver.  
- **P0-L1:** `Entendi` só colapsa o bloco região §6; painel âmbar base mantém-se até novo sucesso / limpeza de estado.  
- **NFR-P0-GATE-01:** `npm run lint`, `npm run typecheck`, `npm test` na raiz — OK (lint com warnings pré-existentes).
- **Seguimento aceite «RTL»:** `plugnotasEmpresaP0Overlay.rtl.test.tsx` — *harness* com o mesmo resolver da página (sem E2E `GuidesMei` completo).

### Change Log

- 2026-04-08 — Implementação P0-L1/L2 + env + testes unitários; integração `GuidesMei`.
- 2026-04-08 — Testes RTL P0 (flag off/on + P0-L2 mockada) em `plugnotasEmpresaP0Overlay.rtl.test.tsx`.

---

## QA Results

*(preencher @qa)*
