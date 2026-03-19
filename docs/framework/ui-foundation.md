# UI Foundation (Fase 1 – Fundação)

Referência da base visual e de layout do Meu-financeiro, alinhada à story 2.1 (Fase 1 - Fundação UI/UX).

## Shell de layout autenticado

- **Componentes:** `Layout` (Header + Sidebar + main + Footer + BottomNavigation).
- **Arquivos:** `frontend/src/Layout/Layout.tsx`, `Header.tsx`, `Sidebar.tsx`, `Footer.tsx`, `frontend/src/components/BottomNavigation.tsx`.
- **Comportamento:** área útil (`main`) com padding responsivo; sidebar recolhível; atalhos rápidos (mobile); navegação inferior em mobile.

## Componentes base e classes

- **Superfícies/cards:** `planner-card`, `planner-card-muted`, `planner-surface`.
- **Inputs:** `planner-input`, `planner-input-compact`.
- **Botões:** `planner-button`, `planner-button-secondary`, `planner-button-compact`, `planner-button-secondary-compact`.
- **Seções admin:** `admin-section-card`, `admin-section-title`, `admin-section-subtitle`, `admin-empty-state`, `admin-split-grid`, `admin-toolbar`.
- **Design tokens:** definidos em `frontend/src/index.css` (`:root` e `.dark`).

## Estados de feedback

- **Loading de tela inteira:** `frontend/src/components/LoadingOverlay.tsx` — uso em listagens (ex.: ManageUsers) enquanto `loading === true`.
- **Estado vazio:** `frontend/src/components/EmptyState.tsx` — ícone, título, descrição e CTA opcional; classe `admin-empty-state` para mensagens curtas.
- **Erro/sucesso em página:** blocos com borda e fundo (rose/emerald); reutilizar as mesmas classes em novas telas para consistência.

## Regras

- Evitar estilos inline e overrides ad hoc; preferir classes em `index.css` e componentes compartilhados.
- Novas telas autenticadas devem usar o mesmo Layout (rotas protegidas dentro de `<Layout>` no `App.tsx`).
