# Story — FR-NAT (P0): Plugnotas — **mensagens** quando o emissor exige IM/prefeitura (cadastro nacional)

**ID:** STORY-FR-NAT-P0-PLUGNOTAS-ERRO-MUNICIPAL-HINTS  
**Prioridade:** P0  
**Depende de:** Fluxo de cadastro DAS + retry empresa existente; pode ser entregue em paralelo ou após [story-fr-nat-p0-guidesmei-callout-modo-nfse-nacional.md](./story-fr-nat-p0-guidesmei-callout-modo-nfse-nacional.md) (recomendado: mesma sprint para experiência coerente).  
**Bloqueia:** —  
**Fonte PRD:** — [`docs/prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](../prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) — **FR-NAT-ERR-01**; critério release 3 (PRD §10)  
**UX:** [`docs/specs/ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](../specs/ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) — secção 5 (estados de erro), §5.4 tom  
**Arquitetura:** [`docs/technical/architecture-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](../technical/architecture-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) — §3, §4.2 (função pura única), §6 testes

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — se a superfície pública de props do painel fiscal mudar de forma relevante |

---

## User story

**Como** MEI que configurou o cadastro em modo NFS-e Nacional,  
**quando** o emissor fiscal devolver erro pedindo inscrição municipal ou prefeitura,  
**quero** ver uma explicação **acionável** (painel, ambiente, suporte) e link para o guia de operação,  
**para** saber que o problema não é “falta de campo no formulário local” e qual o próximo passo.

---

## Contexto

- `shouldOfferNfseNacionalOperacaoDocHint` em `nfseNacionalPlugnotasErrorHints.ts` pode **não** disparar se a mensagem citar só `inscricaoMunicipal` / `prefeitura` sem a palavra “nacional” (lacuna documentada na arquitetura).  
- Painel âmbar de retry (`plugnotasPendingRetry`) e `GuiaMeiEmpresaCadastroErrorPanel` em `FiscalIntegrationErrorAlert.tsx` devem partilhar a **mesma** regra de detecção (**arquitetura §4.2**).  
- Copy do parágrafo condicional: spec UX §5.2; não usar jargão `POST /empresa` no título visível (§5.4).  
- Link: `getNfseNacionalOperacaoHelpHref()` e âncora `NFSE_NACIONAL_OPERACAO_DOC_ANCHOR`.

---

## Critérios de aceite

### Produto / UX

- [ ] **FR-NAT-ERR-01:** Se a mensagem de erro (raw ou já mapeada) for classificada como “exigência municipal” pela função pura acordada, mostrar parágrafo adicional conforme spec UX §5.2 + link “Ver guia de operação fiscal” (ou texto equivalente já usado no painel âmbar).  
- [ ] Classificação cobre pelo menos: `inscricaoMunicipal`, `inscrição municipal`, `prefeitura` ligada a `nfse.config` / empresa, combinações reais reportadas pelo utilizador.  
- [ ] **GuiaMeiEmpresaCadastroErrorPanel:** mesmo bloco auxiliar + link quando aplicável (spec UX §5.3) — evitar triplicar regex no `GuidesMei` apenas.  
- [ ] Manter CTA **Editar dados** sem obrigar preenchimento de campos inexistentes (spec UX §5.2).  
- [ ] `shouldOfferNfseNacionalOperacaoDocHint` continua coerente: ou absorve a nova detecção ou delega para `isPlugnotasEmpresaMunicipalRequirementMessage` (nome final a critério de @dev).

### Técnico / qualidade

- [ ] Testes unitários no módulo de hints com *strings* de exemplo (incluindo mensagem sem “nacional”).  
- [ ] Gates: `npm run lint`, `npm run typecheck`, `npm test`.  
- [ ] Comentário cruzado no ficheiro de hints apontando para `docs/operacao-mei-nfse.md` (actualização fina na story P1 de doc).

---

## Tasks (indicativas)

1. [x] Introduzir função pura `isPlugnotasEmpresaMunicipalRequirementMessage` (ou nome alinhado) + testes.  
2. [x] Integrar no painel âmbar de retry em `GuidesMei.tsx`.  
3. [x] Estender `GuiaMeiEmpresaCadastroErrorPanel` (props opcionais ou composição) em `FiscalIntegrationErrorAlert.tsx`.  
4. [x] Ajustar/merge com `shouldOfferNfseNacionalOperacaoDocHint` para não divergir.  
5. [x] Atualizar testes existentes em `FiscalIntegrationErrorAlert.test.tsx` se painel ganhar ramo novo.

---

## File list (indicativo)

- [ ] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`  
- [ ] `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts` *(já existe — estender casos)*  
- [ ] `frontend/src/pages/GuidesMei.tsx`  
- [ ] `frontend/src/components/FiscalIntegrationErrorAlert.tsx`  
- [ ] `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`  

---

## Fora de escopo

- Mudança de payload `POST /empresa` no backend (**NFR-NAT-01**).  
- Callout de modo nacional — outra story.  
- Actualização longa de `operacao-mei-nfse.md` — [story-fr-nat-p1-operacao-doc-nfse-nacional-vs-municipal.md](./story-fr-nat-p1-operacao-doc-nfse-nacional-vs-municipal.md).

---

## CodeRabbit Integration

- Focar: mensagens não vazam dados sensíveis; heurística não marca falsamente erros genéricos; acessibilidade do link (texto descritivo).

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### Completion Notes

- `isPlugnotasEmpresaMunicipalRequirementMessage` em `nfseNacionalPlugnotasErrorHints.ts` (IM / inscrição municipal / prefeitura com contexto empresa–NFSe; exclui `nfce`-only para não colidir com dica NFC-e).
- `shouldOfferNfseNacionalOperacaoDocHint` agrega padrões nacionais existentes + detecção municipal (FR-NAT-ERR-01).
- Painel âmbar `plugnotasPendingRetry` em `GuidesMei.tsx`: parágrafo UX §5.2 condicional; link «Ver guia de operação fiscal» usa `getNfseNacionalOperacaoHelpHref()` quando o match municipal; CTA «Editar dados» inalterado.
- `NfseNacionalOperacaoDocHint` recebe `message` e mostra copy §5.2 ou copy NAT-04; `GuiaMeiEmpresaCadastroErrorPanel` sem novas props públicas.
- Testes: `nfseNacionalPlugnotasErrorHints.test.ts` + `FiscalIntegrationErrorAlert.test.tsx` (caso só `inscricaoMunicipal`).
- Gates: `npm run lint`, `npm run typecheck`, `npm test`.
- **QA follow-up:** copy §5.2 centralizada em `PlugnotasMunicipalRequirementOperacaoBody`; `NFSE_NACIONAL_PLUGNOTAS_HINT_PATTERNS_DOC` inclui linhas de sintomas municipais (CONCERNS manutenção + documentação).

### File List

- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/components/PlugnotasMunicipalRequirementOperacaoCopy.tsx`

### Change Log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | @sm | Story criada (FR-NAT-ERR-01 + arquitetura §4.2). |
| 2026-04-08 | @dev | Implementado hints municipais + integração painéis (FR-NAT-ERR-01). |
| 2026-04-08 | @dev | Follow-up QA: componente partilhado §5.2 + padrões municipais na lista documental. |

---

## QA Results

**Revisor:** Quinn (@qa)  
**Data:** 2026-04-08  
**Gate:** **PASS**

### Rastreio aos critérios de aceite

| Critério | Resultado | Evidência |
|----------|-----------|-----------|
| **FR-NAT-ERR-01** (parágrafo + link) | **PASS** | `GuidesMei.tsx`: bloco condicional após `plugnotasEmpresaRetryDetail`; link «Ver guia de operação fiscal» passa a `getNfseNacionalOperacaoHelpHref()` quando `isPlugnotasEmpresaMunicipalRequirementMessage`. `NfseNacionalOperacaoDocHint` em `FiscalIntegrationErrorAlert.tsx`: ramo municipal com copy alinhada à spec §5.2 + mesmo `href`. |
| Classificação (IM / prefeitura / `nfse.config`) | **PASS** | `isPlugnotasEmpresaMunicipalRequirementMessage` + casos em `nfseNacionalPlugnotasErrorHints.test.ts` (ex.: `inscricaoMunicipal`, `nfse.config.prefeitura`, exclusão `nfce.config.prefeitura` sem NFSe). |
| **GuiaMeiEmpresaCadastroErrorPanel** §5.3 | **PASS** | Mesma função pura via `shouldOfferNfseNacionalOperacaoDocHint` + `NfseNacionalOperacaoDocHint message={message}`; teste RTL dedicado em `FiscalIntegrationErrorAlert.test.tsx`. |
| CTA **Editar dados** | **PASS** | Sem novos campos obrigatórios; botão e scroll/focus inalterados. |
| `shouldOfferNfseNacionalOperacaoDocHint` coerente | **PASS** | Compõe `shouldOfferNfseNacionalOperacaoDocHintNacionalPatterns` \|| `isPlugnotasEmpresaMunicipalRequirementMessage`. |
| Testes unitários | **PASS** | Módulo de hints + painel; mensagem sem «nacional» coberta. |
| Comentário `operacao-mei-nfse.md` | **PASS** | Cabeçalho em `nfseNacionalPlugnotasErrorHints.ts` com remissão e âncora. |
| Tom §5.4 (sem `POST /empresa` visível) | **PASS** | Copy revista nos trechos novos. |

### Observações (não bloqueantes)

- **CONCERNS — Manutenção:** O parágrafo §5.2 está duplicado entre `GuidesMei.tsx` (âmbar) e `NfseNacionalOperacaoDocHint` (rose). A heurística é única, mas convém extrair texto/fragmento partilhado num refactor pequeno se o PO ajustar copy com frequência.
- **CONCERNS — Documentação:** `NFSE_NACIONAL_PLUGNOTAS_HINT_PATTERNS_DOC` ainda não lista explicitamente os sintomas municipais; o comportamento está nos testes; opcional alinhar a lista ao operacional quando a story P1 tocar em `docs/operacao-mei-nfse.md`.

### Comandos executados nesta revisão

- Leitura estática: `nfseNacionalPlugnotasErrorHints.ts`, `FiscalIntegrationErrorAlert.tsx`, `GuidesMei.tsx` (painel retry).
- `npm run lint`, `npm run typecheck`, `npm test` (raiz do repo): **exit 0**.

### Revisão @architect

- Superfície pública de `GuiaMeiEmpresaCadastroErrorPanel`: **sem alteração de props**; apenas composição interna e consumo do módulo de hints.
