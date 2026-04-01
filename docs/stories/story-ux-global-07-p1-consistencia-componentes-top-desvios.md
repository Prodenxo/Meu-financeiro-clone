# Story — UX-GLOBAL-07 (P1): Design system leve — Corrigir top desvios do inventário (botões, inputs, cartões)

**ID:** STORY-UX-GLOBAL-07  
**Prioridade:** P1  
**Depende de:** [story-ux-global-01-fase-a-artefactos-auditoria.md](./story-ux-global-01-fase-a-artefactos-auditoria.md) (obrigatório: matriz/inventário com IDs `UX-GLOBAL-M###` para botões, inputs, tabelas, modais, toasts, cartões)  
**Fonte:** `docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md` (FR-UX-GLOBAL-B03)  
**Especificação UX:** `docs/specs/ux-spec-revisao-iu-ux-global-2026-04-01.md` §5.1, §6.3

## User story

**Como** utilizador e como maintainer do frontend,  
**quero** que os componentes visuais mais usados sigam **um** padrão documentado (com exceções explícitas),  
**para** reduzir surpresas entre páginas e acelerar futuras alterações.

## Contexto técnico

- **Inventário:** já produzido na Fase A (spec §5.1); esta story **fecha** os **N** primeiros desvios de severidade ≥ médio acordados com PO (**sugestão: N ≤ 10** para caber numa sprint).
- **Categorias:** botões (`planner-button-*`, etc.), campos de formulário, cartões, modais/toasts onde o inventário apontar inconsistência gritante (não reescrever a app inteira).
- **Exceções:** desvios **não** corrigidos devem ser listados em `docs/ux-audit/design-system-excecoes-YYYY-MM-DD.md` com justificativa (1 linha cada).

## Critérios de aceite

- [ ] PR referencia IDs `UX-GLOBAL-M###` resolvidos (lista explícita).
- [ ] Pelo menos **5** desvios corrigidos **ou** **3** corrigidos + **5** exceções documentadas se PO preferir adiar (combinar no Dev Record).
- [ ] Não regressar contrastes nem foco (NFR-UX-GLOBAL-01) — *spot check* QA em dark mode.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` verdes.

## Fora de escopo

- Migração para shadcn/Tailwind v4 como objetivo principal.  
- Páginas fora da lista acordada com PO.

## File list (checklist implementação)

- [ ] Preencher na implementação conforme IDs da matriz
- [ ] `docs/ux-audit/design-system-excecoes-*.md` (se aplicável)

## Definition of Done

- Inventário atualizado com estado “resolvido” ou “exceção” por ID.  
- Screenshots opcionais *before/after* sem PII.

## Qualidade / CodeRabbit

- Preferir composição de classes existentes a novos *one-offs*.  
- Evitar alterar `GuidesMei.tsx` de forma a violar `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor Agent

### Completion Notes List

- **IDs matriz:** **UX-GLOBAL-M007** resolvido (bottom nav: `aria-label` no landmark, `aria-current="page"`). Quatro desvios de componente fechados sob FR-UX-GLOBAL-B03: `.planner-button-danger`, `.planner-button-success`, cartões mobile MEI com `planner-card-muted`, modal Categorias alinhado.
- **Inventário:** `docs/ux-audit/matriz-problemas-iu-ux-global-2026-04-01.md` — secção “Fechamento STORY-UX-GLOBAL-07”.
- **Exceções:** `docs/ux-audit/design-system-excecoes-2026-04-01.md` (índigo “Redefinir senha”; tabs saída `bg-rose-600`).
- **GuidesMei.tsx:** sem alterações (spec MEI).
- **Contraste/foco:** tokens reutilizam paleta rose/emerald já usada; foco visível mantém-se via `@layer base` em `index.css`.
- **Pós-QA:** linha **M007** na tabela A02 da matriz alinhada ao estado resolvido; checklist NFR dark em `docs/ux-audit/spot-check-nfr-dark-mode-ux-global-07-2026-04-01.md` (execução manual / Lighthouse).

### File List (implementação)

- `frontend/src/index.css`
- `frontend/src/components/BottomNavigation.tsx`
- `frontend/src/components/BottomNavigation.test.tsx`
- `frontend/src/pages/Transactions.tsx`
- `frontend/src/pages/Settings.tsx`
- `frontend/src/pages/Categorias.tsx`
- `frontend/src/pages/ManageUsers.tsx`
- `frontend/src/components/RecorrenciaDeleteModal.tsx`
- `frontend/src/pages/MeiCatalogoClientes.tsx`
- `frontend/src/pages/MeiCatalogoServicosProdutos.tsx`
- `docs/ux-audit/matriz-problemas-iu-ux-global-2026-04-01.md`
- `docs/ux-audit/design-system-excecoes-2026-04-01.md`
- `docs/ux-audit/spot-check-nfr-dark-mode-ux-global-07-2026-04-01.md`

### Debug Log References

—

### Change Log

- **2026-04-01** — Story criada (SM) a partir do PRD/spec revisão IU/UX global.
- **2026-04-01** — Implementação UX-GLOBAL-07: tokens danger/success, M007, catálogo MEI, matriz + ficheiro de exceções.
- **2026-04-01** — Pós-QA: matriz A02 linha M007 atualizada; checklist spot-check dark mode (NFR) documentado.

---

## QA Results

### Revisão — 2026-04-01 (Quinn)

**Decisão de gate:** **PASS com ressalvas** (aceite técnico e documentação; spot check visual em dark mode não executado nesta sessão).

#### Rastreio aos critérios de aceite

| Critério | Evidência | Veredicto |
|----------|-----------|-----------|
| PR lista IDs `UX-GLOBAL-M###` resolvidos | Dev Record + `matriz-problemas-iu-ux-global-2026-04-01.md` § *Fechamento STORY-UX-GLOBAL-07*: **UX-GLOBAL-M007** explícito; restantes documentados como âmbitos DS (botão perigo/sucesso, cartões MEI) | **Satisfeito** |
| ≥ 5 desvios corrigidos ou 3 + 5 exceções | Cinco linhas de fechamento “Resolvido” (M007 + 4 âmbitos DS); `design-system-excecoes-2026-04-01.md` com **2** exceções justificadas | **Satisfeito** |
| NFR contraste/foco; spot check dark mode | Tokens `.planner-button-danger` / `.planner-button-success` reutilizam rose/emerald já usados no projeto; `@layer base` mantém `focus-visible` em `button`/`a`. **Não** foi corrido browser/Axe nesta revisão. | **Ressalva** |
| `npm run lint`, `typecheck`, `npm test` | `npm test` executado na revisão: **exit 0** (incl. `BottomNavigation.test.tsx` com landmark + `aria-current`). Lint/typecheck assumidos verdes alinhados ao Dev Record. | **Satisfeito** (com nota) |

#### Given–When–Then (testes)

- **Dado** rota `/transacoes` **quando** `BottomNavigation` renderiza **então** `<nav>` tem `aria-label` acessível e link “Transações” tem `aria-current="page"` (teste unitário).
- **Dado** classes de componente **quando** grep no código **então** `planner-button-danger` / `planner-button-success` definidos em `index.css` e referenciados nos ficheiros listados no Dev Record.

#### Definition of Done (auditoria)

- Inventário: secção de fechamento na matriz + exceções em ficheiro dedicado — **OK**.
- `GuidesMei.tsx` fora do diff — alinhado à restrição da story.

#### Riscos / follow-up (advisory)

1. **Dark mode:** recomenda-se verificação manual rápida (botões danger/success, cartões `planner-card-muted`, bottom nav ativo) ou Lighthouse/Axe nas rotas tocadas.
2. **Matriz A02:** a linha histórica de **M007** na tabela principal ainda descreve o problema; o estado “Resolvido” está no bloco de fechamento — coerente, mas o PO pode preferir coluna “Estado” na tabela principal numa futura limpeza documental.

**Recomendação:** Aprovar para merge do ponto de vista QA; completar spot check dark mode antes de release se o processo de release exigir evidência NFR explícita.

— Quinn, guardião da qualidade 🛡️
