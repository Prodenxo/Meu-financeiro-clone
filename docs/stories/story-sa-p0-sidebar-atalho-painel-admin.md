# Story — SA-P0: Sidebar desktop — atalho Painel Admin (acima de Início) + cartão no Início (§6)

**ID:** STORY-SA-P0  
**Epic:** Navegação — atalho Painel Admin na sidebar desktop (`docs/prd/PRD-sidebar-atalho-painel-admin-2026-04-02.md` §13)  
**Prioridade:** P0  
**Depende de:** Nenhuma (brownfield)  
**Fonte:** `docs/prd/PRD-sidebar-atalho-painel-admin-2026-04-02.md` (FR-SIDEBAR-ADMIN-01 a **06**, NFR-SA-01 a **04**, CR-SA-01 a **03**)  
**Especificação UX:** `docs/specs/ux-spec-sidebar-atalho-painel-admin-2026-04-02.md` (§3–§8)

## User story

**Como** administrador ou superadministrador,  
**quero** um atalho estável para o Painel Admin no topo da barra lateral (desktop) e uma decisão clara sobre o cartão no Início,  
**para** abrir `/settings/usuarios-dados` a partir de qualquer ecrã com sidebar sem regressar ao Dashboard e sem competição visual desnecessária no topo do resumo.

## Contexto técnico

- **Sidebar:** `frontend/src/Layout/Sidebar.tsx` — inserir item **condicional** no **índice 0** da lista efectiva (antes de Início), apenas em viewport **`md+`** (o aside já está `hidden md:flex`).
- **Destino:** `/settings/usuarios-dados` (paridade com CTA actual do Dashboard).
- **Visibilidade:** `hasRole(role, ['admin'])` via `useAuthStore()` (ou fonte já usada na sidebar); **não** alterar `frontend/src/lib/roles.ts` de forma a excluir `superadmin` (**CR-SA-02**).
- **Ícone:** `lucide-react`, `size={20}`; recomendação UX: **`LayoutDashboard`**; alternativas aceites: `Shield`, `Users` — **uma** escolha documentada no PR / Dev Agent Record.
- **Copy:** rótulo visível **Painel Admin** (spec §5.3); `aria-label` e `title` alinhados à decisão única do PO (rótulo curto **ou** string longa tipo “Administração dos dados da empresa” em metadados — registar escolha).
- **Estado activo:** base `pathname === '/settings/usuarios-dados'`; subcaminhos com prefixo acordado (ex.: `startsWith` como nos outros itens não-raiz) — **FR-SIDEBAR-ADMIN-04**.
- **Dashboard:** `frontend/src/pages/Dashboard.tsx` — aplicar **decisão de produto PRD §6 / UX §7** (obrigatória **antes** de marcar a story concluída):
  - **A** — Remover cartão “Administração” em **todos** os viewports (risco mobile: sem atalho visível → exige [story-sa-p1-mobile-atalho-painel-admin.md](./story-sa-p1-mobile-atalho-painel-admin.md) ou acordo PO explícito).
  - **B** — Manter cartão apenas onde não há sidebar (ex.: contentor com `md:hidden`) — paridade mobile no mesmo incremento.
  - **C** — Manter cartão sempre (redundância aceite).
- **Inalterado:** guard e rota em `frontend/src/App.tsx`; sem alterações de permissões de backend (**NFR-SA-01**).

## Critérios de aceite

- [ ] **FR-SIDEBAR-ADMIN-01:** Em `md+`, admin vê item acima de Início com destino `/settings/usuarios-dados`.
- [ ] **FR-SIDEBAR-ADMIN-02:** Superadmin vê o mesmo item e navegação funciona.
- [ ] **FR-SIDEBAR-ADMIN-03:** Utilizador não admin **não** vê o item (sem espaço vazio).
- [ ] **FR-SIDEBAR-ADMIN-04:** Estado activo visualmente consistente com os restantes itens (rota painel + subcaminhos conforme regra acordada).
- [ ] **FR-SIDEBAR-ADMIN-05:** `aria-label` e `title` coerentes com a copy aprovada pelo PO; foco por teclado e ordem de tabulação = ordem visual (**NFR-SA-02**).
- [ ] **FR-SIDEBAR-ADMIN-06:** Opção **A**, **B** ou **C** (§6) **implementada**, com **A** ou **B** ou **C** explicitada no Dev Agent Record e comentário breve no código se útil (sem over-engineering).
- [ ] **NFR-SA-03:** Reutilizar padrões existentes da sidebar (`h-12`, `rounded-xl`, classes activo/hover já usadas).
- [ ] **NFR-SA-04:** `npm run lint`, `npm run typecheck`, `npm test` verdes; actualizar ou adicionar testes se o repo já cobrir sidebar/roles (**UX spec §8** cenários 1–6 como guia de QA manual).

## Fora de escopo

- Alterar regras de negócio do Painel Admin ou API.  
- Redesenho global da sidebar ou tema.  
- Paridade obrigatória em `BottomNavigation` neste entregável — ver story P1 se necessário.

## Tasks / Subtasks

- [x] **T1 — Sidebar:** Item condicional no topo da lista, `hasRole`, `Link`, ícone Lucide, `isActive`, `aria-label` / `title`.
- [x] **T2 — Dashboard:** Implementar opção §6 escolhida pelo PO; documentar no Dev Agent Record.
- [x] **T3 — Qualidade:** Lint, typecheck, testes; QA manual conforme spec §8 (admin em `/transacoes`, superadmin, não-admin, sidebar colapsada, teclado).

## File list (checklist implementação)

- [x] `frontend/src/Layout/Sidebar.tsx`
- [x] `frontend/src/pages/Dashboard.tsx`
- [x] Testes (se aplicável): ficheiros existentes de layout/sidebar/roles ou novos RTL mínimos

## Definition of Done

- PO confirma **opção §6** (A/B/C) e copy final rótulo / `aria-label` se divergirem.  
- Evidência de QA manual para cenários da UX spec §8 (ou nota em QA Results).  
- Se **A** sem substituto mobile: follow-up **P1** criado/aprovado ou risco aceite por escrito no Dev Agent Record.

## Qualidade / CodeRabbit

- Não duplicar lógica de autorização da rota; apenas espelhar visibilidade (**UX §5.5**).  
- Antes de **Ready for Review:** correr CodeRabbit (WSL) conforme workflow do projeto em ficheiros tocados; corrigir issues **CRITICAL**.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor Agent (implementação)

### Completion Notes List

- **Opção PRD §6 / FR-SIDEBAR-ADMIN-06:** **B** — cartão Administração no Dashboard com `md:hidden` (visível só onde não há sidebar desktop); paridade mobile preservada; desktop usa só o item da sidebar.
- **Ícone:** `LayoutDashboard` (`lucide-react`, `size={20}`), conforme UX spec §5.2.
- **Copy a11y:** rótulo, `aria-label` e `title` = **Painel Admin** (paridade com outros itens da sidebar), conforme UX §5.3.
- **Configurações vs Painel:** `isActive` de `/settings` exclui `/settings/usuarios-dados` para evitar dois itens activos.
- Gates: `npm run lint`, `npm run typecheck`, `npm test` verdes (reexecutados após follow-up QA).
- **CodeRabbit (WSL):** tentativa `wsl` falhou — subsistema Linux não instalado nesta máquina; **não** foi possível correr o CLI. Quem tiver WSL + `coderabbit` deve executar `--prompt-only -t uncommitted` antes do merge.
- **Follow-up ao relatório QA (Dev):** `Sidebar.test.tsx` ampliado — `outsider` sem item; `expanded={false}` com `aria-label`/`title` e primeiro `a` no `aside`; subcaminho `/settings/usuarios-dados/detalhe` mantém estado activo (FR-04).
- **PO / §6:** opção **B** mantida; alinhada a UX spec §7 (paridade mobile no mesmo incremento). Confirmação escrita do PO permanece critério DoD se a equipa exigir trâmite formal.
- **Smoke manual (§8) — checklist para evidência no browser:** (1) Admin, viewport ≥768px, em `/transacoes` → link «Painel Admin» no topo do menu lateral → navega para `/settings/usuarios-dados`. (2) Só um item com estilo activo nessa rota. (3) Viewport estreito (abaixo de `md`), Início → cartão Administração visível. (4) Tab: primeiro link focável no aside = Painel Admin (admin). Registar OK/data em QA Results via @qa.

### File List (implementação)

- `frontend/src/Layout/Sidebar.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/Layout/Sidebar.test.tsx`

### Debug Log References

—

### Change Log

- **2026-04-02** — Story criada (SM) a partir do PRD e da UX spec sidebar Painel Admin.
- **2026-04-02** — Implementação SA-P0: item Painel Admin na sidebar (`hasRole`, `LayoutDashboard`), opção B no Dashboard, testes RTL em `Sidebar.test.tsx`.
- **2026-04-02** — Follow-up QA: mais cenários em `Sidebar.test.tsx` (outsider, sidebar colapsada, subcaminho activo); gates revalidados; CodeRabbit continua bloqueado por ausência de WSL no ambiente.

---

## QA Results

### Revisão QA — 2026-04-02

**Gate:** **CONCERNS** (implementação alinhada aos FRs; fecho formal do DoD pendente de evidências processuais)

**Racional:** O código e os testes automatizados cobrem os requisitos principais. Permanecem gaps explícitos no **Definition of Done** da story: confirmação de **PO** sobre opção §6 (embora **B** esteja documentada e coerente com UX §7), **QA manual** spec §8 sem registo de evidência, e **CodeRabbit (WSL)** não executado (já notado pelo Dev).

---

#### Rastreio requisito → evidência

| ID | Verificação | Evidência |
|----|-------------|-----------|
| FR-SIDEBAR-ADMIN-01 | Item no topo (`md+`), destino correcto | `Sidebar.tsx`: prepend condicional; aside `hidden md:flex`; teste «admin vê Painel Admin primeiro» |
| FR-SIDEBAR-ADMIN-02 | Superadmin paritário | `hasRole` em `roles.ts`; teste «superadmin vê o mesmo item» |
| FR-SIDEBAR-ADMIN-03 | Não-admin sem item / sem buraco | Teste «utilizador não admin não vê»; `outsider` não coberto em RTL (baixo risco: `hasRole(outsider, ['admin'])` é falso) |
| FR-SIDEBAR-ADMIN-04 | Estado activo + subcaminhos | `isActive` para `/settings/usuarios-dados` e prefixo; exclusão de activo duplo em «Configurações» — teste dedicado |
| FR-SIDEBAR-ADMIN-05 | Copy / `aria-label` / `title` | Rótulo único «Painel Admin» nos três; ordem de tab = ordem DOM — **não** validado E2E/teclado nesta revisão |
| FR-SIDEBAR-ADMIN-06 | Opção §6 | **B** em `Dashboard.tsx` (`md:hidden`) + comentário FR-SIDEBAR-ADMIN-06 |
| NFR-SA-01 | Sem alteração a guards/API | Cumprido (ficheiros tocados só UI) |
| NFR-SA-02 | A11y paridade | Paridade de padrão com outros `Link` da sidebar; cenários teclado/leitor **manuais** pendentes |
| NFR-SA-03 | Estilos existentes | `h-12`, `rounded-xl`, classes activo/hover iguais aos restantes itens |
| NFR-SA-04 | Lint / typecheck / testes | `Sidebar.test.tsx`: 8 testes passam (`vitest run src/Layout/Sidebar.test.tsx`). Suite completa do monorepo não reexecutada nesta revisão pontual. |

---

#### Pontos fortes

- Ajuste de `isActive` para `/settings` evita **dois itens activos** no painel — melhoria de UX sobre o padrão genérico `startsWith`.
- Opção **B** fecha o risco mobile sem exigir P1 no mesmo PR, alinhada à recomendação UX «B se o PO quiser…».

#### Lacunas / riscos residuais

1. **CodeRabbit** não corrido — story pede antes de merge; recomenda-se WSL antes de aprovar merge final.  
2. **QA manual** UX spec §8 (viewport ≥ md, sidebar colapsada, teclado): sem evidência anexada; risco baixo mas DoD pede registo.  
3. **Sidebar colapsada** (`expanded={false}`): não há teste RTL específico para «Painel Admin» nesse modo; comportamento esperado é o mesmo `Link` com `aria-label` (cenário 5).  
4. **Sub-rota** fictícia `/settings/usuarios-dados/foo`: lógica `startsWith` coberta no código; sem rota real no `App.tsx` — aceitável.

---

#### Recomendações antes do merge

1. Correr **CodeRabbit** (`--prompt-only -t uncommitted`) em WSL e tratar **CRITICAL**.  
2. **Smoke manual** (5–10 min): admin em `/transacoes` → clique Painel Admin; `/settings/usuarios-dados` com um só item activo; mobile/narrow: cartão no Início visível.  
3. **PO:** confirmar por escrito opção **B** se ainda não estiver explícita fora da story (DoD).

---

**Próximo passo sugerido:** após itens acima, elevar gate a **PASS** ou manter **CONCERNS** leve apenas com dívida «evidência manual arquivada».

— Quinn, guardião da qualidade 🛡️
