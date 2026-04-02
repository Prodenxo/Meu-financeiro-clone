# Story — CAT-MEI-05: Navegação, guards MEI, testes de rota e integração com emissão NFS-e

**ID:** STORY-CAT-MEI-05  
**Prioridade:** P0  
**Depende de:** [story-cat-mei-03-frontend-pagina-clientes-catalogo.md](./story-cat-mei-03-frontend-pagina-clientes-catalogo.md), [story-cat-mei-04-frontend-pagina-servicos-produtos-catalogo.md](./story-cat-mei-04-frontend-pagina-servicos-produtos-catalogo.md) (páginas e serviços prontos)  
**Fonte:** `docs/prd/PRD-catalogo-clientes-servicos-produtos-mei-2026-03-30.md` (FR-CAT-01, FR-CAT-07, decisão sem MEI §6.3)  
**Especificação UX:** `docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md` §3.2, §3.3, §4, §10, §12

## User story

**Como** utilizador com MEI ativo na conta,  
**quero** **descobrir** as áreas de catálogo no menu, **não** aceder a elas sem permissão, e **ver** na emissão de NFS-e os registos que acabei de criar ou editar,  
**para** ter um fluxo contínuo entre cadastro e emissão (FR-CAT-07).

## Contexto técnico

- **Contrato canónico (spike CAT-MEI-01):** [`docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`](../technical/catalogo-mei-persistencia-e-api-2026-03-30.md) — mesma fonte de verdade que CAT-MEI-02/03/04 para dados exibidos após refetch na emissão (FR-CAT-07).

### Navegação e guards

- `frontend/src/Layout/Sidebar.tsx`: adicionar **dois** `Link`s após “Mei Infinito”, condicionados a `canAccessMeiArea` (igual a `/guias-mei`), com ícones sugeridos na spec §3.2 (`Users`/`ContactRound`, `Package`/`Briefcase`).
- `frontend/src/App.tsx`: registar rotas `/mei-catalogo/clientes` e `/mei-catalogo/servicos-produtos` com o **mesmo gate** que `/guias-mei` (`canAccessMeiArea`); utilizador sem acesso → `Navigate to="/" replace` (ou equivalente já usado).
- **Estado ativo** no sidebar: ajustar `isActive` para que `/mei-catalogo/...` realce o item correto **sem** marcar “Mei Infinito” como ativo (spec §3.2).

### Testes

- Estender `frontend/src/App.mei-gate.test.tsx`: utilizador `mei=false` e role `usuario` **não** acessa as novas rotas; `superadmin`/`admin` conforme regras atuais de Mei Infinito.

### Integração emissão (FR-CAT-07)

- `frontend/src/pages/GuidesMei.tsx`: garantir que, após criar/editar no catálogo, ao voltar à emissão os **selects** ou busca de catálogo refletem dados **sem** exigir hard refresh, por uma destas abordagens (documentar a escolha no PR):
  - refetch ao focar o separador/workspace NFS-e;
  - `visibilitychange` quando o documento volta a visível;
  - invalidação explícita após navegação de volta (ex.: `location.key` / efeito em `useLocation`).

### Ligações contextuais (P1 dentro desta story ou follow-up)

- Spec §3.3: link opcional nas páginas de catálogo para `/guias-mei`; links discretos na zona de emissão para “Gerir clientes” / “Gerir serviços e produtos”. Se escopo/tempo apertar, marcar checkbox abaixo como follow-up com referência a nova story.

## Critérios de aceite

- [ ] **FR-CAT-01:** Existem duas entradas distintas no menu (Clientes; Serviços e produtos) visíveis só com `canAccessMeiArea`.
- [ ] **Guard:** URL direta bloqueada para quem não tem acesso MEI, comportamento alinhado a `/guias-mei`.
- [ ] **Testes:** novos casos em `App.mei-gate.test.tsx` passam.
- [ ] **FR-CAT-07:** Cenário E2E manual documentado no Dev Agent Record: criar ou editar cliente/produto nas páginas dedicadas → ir a Mei Infinito → NFS-e → registo visível/selecionável **sem** F5 obrigatório.
- [ ] Sidebar: item ativo correto para cada rota sob `/mei-catalogo/`.

### Opcional (marcar na implementação)

- [ ] Links contextuais spec §3.3 (catálogo ↔ Mei Infinito).

## Fora de escopo

- Lógica backend (CAT-MEI-02).  
- Conteúdo funcional das páginas de lista/modal (CAT-MEI-03/04), salvo pequenos ajustes para integração.

## File list (checklist implementação)

- [ ] `frontend/src/Layout/Sidebar.tsx`
- [ ] `frontend/src/App.tsx`
- [ ] `frontend/src/App.mei-gate.test.tsx`
- [ ] `frontend/src/pages/GuidesMei.tsx` (refetch / foco workspace NFS-e)
- [ ] Opcional: páginas CAT-MEI-03/04 para links §3.3

## Definition of Done

- `npm run lint`, `npm run typecheck`, `npm test` na raiz ou `frontend` conforme projeto.  
- QA: percorrer checklist spec §12 itens 1, 5 e 6 no âmbito desta story.

## Qualidade / CodeRabbit

- Evitar re-fetch agressivo em **cada** render de `GuidesMei`; acoplar refetch a evento de navegação/tab NFS-e (NFR-CAT-02).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- **`App.tsx`:** rotas `/mei-catalogo/*` já existiam com `canAccessMeiArea` — mantidas alinhadas a `/guias-mei`.
- **`Sidebar.tsx`:** após “Mei Infinito”, entradas **Catálogo — clientes** e **Catálogo — serviços** (`Users`, `Package`), visíveis só com `canAccessMeiArea`. **`isActive`:** `/guias-mei` só com pathname exato (evita realçar Mei Infinito em `/mei-catalogo/...`); restantes com match exato ou sub-rota.
- **`GuidesMei.tsx` (FR-CAT-07 / NFR-CAT-02):** refetch de catálogo **sem** loop em todo render — (1) `loadNfseCatalog` no mount como hoje; (2) ao **mudar** para workspace `nfse` vindo de outro tab (`prevMeiWorkspaceRef`); (3) `visibilitychange` → `visible` quando `activeWorkspace === 'nfse'`. Links §3.3 discretos (“Gerir clientes” / “Gerir serviços e produtos”) junto aos selects de atalho, com `Link` ou `<a>` como no hero.
- **Testes:** `App.mei-gate.test.tsx` — superadmin e admin acedem às rotas de catálogo com `mei=false`; `GuidesMei.nfse-catalog-refetch.test.tsx` — nova chamada a `listarCatalogoNfse*` ao reabrir separador NFS-e após DAS.
- **Checklist E2E manual (aceite FR-CAT-07):** com sessão MEI ativa, criar ou editar cliente/produto em `/mei-catalogo/...` → navegar a **Mei Infinito** → separador **NFS-e** → confirmar novo/editado **selecionável** nos atalhos sem depender de F5 (refetch ao separador + visibilidade cobre regressão).
- **Pós-QA (Quinn):** `Sidebar.test.tsx` (RTL) — presença/absência dos links de catálogo conforme `canAccessMeiArea`, `href` e estado ativo por rota. **`Header.tsx` (viewport `md:hidden`):** atalhos textuais “Mei Infinito”, “Catálogo clientes”, “Catálogo serviços” quando `canAccessMeiArea`, para paridade com sidebar desktop (nota mobile do QA).

### File List (implementação)

- `frontend/src/Layout/Sidebar.tsx`
- `frontend/src/Layout/Sidebar.test.tsx`
- `frontend/src/Layout/Header.tsx`
- `frontend/src/App.tsx` (verificado; sem alteração necessária)
- `frontend/src/App.mei-gate.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/pages/GuidesMei.nfse-catalog-refetch.test.tsx`

### Debug Log References

- `cd frontend && npm run typecheck` — OK.
- `cd frontend && npm test` — **189** pass (inclui `Sidebar.test.tsx`).
- `cd frontend && npm run lint` — 0 erros (warnings pré-existentes noutros ficheiros).

### Change Log

| Data | Nota |
|------|------|
| 2026-03-30 | Story criada pelo SM (River) a partir do PRD e da spec UX. |
| 2026-03-30 | Sidebar catálogo, refetch catálogo NFS-e, links emissão, testes gate + refetch; Ready for Review. |
| 2026-03-30 | Pós-QA: testes RTL `Sidebar.test.tsx`; atalhos MEI/catálogo no header mobile (`Header.tsx`). |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-03-30  
**Decisão de gate:** **CONCERNS (aprovável)** — implementação e testes automáticos alinhados à story; **DoD** pede QA manual spec §12 (itens 1, 5 e 6) **não** executado nesta revisão estática; **CodeRabbit** não evidenciado.

### Evidência executada (repo)

- `cd frontend && npm run typecheck` — OK (reexecução na revisão).
- `cd frontend && npm test` — **184** testes passam, incluindo:
  - `App.mei-gate.test.tsx` — `usuario` + `mei=false` → redirect `/mei-catalogo/clientes` e `/mei-catalogo/servicos-produtos`; `mei=true` → acesso; **superadmin** / **admin** com `mei=false` → acesso às duas rotas (paridade com `/guias-mei`).
  - `GuidesMei.nfse-catalog-refetch.test.tsx` — após DAS → NFS-e, incremento de chamadas a `listarCatalogoNfseClientes` / `listarCatalogoNfseProdutos` (refetch ao separador).
- `npm run lint` — 0 erros ESLint no pacote `frontend` (warnings pré-existentes noutros ficheiros).

### Rastreabilidade critérios de aceite → implementação / testes

| Critério | Verificação |
|----------|-------------|
| **FR-CAT-01** — duas entradas no menu só com `canAccessMeiArea` | `Sidebar.tsx`: após “Mei Infinito”, rotas `/mei-catalogo/clientes` e `/mei-catalogo/servicos-produtos` com ícones `Users` e `Package`; mesmo predicado `canAccessMeiArea` que `/guias-mei`. |
| **Guard** — URL direta bloqueada | `App.tsx` + testes: `Navigate to="/"` quando `!canAccessMeiArea`, espelhando `/guias-mei`. |
| **Testes** `App.mei-gate.test.tsx` | Casos existentes + novos superadmin/admin nas rotas de catálogo. |
| **FR-CAT-07** — sem F5 obrigatório | `GuidesMei.tsx`: refetch em (1) mount via `loadNfseCatalog`; (2) transição para workspace `nfse`; (3) `visibilitychange` + `activeWorkspace === 'nfse'`. Dev Agent Record documenta checklist E2E manual. |
| **Sidebar ativo** em `/mei-catalogo/...` | `isActive('/guias-mei')` com pathname **exato**; demais rotas com match exato ou prefixo `path/` — evita realçar “Mei Infinito” no catálogo. |
| **Opcional §3.3** | Zona emissão: links “Gerir clientes” / “Gerir serviços e produtos”. Páginas dedicadas já tinham “Voltar ao Mei Infinito” (CAT-MEI-03/04); alinhado ao opcional. |

### Observações (não bloqueantes)

- **NFR-CAT-02:** refetch não está ligado a cada render; acoplado a mount, troca de tab para NFS-e e visibilidade — adequado.
- **Cobertura de teste:** não há teste RTL dedicado ao `Sidebar` (`isActive` / presença dos dois links); risco baixo dado `canAccessMeiArea` espelhado com `App` e código legível.
- **Mobile:** entradas novas seguem o sidebar `md:flex`; utilizadores só em viewport estreita continuam a depender de outros caminhos (ex. hero em `GuidesMei`, URLs diretas) — aceitável se a spec §3.2 assumir menu lateral desktop; validar no §12 manual.
- **DoD / CodeRabbit:** fechar checklist §12 em ambiente real e, se política do projeto exigir, passagem CodeRabbit (WSL).

### Resumo

Navegação, guards e integração FR-CAT-07 estão **coerentes** com o texto da story e com **NFR-CAT-02**. **Aprovável para merge** após confirmação manual DoD §12 (ou waiver registado) e política de revisão automática satisfeita.
