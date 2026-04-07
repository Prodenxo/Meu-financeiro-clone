# Story — POSQA-3 (P0): Limite MEI — **copy** NF-e/NFC-e + erros de emissão **NF-e** / **NFC-e**

**ID:** STORY-POSQA-3-LIMITE-COPY-ERROS-NFE-NFCE  
**Prioridade:** P0  
**Depende de:** — *(recomendado: **STORY-POSQA-1** concluído para QA validar erros em sandbox)*  
**Bloqueia:** —  
**Fonte:** `docs/prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md` (**FR-POSQA-05**, **FR-POSQA-06**, **NFR-POSQA-03**)  
**Arquitetura:** `docs/technical/architecture-mei-posqa-nfe-nfce-2026-04-07.md` §3, §4, §7  
**UX:** `docs/specs/ux-spec-mei-posqa-nfe-nfce-2026-04-07.md` §4, §5, §10

## User story

**Como** MEI no Guia MEI,  
**quero** ver **claramente** que o indicador de limite de faturamento considera **NFS-e** e **não** inclui NF-e/NFC-e no somatório actual, e receber **mensagens úteis** quando a emissão NF-e ou NFC-e falha (validação Plugnotas),  
**para** não confundir limite com produto e saber **o que corrigir** sem ver JSON bruto ou segredos (**FR-POSQA-05**, **FR-POSQA-06**).

## Contexto técnico

- **Limite:** regra de agregado **inalterada** — `agregarLimiteFaturamento` / `meiLimiteFaturamento.ts` permanecem NFSE-only; apenas **copy** em `MeiLimiteFaturamentoBlock.tsx` (UX §4.3).  
- **Erros:** cadeia `nfe.service`/`nfce.service` → `apiClient` → `formatMeiFiscalErr` / `fiscalUserError.ts` — melhorar paridade com mensagens agregadas sem alterar contrato HTTP (**CR-POSQA-02**).  
- **`looksLikeOpaqueApiPayload`:** evitar mostrar JSON opaco como mensagem principal (arquitetura §4.2).  
- **NFR-POSQA-03:** testes mínimos — um caso **NF-e** e um **NFC-e** de erro (fixture ou mock) após alterações.

## Critérios de aceite

### Limite MEI (**FR-POSQA-05**, UX §4.3)

- [ ] Linha **“Base (MVP)”** inclui texto que **NF-e e NFC-e não entram** no total (copy canónica UX ou equivalente aprovada por PO).  
- [ ] Painel expansível **“Detalhe da base de cálculo”** inclui parágrafo sobre exclusão NF-e/NFC-e e (opcional) frase sobre futura alteração anunciada — conforme decisão PO na UX spec.  
- [ ] **Sem** alteração de query Supabase nem de `computeMeiLimiteProgresso` salvo bug descoberto — fora de escopo.

### Erros de emissão (**FR-POSQA-06**, UX §5)

- [ ] Falha de **emitirNfe** / **emitirNfce** apresenta mensagem acionável (campos / configuração / suporte), **sem** stack trace na UI.  
- [ ] Paridade com padrão de mensagens **longas** usado para NFS-e (`LongFiscalErrorMessage` / `EmissaoFiscalErrorAlert` onde aplicável).  
- [ ] Identificação do tipo **NF-e** / **NFC-e** visível no contexto do erro (label ou prefixo), alinhado à UX §5.3.

### Testes (**NFR-POSQA-03**)

- [ ] Cobertura mínima: pelo menos **um** teste automatizado que asserta texto/formato final para erro **NF-e** e **um** para **NFC-e** (pode ser `fiscalUserError`, `GuidesMei`, ou componente de alerta — definir na implementação).  
- [ ] `npm run lint`, `npm run typecheck`, `npm test` nos pacotes tocados (`AGENTS.md`).

## Tasks (implementação)

1. [x] Actualizar `MeiLimiteFaturamentoBlock.tsx` (copy Base + painel detalhe).  
2. [x] Rever `formatMeiFiscalErr` / `formatFiscalError` / `mapMeiFiscalErrorToCopy` para NF-e/NFC-e com mensagens Plugnotas agregadas.  
3. [x] Garantir `GuidesMei` usa componente de erro longo quando necessário para NFE/NFCE — *já via `EmissaoFiscalErrorAlert` + `LongFiscalErrorMessage`; sem alteração adicional.*  
4. [x] Adicionar testes conforme NFR-POSQA-03.  
5. [ ] QA manual opcional com sandbox após POSQA-1.

## File list (checklist implementação)

- [x] `frontend/src/components/MeiLimiteFaturamentoBlock.tsx`  
- [x] `frontend/src/pages/GuidesMei.tsx` *(sem alteração — fluxo de erro já correcto)*  
- [x] `frontend/src/lib/fiscalUserError.ts` *(se novos ramos)*  
- [x] `frontend/src/lib/fiscalUserError.test.ts` ou ficheiro de teste novo *(se existir padrão)*  
- [x] `frontend/src/components/MeiLimiteFaturamentoBlock.test.tsx` *(se copy exigir assert)*  
- [x] `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx` *(assert de título de erro fiscal alinhado a novo mapa POSQA)*

## Definition of Done

- Critérios de aceite verificados em QA.  
- Gates `AGENTS.md` verdes.  
- **CR-POSQA-01** — testes existentes de `plugnotas-nfe` / `plugnotas-nfce` / `mei-notas-core` continuam a passar.

## Qualidade / CodeRabbit

- Não duplicar regras de limite no cliente que contradigam servidor.  
- Não vazar PII em mensagens de erro (sanitização preferida no `formatFiscalError` se backend devolver documentos completos no texto).

## Dev Agent Record

### Status

Ready for Review

### Completion Notes List

- **FR-POSQA-05:** `MeiLimiteFaturamentoBlock` — linha **Base (MVP)** com exclusão explícita de NF-e/NFC-e do total (UX §4.3); painel **Detalhe da base de cálculo** com parágrafo ICMS/SEFAZ + frase de produto futuro.  
- **FR-POSQA-06:** `mapMeiFiscalErrorToCopy` — novo ramo após regras específicas: `isLikelyUserFacingFiscalValidationMessage` + título «Validação ou rejeição no provedor» para mensagens agregadas legíveis (sem substituir por fallback genérico); `looksLikeOpaqueApiPayload` inalterado. `GuidesMei` mantém `EmissaoFiscalErrorAlert` / `LongFiscalErrorMessage` para emissão (incl. NF-e/NFC-e).  
- **NFR-POSQA-03:** testes em `fiscalUserError.test.ts` (cenários NF-e e NFC-e); `MeiLimiteFaturamentoBlock.test.tsx` (copy); ajuste de assert em `GuidesMei.certificate-connectivity.test.tsx` para título «Validação ou rejeição no provedor».  
- Gates: `npm run typecheck`, `npm run lint` (0 erros), `npm test` (workspace) — validar no CI local se necessário.  
- **Seguimento QA (obs. não bloqueantes):** (1) `isLikelyUserFacingFiscalValidationMessage` — comprimento mínimo **8** quando o texto contém pistas fiscais (`FISCAL_PROVIDER_CONTENT_HINT`: NCM, CFOP, SEFAZ, etc.) para reduzir quedas no fallback «Operação fiscal»; teste «NCM item 0 inválido.» em `fiscalUserError.test.ts`. (2) **CR-POSQA-01:** `npm test` no **backend** executado com sucesso após este seguimento. (3) **CodeRabbit:** não obrigatório para ajuste pontual; CI / PR pode correr conforme política da equipa. (4) Task 5 (sandbox manual) permanece opcional.

### File List (final)

- `frontend/src/components/MeiLimiteFaturamentoBlock.tsx`  
- `frontend/src/lib/fiscalUserError.ts`  
- `frontend/src/lib/fiscalUserError.test.ts`  
- `frontend/src/components/MeiLimiteFaturamentoBlock.test.tsx`  
- `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`

---

## QA Results

### Revisão QA — 2026-04-07 (Quinn)

**Decisão de gate:** **PASS com observações**

#### Rastreio — critérios de aceite

| Área | Veredicto | Evidência / notas |
|------|-----------|---------------------|
| **FR-POSQA-05** — Base (MVP) com exclusão NF-e/NFC-e | **Satisfeito** | `MeiLimiteFaturamentoBlock.tsx`: texto explícito «Notas NF-e e NFC-e não entram neste total» na linha `text-sm` (UX §4.5 hierarquia). |
| **FR-POSQA-05** — Painel «Detalhe da base de cálculo» | **Satisfeito** | Parágrafo ICMS/SEFAZ + frase de alteração futura na app; conteúdo existente sobre NFS-e/processamento mantido. |
| **FR-POSQA-05** — Sem alteração a agregado / Supabase | **Satisfeito** | Diff limitado a copy em componente; sem mudanças em `meiLimiteFaturamento.ts` / queries. |
| **FR-POSQA-06** — Mensagem acionável sem stack | **Satisfeito** | `mapMeiFiscalErrorToCopy` + `isLikelyUserFacingFiscalValidationMessage`; `looksLikeOpaqueApiPayload` mantém bloqueio a JSON opaco; mensagens internas genéricas continuam com fallback global. |
| **FR-POSQA-06** — `LongFiscalErrorMessage` / `EmissaoFiscalErrorAlert` | **Satisfeito** | Fluxo de emissão em `GuidesMei` já usa `EmissaoFiscalErrorAlert` + `LongFiscalErrorMessage` para `nfseErrorKind === 'emission'`; `formatPlugnotasIntegrationError` alimenta o mesmo pipeline. |
| **FR-POSQA-06** — Label NF-e / NFC-e no erro | **Satisfeito** | `EmissaoFiscalErrorAlert` com `documentTypeLabel` (`emissionFeedbackDocumentLabel`); cabeçalho «Falha ao emitir …». |
| **NFR-POSQA-03** — Testes NF-e + NFC-e | **Satisfeito** | `fiscalUserError.test.ts`: casos «POSQA / NF-e» e «POSQA / NFC-e»; `MeiLimiteFaturamentoBlock.test.tsx` para copy do limite. |
| **Gates** | **Satisfeito (amostra)** | `vitest` em `fiscalUserError.test.ts` + `MeiLimiteFaturamentoBlock.test.tsx`: **OK** (execução local nesta revisão). **CR-POSQA-01:** recomenda-se confirmar `npm test` no backend / suite completa no CI antes do merge. |

#### Observações (não bloqueantes)

1. **`isLikelyUserFacingFiscalValidationMessage`** é heurística ampla (comprimento 12–8000, exclusão de padrões tipo stack/rede). Mensagens ambíguas podem ainda cair no fallback «Operação fiscal» — aceitável; monitorizar feedback de utilizador.  
2. **Task 5** (QA manual sandbox / POSQA-1) permanece **opcional** na story; validação E2E real de rejeição Plugnotas não faz parte desta revisão estática.  
3. **CodeRabbit:** não executado nesta revisão.

— Quinn, guardião da qualidade 🛡️
