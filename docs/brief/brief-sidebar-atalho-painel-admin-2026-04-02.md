# Brief: atalho **Painel Admin** na barra lateral (acima de Início)

**Data:** 2026-04-02  
**Origem:** pedido de produto (navegação / IA)  
**Produto:** Meu Financeiro — área autenticada (`Layout` + `Dashboard`)

**Documentos relacionados:**

- Rotas e permissões: `frontend/src/App.tsx` (`/settings/usuarios-dados`, guard com `hasRole`)  
- Papéis: `frontend/src/lib/roles.ts` (`hasRole`, `superadmin` com acesso implícito a rotas `admin`)  
- Navegação desktop: `frontend/src/Layout/Sidebar.tsx`  
- Atalho atual no Início: `frontend/src/pages/Dashboard.tsx` (cartão “Administração” + botão “Painel Admin”)

---

## 1. Resumo executivo

Hoje o acesso ao **Painel Admin** (dados financeiros dos utilizadores da empresa) aparece como **cartão no topo da página Início**, com botão que navega para `/settings/usuarios-dados`. O objetivo é **expor o mesmo destino como item fixo da barra lateral (desktop)**, **acima do ícone de Início**, visível **apenas** para utilizadores com papel **admin** ou **superadmin**, alinhando o atalho ao padrão de navegação principal e libertando espaço visual no dashboard.

---

## 2. Problema / oportunidade

| Dimensão | Situação atual | Oportunidade |
|----------|----------------|--------------|
| **Descoberta** | Quem entra no Início vê o cartão; noutras páginas o atalho não está na sidebar. | Acesso **consistente** em qualquer ecrã com sidebar, sem voltar ao Início. |
| **Hierarquia** | O cartão compete com saldo, gráficos e filtros no topo do dashboard. | **Navegação global** na lateral; o Início foca-se no resumo financeiro. |
| **Expectativa** | Admins associam “ferramentas de gestão” a entradas de menu estáveis. | Ícone dedicado no topo da lista, **antes** de Início, reforça prioridade operacional. |

---

## 3. Estado atual (brownfield)

| Aspeto | Detalhe |
|--------|---------|
| **Destino** | Rota `GET` → `/settings/usuarios-dados`; página `AdminUserData`. |
| **Autorização** | `App.tsx`: rota protegida com `hasRole(role, ['admin'])`. Em `roles.ts`, **`superadmin` obtém sempre `true` em `hasRole`**, logo já acede ao painel (paridade com admin na rota). |
| **UI atual do atalho** | `Dashboard.tsx`: bloco “Administração” + texto + `Link` “Painel Admin” **só** quando `hasRole(role, ['admin'])` — comportamento efetivo inclui superadmin pela mesma função. |
| **Sidebar** | `Sidebar.tsx`: lista começa por Início (`/`), depois Transações, Orçamentos, etc.; **não** inclui Painel Admin. Ícones via `lucide-react`. |
| **Mobile** | Barra lateral é `hidden md:flex`; navegação inferior em `BottomNavigation`. **Este brief foca desktop**; mobile pode ficar explícito em “fora de âmbito” ou follow-up. |

---

## 4. Objetivos (aceite sugerido)

1. **Novo item na sidebar** (viewport `md+`), **primeiro da lista** (acima de Início), com rótulo acessível (ex.: “Painel Admin” ou “Administração”) e **mesmo destino** que o botão atual: `/settings/usuarios-dados`.  
2. **Visibilidade:** mostrar o item **apenas** se o utilizador for **admin** ou **superadmin** (reutilizar `hasRole(role, ['admin'])` ou condição explícita equivalente, coerente com a rota).  
3. **Estado ativo:** ao estar em `/settings/usuarios-dados` (e subcaminhos, se existirem), o item deve refletir **estilo de rota ativa** como os demais ítens (`isActive`).  
4. **Acessibilidade:** `aria-label` e `title` coerentes; foco por teclado igual aos outros `Link` da sidebar.  
5. **Ícone:** escolher ícone Lucide alinhado a “painel / dados / escudo” (ex.: `LayoutDashboard`, `Shield`, `Users` — **definir na implementação** e manter consistência com o resto da app).

---

## 5. Comportamento do cartão no Início (decisão de produto)

**Opções (escolher uma na story/PR):**

- **A — Remover** o cartão “Administração” do `Dashboard` quando existir o atalho na sidebar (evita duplicação; utilizadores mobile sem sidebar podem precisar de **outro** acesso — ver §6).  
- **B — Manter** o cartão apenas em mobile e ocultar em `md+` se o atalho for só desktop.  
- **C — Manter** sempre o cartão (redundância aceite).

**Recomendação do brief:** **A** para desktop; se não houver atalho equivalente em mobile, abrir **follow-up** (ex.: entrada em Configurações ou atalho rápido).

---

## 6. Fora de âmbito (sugerido)

- Alterar permissões de backend ou regras de negócio do Painel Admin.  
- Redesenho completo da sidebar ou do tema.  
- **Mobile / `BottomNavigation`:** não obrigatório neste brief; pode ser story separada “paridade mobile do atalho admin”.

---

## 7. Critérios de aceitação (checklist)

- [ ] Utilizador **admin** vê o ícone do Painel Admin **acima** de Início na sidebar (`md+`).  
- [ ] Utilizador **superadmin** vê o mesmo ítem (coerente com `hasRole` e rota existente).  
- [ ] Utilizador **usuario** / **outsider** **não** vê o ítem.  
- [ ] Clique navega para `/settings/usuarios-dados`.  
- [ ] Rota ativa destacada visualmente.  
- [ ] Decisão tomada e implementada quanto ao cartão no `Dashboard` (§5).  
- [ ] `npm run lint` e `npm run typecheck` sem regressões nos ficheiros tocados.

---

## 8. Ficheiros prováveis na implementação

- `frontend/src/Layout/Sidebar.tsx` — novo item condicional no início de `navItems`, `isActive` para o path do painel.  
- `frontend/src/pages/Dashboard.tsx` — remoção ou condicional do cartão conforme §5.  
- Testes: atualizar ou adicionar teste de componente/rota se o projeto já cobrir sidebar ou roles (opcional mas desejável).

---

## 9. Riscos / notas

- **Paridade mobile:** remoção total do cartão sem substituto em `BottomNavigation` pode **esconder** o atalho em telemóvel; validar com PO.  
- **Ordem mental:** “Painel Admin” acima de “Início” é intencional; se houver feedback de utilizadores, considerar toggle ou secção “Admin” colapsável numa iteracão futura.

---

*Brief preparado para conversão em story em `docs/stories/` quando o PO validar a opção §5 (cartão Início).*
