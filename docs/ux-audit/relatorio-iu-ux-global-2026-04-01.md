# Relatório de auditoria IU/UX — Meu Financeiro (global)

**Data:** 2026-04-01  
**Tipo:** Fase A — descoberta e síntese (sem testes moderados com utilizadores)  
**PRD:** [PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md](../prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md)  
**Spec UX:** [ux-spec-revisao-iu-ux-global-2026-04-01.md](../specs/ux-spec-revisao-iu-ux-global-2026-04-01.md)  
**Matriz detalhada:** [matriz-problemas-iu-ux-global-2026-04-01.md](./matriz-problemas-iu-ux-global-2026-04-01.md)  
**Checklist WCAG:** [checklist-wcag-22-aa-fluxos-2026-04-01.md](./checklist-wcag-22-aa-fluxos-2026-04-01.md)  
**Minuta PO (DoD):** [po-priorizacao-backlog-2026-04-01.md](./po-priorizacao-backlog-2026-04-01.md)  
**Testes moderados (UX-GLOBAL-02):** [testes-moderados-iu-ux-global-2026-04-01.md](./testes-moderados-iu-ux-global-2026-04-01.md)

---

## 1. Resumo executivo

Foi realizada **auditoria brownfield** por revisão estática do `frontend/` (rotas, *shell*, navegação, guards) e alinhamento às heurísticas de Nielsen e aos requisitos WCAG 2.2 AA em espírito (checklist preliminar). Os principais riscos para **primeiro contacto** são: (1) **inconsistência de rótulos** entre sidebar e navegação inferior para a mesma rota; (2) **redirecionamentos silenciosos** quando o utilizador não tem acesso MEI; (3) **fragmentação da entrada MEI** em mobile (atalhos flutuantes vs *bottom nav*).

**Testes com utilizadores (n ≥ 5)** não fazem parte desta entrega — ver [story-ux-global-02-fase-a-testes-moderados.md](../stories/story-ux-global-02-fase-a-testes-moderados.md).

---

## 2. Âmbito auditado (rotas / componentes)

| Área | Rotas / ficheiros |
|------|-------------------|
| Autenticação | `Login`, `LoginOnly`, `Register`, `ForgotPassword`, `ResetPassword` — `App.tsx` |
| Núcleo financeiro | `/`, `/transacoes`, `/orcamentos`, `/categorias` |
| Planeamento | `/agenda`, `/recorrencias` |
| Conta / admin | `/settings`, `/settings/users`, `/settings/usuarios-dados` |
| MEI | `/guias-mei`, `/mei-catalogo/clientes`, `/mei-catalogo/servicos-produtos` |
| Shell | `Layout.tsx`, `Header.tsx`, `Sidebar.tsx`, `Footer.tsx`, `BottomNavigation.tsx`, `UpdatesPanel` |

---

## 3. Conclusões por heurística (síntese)

| Heurística | Conclusão breve |
|------------|-----------------|
| Visibilidade do estado do sistema | `App.tsx` mostra “Carregando...” global; páginas individuais variam (ver M006, M008). |
| Correspondência sistema / mundo real | Termos MEI/NFS-e assumem contexto fiscal — glossário leve ainda recomendado (spec §5.4). |
| Controlo e liberdade do utilizador | Redirecionamentos sem explicação em rotas MEI reduzem sensação de controlo (M003). |
| Consistência e padrões | **Gap claro:** rótulos `/` e `/settings` entre sidebar e bottom (M001, M002). |
| Prevenção de erros | Formulários não auditados campo a campo nesta fase. |
| Reconhecimento vs memorização | Mobile: MEI não no *bottom* exige descoberta dos “Atalhos” (M005). |
| Flexibilidade / eficiência | Sidebar expandida oferece atalhos úteis em desktop. |
| Estética minimalista | Shell com múltiplos pontos de entrada (sidebar, bottom, FAB atalhos) — aceitável mas cognitivamente denso em mobile. |
| Ajuda com erros | Guards MEI não apresentam mensagem dedicada (M003). |
| Ajuda e documentação | Fora de escopo app; tooltips podem ajudar termos fiscais. |

---

## 4. Backlog priorizado (FR-UX-GLOBAL-A03)

### 4.1 Quick wins (≤ 10 candidatos — primeira onda)

Lista explícita para cumprimento do PRD (pode ser reordenada pelo PO):

1. **M001** — Unificar rótulo da rota `/` (sidebar + bottom). → `story-ux-global-03`  
2. **M002** — Clarificar “Mais” vs Configurações (copy ou rótulo). → `story-ux-global-03`  
3. **M003** — Mensagem orientadora em bloqueio MEI (substituir ou complementar `Navigate` silencioso). → `story-ux-global-04`  
4. **M007** — Revisão de nomes acessíveis no bottom nav após mudança de copy. → `story-ux-global-03` (ou 07)  
5. **M006** — Melhorar estado de carregamento inicial da app. → `story-ux-global-05`  
6. **M004** — Mensagem ao redirecionar não-admin de rotas de settings. → `story-ux-global-04`  
7. **M010** — Copy curta no primeiro uso dos “Atalhos” (tooltip ou *empty* educativo). → conteúdo / P2  
8. *(Reserva)* **M008** — Uma página piloto com empty state padrão (ex.: Transações). → `story-ux-global-05`  
9. *(Reserva)* Documentar exceções de design system quando M008 revelar padrões. → `story-ux-global-07`  
10. *(Reserva)* **M009** — Um mapeamento de erro MEI de alto impacto. → `story-ux-global-06`

> **Clarificação (seguimento QA):** os itens **8–10** cumprem o requisito PRD de “≤ 10 candidatos identificados”, mas **não** implicam compromisso de sprint até o PO assinalar na minuta [po-priorizacao-backlog-2026-04-01.md](./po-priorizacao-backlog-2026-04-01.md).

### 4.2 Médio prazo

- **M005** — Decisão de IA mobile para MEI após UX-GLOBAL-02.  
- **M008** — Cobertura completa de empty/loading/erro nas rotas prioritárias.  
- **M009** — Mapeamento alargado de erros fiscais + contratos backend.

### 4.3 Estrutural (P2 / após evidência)

- Onboarding de 1 ecrã pós-login (mapa de navegação).  
- Reestruturação do *bottom nav* (mais de 5 itens ou *sheet* “Mais”).  
- Grande refactor de `Layout` apenas se A07 for reaberto com dados de testes.

---

## 5. FR-UX-GLOBAL-A07 — Proposta de navegação

**Decisão:** **N/A — documento `proposta-navegacao-global-*.md` não é necessário** nesta data.

**Justificativa:** A fragmentação mobile (MEI via FAB “Atalhos”) é **real** mas não foi demonstrado **dano ao desempenho de tarefa** sem testes moderados. A recomendação é: (1) executar **UX-GLOBAL-02**; (2) se ≥ 2 participantes falharem a descoberta de MEI em mobile, reabrir A07 com *draft* de proposta (bottom vs *sheet* vs onboarding).

---

## 6. Handoff para stories (FR-UX-GLOBAL-A06)

| ID matriz | Rota / área | Critérios de aceite testáveis (resumo) | Story alvo |
|-----------|-------------|----------------------------------------|------------|
| UX-GLOBAL-M001 | `/` | Texto do primeiro item idêntico em `Sidebar` e `BottomNavigation` | [story-ux-global-03-p0-shell-rotulos-navegacao.md](../stories/story-ux-global-03-p0-shell-rotulos-navegacao.md) |
| UX-GLOBAL-M002 | `/settings` | Decisão documentada: alinhar “Mais”/“Configurações” ou intro em Settings | story-ux-global-03 |
| UX-GLOBAL-M003 | `/guias-mei`, `/mei-catalogo/*` | Utilador sem MEI vê padrão de 4 blocos (título, porquê, passo, CTA) ou destino com explicação | [story-ux-global-04-p0-guards-mensagens-orientadoras.md](../stories/story-ux-global-04-p0-guards-mensagens-orientadoras.md) |
| UX-GLOBAL-M004 | `/settings/users`, `/settings/usuarios-dados` | Não-admin não fica sem contexto ao ser redirecionado | story-ux-global-04 |
| UX-GLOBAL-M008 | Múltiplas | ≥ 5 páginas com loading/empty/erro padronizados | [story-ux-global-05-p1-estados-vazios-loading-erro.md](../stories/story-ux-global-05-p1-estados-vazios-loading-erro.md) |
| UX-GLOBAL-M009 | MEI / NFS-e | ≥ 5 erros mapeados; sem JSON bruto em toast | [story-ux-global-06-p1-mapeamento-erros-fiscais-ui.md](../stories/story-ux-global-06-p1-mapeamento-erros-fiscais-ui.md) |
| UX-GLOBAL-M001–M010 (desvios visuais) | — | Top N desvios do inventário corrigidos ou documentados | [story-ux-global-07-p1-consistencia-componentes-top-desvios.md](../stories/story-ux-global-07-p1-consistencia-componentes-top-desvios.md) |
| Validação utilizador | T1–T4 | n ≥ 5, tabela de sucesso | [story-ux-global-02-fase-a-testes-moderados.md](../stories/story-ux-global-02-fase-a-testes-moderados.md) |

---

## 7. Próximos passos

1. **PO:** preencher [po-priorizacao-backlog-2026-04-01.md](./po-priorizacao-backlog-2026-04-01.md) (leitura + priorização explícita; itens 8–10).  
2. **UX / equipa:** entregue [testes-moderados-iu-ux-global-2026-04-01.md](./testes-moderados-iu-ux-global-2026-04-01.md) (STORY-UX-GLOBAL-02); revisão PO pendente conforme DoD da story.  
3. **Dev:** implementar UX-GLOBAL-03 e 04 em primeiro lugar (alto impacto / baixo esforço).  
4. **QA:** correr Axe/Lighthouse nas rotas indicadas no checklist e atualizar estados **P/F/N/A** com evidência.

---

## 8. Referências de código (amostra)

- `frontend/src/App.tsx` — guards MEI, rotas autenticadas.  
- `frontend/src/Layout/Sidebar.tsx` — “Visão Geral”, “Configurações”.  
- `frontend/src/components/BottomNavigation.tsx` — “Inicio”, “Mais”.  
- `frontend/src/Layout/Layout.tsx` — FAB atalhos (Agenda, Mei Infinito).

---

*Relatório gerado no âmbito da STORY-UX-GLOBAL-01. NFR-UX-GLOBAL-03 satisfeito com referências cruzadas e data.*
