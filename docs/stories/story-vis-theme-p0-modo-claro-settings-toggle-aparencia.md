# Story — VIS-THEME (P0): Modo claro — Definições › Aparência (toggle tema)

**ID:** STORY-VIS-THEME-05  
**Prioridade:** P0 *(alinhada ao PRD modo claro: FR-VIS-THEME-08 é P0; prioridade efectiva desta story.)*  
**Epic:** E-VIS-THEME-4  
**Estado (backlog):** Concluída (implementação + testes)  
**Estimativa:** S (0,25–1 dia útil)  
**Dono sugerido:** Frontend  
**Depende de:** [STORY-VIS-THEME-04](./story-vis-theme-p0-modo-claro-index-css-bordas-botao-secondary.md) **recomendado** (reduz conflitos de merge e alinha token visual antes do toggle; pode ser paralelo se PO aceitar risco de rebase)  
**Fonte:** `docs/prd/PRD-modo-claro-contraste-separadores-controlos-2026-04-17.md` (FR-VIS-THEME-08; NFR-VIS-THEME-01, NFR-VIS-THEME-02, NFR-VIS-THEME-04 sanity)  
**Especificação UX:** `docs/specs/ux-spec-modo-claro-contraste-separadores-controlos-2026-04-17.md` §5.2, §5.3, §7  
**Arquitetura:** `docs/technical/architecture-modo-claro-contraste-separadores-controlos-2026-04-17.md` §4, §5 (itens 2–4)  
**Brief:** `docs/brief/brief-modo-claro-contraste-separadores-controlos-2026-04-17.md`  
**Segue-se:** [STORY-VIS-THEME-06](./story-vis-theme-p0-modo-claro-qa-amostragem-contraste-regressao-escuro.md) (evidência de contraste e regressão escuro)

## User story

**Como** utilizador em tema claro,  
**quero** que o **interruptor de Aparência** (modo escuro) tenha **trilho e estados** claramente visíveis e acessíveis,  
**para** alternar o tema sem erro e sem depender de hover.

## Definições (refinamento PO)

- **Ficheiro alvo:** `frontend/src/pages/Settings.tsx` — secção “Aparência”.  
- **Rota canónica de verificação:** **`/settings`** (Definições) — alinhada a [STORY-VIS-THEME-04](./story-vis-theme-p0-modo-claro-index-css-bordas-botao-secondary.md) e [STORY-VIS-THEME-06](./story-vis-theme-p0-modo-claro-qa-amostragem-contraste-regressao-escuro.md); o PR deve mencionar esta rota na descrição ou em *Completion Notes*.  
- **Semântica (UX spec §5.3):** `role="switch"`, `aria-checked={isDarkMode}`, `aria-label` claro para leitores de ecrã (ex.: indicar estado ou acção).  
- **Claro — estado off:** trilho com **borda 1px** e/ou fundo suficientemente distinto de `bg-slate-100` — **proibido** para aceite: apenas `bg-gray-300` sem limite se reproduzir colagem (UX spec §5.2).  
- **Estado on / escuro:** manter distinção thumb/trilho; **focus-visible** com anel coerente a `index.css` (focus-ring global).  
- **Área tocável:** mínimo **44×44** px de alvo (o trilho pequeno pode ficar dentro de hit area maior).  
- **Fonte de estado:** continua **`useThemeStore`** (`toggleTheme`, `isDarkMode`) — **sem** segundo estado paralelo no DOM.

## Contexto técnico

- Não extrair componente genérico **obrigatório** nesta story; opcional follow-up se a equipa quiser reutilizar.  
- **NFR-VIS-THEME-03:** PR focado em `Settings.tsx` (+ testes se existirem).

## Critérios de aceite

- [x] Toggle cumpre **FR-VIS-THEME-08** em tema claro (off = trilho/contorno visível; on = distinto), verificação manual em **`/settings`** (secção Aparência).  
- [x] **Semântica:** `role="switch"` (ou equivalente acordado com UX), `aria-checked`, `aria-label`, foco visível.  
- [x] **NFR-VIS-THEME-01:** descrição do PR inclui par **fundo + primeiro plano** (trilho/thumb ou borda) e resultado **pass AA** ou nota de ferramenta — mínimo para este controlo — ver [evidence-vis-theme-modo-claro-2026-04-17.md](../qa/evidence-vis-theme-modo-claro-2026-04-17.md) §2 (D)(E).  
- [x] Verificação manual **tema escuro:** toggle continua legível em **`/settings`** (**NFR-VIS-THEME-04** sanity — evidência pode consolidar-se na STORY-06).  
- [x] `npm run lint`, `npm run typecheck`, `npm run test` verdes no `frontend`.  
- [x] Sem alteração de lógica de tema além de apresentação e a11y.

## Fora de escopo

- Alterações globais em `index.css` cobertas por [STORY-VIS-THEME-04](./story-vis-theme-p0-modo-claro-index-css-bordas-botao-secondary.md) (salto mínimo partilhado aceitável no mesmo PR **só** se PO aceitar merge único).  
- Checklist QA completo Onda 1 ([STORY-VIS-THEME-06](./story-vis-theme-p0-modo-claro-qa-amostragem-contraste-regressao-escuro.md)).

## File list (checklist implementação)

- [x] `frontend/src/pages/Settings.tsx` (principal)  
- [x] Testes: `frontend/src/pages/Settings.aparencia-switch.test.tsx` (STORY-05 — switch semântico e `useThemeStore`)

## Definition of Done

- Critérios satisfeitos; PR referencia esta story, PRD e UX spec modo claro.  
- Evidência NFR mínima no corpo do PR; rota **`/settings`** indicada.

## Notas de refinamento (PO → SM)

- **2026-04-17:** ID 05; dependência recomendada com STORY-04.  
- **2026-04-17 (2.ª ronda — critérios PO):** prioridade **P0** alinhada ao PRD (**FR-VIS-THEME-08**); **rota canónica** `/settings`; NFR-04 explicitado na linha de Fonte; DoD com rota.

---

## Dev Agent Record

### Status

Implementado (`/settings` — Aparência: switch semântico, borda no trilho off, área tocável ≥44×44).

### Agent Model Used

Composer

### Completion Notes List

- `role="switch"`, `aria-checked={isDarkMode}`, `aria-label` dinâmico; trilho off com `border-[color:rgb(var(--color-surface-border))]` + `bg-slate-300`; foco via regra global `button:focus-visible` em `index.css`.
- Rota canónica de verificação: **`/settings`**.
- Testes Vitest: `Settings.aparencia-switch.test.tsx` (semântica + alternância + **classes do trilho** off/on + **foco** via `.focus()`).
- NFR-01 par trilho/thumb: evidência [evidence-vis-theme-modo-claro-2026-04-17.md](../qa/evidence-vis-theme-modo-claro-2026-04-17.md) §2 (D)(E).

### File List

- `frontend/src/pages/Settings.tsx`
- `frontend/src/pages/Settings.aparencia-switch.test.tsx`

### Change Log

- 2026-04-17: toggle Aparência — a11y e contraste visual trilho off.
- 2026-04-17: testes de regressão STORY-05.
- 2026-04-17: testes extra (trilho off/on + foco) após review QA.

## QA Results

- Evidência NFR (incl. par toggle): [evidence-vis-theme-modo-claro-2026-04-17.md](../qa/evidence-vis-theme-modo-claro-2026-04-17.md).
- **Follow-up ao review QA (Quinn):** testes Vitest alargados — classes do **trilho** off/on (`bg-slate-300` + token de borda vs `bg-blue-600`); teste de **foco** (`document.activeElement` no `role="switch"`). O **anel `:focus-visible`** continua definido globalmente em `index.css` (jsdom não reproduz o desenho do ring; smoke visual em `/settings` opcional antes de release).
