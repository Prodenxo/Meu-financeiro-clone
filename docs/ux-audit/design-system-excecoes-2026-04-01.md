# Exceções do design system leve (UX-GLOBAL-07)

**Data:** 2026-04-01  
**Story:** [story-ux-global-07-p1-consistencia-componentes-top-desvios.md](../stories/story-ux-global-07-p1-consistencia-componentes-top-desvios.md)

Desvios **não** unificados nesta entrega; uma linha de justificativa cada.

| Local | Justificativa |
|-------|----------------|
| `ManageUsers.tsx` — “Redefinir senha” (`planner-button` + `bg-indigo-600`) | Ação administrativa rara; cor índigo distingue de primário azul e de perigo; token `planner-button-accent` pode ser adicionado numa story P2. |
| `Transactions.tsx` / `RecorrenciaModal.tsx` — separador entrada/saída com `planner-tab-active bg-rose-600` | Semântica de “saída” no domínio financeiro; alinhar a `planner-tab-danger` seria refactor transversal aos tabs. |
