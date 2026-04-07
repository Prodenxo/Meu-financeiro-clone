# Story — FR-ERR-P0-B: Núcleo — tipos, `UserFacingErrorBlock`, `ApiClientError.payload`, mapeadores genéricos

**ID:** STORY-FR-ERR-P0-B  
**Prioridade:** P0  
**Depende de:** [story-fr-err-p0-a-inventario-copy-decisao-backend.md](./story-fr-err-p0-a-inventario-copy-decisao-backend.md) (copy e inventário disponíveis; pode iniciar em paralelo **após** alinhamento PO na tabela §6 da spec)  
**Fonte:** `docs/prd/PRD-mensagens-erro-ux-usuario-final-2026-04-07.md` (**FR-ERR-A03**, **FR-ERR-B01**, **FR-ERR-B07**, **FR-ERR-A05** lado cliente)  
**UX:** `docs/specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md` §4–§7, §5 contrato TS  
**Arquitetura:** `docs/technical/architecture-mensagens-erro-ux-usuario-final-2026-04-07.md` §3–§5, §7 sanitização, fases **B0** + **B1**

## User story

**Como** utilizador final,  
**quero** que erros genéricos (rede, API, desconhecido) apareçam com **título**, **descrição**, **fonte** quando aplicável e **CTAs** de recuperação,  
**para** saber o que fazer sem ler mensagens técnicas agregadas.

## Contexto técnico

- Criar `frontend/src/types/userFacingError.ts` com tipos da spec UX §5 (`UserErrorCategory`, `UserFacingErrorProps`, etc.).
- Criar `frontend/src/components/UserFacingErrorBlock.tsx` (nome final alinhado ao equipa) cumprindo anatomia UX §4.1, variantes §4.3, a11y §7 (`role="alert"`, `aria-labelledby`, colapsável detalhes).
- Estender `ApiClientError` com `payload?: ApiErrorPayload | null` preenchido em `apiClientErrorFromPayload` — **retrocompatível** (arquitetura §4.2, decisão **D3**).
- Implementar `mapUnknownErrorToUserFacing` e `mapApiClientErrorToUserFacing` (ou nomes equivalentes) com pipeline: `isFetchConnectivityFailure` → `ApiClientError` / `plugnotasCode` → fallback **FR-ERR-B07** usando constantes centralizadas (sugerido `frontend/src/lib/userErrorCopy.ts`).
- Implementar `sanitizeSupportClipboardText` para **NFR-ERR-03** quando existir acção “Copiar para suporte”.
- **Prova de conceito:** migrar **pelo menos um** *call site* para o novo bloco — recomendado `FetchErrorBanner` como *wrapper* fino sobre `UserFacingErrorBlock` **ou** uma página simples (ex.: lista que já usa o banner).
- Testes: unitários nos mapeadores (rede, 401 genérico, payload com `details`, fallback opaco via `looksLikeOpaqueApiPayload` se reutilizado); teste RTL mínimo do componente (título + `aria-labelledby`).

## Critérios de aceite

- [ ] Tipos exportados e usados pelo componente sem duplicação de definição.
- [ ] `UserFacingErrorBlock` renderiza título, descrição, linha de fonte opcional, detalhe colapsável/rolável, CTAs conforme props.
- [ ] `ApiClientError` inclui `payload` opcional; `apiClientErrorFromPayload` preenche-o; *call sites* que só usam `.message` não quebram.
- [ ] Nenhum fluxo tocado mostra **apenas** “Erro na requisição” sem segunda linha orientadora (PRD §6.2 / spec §10.2).
- [ ] `npm run lint`, `npm run typecheck`, `npm test` verdes nos pacotes alterados.

## Fora de escopo

- Refactor completo de `FiscalIntegrationErrorAlert` / Guia MEI ( **STORY-FR-ERR-P0-C** ).  
- Migração massiva de transações e catálogos ( **STORY-FR-ERR-P0-D** ).  
- Backend `userFacing` JSON (**D2** — story futura se A05 decidir sim).

## File list (checklist implementação)

- [ ] `frontend/src/types/userFacingError.ts`
- [ ] `frontend/src/lib/userErrorCopy.ts` (ou equivalente)
- [ ] `frontend/src/lib/mapUnknownErrorToUserFacing.ts` / `mapApiClientErrorToUserFacing.ts` (estrutura livre)
- [ ] `frontend/src/lib/sanitizeSupportClipboardText.ts` (+ testes)
- [ ] `frontend/src/components/UserFacingErrorBlock.tsx` (+ testes RTL)
- [ ] `frontend/src/utils/apiClientError.ts`
- [ ] `frontend/src/services/apiClient.ts` (passagem de `payload`)
- [ ] `frontend/src/components/FetchErrorBanner.tsx` (opcional nesta story se for o POC)
- [ ] `*.test.ts` / `*.test.tsx` novos ou alargados

## Definition of Done

- QA manual: simular `TypeError('Failed to fetch')` e erro JSON `success: false` e verificar hierarquia visual.  
- Revisão estática: *clipboard* não contém padrões `Bearer` / JWT após sanitização (caso de teste unitário).

## Qualidade / CodeRabbit

- Não logar corpo completo de erros fiscais em `console` novo.  
- Manter heurísticas existentes em `fiscalUserError.ts` sem regressão (esta story não substitui mapeamento fiscal).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor / Composer (implementação assistida)

### Completion Notes List

- Núcleo B0+B1: tipos, `userErrorCopy`, `sanitizeSupportClipboardText`, `mapUnknownErrorToUserFacing`, `mapApiClientErrorToUserFacing`, `userFacingMapContext`, `UserFacingErrorBlock`, `FetchErrorBanner` como wrapper; `ApiClientError.payload` + `apiClientErrorFromPayload`; POC em `Categorias.tsx` com `error={...}` e `surfaceId`.
- `apiClient.ts` não precisou de alteração: o payload JSON já é passado a `apiClientErrorFromPayload`, que agora anexa `payload` ao erro.
- Testes: `mapUserFacing.test.ts`, `sanitizeSupportClipboardText.test.ts`, `UserFacingErrorBlock.test.tsx`, `FetchErrorBanner.test.tsx`, extensão `apiClientError.test.ts`. `npm run lint`, `typecheck` e `npm test` (raiz) verdes.
- **Pós-QA (Dex):** cópia para suporte **opt-in** via `showCopyForSupport` ou `onCopySupportDetail` (handler); removidos `onCopySupportDetail: null` dos mapeadores (evita ambiguidade com props `null` em React). RTL: `afterEach(cleanup)` em `UserFacingErrorBlock.test.tsx`. DoD parcialmente coberto por testes de `FetchErrorBanner` (rede + mensagem legada).

### File List (implementação)

- `frontend/src/types/userFacingError.ts`
- `frontend/src/lib/userErrorCopy.ts`
- `frontend/src/lib/userFacingMapContext.ts`
- `frontend/src/lib/mapUnknownErrorToUserFacing.ts`
- `frontend/src/lib/mapApiClientErrorToUserFacing.ts`
- `frontend/src/lib/sanitizeSupportClipboardText.ts`
- `frontend/src/lib/sanitizeSupportClipboardText.test.ts`
- `frontend/src/lib/mapUserFacing.test.ts`
- `frontend/src/components/UserFacingErrorBlock.tsx`
- `frontend/src/components/UserFacingErrorBlock.test.tsx`
- `frontend/src/components/FetchErrorBanner.tsx`
- `frontend/src/components/FetchErrorBanner.test.tsx`
- `frontend/src/utils/apiClientError.ts`
- `frontend/src/utils/apiClientError.test.ts`
- `frontend/src/pages/Categorias.tsx`

### Debug Log References

—

### Change Log

- **2026-04-07** — Story criada (SM): núcleo B0+B1 + POC mínimo.
- **2026-04-07** — Implementação Dev: núcleo + POC Categorias; testes e gates.
- **2026-04-07** — Mitigação ressalvas QA: `showCopyForSupport`, testes `FetchErrorBanner`, `npm test` raiz evidenciado.

---

## QA Results

### Revisão — STORY-FR-ERR-P0-B (2026-04-07)

**Revisor:** Quinn (QA)  
**Decisão:** **PASS com ressalvas**

#### Evidências executadas (esta sessão)

- `npm run typecheck` no pacote `frontend`: **OK**
- Vitest focado: `mapUserFacing.test.ts`, `sanitizeSupportClipboardText.test.ts`, `UserFacingErrorBlock.test.tsx`, `apiClientError.test.ts`, `fiscalUserError.test.ts` (regressão heurísticas fiscais): **22 testes OK**

#### Rastreio aos critérios de aceite

| Critério | Veredicto | Notas |
|----------|-----------|--------|
| Tipos centralizados em `userFacingError.ts`, consumidos pelo bloco | **Atende** | Sem duplicação do contrato TS no componente. |
| `UserFacingErrorBlock`: anatomia + fonte opcional + detalhe colapsável + CTAs | **Atende** | `role`/`aria-labelledby`; botão de detalhes com `aria-expanded`/`aria-controls`; `USER_ERROR_SOURCE_LABEL`. |
| `ApiClientError.payload` + `apiClientErrorFromPayload`; compat `.message` | **Atende** | `payload` opcional; instâncias existentes sem `payload` continuam válidas. |
| Não mostrar só “Erro na requisição” sem segunda linha (fluxos mapeados) | **Atende** | Teste unitário cobre `Error('Erro na requisição')` → copy `validacao_servidor`; `FetchErrorBanner` encaminha `message`/`error` pelo mapeador. |
| Lint / typecheck / teste nos pacotes alterados | **Atende com ressalva** | Typecheck + testes focados OK aqui; **recomenda-se** manter `npm test` na raiz do monorepo no CI antes do merge (evidência completa não repetida nesta revisão). |

#### Definition of Done (história)

- **Simulação manual** (`TypeError('Failed to fetch')` + JSON `success: false` na UI): **não evidenciada** nesta revisão automatizada — **ressalva**: smoke manual rápido em **Categorias** (rede vs API) e um ecrã que ainda use `FetchErrorBanner` só com `message` (legado).
- **Clipboard / NFR-ERR-03:** testes unitários cobrem remoção de padrões `Bearer` / JWT-like / `token=` — **OK**.

#### Observações (não bloqueantes)

1. **`surfaceId`** é aceite no contexto mas ainda não produz telemetria (reservado P2) — alinhado à arquitetura.  
2. Botão **“Copiar informação para suporte”** aparece sempre que há `technicalDetail` e `onCopySupportDetail !== null`; para ocultar é necessário passar `onCopySupportDetail={null}` explicitamente — aceitável para P0, documentar se PO quiser controlo fino.  
3. Checklist “File list (checklist implementação)” no corpo da story permanece com caixas por marcar; a lista em **Dev Agent Record** está preenchida — alinhamento SM/PO fora do âmbito QA.

#### Recomendações de follow-up

- **P0-D / B3:** migrar mais *call sites* (`Transactions`, `Dashboard`, `Orcamentos`, etc.) para `error={unknown}` onde possível.  
- **P2:** `reportUserErrorShown({ category, surfaceId })` conforme arquitetura.

---

**Resumo:** Implementação alinhada à story e às specs citadas; testes automáticos dos mapeadores, sanitização e RTL mínimo são consistentes. **Aprovação condicionada** a confirmação de **smoke manual** opcional pelo PO/SM ou evidência de `npm test` completo na pipeline.

— Quinn, guardião da qualidade 🛡️
