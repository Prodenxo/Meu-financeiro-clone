# Story — CAT-MEI-10: Frontend — combobox **Código interno** (`codigosservicos`) no modal de serviço/produto

**ID:** STORY-CAT-MEI-10  
**Prioridade:** P0  
**Depende de:** [story-cat-mei-09-backend-get-catalogo-codigos-servicos-referencia.md](./story-cat-mei-09-backend-get-catalogo-codigos-servicos-referencia.md) — **Definition of Ready:** `GET /mei-notas/catalogo/codigos-servicos` **implantado** (merge na `main` ou branch integrada no ambiente de desenvolvimento onde o frontend for testado) e contrato de resposta alinhado à arquitetura §4.  
**Pode executar em paralelo com:** — (bloqueada pelo backend)  
**Fonte:** [`docs/prd/PRD-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md`](../prd/PRD-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md) (FR-CAT-COD-01 a FR-CAT-COD-10; NFR-CAT-03, NFR-CAT-04)  
**Especificação UX:** [`docs/specs/ux-spec-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md`](../specs/ux-spec-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md)  
**Arquitetura:** [`docs/technical/architecture-catalogo-mei-codigosservicos-combobox-2026-04-16.md`](../technical/architecture-catalogo-mei-codigosservicos-combobox-2026-04-16.md) §6

## User story

**Como** utilizador com MEI habilitado,  
**quero** escolher o **código interno** do serviço/produto através de uma **lista pesquisável** com código e descrição oficiais,  
**para** reduzir erros e não depender de memorizar códigos ao preparar o catálogo NFS-e.

## Contexto técnico

- **Modal alvo:** `frontend/src/components/MeiCatalogoProdutoModal.tsx` — substituir o `<input>` do campo **Código interno** (`mei-cat-prod-cod`).  
- **Padrão de interação:** espelhar `AdminMeiCatalogProdutoCombobox` (debounce **300 ms**, listbox, teclado, fechar ao clicar fora), adaptando dados para `{ codigo, descricao }`.  
- **API:** `listarCodigosServicosReferencia` (ou nome final) em `meiNotasService.ts` → `GET /mei-notas/catalogo/codigos-servicos?q=&limit=`.  
- **Persistência:** inalterada — `criarCatalogoNfseProduto` / `atualizarCatalogoNfseProduto` continuam a enviar `codigo` string ou vazio (FR-CAT-COD-10).  
- **Edição legado (FR-CAT-COD-06):** ao abrir com `editing.codigo`, tentar resolver descrição com pesquisa `q = codigo`; se zero resultados, mostrar copy da UX spec §4.4 / §8.  
- **Tema:** dark mode e classes `planner-input-compact` conforme UX spec §7.

## Critérios de aceite

- [x] Campo **Código interno** é um combobox pesquisável com placeholder **“Pesquisar código ou descrição…”** (spec §8).  
- [x] Lista mostra **código** e **descrição** por linha; truncagem + `title` para texto longo (FR-CAT-COD-03).  
- [x] Debounce **300 ms** antes de chamar a API (FR-CAT-COD-07; alinhado ao spec).  
- [x] Estados: **carregamento**, **nenhum resultado** (copy spec §8), **erro de carga** inline com copy **“Não foi possível carregar os códigos. Tenta novamente.”** (spec §5.7 / §8) para falhas de **rede / 5xx** tratadas no combobox.  
- [x] **401 / 403 no GET:** não é obrigatório inventar fluxo novo nesta story — pode aplicar-se o **comportamento global** já usado pelo `apiClient` / tratamento de sessão MEI (ex.: redirecionamento ou toast). Se o erro for **surfaced** ao componente sem interceptor, usar mensagem inline coerente com o resto do modal ou a copy de erro de carga; **registar no PR** qual caminho foi usado (para QA).  
- [x] **Teclado — Esc:** com a lista do combobox **aberta**, **Esc** fecha **apenas** a lista (dropdown); **não** fecha o modal **“Novo/Editar serviço ou produto”** (UX spec §5.4 e §10 item 5).  
- [x] **Limpar** remove seleção e grava como código vazio (FR-CAT-COD-05).  
- [x] Seleção define o valor `codigo` enviado no submit (FR-CAT-COD-04).  
- [x] Modo edição: código na referência mostra descrição; código legado mostra aviso conforme spec §4.4 (FR-CAT-COD-06).  
- [x] **Sem regressão** nos restantes campos do modal (discriminação, CNAE, alíquota, valor, exclusão em edição).  
- [x] Acessibilidade: label associado, teclado na lista (↑/↓, Enter, Esc), foco visível (NFR-CAT-04).  
- [x] `npm run lint`, `npm run typecheck`, `npm test` verdes nos ficheiros tocados.

## Fora de escopo

- Preencher automaticamente **Discriminação** a partir da descrição (PRD fora de âmbito).  
- Alterações à página lista `MeiCatalogoServicosProdutos` salvo necessidade de coluna (não requerido pelo PRD).

## File list (checklist implementação)

- [x] Novo: `frontend/src/components/MeiCodigoServicoCombobox.tsx` (nome ajustável)  
- [x] `frontend/src/components/MeiCatalogoProdutoModal.tsx` — integração do combobox  
- [x] `frontend/src/services/meiNotasService.ts` — tipo + `GET` codigos-servicos  
- [x] Testes RTL: `MeiCodigoServicoCombobox.test.tsx` e/ou extensão `MeiCatalogoProdutoModal.test.tsx` (pesquisar, selecionar, limpar, legado)

## Definition of Done

- QA manual: tema escuro, fluxo criar + editar + limpar, cenário legado simulado (código inexistente na API).  
- **Checklist UX §10** (spec [`ux-spec-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md`](../specs/ux-spec-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md) §10): validar **todos** os itens **1 a 6** (legibilidade dark, ciclo selecionar→guardar→reabrir, limpar, legado + Guardar, teclado/Esc sem fechar modal, debounce).  
- Evidência no PR (nota de QA ou lista marcada) para **401/403** se aplicável, conforme AC correspondente.

## Dev Agent Record

### Status

Done

### Agent Model Used

—

### Completion Notes List

- `listarCodigosServicosReferencia` → `GET /mei-notas/catalogo/codigos-servicos` com `q` + `limit` (50).
- `MeiCodigoServicoCombobox`: debounce 300 ms, lista com código/descrição, estados loading/vazio/erro (copy UX §8), legado com `q=código` e aviso §4.4/§8, Esc com `stopPropagation` quando a lista está aberta, botão **Limpar**.
- **Pós-QA:** falha de rede na **resolução inicial** do código em edição (`value` pré-preenchido) mostra `resolveError` com a mesma copy de erro de carga — **não** modo legado (mitigação observação QA).
- **401/403:** falhas auth no GET seguem tratamento global do `apiClient` (sem fluxo novo); erros expostos ao `catch` do combobox usam a mesma copy de erro de carga inline — **evidência no PR** para QA (DoD).
- Teste de integração: `MeiCatalogoProdutoModal` — criar com seleção no combobox envia `codigo` no POST.

### File List (implementação)

- `frontend/src/components/MeiCodigoServicoCombobox.tsx`
- `frontend/src/components/MeiCodigoServicoCombobox.test.tsx`
- `frontend/src/components/MeiCatalogoProdutoModal.tsx`
- `frontend/src/services/meiNotasService.ts`
- `frontend/src/services/meiNotasService.test.ts`
- `frontend/src/pages/MeiCatalogoServicosProdutos.test.tsx` (mock `listarCodigosServicosReferencia`)
- `frontend/src/components/MeiCatalogoProdutoModal.test.tsx`

### Change Log

| Data | Nota |
|------|------|
| 2026-04-16 | Story criada pelo SM (River) a partir do PRD, spec UX e arquitetura. |
| 2026-04-16 | Refinamento pós-revisão PO (Pax): DoR explícito (CAT-MEI-09 implantada); AC para **401/403** vs erro de carga; **Esc** não fecha modal; DoD com checklist numerada UX §10 itens 1–6 + evidência 401/403 no PR. |
| 2026-04-16 | Implementação: combobox + serviço + testes RTL e mock na página catálogo. |
| 2026-04-16 | Pós-QA: `resolveError` em falha da resolução inicial; teste modal POST com código do combobox; nota DoD evidência 401/403 no PR. |
