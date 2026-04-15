# Story — FR-TOP (P1): Operação/QA — roteiro canónico e evidência do teste operacional `prefeitura_login_required_blocked`

**ID:** STORY-FR-TOP-P1-OPERACAO-QA-ROTEIRO-TESTE-PREFEITURA-LOGIN-REQUIRED-BLOCKED-2026-04-10  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** [`docs/prd/PRD-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](../prd/PRD-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md), [`docs/specs/ux-spec-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](../specs/ux-spec-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md), [`docs/technical/architecture-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](../technical/architecture-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md), [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) (matriz ROB/NATEX), [`docs/stories/story-fr-natex-p1-operacao-qa-triagem-excecao-prefeitura-login-bloqueada.md`](./story-fr-natex-p1-operacao-qa-triagem-excecao-prefeitura-login-bloqueada.md) *(contexto runbook — não bloqueia execução se já merged)*  
**Fonte PRD:** [`docs/prd/PRD-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](../prd/PRD-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md) — **FR-TOP-01** a **FR-TOP-08**, **NFR-TOP-01** a **NFR-TOP-04**, **DP-TOP-01** a **DP-TOP-03**  
**UX:** [`docs/specs/ux-spec-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](../specs/ux-spec-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md) — secções 5 a 7 (alinhamento com roteiro A–D)  
**Arquitetura:** [`docs/technical/architecture-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](../technical/architecture-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md) — secções 4 a 7, 9 e 10

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisão** | @architect |
| **quality_gate_tools** | revisão documental; `npm run lint`, `npm run typecheck`, `npm test` apenas se houver alteração de código por regressão confirmada |

---

## User story

**Como** equipa de operação e QA,  
**quero** um roteiro canónico único para executar o teste operacional do cenário `POST` com `HTTP 400` e `errors.plugnotasCode = prefeitura_login_required_blocked`, com evidência mínima correlacionada (frontend + log backend) e decisão final explícita,  
**para** distinguir comportamento esperado da política vigente de regressão técnica, sem ambiguidade de diagnóstico nem vazamento de segredos.

---

## Contexto

- O PRD formaliza o teste operacional oficial; a arquitetura define invariantes (BFF único, sem coleta municipal no frontend) e contrato de evidência (secção 6).
- **NFR-TOP-04:** o teste não deve introduzir alterações de comportamento em código de aplicação salvo correção por regressão confirmada (**FR-TOP-07**).
- O runbook [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) permanece a fonte da classificação ROB/NATEX; este roteiro TOP deve referenciar a matriz e aplicar **FR-TOP-06**, **FR-TOP-07** e **FR-TOP-08** de forma verificável.
- Pré-condições de ambiente (briefing): `PLUGNOTAS_API_BASE_URL`, `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`; **NFR-TOP-03:** reinício do backend após alterações de `.env`.

---

## Critérios de aceite

### Artefato documental canónico

- [ ] **AC-OP-01:** Existe um artefato único e localizado (secção nova em `docs/operacao-mei-nfse.md` **ou** ficheiro dedicado em `docs/runbook/` referenciado a partir do runbook) que descreve o **roteiro operacional** com passos **A–D** alinhados à spec UX (cadastro → Network JSON → log backend redigido → `GET` causal quando aplicável → classificação ROB/NATEX).
- [ ] **AC-OP-02:** O artefato exige explicitamente a captura dos campos mínimos **FR-TOP-04:** `message`, `errors.plugnotasCode`, `errors.plugnotasRequest.method`, `errors.plugnotasRequest.path`, `errors.httpStatus`.
- [ ] **AC-OP-03:** O artefato exige **FR-TOP-03:** linha de log backend redigido do `400` de cadastro empresa (`[plugnotas empresa cadastro] ... 400 request payload (redacted)` ou equivalente documentado no repo), correlacionável ao mesmo evento que o response (proximidade temporal, método/path, `httpStatus`, `plugnotasCode` — arquitetura secção 6.3).
- [ ] **AC-OP-04:** O artefato documenta **FR-TOP-05** e **DP-TOP-03:** execução do `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=...` após o `POST` quando aplicável, e que `GET` negativo é consequência, não substituto da causa raiz do `POST`.
- [ ] **AC-OP-05:** O artefato obriga conclusão binária **FR-TOP-07:** `esperado pela política vigente` **ou** `regressão técnica a corrigir`.
- [ ] **AC-OP-06:** Com `plugnotasCode = prefeitura_login_required_blocked`, a classificação final operacional segue **FR-TOP-08** / **DP-TOP-01** / **DP-TOP-02:** `não suportado no fluxo nacional` no contexto atual; não reclassificar como “endpoint errado”.

### Privacidade e reprodutibilidade

- [ ] **AC-OP-07:** **NFR-TOP-01:** instruções claras para evidência redigida (sem token, certificado, payload bruto, credenciais em claro); alinhado a screenshots/ticket.
- [ ] **AC-OP-08:** **NFR-TOP-02:** pré-condições de ambiente explícitas para reprodutibilidade (local/homologação/produção controlada).

### Qualidade

- [ ] **AC-OP-09:** Se a entrega for **apenas documental**, registar gates de código como **não aplicável** no Dev Agent Record.
- [ ] **AC-OP-10:** Se o resultado do teste identificar **regressão técnica** e for necessário alterar código, executar `npm run lint`, `npm run typecheck` e `npm test` e documentar na story derivada ou nesta.

---

## Dev Notes

### File Locations (esperado)

- `docs/operacao-mei-nfse.md`
- Opcional: `docs/runbook/teste-operacional-prefeitura-login-required-blocked-2026-04-10.md` *(se a equipa preferir runbook dedicado com link no runbook principal)*

### Technical Constraints

- Não alterar política de produto nem fluxo Guia MEI além do documentado no PRD (fora de escopo PRD §4).
- Não duplicar a arquitetura canónica; o artefato deve ser **executável** por operação/QA.
- Contrato de API: `POST` / `GET` conforme [`docs/technical/architecture-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](../technical/architecture-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md).

### Testing

- Abordagem principal: validação documental-operacional do roteiro (passos A-D), com revisão de completude e consistência entre runbook, PRD, spec UX e arquitetura.
- Cenários mínimos: captura dos campos FR-TOP-04, correlação com log backend redigido, causalidade `POST` -> `GET`, classificação ROB/NATEX e decisão final binária (`esperado` vs `regressão`).
- Em caso de regressão técnica com alteração de código: executar `npm run lint`, `npm run typecheck` e `npm test` antes de concluir a story.

---

## Tasks / Subtasks

1. [x] Definir local canónico do roteiro TOP (secção no runbook principal ou ficheiro dedicado + link) (AC: **AC-OP-01**).
2. [x] Redigir passos A–D com critérios de observação e campos obrigatórios de evidência (AC: **AC-OP-02**, **AC-OP-03**, **AC-OP-04**).
3. [x] Incluir checklist de correlação frontend ↔ backend (secção 6 da arquitetura) (AC: **AC-OP-03**, **AC-OP-04**).
4. [x] Integrar classificação ROB/NATEX e saída **esperado** vs **regressão** (AC: **AC-OP-05**, **AC-OP-06**).
5. [x] Incluir guardrails de redaction e pré-condições de ambiente (AC: **AC-OP-07**, **AC-OP-08**).
6. [x] Atualizar file list e aplicabilidade dos gates no Dev Agent Record (AC: **AC-OP-09**, **AC-OP-10**).

---

## File list (esperada / a confirmar na execução)

- [x] `docs/operacao-mei-nfse.md` *(secção canónica `2h)` adicionada no runbook principal)*
- [x] `docs/stories/story-fr-top-p1-operacao-qa-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md`

---

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in core-config.yaml.

### Manual Review Focus (fallback)

- Consistência do roteiro A-D com FR-TOP-01..08 e DP-TOP-01..03.
- Preservação de causalidade `POST` -> `GET` sem inversão de causa raiz.
- Redaction e ausência de dados sensíveis nas evidências.
- Coerência com `empresa.service.js` e `prefeituraPortalCredentials.js` em caso de regressão técnica.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `docs/operacao-mei-nfse.md`
- `docs/stories/story-fr-top-p1-operacao-qa-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md`

### Debug Log References

- Runbook atualizado com secção canónica `2h) TOP — roteiro canónico de teste operacional`, contendo:
  - pré-condições mínimas de reprodutibilidade;
  - passos A–D explícitos;
  - campos FR-TOP-04 obrigatórios;
  - correlação frontend ↔ backend;
  - causalidade `POST` -> `GET`;
  - classificação/decisão final ROB/NATEX.
- Gates executados na entrega:
  - `npm run lint` -> exit 0 (warnings preexistentes no workspace)
  - `npm run typecheck` -> exit 0
  - `npm test` -> exit 0

### Completion Notes

- Entrega concluída como documentação operacional (sem alteração de código de aplicação).
- O local canónico do roteiro TOP foi definido no runbook principal (`docs/operacao-mei-nfse.md`, secção `2h`), sem criar documento paralelo.
- A secção adicionada cobre AC-OP-01..08 e AC-OP-05/06 com classificação obrigatória `não suportado no fluxo nacional` para `prefeitura_login_required_blocked`.
- Aplicabilidade de gates para a story (AC-OP-09): não aplicável por escopo documental; ainda assim, os gates globais do projeto foram executados com sucesso nesta entrega.

### Change Log

- 2026-04-10 — Story criada pelo @sm a partir do PRD TOP, spec UX e arquitetura técnica (roteiro operacional e evidência mínima).
- 2026-04-13 — Story refinada pelo @sm seguindo critérios do @po: status Approved, ACs com IDs, mapeamento AC↔Tasks, seção Testing e bloco CodeRabbit no padrão disabled/manual fallback.
- 2026-04-13 — @dev implementou a secção canónica `2h)` no runbook `docs/operacao-mei-nfse.md`, concluiu tasks/documentação operacional e moveu a story para **Ready for Review**.

---

## QA Results

- 2026-04-13 — Revisão @qa (Quinn)
- **Gate:** **PASS**
- Cobertura dos ACs validada: a secção canónica `2h)` em `docs/operacao-mei-nfse.md` inclui pré-condições, passos A–D, campos FR-TOP-04, correlação frontend/backend, causalidade `POST -> GET`, classificação obrigatória `não suportado no fluxo nacional` e decisão binária.
- Rastreabilidade e escopo da story consistentes: artefato único no runbook principal, file list atualizada e story em `Ready for Review`.
- Qualidade: entrega documental sem alteração de comportamento; Dev Agent Record marca AC-OP-09 como não aplicável e registra execução dos gates com sucesso (`lint`, `typecheck`, `test`).
- Risco residual não bloqueante: para execuções futuras do roteiro, manter evidência redigida com CNPJ mascarado e referência de ticket interno conforme guardrails do runbook.
