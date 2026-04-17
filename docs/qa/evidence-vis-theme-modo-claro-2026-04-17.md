# Evidência QA — E-VIS-THEME-4 (Onda claro)

**Data do documento:** 2026-04-17  
**Ambiente:** `http://localhost:3000` (porta em `frontend/vite.config.ts`; staging a documentar no release)  
**Build / commit:** `21c5f2ec`  
**Branch:** `Leozinho`

---

## 1. Cabeçalho (resumo)

| Campo | Valor |
|--------|--------|
| Execução de teste | Mesma sessão / mesmo build recomendado para (B)+(C) e regressão escuro |
| Zoom | 100% (UX spec modo claro §11) |

### Metodologia — ratios (secção 2)

Rácios **WCAG 2.x** entre cores **hex** derivadas de `index.css` / Tailwind: luminância relativa e fórmula `(L1+0.05)/(L2+0.05)` com `L1 > L2`.  
**Texto** (itens B, C): comparar `text-slate-700` (**#334155**) com fundos representativos — meta **AA** ≥ **4,5:1** (corpo).  
**Não-texto** (A, D, E): valores informam separação lumínica entre amostras; o aceite de produto para bordas e trilhos permanece alinhado a **NFR-VIS-THEME-02**, **LC1** (UX) e verificação visual — não substituem sozinhos critérios de componente gráfico 3:1 se a equipa os exigir legalmente.

| Cor | Hex (referência) |
|-----|------------------|
| `--color-surface-border` (claro) | `#CBD5E1` (rgb 203, 213, 225) |
| Fundo página `body` / slate-100 | `#F1F5F9` |
| Interior típico cartão / botão sec. | `#FFFFFF` (aprox.; gradientes com opacidade podem diferir ligeiramente) |
| Trilho off `bg-slate-300` | `#CBD5E1` |
| Trilho on `bg-blue-600` | `#2563EB` |
| Thumb | `#FFFFFF` |

---

## 2. Amostragem contraste (NFR-VIS-THEME-01) — mínimo obrigatório

| # | Par (descrição) | Fundo | Primeiro plano | Ratio ou «pass AA» | Componente / ecrã |
|---|-----------------|-------|----------------|---------------------|-------------------|
| (A) | Limite do cartão (borda token) vs interior claro | `#FFFFFF` | `#CBD5E1` (borda 1px) | **1,48:1** (adjacente não-texto); separação em **§4** / NFR-02 | `/settings` — cartões com `.planner-card` (ex.: Aparência; Administração se perfil admin) |
| (B) | `.planner-button-secondary` — **texto** vs **página** | `#F1F5F9` (`bg-slate-100`) | `#334155` (`text-slate-700`) | **9,45:1** — **pass AA** texto | `/orcamentos` — separador **Mês**; botões «Adicionar Categoria», «Novo Orçamento», «Duplicar Mês Anterior» sobre fundo de página (fora da grelha de cartões métricos) |
| (C) | `.planner-button-secondary-compact` — **texto** vs **cartão** | `#FFFFFF` (interior `.planner-card`) | `#334155` + borda token no botão | **10,35:1** — **pass AA** texto | `/guias-mei` — abrir modal de cliente (`MeiCatalogoClienteModal`); botão **Cancelar** sobre painel `.planner-card` |
| (D) | Toggle Aparência — trilho **off** (claro); thumb vs trilho | `#CBD5E1` (trilho) + borda token | `#FFFFFF` (thumb) | **1,48:1** (thumb vs trilho); contorno reforçado em STORY-05 | `/settings` — secção Aparência |
| (E) | Toggle — tema **escuro** activo (on) | `#2563EB` (trilho) | `#FFFFFF` (thumb) | **5,17:1** — **pass AA** como par texto-like | `/settings` — secção Aparência |

*(B) e (C) em rotas distintas na mesma execução, conforme story.*

---

## 3. Regressão escuro (NFR-VIS-THEME-04) — R1 a R3

Verificação em **tema escuro** nas mesmas rotas que em claro, salvo N/A documentado.

| # | Área | Passa / N/A | Nota |
|---|------|-------------|------|
| R1 | Cartão + toolbar + tabela | **Passa** (baseline código) | Com **admin**: `/settings` — bloco Administração (`.planner-card`, `.admin-toolbar`, `.admin-table-shell`). **Sem admin:** combinação aceite **`/orcamentos`** (cartões + barra de acções) + **`/guias-mei`** (secção com `admin-table-shell` quando o fluxo MEI a mostrar), na mesma sessão — alinhado a STORY-04/06. |
| R2 | Botão secundário | **Passa** (baseline código) | Classes `dark:border-slate-600` / fundos escuros em `.planner-button-secondary` mantidos; amostrar em `/orcamentos` e modal em `/guias-mei`. |
| R3 | Toggle em Definições | **Passa** (baseline código) | `role="switch"`, `aria-checked`, `aria-label`; estados on/off com `dark:` no trilho; foco via regra global `button:focus-visible` em `index.css`. |

**Critério:** nenhuma regressão grave; validação visual final recomendada em ambiente de release.

---

## 4. NFR-VIS-THEME-02 (peso de borda no claro)

Bordas exteriores no claro usam **1px** e o token `--color-surface-border` (slate-300), sem sombra forte cumulativa na mesma peça — alinhado a **LC1** e a NFR-02. **Screenshot** apenas se houver disputa.

---

## 5. Extensão opcional (UX spec modo claro §11)

| Área | Passa / N/A | Nota |
|------|-------------|------|
| Dashboard (claro) | **N/A** | Fora do mínimo STORY-06; seguir STORY-VIS-THEME-03 / backlog se PO priorizar. |
| Transações (claro) | **N/A** | Idem. |
| Definições (claro) | **Passa** (amostragem) | Coberto por `/settings` nas secções Aparência e (se aplicável) Administração. |

---

## 6. Artefactos

| Artefacto | Caminho |
|-----------|---------|
| PRD modo claro | `docs/prd/PRD-modo-claro-contraste-separadores-controlos-2026-04-17.md` |
| UX spec modo claro | `docs/specs/ux-spec-modo-claro-contraste-separadores-controlos-2026-04-17.md` |
| Arquitectura modo claro | `docs/technical/architecture-modo-claro-contraste-separadores-controlos-2026-04-17.md` |
| STORY-04 | `docs/stories/story-vis-theme-p0-modo-claro-index-css-bordas-botao-secondary.md` |
| STORY-05 | `docs/stories/story-vis-theme-p0-modo-claro-settings-toggle-aparencia.md` |

---

## 7. Rastreio PRD modo claro §10 (critérios globais de release)

Referência: `docs/prd/PRD-modo-claro-contraste-separadores-controlos-2026-04-17.md` — **§10. Critérios de aceite globais (release)**.

| # | Critério §10 | Como esta evidência / entregas Onda claro cobrem |
|---|----------------|-----------------------------------------------------|
| 1 | Tema claro: cartão, toolbar, tabela — separação visual | STORY-04 (`index.css`) + amostragem **(A)**; R1 **§3** |
| 2 | Tema claro: botões secundários perceptíveis | **(B)**, **(C)**; R2 **§3** |
| 3 | Tema claro: interruptores off/on | STORY-05 + **(D)** |
| 4 | Tema escuro: checklist curto sem regressão grave | R1–R3 **§3** |
| 5 | Evidência NFR-01 nos elementos alterados | **§2** |
| 6 | Rastreio PRs / stories | Ligações **§6**; stories 04/05 referenciadas |

**Excepções:** nenhuma declarada; PO pode aprovar extensões §11 via outras stories.

---

## 8. Assinaturas

| Papel | Nome | Data |
|-------|------|------|
| Revisão técnica (dev) — baseline de ratios e rotas | _equipa dev_ | 2026-04-17 |
| QA — confirmação visual / release | _pendente_ | _ |

---

## Notas de implementação (dev)

- **Rastreio FR-VIS-THEME-05 (Opção B):** classes **editadas** em `index.css` — `.planner-surface`, `.planner-card-muted`, `.planner-button-secondary`, `.admin-stat-card`, `.admin-toolbar`, `.admin-table-shell`, `.admin-table-row`, `.admin-empty-state` (borda claro → `rgb(var(--color-surface-border))`). **As restantes classes da lista mínima** foram auditadas: `.planner-card` e `.planner-button-secondary-compact` herdam o token via `.planner-surface` / `.planner-button-secondary` sem alteração adicional.
- **STORY-05:** toggle em `frontend/src/pages/Settings.tsx` — `role="switch"`, `aria-checked`, `aria-label`, trilho off com borda 1px, área tocável mínima 44×44 px.
