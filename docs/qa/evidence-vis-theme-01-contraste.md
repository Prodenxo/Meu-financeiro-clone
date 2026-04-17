# Evidência NFR-VIS-THEME-01 — contraste (STORY-VIS-THEME-01)

**Story:** [STORY-VIS-THEME-01](../stories/story-vis-theme-p1-modais-fecho-e-classes-ui.md)  
**QA consolidada (Onda 1):** [STORY-VIS-THEME-03](../stories/story-vis-theme-p0-qa-regressao-visual-e-contraste.md)

## Controlo interativo (fecho)

| Área | Fundo para verificação | Primeiro plano (ícone) | Notas |
|------|------------------------|-------------------------|--------|
| `MeiCatalogoProdutoModal` — botão fechar | **Claro:** `planner-card` é semitransparente; usa-se equivalente sólida **~#ffffff** / slate-50 na zona do cartão (UX spec §7). **Escuro:** equivalente **~#0f172a** (slate-900) / slate-950. | `text-slate-500` (#64748b) default; hover `text-slate-800`. **Escuro:** `text-slate-300` (#cbd5e1); hover `text-slate-50`. | Ícone «×» via `.ui-modal-icon-dismiss`. |
| `MeiCatalogoClienteModal` — botão fechar | Idem ao cartão do diálogo acima. | Idem. | Idem. |

**Resultado alvo:** WCAG 2.2 nível AA para texto/ícone em tamanho usado (≥ 4.5:1 texto normal). Com as equivalentes sólidas indicadas, slate-500 sobre branco e slate-300 sobre slate-900 ficam **acima do limiar** (pass AA). Hovers reforçam contraste.

## Só-ícone no header (além do fecho)

- **MeiCatalogoProdutoModal:** N/A — só o fecho «×» no cabeçalho do modal.
- **MeiCatalogoClienteModal:** N/A — só o fecho «×» no cabeçalho do modal.

## Verificação manual (tema claro e escuro)

Checklist visual no browser: alternar tema e confirmar legibilidade do fecho nos dois modais. Pode cruzar com a matriz da story [STORY-VIS-THEME-03](../stories/story-vis-theme-p0-qa-regressao-visual-e-contraste.md).

## Regressão automatizada

`MeiCatalogoProdutoModal.test.tsx` e `MeiCatalogoClienteModal.test.tsx`: teste que fixa `aria-label="Fechar"` e presença da classe `ui-modal-icon-dismiss` no botão de fecho.
