# Especificação de front-end e UX — Revisão visual (temas claro e escuro)

**Versão:** 1.0  
**Data:** 2026-04-17  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** `docs/prd/PRD-revisao-visual-temas-claro-escuro-2026-04-17.md` (FR-VIS-THEME-*, NFR-VIS-THEME-*)  
**Brief:** `docs/brief/brief-revisao-visual-temas-claro-escuro-2026-04-17.md`

**Relação com outros artefatos**

- **Alinha-se** ao design system leve já documentado implicitamente em `frontend/src/index.css` (classes `planner-*`, `admin-*`, tokens `:root` / `.dark`).  
- **Complementa** `docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md` apenas na dimensão **visual/contraste**; não redefine copy nem fluxos.  
- **Coordena-se** com `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`: alterações em `/guias-mei` são **puramente visuais** (bordas, ícones), salvo conflito explícito com spec Mei — prevalece a regra funcional Mei.

**Estado de implementação (Onda 0):** tokens e shell descritos em §4.1 estão **entregues**; §4.2–4.4 aplicam-se à **Onda 1**.

---

## 1. Objetivo deste documento

Contrato de **experiência e implementação** para:

1. **Consistência perceptiva** de bordas e ícones nos temas **claro** (`html` sem `dark`) e **escuro** (classe `.dark` no `documentElement`, conforme `useThemeStore`).  
2. **Extensão** dos padrões da Onda 0 a **modais**, **páginas longas** e **botões de ícone** fora do shell.  
3. **Checklist de QA** e **regras de contraste** utilizáveis em aceite de story e revisão de PR.

Não substitui user stories; alimenta *checklist* de aceite, *file list* e evidência de QA.

---

## 2. Princípios de design (normativos)

| ID | Princípio | Implicação para o código |
|----|-----------|---------------------------|
| **P1** | **Uma cor de ícone, um propósito** | Ícones Lucide herdam `currentColor`; o pai deve definir `text-*` explícito para default/hover/focus/disabled — não depender do cinza “genérico” da página. |
| **P2** | **Borda = limite, não decoração fantasma** | Evitar opacidades baixas (`/50`, `/60`) em bordas sobre fundos da **mesma família** cromática (ex.: `slate-900` sobre `slate-950`). Preferir **tom um degrau mais claro** (`slate-600`–`700`) a **mesmo tom com alpha baixo**. |
| **P3** | **Preferir tokens e classes globais** | Antes de `border-slate-200/80` inline, verificar equivalente em `index.css` (`planner-surface`, `admin-*`) ou alinhar ao par claro/escuro desta spec (§5). |
| **P4** | **Tema claro não fica “pesado”** | Se uma borda sólida parecer demasiada, reduzir **uma** escala (ex.: `slate-300` → `slate-200`) em vez de voltar a `/70` sem critério. |

---

## 3. Mapa de requisitos PRD → esta spec

| PRD | Secção desta spec |
|-----|-------------------|
| FR-VIS-THEME-01 | §5.2 (páginas longas), §6 (padrão opcional `ui-border-*`) |
| FR-VIS-THEME-02 | §5.3 (modais e fecho) |
| FR-VIS-THEME-03 | §8 (checklist de regressão) |
| FR-VIS-THEME-04 | §4 (paridade com classes base) |
| NFR-VIS-THEME-01 | §7 (contraste e verificação) |
| NFR-VIS-THEME-02 | §4.3 (tema claro) |
| NFR-VIS-THEME-03 | §9 (escopo de PR) |

---

## 4. Tokens semânticos e superfícies

### 4.1 Onda 0 — baseline canónico (referência)

| Token / superfície | Claro | Escuro | Notas |
|--------------------|-------|--------|--------|
| `--color-surface-border` (RGB em `:root` / `.dark`) | ~slate-300 | ~slate-600 | Uso em variáveis e componentes que leiam `rgb(var(--color-surface-border))`. |
| `.planner-surface` | `border-slate-200` | `border-slate-700` | Cartão com blur; contorno sempre visível. |
| `.planner-card-muted` | `border-slate-200/90` | `border-slate-700/90` | Superfície secundária. |
| `.planner-input` | `border-slate-200` | `border-slate-600` | Inputs distinguem-se do fundo escuro. |
| `.planner-button-secondary` | `border-slate-200` | `border-slate-600` | Idem. |
| `.admin-icon-button` | `text-slate-500` → hover `text-slate-700` | `text-slate-300` → hover `text-slate-50` | **Não** usar `text-slate-400` como único estado nesta classe. |
| **Shell — Header** | `border-slate-200`, fundo ~`white/90` | `border-slate-700`, fundo ~`slate-950/90` | Barra superior claramente separada do conteúdo. |
| **Shell — Sidebar** | `border-slate-200`, texto inativo `slate-700` | `border-slate-700`, texto inativo `slate-200` | Borda direita legível sem “corte” áspero no claro. |
| **Shell — Bottom nav** | Inativos `text-slate-600`, borda `slate-200` | Inativos `text-slate-200`, borda `slate-600` | Ícones nunca com `slate-400` só no escuro para estado inativo. |

### 4.2 Paridade (FR-VIS-THEME-04)

- Componentes que já usam **apenas** `.planner-card`, `.admin-section-card`, `.admin-table-shell`, etc., **não** devem ganhar bordas duplicadas via wrapper local, salvo bug de layout.  
- Edições locais numa página não devem **reverter** tons da classe base (ex.: `planner-card` + `border-none` ad hoc sem decisão documentada).

### 4.3 Tema claro — limite superior de “peso”

- Bordas exteriores de cartão: preferir **`slate-200`**; usar **`slate-300`** só se `slate-200` for invisível sobre fundo específico (ex.: faixa com `bg-slate-50` idêntica).  
- Evitar **dupla** borda (wrapper + filho com borda igual) sem espaçamento visual.

---

## 5. Padrões por tipo de UI

### 5.1 Divisórias internas (`border-t`, `hr`, secções)

| Contexto | Claro | Escuro |
|----------|-------|--------|
| Separador dentro de cartão branco | `border-slate-200` ou `border-slate-200/90` | `border-slate-700` (evitar `slate-800/80` isolado sobre `slate-900/40`) |
| Separador em faixa `bg-slate-50` | `border-slate-200` | `border-slate-700` |

**Anti-padrão:** `border-slate-200/80` + `dark:border-slate-700/80` repetido dezenas de vezes sem alinhar ao token — alvo da varredura FR-VIS-THEME-01.

### 5.2 Páginas longas (ex.: `GuidesMei.tsx`)

1. **Agrupar por padrão:** substituir blocos visualmente equivalentes pelo mesmo par claro/escuro da tabela §5.1.  
2. **Ordem de refactor sugerida:** secções com maior densidade de `border-*/*` → secções secundárias.  
3. **Entregável mínimo:** documento ou comentário no PR a listar **padrão escolhido** (ex.: “divisórias de secção = `border-slate-200` / `dark:border-slate-700`”) para futuras edições.

### 5.3 Modais — fecho e ícones de ação secundária (FR-VIS-THEME-02)

| Elemento | Claro | Escuro | A11y |
|----------|-------|--------|------|
| Botão fechar (só ícone) | `text-slate-500` hover `text-slate-800` | `text-slate-300` hover `text-slate-50` | `aria-label` explícito (ex.: “Fechar”); área tocável ≥ 44×44 px ou `p-2` equivalente. |
| **Evitar** | `text-slate-400` como único estado | `text-slate-400` como único estado sobre `slate-900` | Verificar contraste (§7). |

**Área de implementação típica:** canto superior direito, classes estilo `absolute right-3 top-3 ...` em modais de catálogo e formulários.

### 5.4 Ícones inline (não botão)

- Texto secundário + ícone: o ícone deve usar **a mesma** classe de cor que o texto **ou** um degrau mais forte (ex.: texto `text-slate-600`, ícone `text-slate-600` — não `text-slate-400` se o texto for `600`).

---

## 6. Classes utilitárias opcionais (Onda 1)

Se a equipa quiser **reduzir duplicação** sem alterar o resto do design system de imediato, pode introduzir-se em `index.css` **uma** das seguintes (não ambas sem revisão):

| Nome candidato | `@apply` sugerido (exemplo) | Uso |
|----------------|-----------------------------|-----|
| `.ui-border-section` | `border-slate-200 dark:border-slate-700` | Divisórias horizontais entre secções em páginas densas. |
| `.ui-modal-icon-dismiss` | alinhar a §5.3 | Botão fechar modal padronizado. |

**Implementação (STORY-VIS-THEME-01):** em `frontend/src/index.css`, `.ui-modal-icon-dismiss` usa `@apply` com `min-h-11 min-w-11`, `text-slate-500` / `hover:text-slate-800`, `dark:text-slate-300` / `dark:hover:text-slate-50`, `text-xl leading-none` para o glifo «×», e `transition-colors`. Usada nos modais `MeiCatalogoProdutoModal` e `MeiCatalogoClienteModal` (posicionamento `absolute right-3 top-3` mantido no TSX).

**Implementação (STORY-VIS-THEME-02):** em `frontend/src/index.css`, `.ui-border-section` usa `@apply border-slate-200 dark:border-slate-700` (par §5.1). Em `GuidesMei.tsx`, combina com `border` ou `border-t` conforme o controlo; callouts semânticos (amber, emerald, sky, violet) **não** foram alterados.

**Regra:** novas classes devem ser **documentadas** nesta spec no momento do merge (tabela ou §4).

---

## 7. Acessibilidade e contraste (NFR-VIS-THEME-01)

1. **Quando verificar:** qualquer alteração a `text-*` ou `border-*` em **controlos interativos** (links de nav, ícones clicáveis, fechos de modal).  
2. **Ferramenta:** contrast checker (ex.: WebAIM) com **cor de fundo real** do componente (incl. semi-transparência — amostrar pixel ou usar cor sólida equivalente).  
3. **Alvo:** WCAG **2.2 nível AA** para **texto normal** nos tamanhos usados (tipicamente ≥ 4.5:1 para texto/ícone sobre fundo).  
4. **Registo:** na evidência de QA ou na descrição do PR, indicar **par** (fundo, primeiro plano) e **ratio** ou “pass AA / fail — corrigido em commit X”.

---

## 8. Checklist de regressão visual (FR-VIS-THEME-03)

Executar em **tema claro** e **tema escuro** (alternar em Definições ou mecanismo existente).

| # | Área | O que verificar | Passa? |
|---|------|-----------------|--------|
| 1 | Header | Borda inferior visível; botão sidebar legível | ☐ |
| 2 | Sidebar | Borda direita; ícones inativos legíveis; ativo continua azul legível | ☐ |
| 3 | Bottom nav (viewport mobile) | Ícones inativos no escuro; item ativo distinguível | ☐ |
| 4 | Dashboard | Cartões principais com contorno perceptível | ☐ |
| 5 | Transações | Tabelas/listas: linhas ou cartões não “somem” no fundo | ☐ |
| 6 | Definições | Toggle/área de tema; textos secundários legíveis | ☐ |
| 7 | `/guias-mei` | Scroll: secções representativas com divisórias perceptíveis | ☐ |
| 8 | Modal de catálogo (produto ou cliente) | Fechar visível e tocável nos dois temas | ☐ |

**Critério de conclusão da Onda 1:** todos os itens marcados **Passa** ou **N/A** documentado (ex.: utilizador sem acesso MEI → item 7/8 N/A).

---

## 9. Disciplina de PR (NFR-VIS-THEME-03)

- Preferir **um ficheiro por tema** de mudança (ex.: só modais) ou **secções nomeadas** em PRs grandes.  
- Evitar misturar **refactor funcional** com mass update de classes no mesmo commit.  
- Screenshots opcionais: **antes/depois** apenas para primeira ocorrência de um padrão novo.

---

## 10. Fora de âmbito (relembrar)

- Nova paleta primária ou tipografia.  
- Animações ou ilustrações.  
- Testes E2E de screenshot automatizado (futuro).

---

## 11. Referências rápidas de ficheiros

| Área | Ficheiros típicos |
|------|-------------------|
| Tokens e classes globais | `frontend/src/index.css` |
| Shell | `frontend/src/Layout/Header.tsx`, `Sidebar.tsx`, `frontend/src/components/BottomNavigation.tsx` |
| Modais MEI | `frontend/src/components/MeiCatalogoProdutoModal.tsx`, `MeiCatalogoClienteModal.tsx`, outros em `components/mei/` |
| Página densa | `frontend/src/pages/GuidesMei.tsx` |

---

## 12. Histórico

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-04-17 | Versão inicial derivada do PRD |
