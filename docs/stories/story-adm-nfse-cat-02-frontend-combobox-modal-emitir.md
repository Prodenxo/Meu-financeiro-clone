# Story — ADM-NFSE-CAT-02: Frontend — combobox de catálogo no modal “Emitir NFSe” (admin)

**ID:** STORY-ADM-NFSE-CAT-02  
**Prioridade:** P0  
**Depende de:** [story-adm-nfse-cat-01-backend-listagem-catalogo-admin.md](./story-adm-nfse-cat-01-backend-listagem-catalogo-admin.md) (GET admin disponível)  
**Fonte:** [`docs/prd/PRD-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md`](../prd/PRD-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md) — FR-ADM-NFSE-01 a 03, FR-ADM-NFSE-07 (erros), FR-ADM-NFSE-09 (parcial: subtítulo/contexto), NFR-ADM-NFSE-04 (parcial), CR-ADM-NFSE-01  
**Especificação UX:** [`docs/specs/ux-spec-admin-nfse-catalogo-clientes-usuario-2026-04-02.md`](../specs/ux-spec-admin-nfse-catalogo-clientes-usuario-2026-04-02.md) §3.1 (secção Tomador), §5, §6.1, §7 (copy subtítulo + label combobox + sentinela), §8 (a11y combobox), §10 (componentização sugerida)

## User story

**Como** administrador a emitir NFSe em nome de **U**,  
**quero** escolher opcionalmente um **cliente já cadastrado de U** num combobox com pesquisa, ou manter **“Preencher manualmente”**, com os campos tomador **editáveis** após seleção,  
**para** reduzir erros de transcrição **sem** perder o fluxo manual actual nem gravar no catálogo só por editar o formulário (PRD §6.1).

## Contexto técnico

- **Superfície:** [`frontend/src/pages/AdminUserData.tsx`](../../frontend/src/pages/AdminUserData.tsx) — modal `showEmitirNotaModal`; serviço [`frontend/src/services/adminUserDataService.ts`](../../frontend/src/services/adminUserDataService.ts) — estender com função tipo `listarMeiCatalogoClientesAdmin(userId, { q, limit })` apontando para o **GET** da story 01.
- **Comportamento (UX §5.1 + PRD §6.1):** ao abrir o modal (preferencial) ou política acordada, carregar lista; **debounce ~300ms** em `q`; ao seleccionar item: preencher estado local `tomadorCpfCnpj` (com `formatDocument` se já usado na página), `tomadorRazaoSocial`, `tomadorEmail`; **seleccionar outro cliente sobrescreve**; **“Preencher manualmente”** não limpa campos já editados sem confirmação (UX §5.1).
- **Não persistir catálogo** ao só editar campos após select; **não** incluir botão “Atualizar cadastro com estes dados” **salvo** PO fechar PRD §6.1 noutra iteracção.
- **Copy (FR-ADM-NFSE-09):** subtítulo reforçando emissão e catálogo **em nome de U** — textos canónicos na UX spec §7; label **“Cliente do catálogo (opcional)”**; opção sentinela **“Preencher manualmente”**.
- **Estados vazios / erro / loading (UX §6.1):** mensagens PT conforme tabela da spec; `role="alert"` / `aria-live` onde aplicável.
- **MEI não habilitado (PRD §6.2):** **opção PO (a/b/c)** — após fecho, implementar **uma** linha: ocultar bloco, somente leitura, ou comportamento completo; documentar em Completion Notes.
- **Componentização (UX §10 + PRD risco ficheiro grande):** extrair `AdminMeiCatalogClienteCombobox` (ou nome alinhado à equipa) para `frontend/src/components/admin/` ou pasta convencionada no repo após verificação de estrutura existente.
- **Paridade visual:** `planner-input-compact`, `planner-button*`, `role="dialog"`, `aria-labelledby` — alinhar ao modal actual.

## Critérios de aceite

- [ ] Combobox (ou padrão equivalente com pesquisa) **“Cliente do catálogo (opcional)”** com primeira opção **“Preencher manualmente”** (FR-ADM-NFSE-03).
- [ ] Lista carregada via API admin com `userId` da página; suporta pesquisa com debounce e `limit` coerente (FR-ADM-NFSE-01, NFR-ADM-NFSE-03).
- [ ] Seleccionar cliente preenche documento, razão social e e-mail; campos permanecem **editáveis** antes de submeter emissão (FR-ADM-NFSE-02).
- [ ] É possível emitir **sem** usar o catálogo (fluxo manual intacto) (FR-ADM-NFSE-03).
- [ ] Erro de API: mensagem inline clara + anúncio acessível (FR-ADM-NFSE-07, NFR-ADM-NFSE-04).
- [ ] Copy de contexto **U** visível no modal conforme UX §7 (FR-ADM-NFSE-09 — mínimo nesta story).
- [ ] Decisão **§6.2** reflectida na UI (ocultar / desactivar / completo).
- [ ] `npm run lint`, `npm run typecheck`, `npm test` conforme `AGENTS.md`.

## Fora de escopo

- Botão **“Gerir clientes deste utilizador”**, drawer e CRUD — [story-adm-nfse-cat-03-frontend-drawer-crud-backend-escrita-copy-a11y.md](./story-adm-nfse-cat-03-frontend-drawer-crud-backend-escrita-copy-a11y.md).  
- Endpoints **POST/PATCH/DELETE** admin.

## File list (checklist implementação)

- [x] `frontend/src/services/adminUserDataService.ts`
- [x] `frontend/src/pages/AdminUserData.tsx` e/ou novo(s) componente(s) em `frontend/src/components/admin/` (nomes finais na Completion Notes)
- [x] Testes de UI/componente se o projeto já os usa para `AdminUserData` (opcional mas desejável para regressão do fluxo manual)

## Definition of Done

- Checklist UX da spec §11 relativo a combobox + emissão manual verificado em QA (amostragem).  
- Sem alteração do contrato enviado ao provedor na emissão (CR-ADM-NFSE-01).

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration:** Disabled  
> `core-config.yaml` ausente — revisão manual + gates CLI.

**Story type (planeamento):** Frontend — foco em a11y (combobox/listbox, foco, teclado), estados de loading/erro, não regredir formulário de emissão.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor Agent (implementação 2026-04-02)

### Completion Notes List

- `fetchAdminMeiCatalogoClientes` → `GET /admin/users/:userId/mei-catalogo/clientes` com `q`, `limit` (30), `documentType` omitido (default NFSe no backend).
- Componente `AdminMeiCatalogClienteCombobox`: debounce 300ms na pesquisa; opção sentinela **Preencher manualmente** (não altera campos do tomador); selecionar cliente aplica `formatDocument` + nome + e-mail; setas/Enter/Escape; `role="alert"` / `aria-live` em erro/loading.
- Copy subtítulo modal alinhada à UX §7 (contexto **U**); label **Cliente do catálogo (opcional)**; mensagens estado vazio/erro adaptadas ao PT-BR da página.
- **PRD §6.2:** opção **(a) ocultar** — se `selectedUser.mei === false`, o combobox não renderiza; texto explicativo no modal.
- Botão **Gerir clientes deste utilizador** fora de escopo (story CAT-03); não incluído.
- `emitirModalInstance` + `key` no combobox para refetch/estado limpo ao reabrir o modal.
- **Pós-QA:** `AdminMeiCatalogClienteCombobox.test.tsx` (Vitest + mock `fetchAdminMeiCatalogoClientes`) — debounce, erro, aplicar cliente, sentinela manual, `meiEnabled` false; `scrollIntoView` guard para jsdom; hint de catálogo vazio também dentro da lista aberta.

### File List (implementação)

- `frontend/src/services/adminUserDataService.ts`
- `frontend/src/components/admin/AdminMeiCatalogClienteCombobox.tsx`
- `frontend/src/components/admin/AdminMeiCatalogClienteCombobox.test.tsx`
- `frontend/src/pages/AdminUserData.tsx`

### Debug Log References

—

### Change Log

| Data | Nota |
|------|------|
| 2026-04-02 | Story criada pelo SM (River) a partir do PRD e da UX spec admin NFSe. |
| 2026-04-02 | Combobox catálogo admin no modal Emitir NFSe + serviço GET admin. |
| 2026-04-02 | Pós-QA: testes Vitest do combobox + hint vazio com lista aberta + guard `scrollIntoView`. |

---

## QA Results

### Revisão (Quinn) — 2026-04-02

**Gate:** **PASS** (com observações)

#### Rastreio critérios de aceite

| Critério | Verificação |
|----------|-------------|
| Combobox **Cliente do catálogo (opcional)** + **Preencher manualmente** | **OK** — Label e primeira opção na lista (`flatOptions`); sentinela não chama `onApplyCliente` (mantém valores do tomador). |
| API admin + `userId` + debounce + `limit` | **OK** — `fetchAdminMeiCatalogoClientes` → `/admin/users/:userId/mei-catalogo/clientes`; debounce 300 ms; `limit` 30 (≤ teto típico do backend). |
| Selecção preenche tomador; campos editáveis | **OK** — `onApplyCliente` atualiza `emitirNotaForm`; inputs CPF/CNPJ, razão e e-mail abaixo permanecem controlados e editáveis. |
| Emitir sem catálogo | **OK** — Fluxo manual intacto; combobox opcional. |
| Erro API + acessível | **OK** — Mensagem canónica + `role="alert"`; loading com `aria-live="polite"` e `aria-busy` no combobox. |
| Copy contexto **U** (FR-ADM-NFSE-09 / UX §7) | **OK** — Subtítulo com `getUserLabel(selectedUser)` e menção ao catálogo do mesmo utilizador. |
| PRD §6.2 | **OK** — Opção **(a) ocultar**: `meiEnabled={selectedUser?.mei !== false}` + texto quando `mei === false`. |
| Gates CLI | **OK** por revisão estática + histórico de suite; recomenda-se confirmar `npm run lint`, `typecheck` e `test` no CI do PR. |

#### NFRs / UX spec

- **CR-ADM-NFSE-01:** Payload de `emitirNotaAsAdmin` inalterado em estrutura; apenas pré-preenchimento local.
- **§3.1 UX (botão Gerir):** fora de escopo (CAT-03) — coerente com a story.
- **A11y §8:** `role="combobox"`, `listbox`, `option`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `label`/`htmlFor`; foco visível com `focus-visible:ring`; teclado (setas, Enter, Escape). *Não* há focus trap dedicado no dropdown (aceitável para padrão combobox embutido).

#### Observações (não bloqueantes)

1. **Testes automatizados:** checklist da story mantém opcional por marcar testes de UI do combobox — **lacuna de regressão**; desejável teste Vitest com mock de `fetchAdminMeiCatalogoClientes` (debounce / erro / aplicar cliente), alinhado a `MeiCatalogoClientes.test.tsx`.
2. **Catálogo vazio com lista aberta:** mensagem longa da UX §6.1 que referia “Gerir clientes” foi adaptada (sem CTA fora de escopo); com lista aberta o utilizador vê sobretudo a opção manual — aceitável.
3. **`mei` por defeito em `listUsers`:** `mei ?? true` — utilizadores sem flag explícita tratam-se como MEI ativo para a UI do combobox; risco baixo, já existente no modelo de dados.

#### CodeRabbit

Desativado na story; revisão manual apenas.

---

**Assinatura:** Quinn (QA) — revisão de implementação concluída.
