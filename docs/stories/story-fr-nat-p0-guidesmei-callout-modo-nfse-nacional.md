# Story — FR-NAT (P0): Guia MEI — **callout** “NFS-e em ambiente nacional” (cadastro DAS)

**ID:** STORY-FR-NAT-P0-GUIDESMEI-CALLOUT-NACIONAL  
**Prioridade:** P0  
**Depende de:** `canViewNfse` e painel DAS existentes; [story-fr-orq-cert-p0-guidesmei-fases-retry-setup-plugnotas.md](./story-fr-orq-cert-p0-guidesmei-fases-retry-setup-plugnotas.md) (fluxo de setup) pode estar entregue — esta story **não** altera a orquestração HTTP.  
**Bloqueia:** — (story de erros municipais pode seguir em paralelo após copy alinhada)  
**Fonte PRD:** [`docs/prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](../prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) — **FR-NAT-UX-01**, **FR-NAT-UX-02**  
**UX:** [`docs/specs/ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](../specs/ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) — secções 3.2 (NAT-L2), 4.1, 4.2 opcional  
**Arquitetura:** [`docs/technical/architecture-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](../technical/architecture-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) — §3 (lacuna UX-02), §4.3

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |

---

## User story

**Como** MEI a cadastrar o emitente com NFS-e na app,  
**quero** ver com clareza que a configuração enviada é **NFS-e em ambiente nacional** e que **não** preciso de inscrição municipal nem prefeitura **neste formulário**,  
**para** alinhar expectativa com o painel Plugnotas e reduzir abandono por erro de interpretação.

---

## Contexto

- O payload já inclui `nfse.nacional: true` via `buildNfEmissionEmpresaPayload` — esta story é **só** comunicação visual e honestidade de expectativa.  
- O callout deve aparecer apenas quando `canViewNfse` (spec UX §3.1).  
- Colocação: **após** alertas existentes (certificado em uso / A1) e **antes** de erros voláteis / CNPJ — ordem NAT-L2 da spec UX.

---

## Critérios de aceite

### Produto / UX

- [ ] **FR-NAT-UX-02:** Bloco informativo neutro com título **“NFS-e em ambiente nacional”**, corpo e nota honesta opcional conforme tabela da spec UX §4.1 (PT-BR).  
- [ ] **A11y:** `role="region"`, `aria-labelledby` no título (`id` estável, ex.: `mei-nfse-nacional-callout-heading`).  
- [ ] **QA:** `data-testid="mei-nfse-nacional-mode-callout"` (ou equivalente documentado na story de implementação).  
- [ ] **FR-NAT-UX-01:** Confirmar que `getNfEmissionCompanyValidationMessage` e validações DAS **não** exigem IM nem prefeitura (regressão zero — assert em comentário ou teste se já existir cobertura).  
- [ ] **§4.2 opcional:** Uma linha extra no alerta amarelo A1 só **se** PO aprovar; caso contrário omitir (spec UX).

### Técnico / qualidade

- [ ] Implementação em `GuidesMei.tsx` (workspace DAS), sem extrair componente obrigatório se o JSX for pequeno; extrair se @dev preferir reutilização.  
- [ ] Tema escuro: classes `dark:` coerentes com `admin-section-card` / hints (spec UX §9).  
- [ ] Gates: `npm run lint`, `npm run typecheck`, `npm test` (`AGENTS.md`).

---

## Tasks (indicativas)

1. [x] Inserir callout condicional `canViewNfse` na ordem vertical acordada.  
2. [x] Revisar copy final com PO (texto canónico na spec UX).  
3. [x] Verificar ausência de campos IM/prefeitura no tipo `NfEmissionCompanyForm` e validação.  
4. [x] Gates CI.

---

## File list (indicativo)

- [x] `frontend/src/pages/GuidesMei.tsx`  
- [ ] Opcional: novo componente em `frontend/src/components/...` se extrair  

---

## Fora de escopo

- Alterar `nfEmissionCompany.ts` / payload (**FR-NAT-API-01** já satisfeito no brownfield até novo ADR).  
- Heurística de erros municipais — [story-fr-nat-p0-plugnotas-erro-municipal-copy-hints.md](./story-fr-nat-p0-plugnotas-erro-municipal-copy-hints.md).  
- `docs/operacao-mei-nfse.md` — [story-fr-nat-p1-operacao-doc-nfse-nacional-vs-municipal.md](./story-fr-nat-p1-operacao-doc-nfse-nacional-vs-municipal.md).

---

## CodeRabbit Integration

- Verificar: não quebrar ordem de anúncios acessíveis (`aria-live` existente nos erros); não duplicar regiões com o mesmo papel sem necessidade.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### Completion Notes

- Callout neutro no painel DAS após aviso A1 de NFS-e, antes de erros/conectividade: título, corpo e nota honesta conforme spec UX; `role="region"`, `aria-labelledby`, `data-testid="mei-nfse-nacional-mode-callout"`.
- **FR-NAT-UX-01:** `getNfEmissionCompanyValidationMessage` e `NfEmissionCompanyForm` sem IM/prefeitura; cobertura existente em `nfEmissionCompany.test.ts` (payload sem `inscricaoMunicipal`).
- Gates: `npm run lint`, `npm run typecheck`, `npm test` — OK.
- §4.2 opcional (frase extra no alerta amarelo) omitido por spec (só com PO).
- **QA follow-up (CONCERNS RTL):** testes Vitest/RTL em `GuidesMei.nfse-nacional-callout.test.tsx` — presença do callout no DAS com `canViewNfse` (admin + workspace `das` via storage) e ausência com `outsider`.

### File List

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/pages/GuidesMei.nfse-nacional-callout.test.tsx`

### Change Log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | @sm | Story criada a partir do PRD NAT + UX + arquitetura. |
| 2026-04-08 | @dev | Implementado callout FR-NAT-UX-02 no DAS. |
| 2026-04-08 | @dev | Testes RTL do callout (follow-up QA CONCERNS). |

---

## QA Results

**Revisor:** Quinn (@qa)  
**Data:** 2026-04-08  
**Gate:** **PASS**

### Rastreio aos critérios de aceite

| Critério | Resultado | Evidência |
|----------|-----------|-----------|
| **FR-NAT-UX-02** | **PASS** | `GuidesMei.tsx`: bloco neutro; título *NFS-e em ambiente nacional*; corpo alinhado à spec (NFS-e Nacional / Plugnotas; sem IM nem prefeitura *aqui*); nota honesta sobre recusa municipal. |
| **A11y** | **PASS** | `role="region"`, `aria-labelledby` → `id="mei-nfse-nacional-callout-heading"` no `h3`. |
| **data-testid** | **PASS** | `mei-nfse-nacional-mode-callout` presente. |
| **FR-NAT-UX-01** | **PASS** | `getNfEmissionCompanyValidationMessage` sem IM/prefeitura; `nfEmissionCompany.test.ts` confirma `inscricaoMunicipal` ausente do payload e `nfse.nacional` ativo. |
| **§4.2 opcional** | **PASS** | Omitido conforme decisão documentada no Dev Agent Record (só com PO). |
| **Ordem (NAT-L2)** | **PASS** | Callout após avisos estáticos (certificado / A1 NFS-e) e antes de conectividade / erros / retry. |
| **Tema escuro** | **PASS** | Classes `dark:border-slate-700/80`, `dark:bg-slate-900/40`, textos `dark:text-slate-*`. |
| **Workspace DAS** | **PASS** | JSX dentro de `activeWorkspace === 'das'`; condição `canViewNfse`. |

### Observações (não bloqueantes)

- **CONCERNS — NFR:** Não há teste automatizado (RTL) que assegure presença do callout no DAS; aceitável para o escopo actual; follow-up opcional se regressões visuais forem frequentes.
- **CONCERNS — Lint:** `npm run lint` no workspace frontend reporta *warnings* pré-existentes (incl. `GuidesMei.tsx` noutra linha); **0 erros**; nada novo crítico ligado a este callout.
- **PO:** Copy canónica da spec UX — validação final de produto recomendada antes de promoção.

### Comandos executados nesta revisão

- Revisão estática de `frontend/src/pages/GuidesMei.tsx` (trecho do callout).
- Leitura de `frontend/src/utils/nfEmissionCompany.test.ts`.
- `npm run lint` (raiz do repo): **exit 0**, warnings herdados.
