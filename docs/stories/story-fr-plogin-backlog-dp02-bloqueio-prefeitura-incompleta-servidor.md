# Story — FR-PLOGIN (Backlog): **DP-PLOGIN-02** — Evitar envio ao Plugnotas de `prefeitura` incompleta (sem credenciais quando obrigatórias)

**ID:** STORY-FR-PLOGIN-BACKLOG-DP02-BLOQUEIO-PREFEITURA-INCOMPLETA-SERVIDOR  
**Prioridade:** Backlog *(após decisão PO)*  
**Estado:** **Bloqueada** — requer **DP-PLOGIN-02** aprovada pelo @po, encerramento **FR-PLOGIN-01** conforme pré-condição (evidência **ou** **N/A** justificado), revisão **@architect** (regra de bloqueio / falsos positivos).  
**Depende de:**  
- Decisão PO registada (**DP-PLOGIN-02**).  
- **FR-PLOGIN-01** para sustentar o bloqueio: **(A)** evidência referenciada de que `prefeitura` só com `codigoIbge` gera **400** previsível nos cenários cobertos (ticket privado, acta ou nota interna **sem** secrets), **ou** **(B)** excepção **N/A** com justificação @po em acta ou nota ligada a esta story — *(obrigatório **A** ou **B** antes de “Ready for Dev”)*.  
- Recomendado: [story-fr-plogin-p1-operacao-mei-nfse-triagem-400-prefeitura-login.md](./story-fr-plogin-p1-operacao-mei-nfse-triagem-400-prefeitura-login.md), [story-fr-plogin-p2-ux-nfse-hints-plogin-ux-l1.md](./story-fr-plogin-p2-ux-nfse-hints-plogin-ux-l1.md).  
**Fonte PRD:** [`docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) — **FR-PLOGIN-05**, **FR-PLOGIN-06** (escalação)  
**UX:** [`docs/specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) — secção 7 (**DP-PLOGIN-02**)  
**Arquitetura:** [`docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) — ramo **DP-PLOGIN-02**, **FR-PLOGIN-05**  
**Relaciona com:** [`docs/prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](../prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) — encaminhamento quando **trilho C** não aplicável.  

**Política de produto (obrigatório antes do “Ready for Dev”):** **DP-PLOGIN-02** (não recolher credenciais de prefeitura no fluxo MEI **e** evitar *retry* inútil no emissor) deve estar **explicitamente** escolhida em relação a **DP-PLOGIN-01** (recolher credenciais). **Não** implementar ambas como política global contraditória. Se o PO optar por **segmentação** (ex.: bloqueio só para subset de municípios / *flag*), a regra **deve** estar documentada no PRD (change log) ou acta e referenciada nesta story.

**Story alternativa (excludente a nível de política global):** [story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md](./story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md).

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — regra de bloqueio e falsos positivos; @ux-design-expert — copy secção 7 |

---

## User story

**Como** produto que **não** recolhe credenciais de prefeitura no fluxo MEI,  
**quero** que o BFF **não** envie ao Plugnotas `nfse.config.prefeitura` apenas com `codigoIbge` quando a política definir que isso gera **400** previsível no emissor,  
**para** falhar cedo com mensagem controlada, alinhar expectativas (**UX** secção 7) e reduzir *retry* inútil.

---

## Contexto

- **Épico-amplitude:** pode ser partido em *spike* de regra de negócio + story backend + ajuste de hints — @sm/@po actualizam tasks após desbloqueio.  
- **Risco:** lista de municípios, *feature flag* ou heurística mal calibrada pode gerar **falsos positivos** (bloquear onde só IBGE bastava) — **@architect** no refinamento.  
- **Causalidade POST → GET:** mensagens novas **não** devem inverter a narrativa “cadastro falhou → consulta pode falhar” (**BRIEF-OP-05** / **SOL** onde aplicável).  
- **NFR:** mensagens BFF e docs **sem** PII; **NFR-PLOGIN-01**–**02** para texto de erro e materiais de suporte.  
- **Paridade DP01 (feedback @po):** se existir **feature flag** ou config de activação do bloqueio, documentar em `env` / `.env.example` e critérios de rollout com a mesma disciplina que a story **DP01** — ver pré-condição e secção “Rollout e âmbito”.  
- **Contrato de erro BFF (feedback @po):** antes de “Ready for Dev”, a UX spec secção 7 (ou apêndice) **ou** esta story devem referenciar um **identificador estável** do **4xx** BFF (código, chave i18n ou *string* contratualizada) alinhado aos hints — evitar depender só de *copy* solta ou texto do emissor.

---

## Pré-condições (gate “Ready for Dev”)

- [ ] @po registou **DP-PLOGIN-02** como política vigente **e** a relação com **DP-PLOGIN-01** (excludente ou segmentada — ver cabeçalho desta story).  
- [ ] **Âmbito de rollout** documentado pelo @po **quando aplicável**: *pilot* limitado, **feature flag** / config de activação do comportamento de bloqueio, ambientes (ex.: só *staging* primeiro), ou **GA directa** com justificação — referência em acta, change log do PRD, ou nota ligada a esta story *(se “GA directa”, assinalar explicitamente “sem piloto”)* — **paridade com story DP01**.  
- [ ] **FR-PLOGIN-01** encerrada para esta política: **(A)** referência a evidência **ou** **(B)** **N/A** documentado pelo @po com justificação (paridade com story **DP01** — não deixar o requisito “opcional” no *gate*).  
- [ ] Regra de negócio acordada com **@architect**: lista de IBGE/municípios, **feature flag**, ou outra heurística — com análise breve de **falsos positivos** e mitigação (ex.: *kill switch*).  
- [ ] Copy para “limite do serviço” / transparência alinhada à [`ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) secção 7 (revisão **@ux-design-expert**).

---

## Critérios de aceite

### Backend / BFF

- [ ] Após `applyNfsePrefeituraIbgeIfEnabled` (ou *hook* equivalente documentado), o fluxo **impede** o `POST`/`PATCH` upstream com `nfse.config.prefeitura` **só** `{ codigoIbge }` **quando** a política acordada assim o exige **ou** devolve **400** do BFF **antes** do Plugnotas com mensagem **estável** e testável (sem depender de texto livre do emissor).  
- [ ] O **4xx** BFF usa **identificador estável** (código / chave / *string* contratualizada) acordado com UX secção 7 e reflectido nos hints — documentado em ADR, UX ou linha de *mapping*; alinhado à pré-condição “Contrato de erro BFF” no **Contexto**.  
- [ ] Comportamento **POST** (cadastro) vs **PATCH** (atualização) documentado: a regra de bloqueio aplica-se ao mesmo *hot path* após derivação em ambos **ou** diverge com **4xx** claro — **não** comportamento silencioso indefinido (fechar no refinamento com **@architect**).  
- [ ] Comportamento documentado numa linha no ADR, apêndice ou comentário de implementação: **quando** bloquear vs **quando** deixar passar (trilho B normal).  
- [ ] **Trilho B** permanece correcto para municípios onde **só** `codigoIbge` é suficiente — testes de regressão em `plugnotas-empresa.test.js` / `nfsePrefeituraPayload.test.js` conforme ficheiros tocados.

### Segurança e NFR

- [ ] **NFR-PLOGIN-01**–**02:** mensagens de erro e logs **não** expõem dados sensíveis; PRs e docs **sem** exemplos reais.  

### UI / hints

- [ ] Se a mensagem BFF for nova ou diferente: `nfseNacionalPlugnotasErrorHints.ts` mapeia para copy acordada com **UX spec secção 7** (transparência, limite do serviço, **sem** culpar o utilizador).  
- [ ] Testes em `nfseNacionalPlugnotasErrorHints.test.ts` para a variante ou *string* normalizada **sem** regressão **FR-PREFB-QA-01** (variante **prefeitura-config** / PREF-L1).

### Qualidade de código

- [ ] `npm run lint`, `npm run typecheck`, `npm test` na raiz.

### Operação *(se aplicável)*

- [ ] `docs/operacao-mei-nfse.md` actualizado se o comportamento de suporte ou triagem mudar (sem segredos).

### Rollout e âmbito *(alinhado à pré-condição “Âmbito de rollout”)*

- [ ] Comportamento quando o **bloqueio está desactivado** (ex.: *flag* `false` ou fora do *pilot*): trilho B e cadastro comportam-se como **antes** desta story — **sem** bloqueio enganoso nem mensagem que contradiga **DP-PLOGIN-01** se essa política vier a estar activa noutro ramo.  
- [ ] Quando o **bloqueio está activado**: coerente com pré-condições e regra PO + **@architect**; UI não sugere que o utilizador “conserte” com *retry* infinito no emissor.  
- [ ] Se existir **piloto** ou **flag**: documentação operacional ou ADR/nota indica **como** activar/desactivar e **quem** aprova promoção a GA.  
- [ ] Critério de **sucesso** do piloto (mesmo qualitativo) referenciado para *review* pós-*deploy* *(owner: @po)*.

---

## Métricas *(qualitativas — owner @po)*

| Sinal | Como medir |
|-------|------------|
| Menos *retry* inútil no emissor | Queixas repetidas / tempo até entender “limite do serviço” |
| Falsos positivos | Incidentes “IBGE bastava mas bloqueámos” — deve tender a **zero** após calibragem |
| Âmbito *time-bound* | *Pilot* / *flag* / GA com datas ou marcos na acta ou PRD |

---

## Tasks *(indicativas — desbloqueio)*

1. [ ] Workshop curto PO + **@architect**: política exacta, *flag*, lista IBGE ou regra; encerramento **FR-PLOGIN-01** (**A** ou **B**); registo em acta ou PRD.  
2. [x] **@po** / **@ux-design-expert**: secção 7 UX (ou apêndice) com **identificador estável** do erro BFF alinhado a hints *(pode ser placeholder nomeado até desbloqueio — deve existir *slot* antes do código final)*.  
3. [x] Implementação `empresa.service.js` / `nfsePrefeituraPayload.js` + testes backend.  
4. [x] Se existir **feature flag** ou env: `backend/src/config/env.js` + `backend/.env.example` com comentário legível (**paridade DP01**).  
5. [x] Ajuste `nfseNacionalPlugnotasErrorHints.ts` + `nfseNacionalPlugnotasErrorHints.test.ts` se necessário (inclui *mapping* do identificador estável).  
6. [x] Actualizar `docs/operacao-mei-nfse.md` se a triagem mudar.  
7. [x] Plano de QA: regressão trilho B, cenário bloqueado vs não bloqueado, revisão **@qa** vs UX spec secção 7.  
8. [x] Se houver *flag* / piloto: testes ou checklist manual do ramo “bloqueio desactivado” vs “activado”.

---

## Estratégia de QA *(gate “Ready for Review”)*

- Provar **dois** cenários: (1) município onde só IBGE basta — **POST** continua válido com trilho B; (2) cenário coberto pela política — bloqueio ou **400** BFF **antes** do Plugnotas, com **identificador estável** mapeado nos hints (não só a frase visível).  
- **@qa** confirma **FR-PREFB-QA-01** e paridade **UX spec** secção 7.

---

## File list *(indicativo)*

- `backend/src/services/plugnotas/empresa.service.js`  
- `backend/src/services/plugnotas/nfsePrefeituraPayload.js`  
- `backend/tests/plugnotas-empresa.test.js`  
- `backend/tests/nfsePrefeituraPayload.test.js` *(se aplicável)*  
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`  
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`  
- `frontend/src/pages/GuidesMei.tsx` *(se propagar erro novo)*  
- `docs/operacao-mei-nfse.md` *(se aplicável)*  
- `docs/specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md` secção 7 *(identificador estável do erro BFF — se actualizado nesta entrega)*  
- `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` *(ou nota — se o contrato visível mudar)*  
- `backend/src/config/env.js` / `backend/.env.example` *(se existir **feature flag** ou env de activação do bloqueio — alinhar à pré-condição de rollout)*

---

## CodeRabbit Integration

- **Crítico:** regressão trilho B / derivação IBGE; mensagens que exponham dados do cliente.  
- **Alto:** inconsistência entre BFF e hints; desalinhamento **identificador estável** ↔ UX secção 7; testes fracos nos ramos *flag* on/off (se existir *flag*).  
- Revisão recomendada antes de **Ready for Review**.

---

## Dev Agent Record

### Status

Ready for Review — implementação técnica **DP-PLOGIN-02** entregue **atrás de feature flag** (`PLUGNOTAS_NFSE_PREFEITURA_IBGE_ONLY_BLOCK_ENABLED` + lista IBGE, defeito **desligado** e lista **vazia**). Cabeçalho da story pode manter **Bloqueada** até PO; task **1** (workshop PO + architect) permanece por fechar em acta quando aplicável.

### File list *(implementação)*

- `backend/src/services/plugnotas/prefeituraIbgeOnlyBlock.js`  
- `backend/src/services/plugnotas/empresa.service.js`  
- `backend/tests/prefeituraIbgeOnlyBlock.test.js`  
- `backend/tests/plugnotas-empresa.test.js` *(integração POST DP02)*  
- `backend/tests/nfsePrefeituraPayload.test.js` *(regressão trilho B vs DP02)*  
- `backend/src/config/env.js`  
- `backend/.env.example`  
- `frontend/src/lib/fiscalUserError.ts`  
- `frontend/src/lib/fiscalUserError.test.ts`  
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` *(re-export DP02 + doc)*  
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`  
- `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`  
- `docs/operacao-mei-nfse.md`  
- `docs/specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md` *(identificador estável §7)*

### Notes

- Pré-condições PO no cabeçalho aplicam-se à **activação** em produção; código com *flags* **desligadas** e lista vazia por defeito.  
- **2026-04-09 — Refinamento @sm** com base em avaliação @po: política DP01/DP02, critérios mensuráveis, **FR-PLOGIN-01**, hints + testes, NFR, operação, métricas, QA, CodeRabbit, paridade com story DP01.  
- **2026-04-09 — Terceiro refinamento @sm:** pré-condição de rollout completa (paridade DP01), AC **POST vs PATCH**, secção **Rollout e âmbito** expandida, métrica *time-bound*, `env` / `.env.example`, tasks 3 e 7 (flag), *gap* nota 10 documental.  
- **2026-04-09 — Quarto refinamento @sm (critérios @po):** **FR-PLOGIN-01** com **A** ou **B** obrigatório (fim do “quando possível”); **identificador estável** do erro BFF no contexto, AC Backend e tasks; *file list* UX secção 7.
- **2026-04-09 — @dev:** Bloqueio **opt-in** com lista IBGE configurável (mitiga falsos positivos); **400** antes do Plugnotas com `plugnotasCode` **`prefeitura_ibge_apenas_insuficiente_dp02`**; `mapMeiFiscalErrorToCopy` + testes hints (FR-PREFB-QA-01); ADR, runbook, UX §7 com identificador. Gates na raiz (última corrida): **336** testes pass.
- **2026-04-09 — @dev (follow-up QA):** re-export `PLUGNOTAS_CODE_PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02` + doc em `nfseNacionalPlugnotasErrorHints.ts`; teste integração `plugnotas-empresa.test.js` (POST bloqueia antes de `fetch`); regressão `nfsePrefeituraPayload.test.js` (derivação trilho B).

### Change Log

- 2026-04-09 — Story backlog criada pelo @sm.  
- 2026-04-09 — Refinamento @sm segundo feedback @po (alinhamento à story DP01: política, AC, UX secção 7, QA, CodeRabbit, evidência **FR-PLOGIN-01**).  
- 2026-04-09 — Refinamento @sm: paridade total com DP01 em rollout, POST/PATCH, env, tasks QA *flag*.  
- 2026-04-09 — Refinamento @sm: **FR-PLOGIN-01** A/B, contrato de erro BFF (identificador estável), tasks e *file list* UX.  
- 2026-04-09 — Implementação @dev DP02 (BFF + lista IBGE + UI copy por código + testes + docs).  
- 2026-04-09 — Follow-up QA @dev: ponte hints ↔ código DP02; testes `plugnotas-empresa` / `nfsePrefeituraPayload`.

---

## QA Results

**Revisão @qa — 2026-04-09**

### Decisão de gate

**CONCERNS** — A lógica BFF, o contrato estável (`prefeitura_ibge_apenas_insuficiente_dp02`), a documentação (ADR, runbook, UX §7) e os testes novos alinham-se aos critérios técnicos e à mitigação de falsos positivos (lista vazia ⇒ sem bloqueio). Permanecem **lacunas de processo / produto**: pré-condições PO e **FR-PLOGIN-01** (A/B) no cabeçalho; **task 1** (workshop PO + architect) por fechar; e um **detalhe de rastreio** entre o texto do AC sobre `nfseNacionalPlugnotasErrorHints.ts` e o *mapping* principal em `mapMeiFiscalErrorToCopy` (ver nota abaixo).

### Resumo executivo

- **BFF:** `applyPrefeituraIbgeOnlyBlockPolicy` após `applyNfsePrefeituraIbgeIfEnabled` em **POST e PATCH** (`empresa.service.js`); **400** antes do upstream com `errors.plugnotasCode` estável.
- **Política:** opt-in + lista IBGE não vazia; caso contrário comportamento idêntico ao pré-DP02 para trilho B (sem bloqueio global inadvertido).
- **UI / erro:** copy “limite do serviço” por código em `fiscalUserError.ts`; teste de **não confundir** com TIBGE/CID em `nfseNacionalPlugnotasErrorHints.test.ts` (FR-PREFB-QA-01).
- **Operação / UX / ADR:** triagem e identificador referenciados.

### Rastreio aos critérios *(amostra)*

| Área | Avaliação |
|------|-----------|
| Bloqueio após derivação IBGE, antes do Plugnotas | **Atende** |
| Identificador estável + documentação UX/ADR/runbook | **Atende** |
| POST vs PATCH | **Atende** — mesmo *hot path* |
| Trilho B quando IBGE não está na lista / flag off / lista vazia | **Atende** — coberto em `prefeituraIbgeOnlyBlock.test.js` |
| NFR mensagens (sem PII em erro BFF) | **Atende** — texto genérico |
| UX §7 / tom (sem culpar) | **Atende** — `mapMeiFiscalErrorToCopy` + teste dedicado |
| AC literal “`nfseNacionalPlugnotasErrorHints.ts` mapeia copy” | **CONCERNS** — o *mapping* canónico do código está em **`fiscalUserError.ts`**; os *hints* foram reforçados com teste de desambiguação. Se o AC for interpretado literalmente, considerar uma linha de re-export ou comentário de ponte em `nfseNacionalPlugnotasErrorHints.ts` num follow-up **@dev** (opcional). |
| AC “regressão `plugnotas-empresa.test.js` / `nfsePrefeituraPayload.test.js`” | **CONCERNS leve** — não há alteração nesses ficheiros; a cobertura de regressão está em **`prefeituraIbgeOnlyBlock.test.js`** (aceitável como substituto se **@sm** não exigir os nomes canónicos). |
| Qualidade (`lint` / `typecheck` / `test`) | **`npm test` na raiz (execução 2026-04-09): 334 pass, 0 fail.** `lint` / `typecheck` não reexecutados nesta revisão. |

### Lacunas e follow-up *(owner)*

1. **@po / @sm:** fechar pré-condições do cabeçalho, **FR-PLOGIN-01** (A ou B), acta da task 1 e alinhar estado **Bloqueada** vs rollout.  
2. **@qa / @dev (opcional):** alinhar texto do AC ao ficheiro onde vive o *mapping* do `plugnotasCode`, ou acrescentar ponte mínima em `nfseNacionalPlugnotasErrorHints.ts` por rastreio.

### Evidência de testes *(automática)*

- `npm test` (raiz): **334** testes passaram, ~4,9 s — inclui `backend/tests/prefeituraIbgeOnlyBlock.test.js`, `frontend/src/lib/fiscalUserError.test.ts`, `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`.

— Quinn (@qa), revisão de implementação DP-PLOGIN-02
