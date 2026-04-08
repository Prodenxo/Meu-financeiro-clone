# Story — FR-ORQ-CERT (P0): Guia MEI — **fases**, CTA único, **retry** só empresa (setup Plugnotas)

**ID:** STORY-FR-ORQ-CERT-P0-GUIDESMEI  
**Prioridade:** P0  
**Depende de:** Fluxo fiscal com `canViewNfse` e cadastro emitente já funcional; alinhar com [story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md](./story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md) se documentos ativos forem pré-requisito de validação.  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`](../prd/PRD-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md) — **FR-ORQ-CERT-01** … **FR-ORQ-CERT-08** (face ao utilizador e cliente HTTP)  
**UX:** [`docs/specs/ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`](../specs/ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md)  
**Arquitetura:** [`docs/technical/architecture-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`](../technical/architecture-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md) — secções 2–5, 7, 9, 11  
**Brief:** [`docs/brief/brief-empresa-plugnotas-orquestrada-no-cadastro-certificado-2026-04-07.md`](../brief/brief-empresa-plugnotas-orquestrada-no-cadastro-certificado-2026-04-07.md)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test`; revisão de fluxo com **@architect** se alterar contrato de erro público. |

---

## User story

**Como** MEI a configurar o emissor fiscal na app,  
**quero** concluir certificado e registro da empresa num **único passo consciente**, ver **em que fase** está o envio e, se só a empresa falhar, **tentar de novo sem reenviar o .pfx**,  
**para** o painel Plugnotas ficar alinhado (Empresas + certificado) e reduzir erros de suporte.

---

## Contexto

- Hoje `GuidesMei.tsx` (`handleCertificateUpload`) já encadeia `uploadMeiCertificate` → `cadastrarCertificadoEmissaoNf` → `cadastrarEmpresaEmissaoNf` quando `canViewNfse`.  
- Faltam: estados de fase explícitos (**FR-ORQ-CERT-03**), mensagem de sucesso unificada (**FR-ORQ-CERT-04**), fluxo de erro parcial + retry só empresa (**FR-ORQ-CERT-05**), copy coerente quando certificado veio de 409 resolvido (**FR-ORQ-CERT-06**), e acessibilidade (**NFR-ORQ-CERT-04**).  
- **Backend MVP:** sem alteração obrigatória; resposta de certificado já expõe `id` (`CadastrarEmissaoNfCertificadoResponse`).

---

## Critérios de aceite

### Produto / UX (mapeamento PRD)

- [ ] **FR-ORQ-CERT-01:** CTA primário de conclusão **só habilitado** quando ficheiro, senha, validação de emitente (`getNfEmissionCompanyValidationMessage`) e, se existir secção na UI, documentos ativos (`getDocumentosAtivosValidationMessage`) estão OK — alinhado à spec UX §4.2.  
- [ ] **FR-ORQ-CERT-02:** Ordem mantida: após sucesso de `cadastrarCertificadoEmissaoNf`, chamar `cadastrarEmpresaEmissaoNf` com `certificado` = `id` retornado (ou fluxo 409 resolvido no backend).  
- [ ] **FR-ORQ-CERT-03:** Durante submissão, utilizador vê **duas fases** distintas (copy spec UX §5.1 / §7) + região `aria-live` para mudança de fase (**NFR-ORQ-CERT-04**).  
- [ ] **FR-ORQ-CERT-04:** Após sucesso completo, **uma** mensagem principal canónica (evitar concatenação longa de várias frases como única leitura); detalhe opcional secundário aceitável se PO aprovar.  
- [ ] **FR-ORQ-CERT-05:** Se `cadastrarEmpresaEmissaoNf` falhar após certificado OK: banner/alerta conforme spec UX §5.4 + botão **“Tentar registrar empresa novamente”** que chama **apenas** `cadastrarEmpresaEmissaoNf` com o mesmo `certificadoId` em memória e payload atual do formulário.  
- [ ] **FR-ORQ-CERT-06:** Se `certificateResponse.raw` indicar recuperação pós-409 (ex.: `recoveredFrom409`), não mostrar copy de “certificado criado” que contradiga — alinhar a PRD §6.4 e spec UX §5.2.  
- [ ] **FR-ORQ-CERT-07:** Fluxos **Consultar** e **Atualizar cadastro (sem novo certificado)** permanecem independentes e não exigem o novo CTA.  
- [ ] **FR-ORQ-CERT-08:** Sem regressão: quando `documentosAtivos` estiver no payload, o servidor continua a persistir espelho (já existente); o cliente deve continuar a enviar o bloco quando aplicável.

### Técnico / qualidade

- [ ] Extrair lógica de sequência Plugnotas para módulo ou hook dedicado (arquitetura §4.1), p.ex. `frontend/src/utils/plugnotasEmitenteSetup.ts`, com erros que carregam `phase: 'certificado' | 'empresa'` para o `catch` pai.  
- [ ] CTA primário: rótulo alinhado à spec (**“Concluir configuração fiscal”** ou variante aprovada pelo PO) + linha de ajuda sob botão desabilitado (spec UX §4.2).  
- [ ] **NFR-ORQ-CERT-03:** botão primário desabilitado + `aria-busy` durante fases; prevenir duplo envio.  
- [ ] **NFR-ORQ-CERT-01:** não persistir `certificadoId` em `localStorage` no P0; manter em estado React até sucesso ou abandono explícito.  
- [ ] Testes: unitários do módulo de setup (mocks das duas chamadas); estender testes de certificado/conectividade existentes com falha na segunda chamada e assert de retry só empresa (`GuidesMei.certificate-connectivity.test.tsx` ou equivalente).  
- [ ] Gates: `npm run lint`, `npm run typecheck`, `npm test` (`AGENTS.md`).

---

## Tasks (indicativas)

1. [x] Criar `plugnotasEmitenteSetup` (ou hook) — `submitFullSetup`, `retryEmpresa`, `onPhaseChange` / retorno de fase.  
2. [x] Refatorar `handleCertificateUpload` para compor MEI + setup; mapear erros por `phase`.  
3. [x] UI: bloco de progresso duas fases; estados E0–E6 (spec UX §4.1); banner retry §5.4.  
4. [x] A11y: `aria-live`, `aria-busy`, foco em erro (spec UX §6).  
5. [x] Ajustar microcopy (tabela spec UX §7) com PO se necessário.  
6. [x] Testes + gates.

---

## File list (indicativo)

- [x] `frontend/src/utils/plugnotasEmitenteSetup.ts`  
- [x] `frontend/src/utils/plugnotasEmitenteSetup.test.ts`  
- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`  
- [ ] Opcional: `frontend/src/lib/fiscalUserError.ts` — copy específica erro fase 2 (não necessário no P0)  

---

## Fora de escopo (esta story)

- Novo endpoint composto no backend — ver [story-fr-orq-cert-p1-endpoint-emitente-opcional.md](./story-fr-orq-cert-p1-endpoint-emitente-opcional.md).  
- **FR-ORQ-CERT-09** (telemetria) — story futura com legal/privacy.  
- Alterar policy `nfe`/`nfce`/`nfse` no servidor — outros PRDs/stories.

---

## 🤖 CodeRabbit Integration

- Focar em: tratamento de erro não vazar senha/certificado; não duplicar chamadas Plugnotas em retry; acessibilidade de `aria-live` sem spam.  
- Após implementação, correr CodeRabbit conforme prática do repo nos ficheiros tocados.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### Completion Notes

- Utilitário `plugnotasEmitenteSetup`: sequência certificado → empresa, `PlugnotasEmitenteSetupError` com `phase`, `buildCompanyPayload(certificadoId)`, retry só empresa.
- `GuidesMei`: CTA “Concluir configuração fiscal”, gating emitente + documentos ativos + CNPJ 14 dígitos; progresso duas fases (`aria-live`); erro parcial com banner UX 5.4 e primário “Tentar registrar empresa novamente”; conectividade na fase certificado alinhada ao painel existente.
- Testes: unitários do util; conectividade + caso FR-ORQ-CERT retry; `mockReset` nos mocks fiscais no `beforeEach` do teste de certificado.
- **Follow-up QA (2026-04-07):** banner de retry com link terciário “Ver guia de operação fiscal” (`cadastroFiscalDocHref`); teste `FR-ORQ-CERT-07` cobre Consultar + Atualizar cadastro (e PATCH emitente) **sem** usar o CTA “Concluir configuração fiscal”, com `invalidateMeiEmpresaGetCache` para não servir cache de `sessionStorage` e mascarar `consultarEmpresaEmissaoNf`.

### File List

- `frontend/src/utils/plugnotasEmitenteSetup.ts`  
- `frontend/src/utils/plugnotasEmitenteSetup.test.ts`  
- `frontend/src/pages/GuidesMei.tsx`  
- `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`  

### Change Log

| Data | Nota |
|------|------|
| 2026-04-07 | Story criada pelo SM (River) a partir do PRD ORQ-CERT + UX + arquitetura. |
| 2026-04-07 | Implementação P0 (Dex): fases, retry empresa, CTA e testes; gates verdes. |
| 2026-04-07 | Resposta QA: link guia §5.4 no banner retry; teste regressão FR-ORQ-CERT-07 (consulta/atualizar/PATCH sem CTA); `lint` / `typecheck` / `npm test` na raiz verdes. |

---

## Checklist DoD (story)

- [ ] Todos os critérios de aceite marcados.  
- [x] File list actualizada.  
- [x] Gates verdes.  
- [ ] Sem regressão em `PATCH` / consulta emitente.

---

## QA Results

### Revisão 2026-04-07 — Quinn (@qa)

**Decisão de gate:** **PASS com ressalvas** (código e testes alinhados à story; pendências abaixo não bloqueiam merge desde que aceites pela equipa).

**Evidência recolhida**

- Leitura de: `frontend/src/utils/plugnotasEmitenteSetup.ts`, `frontend/src/utils/plugnotasEmitenteSetup.test.ts`, `frontend/src/pages/GuidesMei.tsx` (fluxo certificado, `handleRetryPlugnotasEmpresaRegistro`, UI de progresso/banner/CTA), `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx`.
- Comando: `npm run test --workspaces --if-present` na raiz do repositório — **exit 0** na data desta revisão.

**Rastreio critérios de aceite (requisito → verificação)**

| ID | Veredito | Como foi verificado |
|----|----------|---------------------|
| FR-ORQ-CERT-01 | OK | `plugnotasPrimaryActionEnabled` / `plugnotasPrimaryDisabledHint` combinam ficheiro, senha, `getNfEmissionCompanyValidationMessage`, `getDocumentosAtivosValidationMessage` e CNPJ 14 dígitos quando `canViewNfse`. |
| FR-ORQ-CERT-02 | OK | `submitPlugnotasEmitenteSetup` chama certificado e, com `id`, monta empresa via `buildCompanyPayload(certificadoId)` → `buildNfEmissionEmpresaPayload`. |
| FR-ORQ-CERT-03 | OK | Bloco de progresso com copy da spec (§5.1 / §7) e `role="status"` + `aria-live="polite"`. |
| FR-ORQ-CERT-04 | OK | Sucesso com mensagem principal canónica em `certificateSuccess.primary`; detalhe em `secondary` (documentos ativos / PATCH) separado. |
| FR-ORQ-CERT-05 | OK | Estado `plugnotasPendingRetry` + banner alinhado ao tom §5.4; ação primária “Tentar registrar empresa novamente” chama só `retryPlugnotasEmpresaRegistro` com `certificadoId` em memória e formulário atual; teste `FR-ORQ-CERT` garante 1× certificado / 2× empresa. |
| FR-ORQ-CERT-06 | OK | `finalizePlugnotasEmpresaCadastroSuccess` usa variante quando `certificateRecoveredFrom409`. |
| FR-ORQ-CERT-07 | OK | Revisão estática: fluxos “Consultar cadastro no emissor” e “Atualizar cadastro (sem novo certificado)” permanecem com handlers próprios; não exigem o novo CTA. |
| FR-ORQ-CERT-08 | OK | `documentosAtivos` passado a `buildNfEmissionEmpresaPayload` no envio completo e no retry. |
| Extrair módulo + `phase` | OK | `plugnotasEmitenteSetup.ts` + `PlugnotasEmitenteSetupError`. |
| CTA + linha de ajuda | OK | Rótulo “Concluir configuração fiscal” + hint sob botão desabilitado; `title` de apoio. |
| NFR-ORQ-CERT-03 | OK | Botão desabilitado quando `!plugnotasPrimaryActionEnabled`; `aria-busy` durante upload/retry empresa. |
| NFR-ORQ-CERT-01 | OK | `certificadoId` só em `useState` / retry; não há persistência em `localStorage` (apenas workspace MEI já existente). |
| Testes story | OK | Unitários do util; extensão dos testes de certificado/conectividade + caso retry. |
| Gates AGENTS | OK | Testes workspace verdes nesta execução; lint/typecheck assumidos verdes na entrega @dev (re-executar antes de merge se necessário). |

**Ressalvas (não bloqueantes)**

1. **DoD:** o item “Sem regressão em PATCH / consulta emitente” continua por marcar no corpo da story; não há teste automatizado dedicado *nesta* story que prove regressão zero — recomenda-se **smoke manual** ou teste de regressão explícito noutro ficheiro/PR.
2. **CodeRabbit:** não foi executado nesta revisão (ferramenta WSL/CLI); alinhar com prática do repo antes do merge.
3. **UX opcional:** a ajuda terciária com link para guia de operação fiscal (spec UX, elemento opcional em §5.4) **não** está na UI; validar com PO se quiserem no P0.

**Sugestão de follow-up (P1 / dívida)**

- Teste de fumo mínimo que garanta que, com `canViewNfse`, os botões “Consultar cadastro no emissor” e “Atualizar cadastro (sem novo certificado)” permanecem clicáveis e disparam os mocks esperados sem depender do CTA “Concluir configuração fiscal”.
