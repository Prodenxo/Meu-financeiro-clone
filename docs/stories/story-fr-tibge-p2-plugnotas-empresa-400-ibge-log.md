# Story — FR-TIBGE (P2): Observabilidade — log estruturado em **400** cidade IBGE / tabela (BFF)

**ID:** STORY-FR-TIBGE-P2-EMPRESA-400-IBGE-LOG  
**Prioridade:** P2  
**Depende de:** [story-fr-tibge-p1-plugnotas-empresa-ibge-tabela-mensagem-hint.md](./story-fr-tibge-p1-plugnotas-empresa-ibge-tabela-mensagem-hint.md) recomendado (heurística alinhada no cliente primeiro; backend pode espelhar mesmas *strings* de teste).  
**Fonte PRD:** [`docs/prd/PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`](../prd/PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md) — **FR-TIBGE-OBS-01**, **NFR-TIBGE-03**  
**Arquitetura:** [`docs/technical/architecture-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`](../technical/architecture-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md) — §4 observabilidade

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — PII e volume de log; paridade heurística FE |

---

## User story

**Como** equipa de operação ou suporte,  
**quando** ocorre **400** no cadastro empresa com indício de rejeição pela **tabela IBGE** do emissor,  
**quero** um registo mínimo e seguro (ambiente, comprimento do código, sem payload completo),  
**para** correlacionar incidentes e ambientes sem vazar dados cadastrais.

---

## Contexto

- **NFR-TIBGE-03:** Seguir **NFR-CID-03** e padrões existentes em `plugnotas-empresa-cadastro-debug.js` / máscaras PII.  
- Opção **A** preferida na arquitetura §4.2: após erro **400** no fluxo `cadastrarEmpresaPlugNotas` / `atualizarEmpresaPlugNotas`, se mensagem passar heurística espelhada da do cliente, log estruturado **uma linha** com metadados.  
- Função pura em `backend/src/utils/` (ESM) recomendada para não importar TS do frontend.

---

## Critérios de aceite

- [ ] Em **400** com mensagem que satisfaz a heurística IBGE-tabela (mesmos exemplos de teste que o cliente ou subconjunto documentado), o servidor regista evento com pelo menos: flag ou tipo de rejeição, `codigoCidadeLen` (após `normalizeIbgeMunicipioCodigo` do payload), `nodeEnv` (ou equivalente já usado).  
- [ ] **NFR-TIBGE-03:** Não logar CNPJ completo; usar últimos dígitos ou política já existente no repo; não logar corpo completo do payload em produção.  
- [ ] Teste unitário mínimo da função heurística **ou** do ramo de log (mock logger), conforme padrão `backend/tests/`.  
- [ ] Gates: `npm run lint`, `npm run typecheck`, `npm test`.

### Fora desta story

- UI e hint — story P1 mensagem.  
- Doc operação — story P1 doc.

---

## Tasks (indicativas)

1. [x] Extrair ou duplicar heurística `isPlugnotasIbgeTableRejectMessage` (nome livre) em `backend/src/utils/`.  
2. [x] Integrar em `empresa.service.js` no caminho de erro **400** após `requestJson` (ou ponto único já usado para 400 empresa).  
3. [x] Testes.  
4. [x] Documentar no código o comentário “manter alinhado a `nfseNacionalPlugnotasErrorHints.ts`”.

---

## File list (indicativo)

- `backend/src/utils/` *(novo helper, se aplicável)*  
- `backend/src/services/plugnotas/empresa.service.js`  
- `backend/tests/` *(novo ou extensão)*

---

## CodeRabbit Integration

- Focar: ausência de PII em claro; não aumentar verbosidade de logs em `PLUGNOTAS_DEBUG` sem critério.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### File list

- `backend/src/utils/plugnotasIbgeTableRejectMessage.js`
- `backend/src/services/plugnotas/plugnotas-empresa-ibge-table-400-log.js`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/tests/plugnotasIbgeTableRejectMessage.test.js`
- `backend/tests/plugnotas-empresa-ibge-table-400-log.test.js`
- `backend/.env.example`

### Notes

- **FR-TIBGE-OBS-01:** Em `requestJson`, após `400` em path cadastro empresa (`POST/PATCH /empresa`), se `isPlugnotasIbgeTableRejectMessage(rawMessage)` (espelho de `isPlugnotasEmpresaIbgeCidadeMessage` no FE), chama-se `logPlugnotasEmpresaIbgeTable400` — `console.info` com objeto `{ tag, kind, method, path, nodeEnv, codigoCidadeLen, cpfCnpj }`; CNPJ com máscara tipo certificado 409; path mascarado; **sem** corpo do payload.
- **NFR-TIBGE-03:** Registo em **produção** (não depende de `PLUGNOTAS_DEBUG`, ao contrário do payload redigido em `plugnotas-empresa-cadastro-debug.js`).
- **QA (nota volume):** `PLUGNOTAS_EMPRESA_IBGE_TABLE_LOG=off` (ou `false`/`0`/`none`) desliga o evento; por defeito continua ligado. Documentado em `backend/.env.example` e testes em `plugnotas-empresa-ibge-table-400-log.test.js`.
- **Gates:** `npm run lint`, `npm run typecheck`, `npm test` (raiz) — OK.

---

## Change log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-09 | @sm (River) | Story inicial — FR-TIBGE-OBS-01. |
| 2026-04-09 | @dev | Helper heurística + log estruturado + integração `empresa.service.js` + testes. |
| 2026-04-09 | @dev | Seguimento nota QA: opt-out `PLUGNOTAS_EMPRESA_IBGE_TABLE_LOG` + testes + `.env.example`. |

---

## QA Results

### 2026-04-09 — Quinn (@qa) — revisão FR-TIBGE-OBS-01 / NFR-TIBGE-03 (BFF)

**Decisão de gate:** **PASS**

**Rastreio aos critérios de aceite:**

| Critério | Verificação | Resultado |
|----------|-------------|-----------|
| **400** + heurística IBGE-tabela → evento com tipo, `codigoCidadeLen`, `nodeEnv` | `logPlugnotasEmpresaIbgeTable400` emite `kind`, `codigoCidadeLen` (via `normalizeIbgeMunicipioCodigo`), `nodeEnv`; integração em `empresa.service.js` `requestJson` após heurística em `rawMessage` | **PASS** |
| **NFR-TIBGE-03** — sem CNPJ completo; sem payload completo em produção | `cpfCnpj` mascarado (padrão alinhado ao 409); objeto de log sem `body`/JSON do pedido; teste confirma ausência de CNPJ literal e de dígitos do código cidade no `JSON.stringify` do payload de log | **PASS** |
| Testes heurística e/ou ramo de log | `plugnotasIbgeTableRejectMessage.test.js` + `plugnotas-empresa-ibge-table-400-log.test.js` (mock `console.info`, cenário produção, negativo) | **PASS** |
| Gates | Re-execução: `node --test` nos dois ficheiros — 8/8 OK; `npm run typecheck` (workspaces) — OK | **PASS** |

**Paridade FE/BFF:** comentário no helper aponta `nfseNacionalPlugnotasErrorHints.ts`; ramos `codigoibgecidade` / tabela / `endereco.codigocidade` coerentes com a implementação P1 revista.

**Notas (não bloqueantes):**

- Volume: `console.info` em **produção** para este evento é intencional (story / Dev Notes); se o ruído aumentar, considerar env de nível numa story futura (fora do âmbito P2).

**Recomendação:** aprovar merge do ponto de vista de qualidade; @sm/@po podem marcar checkboxes dos critérios de aceite quando conveniente.

