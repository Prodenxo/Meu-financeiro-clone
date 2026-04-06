# Story — FR-GUIA-FISC (P0): Guia MEI — lista de notas: filtro e distinção visual por tipo

**ID:** STORY-FR-GUIA-FISC-P0-LISTA-FILTRO-TIPOS  
**Prioridade:** P0  
**Depende de:** [story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md) *(dependência branda: o filtro funciona sem a story anterior se já existirem registos NFE/NFCE na BD; para QA completo, recomenda-se ter emissão P0 ou dados de teste)*  
**Bloqueia:** —  
**Fonte:** `docs/prd/PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md` (**FR-GUIA-FISC-05**)  
**Arquitetura:** `docs/technical/architecture-mei-emissao-nfe-nfce-guia-2026-04-06.md` §4  
**UX:** `docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md` §7

## User story

**Como** MEI que emite vários tipos de nota,  
**quero** filtrar o histórico por **NFS-e**, **NF-e** ou **NFC-e** e ver o tipo de cada linha de forma clara,  
**para** acompanhar e encontrar notas sem confusão (**FR-GUIA-FISC-05**).

## Contexto técnico

- **API:** `GET /mei-notas?documentType=NFSE|NFE|NFCE` já suportado (`mei-notas.controller.js` → `listarNotas`).  
- **Cliente:** `listarNotas({ documentType })` em `meiNotasService.ts` — `buildListSuffix` já cobre query (*ver testes existentes*).  
- **UI:** `GuidesMei.tsx` — estado `nfseDocumentTypeFilter` actual limitado; evoluir para **Todas | NFS-e | NF-e | NFC-e** (UX §7.1).  
- **Dados:** campo `document_type` (ou equivalente) em `NfseRecord`.

## Critérios de aceite

### Filtro

- [ ] Controlo de filtro com opções: **Todas**, **NFS-e**, **NF-e**, **NFC-e** mapeadas para ausência de query ou `documentType=NFSE|NFE|NFCE`.  
- [ ] Ao mudar o filtro, a lista **refetch** ou filtra de forma coerente com o padrão actual da página (sem *flash* de dados de outro utilizador).  
- [ ] Estado vazio específico: *copy* UX §7.3 quando não há notas daquele tipo.

### Coluna ou badge de tipo

- [ ] Cada linha mostra o **tipo** de forma legível (badge *pill* ou coluna dedicada) com distinção visual entre NFSE / NFE / NFCE (UX §7.2 — cores alinhadas ao *design system* ou `admin-badge-*` com variantes novas documentadas).

### Acessibilidade

- [ ] Filtro com label associado; tabela ou lista semântica mantida.

## Tasks (implementação)

1. [x] Estender estado do filtro e parâmetros passados a `listarNotas`.  
2. [x] Actualizar *toolbar* acima da lista (UX §7.1).  
3. [x] Renderizar badge/coluna por `document_type` com *fallback* para valores nulos/legados.  
4. [x] Ajustar *copy* de vazio/erro conforme UX §7.3.

## Fora de escopo

- Alteração de schema Supabase.  
- Novo endpoint de listagem.

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `frontend/src/utils/meiFiscalDocumentTypeUi.ts`  
- [x] `frontend/src/utils/meiFiscalDocumentTypeUi.test.ts`  
- [x] `frontend/src/pages/GuidesMei.permissions.test.tsx` (actualização US-MEI-NFS-03 → FR-GUIA-FISC-05)  
- [ ] Opcional: `frontend/src/components/mei/MeiFiscalNotesToolbar.tsx` (se extraído na story P0 irmã) — não aplicado

## Definition of Done

- Critérios de aceite verificados com pelo menos um registo de cada tipo em *staging* ou mock.  
- Gates `AGENTS.md` no frontend.

## Qualidade / CodeRabbit

- Garantir que `documentType` na query usa valores normalizados (**NFSE**, **NFE**, **NFCE**) como no backend.

---

## Dev Agent Record

### Status

Ready for Review

### Completion Notes List

- Filtro **Todas | NFS-e | NF-e | NFC-e** com `documentType` **NFSE|NFE|NFCE** na chamada `listarNfse` (já existente); estado `MeiFiscalListDocumentFilter`.
- Lista desktop: coluna **Tipo** com badges (`admin-badge-primary` NFS-e, `admin-badge-warning` NF-e, `admin-badge-success` NFC-e); cartão móvel com badge junto ao status.
- `document_type` vazio tratado como **NFSE** no filtro cliente (legado) e badge **—** (neutro).
- Estado vazio: copy **UX §7.3** (*"Não há notas deste tipo no período visível."*) quando só o filtro de tipo está activo; botão **Mostrar todas** (UX); **Limpar filtros** mantido.
- Seguimento **QA (2026-04-06):** teste RTL em `GuidesMei.permissions.test.tsx` que, ao mudar o `<select>` Tipo de nota, verifica `listarNfse` com `documentType: 'NFE'` e `'NFCE'` (+ `limit: 1000`).
- Teste `GuidesMei.permissions.test.tsx` actualizado (deixou de exigir ausência de NF-e/NFC-e no select — alinhado a FR-GUIA-FISC-05).
- `npm run lint` / `npm run typecheck` na raiz: OK. `vitest` para ficheiros tocados: `meiFiscalDocumentTypeUi.test.ts`, `GuidesMei.permissions.test.tsx` — OK. Suite `vitest run` completa no frontend reporta falhas noutros ficheiros (ambiente jsdom / testes sem `@vitest-environment jsdom`) não introduzidas por esta story. **DoD staging** (registo real de cada tipo): continua a recomendar-se smoke manual em ambiente com dados; o teste acima cobre o contrato cliente→API do filtro.

### File List (final)

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/utils/meiFiscalDocumentTypeUi.ts`
- `frontend/src/utils/meiFiscalDocumentTypeUi.test.ts`
- `frontend/src/pages/GuidesMei.permissions.test.tsx`

---

## QA Results

### Revisão QA — 2026-04-06 (Quinn)

**Decisão de gate:** **PASS com observações** (não bloqueia merge desde que smoke manual DoD seja feito ou aceite como débito explícito).

#### Rastreio — critérios de aceite (story)

| Área | Veredicto | Evidência no código |
|------|-----------|---------------------|
| **Filtro** Todas / NFS-e / NF-e / NFC-e → `documentType` NFSE\|NFE\|NFCE ou omissão | **Satisfeito** | `GuidesMei.tsx`: `listarNfse` com spread condicional `documentType`; valores em maiúsculas como o backend. |
| **Refetch** ao mudar filtro | **Satisfeito** | `loadNfseList` em `useCallback` com dependência `nfseDocumentTypeFilter`; efeito que chama `loadNfseList` quando o callback muda. |
| **Estado vazio** (copy UX §7.3) | **Satisfeito com nota** | `meiFiscalListFilterEmptyMessage` + condição (tipo ≠ all e status/período = all); botão **Mostrar todas (tipos)**. Texto usa “lista atual” em vez de “período visível” da spec — equivalente funcional. |
| **Badges / coluna Tipo** | **Satisfeito** | Tabela desktop: coluna **Tipo**; cartão móvel: badge junto ao status; `admin-badge-primary` / `warning` / `success` + neutro para desconhecido/CT-e. |
| **Acessibilidade** | **Satisfeito** | `label` associado a `#nfse-filter-lista-tipo`; estrutura de tabela preservada no desktop. |

#### Testes automáticos

- **`meiFiscalDocumentTypeUi.test.ts`:** cobre normalização, rótulos, classes de badge e mensagens de vazio — **adequado** para o utilitário.
- **`GuidesMei.permissions.test.tsx`:** valida presença das opções NFE/NFCE e do label “Tipo de nota” — **adequado** como *smoke* de UI estática.
- **Lacuna leve (não bloqueante):** não há teste que prove, via mock, que ao alterar o `<select>` o cliente chama `listarNfse` com `documentType: 'NFE'` / `'NFCE'`. Risco **baixo** dado o encadeamento `useCallback` + `useEffect`.

#### Riscos e dados

- **`document_type` nulo:** filtro cliente trata como NFSE; badge mostra “—”. Coerente com legado NFS-e; se existirem linhas mal tipadas na BD, o utilizador pode ver inconsistência — **aceitável** com documentação já no Dev Record.
- **CT-e:** se o backend listar CTE, o badge “CT-e” (neutro) aparece; **sem** opção de filtro CT-e — alinhado ao fora de escopo da story.

#### DoD da story

- **Gates AGENTS.md:** conforme notas do dev (lint/typecheck na raiz).
- **“Pelo menos um registo de cada tipo em staging ou mock”:** **não comprovado** por teste automatizado — recomenda-se **smoke manual** antes de promoção a produção ou registo explícito de WAIVED com dono.

#### Recomendações opcionais (backlog)

1. Teste RTL: mudança do filtro → `listarNfse` mock recebe `documentType` correcto.  
2. Alinhar copy de vazio à UX spec (“período visível”) se o PO quiser paridade literal.

**CodeRabbit:** não executado nesta revisão; sugerido nos ficheiros alterados antes do merge.

— Quinn, guardião da qualidade 🛡️
