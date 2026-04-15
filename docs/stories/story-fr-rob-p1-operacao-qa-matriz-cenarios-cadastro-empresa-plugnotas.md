# Story — FR-ROB (P1): Operação/QA — matriz canónica de cenários do cadastro empresa PlugNotas

**ID:** STORY-FR-ROB-P1-OPERACAO-QA-MATRIZ-CENARIOS-CADASTRO-EMPRESA-PLUGNOTAS  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** [`docs/prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md), [`docs/specs/ux-spec-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../specs/ux-spec-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md), [`docs/technical/architecture-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../technical/architecture-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md), [`docs/stories/story-fr-rob-p0-backend-classificacao-cenarios-fallback-causalidade-plugnotas.md`](./story-fr-rob-p0-backend-classificacao-cenarios-fallback-causalidade-plugnotas.md), [`docs/stories/story-fr-rob-p0-frontend-ux-cenarios-cadastro-empresa-plugnotas.md`](./story-fr-rob-p0-frontend-ux-cenarios-cadastro-empresa-plugnotas.md)  
**Fonte PRD:** [`docs/prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md) — **FR-ROB-04** a **FR-ROB-09**, **NFR-ROB-02**, **NFR-ROB-05**, **NFR-ROB-06**  
**UX:** [`docs/specs/ux-spec-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../specs/ux-spec-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md) — secções 7, 9, 10 e 12  
**Arquitetura:** [`docs/technical/architecture-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](../technical/architecture-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md) — secções 6, 8, 10, 12 e 13

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisão** | @architect |
| **quality_gate_tools** | revisão documental, testes direcionados e gates do projeto quando houver alteração de código |

---

## User story

**Como** equipa de operação e QA,  
**quero** uma matriz canónica do cadastro empresa PlugNotas baseada nos cenários robustos da iniciativa ROB,  
**para** distinguir ambiente, payload, fallback, exceção municipal e `GET` negativo posterior com evidência redigida e linguagem operacional consistente.

---

## Contexto

- Já existe runbook para ENDP e NATEX.
- Falta consolidar a visão ROB numa matriz única de cenários do cadastro empresa, alinhada à taxonomia backend/frontend e pronta para suporte, QA e regressão documental.

---

## Critérios de aceite

### Artefato operacional

- [x] Existe secção canónica no runbook cobrindo os cenários da iniciativa ROB para cadastro empresa PlugNotas.
Critério de encerramento: o artefato final existe em `docs/operacao-mei-nfse.md` como secção canónica explícita da iniciativa ROB, com uma única matriz/tabela operacional alinhada à taxonomia `success_nacional`, `ambiente_configuracao`, `payload_contrato`, `fallback_sync`, `prefeitura_login_required_blocked` e `empresa_nao_cadastrada`.
- [x] A matriz indica como registar evidência sem expor segredo.
Critério de encerramento: cada linha/cenário contém, no mínimo, `cenário`, `pré-condição/entrada`, `resultado esperado`, `resultado observado`, `decisão`, `evidência/local do registo` e `classificação final`.

### Conteúdo mínimo

- [x] A matriz cobre, no mínimo, os seis cenários obrigatórios do PRD.
- [x] O formato da matriz é verificável e uniforme.
Critério de encerramento: o artefato usa tabela canónica única no runbook, sem checklist paralela concorrente, e cada linha segue o mesmo conjunto de colunas obrigatórias.
- [x] A matriz preserva a causalidade `POST` -> `PATCH` -> `GET`.
Critério de encerramento: `fallback_sync` é distinguido de erro e `empresa_nao_cadastrada` é tratado como consequência quando houver falha anterior relevante.
- [x] A matriz explicita que a exceção municipal permanece bloqueada no fluxo nacional.
Critério de encerramento: a linha `prefeitura_login_required_blocked` registra, no mínimo:
  `a)` classificação final = `não suportado no fluxo nacional`,  
  `b)` origem da evidência (`plugnotasCode`, `plugnotasRequest`, `httpStatus` e/ou response/log redigido),  
  `c)` decisão operacional final,  
  `d)` local do ticket/story/runbook associado.
- [x] Cada cenário mínimo tem conteúdo operacional verificável.
Critério de encerramento: a matriz explicita, por linha:
  `a)` sucesso nacional = confirmação de cadastro/sucesso operacional,  
  `b)` ambiente/configuração = classificação de host/token/prefixo/upstream incompatível,  
  `c)` payload/contrato = rejeição de dados ou contrato do emissor,  
  `d)` fallback_sync = conflito resolvido por sincronização/atualização,  
  `e)` `prefeitura_login_required_blocked` = exceção municipal não suportada no fluxo nacional,  
  `f)` `empresa_nao_cadastrada` = consequência de falha anterior relevante e não causa raiz isolada.

### Qualidade

- [x] Se houver alteração de código derivada da regressão, executar `npm run lint`, `npm run typecheck` e `npm test`.
- [x] Se a entrega for documental, registar explicitamente “não aplicável” para gates de código.

---

## Dev Notes

### File Locations

- `docs/operacao-mei-nfse.md`
- `docs/stories/story-fr-rob-p1-operacao-qa-matriz-cenarios-cadastro-empresa-plugnotas.md`

### Technical Constraints

- Não duplicar integralmente o PRD ou a arquitetura; produzir material operacional executável.
- Não documentar segredo, token, certificado ou payload bruto.
- Não contradizer a policy NATEX vigente.

---

## Tasks / Subtasks

1. [x] Definir ou atualizar a secção canónica do runbook para a matriz ROB.
2. [x] Adicionar matriz/tabela operacional com campos obrigatórios por cenário.
3. [x] Cobrir os seis cenários mínimos do PRD com classificação final verificável por linha.
4. [x] Garantir registo explícito de fallback como sincronização e `GET` negativo como consequência quando aplicável.
5. [x] Tornar explícita a origem da evidência e a decisão operacional por cenário.
6. [x] Incluir guardrails de redaction e evidência.
7. [x] Atualizar esta story com file list, notas e aplicabilidade dos gates.

---

## File list (esperada / a confirmar na execução)

- [x] `docs/operacao-mei-nfse.md`
- [x] `docs/stories/story-fr-rob-p1-operacao-qa-matriz-cenarios-cadastro-empresa-plugnotas.md`

---

## CodeRabbit Integration

- N/A para lógica de aplicação quando a entrega for documental.
- Se houver alteração de código derivada da regressão, focar em:
  - coerência da classificação
  - causalidade operacional
  - ausência de segredo

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `docs/operacao-mei-nfse.md`
- `docs/stories/story-fr-rob-p1-operacao-qa-matriz-cenarios-cadastro-empresa-plugnotas.md`

### Debug Log References

- Não aplicável — entrega documental, sem alteração de código de aplicação.

### Completion Notes

- Adicionei a secção canónica ROB no runbook com uma única matriz operacional alinhada às classes `success_nacional`, `ambiente_configuracao`, `payload_contrato`, `fallback_sync`, `prefeitura_login_required_blocked` e `empresa_nao_cadastrada`.
- A matriz ROB foi posicionada junto das matrizes ENDP e NATEX para manter o material operacional numa única área de referência do cadastro empresa PlugNotas.
- Registei colunas obrigatórias por linha, guardrails de evidência/redaction e a causalidade `POST -> PATCH -> GET`, incluindo a classificação final `não suportado no fluxo nacional` para a exceção municipal bloqueada.
- Gates de código marcados como não aplicáveis nesta execução por se tratar de entrega estritamente documental.

### Change Log

- 2026-04-10 — Story criada pelo @sm a partir do PRD, spec UX e arquitetura da iniciativa ROB, com foco na matriz operacional e de QA do cadastro empresa PlugNotas por cenários.
- 2026-04-10 — Story refinada pelo @po/@sm: formato canónico do artefato explicitado, colunas obrigatórias ampliadas e cenários mínimos tornados verificáveis.
- 2026-04-10 — Implementação concluída pelo @dev: matriz canónica ROB adicionada ao runbook, com seis cenários, colunas uniformes e guardrails de evidência/redaction.

---

## QA Results

- 2026-04-10 — Revisão QA concluída por @qa.
- Decisão de gate: PASS.
- Não foram encontrados findings materiais na implementação documental.
- Rastreabilidade validada: a matriz ROB em `docs/operacao-mei-nfse.md` cobre os seis cenários mínimos, mantém as colunas canónicas exigidas, preserva a causalidade `POST -> PATCH -> GET` e fixa `prefeitura_login_required_blocked` como `não suportado no fluxo nacional`.
- Consistência documental validada com as matrizes adjacentes ENDP/NATEX e com os guardrails de redaction/evidência.
- Gates de código permanecem não aplicáveis nesta revisão, porque a entrega analisada é estritamente documental e a story regista isso explicitamente.
