# Story — FR-NFSE-UX (P0): Workspace NFS-e — estrutura, empty states e cabeçalho dinâmico

**ID:** STORY-FR-NFSE-UX-P0  
**Prioridade:** P0 (Must — PRD onda 1)  
**Depende de:** Nenhuma (brownfield em `GuidesMei`)  
**Fonte:** `docs/prd/PRD-mei-nfse-workspace-ui-ux-melhoria-2026-04-01.md` (§6 FR-NFSE-UX-01, 02, 07; §10 onda P0)  
**Especificação UX:** `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md` §2, §3, §4, §5, §8.2, §3.3 (NFR-NFSE-05)

## User story

**Como** utilizador MEI com acesso a NFS-e,  
**quero** ver o separador NFS-e organizado em secções claras (“Antes de emitir”, dados da nota, lista), com orientação no topo conforme o meu estado (emitente, catálogo) e mensagens distintas quando não há notas vs quando os filtros não devolvem resultados,  
**para** perceber onde estou e qual o próximo passo sem confundir estados.

## Contexto técnico

- **Alvo:** `frontend/src/pages/GuidesMei.tsx` — painel `activeWorkspace === 'nfse'`, `id="mei-panel-nfse"`, `role="tabpanel"`.
- **FR-NFSE-UX-01:** Três blocos cognitivos com títulos visíveis e `id` estáveis para âncoras opcionais: `mei-nfse-pre`, `mei-nfse-emit`, `mei-nfse-list` (nomes podem ajustar-se desde que documentados no PR).
- **FR-NFSE-UX-07:** Uma linha dinâmica sob o título de emissão; matriz de prioridade e *copy* em spec §4.2; condições ligadas a estado existente (`nfEmissionCompanyForm`, catálogo, `nfseCatalogLoading`).
- **FR-NFSE-UX-02:** Dois *empty states* na lista: (a) `nfseList.length === 0` sem erro de API; (b) `nfseList.length > 0 && filteredNfseList.length === 0` — CTAs conforme spec §8.2 (“scroll para emitir” / “limpar filtros”).
- **§5.1 spec:** Ordem vertical na zona “Antes de emitir”: bloqueios → faixa emitente → atalhos catálogo + links → banners pré-prestador (sem alterar semântica de negócio).
- **NFR-NFSE-05 / FR-UX-MEI-01:** Cabeçalho da secção “Notas emitidas” **não** duplica o KPI de contagem do hero; usar texto neutro (spec §3.3).

## Critérios de aceite

- [x] **FR-NFSE-UX-01:** Secções A → B → C tituladas, ordem estável em mobile e desktop; `id` documentados para âncoras.
- [x] **FR-NFSE-UX-07:** Linha dinâmica única conforme matriz spec §4.2 (emitente → catálogo vazio → loading → *fallback*); sem estados inventados.
- [x] **FR-NFSE-UX-02:** Dois *empty states* distintos com CTAs §8.2.
- [x] Zona pré-formulário na ordem §5.1 da spec UX.
- [x] Cabeçalho lista sem número redundante com hero (NFR-NFSE-05).
- [x] `npm run lint`, `npm run typecheck`, `npm test` verdes nos pacotes tocados.
- [x] Testes existentes `GuidesMei.permissions.test.tsx` / `App.mei-gate.test.tsx` atualizados se *copy* ou estrutura quebrar asserções.

## Fora de escopo

- Colapsáveis do formulário e menu “Mais ações” na lista → [story-fr-nfse-ux-p1-formulario-acoes-filtros-a11y.md](./story-fr-nfse-ux-p1-formulario-acoes-filtros-a11y.md).  
- Pilha ordenada de alertas de emissão → [story-fr-nfse-ux-p2-alertas-hierarquia-tabela-opcional.md](./story-fr-nfse-ux-p2-alertas-hierarquia-tabela-opcional.md).  
- Novos endpoints ou tipos de documento.

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx` (painel NFS-e)
- [x] `frontend/src/index.css` (não alterado — sem classes novas)
- [x] `frontend/src/pages/GuidesMei.permissions.test.tsx` (não necessário — testes existentes passam)
- [x] `frontend/src/App.mei-gate.test.tsx` (não necessário)

## Definition of Done

- QA: percorrer fluxos primeira visita NFS-e, lista vazia, filtro sem resultado, utilizador com emitente pendente (mensagem correta).  
- Verificar hero + lista sem duplicação de contagem (viewport desktop com hero visível).

## Qualidade / CodeRabbit

- Evitar regressão em `canViewNfse` e handlers de emissão/lista; mudanças preferencialmente estruturais/DOM sem alterar contratos de API.  
- Manter `aria-labelledby` / `role="tabpanel"` coerentes com tab NFS-e.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- Três secções: `mei-nfse-pre` (“Antes de emitir”), `mei-nfse-emit`, `mei-nfse-list`; *link* Voltar ao Mei Infinito fora dos cartões.
- `nfseWorkspaceGuidance` (`useMemo`): prioridade emitente sem razão social → CTA Certificado e DAS; catálogo vazio (após load); `nfseCatalogLoading`; *fallback* com atalhos.
- *Hint* obrigatório de campos movido para o início da secção emit (após catálogo), ordem §5.1 na zona pré.
- Lista: vazio real vs filtro sem resultado; erro de listagem com lista vazia mostra `FiscalProviderErrorAlert` + “Tentar novamente”; `FiscalProviderErrorAlert` na secção emit só se `nfseList.length > 0` (evita duplicado).
- Subtítulo “Notas emitidas” neutro (sem contagem; remete ao resumo no topo).
- **Pós-QA (obs. 1):** teste RTL em `GuidesMei.permissions.test.tsx` — tab NFS-e → `#mei-nfse-pre|emit|list`, “Antes de emitir”, “Ainda não há notas emitidas” com `listarNfse` mock `[]`.
- **Pós-QA (obs. 2):** texto “Atualizando catálogo fiscal…” na zona pré só quando `!razaoSocial?.trim()`; com emitente identificado na UI, o estado de carregamento fica na linha dinâmica (`A atualizar catálogo fiscal…`) sem duplicar.

### File List (implementação)

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/pages/GuidesMei.permissions.test.tsx`

### Debug Log References

- `npm run lint` (frontend) — OK (0 erros; *warnings* pré-existentes noutros ficheiros).
- `npm run typecheck` (frontend) — OK.
- `npm test` (frontend, Vitest) — **241** testes passaram (2026-04-01, pós-QA).

### Change Log

- **2026-04-01** — P0 FR-NFSE-UX-01/02/07: estrutura em 3 secções, orientação dinâmica, *empty states* e NFR lista/hero.
- **2026-04-01** — Mitigação observações QA: teste secções NFS-e + *empty state*; menos duplicação de *copy* de catálogo a carregar.

---

## QA Results

**Revisor:** Quinn (QA / advisory)  
**Data:** 2026-04-01  
**Decisão de gate:** **PASS**

### Rastreio critérios → evidência

| Critério | Veredicto | Evidência |
|----------|-----------|-----------|
| **FR-NFSE-UX-01** — Secções A→B→C com `id` | **OK** | `GuidesMei.tsx`: `section id="mei-nfse-pre"` + `h2#mei-nfse-pre-heading`; `id="mei-nfse-emit"` + `h2#mei-nfse-emit-heading`; `id="mei-nfse-list"` + `h2#mei-nfse-list-heading`; `aria-labelledby` coerente; botão “Voltar ao Mei Infinito” fora dos cartões. |
| **FR-NFSE-UX-07** — Linha dinâmica | **OK** | `nfseWorkspaceGuidance` (`useMemo`): (1) sem `razaoSocial` → CTA `setActiveWorkspace('das')`; (2) `nfseCatalogLoading`; (3) catálogo vazio; (4) *fallback*. Bloco com `role="status"` / `aria-live="polite"` em volta do conteúdo. |
| **FR-NFSE-UX-02** — *Empty states* | **OK** | Lista: `nfseLoading` → loading; `nfseList.length===0` → erro `operation` + alerta + “Tentar novamente”, senão “Ainda não há…” + `scrollToNfseEmitSection`; `filteredNfseList.length===0` com lista não vazia → “Limpar filtros” (`resetNfseListFilters` inclui arquivadas). |
| **§5.1** — Ordem zona pré | **OK com nota** | Ordem: aviso A1 → faixa emitente → mensagens sync emitente → atalhos/links → *loading* texto catálogo → `nfseCatalogError` → pré-prestador. As faixas sync não estão na tabela literal da spec mas são feedback do emitente — aceitável. |
| **NFR-NFSE-05** — Sem KPI duplicado na lista | **OK** | Subtítulo “Notas emitidas” sem contagem; texto remete ao resumo no topo. |
| **Regressão NFS-e / gate MEI** | **OK** | `npx vitest run` em `GuidesMei.permissions.test.tsx`, `GuidesMei.nfse-catalog-refetch.test.tsx`, `App.mei-gate.test.tsx` — **20/20** pass (2026-04-01). |

### Observações (não bloqueantes)

1. **Cobertura automatizada:** não há teste dedicado aos *empty states* nem aos `id` das secções; regressão depende de testes gerais e *smoke* manual. **Dívida leve:** um teste RTL ao abrir o tab NFS-e que asserta presença de “Antes de emitir” / `#mei-nfse-emit` e, se possível, *mock* de lista vazia vs filtro.  
2. **Duplicação de *copy* de catálogo a carregar:** “A atualizar catálogo…” aparece na linha dinâmica (secção emit) e “Atualizando catálogo fiscal…” junto aos selects (secção pré) — alinhado a dar contexto local; se quiserem menos ruído, unificar numa fase P1.  
3. **Erro `operation` com lista vazia:** o alerta deixa de aparecer na secção emit (`nfseList.length > 0`) e concentra-se na zona da lista — comportamento intencional (Dev Record); válido para falha de listagem.

### Riscos

- **Baixo:** alterações sobretudo estruturais/DOM; sem mudança de contrato API; `scrollIntoView` depende de DOM (aceitável no browser).

### Segue para merge

- **Sim**, após *smoke* manual opcional no DoD (primeira visita NFS-e, filtro sem resultado, emitente sem razão social).
