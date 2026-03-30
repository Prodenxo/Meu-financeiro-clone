# Story — CAT-MEI-04: Frontend — página Serviços e produtos do catálogo NFS-e (lista, busca, criar, editar)

**ID:** STORY-CAT-MEI-04  
**Prioridade:** P0  
**Depende de:** [story-cat-mei-02-backend-post-patch-catalogo.md](./story-cat-mei-02-backend-post-patch-catalogo.md)  
**Pode executar em paralelo com:** [story-cat-mei-03-frontend-pagina-clientes-catalogo.md](./story-cat-mei-03-frontend-pagina-clientes-catalogo.md) (após backend estável)  
**Fonte:** `docs/prd/PRD-catalogo-clientes-servicos-produtos-mei-2026-03-30.md` (FR-CAT-05, FR-CAT-06, FR-CAT-08)  
**Especificação UX:** `docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md` §3.1, §5.2, §6, §7.2, §8, §9

## User story

**Como** utilizador com acesso à área MEI,  
**quero** uma página dedicada para **ver**, **pesquisar**, **criar** e **editar** serviços/produtos do catálogo NFS-e,  
**para** reutilizar itens com discriminação, CNAE, alíquota e valor sugerido sem reintroduzir tudo em cada nota.

## Contexto técnico

- **Contrato canónico (spike CAT-MEI-01):** [`docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md`](../technical/catalogo-mei-persistencia-e-api-2026-03-30.md) — payloads, `dedupe_key` (ex. `manual:{uuid}` no POST), matriz §6 e REST alinhados ao CAT-MEI-02.
- **Rota (spec):** `/mei-catalogo/servicos-produtos`.
- **Tipos:** `NfseCatalogProduto` em `meiNotasService.ts` — alinhar campos do formulário ao contrato CAT-MEI-02.
- **Padrão de UI:** espelhar estrutura da story **CAT-MEI-03** (lista, debounce, modal, toasts, empty states) para **consistência** e revisão mais rápida (CR-CAT-03).
- **Campos UX:** discriminação (obrigatória MVP conforme spec), CNAE, alíquota, valor sugerido, código interno — obrigatoriedade final conforme spike/backend.
- **Mobile:** tabela → cartões empilhados (spec §5.3).

## Critérios de aceite

- [ ] Lista com colunas/resumo conforme spec §5.2 (discriminação resumida, CNAE, alíquota, valor sugerido, código quando existir).
- [ ] Busca com debounce **300 ms** usando `listarCatalogoNfseProdutos` com `q` / `limit`.
- [ ] **Novo item** e **Editar** com modal; persistência via API CAT-MEI-02; toasts e atualização de lista como em CAT-MEI-03.
- [ ] Validações de formulário alinhadas ao backend (mensagens claras).
- [ ] Sem exclusão no MVP.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` verdes nos ficheiros tocados.

## Fora de escopo

- Página de clientes (CAT-MEI-03).  
- Navegação global e gates (CAT-MEI-05).  
- Importação CSV.

## File list (checklist implementação)

- [ ] Novo: `frontend/src/pages/MeiCatalogoServicosProdutos.tsx` (nome ajustável)
- [ ] Modal: `MeiCatalogoProdutoModal.tsx` (ou partilhar base com clientes se abstração justificada)
- [ ] `frontend/src/services/meiNotasService.ts` (métodos POST/PATCH produtos)
- [ ] `frontend/src/App.tsx` — rota (coordenação com CAT-MEI-05)

## Definition of Done

- QA manual espelhando cenários de CAT-MEI-03 para produtos.  
- Confirmar formatação monetária pt-BR em **valor sugerido** (visualização e input, conforme padrão do projeto).

## Qualidade / CodeRabbit

- Extrair componente partilhado (ex.: `CatalogSearchBar`) **só** se CAT-MEI-03 e 04 duplicarem > ~40 linhas idênticas; caso contrário duplicação aceitável no MVP.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- Rota `/mei-catalogo/servicos-produtos` com o mesmo gate que `/guias-mei` (`canAccessMeiArea` em `App.tsx`).
- `meiNotasService`: `criarCatalogoNfseProduto`, `atualizarCatalogoNfseProduto` (POST/PATCH alinhados ao CAT-MEI-02).
- `MeiCatalogoServicosProdutos.tsx`: lista (tabela desktop + cartões `md:hidden`), busca debounce 300 ms, `listarCatalogoNfseProdutos` com `q`/`limit`, estados vazio com/sem query, sem exclusão.
- `MeiCatalogoProdutoModal.tsx`: criar/editar, discriminação obrigatória, CNAE/código/alíquota/valor sugerido opcionais; valor com entrada em centavos pt-BR; erros API com `role="alert"` e `<details>` técnico.
- `formatMoneyPtBr.ts`: formatação/exibição monetária pt-BR reutilizável.
- Link “Serviços e produtos (NFS-e)” no hero do `GuidesMei` junto ao catálogo de clientes quando `canViewNfse`.
- Testes: `meiNotasService.test.ts` (criar/atualizar produto), `App.mei-gate.test.tsx` (redirect/acesso rota nova), RTL para página e modal, `formatMoneyPtBr.test.ts`.
- **Pós-QA (observações Quinn):** RTL extra em `MeiCatalogoProdutoModal.test.tsx` — alíquota inválida não chama API; edição com campo valor limpo envia `valor_sugerido: null` no PATCH. **CodeRabbit:** não executado aqui — WSL indisponível neste ambiente (`wsl` reporta subsistema não instalado); executar noutra máquina ou após instalar WSL + CLI. **DoD manual** (dark/teclado/cenários espelhados CAT-MEI-03) continua checklist humano.

### File List (implementação)

- `frontend/src/lib/formatMoneyPtBr.ts`
- `frontend/src/lib/formatMoneyPtBr.test.ts`
- `frontend/src/services/meiNotasService.ts`
- `frontend/src/services/meiNotasService.test.ts`
- `frontend/src/components/MeiCatalogoProdutoModal.tsx`
- `frontend/src/components/MeiCatalogoProdutoModal.test.tsx`
- `frontend/src/pages/MeiCatalogoServicosProdutos.tsx`
- `frontend/src/pages/MeiCatalogoServicosProdutos.test.tsx`
- `frontend/src/App.tsx`
- `frontend/src/App.mei-gate.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`

### Debug Log References

- `cd frontend && npm run typecheck` — OK.
- `cd frontend && npm test` — **181** pass (incl. RTL pós-QA no modal de produto).
- `cd frontend && npm run lint` — 0 erros (warnings pré-existentes noutros ficheiros).
- CodeRabbit (WSL): não corrido — ambiente sem WSL; ver nota em Completion Notes.

### Change Log

| Data | Nota |
|------|------|
| 2026-03-30 | Story criada pelo SM (River) a partir do PRD e da spec UX. |
| 2026-03-30 | Implementação catálogo serviços/produtos NFS-e + serviço + testes; status Ready for Review. |
| 2026-03-30 | Resposta ao QA: testes RTL alíquota inválida + PATCH `valor_sugerido` null; registo CodeRabbit/WSL. |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-03-30  
**Decisão de gate:** **CONCERNS (aprovável)** — implementação e gates automáticos OK; **DoD manual** (cenários espelhados + valor pt-BR em browser real) e **CodeRabbit** não evidenciados nesta revisão

### Evidência executada (repo)

- `cd frontend && npm run typecheck` — OK (reexecução na revisão).
- `cd frontend && npm test` — **179** testes passam, incluindo:
  - `meiNotasService.test.ts` — POST/PATCH `/catalogo/produtos` (corpo e codificação de `id`).
  - `App.mei-gate.test.tsx` — redirect `/mei-catalogo/servicos-produtos` quando `mei=false` e acesso quando `mei=true`.
  - `MeiCatalogoServicosProdutos.test.tsx` — lista, debounce com `q`, fluxo “Novo item” → `criarCatalogoNfseProduto` + toast + re-listagem.
  - `MeiCatalogoProdutoModal.test.tsx` — validação discriminação vazia, criar, erro API `role="alert"`, edição com PATCH.
  - `formatMoneyPtBr.test.ts` — centavos / parse / `formatBrlDisplay`.
- `npm run lint` — sem erros ESLint (warnings pré-existentes noutros ficheiros; nenhum bloqueio atribuível a CAT-MEI-04).

### Rastreabilidade critérios de aceite → implementação / testes

| Critério | Verificação |
|----------|-------------|
| Lista §5.2 (discriminação resumida, CNAE, alíquota, valor sugerido, código) | `MeiCatalogoServicosProdutos.tsx` — tabela desktop + cartões `md:hidden`; `summarizeDiscriminacao`; `formatBrlDisplay` / `formatAliquotaLista`; coluna código. |
| Busca debounce 300 ms + `listarCatalogoNfseProdutos` com `q` / `limit` | `SEARCH_DEBOUNCE_MS = 300`, `LIST_LIMIT = 50`, `documentType: 'NFSE'`; teste de debounce na página. |
| Novo item / Editar, modal, API, toast, atualizar lista | Padrão CAT-MEI-03; `MeiCatalogoProdutoModal` + `handleSaved`; testes página/modal. |
| Validações alinhadas ao backend + mensagens claras | Discriminação obrigatória (espelha `discriminacao é obrigatória`); alíquota e valor com validação local; erros API com mensagem + detalhe técnico. |
| Sem exclusão MVP | Nenhuma ação de remoção na UI. |
| Lint / typecheck / testes | Conforme evidência acima. |

### Observações (não bloqueantes)

- **DoD manual** (espelhar cenários CAT-MEI-03 em produtos, dark mode, teclado no modal): não coberto por testes automatizados; recomenda-se checklist manual antes de merge.
- **CodeRabbit (WSL):** não executado nesta revisão; opcional como reforço pré-merge.
- **Cobertura RTL:** não há caso explícito para alíquota inválida ou limpeza de valor no PATCH; risco baixo dado espelho com clientes e validação no serviço.
- **Duplicação UI** barra de pesquisa vs CAT-MEI-03: dentro do aceitável para MVP (story §Qualidade).

### Resumo

Implementação coerente com o contrato CAT-MEI-02 no cliente, paridade de UX com CAT-MEI-03 e boa cobertura de testes no frontend. **Aprovável para merge** após fecho do DoD manual (ou registo explícito de waiver) e, se política do projeto exigir, CodeRabbit sem CRITICAL/HIGH.
