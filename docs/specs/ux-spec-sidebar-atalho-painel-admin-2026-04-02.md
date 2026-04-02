# Especificação de front-end e UX — Barra lateral: atalho **Painel Admin** (acima de Início)

**Versão:** 1.0  
**Data:** 2026-04-02  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** `docs/prd/PRD-sidebar-atalho-painel-admin-2026-04-02.md` (FR-SIDEBAR-ADMIN-\*, NFR-SA-\*, §6)  
**Brief de pesquisa:** `docs/brief/brief-sidebar-atalho-painel-admin-2026-04-02.md`

**Implementação de referência (pré-mudança):**

- `frontend/src/Layout/Sidebar.tsx` — lista `navItems`, `isActive`, `aria-label` / `title` por item.  
- `frontend/src/pages/Dashboard.tsx` — cartão “Administração” + CTA “Painel Admin” (`hasRole(role, ['admin'])`).  
- `frontend/src/lib/roles.ts` — `hasRole` (superadmin incluído).  
- `frontend/src/App.tsx` — rota `/settings/usuarios-dados` e guard (inalterados por este entregável).

---

## 1. Objetivo deste documento

Contrato de **experiência, copy, hierarquia visual e acessibilidade** para:

1. Novo item **Painel Admin** na sidebar **desktop (`md+`)**, **primeiro** na ordem de navegação.  
2. Comportamento do **cartão no Início** conforme decisão de produto **§6 do PRD**.

Não substitui a story em `docs/stories/`; alimenta critérios de aceite, revisão visual e *file list*.

---

## 2. Modelo mental e hierarquia

| Princípio | Especificação |
|-----------|----------------|
| **Prioridade operacional** | O primeiro item comunica “ferramentas de gestão” estáveis; **Início** permanece a âncora do resumo financeiro (logo **abaixo** do Painel Admin). |
| **Paridade de permissões** | Quem vê o item = quem já acede à rota via `hasRole(role, ['admin'])` (inclui **superadmin**). |
| **Descoberta** | Admin abre o painel a partir de **qualquer** ecrã com sidebar em **1 clique**, sem regressar ao Início. |

---

## 3. Âmbito na interface

| Conceito | Valor |
|----------|--------|
| **Superfície** | `Sidebar.tsx` — `<aside aria-label="Menu lateral">`, já `hidden md:flex`. |
| **Fora de âmbito imediato** | Redesenho global da sidebar, tema, `BottomNavigation` / mobile (story follow-up se PO remover cartão sem substituto). |
| **Brownfield** | Reutilizar **exatamente** o padrão de cada `Link`: `h-12`, `rounded-xl`, estados activo (`bg-blue-600 text-white shadow-soft ring-1 ring-blue-500/40`) e hover dos demais itens. |

---

## 4. Wireframe lógico — ordem da lista (`md+`)

**Estado:** utilizador **admin** ou **superadmin** (item condicional **presente**).

```text
┌─ Menu lateral (aside) ─────────────────────────┐
│  [ícone]  Painel Admin      ← NOVO (primeiro)   │
│  [ícone]  Início                                │
│  [ícone]  Transações                          │
│  ...                                            │
└────────────────────────────────────────────────┘
```

**Estado:** `usuario` / `outsider` — a linha “Painel Admin” **não existe** (sem espaço vazio reservado).

---

## 5. Molécula: item “Painel Admin”

### 5.1 Dados de navegação

| Campo | Valor |
|-------|--------|
| **`path`** | `/settings/usuarios-dados` (igual ao CTA actual do Dashboard). |
| **Posição** | Índice **0** do array efectivo de itens visíveis (inserir **antes** de Início). |

### 5.2 Ícone (Lucide)

| Recomendação UX | **`LayoutDashboard`** |
|-----------------|------------------------|
| **Racional** | Comunica “painel / visão de gestão” sem sugerir apenas “utilizadores” ou “segurança genérica”. |
| **Alternativas aceites** | `Shield` (ênfase em área protegida) ou `Users` (ênfase em dados de utilizadores) — **uma** escolha por release, documentada na story / PR. |
| **Restrição** | `lucide-react`, `size={20}` como os restantes itens. |

### 5.3 Copy (validação PO)

| Uso | Texto proposto | Notas |
|-----|----------------|--------|
| **Rótulo visível** (`expanded`) | **Painel Admin** | Alinhado ao botão actual do Dashboard; curto para sidebar colapsada/expandida. |
| **`aria-label` e `title`** | **Painel Admin** | Paridade com outros itens (hoje `aria-label={item.label}`). Se o PO preferir “Administração dos dados da empresa”, usar **esse** texto em `aria-label` / `title` e manter rótulo curto **ou** alinhar tudo à mesma string — **decisão única** registada na story. |

**FR coberto:** FR-SIDEBAR-ADMIN-05.

### 5.4 Estado activo (`isActive`)

| Regra | Especificação |
|-------|----------------|
| **Path base** | `location.pathname === '/settings/usuarios-dados'`. |
| **Subcaminhos** | Se no futuro existirem rotas sob `/settings/usuarios-dados/...`, tratar como activo com `startsWith('/settings/usuarios-dados/')` **ou** prefixo acordado com a árvore real de rotas — espelhar a regra já usada para outros paths não-raiz (ex.: `startsWith(\`${path}/\`)`). |

**FR coberto:** FR-SIDEBAR-ADMIN-04.

### 5.5 Implementação condicional

- Obter `role` de `useAuthStore()` (ou fonte já usada na sidebar).  
- Incluir o objeto do item na lista **somente** se `hasRole(role, ['admin'])` (preserva superadmin via `roles.ts`).  
- **Não** duplicar lógica de autorização da rota; apenas espelhar visibilidade para UX.

**FR cobertos:** FR-SIDEBAR-ADMIN-01, 02, 03.

---

## 6. Acessibilidade (NFR-SA-02)

| Verificação | Critério |
|-------------|----------|
| **Nome acessível** | `aria-label` e `title` iguais ao rótulo acordado (§5.3). |
| **Foco** | `Link` nativo; ordem de tabulação = ordem visual (primeiro item = primeiro focável da lista). |
| **Contraste** | Estados activo / hover / default **iguais** aos restantes itens da sidebar (sem novas cores). |
| **Sidebar** | Manter `aria-label="Menu lateral"` no `<aside>`. |

---

## 7. Decisão §6 — Cartão “Administração” no Dashboard

Mapeamento UX das opções do PRD:

| Opção | Comportamento UX | Impacto na experiência |
|-------|------------------|-------------------------|
| **A** | **Remover** o bloco completo (cartão + CTA) em **todos** os viewports quando existir apenas o atalho na sidebar desktop. | Menos competição visual no topo do Início; **risco mobile:** sem sidebar, admin pode ficar sem atalho → exige follow-up (PRD). |
| **B** | Manter cartão **apenas** onde não há sidebar: ex. `md:hidden` no contentor do cartão (sidebar `md+` cobre desktop). | Paridade mobile preservada; desktop sem duplicação. |
| **C** | Manter cartão sempre. | Redundância explícita; zero risco de perda de atalho em mobile. |

**Recomendação UX alinhada ao PRD (default):** preferir **A** com **follow-up** registado para mobile **ou** **B** se o PO quiser fechar o risco mobile no mesmo incremento **sem** story extra.

**Critério:** a opção escolhida aparece **explicitamente** na story e no código (comentário breve ou constante de feature flag só se já for padrão do repo — evitar over-engineering).

**FR coberto:** FR-SIDEBAR-ADMIN-06.

---

## 8. Estados e cenários de teste (UX / QA)

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 1 | Admin em `/transacoes`, viewport ≥ `md` | Vê “Painel Admin” no topo da sidebar; um clique → `/settings/usuarios-dados`. |
| 2 | Na rota do painel | Item com estilo **activo** como Início em `/`. |
| 3 | Superadmin | Igual ao admin (item visível e funcional). |
| 4 | Utilizador não admin | Item **ausente**; deep link continua bloqueado pelo guard. |
| 5 | Sidebar colapsada (`expanded === false`) | Ícone + `aria-label` / `title`; sem regressão de layout. |
| 6 | Teclado | Foco visível; Enter activa navegação. |

---

## 9. Mapeamento PRD → esta spec

| ID PRD | Secção desta spec |
|--------|-------------------|
| FR-SIDEBAR-ADMIN-01 | §4, §5.1, §5.5 |
| FR-SIDEBAR-ADMIN-02 | §5.5, `hasRole` |
| FR-SIDEBAR-ADMIN-03 | §4, §5.5 |
| FR-SIDEBAR-ADMIN-04 | §5.4 |
| FR-SIDEBAR-ADMIN-05 | §5.3, §6 a11y |
| FR-SIDEBAR-ADMIN-06 | §7 |
| NFR-SA-02 | §6 |
| NFR-SA-03 | §3, §5.2 |

---

## 10. Change log

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-04-02 | Versão inicial a partir do PRD `PRD-sidebar-atalho-painel-admin-2026-04-02.md`. |

---

*Próximo passo canónico AIOX: story em `docs/stories/` com opção §6 escolhida pelo PO, ícone final e copy final de `aria-label` / rótulo.*
