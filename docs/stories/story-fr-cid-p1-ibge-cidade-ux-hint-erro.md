# Story — FR-CID (P1): UX — *hint* campo IBGE e linha de ajuda no erro **tabela de cidades**

**ID:** STORY-FR-CID-P1-IBGE-UX-HINT  
**Prioridade:** P1  
**Depende de:** [story-fr-cid-p0-ibge-cidade-plugnotas-normalizacao.md](./story-fr-cid-p0-ibge-cidade-plugnotas-normalizacao.md) (normalização técnica estável; mensagens do BFF mantêm-se comparáveis)  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](../prd/PRD-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md) — **FR-CID-UX-02** (opcional no PRD; **obrigatório** nesta story se PO marcar entrega P1)  
**UX:** [`docs/specs/ux-spec-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](../specs/ux-spec-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md) — §3.2 **CID-L1** / **CID-L2**, §4 (microcopy campo e prestador), §5.2 (A11y), §6.2 (hint alerta), §8 (rastreio PRD)  
**Arquitetura:** [`docs/technical/architecture-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](../technical/architecture-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md) — §5 (ordem: PREF-L1 vs IBGE), §4.1 (ficheiros hint / alerta)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @ux-design-expert — copy final dos textos sugeridos na spec; @architect — heurística `isPlugnotasEmpresaIbgeCidadeMessage` sem colidir com [story-fr-pref-p0-plugnotas-prefeitura-config-ux-variant-im-hint.md](./story-fr-pref-p0-plugnotas-prefeitura-config-ux-variant-im-hint.md) |

---

## User story

**Como** MEI que vê um erro do emissor fiscal relacionado ao **código IBGE da cidade**,  
**quero** ter texto de apoio junto ao campo e, quando aplicável, uma linha extra no alerta que me oriente a verificar município e cadastro,  
**para** distinguir este caso de outros erros municipais (ex.: prefeitura no NFS-e) e saber o que conferir sem ler mensagens técnicas.

---

## Contexto

- **FR-CID-UX-02:** linha secundária no cartão fiscal quando a mensagem indicar falha na **tabela IBGE** / **`codigoCidade`** (spec UX §6.2 — texto aprovado por PO/UX).  
- **CID-L2:** se a mensagem for só **PREF-L1** (`nfse.config.prefeitura`) **sem** menção a `endereco` / tabela IBGE, **não** mostrar o hint IBGE (arquitetura §5).  
- **Hint do campo (spec UX §4.1 P1):** uma linha `text-xs` sob *Código IBGE cidade* + `aria-describedby`; paridade opcional com prestador/prestação (§4.2).  
- **Validação local “comprimento ≠ 7” (spec UX §4.1 P2):** **fora** desta story salvo decisão PO explícita (risco com padding **PRD** §6.2).

---

## Critérios de aceite

### Produto / UX

- [ ] **FR-CID-UX-02:** Quando `isPlugnotasEmpresaIbgeCidadeMessage(message)` for verdadeiro **e** a ordem **CID-L1** > **CID-L2** for respeitada (arquitetura §5), mostrar linha secundária conforme spec UX §6.2 (variante longa ou curta acordada com PO).  
- [ ] Mensagem só **prefeitura/config NFS-e** (`isPlugnotasNfseConfigPrefeituraRequirementMessage` **sem** substring de `endereco.codigoCidade` / tabela IBGE) **não** dispara hint IBGE.  
- [ ] *Hint* sob o campo emitente (spec UX §4.1); prestador/prestação alinhados se já existirem inputs equivalentes (§4.2).  
- [ ] A11y: `aria-describedby` / região coerente com spec UX §5.2; sem duplicar o mesmo texto em dois alertas idênticos sem necessidade.

### Técnico / qualidade

- [ ] Função pura `isPlugnotasEmpresaIbgeCidadeMessage` (novo módulo ou extensão de `nfseNacionalPlugnotasErrorHints.ts`) com **fixtures** de mensagens reais/simuladas em português (tabela de cidades, `endereco.codigoCidade`, `IBGE`).  
- [ ] Integração em `FiscalIntegrationErrorAlert` e/ou painéis Guia MEI que mostram erro de cadastro empresa (orquestração).  
- [ ] Testes unitários para matriz positiva/negativa (incl. caso “prefeitura only” → sem hint IBGE).  
- [ ] Gates: `npm run lint`, `npm run typecheck`, `npm test`.

### Fora desta story

- Alterar normalização **FR-CID-PAY-01** (story P0).  
- Novo catálogo IBGE ou lookup automático.

---

## Tasks (indicativas)

1. [x] Implementar `isPlugnotasEmpresaIbgeCidadeMessage` + testes (ordem com `isPlugnotasNfseConfigPrefeituraRequirementMessage`).  
2. [x] Acrescentar *slot* ou prop ao alerta fiscal / painéis Guia MEI para linha §6.2.  
3. [x] Adicionar *hint* campo + `aria-describedby` em `GuidesMei.tsx` (emitente; prestador/prestação se aplicável).  
4. [x] Gates + **File list** / **Dev Agent Record**.

---

## File list (indicativo)

- [x] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` *(função + constantes de copy FR-CID)*  
- [x] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`  
- [x] `frontend/src/components/FiscalIntegrationErrorAlert.tsx`  
- [x] `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`  
- [x] `frontend/src/pages/GuidesMei.tsx`

---

## CodeRabbit Integration

- Focar: falsos positivos na heurística; acessibilidade; não confundir utilizador entre IM, prefeitura e código IBGE.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### Agent Model Used

Cursor agent (implementação)

### Completion Notes

- `isPlugnotasEmpresaIbgeCidadeMessage` + constantes `MEI_IBGE_*` em `nfseNacionalPlugnotasErrorHints.ts` (CID-L1: `endereco.codigoCidade`, tabela+cidades+IBGE, `codigoCidade`/`codigo IBGE`+IBGE); matriz de testes + caso composto prefeitura+código IBGE.
- `PlugnotasIbgeCidadeOperacaoHint` em `FiscalIntegrationErrorAlert.tsx` — `EmissaoFiscalErrorAlert`, `PlugnotasIntegrationErrorAlert`, `EmissaoFiscalErrorAlertModal`, `GuiaMeiEmpresaCadastroErrorPanel` (copy spec UX §6.2, `role="note"`).
- Guia MEI: hint §4.1 emitente (`mei-emitente-codigo-ibge-cidade` + `aria-describedby`); prestador e prestação §4.2 (`MEI_IBGE_CIDADE_PRESTACAO_PRESTADOR_FIELD_HINT`).
- Gates: `npm run lint`, `npm run typecheck`, `npm test` — exit 0.
- **Follow-up pós-QA (2026-04-08):** `hasTabelaIbge` deixou de usar `m.includes('municip')` (falso positivo com `inscricaoMunicipal`); passa a exigir `municipio` ou `municipios`. Testes: regressão negativa (tabela IBGE + inscricaoMunicipal) e positiva (tabela de municípios IBGE).

### File List

- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`

### Change Log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | @sm | Story criada (FR-CID-UX-02 + spec UX campo/alerta). |
| 2026-04-08 | @dev | Implementação FR-CID P1 (hint campo + alerta + heurística + testes). |
| 2026-04-08 | @dev | Follow-up QA: estreitar `hasTabelaIbge` (`municipio`/`municipios` vs `municip`) + testes. |

---

## QA Results

*(preencher por @qa após implementação)*

### 2026-04-08 — Revisão @qa (Quinn)

**Decisão de gate:** **PASS**

**Evidência — gates:** `npm run lint`, `npm run typecheck`, `npm test` — exit 0 (reexecutados na revisão).

**Rastreio aos critérios**

| ID / tema | Verificação |
|-----------|-------------|
| **FR-CID-UX-02** | `PlugnotasIbgeCidadeOperacaoHint` em `FiscalIntegrationErrorAlert.tsx` mostra `MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT` (texto alinhado à spec UX §6.2, variante longa) quando `isPlugnotasEmpresaIbgeCidadeMessage(message)` é verdadeiro. Integrado em `EmissaoFiscalErrorAlert`, `PlugnotasIntegrationErrorAlert`, `EmissaoFiscalErrorAlertModal` e `GuiaMeiEmpresaCadastroErrorPanel`. |
| **CID-L2 / só prefeitura** | Mensagens PREF-L1 típicas **não** contêm sinais CID-L1 (`endereco.codigoCidade`, tabela+cidades+IBGE, `codigoCidade`+IBGE, etc.) → heurística falsa; coberto por testes em `nfseNacionalPlugnotasErrorHints.test.ts` e `FiscalIntegrationErrorAlert.test.tsx` (painel + emissão). |
| **CID-L1 > L2 composto** | Teste dedicado: mensagem com prefeitura **e** `fields.endereco.codigoCidade` → `isPlugnotasEmpresaIbgeCidadeMessage` verdadeiro (hint IBGE permitido). |
| **Hint campo §4.1 / §4.2** | `GuidesMei.tsx`: emitente com `text-xs`, `aria-describedby` e `id` estáveis; prestador (`htmlFor`/`id`) e prestação com hint curto §4.2. |
| **A11y §5.2** | `aria-describedby` nos inputs IBGE; hint de alerta com `role="note"`. O texto do alerta IBGE **não** é o mesmo que o bloco NFS-e Nacional / prefeitura — conteúdos distintos quando ambos aparecem (aceitável face à spec). |
| **Função pura + fixtures PT** | `isPlugnotasEmpresaIbgeCidadeMessage` em `nfseNacionalPlugnotasErrorHints.ts` com matriz PT (tabela IBGE, `endereco.codigoCidade`, `codigoCidade`+IBGE, negativos). |
| **Integração painel Guia MEI** | `GuiaMeiEmpresaCadastroErrorPanel` inclui o hint após `LongFiscalErrorMessage`. |

**Observações (não bloqueantes)**

1. **Heurística:** `hasTabelaIbge` usa `m.includes('municip')`; em teoria uma mensagem muito rara poderia juntar «tabela», «ibge» e «municip…» sem ser erro de código de cidade — probabilidade baixa; monitorizar com mensagens reais de produção.  
2. **CodeRabbit (WSL):** não executado nesta revisão; recomendado no fluxo de merge/CI quando disponível.  
3. **Critérios de aceite** no corpo da story podem permanecer por marcar por ritual DoD/PO; o rastreio acima cobre o conteúdo.

**Sugestão @ux-design-expert (opcional):** validação final de tom/copy nos dois temas (claro/escuro) na UI real, se ainda não feita.
