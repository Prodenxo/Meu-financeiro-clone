# Story — CAT-MEI-03: Frontend — página Clientes do catálogo NFS-e (lista, busca, criar, editar)

**ID:** STORY-CAT-MEI-03  
**Prioridade:** P0  
**Depende de:** [story-cat-mei-02-backend-post-patch-catalogo.md](./story-cat-mei-02-backend-post-patch-catalogo.md)  
**Fonte:** `docs/prd/PRD-catalogo-clientes-servicos-produtos-mei-2026-03-30.md` (FR-CAT-02, FR-CAT-03, FR-CAT-04, FR-CAT-08)  
**Especificação UX:** `docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md` §3.1, §5.1, §6, §7.1, §8, §9

## User story

**Como** utilizador com acesso à área MEI,  
**quero** uma página dedicada para **ver**, **pesquisar**, **criar** e **editar** clientes do catálogo usados na NFS-e,  
**para** manter tomadores corretos sem depender apenas do formulário de emissão.

## Contexto técnico

- **Contrato canónico (spike CAT-MEI-01):** [`docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`](../technical/catalogo-mei-persistencia-e-api-2026-03-30.md) — payloads, `dedupe_key`, matriz de campos e REST alinhados ao CAT-MEI-02.
- **Rota (spec):** `/mei-catalogo/clientes` — confirmar com CAT-MEI-01/02 se o prefixo final coincide.
- **Padrões:** `PageShell`, `PageTitle`, lista + modal semelhante a `Recorrencias.tsx` (`RecorrenciaModal` como referência de comportamento).
- **API:** funções em `frontend/src/services/meiNotasService.ts` (ou `meiCatalogService.ts` se criado) — listar (GET existente), criar/editar (novos métodos alinhados ao CAT-MEI-02).
- **Busca:** debounce **300 ms**, parâmetros `q` / `limit` como hoje em `listarCatalogoNfseClientes`.
- **Validação cliente:** nome obrigatório, documento CPF/CNPJ, e-mail opcional com formato válido (spec §7.1).
- **Acessibilidade:** labels, `aria-describedby` em erros, foco no primeiro campo com erro (NFR-CAT-03).
- **Guard de rota:** implementação na story **CAT-MEI-05** pode anteceder ou acompanhar; esta story assume que a rota só é alcançável com `canAccessMeiArea` **ou** inclui redirect temporário igual a `/guias-mei` até CAT-MEI-05 fechar (escolher uma abordagem no PR e não deixar buraco de segurança).

## Critérios de aceite

- [ ] Página exibe **lista** de clientes com colunas alinhadas à spec (nome/razão social, documento formatado pt-BR, e-mail, ação Editar).
- [ ] Campo de **pesquisa** com debounce; estado vazio com query vs sem query conforme spec §6.2–6.3.
- [ ] Botão **Novo cliente** abre modal; **Guardar** chama API de criação; sucesso fecha modal, `toast.success`, lista **atualiza**.
- [ ] **Editar** carrega dados no modal; **Guardar** chama PATCH; sucesso atualiza lista.
- [ ] Erros de API mostram mensagem no modal com `role="alert"` (FR-CAT-08); opcional `<details>` técnico conforme spec §6.6.
- [ ] **Sem exclusão** no MVP (sem botão eliminar).
- [ ] `npm run lint`, `npm run typecheck`, `npm test` (frontend) verdes nos ficheiros tocados.

## Fora de escopo

- Página de serviços/produtos (CAT-MEI-04).  
- Itens de menu lateral e testes de gate (CAT-MEI-05), salvo mínimo para aceder à rota em dev.  
- FR-CAT-09 (ordenar por `last_used_at`).

## File list (checklist implementação)

- [ ] Novo: `frontend/src/pages/MeiCatalogoClientes.tsx` (nome ajustável)
- [ ] `frontend/src/services/meiNotasService.ts` (ou novo serviço de catálogo)
- [ ] Componente modal dedicado (ex.: `MeiCatalogoClienteModal.tsx`) se extrair reduzir complexidade
- [ ] `frontend/src/App.tsx` — registo da rota **quando CAT-MEI-05 não a fizer sozinha** (coordenar dependências entre PRs)

## Definition of Done

- QA manual: criar cliente, editar, pesquisar, validar erros de formulário e resposta 4xx/5xx simulada se possível.  
- Verificar dark mode e teclado (checklist spec §12).

## Qualidade / CodeRabbit

- Evitar duplicar helpers de CPF/CNPJ se já existirem em `frontend/src/lib` ou serviços.  
- Não introduzir fetch por tecla na busca (NFR-CAT-02).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- Rota `/mei-catalogo/clientes` com o mesmo gate que `/guias-mei` (`canAccessMeiArea` em `App.tsx`).
- `meiNotasService`: `criarCatalogoNfseCliente`, `atualizarCatalogoNfseCliente` (POST/PATCH alinhados ao CAT-MEI-02).
- Página `MeiCatalogoClientes.tsx`: lista em tabela, busca com debounce 300 ms, estados vazio com/sem query, sem exclusão.
- `MeiCatalogoClienteModal.tsx`: criar/editar, validação cliente, erros API com `role="alert"` e `<details>` técnico; documento só leitura na edição.
- `formatCpfCnpjPtBr.ts`: formatação pt-BR reutilizável (lista + campo).
- Link “Catálogo de clientes (NFS-e)” no hero do `GuidesMei` quando `canViewNfse`; `useInRouterContext` + fallback `<a>` para testes sem `Router`.
- Testes: `meiNotasService.test.ts` (criar/atualizar), `App.mei-gate.test.tsx` (redirect e acesso com `mei=true`).
- **Pós-QA (CONCERNS):** `@testing-library/react` + `@testing-library/dom` (dev); `MeiCatalogoClienteModal.test.tsx` (validação documento, criar sucesso, erro API `role=alert`, PATCH edição); `MeiCatalogoClientes.test.tsx` (lista, debounce `q`, fluxo Novo cliente → criar → toast/refetch); `mockReset`/`cleanup` no modal para isolar mocks entre testes.

### File List (implementação)

- `frontend/package.json` (devDependencies: `@testing-library/react`, `@testing-library/dom`)
- `frontend/src/lib/formatCpfCnpjPtBr.ts`
- `frontend/src/services/meiNotasService.ts`
- `frontend/src/services/meiNotasService.test.ts`
- `frontend/src/components/MeiCatalogoClienteModal.tsx`
- `frontend/src/components/MeiCatalogoClienteModal.test.tsx`
- `frontend/src/pages/MeiCatalogoClientes.tsx`
- `frontend/src/pages/MeiCatalogoClientes.test.tsx`
- `frontend/src/App.tsx`
- `frontend/src/App.mei-gate.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`

### Debug Log References

- `cd frontend && npm run typecheck` — OK.
- `cd frontend && npm test` — **165** pass (incl. RTL catálogo clientes).
- `cd frontend && npm run lint` — sem erros novos nos ficheiros tocados (warnings pré-existentes no projeto).

### Change Log

| Data | Nota |
|------|------|
| 2026-03-30 | Story criada pelo SM (River) a partir do PRD e da spec UX. |
| 2026-03-30 | Implementação página catálogo clientes NFS-e + serviço + testes; status Ready for Review. |
| 2026-03-30 | Resposta ao QA: testes RTL página/modal + devDependencies Testing Library. |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-03-30  
**Decisão de gate:** **CONCERNS** (aprovável; reforçar cobertura e DoD manual)

### Rastreio aos critérios de aceite

| Critério | Evidência | Nota |
|----------|-----------|------|
| Lista com colunas (nome, documento pt-BR, e-mail, Editar) | `MeiCatalogoClientes.tsx`: `<table>` + `formatDocumentoListaPtBr` | OK |
| Pesquisa com debounce; vazio com/sem query | `SEARCH_DEBOUNCE_MS = 300`, `emptyWithQuery` / `emptyNoQuery` + `EmptyState` distintos | OK (NFR-CAT-02: pedido só após debounce) |
| Novo cliente → modal → POST → toast → lista atualizada | `MeiCatalogoClienteModal` + `criarCatalogoNfseCliente`; `handleSaved` → `toast.success` + `loadClientes` | OK |
| Editar → PATCH → lista atualizada | `atualizarCatalogoNfseCliente`; mesmo `handleSaved` | OK |
| Erros API no modal `role="alert"` + detalhe técnico | Bloco com `role="alert"`, `<details>` com stack; `aria-describedby` no `<form>` quando há erro de API | OK (FR-CAT-08) |
| Sem exclusão | Sem ação de remover na lista/modal | OK |
| lint / typecheck / test | `npm test` — **158** pass (reexecução 2026-03-30). Dev: typecheck OK; lint sem erros novos nos ficheiros tocados (warnings legados no repo) | OK com ressalva de lint global |

### Riscos / lacunas

- **Testes automatizados:** existem testes para **serviço** (`criar`/`atualizar` em `meiNotasService.test.ts`) e **gate de rota** (`App.mei-gate.test.tsx`). **Não** há testes RTL/Vitest para `MeiCatalogoClientes` / `MeiCatalogoClienteModal` (debounce, submissão, estados vazios). Risco **baixo** com código legível, mas regressões de UI não são capturadas na CI.
- **DoD da story:** “QA manual” (criar/editar/pesquisa/erros) e **dark mode + teclado** (spec §12) **não** foram executados nesta revisão estática; recomenda-se checklist manual antes do merge.

### NFR / segurança / acessibilidade

- **Guard:** rota `/mei-catalogo/clientes` alinhada a `canAccessMeiArea` como `/guias-mei` — sem buraco em relação ao contexto descrito na story.
- **A11y (NFR-CAT-03):** labels, `aria-invalid` / `aria-describedby` nos campos com erro de validação, foco no primeiro campo inválido; diálogo com `role="dialog"` e título associado.
- **Helpers CPF/CNPJ:** concentrados em `formatCpfCnpjPtBr.ts` — alinhado à nota de qualidade da story.

### Recomendações (não bloqueantes)

1. Acrescentar 1–2 testes Vitest + RTL: abrir modal, validação de documento inválido, e/ou simular `listarCatalogoNfseClientes` com `vi.mock` após “Guardar”.
2. Executar e registar (ou checklist) QA manual para §12 (dark mode, Tab/Enter no modal).

### Resumo

Implementação **alinhada** aos critérios funcionais e ao contrato CAT-MEI-02 no frontend; padrões de página e modal consistentes com o resto da app. **CONCERNS** deve-se sobretudo à **ausência de testes de componente/página** e ao **DoD manual** ainda por evidenciar — não a falhas óbvias na revisão de código.
