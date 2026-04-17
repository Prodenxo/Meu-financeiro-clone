# Story — VIS-THEME (P0): Modo claro — `index.css` (superfícies planner/admin + botão secundário)

**ID:** STORY-VIS-THEME-04  
**Prioridade:** P0 *(alinhada ao PRD modo claro: FR-VIS-THEME-05 a **07** são P0; prioridade efectiva desta story.)*  
**Epic:** E-VIS-THEME-4  
**Estado (backlog):** Concluída (index.css + teste de contrato + rastreio Opção B)  
**Estimativa:** S–M (0,5–2 dias úteis, conforme profundidade de excepções documentadas)  
**Dono sugerido:** Frontend  
**Depende de:** —  
**Fonte:** `docs/prd/PRD-modo-claro-contraste-separadores-controlos-2026-04-17.md` (FR-VIS-THEME-05, FR-VIS-THEME-06, FR-VIS-THEME-07; NFR-VIS-THEME-02, NFR-VIS-THEME-03)  
**Especificação UX:** `docs/specs/ux-spec-modo-claro-contraste-separadores-controlos-2026-04-17.md` §3, §4, §5.1  
**Arquitetura:** `docs/technical/architecture-modo-claro-contraste-separadores-controlos-2026-04-17.md` §1, §2, §3, §5 (itens 1 e 4)  
**Brief:** `docs/brief/brief-modo-claro-contraste-separadores-controlos-2026-04-17.md`  
**Segue-se:** [STORY-VIS-THEME-05](./story-vis-theme-p0-modo-claro-settings-toggle-aparencia.md) (toggle em Definições); QA consolidada em [STORY-VIS-THEME-06](./story-vis-theme-p0-modo-claro-qa-amostragem-contraste-regressao-escuro.md)

## User story

**Como** utilizador que usa o tema claro,  
**quero** ver **contornos claros** em cartões, toolbars, tabelas e **botões secundários** sem confundir blocos com o fundo da página,  
**para** escanear e agir com confiança.

## Definições (refinamento PO)

- **Par canónico (claro):** alinhar contornos exteriores ao token **`--color-surface-border`** (UX spec §3.2), via `rgb(var(--color-surface-border))` ou classe em `index.css` que o incorpore — **sem** segunda borda desnecessária (**FR-VIS-THEME-04** global).  
- **Classes mínimas a rever (PRD):** `.planner-surface`, `.planner-card`, `.planner-card-muted`, `.planner-button-secondary` (e `-compact`), `.admin-toolbar`, `.admin-table-shell`, `.admin-table-row` (coerência com shell), `.admin-stat-card`, `.admin-empty-state`.  
- **Excepções:** qualquer tom diferente do token deve constar no PR com **motivo** (ex.: linha interna de tabela um degrau mais claro — UX spec §3.3).  
- **NFR-VIS-THEME-02:** preferir **1px** e um tom estável; evitar sombra forte **e** borda espessa no mesmo controlo.  
- **Rastreio mensurável (FR-VIS-THEME-05):** na descrição do PR, tabela ou lista **obrigatória** com colunas: **Classe**, **Alteração** (`→ token / equivalente` **ou** `sem alteração`), **Justificação** (obrigatória se “sem alteração” ou se o tom final não for o do token). **Uma** das seguintes opções (equivalentes para aceite):  
  - **Opção A — Lista completa:** **uma linha por classe** da lista “Classes mínimas” (todas), cobrindo edições e **auditoria sem alteração** onde aplicável; **ou**  
  - **Opção B — Linhas só para editadas + frase de fecho:** uma linha por classe **editada** em `index.css`, **e** frase explícita no PR: *“As restantes classes da lista mínima foram auditadas em `index.css` sem necessidade de alteração.”* (ajustar redacção se alguma classe ficar intencionalmente fora de âmbito — documentar).  
  *Objectivo:* eliminar ambiguidade e garantir que **nenhuma** classe mínima fica por contabilizar.

## Verificação manual canónica (tema claro)

- **Rota preferida:** `/settings` (**Definições**), com utilizador que veja o bloco **Administração** (cartão `.planner-card`, `.admin-toolbar`, `.admin-stat-card` — cobre cartão + toolbar + superfície tipo grelha sem exigir outra rota).  
- **Se o revisor não tiver acesso admin:** declarar **N/A** no PR e indicar **rota alternativa mínima** onde, no claro, existam **em simultâneo** componentes que usem `.planner-card` **e** `.admin-toolbar` **e** `.admin-table-shell` (ou equivalente aceite pelo revisor); se não existir numa única página, **duas rotas** nomeadas + nota curta. *(Evita debate “qual vista?”.)*  
- **FR-VIS-THEME-07 (botão secundário em dois contextos):** a verificação “sobre a página” **e** “sobre cartão `.planner-card`” pode ser feita em **dois ecrãs diferentes** na **mesma sessão de teste** (mesmo build), desde que o PR ou *Completion Notes* **nomeiem as rotas** usadas para cada verificação — alinhado à lógica de multi-rota da [STORY-VIS-THEME-06](./story-vis-theme-p0-modo-claro-qa-amostragem-contraste-regressao-escuro.md) (itens B/C).

## Contexto técnico

- Ficheiro principal: `frontend/src/index.css` (`@layer components`).  
- **Não** alterar `:root` salvo acordo explícito no PR (preferir consumo do token existente).  
- Tema escuro: alterar apenas se necessário para **evitar regressão**; validação cruzada formal em [STORY-VIS-THEME-06](./story-vis-theme-p0-modo-claro-qa-amostragem-contraste-regressao-escuro.md) (**NFR-VIS-THEME-04**). *Sanity rápida no escuro no mesmo PR é recomendada.*  
- Varredura TSX longa (ex.: `GuidesMei.tsx`) **fora** desta story salvo PO priorizar follow-up; anti-padrões em §6 da UX spec modo claro podem ser story separada.

## Critérios de aceite

- [x] Em **tema claro**, verificação manual segundo **Verificação manual canónica** acima: contornos **perceptíveis** vs `bg-slate-100` para as classes aplicadas nessa vista (**FR-VIS-THEME-06**).  
- [x] **`.planner-button-secondary`** (e `-compact`) tem **borda ou fundo** perceptível em repouso no claro **sobre a página** e **sobre cartão** `.planner-card` (**FR-VIS-THEME-07**) — mesma sessão de teste; **ecrãs distintos permitidos** com rotas nomeadas (ver **Verificação manual canónica** e [evidence STORY-06 §2 (B)(C)](../qa/evidence-vis-theme-modo-claro-2026-04-17.md)).  
- [x] **FR-VIS-THEME-05:** cumprido o **Rastreio mensurável** (**Opção B** — ver *Completion Notes* e `docs/qa/evidence-vis-theme-modo-claro-2026-04-17.md`).  
- [x] **Paridade:** sem wrappers só para somar borda em `.planner-card` / admin (**FR-VIS-THEME-04**).  
- [x] PR inclui **excepções** ao token (se houver) e o **Rastreio mensurável** (ou link para secção equivalente no corpo do PR). *(Nenhuma excepção ao token nesta entrega; rastreio na evidência.)*  
- [x] `npm run lint`, `npm run typecheck`, `npm run test` verdes no `frontend` (**NFR-VIS-THEME-03**: diff focado em IU).  
- [x] Nenhuma alteração funcional, guards ou copy de negócio não relacionada.

## Fora de escopo

- Toggle de tema em Definições ([STORY-VIS-THEME-05](./story-vis-theme-p0-modo-claro-settings-toggle-aparencia.md)).  
- Evidência formal de QA / WebAIM ([STORY-VIS-THEME-06](./story-vis-theme-p0-modo-claro-qa-amostragem-contraste-regressao-escuro.md)).  
- Varredura massiva de `border-slate-*` em todas as páginas.

## File list (checklist implementação)

- [x] `frontend/src/index.css` (principal)  
- [x] `frontend/src/index.visThemeModoClaroBorders.test.ts` (contrato STORY-04 — regressão de token nas classes mínimas)  
- [x] Rastreio Opção B + rotas FR-07: [evidence-vis-theme-modo-claro-2026-04-17.md](../qa/evidence-vis-theme-modo-claro-2026-04-17.md) + *Completion Notes* abaixo

## Definition of Done

- Critérios de aceite satisfeitos; revisão confirma ausência de alteração funcional não intencional.  
- PR liga **esta story**, o **PRD modo claro** e a **UX spec modo claro**.

## Notas de refinamento (PO → SM)

- **2026-04-17:** epic E-VIS-THEME-4; dependência lógica com STORY-05 e STORY-06; IDs 04–06 reservados à Onda claro.  
- **2026-04-17 (2.ª ronda — critérios PO):** prioridade **P0** alinhada ao PRD; **Rastreio mensurável** FR-05; **rota canónica** `/settings` + regra N/A; sanity escuro recomendado no PR.  
- **2026-04-17 (3.ª ronda — critérios PO):** FR-05 com **Opção A / Opção B** (lista mínima contabilizada); FR-07 com **dois ecrãs nomeados** permitidos na mesma sessão.

---

## Dev Agent Record

### Status

Implementado (token `--color-surface-border` nas classes mínimas editadas; ver Opção B na evidência STORY-06).

### Agent Model Used

Composer

### Completion Notes List

- Bordas no tema claro alinhadas a `border-[color:rgb(var(--color-surface-border))]` em `.planner-surface` (e por herança `.planner-card`), `.planner-card-muted`, `.planner-button-secondary`, superfícies admin listadas na story.
- Rastreio mensurável **Opção B:** classes **editadas** em `index.css` — `.planner-surface`, `.planner-card-muted`, `.planner-button-secondary`, `.admin-stat-card`, `.admin-toolbar`, `.admin-table-shell`, `.admin-table-row`, `.admin-empty-state`. **As restantes classes da lista mínima** foram auditadas: `.planner-card` herda `.planner-surface`; `.planner-button-secondary-compact` herda `.planner-button-secondary` — sem alteração adicional necessária.
- Verificação manual canónica: **`/settings`** (com bloco Administração se perfil permitir). FR-07 amostragem de rotas: ver evidência STORY-06 (`/orcamentos` + `/guias-mei` modal).
- Teste de contrato: `index.visThemeModoClaroBorders.test.ts` impede regressão do token nas classes mínimas (parser por profundidade de chavetas; inclui herança `admin-hero` / `admin-section-card` → `planner-card`).

### File List

- `frontend/src/index.css`
- `frontend/src/index.visThemeModoClaroBorders.test.ts`

### Change Log

- 2026-04-17: bordas claro → token `--color-surface-border` nas classes indicadas.
- 2026-04-17: teste Vitest de contrato STORY-04; story e critérios fechados.
- 2026-04-17: teste de contrato endurecido (parser de bloco + herança admin-hero / admin-section-card) após review QA.

## QA Results

- Evidência consolidada: [evidence-vis-theme-modo-claro-2026-04-17.md](../qa/evidence-vis-theme-modo-claro-2026-04-17.md) (secção 2 com ratios baseline; R1–R3 em STORY-06; assinatura QA opcional para release).
- **Follow-up review QA (Quinn):** `index.visThemeModoClaroBorders.test.ts` passou a extrair cada regra por **profundidade de chavetas** (robusto a `@apply` multilinha / `}` dentro do bloco); acrescentadas asserções para **`.admin-hero`** e **`.admin-section-card`** → `@apply planner-card` (borda via `.planner-surface`). Contraste pixel e pipeline Tailwind continuam cobertos pela **STORY-06**; **`.planner-input`** (`border-slate-200`) mantém-se **fora** da lista mínima desta story (escopo).
