# Evidência — Guias MEI divisórias (STORY-VIS-THEME-02)

**Story:** [STORY-VIS-THEME-02](../stories/story-vis-theme-p1-guidesmei-divisorias-bordas.md)  
**QA Onda 1:** [STORY-VIS-THEME-03](../stories/story-vis-theme-p0-qa-regressao-visual-e-contraste.md) — checklist UX §8 item 7 (`/guias-mei`).

## Cobertura

**Opção A — Varredura por padrão** em `frontend/src/pages/GuidesMei.tsx`: todas as bordas **slate neutras** que usavam opacidades (`border-slate-200/80`, `300/80`, `dark:border-slate-700/80`, etc.) foram alinhadas ao par canónico via classe `.ui-border-section` (`border-slate-200` / `dark:border-slate-700`). **Fora do âmbito desta passagem:** bordas de callouts coloridos (amber, emerald, sky, violet) e anéis de spinners de carregamento.

## Padrão divisórias Guias MEI (para PR)

- **Par canónico:** `border-slate-200` / `dark:border-slate-700` (UX spec §5.1).
- **Classe:** `.ui-border-section` em `frontend/src/index.css` — usar com `border` ou `border-t` no TSX.

## Verificação manual

Confirmar em **tema claro e escuro** que divisórias e contornos das zonas alteradas são perceptíveis (sem regressão de layout).

---

## Texto para descrição do PR (copiar)

**Story:** STORY-VIS-THEME-02 · **Cobertura:** Opção A (varredura `GuidesMei.tsx`).

### Padrão divisórias Guias MEI

- **Par canónico (UX spec §5.1):** `border-slate-200` / `dark:border-slate-700`.
- **Classe:** `.ui-border-section` em `frontend/src/index.css` — combinar com `border` ou `border-t` no TSX.

### Padrões substituídos (legado → canónico)

- `border-slate-200/80`, `/70`, `/90` e variantes `dark:border-slate-700/80`, `/70`
- `border-slate-300/80`, `/85` e variantes `dark:border-slate-700/80`, `dark:border-slate-600/80`, `/70`

**Mantidos de propósito:** callouts coloridos (amber, emerald, sky, violet); anéis de spinners (`border-2 border-slate-400`…).

### Regressão automatizada

`frontend/src/pages/GuidesMei.visThemeBorders.test.ts` — contrato de fonte + presença da classe em `index.css`.
