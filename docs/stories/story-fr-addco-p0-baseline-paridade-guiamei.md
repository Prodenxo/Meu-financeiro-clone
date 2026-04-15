# Story — FR-ADDCO (P0): Baseline de paridade addCompany na Guia MEI

**ID:** STORY-FR-ADDCO-P0-BASELINE-PARIDADE-GUIAMEI  
**Prioridade:** P0  
**Status:** Ready for Review  
**Depende de:** artefatos fonte aprovados em `docs/prd/`, `docs/specs/` e `docs/technical/`  
**Bloqueia:** stories futuras de deriva de contrato sem baseline verificado  
**Fonte PRD:** [`docs/prd/PRD-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`](../prd/PRD-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md) — **FR-ADDCO-01** a **FR-ADDCO-04**, **NFR-ADDCO-01**, **NFR-ADDCO-03**, critérios de go §11  
**UX:** [`docs/specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md`](../specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md) — secções 5, 6, 8, 11  
**Arquitetura:** [`docs/technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`](../technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md) — secções 2, 3, 4, 6, 7, 10  
**Brief:** [`docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`](../brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test`; revisão @architect se houver divergência entre payload frontend e política backend |

---

## User story

**Como** equipa de engenharia responsável pelo fluxo fiscal da Guia MEI,  
**quero** validar e registar uma baseline explícita de paridade entre a jornada atual do produto e a operação **addCompany / POST `/empresa`** do Plugnotas,  
**para** garantir que o comportamento existente continua coerente com o PRD, com a UX e com a arquitetura antes de futuras evoluções.

---

## Contexto

- O PRD afirma que a Guia MEI já materializa o caso de uso addCompany através de `POST /mei-notas/setup/emissao-fiscal/empresa` -> `POST /empresa`.  
- A arquitetura fixa como invariantes: BFF server-side, sequência `certificado -> empresa`, retry parcial e fallback `POST /empresa` -> `PATCH /empresa/:cnpj`.  
- O código brownfield já contém os pontos críticos a verificar: `GuidesMei.tsx`, `plugnotasEmitenteSetup.ts`, `nfEmissionCompany.ts`, `mei-notas.controller.js` e `empresa.service.js`.

## Escopo e fronteira

- Esta story é de **baseline e validação de paridade**, não de redesign do fluxo nem de evolução funcional do cadastro de empresa.
- O objetivo principal é confirmar, com evidência objetiva, se o brownfield atual continua coerente com PRD, UX e arquitetura para o caso addCompany.
- Se a validação confirmar que o comportamento já está correto, o resultado esperado é documentação da baseline + testes preservados ou complementados apenas para tornar a evidência executável.
- Se a validação revelar um **gap P0**, a story pode registrar o gap e o impacto, mas **não deve inventar correção ampla fora dos artefatos-fonte**; a correção deve ficar explícita como follow-up ou ajuste mínimo estritamente necessário para restaurar a paridade declarada.

---

## Critérios de aceite

### Formato mínimo da evidência

- [ ] Cada critério de paridade funcional é encerrado com pelo menos uma evidência objetiva registada no `Dev Agent Record`, escolhida entre: referência a teste automatizado, referência a trecho de código validado, ou nota documental factual com caminho de arquivo e comportamento observado.
- [ ] A story fecha com uma tabela-resumo de baseline no `Dev Agent Record`, mapeando **requisito -> evidência -> status** (`alinhado` ou `gap`).

### Paridade funcional

- [ ] Existe evidência objetiva de que o fluxo feliz da Guia MEI continua a chamar o backend de empresa apenas após obter `certificadoId` válido, conforme **FR-ADDCO-01** e arquitetura §2.
Critério de encerramento: teste automatizado existente ou complementar, mais referência ao ponto de código que encadeia `certificado -> empresa`.
- [ ] Existe evidência objetiva de que o payload montado em `buildNfEmissionEmpresaPayload` continua semanticamente alinhado ao contrato esperado pelo backend para `POST /empresa`, conforme **FR-ADDCO-02** e arquitetura §4.
Critério de encerramento: teste unitário ou de integração cobrindo campos críticos e nota curta de compatibilidade com o normalizador backend.
- [ ] Existe cobertura explícita para o cenário de conflito em que `cadastrarEmpresaPlugNotas` realiza fallback para atualização sem exigir fluxo paralelo na UI, conforme **FR-ADDCO-03**.
Critério de encerramento: teste backend existente ou complementar para `POST /empresa` com fallback para `PATCH /empresa/:cnpj`, com referência ao comportamento UI esperado sem segundo fluxo manual.
- [ ] Existe cobertura explícita para o cenário “certificado aceite, empresa falhou”, com manutenção do caminho de retry parcial via `plugnotasPendingRetry` / `retryPlugnotasEmpresaRegistro`, conforme **FR-ADDCO-04** e spec UX §5.3.
Critério de encerramento: teste frontend existente ou complementar validando estado de retry parcial e ausência de exigência de novo upload de certificado.

### Observabilidade e ambiente

- [ ] A baseline regista de forma clara onde a equipa deve verificar ambiente (`PLUGNOTAS_API_BASE_URL` e credenciais) para evitar falso negativo entre sandbox e produção, conforme **NFR-ADDCO-01**.
Critério de encerramento: nota factual na story ou documento operacional indicando ponto de verificação de ambiente.
- [ ] A baseline deixa explícito como distinguir falhas de certificado vs empresa no brownfield atual, sem expor segredos nem dados sensíveis, conforme **NFR-ADDCO-03** e arquitetura §7.
Critério de encerramento: referência objetiva a código, teste ou documentação que evidencie a separação por fase.

### Entregáveis

- [ ] A story produz um registo objetivo da baseline no próprio artefato da story e, se necessário, um ajuste pontual em documentação operacional/técnica para apontar o mapeamento validado.
Critério de encerramento: `Dev Agent Record` preenchido com resumo factual da baseline e referências de arquivo.
- [ ] Se houver lacuna P0 encontrada, ela fica documentada como gap explícito no `Dev Agent Record`, com impacto, requisito afetado e encaminhamento recomendado; não fica implícita.
- [ ] Se não houver lacuna funcional, o `Dev Agent Record` declara explicitamente que a baseline foi validada sem regressão funcional identificada no escopo desta story.
- [ ] Gates do projeto executados com sucesso: `npm run lint`, `npm run typecheck`, `npm test`.

---

## Dev Notes

### Data Models

- O payload de empresa é construído em `frontend/src/utils/nfEmissionCompany.ts` por `buildNfEmissionEmpresaPayload`, incluindo `cpfCnpj`, `certificado`, endereço e `documentosAtivos` quando presentes. [Source: architecture/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md#3-estado-atual-do-brownfield]
- O backend normaliza CNPJ, política de IBGE/prefeitura e seleção de documentos ativos em `backend/src/services/plugnotas/empresa.service.js`. [Source: architecture/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md#3-estado-atual-do-brownfield]

### API Specifications

- Frontend -> BFF: `POST /mei-notas/setup/emissao-fiscal/certificado` (`multipart/form-data`) e `POST /mei-notas/setup/emissao-fiscal/empresa` (`{ payload }`). [Source: architecture/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md#6-contrato-e-fronteiras]
- BFF -> Plugnotas: `POST /certificado`, `POST /empresa`, `PATCH /empresa/:cnpj`, `GET /empresa/:cnpj`, `GET /certificado` para resolução de 409. [Source: architecture/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md#6-contrato-e-fronteiras]

### Component Specifications

- `GuidesMei.tsx` concentra a intenção do utilizador, CTA, feedback empilhado e estado `plugnotasPendingRetry`. [Source: architecture/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md#5-componentes-e-responsabilidades]
- `plugnotasEmitenteSetup.ts` tipa a fase da falha como `certificado` ou `empresa`. [Source: architecture/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md#3-estado-atual-do-brownfield]

### File Locations

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/utils/plugnotasEmitenteSetup.ts`
- `frontend/src/utils/nfEmissionCompany.ts`
- `frontend/src/services/meiNotasService.ts`
- `backend/src/controllers/mei-notas.controller.js`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/tests/plugnotas-empresa.test.js`
- `frontend/src/utils/plugnotasEmitenteSetup.test.ts`
- `frontend/src/utils/nfEmissionCompany.test.ts`

### Testing Requirements

- Validar caminho feliz, conflito com fallback para PATCH e retry parcial após falha da fase empresa. [Source: architecture/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md#10-criterios-de-aceite-arquiteturais]
- Preservar distinção de falha por fase e conectividade na UI. [Source: docs/specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md#11-criterios-de-aceite-ux-testaveis]
- Se testes existentes já cobrirem a baseline, o trabalho aceitável é apontar e, no máximo, complementar lacunas mínimas para tornar a evidência inequívoca.

---

## Tasks / Subtasks

1. [x] Revisar o fluxo atual e consolidar uma matriz de baseline entre PRD, UX, arquitetura e código para **FR-ADDCO-01** a **FR-ADDCO-04** e **NFR-ADDCO-01/NFR-ADDCO-03**. (AC: formato mínimo da evidência, paridade funcional, observabilidade e ambiente)
2. [x] Identificar os testes já existentes que servem como evidência e complementar apenas as lacunas mínimas necessárias para cobrir: caminho feliz `certificado -> empresa`, conflito com fallback para atualização e retry parcial. (AC: paridade funcional)
3. [x] Registar no `Dev Agent Record` a baseline validada com referências objetivas de arquivo/teste/código. (AC: formato mínimo da evidência, entregáveis)
4. [x] Se houver gap P0, documentar explicitamente o requisito afetado, impacto observado, evidência e encaminhamento recomendado; se não houver gap, declarar baseline validada sem regressão no escopo. (AC: entregáveis)
5. [x] Ajustar documentação técnica ou operacional apenas se isso for necessário para apontar o mapeamento validado ou o ponto de verificação de ambiente. (AC: observabilidade e ambiente, entregáveis)
6. [x] Executar `npm run lint`, `npm run typecheck` e `npm test`. (AC: entregáveis)

---

## File list (esperada / a confirmar na execução)

- [ ] `frontend/src/utils/plugnotasEmitenteSetup.test.ts`
- [ ] `frontend/src/utils/nfEmissionCompany.test.ts`
- [ ] `backend/tests/plugnotas-empresa.test.js`
- [ ] `docs/stories/story-fr-addco-p0-baseline-paridade-guiamei.md`
- [ ] `docs/technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md` *(somente se precisar registrar ajuste factual)*
- [ ] `docs/operacao-mei-nfse.md` *(somente se precisar registrar apontador operacional)*

---

## 🤖 CodeRabbit Integration

**Story Type Analysis**  
Primary Type: Integration  
Secondary Type(s): API, Frontend  
Complexity: Medium

**Specialized Agent Assignment**
- Primary Agents:
  - @dev
  - @architect
- Supporting Agents:
  - @qa

**Quality Gate Tasks**
- [ ] Pre-Commit (@dev): revisar diffs e, se disponível no fluxo local, correr CodeRabbit para mudanças do story
- [ ] Pre-PR (@github-devops): correr revisão arquitetural antes de PR caso haja alteração em contrato/testes cross-stack

**CodeRabbit Focus Areas**
- Primary Focus:
  - coerência do contrato `certificado -> empresa`
  - fallback `POST /empresa` -> `PATCH /empresa/:cnpj`
  - distinção de falhas por fase
- Secondary Focus:
  - regressão de testes cross-stack
  - não exposição de segredos ou payload sensível em logs

---

## Dev Agent Record

### Status

Ready for Review

### Completion Notes

- **Resumo da baseline validada:** O brownfield atual já materializa a baseline addCompany na Guia MEI sem gap P0 identificado no escopo desta story; a evidência ficou registada via testes existentes do fluxo `certificado -> empresa`, do payload de emitente e do fallback `POST /empresa` -> `PATCH /empresa/:cnpj`.
- **Rastreabilidade por requisito (`FR/NFR -> teste/código/doc`):**
- `FR-ADDCO-01` -> `frontend/src/utils/plugnotasEmitenteSetup.test.ts:12`, `frontend/src/utils/plugnotasEmitenteSetup.test.ts:121`, `frontend/src/pages/GuidesMei.tsx:1705`, `frontend/src/pages/GuidesMei.tsx:1717`.
- `FR-ADDCO-02` -> `frontend/src/utils/nfEmissionCompany.test.ts:36`, `frontend/src/utils/nfEmissionCompany.test.ts:83`, `frontend/src/utils/nfEmissionCompany.ts:134`, `backend/tests/plugnotas-empresa.test.js:51`, `backend/src/services/plugnotas/empresa.service.js:661`.
- `FR-ADDCO-03` -> `backend/tests/plugnotas-empresa.test.js:330`, `backend/src/services/plugnotas/empresa.service.js:375`, `backend/src/services/plugnotas/empresa.service.js:701`.
- `FR-ADDCO-04` -> `frontend/src/utils/plugnotasEmitenteSetup.test.ts:89`, `frontend/src/utils/plugnotasEmitenteSetup.test.ts:142`, `frontend/src/pages/GuidesMei.tsx:1755`, `frontend/src/pages/GuidesMei.tsx:1308`, `frontend/src/pages/GuidesMei.tsx:1314`.
- `NFR-ADDCO-01` -> `docs/operacao-mei-nfse.md:186`, `docs/operacao-mei-nfse.md:314`, `docs/operacao-mei-nfse.md:472`, `docs/operacao-mei-nfse.md:516`.
- `NFR-ADDCO-03` -> `docs/operacao-mei-nfse.md:317`, `docs/operacao-mei-nfse.md:318`, `frontend/src/utils/plugnotasEmitenteSetup.test.ts:89`, `frontend/src/pages/GuidesMei.tsx:1755`.
- **Conclusão por requisito (`alinhado` ou `gap`):** `FR-ADDCO-01`, `FR-ADDCO-02`, `FR-ADDCO-03`, `FR-ADDCO-04`, `NFR-ADDCO-01` e `NFR-ADDCO-03` estão `alinhados`.
- **Gap P0, se existir (impacto + encaminhamento recomendado):** Nenhum gap P0 identificado. A story valida a baseline existente e não exigiu alteração de código ou documentação operacional/técnica adicional.
- **Resultado dos gates (`lint`, `typecheck`, `test`):**
- `npm run lint` passou sem erros; há warnings preexistentes e não relacionados em outros módulos do workspace.
- `npm run typecheck` passou.
- `npm test` passou após rerun fora do sandbox; a primeira execução local falhou por restrição `spawn EPERM` do ambiente, não por regressão.

### File List

- `docs/stories/story-fr-addco-p0-baseline-paridade-guiamei.md`

### Baseline Evidence Summary

| Requisito | Evidência | Status |
|------|------|------|
| FR-ADDCO-01 | `frontend/src/utils/plugnotasEmitenteSetup.test.ts:12` confirma sequência feliz; `frontend/src/utils/plugnotasEmitenteSetup.test.ts:121` bloqueia a fase empresa sem `certificadoId`; `frontend/src/pages/GuidesMei.tsx:1705` e `frontend/src/pages/GuidesMei.tsx:1717` ligam a UI ao builder pós-certificado. | alinhado |
| FR-ADDCO-02 | `frontend/src/utils/nfEmissionCompany.test.ts:36` e `frontend/src/utils/nfEmissionCompany.test.ts:83` cobrem semântica do payload; `frontend/src/utils/nfEmissionCompany.ts:134` centraliza a montagem; `backend/tests/plugnotas-empresa.test.js:51` verifica o contrato recebido pelo backend. | alinhado |
| FR-ADDCO-03 | `backend/tests/plugnotas-empresa.test.js:330` cobre conflito com fallback; `backend/src/services/plugnotas/empresa.service.js:375` centraliza o update path; `backend/src/services/plugnotas/empresa.service.js:701` aplica o fallback sem exigir fluxo manual paralelo na UI. | alinhado |
| FR-ADDCO-04 | `frontend/src/utils/plugnotasEmitenteSetup.test.ts:89` tipa a falha na fase `empresa`; `frontend/src/utils/plugnotasEmitenteSetup.test.ts:142` cobre o retry; `frontend/src/pages/GuidesMei.tsx:1755`, `frontend/src/pages/GuidesMei.tsx:1308` e `frontend/src/pages/GuidesMei.tsx:1314` mantêm `plugnotasPendingRetry` e retry só da empresa. | alinhado |
| NFR-ADDCO-01 | `docs/operacao-mei-nfse.md:186`, `docs/operacao-mei-nfse.md:314`, `docs/operacao-mei-nfse.md:472` e `docs/operacao-mei-nfse.md:516` documentam verificação de `PLUGNOTAS_API_BASE_URL`, chave e coerência sandbox/produção. | alinhado |
| NFR-ADDCO-03 | `docs/operacao-mei-nfse.md:317` e `docs/operacao-mei-nfse.md:318` descrevem observabilidade segura por fase; `frontend/src/utils/plugnotasEmitenteSetup.test.ts:89` e `frontend/src/pages/GuidesMei.tsx:1755` preservam a distinção `certificado` vs `empresa` no brownfield. | alinhado |

### Change Log

| Data | Nota |
|------|------|
| 2026-04-09 | Story criada pelo @sm a partir do PRD addCompany, spec UX e arquitetura técnica da iniciativa. |
| 2026-04-09 | Story refinada para explicitar escopo, formato mínimo de evidência, critérios de encerramento e template de baseline para execução. |
| 2026-04-09 | Baseline validada por @dev com evidência registada no Dev Agent Record; sem gap P0 no escopo e sem necessidade de alteração de código. |

---

## Checklist DoD (story)

- [ ] Matriz de baseline preenchida no `Dev Agent Record`
- [ ] Critérios de aceite encerrados com evidência objetiva
- [ ] File list preenchida
- [ ] Gates verdes registados
- [ ] Gaps P0, se existirem, explicitados na story

---

## QA Results

- A preencher por @qa.
