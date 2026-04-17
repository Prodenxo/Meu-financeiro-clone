# Story — VIS-THEME (P1): Guias MEI — divisórias e bordas alinhadas ao padrão

**ID:** STORY-VIS-THEME-02  
**Prioridade:** P1  
**Epic:** E-VIS-THEME-2  
**Estado (backlog):** Implementada (aguarda PR / verificação manual)  
**Estimativa:** M–L (2–5 dias úteis, conforme varredura total vs PRs incrementais e tamanho actual de `GuidesMei.tsx`)  
**Dono sugerido:** Frontend  
**Depende de:** — (opcional: após [STORY-VIS-THEME-01](./story-vis-theme-p1-modais-fecho-e-classes-ui.md) para reduzir conflitos de merge em `frontend/` — recomendado pelo PRD §11)  
**Fonte:** `docs/prd/PRD-revisao-visual-temas-claro-escuro-2026-04-17.md` (FR-VIS-THEME-01, FR-VIS-THEME-04)  
**Especificação UX:** `docs/specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md` §5.1, §5.2, §4.2, §6  
**Arquitetura:** `docs/technical/architecture-revisao-visual-temas-claro-escuro-2026-04-17.md` §5.2–5.3  
**QA consolidada (Onda 1):** [STORY-VIS-THEME-03](./story-vis-theme-p0-qa-regressao-visual-e-contraste.md) — esta entrega alimenta o **item 7** do checklist UX spec §8 (`/guias-mei`, divisórias perceptíveis). Opcional: sumário em `docs/qa/evidence-vis-theme-02-guidesmei-bordas.md` para arquivo junto da evidência global.

## User story

**Como** utilizador MEI que percorre fluxos longos em Guias MEI,  
**quero** **divisórias e contornos de secção** perceptíveis em tema claro e escuro,  
**para** orientar-me sem confundir blocos com o fundo.

## Definições (refinamento PO)

- **Par canónico (referência):** conforme UX spec §5.1 — exemplos: separadores horizontais `border-slate-200` / `dark:border-slate-700` (evitar anti-padrão isolado `border-slate-200/80` + `dark:border-slate-700/80` sem alinhamento ao token).  
- **Cobertura para aceite (escolher uma e declarar no PR):**  
  - **Opção A — Varredura por padrão:** substituir **todas** as ocorrências, em `GuidesMei.tsx`, dos **padrões legados** listados no PR (ex.: resultados de `grep` para `border-slate-200/` e `dark:border-slate-7` com opacidade) pelo par canónico ou equivalente documentado — lista dos padrões substituídos **obrigatória** no corpo do PR.  
  - **Opção B — Âncoras mínimas:** pelo menos **3** zonas distintas da página (cada uma com **nome curto** + **referência**: linha aproximada ou comentário JSX / texto de cabeçalho visível) onde, após scroll, **divisórias/contornos** cumprem o padrão e são perceptíveis em **claro e escuro**. Se o restante do ficheiro não for alterado, o PR deve indicar **motivo** e se existe **follow-up** (nova story ou não) — sujeito a acordo de PO se ficar débito visível.  
- **Padrão escolhido:** o PR deve incluir **uma** secção “Padrão divisórias Guias MEI” (ou equivalente) com o par/decisão (UX spec §5.2).  
- **PRs em série:** se houver **mais do que um** PR para esta story, o **fecho** da cobertura (**Opção A** ou **Opção B** na totalidade) deve ficar explícito no **último** PR da série **ou** num **comentário meta** no **primeiro** PR (indicar números/links dos PRs seguintes e em que PR a cobertura fica **completa**). Evita ambiguidade entre “parcialmente feito” e “story cumprida”.

## Contexto técnico

- Ficheiro principal: `frontend/src/pages/GuidesMei.tsx` (alta densidade de `border-slate-*/*`).  
- Substituir padrões equivalentes pelo par canónico da UX spec §5.1.  
- **Opcional:** classe `.ui-border-section` em `index.css` (UX spec §6) + uso gradual; **atualizar** a UX spec §6 no merge se a classe for introduzida.  
- **Paridade:** não adicionar `border-none` ou wrapper com segunda borda em cartões que já usam `.planner-card` / classes admin sem necessidade (**FR-VIS-THEME-04**).  
- Alterações **puramente visuais**; regras funcionais do PRD Mei Infinito prevalecem.

## Critérios de aceite

- [x] **Cobertura:** cumprida a **Opção A** ou **Opção B** da secção “Definições”, com a declaração correspondente no PR (ou, em série de PRs, conforme regra **PRs em série** nas Definições). *(Opção A — ver lista de padrões em *Completion Notes*.)*  
- [ ] Divisórias/contornos nas zonas abrangidas são **perceptíveis** em **tema claro** e **tema escuro** (verificação manual).  
- [ ] **Padrão** documentado explicitamente no PR (secção “Padrão divisórias Guias MEI” ou equivalente). *(Modelo em *Completion Notes* + `docs/qa/evidence-vis-theme-02-guidesmei-bordas.md`.)*  
- [x] PRs incrementais permitidos (por secção ou por padrão de classe); **sem** misturar refactor funcional com troca de classes (**NFR-VIS-THEME-03**). Com vários PRs, o **último** PR **ou** o comentário meta no **primeiro** PR confirma que a Opção A ou B está **integralmente** cumprida. *(Um PR único possível.)*  
- [x] `npm run lint`, `npm run typecheck`, `npm test` verdes no `frontend`.  
- [x] Nenhuma mudança de comportamento, guards, ou copy de negócio não relacionada com contraste visual.

## Fora de escopo

- Outras rotas fora de `GuidesMei.tsx` nesta story (podem ser follow-up se PO priorizar).  
- Modais de catálogo ([STORY-VIS-THEME-01](./story-vis-theme-p1-modais-fecho-e-classes-ui.md)).

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx` (principal)  
- [x] `frontend/src/index.css` (se `.ui-border-section`)  
- [x] `docs/specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md` (atualizar §6 se nova classe)  
- [x] `docs/qa/evidence-vis-theme-02-guidesmei-bordas.md` (**opcional** — sumário para [STORY-VIS-THEME-03](./story-vis-theme-p0-qa-regressao-visual-e-contraste.md))

## Definition of Done

- Critérios de aceite satisfeitos; revisão confirma ausência de alteração funcional não intencional.  
- Descrição do PR liga **esta story**, o **PRD** e contém o **padrão** e a **opção de cobertura** (A ou B). Em série de PRs, cumpre a regra **PRs em série** (último PR ou comentário meta no primeiro).  
- Se `.ui-border-section` ou alteração à UX spec §6: ficheiros de spec atualizados no mesmo merge ou PR associado.

## Notas de refinamento (PO → SM)

- **2026-04-17:** cobertura mensurável (Opção A vs B), meta planeamento, ligação a STORY-03 / checklist §8 item 7, DoD alinhado à STORY-01, estimativa M–L.  
- **2026-04-17 (2.ª ronda):** regra **PRs em série** — fecho explícito da cobertura A/B (último PR ou comentário meta no primeiro).

## Qualidade / CodeRabbit

- Diff grande é esperado; preferir **vários PRs** nomeados (ex.: “VIS-THEME: GuidesMei — bloco NFS-e”) para facilitar revisão; usar a regra **PRs em série** para fechar a story sem ambiguidade.  
- Em caso de conflito com spec MEI, **parar** e alinhar com PO — não alterar requisitos funcionais.

---

## Dev Agent Record

### Status

Implementado (aguarda PR + smoke visual claro/escuro)

### Agent Model Used

—

### Completion Notes List

- **Cobertura:** **Opção A** — varredura em `GuidesMei.tsx` de bordas slate neutras com opacidade, substituídas por `border` / `border-t` + `.ui-border-section` (`border-slate-200` / `dark:border-slate-700`, UX spec §5.1).
- **Padrões substituídos (para colar no PR):** `border-slate-200/80|70|90` + `dark:border-slate-700/80|70`; `border-slate-300/80|85` + `dark:border-slate-700/80` ou `dark:border-slate-600/80|70` — alinhados ao par canónico. **Não alterado:** callouts amber/emerald/sky/violet; spinners (`border-slate-400`, etc.).
- **Padrão divisórias Guias MEI (PR):** par canónico `border-slate-200` / `dark:border-slate-700`; classe `.ui-border-section` em `index.css` (§6 UX spec). Evidência: `docs/qa/evidence-vis-theme-02-guidesmei-bordas.md` (inclui **bloco pronto para colar no PR**).
- **Follow-up QA:** `GuidesMei.visThemeBorders.test.ts` — contrato Opção A (sem padrões `border-slate-*/*` legados; ≥11 `ui-border-section`; `index.css` com `.ui-border-section`).

### File List (implementação)

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/index.css`
- `docs/specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md` (§6)
- `docs/qa/evidence-vis-theme-02-guidesmei-bordas.md`
- `frontend/src/pages/GuidesMei.visThemeBorders.test.ts`

### Debug Log References

—

### Change Log

- **2026-04-17** — Follow-up QA: `GuidesMei.visThemeBorders.test.ts` + texto PR em evidência QA.
- **2026-04-17** — Implementação STORY-VIS-THEME-02: `.ui-border-section` + varredura Opção A em `GuidesMei.tsx` (Dex).
- **2026-04-17** — Story criada (SM) a partir do PRD, UX spec e arquitetura.  
- **2026-04-17** — Refinamento PO: definições Opção A/B, meta (estado, estimativa, dono), STORY-03 + item 7 §8, DoD/spec §6, ficheiro opcional `docs/qa/evidence-vis-theme-02-guidesmei-bordas.md`, status Ready for development.  
- **2026-04-17** — Refinamento 3: **PRs em série** (Definições, AC, DoD, Qualidade) — feedback PO sobre fecho da cobertura A/B.

---

## QA Results

**Data:** 2026-04-17 · **Revisor:** Quinn (AIOX QA)

**Gate:** PASS condicional — merge após verificação manual claro/escuro em `/guias-mei`, descrição do PR com **Opção A**, secção **«Padrão divisórias Guias MEI»** e lista de padrões substituídos (pode apontar para `docs/qa/evidence-vis-theme-02-guidesmei-bordas.md`).

**Rastreio**

| Critério | Evidência |
|----------|-----------|
| Opção A (varredura `GuidesMei.tsx`) | **Satisfeito no código:** 11 usos de `ui-border-section`; **sem** `border-slate-*/*` residual em contornos neutros. Restam só **spinners** (`border-slate-400` / `border-2`…), coerente com *Completion Notes* (fora do âmbito divisórias de secção). |
| Par canónico §5.1 | `.ui-border-section` em `index.css` com `@apply border-slate-200 dark:border-slate-700`. |
| UX spec §6 + evidência | Parágrafo STORY-VIS-THEME-02 na spec; `docs/qa/evidence-vis-theme-02-guidesmei-bordas.md` presente. |
| FR-VIS-THEME-04 (sem segunda borda desnecessária) | **Sem** indícios de wrapper extra; troca de cor de borda / classe utilitária apenas. |
| NFR-VIS-THEME-03 (só IU) | Diff limitado a classes/CSS/docs; sem alteração de guards ou copy de negócio. |
| Verificação manual claro/escuro | **Pendente** (checklist §8 item 7 / STORY-03). |
| Texto no PR (padrão + lista padrões) | **Pendente** até abertura do PR (DoD). |

**Notas:** Regressão de **tokens** coberta por `GuidesMei.visThemeBorders.test.ts` (não substitui smoke visual). Smoke manual recomendado em NFS-e / filtros / blocos com `border-t ui-border-section`.

**Follow-up Dev (2026-04-17):** `GuidesMei.visThemeBorders.test.ts` (`@vitest-environment node`, contrato de fonte + `index.css`); secção «Texto para descrição do PR» em `docs/qa/evidence-vis-theme-02-guidesmei-bordas.md`. **Pendente humano:** smoke claro/escuro no browser; colar texto do PR (ou resumo + link ao doc).

**Evidência Onda 1 (STORY-VIS-THEME-03):** [evidence-vis-theme-onda1-qa.md](../qa/evidence-vis-theme-onda1-qa.md) (checklist §8 item 7).
