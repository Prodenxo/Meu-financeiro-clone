# Arquitetura técnica — revisão visual (temas claro e escuro)

**Versão:** 1.0  
**Data:** 2026-04-17  
**Autoria:** Aria (architect / AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-revisao-visual-temas-claro-escuro-2026-04-17.md`](../prd/PRD-revisao-visual-temas-claro-escuro-2026-04-17.md) (FR-VIS-THEME-*, NFR-VIS-THEME-*)  
**UX de origem:** [`docs/specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md`](../specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md)

Este documento fixa a **arquitetura de apresentação** (tokens CSS, cascata Tailwind, tema, fronteiras de componente) e o **plano de extensão** da Onda 1. **Não** há alteração de backend, contratos HTTP, base de dados ou autenticação.

---

## 1. Decisões de arquitetura (resumo)

| Decisão | Escolha | Racional |
|---------|---------|----------|
| **Âmbito de runtime** | **Apenas `frontend/`** | PRD e spec limitam-se a IU; zero impacto em `backend/`, Supabase ou pipelines de deploy por si só. |
| **Mecanismo de tema** | **Classe `dark` no `documentElement`** + Tailwind `darkMode: 'class'` | Já implementado (`frontend/tailwind.config.js`, `useThemeStore`); ícones Lucide seguem `currentColor` — sem biblioteca de ícones duplicada. |
| **Fonte de verdade visual** | **`frontend/src/index.css`** (`@layer` base/components) + classes utilitárias Tailwind nos TSX | Design system “leve” brownfield; evitar novo pacote de theming (styled-components, CSS-in-JS) — **NFR de simplicidade** e diff localizado (**NFR-VIS-THEME-03**). |
| **Extensão Onda 1** | **1º** tokens/classes globais opcionais (`ui-border-*` da UX spec); **2º** alinhamento local em modais e páginas densas | Reduz fragmentação sem obrigar refactor total de `GuidesMei.tsx` num único PR (**risco** no PRD §11). |
| **Observabilidade** | **N/A** para tema (sem métricas de produto novas) | Sucesso = checklist QA manual + revisão de PR; opcional futuro: testes visuais automatizados (fora de escopo PRD). |
| **Segurança** | **Inalterada** | Mudanças são puramente CSS/presentação; sem novos vetores XSS além do habitual React. |

---

## 2. Vista em camadas (frontend)

```text
┌─────────────────────────────────────────────────────────────┐
│  HTML root — classe `dark` (toggle via themeStore)           │
├─────────────────────────────────────────────────────────────┤
│  @tailwind base — html/body, focus-ring                       │
├─────────────────────────────────────────────────────────────┤
│  :root / .dark — CSS variables (--color-*, --dark-*)        │
├─────────────────────────────────────────────────────────────┤
│  @layer components — .planner-*, .admin-*, calendário .rbc-*  │
├─────────────────────────────────────────────────────────────┤
│  Layout shell — Header, Sidebar, BottomNavigation (Onda 0 ✓)  │
├─────────────────────────────────────────────────────────────┤
│  Páginas / features — TSX + utilitários Tailwind inline       │
│  (Onda 1: modais, GuidesMei, outros border-* ad hoc)          │
└─────────────────────────────────────────────────────────────┘
```

**Regra de dependência:** componentes de página **não** devem redefinir tokens `:root`; apenas consomem variáveis ou classes globais. Exceção documentada: override pontual para fundo específico (UX spec §4.3).

---

## 3. Tema: fluxo técnico

| Peça | Ficheiro / nota |
|------|------------------|
| Estado | `useThemeStore` (`frontend/src/store/themeStore.ts`) — `isDarkMode`, persistência esperada no store/localStorage conforme implementação actual. |
| Aplicação | Classe `dark` no elemento raiz (tipicamente `document.documentElement`). |
| Estilos condicionados | Prefixo Tailwind `dark:` em TSX; bloco `.dark { ... }` em `index.css` para variáveis e regras de terceiros (ex.: react-big-calendar). |
| Lucide | Ícones sem `stroke` explícito herdam cor do texto — **implicação:** o componente pai define `text-slate-*` (UX spec P1). |

**Anti-padrão arquitectónico:** introduzir segundo sistema de tema (ex.: contexto React duplicado + CSS variables duplicadas) sem ADR — **rejeitado** para esta iniciativa.

---

## 4. Onda 0 vs Onda 1 (estado e fronteiras)

| Onda | Entregue / planejado | Fronteira técnica |
|------|----------------------|-------------------|
| **0** | Tokens `--color-surface-border`; classes `.planner-*`, `.admin-*`; shell | Estável; alterações futuras só com critério de regressão (**FR-VIS-THEME-04**). |
| **1** | Modais (fecho), `GuidesMei.tsx` e outros TSX com `border-slate-*/*` legados | Toca apenas em **apresentação**; sem mudança de props de negócio, hooks de dados ou rotas. |

---

## 5. Estratégia de implementação (Onda 1)

### 5.1 Ordem recomendada

1. **Classes globais opcionais** em `index.css` (se adoptadas): `.ui-border-section`, `.ui-modal-icon-dismiss` — uma PR pequena, fácil de reverter.  
2. **Modais de catálogo MEI** (superfície fechada, poucos ficheiros): alinhar botão fechar à UX spec §5.3.  
3. **Páginas longas:** `GuidesMei.tsx` em **sub-PRs** por secção ou por padrão de classe (PRD §11), para reduzir conflitos de merge.

### 5.2 Descoberta mecânica (apoio ao dev)

- Pesquisa por padrões: `border-slate-200/`, `dark:border-slate-7`, `text-slate-400` em botões de ícone, `absolute right-3 top-3` (fechos de modal).  
- **Não** automatizar substituição cega: alguns `text-slate-400` podem ser copy secundário válido — validar com UX spec §5.4.

### 5.3 Paridade de classes base

Componentes que usam **só** `.planner-card` / `.admin-table-shell` não devem receber wrappers com segunda borda sem espaçamento (UX spec §4.2). Implementação: **code review** + checklist visual.

---

## 6. Dependências e toolchain

| Item | Versão / nota |
|------|----------------|
| React + Vite | Existente no `frontend/package.json` — sem upgrade forçado por esta iniciativa. |
| Tailwind CSS | `darkMode: 'class'` — manter. |
| Lucide React | Ícones; sem alteração de pacote. |
| Novas dependências | **Nenhuma** obrigatória para cumprir PRD/spec. |

---

## 7. Testes e qualidade

| Tipo | Papel |
|------|--------|
| **Manual** | Checklist §8 da UX spec (tema claro/escuro) — evidência em QA ou notas de release (**FR-VIS-THEME-03**). |
| **Contraste** | Amostragem com ferramenta externa nos componentes alterados (**NFR-VIS-THEME-01**). |
| **Automatizado** | Não exigido pelo PRD; Playwright/Cypress screenshot opcional futuro. |
| **Lint** | `npm run lint` / `npm run typecheck` no `frontend` — gate existente (`AGENTS.md`). |

---

## 8. Riscos técnicos e mitigação

| Risco | Mitigação |
|-------|-----------|
| **Diff massivo** em `GuidesMei.tsx` | PRs incrementais; evitar misturar refactor funcional com troca de classes. |
| **Regressão visual** em tema claro (bordas “pesadas”) | UX spec §4.3; revisão por screenshot em 1–2 ecrãs representativos. |
| **Conflitos de merge** | Sincronizar com dono da área MEI; alterações visuais isoladas em commits claros. |
| **Duplicação** `.ui-*` vs inline | Preferir classe global só quando o mesmo par claro/escuro aparecer ≥ 3 vezes (critério de pragmatismo, não norma absoluta). |

---

## 9. Relação com outros artefatos

| Documento | Relação |
|-----------|---------|
| `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md` | Regras **funcionais** MEI prevalecem; esta iniciativa não as altera. |
| `docs/framework/tech-stack.md` | Stack geral do repo; sem mudança de stack por este doc. |
| `docs/brief/brief-revisao-visual-temas-claro-escuro-2026-04-17.md` | Diagnóstico e histórico da Onda 0. |

---

## 10. Histórico

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-04-17 | Versão inicial a partir do PRD e da UX spec |
