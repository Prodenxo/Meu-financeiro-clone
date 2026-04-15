# Story — FR-CONS (P0): Backend — trilho **B** — derivar **`nfse.config.prefeitura`** no `cadastrarEmpresaPlugNotas`

**ID:** STORY-FR-CONS-P0-PLUGNOTAS-BACKEND-TRILHO-B  
**Prioridade:** P0  
**Depende de:** [story-fr-cons-p0-plugnotas-empresa-spike-prefeitura-decisao-doc.md](./story-fr-cons-p0-plugnotas-empresa-spike-prefeitura-decisao-doc.md) *(PO escolheu trilho **B**; spike com schema mínimo)*  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) — **FR-P0-OUT-01**, **FR-P0-OUT-02**, **NFR-P0-REG-01**, **NFR-P0-GATE-01**  
**PRD (payload):** [`docs/prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](../prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) — **FR-PREF-API-01**  
**Arquitetura:** [`docs/technical/architecture-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../technical/architecture-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) — secção 4.1; [`architecture-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](../technical/architecture-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) — trilho **B**  
**UX:** [`docs/specs/ux-spec-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../specs/ux-spec-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) — trilho **B** (*toast* opcional no front, pode ser story separada mínima)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — função pura + ponto de extensão único; ADR actualizado se schema mudar |

---

## User story

**Como** sistema BFF,  
**quero** enriquecer o payload de empresa com **`nfse.config.prefeitura`** segundo a regra documentada no spike **antes** da chamada Plugnotas,  
**para** que o **POST** deixe de falhar com **400** de prefeitura em contas que exigem esse ramo, **sem** obrigar o utilizador a novos campos no formulário (**trilho B**).

---

## Contexto

- Ponto de extensão: `backend/src/services/plugnotas/empresa.service.js` — **após** normalização do *input* e **antes** do *HTTP client* Plugnotas (`cadastrarEmpresaPlugNotas` / fluxo partilhado com *composite*).  
- Implementar função pura testável (nome sugerido na arquitectura P0: `applyNfseConfigPrefeituraFromSpikeRule` ou equivalente) — **não** inventar chaves fora do schema do spike.  
- **NFR-P0-REG-01:** *fixtures* de teste onde o Plugnotas **não** exige `prefeitura` devem continuar a passar **sem** regressão de payload.  
- **Se PO não escolheu B:** marcar story como **Cancelled** / **Won’t do** e não abrir PR.

---

## Critérios de aceite

### Backend

- [ ] Com trilho **B** activo, payload enviado ao Plugnotas inclui `nfse.config.prefeitura` conforme schema mínimo do spike (teste com *mock* da API Plugnotas).  
- [ ] **PATCH** empresa (se partilhar normalização) mantém coerência ou está explicitamente fora de escopo com nota na story.  
- [ ] *Composite* certificado+empresa (`plugnotas-emitente-setup`) usa o mesmo *pipeline* de normalização — **sem** duplicar lógica.  
- [ ] Logs: **não** gravar PII completo do payload (**NFR-P0-EV-01**).

### Regressão

- [ ] **NFR-P0-REG-01:** testes existentes `plugnotas-empresa.test.js` (ou equivalentes) passam; novos casos cobrem “com” e “sem” derivação conforme regra.

### Integração / QA

- [ ] **FR-P0-OUT-01 / 02:** no ambiente de teste acordado com PO, **POST** 2xx e **GET** empresa **não** retorna 404 “não localizado” para o mesmo CNPJ *(evidência em comentário de PR ou anexo interno, sem PII no repo)*.

### Qualidade

- [ ] **NFR-P0-GATE-01:** `npm run lint`, `npm run typecheck`, `npm test` verdes.

---

## Tasks (indicativas)

1. [x] Criar módulo puro de derivação + testes unitários (entrada/saída JSON redigidos).  
2. [x] Integrar em `empresa.service.js` no ponto da arquitectura P0.  
3. [x] Actualizar ADR se o JSON canónico MEI mudar.  
4. [x] *Smoke* manual ou teste de integração com *mock* Plugnotas.  
5. [x] **File list** + **Dev Agent Record**.

---

## File list (indicativo)

- [x] `backend/src/services/plugnotas/empresa.service.js`  
- [x] `backend/src/services/plugnotas/nfsePrefeituraPayload.js` *(novo — nome final @dev)*  
- [x] `backend/tests/plugnotas-empresa.test.js` ou ficheiro novo  
- [x] `backend/tests/nfsePrefeituraPayload.test.js`  
- [x] `backend/src/config/env.js`  
- [x] `backend/.env.example`  
- [x] `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`  

---

## CodeRabbit Integration

- Focar: *whitelist* de chaves em `nfse.config`; evitar *merge* profundo inseguro de objetos vindos do cliente; idempotência entre `POST` simples e *composite*.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `backend/src/services/plugnotas/nfsePrefeituraPayload.js` — função pura `applyNfseConfigPrefeituraDeriveIbge`; opt-in `derivePrefeituraIbge`.
- `backend/src/services/plugnotas/empresa.service.js` — `applyNfsePrefeituraIbgeIfEnabled` após `normalizePayloadEnderecoCodigoCidade` em `cadastrarEmpresaPlugNotas` e `atualizarEmpresaPlugNotas`; env `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`.
- `backend/src/config/env.js` — documentação da variável (default `false`).
- `backend/tests/nfsePrefeituraPayload.test.js` — unitários derivação/merge/regressão.
- `backend/tests/plugnotas-empresa.test.js` — assert sem env não envia `prefeitura`; com `true` envia `codigoIbge` (POST e PATCH *mock*).
- `backend/.env.example` — comentário da flag.
- `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` — complemento trilho B.

### Notes

- Trilho **B** activo só com `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true` (NFR-P0-REG-01). Schema: `nfse.config.prefeitura.codigoIbge` a partir de `endereco.codigoCidade` (7 dígitos); merge com `login`/`senha` existentes; não sobrescreve IBGE já definido.
- **FR-P0-OUT-01/02** e **NFR-PREF-EV-01:** validação em ambiente real fica para PO/QA (sem PII no repo).
- Seguimento QA (2026-04-08): teste integração *mock* **PATCH** com flag activa — coerência explícita com POST.

### Change Log

- 2026-04-08 — Implementação trilho B opt-in + testes + ADR + `.env.example`.
- 2026-04-08 — Teste `PATCH` + `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE` em `plugnotas-empresa.test.js` (recomendação QA).

---

## QA Results

### Revisão — 2026-04-08 (Quinn)

**Gate:** **PASS com observações** (merge autorizado do ponto de vista de qualidade de código e regressão automatizada; evidência de integração real continua externa ao repo).

#### Rastreio (Given–When–Then)

| Critério | Verificação |
|----------|-------------|
| Trilho B activo → `nfse.config.prefeitura` no payload Plugnotas | **Coberto:** `plugnotas-empresa.test.js` com `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true` e assert `sent.nfse.config.prefeitura === { codigoIbge: '…' }`; unitários em `nfsePrefeituraPayload.test.js` (merge `login`/`senha`, não sobrescrever IBGE, `nfse.ativo === false`, IBGE inválido, `prefeitura` string). |
| **NFR-P0-REG-01** (sem regressão quando desligado) | **Coberto:** assert explícito no POST base (sem flag) — `nfse.config` **não** tem `prefeitura`; suíte `plugnotas-empresa` + `nfsePrefeituraPayload` verdes. |
| **PATCH** coerente com POST | **Código:** `applyNfsePrefeituraIbgeIfEnabled` após `normalizePayloadEnderecoCodigoCidade` em `atualizarEmpresaPlugNotas` e `cadastrarEmpresaPlugNotas` — mesmo pipeline. **Teste dedicado com flag em PATCH:** ausente (observação; risco baixo por reutilização da função). |
| *Composite* `plugnotas-emitente-setup` | **OK:** chama `cadastrarEmpresaPlugNotas`, logo herda derivação sem duplicação. |
| **NFR-P0-EV-01** (logs sem PII completa do payload) | **Spot check:** alterações não introduzem log do corpo completo em `empresa.service.js`; derivação não adiciona trilho de debug novo. |
| **FR-P0-OUT-01 / 02** (POST 2xx + GET sem 404 no ambiente PO) | **Pendente / fora do diff:** story e Dev Notes indicam validação em ambiente acordado; **sem evidência no repositório** (esperado). Fechar com PO/QA operacional ou anexo de PR sem PII. |
| **NFR-P0-GATE-01** | **`npm run lint`, `npm run typecheck`, `npm test`** executados nesta revisão — **exit 0**. |

#### Observações (não bloqueantes)

1. **Merge superficial** em `nfse.config` / `prefeitura`: cópia rasa e escrita só de `codigoIbge` — alinhado com a nota da story (evitar merge profundo inseguro).
2. **Evidência NFR-PREF-EV-01:** ADR e comentários no código lembram confirmar aceitação do schema `codigoIbge` no Plugnotas antes de produção; manter checklist operacional.

#### Recomendação opcional para @dev (dívida técnica leve)

- Um teste de integração *mock* **PATCH** com `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true` espelhando o POST fecharia o último buraco de cobertura explícita do critério “PATCH mantém coerência”.

— Quinn, guardião da qualidade 🛡️
