# Story — FR-TIBGE (P1): Detecção **TIBGE-L1** (`codigoIBGECidade`), hint **FR-CID-UX-02** e testes

**ID:** STORY-FR-TIBGE-P1-EMPRESA-IBGE-TABELA-MENSAGEM-HINT  
**Prioridade:** P1  
**Depende de:** Nenhuma (complementa **FR-CID** / normalização já entregue ou em curso; não requer novo payload).  
**Relaciona com:** [story-fr-sol-p0-plugnotas-encadeamento-post-404-get-empresa-ux.md](./story-fr-sol-p0-plugnotas-encadeamento-post-404-get-empresa-ux.md) — mesmo fluxo Guia MEI; hint TIBGE é **ortogonal** ao painel SOL.  
**Fonte PRD:** [`docs/prd/PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`](../prd/PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md) — **FR-TIBGE-UX-01**, **FR-TIBGE-QA-01**, **NFR-TIBGE-02**, **NFR-TIBGE-04**  
**UX:** [`docs/specs/ux-spec-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`](../specs/ux-spec-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md) — **TIBGE-L1** §3.1, prioridade §3.2, contrato §6  
**Arquitetura:** [`docs/technical/architecture-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`](../technical/architecture-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md) — §2, §3.1–3.2, §5

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — heurística FE vs exclusões PREF; @ux-design-expert — copy `MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT` inalterada salvo decisão PO |

---

## User story

**Como** MEI que tenta registar a empresa no emissor fiscal,  
**quando** o Plugnotas devolve erro citando **`codigoIBGECidade`** ou falha na **tabela de cidades** IBGE,  
**quero** ver o hint de verificação do código/município (FR-CID-UX-02) como nas outras mensagens IBGE,  
**para** saber que devo conferir os 7 dígitos e o endereço sem interpretar o erro como “prefeitura” ou bug só do GET.

---

## Contexto

- A mensagem do emissor pode usar **`fields.endereco.codigoIBGECidade`**; o payload da app continua só com **`endereco.codigoCidade`** (**NFR-TIBGE-02**).  
- `isPlugnotasEmpresaIbgeCidadeMessage` hoje pode **não** captar `codigoibgecidade` após `normalizeForMatch` — alargar conforme spec UX §3.1 (A) e arquitetura §3.1.  
- `getPlugnotasEmpresaCadastroErrorUxVariant` mantém ordem **PREF-L1** primeiro; hint IBGE é **independente** (spec UX §3.2).  
- Teste **negativo:** mensagem só `nfse.config.prefeitura` **sem** sinais TIBGE não deve passar a ser “hint IBGE” por engano.

---

## Critérios de aceite

### Produto / UX

- [ ] Mensagem sintética contendo *«fields.endereco.codigoIBGECidade»* e texto de falha na tabela IBGE faz `isPlugnotasEmpresaIbgeCidadeMessage` retornar **true** (TIBGE-L1).  
- [ ] `FiscalIntegrationErrorAlert` e/ou painéis de cadastro empresa em `GuidesMei` que já usam o hint **mostram** `MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT` quando a mensagem satisfaz a regra acima.  
- [ ] Variante **prefeitura-config** não é **substituída** pelo hint; composição conforme spec UX §3.2 (revisão rápida com UX se caso híbrido aparecer em QA).

### Técnico

- [ ] **NFR-TIBGE-02:** Nenhum `POST`/`PATCH` empresa envia campo duplicado `codigoIBGECidade` — confirmar por revisão de `nfEmissionCompany.ts` / BFF (só `codigoCidade`).  
- [ ] **FR-TIBGE-QA-01:** Testes em `nfseNacionalPlugnotasErrorHints.test.ts` (ou ficheiro existente) com exemplo do PRD/brief; teste(s) de componente em `FiscalIntegrationErrorAlert.test.tsx` e/ou painel cadastro **se** já houver padrão para FR-CID-UX-02.  
- [ ] Teste negativo: mensagem PREF-L1 pura (sem TIBGE) — `isPlugnotasEmpresaIbgeCidadeMessage` **false** **ou** hint não exibido conforme matriz existente.  
- [ ] Gates: `npm run lint`, `npm run typecheck`, `npm test`.

### Fora desta story

- Documentação operacional extensa e runbook — [story-fr-tibge-p1-operacao-mei-nfse-tibge-doc-runbook.md](./story-fr-tibge-p1-operacao-mei-nfse-tibge-doc-runbook.md).  
- Log backend **FR-TIBGE-OBS-01** — [story-fr-tibge-p2-plugnotas-empresa-400-ibge-log.md](./story-fr-tibge-p2-plugnotas-empresa-400-ibge-log.md).

---

## Tasks (indicativas)

1. [x] Alargar `isPlugnotasEmpresaIbgeCidadeMessage` em `nfseNacionalPlugnotasErrorHints.ts` (substrings `codigoibgecidade`, `fields.endereco.codigoibgecidade`).  
2. [x] Actualizar comentário JSDoc com referência à spec UX TIBGE e PRD.  
3. [x] Adicionar testes unitários (mensagem realista do brief).  
4. [x] Verificar consumidores (`FiscalIntegrationErrorAlert`, painéis Guia MEI) — regressão visual/RTL mínima.  
5. [x] Correr gates; preencher **File list** e **Dev Agent Record**.

---

## File list (indicativo)

- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`  
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`  
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx` *(se precisar de ajuste de condição)*  
- `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx` *(e/ou ficheiro de teste do painel cadastro)*  
- `frontend/src/pages/GuidesMei.tsx` *(só se integração do hint depender de props novas)*

---

## CodeRabbit Integration

- Focar: exclusões `inscricaoMunicipal` / comentários existentes; não alargar regex de forma a disparar hint em erros NFC-e-only ou PREF puro; paridade de `normalizeForMatch`.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### File list

- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`
- `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`
- `frontend/src/utils/nfEmissionCompany.test.ts`

### Notes

- **TIBGE-L1:** `isPlugnotasEmpresaIbgeCidadeMessage` reconhece `codigoibgecidade` após `normalizeForMatch` (mensagens com `fields.endereco.codigoIBGECidade`). Ramo integrado em `hasCodigoIbgeMunicipio` com `m.includes('codigoibgecidade')`; consumidores existentes (`PlugnotasIbgeCidadeOperacaoHint` em `FiscalIntegrationErrorAlert`) passam a mostrar `MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT` sem alteração de JSX.
- **NFR-TIBGE-02:** teste em `nfEmissionCompany.test.ts` garante ausência de `codigoIBGECidade` em `endereco`; payload continua só `codigoCidade`. BFF `empresa.service.js` já normaliza `endereco.codigoCidade` (sem campo duplicado).
- **Gates:** `npm run lint`, `npm run typecheck`, `npm test` (raiz) — OK.
- **CodeRabbit:** markdown/TS — revisão automática opcional em WSL; não bloqueante para esta entrega.
- **Seguimento QA (nota híbrido PREF+TIBGE):** teste de regressão em `FiscalIntegrationErrorAlert.test.tsx` — mensagem com `fields.nfse.config.prefeitura` **e** `fields.endereco.codigoIBGECidade`/tabela IBGE confirma `MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT` **e** bloco **prefeitura-config** (hint IBGE não substitui PREF).

---

## Change log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-09 | @sm (River) | Story inicial a partir do PRD TIBGE, spec UX e arquitetura. |
| 2026-04-09 | @dev | TIBGE-L1 em `isPlugnotasEmpresaIbgeCidadeMessage`; testes unitários + alert/painel; NFR-TIBGE-02 em `nfEmissionCompany.test.ts`. |
| 2026-04-09 | @dev | Seguimento QA: teste híbrido PREF-L1 + TIBGE em `FiscalIntegrationErrorAlert.test.tsx`. |

---

## QA Results

### 2026-04-09 — Quinn (@qa) — revisão FR-TIBGE-UX-01 / FR-TIBGE-QA-01 / NFR-TIBGE-02

**Decisão de gate:** **PASS**

**Evidência revista (código + testes):**

| Critério (story) | Verificação | Resultado |
|------------------|-------------|-----------|
| TIBGE-L1: mensagem com `fields.endereco.codigoIBGECidade` + falha tabela IBGE → `isPlugnotasEmpresaIbgeCidadeMessage` **true** | `hasCodigoIbgeMunicipio` inclui `m.includes('codigoibgecidade')` com `m.includes('ibge')`; casos sintéticos em `nfseNacionalPlugnotasErrorHints.test.ts` | **PASS** |
| `FiscalIntegrationErrorAlert` / painel cadastro mostram `MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT` | `PlugnotasIbgeCidadeOperacaoHint` inalterado; testes `FR-TIBGE-UX-01` em `FiscalIntegrationErrorAlert.test.tsx` (emissão + `GuiaMeiEmpresaCadastroErrorPanel`) | **PASS** |
| Variante **prefeitura-config** não é substituída; hint IBGE ortogonal | `getPlugnotasEmpresaCadastroErrorUxVariant` inalterado (PREF-L1 primeiro); hint IBGE é bloco separado (`role="note"`); teste existente PREF sem hint IBGE + teste composto CID+PREF na suite de hints | **PASS** |
| **NFR-TIBGE-02:** sem `codigoIBGECidade` duplicado em `endereco` | `nfEmissionCompany.test.ts` — `not.toHaveProperty('codigoIBGECidade')` e chaves sem `codigoibge` no nome; payload só `codigoCidade` | **PASS** |
| **FR-TIBGE-QA-01:** testes unitários + componente | Ficheiros indicados no Dev Agent Record com exemplos alinhados ao brief | **PASS** |
| Teste negativo PREF-L1 puro | Matriz `isPlugnotasEmpresaIbgeCidadeMessage` com `fields.nfse.config.prefeitura` → **false**; `FiscalIntegrationErrorAlert.test` «mensagem só prefeitura» sem hint IBGE | **PASS** |

**Gates (re-execução QA):** `npm run typecheck` (workspaces) — OK; `vitest` em `nfseNacionalPlugnotasErrorHints.test.ts`, `FiscalIntegrationErrorAlert.test.tsx`, `nfEmissionCompany.test.ts` — **81** testes OK.

**Notas (não bloqueantes):**

- Caso **híbrido** PREF + TIBGE em produção: a story pede revisão UX se surgir em QA manual — monitorizar após merge; comportamento actual permite hint IBGE + bloco municipal (não exclusivo).

**Recomendação:** aprovar merge do ponto de vista de qualidade; @sm/@po podem marcar checkboxes dos critérios de aceite após alinhamento administrativo.

