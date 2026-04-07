# Story — FR-ERR-P2 (opcional): Analytics — `error_shown` por categoria

**ID:** STORY-FR-ERR-P2  
**Prioridade:** P2  
**Depende de:** [story-fr-err-p0-b-user-facing-error-core-mapeadores.md](./story-fr-err-p0-b-user-facing-error-core-mapeadores.md) (ou conclusão de **ERR-P0-D** se o hook for injectado só após migração)  
**Fonte:** `docs/prd/PRD-mensagens-erro-ux-usuario-final-2026-04-07.md` (**FR-ERR-B08**)  
**UX:** `docs/specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md` (taxonomia §3 estável)  
**Arquitetura:** `docs/technical/architecture-mensagens-erro-ux-usuario-final-2026-04-07.md` §8

## User story

**Como** produto,  
**quero** contabilizar quantas vezes cada **categoria** de erro é mostrada (sem PII nem texto do provedor),  
**para** priorizar melhorias de copy e estabilidade sem violar privacidade.

## Contexto técnico

- Implementar `reportUserErrorShown({ category: UserErrorCategory, surfaceId?: string })` (nome final livre) chamado a partir de `UserFacingErrorBlock` (opt-in prop `analyticsSurfaceId?`) ou *wrapper* único.
- **Nunca** enviar: `title`, `description`, `technicalDetail`, dados fiscais, e-mail, CNPJ.
- Opcional: hash truncado do detalhe **apenas** em ambiente *staging* — desligado em produção salvo aprovação explícita PO.
- Integrar com o mecanismo de analytics já usado no *frontend* (se existir); se não existir, *no-op* por defeito com interface estável para ligação futura.

## Critérios de aceite

- [x] Evento dispara quando o bloco é montado com sucesso (ou quando o erro passa a visível — definir uma semântica e documentar).
- [x] Payload do evento contém apenas `category` (+ `surfaceId` opcional) e *timestamp* se o *backend* de analytics exigir.
- [x] Teste unitário: *mock* do *reporter* prova que texto do erro **não** é passado.
- [x] `npm run lint`, `npm run typecheck`, `npm test` verdes.

## Fora de escopo

- Dashboards ou *BigQuery*; apenas instrumentação cliente.  
- Alterar contratos de API.

## File list (checklist implementação)

- [x] `frontend/src/lib/reportUserErrorShown.ts` (ou serviço analytics existente)
- [x] `frontend/src/components/UserFacingErrorBlock.tsx` (hook opcional)
- [x] Testes

## Definition of Done

- PO confirma que categorias estáveis §3 spec cobrem necessidade de *reporting*.

## Qualidade / CodeRabbit

- Revisão de privacidade: nenhum campo dinâmico do erro no payload.  
- *Feature flag* ou env se necessário para desligar em mercados sensíveis.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor Agent (implementação)

### Completion Notes List

- `reportUserErrorShown` + `setUserErrorShownReporter`: payload só `category`, `surfaceId?`, `timestamp` (ISO); *no-op* por defeito; com `VITE_ENABLE_USER_ERROR_ANALYTICS=true` encaminha `gtag('event','error_shown',…)` se `window.gtag` existir.
- `UserFacingErrorBlock`: `useEffect` quando `analyticsSurfaceId` está definido; semântica documentada em JSDoc do reporter (montagem / mudança de `category`+`analyticsSurfaceId`; Strict Mode pode duplicar em dev).
- `mapUnknownErrorToUserFacing` / `mapApiClientErrorToUserFacing`: `ctx.surfaceId` → `analyticsSurfaceId` nas props (com `attachAnalyticsSurfaceFromCtx`).
- **Follow-up QA P2:** modais sem `surfaceId` no mapper — `mapMeiCatalogApiErrorToUserFacing` aceita 3.º arg opcional; `Transactions` (nova/editar/excluir), `RecorrenciaModal` com `surfaceId` no contexto; comentário JSDoc em `forwardToGtag` sobre GA4 / *custom dimensions*.
- `vite-env.d.ts`: `VITE_ENABLE_USER_ERROR_ANALYTICS` tipado.

### File List (implementação)

- `frontend/src/lib/reportUserErrorShown.ts`
- `frontend/src/lib/reportUserErrorShown.test.ts`
- `frontend/src/lib/attachAnalyticsSurfaceFromCtx.ts`
- `frontend/src/types/userFacingError.ts`
- `frontend/src/lib/mapUnknownErrorToUserFacing.ts`
- `frontend/src/lib/mapMeiCatalogApiErrorToUserFacing.ts`
- `frontend/src/lib/mapMeiCatalogApiErrorToUserFacing.test.ts`
- `frontend/src/lib/mapApiClientErrorToUserFacing.ts`
- `frontend/src/lib/userFacingMapContext.ts` (comentário)
- `frontend/src/components/UserFacingErrorBlock.tsx`
- `frontend/src/components/UserFacingErrorBlock.test.tsx`
- `frontend/src/components/MeiCatalogoClienteModal.tsx`
- `frontend/src/components/MeiCatalogoProdutoModal.tsx`
- `frontend/src/components/RecorrenciaModal.tsx`
- `frontend/src/pages/Transactions.tsx`
- `frontend/src/lib/mapUserFacing.test.ts`
- `frontend/src/vite-env.d.ts`

### Debug Log References

—

### Change Log

- **2026-04-07** — Story criada (SM): analytics opcional P2.
- **2026-04-07** — Implementação FR-ERR-B08: reporter, bloco, mappers, testes; gates verdes.
- **2026-04-07** — Pós-QA: `surfaceId` em modais transações/recorrência/catálogo MEI + testes `mapMeiCatalogApiErrorToUserFacing`; nota GA4 no reporter.

---

## QA Results

### Revisão — 2026-04-07 (Quinn / QA)

**Decisão de gate:** **PASS** — instrumentação alinhada a **FR-ERR-B08** e aos critérios de aceite; privacidade do payload verificada por código e testes. **Ressalva processual:** o **DoD** (“PO confirma categorias §3”) permanece **pendente de produto**, não de implementação.

---

#### Rastreio aos critérios de aceite

| Critério | Verificação | Evidência |
|----------|-------------|-----------|
| Evento na montagem / visibilidade | **OK** | `UserFacingErrorBlock`: `useEffect` com deps `[category, analyticsSurfaceId]`; JSDoc em `reportUserErrorShown` documenta Strict Mode (possível duplicata em dev). |
| Payload só `category` + `surfaceId?` + `timestamp` | **OK** | `ReportUserErrorShownPayload` tipado; `reportUserErrorShown` constrói objeto `safe` sem título/descrição; `forwardToGtag` só envia `event_category`, `surface_id?`, `timestamp`. |
| Teste: texto do erro não passa | **OK** | `reportUserErrorShown.test.ts` (reporter injectado + asserts sem `title`/`description`); `UserFacingErrorBlock.test.tsx` (mock do reporter); `mapUserFacing.test.ts` (`surfaceId` → `analyticsSurfaceId`). |
| Lint / typecheck / test | **OK** | `npm test` exit 0 nesta revisão (incl. `UserFacingErrorBlock.test.tsx`, `reportUserErrorShown.test.ts`, `mapUserFacing.test.ts`). |

---

#### Privacidade e NFR

| Tema | Resultado |
|------|-----------|
| **NFR story** (sem campos dinâmicos no payload) | Cumprido: API do reporter não aceita `title`/`technicalDetail`; testes reforçam ausência no objeto entregue ao mock / params do `gtag`. |
| **Feature flag / env** | `VITE_ENABLE_USER_ERROR_ANALYTICS === 'true'` para `gtag`; *no-op* de rede por defeito; `setUserErrorShownReporter` permite integração sem `gtag` (ex. PostHog) mesmo com env desligado — útil para ambientes controlados. |
| **Hash truncado em staging** | Explicitamente **fora** da entrega (story “opcional”); coerente com escopo. |

---

#### Cobertura e lacunas menores (não bloqueantes)

1. **Superfícies sem `surfaceId` no mapper** (ex. alguns modais que só passam `variant: modal_body` sem `ctx.surfaceId`) **não** disparam analytics até se acrescentar `surfaceId` / `analyticsSurfaceId` — aceitável para P2; alinhar backlog se o produto quiser paridade total.  
2. **GA4 / dataLayer:** nomes `event_category` e `surface_id` no terceiro argumento de `gtag` podem exigir mapeamento a *custom dimensions* no painel Google — tarefa de *analytics ops*, não de código.  
3. **CodeRabbit** — não executado nesta revisão.

---

**Assinatura:** QA — revisão estática + suíte de testes a verde.
