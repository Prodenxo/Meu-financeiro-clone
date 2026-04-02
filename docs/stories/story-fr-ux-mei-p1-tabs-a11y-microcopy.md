# Story — FR-UX-MEI (P1): Mei Infinito — Acessibilidade dos tabs e microcopy

**ID:** STORY-FR-UX-MEI-P1  
**Prioridade:** P1 (Should — PRD onda 2)  
**Depende de:** [story-fr-ux-mei-p0-visao-geral-kpis-tabs.md](./story-fr-ux-mei-p0-visao-geral-kpis-tabs.md) (recomendado: merge P0 primeiro para evitar conflitos na mesma área)  
**Fonte:** `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md` (FR-UX-MEI-05, FR-UX-MEI-06)  
**Especificação UX:** `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` §4.2, §6

## User story

**Como** utilizador (incl. teclado e leitor de ecrã) na área Mei Infinito,  
**quero** separadores do fluxo com estado ativo evidente e textos de apoio que me orientem sem contradizer os dados,  
**para** navegar com confiança e cumprir objetivo de acessibilidade AA nos controlos principais.

## Contexto técnico

- **Ficheiro principal:** `frontend/src/pages/GuidesMei.tsx` — bloco “Fluxo do MEI” (botões `workspaceTabs`).  
- **CSS:** `frontend/src/index.css` — `.planner-tab-active` (reforço contraste *dark*, *ring* ou borda — uma decisão, spec §4.2).  
- Semântica: preferir `role="tablist"` nos contentores, `role="tab"` + `aria-selected` + `aria-controls` / painéis com `role="tabpanel"` **ou** evolução mínima: `aria-selected` consistente em vez de só `aria-pressed`, mais foco `focus-visible`.

## Critérios de aceite

### FR-UX-MEI-05 — Tabs e teclado

- [x] Tab ativo distingue-se claramente em **modo escuro** (contraste perceptível; alinhar à decisão única da spec).  
- [x] **Foco visível** em todos os tabs ao navegar por teclado (`Tab` / `Shift+Tab`).  
- [x] Atributos ARIA adequados: **ou** *tablist* completo com `aria-selected` e associação painel/conteúdo, **ou** documentar excecão mínima com `aria-selected` + ordem de foco = ordem visual (spec §4.2).

### FR-UX-MEI-06 — Microcopy

- [x] Pelo menos **uma** das melhorias opcionais da spec §6 aplicada com dados reais, sem inventar estado:
  - segunda linha dinâmica no hero se `dasPendentesCount > 0`, **ou**
  - ajuste subtítulo “Fluxo do MEI” quando P0 tiver removido números duplicados nos badges, **ou**
  - refinamento subtítulo “Visão geral operacional”.  
- [x] Nenhuma string dinâmica depende de campos inexistentes no componente.

## Fora de escopo

- Persistência de última tab (P2).  
- Alteração de cores globais do tema.

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `frontend/src/index.css` (se foco / tab ativo)

## Definition of Done

- Verificação manual: teclado nos 3–4 tabs; leitor de ecrã smoke (VoiceOver/NVDA) nos tabs sem anúncios errados de “pressionado” vs selecionado.  
- `npm run lint`, `npm run typecheck`, `npm test` (frontend) verdes.

## Qualidade / CodeRabbit

- Se `tablist`/`tabpanel`: IDs estáveis para `aria-controls`; um único painel visível por `activeWorkspace` para não duplicar regiões vivas no DOM de forma confusa.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- FR-UX-MEI-05: `role="tablist"` + `role="tab"` com `aria-selected`, `aria-controls`, `id` estáveis `mei-tab-*` / `mei-panel-*`; painéis por *workspace* (`overview` em `<section>`, `das`/`nfse` em `<div className="space-y-…">`, `parcelamentos` em `<section>`); removido `aria-pressed`. Classes `.mei-fluxo-tab` / `.mei-fluxo-tab-active` para foco `focus-visible` e anel no modo escuro.
- FR-UX-MEI-06: Hero com alerta quando `dasPendentesCount > 0`; subtítulo “Fluxo do MEI” e “Visão geral operacional” alinhados à spec §6.
- Pós-QA: `aria-controls` só quando o painel está montado (`activeWorkspace === tab.id`); subtítulo da visão geral sem “NFS-e” quando `!canViewNfse`.

### File List (implementação)

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/index.css`

### Debug Log References

- `npm run typecheck` (frontend) — OK.
- `npx vitest run --environment jsdom src/App.mei-gate.test.tsx` — 3 testes passaram (reexecutado após correções pós-QA).

### Change Log

- **2026-03-30** — Implementação P1 FR-UX-MEI-05/06.
- **2026-03-30** — Ajustes pós-QA: `aria-controls` condicional; *copy* visão geral condicional a `canViewNfse`.

---

## QA Results

**Revisor:** Quinn (QA / advisory)  
**Data:** 2026-03-30  
**Decisão de gate:** **PASS** (com observações menores)

### Rastreio critérios → evidência

| Critério | Veredicto | Evidência |
|----------|-----------|-----------|
| FR-UX-MEI-05 (modo escuro) | **OK** | `.mei-fluxo-tab-active` com `ring` e `dark:ring-blue-400` / `dark:ring-offset-slate-900` em `index.css`; combina com `planner-tab-active`. |
| FR-UX-MEI-05 (foco teclado) | **OK** | `.mei-fluxo-tab` com `focus-visible:ring-2` e *offset* explícito (claro e escuro). |
| FR-UX-MEI-05 (ARIA) | **OK** | `role="tablist"` + `aria-label`; cada botão `role="tab"`, `aria-selected`, `aria-controls`, `id` `mei-tab-*`; painéis `role="tabpanel"`, `id` `mei-panel-*`, `aria-labelledby`; sem `aria-pressed`. |
| FR-UX-MEI-06 (microcopy) | **OK** | Hero: bloco condicional `dasPendentesCount > 0` com CTA para `das`; subtítulo Fluxo do MEI e Visão geral operacional atualizados; variáveis existentes no componente. |

### Testes executados (gate)

- `npx vitest run --environment jsdom src/App.mei-gate.test.tsx` — **3/3 pass** (2026-03-30).

### Observações (não bloqueantes)

1. **`aria-controls` com painéis desmontados:** para tabs não selecionados, o `id` referido em `aria-controls` pode não existir no DOM (painéis por *conditional render*). Comportamento varia entre leitores; padrão comum em SPAs. **Dívida leve:** manter, ou painéis montados com `hidden` / `inert` se no futuro for exigência estrita de validadores.  
2. **Subtítulo “Visão geral operacional”:** menciona “NFS-e” mesmo quando `canViewNfse` é falso — texto genérico aceitável, mas pode confundir utilizadores sem área NFS-e; opcional ajustar *copy* condicional na story de *polish*.  
3. **Teclado setas (←/→) entre tabs:** não exigido pela story; melhoria opcional (APG *tabs* com *roving tabindex*).

### Riscos

- **Baixo:** alterações de marcação e CSS; sem novas APIs.

### Segue para merge

- **Sim**, com *smoke* manual recomendado: Tab/Shift+Tab nos separadores, modo escuro, e leitor de ecrã a confirmar “selecionado” nos tabs (em vez de “pressionado”).
