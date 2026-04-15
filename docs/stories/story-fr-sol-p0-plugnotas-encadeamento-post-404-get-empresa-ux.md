# Story — FR-SOL (P0): Encadeamento **POST** falhou → **GET** 404 — estado UX, copy e doc operação

**ID:** STORY-FR-SOL-P0-POST-404-GET-EMPRESA-UX  
**Prioridade:** P0  
**Depende de:** [story-fr-pref-p0-plugnotas-prefeitura-config-ux-variant-im-hint.md](./story-fr-pref-p0-plugnotas-prefeitura-config-ux-variant-im-hint.md) (variante `prefeitura-config` e copy PREF-L1; esta story **compõe** encadeamento SOL **depois** do bloco PREF quando aplicável).  
**Bloqueia:** [story-fr-sol-p1-plugnotas-empresa-fase2-falha-session-l2.md](./story-fr-sol-p1-plugnotas-empresa-fase2-falha-session-l2.md) (SOL-L2 com `sessionStorage`).  
**Fonte PRD:** [`docs/prd/PRD-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](../prd/PRD-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) — **FR-SOL-DIAG-01**, **FR-SOL-404-01** (parcial sem L2 persistente), **FR-SOL-ANT-01**, **FR-SOL-PLAY-01**, **FR-SOL-DIAG-02** (verificação em QA)  
**UX:** [`docs/specs/ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](../specs/ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) — secções 2–7, 9 (wireframes), 10 (QA) — estados **SOL-L1**, **SOL-L3**; composição com PREF secção 5.3  
**Arquitetura:** [`docs/technical/architecture-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](../technical/architecture-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) — §2 (modelo estado; **sem** `sessionPostFailedFlag` verdadeiro até P1), §4–5, §5.2

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — superfície `nfseNacionalPlugnotasErrorHints` / novo módulo SOL; @ux-design-expert — copy final vs spec |

---

## User story

**Como** MEI no Guia MEI (registro da empresa no emissor),  
**quando** o **POST** de cadastro falha e a **consulta** (`GET` empresa) indica que a empresa não foi encontrada,  
**quero** ver uma explicação que ligue os dois acontecimentos e próximos passos claros (sem culpar o CNPJ sem contexto),  
**para** não pensar que “só a consulta está partida” nem repetir apenas o **GET** esperando sucesso.

---

## Contexto

- O **404** no `GET` é **compatível** com cadastro **nunca** criado no Plugnotas após **POST** falhado (PRD §1–2; arquitetura §1.1).  
- A spec UX distingue **SOL-L1** (painel POST visível + consulta *not found*), **SOL-L3** (consulta *not found* sem evidência de falha recente), e **SOL-L2** (falha recente **sem** painel visível — **P1** com `sessionStorage`).  
- **Composição com PREF:** se `getPlugnotasEmpresaCadastroErrorUxVariant === 'prefeitura-config'`, mostrar **primeiro** copy PREF (spec PREF §5.1), **depois** encadeamento SOL (spec SOL §4.1 ou §4.2) **sem** repetir o mesmo parágrafo (spec SOL §5.3).  
- **Antipadrões** de linguagem: spec SOL §6 / PRD **FR-SOL-ANT-01** — não usar como mensagem principal (HTTP cru, “CNPJ inválido” isolado no setup, promessa absoluta de nacional, etc.).  
- **Playbook** utilizador (3 passos): spec SOL §7 (**FR-SOL-PLAY-01**) — opcional `details` / tooltip / link “O que fazer agora?”.

---

## Critérios de aceite

### Produto / UX

- [ ] **SOL-L1:** Com painel de erro do POST empresa ainda visível e mensagem de consulta que satisfaça `isPlugnotasEmpresaConsultNotFoundMessage`, o utilizador vê bloco de encadeamento conforme spec SOL **secção 4.1** (título + corpo) **ou** linha compacta **secção 4.2** quando a UI já estiver densa — aprovado em revisão UX.  
- [ ] **SOL-L3:** Com `GET` / estado equivalente a “empresa não encontrada” **e** **sem** flag de sessão P1 e **sem** painel de erro POST visível, copy neutra spec SOL **secção 5.2** (título + corpo).  
- [ ] **PREF + SOL:** Com variante `prefeitura-config`, ordem de blocos conforme spec SOL **secção 5.3** (PREF primeiro, SOL encadeamento depois, sem duplicação).  
- [ ] **FR-SOL-PLAY-01:** Bloco opcional de “primeiros passos” (3 itens) alinhado à spec SOL **secção 7**, acessível sem poluir o fluxo (ex.: `details` ou link).  
- [ ] **A11y:** região com título ou `aria-label` para bloco SOL novo; não triplicar `role="alert"` com o mesmo texto (spec SOL §2).

### Técnico

- [ ] Introduzir função pura `resolvePlugnotasEmpresaCadastroSolUxState` (ou nome acordado) com contrato alinhado à arquitetura §2 — entradas incluem `sessionPostFailedFlag: false` fixo nesta story (L2 fica para P1).  
- [ ] Integrar resolução de estado e copy em `GuidesMei.tsx` e/ou componente dedicado (nome livre, ex. banner SOL).  
- [ ] **FR-SOL-DIAG-01** + **FR-SOL-ANT-01:** Actualizar `docs/operacao-mei-nfse.md` com secção ou bullets sobre encadeamento POST → GET 404, antipadrões (IM ≠ `nfse.config.prefeitura`, repetir só GET, `nacional` não garante todas as contas), âncora sugerida `#cadastro-post-404-get-empresa`, links ao PRD SOL e spec UX SOL.  
- [ ] Regressão: `withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable` e fluxos PREF existentes permanecem verdes (testes).  
- [ ] Gates: `npm run lint`, `npm run typecheck`, `npm test`.

### Fora desta story

- Flag `mei:empresaFase2Fail:v1` e comportamento **SOL-L2** após reload — [story-fr-sol-p1](./story-fr-sol-p1-plugnotas-empresa-fase2-falha-session-l2.md).  
- Alteração de payload `nfse.config.prefeitura` — [story-fr-pref-p1](./story-fr-pref-p1-plugnotas-nfse-config-prefeitura-payload-bcd.md).

---

## Tasks (indicativas)

1. [x] Criar módulo (ex. `frontend/src/utils/plugnotasEmpresaCadastroSolUx.ts`) com `resolvePlugnotasEmpresaCadastroSolUxState` + testes unitários (matriz L0, L1, L3 com `sessionPostFailedFlag: false`).  
2. [x] Implementar componente ou fragmento de UI para copy SOL-L1 / SOL-L3 / playbook (spec SOL §4–5, §7).  
3. [x] Integrar em `GuidesMei.tsx` com sinais reais: último POST fase 2, visibilidade painel erro, `isPlugnotasEmpresaConsultNotFoundMessage` sobre mensagem formatada de consulta.  
4. [x] Garantir composição PREF → SOL para `prefeitura-config`.  
5. [x] Actualizar `docs/operacao-mei-nfse.md` (**FR-SOL-DIAG-01**, **FR-SOL-ANT-01**).  
6. [x] Testes RTL mínimos: cenário SOL-L3 (404 frio); cenário SOL-L1 simulado (mocks) se viável.  
7. [x] Correr gates; preencher **File list** e **Dev Agent Record**.

---

## File list (indicativo)

- [x] `frontend/src/utils/plugnotasEmpresaCadastroSolUx.ts` *(novo)*  
- [x] `frontend/src/utils/plugnotasEmpresaCadastroSolUx.test.ts` *(novo)*  
- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `frontend/src/components/PlugnotasEmpresaCadastroSolContextPanel.tsx` *(novo)*  
- [x] `frontend/src/components/PlugnotasEmpresaCadastroSolContextPanel.test.tsx` *(novo)*  
- [ ] `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx` *(não alterado; testes SOL em ficheiro dedicado)*  
- [x] `docs/operacao-mei-nfse.md`

---

## CodeRabbit Integration

- Focar: ordem PREF vs SOL; ausência de antipadrões spec SOL §6 em *strings* visíveis; função pura bem testada; sem gravar PII extra em storage nesta story.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### File list

- `frontend/src/utils/plugnotasEmpresaCadastroSolUx.ts`
- `frontend/src/utils/plugnotasEmpresaCadastroSolUx.test.ts`
- `frontend/src/components/PlugnotasEmpresaCadastroSolContextPanel.tsx`
- `frontend/src/components/PlugnotasEmpresaCadastroSolContextPanel.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`
- `docs/operacao-mei-nfse.md`

### Notes

- Testes do painel SOL usam `createRoot` + `container.textContent` (Vitest/jsdom sem `@testing-library/jest-dom` para `toBeInTheDocument`).
- Gates na raiz: `npm run lint`, `npm run typecheck`, `npm test` — todos OK (2026-04-08).
- **Follow-up QA (obs. não bloqueantes):** `plugnotasEmpresaFase2PostOk` em `GuidesMei.tsx` alimenta `lastPostEmpresaPhase2Ok` no resolver (`true` após `finalizePlugnotasEmpresaCadastroSuccess`, `false` ao entrar em retry empresa, `null` ao reiniciar fluxo certificado / conectividade). Testes RTL adicionais: painel **L2** e **L0**. Copy UX formal e CodeRabbit em WSL permanecem recomendações de processo (QA Results).

---

## Change log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | @sm (River) | Story inicial a partir do PRD SOL, spec UX SOL e arquitetura SOL. |
| 2026-04-08 | @dev | Implementação P0: util SOL, painel, integração `GuidesMei`, doc operação; testes; gates OK. |
| 2026-04-08 | @dev | Pós-QA: sinal `lastPostEmpresaPhase2Ok` via `plugnotasEmpresaFase2PostOk`; testes L0/L2 no painel SOL. |

---

## QA Results

### 2026-04-08 — Quinn (@qa) — revisão pós-implementação

**Decisão de gate:** **PASS**

**Evidência (CLI):** `npm run lint`, `npm run typecheck` e `npm test` na raiz do repositório — concluídos com sucesso nesta revisão.

**Rastreio aos critérios de aceite (verificação estática + testes):**

| Critério | Resultado | Notas |
|----------|-----------|--------|
| SOL-L1 (§4.1 / §4.2) | **PASS** | `postErrorPanelVisible` derivado de `plugnotasPendingRetry`; no DAS, painel vermelho (`GuiaMeiEmpresaCadastroErrorPanel`) seguido de `PlugnotasEmpresaCadastroSolContextPanel` com playbook; no feedback compacto da emissão NFSe, `compact` + `showPlaybook={false}` (§4.2). |
| SOL-L3 (§5.2) | **PASS** | Sem retry pendente + `isPlugnotasEmpresaConsultNotFoundMessage` → resolver devolve L3; copy alinhada às constantes `PLUGNOTAS_SOL_L3_*`. |
| PREF → SOL (§5.3) | **PASS** | Bloco âmbar de retry (com PREF em `prefeitura-config`) renderiza **antes** do bloco `nfEmissionCompanySyncError` que inclui painel SOL (`GuidesMei.tsx`). |
| FR-SOL-PLAY-01 (§7) | **PASS** | `SolPlaybookDetails`: `<details>` com resumo “O que fazer agora?”, lista ordenada de 3 passos e link ao guia de operação. |
| A11y (§2) | **PASS** | Painel SOL em modo expandido: `role="region"` + `aria-label` por estado; modo compacto: `role="status"`. Não duplica `role="alert"` do painel de erro principal. |
| Função pura + contrato P0 | **PASS** | `resolvePlugnotasEmpresaCadastroSolUxState` com `sessionPostFailedFlag: false` na página; testes em `plugnotasEmpresaCadastroSolUx.test.ts` cobrem L0/L1/L2/L3/none e prioridade L1 sobre L2. |
| FR-SOL-DIAG-01 / FR-SOL-ANT-01 | **PASS** | `docs/operacao-mei-nfse.md` com âncora `#cadastro-post-404-get-empresa`, encadeamento POST→GET 404 e antipadrões; ligações ao PRD/spec/arquitetura SOL. |
| Regressão prefix consulta / PREF | **PASS** | Gates completos verdes; não foi detectada remoção de `withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable` nos fluxos analisados. |

**Testes de componente:** `PlugnotasEmpresaCadastroSolContextPanel.test.tsx` cobre L3, L1 (título), `none` e compact — padrão `createRoot` + `textContent` coerente com o resto do frontend (sem `jest-dom`).

**Observações (não bloqueantes):**

1. Em `GuidesMei.tsx`, `lastPostEmpresaPhase2Ok` está sempre `null`; o ramo **L0** do resolver não é exercido pela página até haver sinal explícito de POST fase 2 — coerente com o âmbito P0 e com L2 reservado à story P1.
2. UI e ramos **L2** existem no componente/resolver; ativação com `sessionPostFailedFlag: true` fica para [story-fr-sol-p1](./story-fr-sol-p1-plugnotas-empresa-fase2-falha-session-l2.md).
3. Revisão formal de copy frente à spec UX continua recomendada à persona indicada na story (**@ux-design-expert**).
4. **CodeRabbit** (CLI em WSL, conforme integração AIOX) **não** foi executado nesta sessão; recomenda-se correr antes do merge se o ambiente estiver disponível.

**Conclusão:** Implementação consistente com a story P0, documentação de operação e barreira de qualidade do repositório. **Aprovado para próximo passo** (merge/PR após fluxo @github-devops), salvo política interna que exija CodeRabbit ou sign-off UX explícito.
