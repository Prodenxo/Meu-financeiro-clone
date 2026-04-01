# Spot check NFR — contraste e foco (dark mode) — UX-GLOBAL-07

**Objetivo:** Fechar a ressalva de QA (NFR-UX-GLOBAL-01) com verificação **reproduzível** após alterações a `planner-button-danger`, `planner-button-success`, `planner-card-muted` e `BottomNavigation`.

**Story:** [story-ux-global-07-p1-consistencia-componentes-top-desvios.md](../stories/story-ux-global-07-p1-consistencia-componentes-top-desvios.md)

## Pré-requisitos

- Tema escuro ativo (Definições → modo escuro ou preferência do sistema).
- Viewport estreito (`< md`) para validar a barra inferior.

## Checklist (sem PII)

Marque após inspeção visual ou ferramenta (Lighthouse Accessibility / Axe).

1. [ ] **Bottom navigation:** item da rota atual distinguível; foco por teclado (Tab) mostra anel visível nos cinco destinos.
2. [ ] **Transações:** modal de confirmar exclusão — botão destrutivo com texto claro sobre fundo rose; estado `disabled` durante envio ainda legível.
3. [ ] **Definições:** CTA WhatsApp (verde), «Desconectar» Google e «Sair da Conta» — contraste aceitável em hover/active.
4. [ ] **Catálogo MEI (mobile):** `/mei-catalogo/clientes` e `/mei-catalogo/servicos-produtos` — cartões da lista com fundo/borda distinguíveis do canvas.

## Registo (opcional)

| Data | Responsável | Resultado (P/F) | Notas |
|------|-------------|-----------------|-------|
| | | | |
