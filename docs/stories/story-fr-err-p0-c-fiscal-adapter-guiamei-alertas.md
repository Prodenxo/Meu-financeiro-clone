# Story — FR-ERR-P0-C: Fiscal — adapter `MeiFiscalUserCopy` → `UserFacingErrorProps` e alertas Guia MEI

**ID:** STORY-FR-ERR-P0-C  
**Prioridade:** P0  
**Depende de:** [story-fr-err-p0-b-user-facing-error-core-mapeadores.md](./story-fr-err-p0-b-user-facing-error-core-mapeadores.md) (`UserFacingErrorBlock` e tipos estáveis)  
**Fonte:** `docs/prd/PRD-mensagens-erro-ux-usuario-final-2026-04-07.md` (**FR-ERR-B02**, **FR-ERR-B06**)  
**UX:** `docs/specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md` §10.3, §4 *provedor_fiscal*  
**Arquitetura:** `docs/technical/architecture-mensagens-erro-ux-usuario-final-2026-04-07.md` §3.2, §5.2, diagrama fiscal

## User story

**Como** MEI a emitir ou gerir certificado na Guia MEI,  
**quero** ver **sempre** um título humano acima de mensagens longas do emissor, com indicação de **fonte** e detalhe legível,  
**para** corrigir dados fiscais sem confundir com erro “do site”.

## Contexto técnico

- Função pura `meiFiscalUserCopyToUserFacing` (ou nome acordado) que converte `MeiFiscalUserCopy` de `mapMeiFiscalErrorToCopy` para `UserFacingErrorProps` com `category: provedor_fiscal` / `source: provedor_fiscal` quando o detalhe vier do provedor (arquitetura §3.2).
- Refatorar interior de `FiscalIntegrationErrorAlert`, `EmissaoFiscalErrorAlert`, `EmissaoFiscalErrorAlertModal` para compor `UserFacingErrorBlock` mantendo **paridade** de: `LongFiscalErrorMessage`, `FISCAL_ERROR_LONG_THRESHOLD`, *hints* NFC-e / NFSe nacional existentes.
- Garantir que `plugnotasCode` continua a ter prioridade sobre texto bruto para título/descrição (**FR-ERR-B06**).
- Atualizar `GuidesMei.tsx` apenas na medida necessária para passar props ao novo fluxo (estado de erro de emissão, lista, sync, etc.) conforme inventário **ERR-P0-A**.
- Testes: regressão `fiscalUserError.test.ts`; testes de componente ou integração leves nos alertas fiscais.

## Critérios de aceite

- [ ] Emissão / operações fiscais na Guia MEI: título humano **não** é substituído pelo texto longo do provedor (spec §10.3).
- [ ] Linha de fonte “serviço de emissão de notas” visível quando `source === provedor_fiscal` (UX §3.1).
- [ ] Comportamento existente de *hints* (409 certificado, NFC-e cadastro, NFSe nacional) preservado ou explicitamente migrado sem perda de *link* de ajuda.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` verdes.

## Fora de escopo

- Alterar contratos `mei-notas` ou serviços Plugnotas no backend.  
- Migração de transações / catálogos fora da Guia MEI (**STORY-FR-ERR-P0-D**).

## File list (checklist implementação)

- [ ] `frontend/src/lib/fiscalUserError.ts` (adapter ou exports)
- [ ] `frontend/src/lib/meiFiscalUserCopyToUserFacing.ts` (se ficheiro dedicado)
- [ ] `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- [ ] `frontend/src/pages/GuidesMei.tsx` (pontos de erro fiscal)
- [ ] Testes associados

## Definition of Done

- QA: cenário manual ou *staging* com mensagem longa do provedor (ou *fixture*) — verificar hierarquia e *scroll* do detalhe.  
- PO: validação rápida dos títulos genéricos estáveis vs detalhe (alinhado DoD fiscal existente).

## Qualidade / CodeRabbit

- Não expor JSON opaco como única mensagem (`looksLikeOpaqueApiPayload`).  
- Sem novos `console.log` com payload fiscal completo.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor / Composer (implementação assistida)

### Completion Notes List

- Adapter `meiFiscalUserCopyToUserFacing` com `category`/`source` `provedor_fiscal`, `secondaryAction` a partir de `href`, `embedRawAsTechnicalDetail` para paridade com `LongFiscalErrorMessage` no painel de cadastro empresa.
- Heurística `useRawInsteadOfFallback` + `pickFiscalTechnicalDetail(displayDescription)`: mensagens curtas não mapeadas mostram texto útil sem disclosure redundante; `ERR_*` mantém copy de fallback.
- `GuidesMei`: estado `nfseError` passa `{ rawMessage, plugnotasCode }` para priorizar `plugnotasCode` em `mapMeiFiscalErrorToCopy`; resumo no bloco limite de faturamento via `nfseErrorSummaryLine`.
- `FISCAL_ERROR_LONG_THRESHOLD` canónico em `fiscalUserError.ts`; testes importam diretamente desse módulo (sem re-export no componente — `react-refresh/only-export-components`).
- Pós-QA: `handleEmitNfeLike` inclui `setEmissionNfseError` nas dependências do `useCallback`.

### File List (implementação)

- `frontend/src/lib/fiscalUserError.ts`
- `frontend/src/lib/meiFiscalUserCopyToUserFacing.ts`
- `frontend/src/lib/meiFiscalUserCopyToUserFacing.test.ts`
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`

### Debug Log References

- CodeRabbit pré-commit: não executado — WSL indisponível neste ambiente (`coderabbit` configurado só em WSL).

### Change Log

- **2026-04-07** — Follow-up QA (CONCERNS): `exhaustive-deps` em `handleEmitNfeLike`; removido re-export `FISCAL_ERROR_LONG_THRESHOLD` de `FiscalIntegrationErrorAlert.tsx`; teste importa de `fiscalUserError.ts`.
- **2026-04-07** — Implementação FR-ERR-P0-C: `UserFacingErrorBlock` nos alertas fiscais + estado Guia MEI com código Plugnotas + testes.
- **2026-04-07** — Story criada (SM): camada fiscal + alertas Guia MEI.

---

## QA Results

**Revisor:** Quinn (QA) — **Data:** 2026-04-07  
**Gate:** **CONCERNS** (implementação alinhada à story e testes sólidos; pendências menores e DoD manual abaixo)

### Rastreio aos critérios de aceite

| Critério | Verificação | Evidência |
|----------|-------------|-----------|
| Título humano não substituído pelo texto longo do provedor (§10.3) | **Atende** | `mapMeiFiscalErrorToCopy` define `title`; `UserFacingErrorBlock` renderiza `<h3>` + `description`; texto bruto longo ou opaco tende a `technicalDetail` com “Ver detalhes técnicos” (`meiFiscalUserCopyToUserFacing` + `UserFacingErrorBlock`). |
| Linha de fonte “serviço de emissão de notas” (`provedor_fiscal`) | **Atende** | `meiFiscalUserCopyToUserFacing` fixa `source: 'provedor_fiscal'`; `USER_ERROR_SOURCE_LABEL.provedor_fiscal` em `userErrorCopy.ts` (“serviço de emissão de notas (emissor fiscal)…”). |
| Hints 409 / NFC-e / NFS-e Nacional preservados | **Atende** | Testes em `FiscalIntegrationErrorAlert.test.tsx` (NFC-e, nacional, `certificado_409_sem_id` + âncoras); componentes `GuiaMeiCertificado409SemIdChecklist`, `NfseNacionalOperacaoDocHint` mantidos no fluxo. |
| `npm run lint`, `typecheck`, `test` verdes | **Parcial** | `npm run lint` — **0 erros**, 69 *warnings* no workspace (incl. `react-refresh/only-export-components` em `FiscalIntegrationErrorAlert.tsx` por re-export de constante; `exhaustive-deps` em `GuidesMei.tsx` linha ~2048). Testes alvo: **22/22** (`FiscalIntegrationErrorAlert`, `meiFiscalUserCopyToUserFacing`, `fiscalUserError`). *Recomendação:* correr `npm run typecheck` e `npm test` completos no CI antes do merge se ainda não correram hoje. |

### Given–When–Then (amostra)

1. **Emissão com erro mapeado + código 409** — *Dado* `plugnotasCode === certificado_409_sem_id`, *quando* o painel de cadastro empresa mostra erro, *então* checklist + link “Saiba mais” e copy 409 permanecem (teste automatizado).
2. **Erro longo opaco (JSON)** — *Dado* mensagem que `looksLikeOpaqueApiPayload` classifica como opaca, *quando* `EmissaoFiscalErrorAlert` renderiza, *então* há disclosure “Ver detalhes técnicos” com corpo completo após expandir (teste automatizado).
3. **Estado Guia MEI** — *Dado* falha em listagem/emissão com `ApiClientError` e `plugnotasCode`, *quando* `setOperationNfseError` / `setEmissionNfseError` são chamados, *então* `rawMessage` + `plugnotasCode` alimentam `mapMeiFiscalErrorToCopy` (prioridade do código estável — FR-ERR-B06).

### Riscos e notas

- **DoD story:** validação manual/staging com mensagem longa real — **não evidenciada** nesta revisão; sugerido checklist rápido no browser (emissão ou lista com erro longo): hierarquia título → descrição → fonte → detalhe rolável.
- **CodeRabbit:** Dev record indica WSL indisponível — revisão automática **não** repetida aqui.
- **Dívida técnica leve:** `void options.plugnotasCode` no adapter (intencional para extensão); considerar uso futuro em telemetria sem alterar copy.

### Recomendações (não bloqueantes)

1. Incluir `setEmissionNfseError` no array de dependências do `useCallback` afetado em `GuidesMei.tsx` (ou justificar omit com comentário eslint) para silenciar warning e evitar *stale closure* em refactors.
2. Opcional: mover `FISCAL_ERROR_LONG_THRESHOLD` para módulo só de constantes/export de teste para limpar `react-refresh/only-export-components` em `FiscalIntegrationErrorAlert.tsx`.

---
*Fim do registo QA — apenas esta secção foi alterada pelo agente QA.*
