# Story — FR-PREF (P0): Plugnotas — variante **`nfse.config.prefeitura`**, hint IM e doc operação

**ID:** STORY-FR-PREF-P0-PREFITURA-CONFIG-UX  
**Prioridade:** P0  
**Depende de:** [story-fr-nat-p0-plugnotas-erro-municipal-copy-hints.md](./story-fr-nat-p0-plugnotas-erro-municipal-copy-hints.md) (heurística municipal base e painéis; esta story **especializa** copy PREF-L1 e entrega hint IM + doc).  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](../prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) — **FR-PREF-UX-01**, **FR-PREF-HINT-01**, **FR-PREF-DOC-01** (trilho **A**: sem mudança de payload)  
**UX:** [`docs/specs/ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](../specs/ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) — secções 3.2 (PREF-L1/L2), 4 (hint IM), 5.1–5.3 (copy erro), 5.4 (404 contextual), 6 (API variante)  
**Arquitetura:** [`docs/technical/architecture-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](../technical/architecture-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) — §3.1 (`isPlugnotasNfseConfigPrefeituraRequirementMessage`, `getPlugnotasEmpresaCadastroErrorUxVariant`), §3.3, §5.1, §7, §9

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — se a superfície pública de componentes fiscais ou contrato exportado de `nfseNacionalPlugnotasErrorHints` mudar |

---

## User story

**Como** MEI que tentou registrar a empresa no emissor fiscal,  
**quando** o erro citar **`nfse.config.prefeitura`** ou equivalente (configuração de prefeitura no NFS-e),  
**quero** ver uma explicação **distinta** da inscrição municipal opcional do formulário e os próximos passos (painel Plugnotas, ambiente, suporte, guia),  
**para** não concluir que “bastava preencher a inscrição municipal” e saber que o emissor pediu **outro tipo** de dado.

---

## Contexto

- **FR-PREF-UX-01** exige copy específica quando PREF-L1 (spec UX §5.1), não só o parágrafo municipal genérico (**FR-NAT-ERR-01** / story NAT).  
- **`inscricaoMunicipal`** na raiz **não** substitui **`nfse.config.prefeitura`** (PRD §6.3); o hint do campo IM deve deixar isso explícito (spec UX §4).  
- **Arquitetura §3.1:** introduzir `isPlugnotasNfseConfigPrefeituraRequirementMessage` como subconjunto testado de `isPlugnotasEmpresaMunicipalRequirementMessage` e `getPlugnotasEmpresaCadastroErrorUxVariant` com prioridade PREF-L1 > PREF-L2 > genérico.  
- **404 após falha de fase 2:** microcopy condicional (spec UX §5.4) quando o produto souber que houve falha recente no registo da empresa — estado React mínimo (arquitetura §5.1).

---

## Critérios de aceite

### Produto / UX

- [ ] **FR-PREF-UX-01:** Se `getPlugnotasEmpresaCadastroErrorUxVariant(message) === 'prefeitura-config'`, mostrar título + corpo conforme spec UX §5.1 (não substituir por copy que sugira apenas “preencha inscrição municipal”).  
- [ ] Se variante for `municipal-generic` (só IM na mensagem, sem gatilho PREF-L1), manter copy alinhada à spec NAT §5.2 **sem** afirmar que IM resolve `nfse.config.prefeitura` (spec UX §5.2).  
- [ ] Painel âmbar de retry e `GuiaMeiEmpresaCadastroErrorPanel` usam a **mesma** função de variante / componente partilhado de copy (spec UX §5.3; arquitetura §3.3).  
- [ ] **Hint** abaixo do campo de inscrição municipal opcional (se existir na UI): texto conforme spec UX §4 (1 linha `text-xs`).  
- [ ] **§5.4 (404):** Quando aplicável (falha recente na fase empresa + consulta sem cadastro), mostrar microcopy sugerida na spec ou equivalente aprovado por PO na revisão — **não** apenas “CNPJ não encontrado” sem contexto.

### Técnico / qualidade

- [ ] Testes unitários: *string* real ou equivalente `fields.nfse.config.prefeitura: Preenchimento obrigatório` → variante `prefeitura-config`; casos negativos (ex.: NFC-e only sem NFSe).  
- [ ] Testes para `municipal-generic` vs `prefeitura-config` (prioridade PREF-L1).  
- [ ] **FR-PREF-DOC-01:** `docs/operacao-mei-nfse.md` com bullets ou secção sobre erro `nfse.config.prefeitura` obrigatório, IM vs. `prefeitura`, link ao PRD PREF.  
- [ ] Gates: `npm run lint`, `npm run typecheck`, `npm test`.  
- [ ] **FR-PREF-HINT-01:** `isPlugnotasEmpresaMunicipalRequirementMessage` e `shouldOfferNfseNacionalOperacaoDocHint` permanecem coerentes; mensagens `config.prefeitura` continuam a disparar dica de guia.

### Fora desta story

- Envio de **`nfse.config.prefeitura`** no JSON (**FR-PREF-API-01**) — ver [story-fr-pref-p1-plugnotas-nfse-config-prefeitura-payload-bcd.md](./story-fr-pref-p1-plugnotas-nfse-config-prefeitura-payload-bcd.md).

---

## Tasks (indicativas)

1. [x] Implementar `isPlugnotasNfseConfigPrefeituraRequirementMessage` + `getPlugnotasEmpresaCadastroErrorUxVariant` em `nfseNacionalPlugnotasErrorHints.ts` (ou módulo adjacente se @architect preferir), com testes.  
2. [x] Integrar variante `prefeitura-config` no painel âmbar e no fluxo do painel vermelho (`GuidesMei.tsx` / `FiscalIntegrationErrorAlert.tsx` / componentes partilhados existentes).  
3. [x] Adicionar hint IM opcional (spec UX §4) no formulário de emitente onde o campo existir.  
4. [x] Estado mínimo “última falha registo empresa” + copy 404 contextual (spec UX §5.4), com testes ou cobertura manual documentada na story se RTL for excessivo.  
5. [x] Actualizar `docs/operacao-mei-nfse.md` (**FR-PREF-DOC-01**).  
6. [x] Correr gates e actualizar **File list** / **Dev Agent Record**.

---

## File list (indicativo)

- [x] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`  
- [x] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`  
- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `frontend/src/components/FiscalIntegrationErrorAlert.tsx` *(e/ou `PlugnotasMunicipalRequirementOperacaoCopy.tsx` / novo fragmento de copy PREF-L1)*  
- [x] `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx` *(se aplicável)*  
- [x] Formulário emitente (ficheiro onde estiver campo IM opcional)  
- [x] `docs/operacao-mei-nfse.md`

---

## CodeRabbit Integration

- Focar: heurística PREF-L1 sem falsos positivos; copy sem prometer correção só com IM; acessibilidade (`role="region"` onde a spec UX exigir para blocos novos).

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### Agent Model Used

Cursor agent (implementação assistida)

### Debug Log References

—

### Completion Notes

- `isPlugnotasNfseConfigPrefeituraRequirementMessage`, `getPlugnotasEmpresaCadastroErrorUxVariant`, `isPlugnotasEmpresaConsultNotFoundMessage`, `PLUGNOTAS_EMPRESA_CONSULT_PENDENTE_CADASTRO_PREFIX` em `nfseNacionalPlugnotasErrorHints.ts` com testes (PREF-L1 > municipal-generic > generic).
- Copy FR-PREF-UX-01: `PlugnotasPrefeituraConfigNfseOperacaoTitle` / `PlugnotasPrefeituraConfigNfseOperacaoBody` em `PlugnotasMunicipalRequirementOperacaoCopy.tsx`; `NfseNacionalOperacaoDocHint` e painel âmbar `plugnotasPendingRetry` usam variante `prefeitura-config`.
- Hint IM + `aria-describedby` no campo inscrição municipal (`GuidesMei.tsx`).
- Consulta/sincronização empresa: prefixo contextual quando `plugnotasPendingRetry` e mensagem “não encontrado” (**§5.4**).
- Doc: `docs/operacao-mei-nfse.md` âncora `#nfse-config-prefeitura-cadastro-pref`.
- Gates: `npm run lint` (warnings pré-existentes), `npm run typecheck`, `npm test` — exit 0 (frontend 471 + backend 288).
- **Follow-up QA (2026-04-08):** JSDoc mapeando PREF-L1/L2 → variantes internas; função pura `withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable` + testes (fluxo §5.4); bullet PREF-L2 em `operacao-mei-nfse.md`.

### File List

- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`
- `frontend/src/components/PlugnotasMunicipalRequirementOperacaoCopy.tsx`
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`
- `docs/operacao-mei-nfse.md`

### Change Log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | @sm | Story criada (PRD PREF trilho A + UX + arquitetura). |
| 2026-04-08 | @dev | Implementação FR-PREF P0 (variante prefeitura-config, hint IM, consulta 404, doc operação). |
| 2026-04-08 | @dev | Ajustes pós-QA: documentação PREF-L2 ≡ `municipal-generic`; helper + testes §5.4. |

---

## QA Results

*(preencher por @qa após implementação)*

### 2026-04-08 — Quinn (@qa) — revisão pós-implementação

**Decisão de gate:** **PASS** (com observações não bloqueantes abaixo).

**Evidência executada nesta sessão**

- `vitest`: `nfseNacionalPlugnotasErrorHints.test.ts` + `FiscalIntegrationErrorAlert.test.tsx` — 48 testes, exit 0.
- **CodeRabbit (WSL):** não executado nesta revisão; alinhar com política do projeto antes do merge se for obrigatório no pipeline.

**Rastreio critérios de aceite → implementação**

| Critério | Verificação |
|----------|-------------|
| **FR-PREF-UX-01** | `NfseNacionalOperacaoDocHint` ramifica `prefeitura-config` com `PlugnotasPrefeituraConfigNfseOperacaoTitle` / `Body`, `role="region"` e `aria-label` adequados. RTL em `FiscalIntegrationErrorAlert.test.tsx` (mensagem `fields.nfse.config.prefeitura`). |
| **municipal-generic vs PREF** | `PlugnotasMunicipalRequirementOperacaoBody` mantém copy NAT §5.2 (cadastro municipal genérico, sem prometer que IM resolve `nfse.config.prefeitura`). Variante `prefeitura-config` usa copy distinta (IM opcional ≠ payload). |
| **§5.3 painel âmbar + painel vermelho** | Ambos usam `getPlugnotasEmpresaCadastroErrorUxVariant` e os mesmos componentes de copy em `PlugnotasMunicipalRequirementOperacaoCopy.tsx` (`GuidesMei.tsx` âmbar; `GuiaMeiEmpresaCadastroErrorPanel` → `NfseNacionalOperacaoDocHint`). |
| **Hint IM §4** | `GuidesMei.tsx`: `text-xs` sob o campo, `aria-describedby` / `id` ligados; texto alinhado a “opcional / não substitui configurações extras no cadastro NFS-e”. |
| **§5.4 404 contextual** | `plugnotasPendingRetry` + `isPlugnotasEmpresaConsultNotFoundMessage` → prefixo `PLUGNOTAS_EMPRESA_CONSULT_PENDENTE_CADASTRO_PREFIX` em consulta e sincronização empresa. Cobertura unitária do detector de mensagem “não encontrado”. |
| **Testes técnicos** | String real `fields.nfse.config.prefeitura: Preenchimento obrigatório`, negativos `nfce.config.prefeitura`; prioridade PREF-L1 sobre municipal-generic (mensagem combinada → `prefeitura-config`). |
| **FR-PREF-DOC-01** | `docs/operacao-mei-nfse.md` — secção com âncora `#nfse-config-prefeitura-cadastro-pref`, IM vs `nfse.config`, links PRD/spec/arquitetura. |
| **FR-PREF-HINT-01** | `shouldOfferNfseNacionalOperacaoDocHint` continua a incluir `isPlugnotasEmpresaMunicipalRequirementMessage`; testes cobrem `nfse.config.prefeitura` e exclusão NFC-e-only. |

**Observações (não bloqueantes)**

1. **PREF-L2 na story de contexto:** a implementação materializa três variantes (`prefeitura-config`, `municipal-generic`, `generic`). Não há ramo nomeado “PREF-L2”; se a spec exigir copy distinta para L2, abrir follow-up com @po/@architect.
2. **E2E / RTL do fluxo completo** “POST empresa falha → `plugnotasPendingRetry` → GET 404”: lógica coberta por unidade + revisão estática; considerar teste de integração leve se o risco de regressão subir.

**Recomendação:** seguir para merge após gates completos no CI e, se aplicável, passo CodeRabbit acordado pela equipa.

— Quinn, guardião da qualidade 🛡️
