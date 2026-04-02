# PRD — Barra lateral: atalho **Painel Admin** (acima de Início)

**Versão:** 1.0  
**Data:** 2026-04-02  
**Tipo:** Brownfield — navegação autenticada (frontend, desktop `md+`)  
**Fonte canónica do pedido:** `docs/brief/brief-sidebar-atalho-painel-admin-2026-04-02.md`

**Relação com outros artefatos:**

- **Alinha-se** ao produto **Meu Financeiro** (área autenticada: `Layout` + `Dashboard`).  
- **Não altera** regras de negócio do Painel Admin nem permissões de backend; apenas **superfície de navegação** e decisão sobre o **cartão no Início**.  
- **Referências técnicas:** `frontend/src/App.tsx` (rota `/settings/usuarios-dados`, guard `hasRole`), `frontend/src/lib/roles.ts`, `frontend/src/Layout/Sidebar.tsx`, `frontend/src/pages/Dashboard.tsx`.

---

## 1. Resumo executivo

O **Painel Admin** (dados financeiros dos utilizadores da empresa) é hoje acedido sobretudo através de um **cartão no topo da página Início**, com ligação para `/settings/usuarios-dados`. Fora do Início, em desktop, **não existe** entrada equivalente na **barra lateral**.

Este PRD define requisitos rastreáveis (**FR-SIDEBAR-ADMIN-\***), NFRs, critérios de aceite e **decisão de produto** sobre o cartão no `Dashboard`, para:

1. Expor **item fixo na sidebar** (`md+`), **primeiro da lista** (acima de Início), com o **mesmo destino** que o atalho atual.  
2. Mostrar o item **apenas** a **admin** e **superadmin**, em coerência com a rota existente (`hasRole(role, ['admin'])` — `superadmin` incluído pela implementação actual de `hasRole`).  
3. **Reduzir competição visual** no topo do dashboard, transferindo o atalho prioritário para **navegação global** na lateral.

---

## 2. Visão de produto (experiência)

Administradores e superadministradores devem **aceder ao Painel Admin a partir de qualquer ecrã** que mostre a sidebar desktop, **sem regressar ao Início**. O primeiro item da lista comunica **prioridade operacional** (“ferramentas de gestão” estáveis), mantendo **Início** como âncora do resumo financeiro.

Utilizadores **sem** papel admin não devem ver o item (paridade com a rota protegida).

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Descoberta** | Atalho só óbvio no Início; noutras páginas falta entrada na sidebar. | Acesso **consistente** em qualquer vista com sidebar. |
| **Hierarquia** | Cartão “Administração” compete com saldo, gráficos e filtros. | Sidebar absorve o atalho; Início foca o resumo. |
| **Expectativa** | Gestão associa-se a entradas de menu estáveis. | Ícone dedicado **antes** de Início reforça o modelo mental. |

---

## 4. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| **Admin** | Abrir Painel Admin a partir de Transações, Orçamentos, etc. | Um clique na sidebar → `/settings/usuarios-dados`; item visível só para este papel. |
| **Superadmin** | Mesmo acesso que admin às rotas `admin`. | Mesmo item visível e funcional (coerência com `hasRole`). |
| **Utilizador / outsider** | Não aceder a gestão de dados de outros. | Item **ausente**; rota continua protegida como hoje. |
| **Teclado / leitor de ecrã** | Navegar a sidebar com clareza. | `aria-label` / `title` coerentes; foco e estilo activo iguais aos restantes itens. |

**Stakeholders:** PO (decisão §6 sobre cartão no Início), UX (rótulo final, ícone Lucide), Frontend, QA.

---

## 5. Escopo

### 5.1 Dentro do escopo

- Novo **item de navegação** em `Sidebar.tsx` (viewport **`md+`** — sidebar já `hidden md:flex`), **primeiro** na ordem, destino **`/settings/usuarios-dados`**.  
- **Visibilidade condicional** com `hasRole(role, ['admin'])` (ou equivalente explícito que preserve **superadmin**).  
- **Estado activo** (`isActive`) para `/settings/usuarios-dados` e **subcaminhos**, se existirem, alinhado aos demais itens.  
- **Acessibilidade:** `aria-label`, `title`, foco por teclado consistente com outros `Link` da sidebar.  
- **Ícone Lucide** alinhado a “painel / dados / escudo” (ex.: `LayoutDashboard`, `Shield`, `Users`) — **escolha final na implementação**, documentada no PR / story.  
- **Decisão e implementação** quanto ao cartão “Administração” no `Dashboard` (ver §6).

### 5.2 Fora do escopo

- Alterar **permissões de backend** ou regras de negócio do Painel Admin.  
- **Redesenho completo** da sidebar ou do tema.  
- **Paridade obrigatória em mobile / `BottomNavigation`** neste entregável — pode ser **story separada** (“atalho admin em mobile”) se o PO remover o cartão sem substituto móvel.

---

## 6. Decisão de produto: cartão no Início (`Dashboard`)

**Opções (uma deve ficar explícita na story e reflectida no código):**

| Opção | Descrição |
|-------|-----------|
| **A** | **Remover** o cartão “Administração” do `Dashboard` quando o atalho na sidebar existir (evita duplicação em desktop). **Risco:** mobile sem sidebar pode ficar **sem** atalho visível — requer follow-up ou acordo PO. |
| **B** | **Manter** o cartão apenas em mobile; **ocultar** em `md+` se o atalho for só desktop. |
| **C** | **Manter** sempre o cartão (redundância aceite). |

**Recomendação do brief (default deste PRD):** **A** para desktop; se não houver atalho equivalente em mobile, abrir **follow-up** (ex.: entrada em Configurações ou atalho em `BottomNavigation`).

**Critério de fecho:** a opção escolhida pelo PO está **implementada** e referenciada na story / notas de release.

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-SIDEBAR-ADMIN-01** | Em viewport `md+`, utilizador **admin** vê um item de navegação na sidebar **acima** de Início, com destino **`/settings/usuarios-dados`**. | P0 |
| **FR-SIDEBAR-ADMIN-02** | Utilizador **superadmin** vê o **mesmo** item (paridade com rota e `hasRole`). | P0 |
| **FR-SIDEBAR-ADMIN-03** | Utilizadores **sem** papel admin (ex.: `usuario`, `outsider`) **não** veem o item. | P0 |
| **FR-SIDEBAR-ADMIN-04** | Com rota actual em `/settings/usuarios-dados` (e subcaminhos, se aplicável), o item reflecte **estado activo** visualmente como os restantes itens da sidebar. | P0 |
| **FR-SIDEBAR-ADMIN-05** | O item expõe **rótulo** e metadados acessíveis (`aria-label`, `title`) coerentes com “Painel Admin” / “Administração” (copy final validada com PO). | P0 |
| **FR-SIDEBAR-ADMIN-06** | A **decisão §6** (cartão no `Dashboard`) está implementada e documentada (remoção, condicional mobile/desktop, ou manutenção). | P0 |

**Mapeamento ao brief:** os critérios do brief §7 mapeiam para **FR-SIDEBAR-ADMIN-01** a **06** e gates de qualidade abaixo.

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|-------|
| **NFR-SA-01** | **Compatibilidade** | Não alterar contratos de API nem guards de servidor; apenas UI e navegação cliente. |
| **NFR-SA-02** | **Acessibilidade** | Paridade de foco e nomes acessíveis com os outros links da sidebar (objectivo alinhado a WCAG 2.1 AA para a zona alterada). |
| **NFR-SA-03** | **Consistência visual** | Reutilizar padrões existentes da sidebar (espaçamento, `isActive`, ícones `lucide-react`). |
| **NFR-SA-04** | **Qualidade** | `npm run lint` e `npm run typecheck` sem regressões nos ficheiros tocados; testes existentes de sidebar/roles **actualizados** ou novos **se** o repositório já os cobrir. |

---

## 9. Requisitos de compatibilidade (brownfield)

| ID | Requisito |
|----|-----------|
| **CR-SA-01** | A rota `/settings/usuarios-dados` e o guard em `App.tsx` mantêm o **mesmo comportamento** de autorização. |
| **CR-SA-02** | `hasRole` em `roles.ts` não deve ser alterado de forma a **excluir superadmin** do acesso admin, salvo decisão explícita de produto fora deste PRD. |
| **CR-SA-03** | Navegação SPA permanece funcional; não introduzir regressões em deep links para o painel. |

---

## 10. Integração técnica (resumo)

| Área | Abordagem |
|------|-----------|
| **Frontend** | `Sidebar.tsx`: novo item condicional no início da lista de `navItems` (ou equivalente), `isActive` para o path do painel. |
| **Dashboard** | `Dashboard.tsx`: ajuste conforme opção §6. |
| **Testes** | Componente/rota conforme práticas do repo (opcional mas desejável no mesmo incremento). |

---

## 11. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Acesso sem passar pelo Início | Admin consegue abrir Painel Admin a partir de **qualquer** página com sidebar em **≤ 2 cliques** (1 clique no item). |
| Segurança de superfície | Utilizador sem papel admin **não** vê o item; tentativas de rota directa continuam bloqueadas pelo guard existente. |
| Qualidade | Lint, typecheck e testes acordados **verdes** após alteração. |

---

## 12. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Paridade mobile** ao remover cartão | Admins em telemóvel sem atalho visível | Opção **B** (§6), follow-up em `BottomNavigation`, ou entrada em Configurações — **decisão PO** antes de **A** sem substituto. |
| **Ordem “Admin” acima de “Início”** | Confusão para alguns utilizadores | Manter como requisito actual; iterar com secção “Admin” colapsável se houver feedback. |
| **Drift de ícone/copy** | Inconsistência com resto da app | Documentar ícone e texto na story; revisão UX rápida. |

---

## 13. Epic e story (proposta)

**Epic (único):** Navegação — atalho Painel Admin na sidebar desktop.

| Story sugerida | Conteúdo mínimo |
|----------------|-----------------|
| **Story 1** | Implementar item condicional no topo da `Sidebar.tsx` + estado activo + a11y + ícone. |
| **Story 2** (ou mesma story se pequena) | Aplicar decisão §6 no `Dashboard.tsx` + validação mobile conforme opção PO. |
| **Story 3** (opcional / follow-up) | Paridade mobile (`BottomNavigation` ou Configurações) se necessário após Story 1–2. |

A equipa pode **fundir** Story 1 e 2 num único incremento se o esforço for inferior a uma sessão de desenvolvimento.

---

## 14. Critérios de release / Definition of Done (produto)

- [ ] **FR-SIDEBAR-ADMIN-01** a **06** satisfeitos.  
- [ ] Decisão §6 **explicitada** na story e **implementada**.  
- [ ] **NFR-SA-01** a **04** verificados (incl. lint/typecheck).  
- [ ] PO aceita risco/resposta a **paridade mobile** (follow-up registado se aplicável).

---

## 15. Change log

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-02 | PM (a partir do brief) | Versão inicial a partir de `brief-sidebar-atalho-painel-admin-2026-04-02.md`. |

---

*Próximo passo canónico AIOX: criar story em `docs/stories/` com referência a este PRD e à opção §6 validada pelo PO.*
