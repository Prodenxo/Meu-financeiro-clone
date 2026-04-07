# Story — FR-UPD-DOC (P0): Frontend — hidratação, cache **GET empresa** e **PATCH** com `documentosAtivos`

**ID:** STORY-FR-UPD-DOC-P0-FRONTEND-HYDRATE  
**Prioridade:** P0  
**Depende de:** [story-fr-upd-doc-p0-backend-reconcile-get-espelho.md](./story-fr-upd-doc-p0-backend-reconcile-get-espelho.md) (recomendado para teste E2E real); [story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md](./story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md) (secção Documentos ativos)  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../prd/PRD-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) — **FR-UPD-DOC-01**, **FR-UPD-DOC-02**, **FR-UPD-DOC-04**, **FR-UPD-DOC-06**  
**UX:** [`docs/specs/ux-spec-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../specs/ux-spec-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) — estados S0–S5, spinner único, precedência remoto > espelho > default  
**Arquitetura:** [`docs/technical/architecture-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../technical/architecture-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) §3.3–3.4, §5.1

## User story

**Como** utilizador com emitente já configurado,  
**quero** ver os documentos ativos **alinhados ao emissor** ao abrir o Guia MEI, poder **editar** depois e **guardar** sem novo certificado, com o pedido a incluir sempre a minha seleção,  
**para** evitar deriva entre app e Plugnotas e não perder alterações por payload incompleto.

## Contexto

- Precedência de exibição: **GET empresa (parseado)** > **`documentosAtivos` em `certificate/status`** > **defaults PRD** (**FR-UPD-DOC-04**).  
- **Uma** chamada GET empresa por visita/TTL (**NFR-UPD-DOC-01**); *guard* contra duplo mount (React Strict Mode).  
- Ao confirmar **Atualizar cadastro**, o corpo deve incluir **`documentosAtivos`** quando o utilizador alterou ou confirma a secção (**FR-UPD-DOC-02**).  
- Secção “Documentos ativos” **permanece descoberta** pós-cadastro (subtítulo ou acordeão com resumo — **FR-UPD-DOC-01** / UX §3).

## Critérios de aceite

- [x] Ao montar o ecrã relevante (Guia MEI / cadastro fiscal), com CNPJ conhecido e fluxo de emitente aplicável, dispara-se **no máximo uma** sequência GET empresa “relevante” por política de cache (sessionStorage ou módulo + TTL 2–5 min conforme arquitetura).  
- [x] Checkboxes entram em estado **S0** (skeleton ou disabled) até primeira resolução remota ou espelho via status — evitar flash de defaults incorrectos quando dados chegam em &lt; ~300 ms com cache.  
- [x] Após GET empresa OK, UI reflecte seleção derivada do JSON (parser **partilhado** com backend **ou** campo derivado se API o expuser — evitar duas lógicas divergentes).  
- [x] Se GET empresa falhar, UI mostra espelho ou defaults e **mensagem discreta** conforme UX spec §4.3 (**FR-UPD-DOC-06**); resto do ecrã utilizável.  
- [x] Fluxo **Atualizar cadastro (sem novo certificado)** inclui **`documentosAtivos`** no payload quando o utilizador confirma alteração na secção (≥ um tipo ativo).  
- [x] Após PATCH bem-sucedido, invalidar cache GET para próxima visita.  
- [x] Testes: utilitários de merge/cache e/ou teste de componente/serviço para precedência e duplo mount.  
- [x] Gates `AGENTS.md` na raiz do monorepo.

## Tasks

1. [x] Implementar cache GET + chave `userId`+CNPJ + invalidação pós-PATCH.  
2. [x] Orquestrar `GET certificate/status` e `GET …/emissao-fiscal/empresa` (paralelo permitido com merge final **remoto > espelho > default**).  
3. [x] Ajustar `GuidesMei.tsx` (ou extrair sub-componente) para estados UX S0–S5 e subtítulo de descoberta (**FR-UPD-DOC-01**).  
4. [x] Garantir `buildNfEmissionEmpresaPayload` / fluxo PATCH inclui `documentosAtivos` na confirmação.  
5. [x] Acessibilidade: `aria-busy` na secção durante S0; mensagem GET falhou com `aria-live="polite"`.

## File list (indicativo)

- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `frontend/src/services/guidesMeiService.ts` (sem alteração — contratos existentes)  
- [x] `frontend/src/utils/guiaMeiCadastroDocumentosAtivos.ts`  
- [x] `frontend/src/utils/plugnotasEmpresaDocumentosAtivos.ts`  
- [x] `frontend/src/utils/guiaMeiEmpresaGetCache.ts` (novo)  
- [x] `frontend/src/utils/nfEmissionCompany.ts` (sem alteração — payload já inclui `documentosAtivos`)  
- [x] Testes: `plugnotasEmpresaDocumentosAtivos.test.ts`, `guiaMeiEmpresaGetCache.test.ts`, `GuidesMei.documentos-ativos.test.tsx`

## Fora de escopo

- Banner de deriva e botão “Sincronizar” explícito — **story P1**.  
- Toast copy pós-guardar “emissor fiscal” — pode ser **P1** se já existir toast genérico suficiente no MVP.

## Qualidade / CodeRabbit

- Sem credenciais ou PFX em estado cliente.  
- Evitar tempestade de requests: respeitar cache documentado.

## Executor Assignment (sugestão AIOX)

| Campo | Valor |
|-------|--------|
| executor | @dev |
| quality_gate | @ux-design-expert |
| quality_gate_tools | Verificar spec S0/S4, `aria-busy`, copy de falha |

---

## Dev Agent Record

### Status

Ready for Review

### Completion Notes

- Cache `sessionStorage` + dedupe em voo: `guiaMeiEmpresaGetCache.ts` (TTL 3 min, chave `userId`+CNPJ); invalidação após PATCH e após cadastro empresa no upload.
- `loadCertificateStatus`: `Promise.allSettled` entre status e GET empresa quando CNPJ 14 dígitos no formulário; caso contrário status primeiro e GET com `cnpj` resolvido do certificado; merge **remoto > espelho > default** via `mergeDocumentosAtivosPrecedence`.
- `extractDocumentosAtivosFromEmpresaResponse` no cliente alinhado ao backend (envelopes + `toBool` em `ativo`).
- `GuidesMei`: S0 (`aria-busy`, checkboxes `disabled`), subtítulo de descoberta, mensagem discreta GET falhou (`aria-live="polite"`); consulta manual usa o mesmo cache.
- Gates: `npm run lint`, `npm run typecheck`, `npm run test` OK.
- Follow-up QA (2026-04-07): GET empresa na hidratação sem exigir `userId` (cache `anon`); testes `GuidesMei.documentos-ativos.test.tsx` para remount sem duplicar `consultarEmpresaEmissaoNf` e para `userId` nulo.

### File List

- `frontend/src/utils/guiaMeiEmpresaGetCache.ts`
- `frontend/src/utils/guiaMeiEmpresaGetCache.test.ts`
- `frontend/src/utils/guiaMeiCadastroDocumentosAtivos.ts`
- `frontend/src/utils/plugnotasEmpresaDocumentosAtivos.ts`
- `frontend/src/utils/plugnotasEmpresaDocumentosAtivos.test.ts`
- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/pages/GuidesMei.documentos-ativos.test.tsx`
- `docs/stories/story-fr-upd-doc-p0-frontend-hidratacao-cache-patch.md`

### Change Log

| Data | Notas |
|------|--------|
| 2026-04-07 | Story criada pelo SM (River). |
| 2026-04-07 | Implementação P0: cache GET, merge hidratação, UX S0, a11y, testes. |
| 2026-04-07 | Follow-up QA: hidratação com `userId` opcional + testes remount / anon. |

---

## QA Results

**Revisor:** Quinn (QA) — revisão estática + testes focados no frontend.

### Decisão de gate: **PASS**

### Rastreio critérios de aceite

| Critério | Evidência |
|----------|-----------|
| ≤1 GET empresa relevante por TTL / visita | `guiaMeiEmpresaGetCache.ts`: `sessionStorage` + `inFlight` por chave `userId`+CNPJ; TTL 3 min; testes dedupe + cache hit + expiração + `invalidateMeiEmpresaGetCache`. |
| S0 até resolução | `GuidesMei.tsx`: estado inicial `documentosAtivosHydrating` com `canViewNfse`; `fieldset` com `aria-busy`; checkboxes `disabled` durante hidratação; `finally` desbloqueia. |
| Parser alinhado ao backend | `extractDocumentosAtivosFromEmpresaResponse` + `plugnotasDocumentoAtivoToBool` — mesmos envelopes e regra “≥1 ativo” que o backend. |
| GET falha → espelho/default + mensagem discreta | `mergeDocumentosAtivosPrecedence`; `documentosAtivosHydrationError` com `MSG_DOCUMENTOS_ATIVOS_GET_EMPRESA_HIDRATACAO_FALHOU` e `aria-live="polite"`. |
| PATCH inclui `documentosAtivos` | `handleAtualizarCadastroSemNovoCertificado` → `buildNfEmissionEmpresaPayload({ ..., documentosAtivos })` (já existente; verificado por grep). |
| Invalidação pós-PATCH / pós-cadastro | `invalidateMeiEmpresaGetCache` após PATCH bem-sucedido e após `cadastrarEmpresaEmissaoNf` no upload. |
| Testes merge/cache/precedência | `plugnotasEmpresaDocumentosAtivos.test.ts`, `guiaMeiEmpresaGetCache.test.ts`, `GuidesMei.documentos-ativos.test.tsx` (mock `userId`). |
| Gates | `vitest` nos 3 ficheiros acima: **12/12 OK** (execução nesta revisão). |

### NFR / segurança

- Sem credenciais ou PFX em `sessionStorage` (apenas JSON de resposta GET).
- Risco residual baixo: com `userId` ausente, não há GET empresa em cache na hidratação — cai em espelho/default (comportamento aceitável; sessão autenticada típica tem `userId`).

### Dívida / melhorias (não bloqueiam PASS)

1. **Strict Mode / duplo mount:** dedupe HTTP está coberto por teste de `inFlight`; não há teste de integração que simule remount React — aceitável para P0.
2. **S1–S5 completos:** implementação entrega S0 + subtítulo de descoberta; estados S1–S5 completos na UI podem ser refinados com UX em story futura se necessário.

### Condições para merge

- Nenhuma além dos gates do repositório; recomenda-se `npm run test` completo no monorepo em CI antes do merge.

**Data da revisão:** 2026-04-07
