# Matriz de problemas — IU/UX global (Fase A)

**Data:** 2026-04-01  
**Auditoria:** brownfield estático (revisão de código + heurísticas Nielsen / WCAG)  
**Fontes:** `docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md`, `docs/specs/ux-spec-revisao-iu-ux-global-2026-04-01.md`  
**IDs estáveis:** `UX-GLOBAL-M###` (rastreio em PRs)

## Legenda

| Severidade | Significado |
|------------|-------------|
| **Crítico** | Bloqueia tarefa principal ou viola acessibilidade legal/AA de forma grave |
| **Alto** | Frustração frequente, dead end, inconsistência multi-dispositivo clara |
| **Médio** | Fricção pontual, copy ou padrão inconsistente |
| **Baixo** | Polimento, microcopy, melhoria incremental |

| Esforço | Significado |
|---------|-------------|
| **S** | ≤ 0,5 dia |
| **M** | 0,5–2 dias |
| **L** | > 2 dias ou várias páginas |

---

## Matriz (A02)

| ID | Local (rota / componente) | Heurística / WCAG | Severidade | Impacto | Esforço | Dono sugerido | Sugestão de correção |
|----|---------------------------|-------------------|------------|---------|---------|---------------|----------------------|
| UX-GLOBAL-M001 | `/` — `Sidebar.tsx` vs `BottomNavigation.tsx` | Nielsen #4 consistência | Alto | Primeiro contacto: mesmo destino com rótulos diferentes (“Visão Geral” vs “Inicio”) | S | frontend | Unificar rótulo canónico + grafia (“Início”). Ver `story-ux-global-03-p0-shell-rotulos-navegacao.md`. |
| UX-GLOBAL-M002 | `/settings` — sidebar “Configurações” vs bottom “Mais” | Nielsen #4 | Médio | Utilizador mobile pode não associar “Mais” a definições | S | UX + frontend | Alinhar rótulos ou H1/intro em `Settings.tsx` explicando “Conta e opções”. Ver story-03. |
| UX-GLOBAL-M003 | `/guias-mei`, `/mei-catalogo/*` — `App.tsx` `<Navigate to="/" replace />` | Nielsen #9 + spec §4.4 | Alto | Sem MEI: redirecionamento silencioso sem explicação nem CTA | S–M | frontend | Página ou *banner* com título, motivo, próximo passo. Ver `story-ux-global-04-p0-guards-mensagens-orientadoras.md`. |
| UX-GLOBAL-M004 | `/settings/users`, `/settings/usuarios-dados` — não-admin | Nielsen #9 | Médio | `Navigate to="/settings"` sem contexto se utilizador não percebeu o bloqueio | S | frontend | Toast ou estado em Settings explicando permissão (coordenar com M003 pattern). Story-04. |
| UX-GLOBAL-M005 | Mobile `< md` — MEI e catálogo | IA / Nielsen #6 | Médio | MEI não está no *bottom nav*; só em atalhos flutuantes | M | UX | Validar em UX-GLOBAL-02; opcional P2: *sheet* “Mais” ou entrada no bottom. Relatório §A07. |
| UX-GLOBAL-M006 | `App.tsx` sessão a restaurar | Nielsen #1 visibilidade | Baixo | Apenas texto “Carregando...” sem *skeleton* | S | frontend | *Skeleton* ou mensagem mais rica (alinhado FR-UX-GLOBAL-B04). Story-05. |
| UX-GLOBAL-M007 | `BottomNavigation.tsx` — landmark + estado ativo (WCAG) | WCAG 2.4.4 / 4.1.2 | Médio | Ícone + texto pequeno; leitores dependem do texto visível | S | frontend | **Resolvido (UX-GLOBAL-07):** `aria-label` no `<nav>`; `aria-current="page"` no destino ativo; «Mais» mantém nome acessível expandido. Detalhe: fechamento § STORY-UX-GLOBAL-07. *Spot check* dark: `spot-check-nfr-dark-mode-ux-global-07-2026-04-01.md`. |
| UX-GLOBAL-M008 | Fluxos financeiros — páginas diversas | Nielsen #10 + B04 | Médio | *Empty/loading/erro* heterogéneos entre Dashboard, Transações, etc. | L | frontend | Auditoria página a página; padrão `EmptyState`. Story-05. |
| UX-GLOBAL-M009 | Fluxos MEI / NFS-e — toasts e erros | B06 | Alto | Risco de mensagem técnica ou genérica em falhas de API | M | frontend + backend | Mapeamento código → copy. Story-06. |
| UX-GLOBAL-M010 | `Layout.tsx` — atalhos vs bottom | Nielsen #4 | Baixo | Dois sistemas de navegação secundária sem onboarding | M | UX/conteúdo | Tooltips ou *coach mark* opcional pós-login (P2); não bloqueante. |

### Fechamento pós-implementação (STORY-UX-GLOBAL-04, 2026-04-01)

| ID | Estado | Nota |
|----|--------|------|
| **UX-GLOBAL-M003** | **Mitigado** | `App.tsx`: `<Navigate to="/" state={{ accessBlock: 'mei-required' }} />`; `Dashboard` + `AccessBlockedExplainer` (título, motivo, próximo passo, CTA, foco na região). |
| **UX-GLOBAL-M004** | **Mitigado** | `Navigate to="/settings"` com `state`; aviso em `Settings` com o mesmo padrão §4.4. |

*Follow-up (fora do escopo da story-04):* M009 (toasts/API), rota `*` → `/` sem aviso específico, M001–M002 cobertos pela story-03 onde aplicável.

### Fechamento pós-implementação (STORY-UX-GLOBAL-07, 2026-04-01)

| ID / âmbito | Estado | Nota |
|-------------|--------|------|
| **UX-GLOBAL-M007** | **Resolvido** | `BottomNavigation.tsx`: `aria-label` no `<nav>` (“Navegação principal (mobile)”); `aria-current="page"` no destino ativo; mantido `aria-label` expandido em “Mais”. Linha A02 atualizada. *Spot check* NFR dark: [spot-check-nfr-dark-mode-ux-global-07-2026-04-01.md](./spot-check-nfr-dark-mode-ux-global-07-2026-04-01.md). |
| **DS — botão destrutivo** | **Resolvido** | `index.css`: `.planner-button-danger`; uso em `Transactions` (modal excluir), `Settings` (desconectar Google, sair), `ManageUsers` (excluir), `RecorrenciaDeleteModal`, `Categorias` (confirmar exclusão). |
| **DS — botão sucesso** | **Resolvido** | `index.css`: `.planner-button-success`; `Settings` (WhatsApp), `ManageUsers` (desbloquear). |
| **DS — cartões lista MEI (mobile)** | **Resolvido** | `MeiCatalogoClientes.tsx`, `MeiCatalogoServicosProdutos.tsx`: itens da lista mobile com `planner-card-muted` em vez de bordas/cores ad hoc. |
| **Exceção (mantida)** | **Documentada** | Botões `planner-button` + `bg-indigo-600` (“Redefinir senha” em `ManageUsers.tsx`): variante `planner-button-accent` fora do escopo desta sprint — ver `docs/ux-audit/design-system-excecoes-2026-04-01.md`. |

---

## Notas de método

- Não foram executados testes com utilizadores nesta entrega (STORY-UX-GLOBAL-02).  
- Contraste e foco: avaliação parcial por inspeção de classes Tailwind; validação completa recomendada com ferramentas (Axe, Lighthouse) nas rotas prioritárias.
