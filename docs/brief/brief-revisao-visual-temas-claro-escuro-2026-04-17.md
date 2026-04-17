# Brief: revisão visual — temas claro e escuro (ícones e divisórias)

**Data:** 2026-04-17  
**Origem:** pedido de produto (Atlas / analista + Orion / aiox-master)  
**Produto:** Meu Financeiro (`frontend/`, Tailwind + tokens em `src/index.css`)

---

## 1. Resumo executivo

Foi feita uma **revisão focada em legibilidade** nos modos **claro** e **escuro**, com ênfase em:

- **Ícones** que pareciam “sumir” (baixo contraste com o fundo ou cor `text-slate-400` demasiado fraca).
- **Divisórias** pouco visíveis (bordas com opacidade `/70` sobre superfícies semelhantes, especialmente no escuro).

Este documento regista o **diagnóstico**, as **alterações já aplicadas no código** e um **backlog** para continuidade (páginas com classes ad hoc).

---

## 2. Diagnóstico

| Área | Problema observado | Causa provável |
|------|-------------------|----------------|
| **Shell (Header, Sidebar, Bottom nav)** | Barra inferior no escuro com ícones inativos pouco visíveis | `text-slate-400` sobre `bg-slate-950/80` + borda `border-slate-800/70` com baixo contraste |
| **Superfícies `.planner-*` e admin** | Cartões e tabelas “derretem” no fundo | Bordas `border-slate-200/70` e `dark:border-slate-800/70` com transparência sobre gradientes semelhantes |
| **Botões de ícone (`.admin-icon-button`)** | Ícones acinzentados demais | `text-slate-400` em claro e escuro |
| **Tokens CSS (`--color-surface-border`)** | Divisórias genéricas fracas | Valores herdados demasiado próximos da cor de fundo no escuro |

**Nota:** ícones Lucide usam `currentColor`; a cor do texto do pai é determinante. Corrigir **tokens e componentes shell** cobre a maior parte da app que reutiliza essas classes.

---

## 3. Objetivos de design (aceites nesta iteração)

1. **Contraste mínimo perceptível** para bordas de cartão, toolbars e tabelas em ambos os temas, sem “pesar” visualmente.
2. **Estados inativos** da navegação móvel legíveis em fundo escuro (WCAG: preferir verificação pontual com ferramenta de contraste nos hex finais).
3. **Consistência:** alterações concentradas em `index.css` (design system leve) + shell (`Header`, `Sidebar`, `BottomNavigation`).

---

## 4. Alterações implementadas (código)

| Ficheiro | Mudança |
|----------|---------|
| `frontend/src/index.css` | Tokens `--color-surface-border`: claro ~`slate-300`, escuro ~`slate-600`. Reforço de bordas em `.planner-surface`, `.planner-card-muted`, `.planner-input`, `.planner-button-secondary`, blocos admin (stat, toolbar, tabela, dropdown, user card). `.admin-icon-button`: `text-slate-500` / `dark:text-slate-300` e hovers mais legíveis. |
| `frontend/src/components/BottomNavigation.tsx` | Barra: borda `slate-600` (escuro) / `slate-200` (claro); fundo ligeiramente mais opaco. Itens inativos: `text-slate-200` (escuro), `text-slate-600` (claro); estado ativo escuro com mais presença (`dark:text-blue-100`, `dark:bg-blue-500/20`). |
| `frontend/src/Layout/Sidebar.tsx` | Borda direita sólida `slate-200` / `dark:border-slate-700`; texto inativo `slate-700` / `dark:text-slate-200`. |
| `frontend/src/Layout/Header.tsx` | Borda inferior e botão do menu lateral com contornos mais visíveis (`slate-700` / `slate-200`, botão `slate-600` no escuro). |

---

## 5. Backlog sugerido (próximas iterações)

1. **Varredura em TSX:** substituir gradualmente `border-slate-200/80` + `dark:border-slate-700/80` em páginas longas (ex.: `GuidesMei.tsx`) por padrões alinhados aos tokens ou classes utilitárias reutilizáveis.
2. **Modais:** fechos com `text-slate-400 dark:text-slate-300` — avaliar subir para `slate-500` / `slate-200` nos modais sobre fundo escuro.
3. **Teste de regressão visual:** checklist manual (tema claro/escuro) em Dashboard, Transações, Guias MEI, Settings.
4. **Documentação:** referenciar este brief no `docs/brief/brief-revisao-iu-ux-intuitividade-site.md` como frente “visual/tema” complementar à revisão de intuitividade (2026-04-01).

---

## 6. Critérios de aceitação (QA)

- [ ] Navegação inferior: todos os ícones inativos distinguem-se claramente do fundo no tema escuro.
- [ ] Sidebar: borda direita visível sem parecer “corte” brusco no claro.
- [ ] Cartões `.planner-card` e tabelas admin: linhas e contornos perceptíveis nos dois temas.
- [ ] Nenhuma regressão óbvia de contraste no tema claro (bordas não “pesadas” demais).

---

## 7. Referências

- Brief relacionado: `docs/brief/brief-revisao-iu-ux-intuitividade-site.md`
- Matriz de problemas IU/UX: `docs/ux-audit/matriz-problemas-iu-ux-global-2026-04-01.md`
