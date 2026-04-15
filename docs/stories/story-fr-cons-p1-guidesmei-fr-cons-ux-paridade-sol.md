# Story — FR-CONS (P1): Guia MEI — paridade **FR-CONS-UX-01/02** com **SOL** e gatilhos **CONS-A/B**

**ID:** STORY-FR-CONS-P1-GUIAS-UX-SOL-PARIDADE  
**Prioridade:** P1  
**Depende de:** [story-fr-sol-p0-plugnotas-encadeamento-post-404-get-empresa-ux.md](./story-fr-sol-p0-plugnotas-encadeamento-post-404-get-empresa-ux.md) e [story-fr-sol-p1-plugnotas-empresa-fase2-falha-session-l2.md](./story-fr-sol-p1-plugnotas-empresa-fase2-falha-session-l2.md) *(ou estado equivalente no código)*  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../prd/PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — **FR-CONS-UX-01**, **FR-CONS-UX-02**, **FR-CONS-EVID-01**  
**UX:** [`docs/specs/ux-spec-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../specs/ux-spec-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — gatilhos **CONS-A**, **CONS-B**, secção 5.2, regra de ouro CONS-C separado  
**UX (SOL):** [`docs/specs/ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](../specs/ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) — **SOL-L1–L3**  
**Arquitetura:** [`docs/technical/architecture-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../technical/architecture-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — §2.4 estado sessão; §4 matriz CONS

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @ux-design-expert — antipadrões **FR-CONS-UX-01**; @architect — consistência com `guiaMeiEmpresaFase2FailFlag` |

---

## User story

**Como** MEI em fluxo de cadastro da empresa no emissor,  
**quando** vejo “empresa não encontrada” ou 404 na consulta após uma falha de envio,  
**quero** que a interface **nunca** sugira que o problema é só “confirmar se a empresa existe” **sem** lembrar que o registo pode não ter sido concluído,  
**para** focar em corrigir o passo de cadastro (POST) em vez de culpar o CNPJ ou a consulta isoladamente (**FR-CONS-UX-01**, **FR-CONS-UX-02**).

---

## Contexto

- Stories **SOL P0/P1** já introduziram `resolvePlugnotasEmpresaCadastroSolUxState`, painéis **SOL-L1/L2**, `guiaMeiEmpresaFase2FailFlag` com TTL.  
- Esta story é **auditoria + lacunas**: garantir que **todos** os pontos onde o utilizador vê mensagem derivada de **GET empresa** 404 / “não encontrado” respeitam **CONS-B** e antipadrões do PRD (**FR-CONS-UX-01**).  
- Inclui: *polling*, *retry*, mensagens em `GuidesMei.tsx` fora do painel principal, e qualquer *toast*/`admin-alert` ligado a `nfEmissionCompanySyncError` ou cache GET.  
- **CONS-A + CONS-B simultâneos:** quando painel POST visível + mensagem 404, manter bloco **SOL-L1** (spec SOL §4) — verificar que não foi regredido.  
- **Separação CONS-C:** após [story-fr-cons-p0-serpro-emitir-503-mei-guide-validate.md](./story-fr-cons-p0-serpro-emitir-503-mei-guide-validate.md), confirmar que erro de validate **não** dispara `shouldOfferNfseNacionalOperacaoDocHint` nem variantes PREF no mesmo bloco.

---

## Critérios de aceite

### Produto / UX

- [ ] **FR-CONS-UX-01:** Nenhuma *string* visível sugere “confirme se a empresa existe no emissor” / equivalente **sem** mencionar que o **cadastro anterior pode ter falhado** ou que o registo **ainda não foi criado**, quando o estado for **CONS-B** com histórico de falha de POST (usar `guiaMeiEmpresaFase2FailFlag` ou estado já existente).  
- [ ] **FR-CONS-UX-02:** Mensagens de *polling* / “empresa não encontrada” após falha de POST incluem contexto conforme spec **SOL** (reutilizar componentes existentes; não duplicar parágrafos contraditórios).  
- [ ] **CONS-A + B:** Com painel de erro de POST ainda visível e mensagem de consulta, utilizador vê encadeamento **SOL-L1** (spec SOL).  
- [ ] Hints **Plugnotas** / NFS-e Nacional **não** aparecem para erros classificados como **Serpro** (`errors.integration === 'serpro'` ou `apiErrorCode` Serpro após P0).

### Técnico

- [ ] Lista de ficheiros revistos documentada na story (grep orientado: `não encontrad`, `404`, `empresa`, `sync`, `nfEmissionCompany`).  
- [ ] Testes RTL ou unitários **incrementais** apenas onde houver lacuna comprovada (não reescrever toda a suite `GuidesMei`).  
- [ ] Gates: `npm run lint`, `npm run typecheck`, `npm test`.

### Documentação

- [ ] Se alterar comportamento, uma linha em `docs/operacao-mei-nfse.md` cruzando com a story **CONS-P1 triade** (opcional, pode ser feito na mesma PR que a story de doc).

---

## Tasks (indicativas)

1. [x] Auditoria de copy/strings em `GuidesMei.tsx` (e componentes filhos directos do fluxo empresa) contra checklist **FR-CONS-UX-01**.  
2. [x] Corrigir lacunas; reutilizar `resolvePlugnotasEmpresaCadastroSolUxState` / painéis SOL existentes.  
3. [x] Garantir que `shouldOfferNfseNacionalOperacaoDocHint` não actua em mensagens de validate Serpro.  
4. [x] Testes mínimos + gates + **File list** + **Dev Agent Record**.

---

## File list (indicativo)

- [ ] `frontend/src/pages/GuidesMei.tsx`  
- [ ] `frontend/src/utils/plugnotasEmpresaCadastroSolUx.ts` *(se ajuste ao resolver)*  
- [ ] `frontend/src/utils/guiaMeiEmpresaFase2FailFlag.ts` *(se TTL/chaves precisarem alinhar a CONS)*  
- [ ] `frontend/src/components/FiscalIntegrationErrorAlert.tsx` *(se copy transversal)*  
- [ ] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` *(guard Serpro)*  
- [ ] Testes `*.test.tsx` / `*.test.ts` *(incrementais)*  

---

## CodeRabbit Integration

- Focar: regressão SOL-L1/L2; condições de corrida entre limpeza de flag e GET; não esconder erro real de Plugnotas atrás de copy genérica.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### File list

- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` — `PlugnotasEmpresaConsultConsBContext`, prefixo GET com `sessionPostFailedFlag`; `isMeiGuideSerproConsCUserFacingText`; `shouldOfferNfseNacionalOperacaoDocHint(message, fiscalApiErrorCode?)`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts` — regressão FR-CONS-P1
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx` — `GuiaMeiEmpresaCadastroErrorPanel` + `fiscalApiErrorCode`; supressão IBGE cidade em Serpro/CONS-C
- `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx` — caso FR-CONS-P1 (hint IBGE + `MEI_GUIDE_SERPRO_UNAVAILABLE`)
- `frontend/src/pages/GuidesMei.tsx` — consulta/sincronizar empresa: prefixo CONS-B com flag sessão SOL-P1; estado `nfEmissionCompanySyncFiscalApiErrorCode` + `getApiErrorCodeFromUnknownError` nos `catch`
- `docs/operacao-mei-nfse.md` — [Triagem: erros na consola](../operacao-mei-nfse.md#triagem-erros-consola-guia-mei) (**FR-CONS-MAP-01**); linhas existentes FR-CONS-P1 / CONS-B / CONS-C

### Notes

- **FR-CONS-UX-01 / §5.4:** antes só `plugnotasPendingRetry` activava o prefixo; com painel fechado mas `guiaMeiEmpresaFase2FailFlag` activa, o utilizador via 404 sem contexto — corrigido com `sessionPostFailedFlag` nas duas rotas GET (consultar + sincronizar documentos).
- **FR-CONS-P0/P1:** `shouldOfferNfseNacionalOperacaoDocHint` ignora copy CONS-C / `MEI_GUIDE_SERPRO_UNAVAILABLE`; painel empresa pode receber `fiscalApiErrorCode` quando o BFF expuser `errors.code` no fluxo Plugnotas.
- **Follow-up QA (obs. 1):** `GuidesMei` guarda `getApiErrorCodeFromUnknownError(error)` em estado ao lado de `nfEmissionCompanySyncError` e passa `fiscalApiErrorCode` a todos os `GuiaMeiEmpresaCadastroErrorPanel` do fluxo sync (incl. tier NFS-e e bloco compacto).
- **Follow-up QA (obs. 3):** `GuiaMeiEmpresaCadastroErrorPanel` suprime `PlugnotasIbgeCidadeOperacaoHint` quando `fiscalApiErrorCode === MEI_GUIDE_SERPRO_UNAVAILABLE` ou `isMeiGuideSerproConsCUserFacingText(message)`.
- Painéis SOL (`PlugnotasEmpresaCadastroSolContextPanel` + `resolvePlugnotasEmpresaCadastroSolUxState`) mantidos; L1/L2 inalterados na lógica do resolver.
- Gates: `npm run lint`, `npm run typecheck`, `npm test` — OK após follow-up QA.
- **FR-CONS-EVID-01:** checklist de evidência inclui o runbook [`docs/operacao-mei-nfse.md#triagem-erros-consola-guia-mei`](../operacao-mei-nfse.md#triagem-erros-consola-guia-mei) (mapa tríade consola / story P1 operação).

### Change Log

- 2026-04-08 — Implementação FR-CONS P1: paridade CONS-B (prefixo + sessão) e guard Serpro em hints NFS-e Nacional.
- 2026-04-08 — Follow-up QA: wiring `fiscalApiErrorCode` no sync empresa + supressão IBGE cidade em Serpro/CONS-C no painel empresa.
- 2026-04-08 — FR-CONS-EVID-01: referência explícita à secção de triagem no `operacao-mei-nfse.md`.

---

## QA Results

### 2026-04-08 — Quinn (@qa)

**Decisão de gate:** **PASS** (observação menor sobre prop `fiscalApiErrorCode` não ligada em `GuidesMei`).

**Evidência de qualidade (NFR-CONS-04):** `npm run lint`, `npm run typecheck` e `npm test` na raiz — concluídos com sucesso na revisão.

**Rastreabilidade face aos critérios de aceite**

| Critério | Evidência |
|----------|-----------|
| **FR-CONS-UX-01 / CONS-B** | `withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable` aceita `sessionPostFailedFlag`; `GuidesMei` passa `{ pendingRetryPanel, sessionPostFailedFlag }` em **consultar cadastro** e **sincronizar documentos** quando `isGuiaMeiEmpresaFase2FailFlagActive` — fecha lacuna “painel retry fechado mas sessão SOL-P1 activa”. |
| **FR-CONS-UX-02 / SOL** | Continuidade de `PlugnotasEmpresaCadastroSolContextPanel` + `resolvePlugnotasEmpresaCadastroSolUxState` (L1 com `plugnotasPendingRetry`, L2 com flag sessão); prefixo §5.4 alinhado a copy existente. |
| **CONS-A + B / SOL-L1** | Lógica do resolver não foi alterada no ficheiro SOL; `postErrorPanelVisible: Boolean(plugnotasPendingRetry)` mantém L1 quando GET “não encontrado” + painel POST visível. |
| **Serpro vs hints Plugnotas** | `shouldOfferNfseNacionalOperacaoDocHint(message, fiscalApiErrorCode?)` com guardas `MEI_GUIDE_SERPRO_UNAVAILABLE` e `isMeiGuideSerproConsCUserFacingText`; testes em `nfseNacionalPlugnotasErrorHints.test.ts`. |
| **Testes incrementais** | Novos casos: supressão CONS-C / código Serpro; prefixo só com `sessionPostFailedFlag`. |
| **Documentação** | `docs/operacao-mei-nfse.md` — bullet FR-CONS (P1) com triade CONS-B / CONS-C e link à story. |

**Observações (não bloqueantes)**

1. **`GuiaMeiEmpresaCadastroErrorPanel` + `fiscalApiErrorCode`:** a prop existe e é usada na heurística do hint nacional, mas **`GuidesMei` ainda não extrai nem passa `errors.code`** do `ApiClientError` no fluxo de sync/consulta — cobertura actual é sobretudo **heurística de texto** + segundo argumento opcional. Recomendação de melhoria: propagar `getApiErrorCodeFromUnknownError(error)` no `catch` dos handlers que alimentam `nfEmissionCompanySyncError` quando o produto quiser fechar literalmente o critério “`apiErrorCode` Serpro”.
2. **Outros GET empresa (hidratação):** falhas em `loadCertificateStatus` / `documentosAtivos` usam `documentosAtivosHydrationError` genérico, não `nfEmissionCompanySyncError` — fora do âmbito directo desta story; sem regressão detectada.
3. **`PlugnotasIbgeCidadeOperacaoHint`** no painel empresa não foi condicionado a Serpro; risco residual baixo porque mensagens CONS-C não entram tipicamente neste estado.

**Conclusão:** alterações coerentes com **FR-CONS-UX-01/02** e separação CONS-C; apto para revisão UX/@architect e merge após validação humana do copy em cenário L2 (sessão sem painel âmbar).

— Quinn, guardião da qualidade
