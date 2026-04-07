# Story — FR-ERR-P0-D: Migração P0 — transações, catálogos MEI, banner global, definições/sessão

**ID:** STORY-FR-ERR-P0-D  
**Prioridade:** P0  
**Depende de:** [story-fr-err-p0-b-user-facing-error-core-mapeadores.md](./story-fr-err-p0-b-user-facing-error-core-mapeadores.md); [story-fr-err-p0-c-fiscal-adapter-guiamei-alertas.md](./story-fr-err-p0-c-fiscal-adapter-guiamei-alertas.md) (se erros fiscais embutidos em catálogo partilharem adapter — coordenar com @dev)  
**Fonte:** `docs/prd/PRD-mensagens-erro-ux-usuario-final-2026-04-07.md` (**FR-ERR-B03**, **FR-ERR-B04**, **FR-ERR-B05**, cobertura PRD §10)  
**UX:** `docs/specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md` §10.1, §9  
**Arquitetura:** `docs/technical/architecture-mensagens-erro-ux-usuario-final-2026-04-07.md` §5.2 *wrappers*, fase **B3**

## User story

**Como** utilizador do núcleo financeiro e dos catálogos MEI,  
**quero** mensagens de falha consistentes (título + orientação + tentar novamente quando fizer sentido),  
**para** recuperar de rede ou erros de API sem mensagens cruas ou genéricas isoladas.

## Contexto técnico

- Migrar **todos** os *call sites* P0 listados no inventário **ERR-P0-A** que ainda não usam `mapUnknownErrorToUserFacing` + `UserFacingErrorBlock` (ou *wrapper*):
  - `transactionStore` / páginas de transações — substituir `getErrorMessage`→UI directa por mapeamento + copy canónica (**FR-ERR-B04**).
  - `MeiCatalogoClienteModal`, `MeiCatalogoProdutoModal`, `MeiCatalogoClientes`, `MeiCatalogoServicosProdutos` — erros de gravação/rede (**FR-ERR-B03**); reutilizar mapeamento fiscal **apenas** onde o erro for Plugnotas; caso contrário mapeador genérico.
  - `FetchErrorBanner` e equivalentes em listas — harmonizar com `variant: page_banner` (se ainda não feito em ERR-P0-B).
  - Toasts que hoje mostram só `Error.message` técnico — reduzir a resumo + manter detalhe noutra superfície se texto longo (UX §4.3).
- **FR-ERR-B05:** alinhar mensagens 401/403 / sessão em **Definições** (e rotas afins) com a mesma copy canónica `sessao` / `permissao` que o núcleo — evitar duplicação divergente (re-export ou função partilhada).
- Actualizar inventário **ERR-P0-A** com coluna “Estado: Feito” por linha (PRD critério release §12).

## Critérios de aceite

- [ ] 100% das linhas P0 do inventário marcadas **Feito** ou **N/A** justificado.
- [ ] Fluxo transações: erro de carregamento cumpre exemplo UX §10.1 (título + descrição + retry se aplicável).
- [ ] Catálogos MEI: falha de rede ou API com estrutura §4.1 da spec UX.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` verdes.

## Fora de escopo

- Rotas P1 do *shell* (orçamentos, agenda) salvo capacidade extra — registar no inventário como P1.  
- **FR-ERR-B08** analytics (**STORY-FR-ERR-P2**).

## File list (checklist implementação)

- [x] `frontend/src/store/transactionStore.ts`
- [x] `frontend/src/pages/Transacoes.tsx` (ou equivalente)
- [x] `frontend/src/components/MeiCatalogoClienteModal.tsx`
- [x] `frontend/src/components/MeiCatalogoProdutoModal.tsx`
- [x] `frontend/src/pages/MeiCatalogoClientes.tsx`
- [x] `frontend/src/pages/MeiCatalogoServicosProdutos.tsx`
- [x] `frontend/src/pages/Settings.tsx` (ou subrotas sessão/erro)
- [x] `docs/ux-audit/inventario-erros-utilizador-final-2026-04-07.md` (actualização estado)
- [x] Testes de página/store afectados

## Definition of Done

- QA regressão: smoke nos fluxos MEI catálogo + transações + settings.  
- Inventário actualizado no mesmo PR ou follow-up imediato.

## Qualidade / CodeRabbit

- Evitar duplicar strings de copy fora de `userErrorCopy.ts` (**NFR-ERR-04**).  
- Garantir que toasts não são o único destino para erros com texto > 300 chars de provedor (já coberto em ERR-P0-C para fiscal; aqui validar ausência de regressão).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor Agent (implementação)

### Completion Notes List

- Transações: `FetchErrorBanner` com `error={transactionsError}` e `surfaceId="transacoes.list"`; modais Nova/Excluir separam validação local (`string`) de erro API (`unknown`) com `UserFacingErrorBlock`; recorrências na mesma página usam `recSaveApiError` + toasts com `userFacingToastSummary`.
- **Follow-up QA (2026-04-07):** `EditarTransacaoModal` — erro de API não fecha o modal; `UserFacingErrorBlock` + `userFacingToastSummary`; checklist topo da story marcado; inventário §7 com ERR-INV-001–007 **Feito (P0-C)**.
- Catálogo MEI: `mapMeiCatalogApiErrorToUserFacing` + teste unitário; testes de página/modal ajustados a múltiplos `role="alert"` e formato de toast canónico.
- Inventário §7 actualizado com estado **Feito** / **N/A** / **Feito (P0-C)** para linhas P0.

### File List (implementação)

- `frontend/src/pages/Transactions.tsx`
- `frontend/src/lib/mapMeiCatalogApiErrorToUserFacing.ts` (pré-existente; coberto por teste novo)
- `frontend/src/lib/mapMeiCatalogApiErrorToUserFacing.test.ts`
- `frontend/src/components/MeiCatalogoClienteModal.test.tsx`
- `frontend/src/components/MeiCatalogoProdutoModal.test.tsx`
- `frontend/src/pages/MeiCatalogoClientes.test.tsx`
- `frontend/src/pages/MeiCatalogoServicosProdutos.test.tsx`
- `docs/ux-audit/inventario-erros-utilizador-final-2026-04-07.md` (secção 7)

### Debug Log References

—

### Change Log

- **2026-04-07** — Story criada (SM): migração P0 restante + B05.
- **2026-04-07** — Implementação P0-D: `Transactions` + testes MEI + inventário §7; gates `lint` / `typecheck` / `npm test` verdes na sessão.
- **2026-04-07** — Correcções pós-QA: §7 com 001–007; checklist implementação; edição de transação com surfacing de erro (FR-ERR alinhado).

---

## QA Results

### Revisão — 2026-04-07 (Quinn / QA)

**Decisão de gate:** **PASS (com ressalvas)** — implementação alinhada ao âmbito da story e aos padrões FR-ERR-P0-B/D; ressalvas são de rastreio documental e smoke manual, não bloqueantes para merge após @dev fechar os itens abaixo se o PO concordar.

---

#### Rastreio aos critérios de aceite

| Critério | Verificação | Evidência |
|----------|-------------|-----------|
| Inventário P0 **Feito** / **N/A** | **Parcial documental** | `docs/ux-audit/inventario-erros-utilizador-final-2026-04-07.md` **§7** lista explicitamente ERR-INV-008–016, 019, 022 e N/A para 025–026, 028. As linhas **ERR-INV-001–007** (Guia MEI) não constam na §7; pelo âmbito da story (transações, catálogos MEI, banners núcleo, settings) assumem-se **cobertas por STORY-FR-ERR-P0-C**. **Recomendação:** se o critério “100% P0” for lido literalmente sobre **todas** as linhas da matriz §1, acrescentar na §7 uma linha por ID 001–007 com **Feito (P0-C)** ou cruzar com a story C no PR. |
| Transações — UX §10.1 (título + descrição + retry) | **OK** | `Transactions.tsx`: `FetchErrorBanner` com `error={transactionsError}`, `surfaceId="transacoes.list"`, `onRetry` → `fetchTransactions()`. Erros em modais via `UserFacingErrorBlock` + `mapUnknownErrorToUserFacing` (`modal_body`). |
| Catálogos MEI — estrutura UX §4.1 | **OK** | Modais com `mapMeiCatalogApiErrorToUserFacing` + `UserFacingErrorBlock`; listas com `FetchErrorBanner` + `userFacingToastSummary` em fluxos de mutação (páginas e testes actualizados). |
| `npm run lint`, `typecheck`, `test` | **OK** | Corridos na sessão de QA: `npm test` exit 0; lint/typecheck sem erros (avisos ESLint pré-existentes noutros ficheiros, não introduzidos por esta story). |

---

#### Verificações adicionais (NFR / DoD)

| Tema | Resultado |
|------|-----------|
| **FR-ERR-B05 (Settings)** | `Settings.tsx`: estado `error: unknown`, `FetchErrorBanner` com `error` + `surfaceId="settings.profile"` — alinhado ao mapper canónico. |
| **transactionStore (FR-ERR-B04)** | `error: unknown | null`; `SESSION_ERROR` documentado; sem `getErrorMessage` no store para consumo directo pela UI. |
| **Toasts vs detalhe longo** | Toasts usam `userFacingToastSummary`; erros API em modais/banners com bloco estruturado — consistente com NFR da story. |
| **DoD — smoke manual** | Não há evidência automatizada de E2E nesta revisão. **Recomendação:** smoke manual rápido: `/transacoes` (banner + nova transação falhada simulada se possível), `/mei-catalogo/clientes` e `/servicos-produtos`, `/settings` (guardar perfil com erro de rede). |
| **Checklist “File list” no topo da story** | As caixas em §“File list (checklist implementação)” **permanecem por marcar**; o **Dev Agent Record** lista ficheiros tocados. **Recomendação @dev:** marcar o checklist do topo para paridade com o DoD de rastreio (fora do âmbito de edição QA). |
| **CodeRabbit** | Não executado nesta revisão. Opcional antes do merge conforme workflow do projeto. |

---

#### Riscos residuais (baixos)

1. **Editar transação** (`handleSaveEditTransacao`): falhas de API podem não surfacing na UI além de `console.error` — pré-existente / fora do escopo explícito P0-D; considerar backlog se UX exigir paridade com “nova”.  
2. **Superfícies P1** (`Orcamentos`, `DreBudgetPanel`, `Agenda`) ainda com `FetchErrorBanner message={...}` — coerente com “Fora de escopo” da story.

---

**Assinatura:** QA — revisão estática + testes automatizados; smoke manual e §7 completa com 001–007 ficam como follow-up leve se PO exigir fecho literal do critério “100% P0” na mesma tabela.
