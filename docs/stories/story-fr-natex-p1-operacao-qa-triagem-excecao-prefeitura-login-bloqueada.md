# Story — FR-NATEX (P1): Operação/QA — triagem e matriz da exceção municipal bloqueada no fluxo nacional

**ID:** STORY-FR-NATEX-P1-OPERACAO-QA-TRIAGEM-EXCECAO-PREFEITURA-LOGIN-BLOQUEADA  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** [`docs/stories/story-fr-natex-p0-backend-bloqueio-excecao-prefeitura-login-plugnotas.md`](./story-fr-natex-p0-backend-bloqueio-excecao-prefeitura-login-plugnotas.md), [`docs/stories/story-fr-natex-p0-frontend-ux-bloqueio-excecao-prefeitura-login-plugnotas.md`](./story-fr-natex-p0-frontend-ux-bloqueio-excecao-prefeitura-login-plugnotas.md), [`docs/prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](../prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md), [`docs/technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md)  
**Fonte PRD:** [`docs/prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](../prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md) — **FR-NATEX-07**, **FR-NATEX-08**, **NFR-NATEX-01**, **NFR-NATEX-04**, **NFR-NATEX-05**  
**UX:** [`docs/specs/ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../specs/ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md) — secções 6, 7, 9 e 11  
**Arquitetura:** [`docs/technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md) — secções 8, 9, 10 e 11

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
**quero** uma triagem operacional e uma matriz de verificação específicas para o caso `prefeitura.login` obrigatório bloqueado pelo produto,  
**para** diferenciar esse cenário de ambiente, IBGE e payload genérico sem sugerir credenciais no fluxo nacional.

---

## Contexto

- O PRD decidiu que a exceção municipal será bloqueada no produto.
- A spec UX exige narrativa clara de limitação e a arquitetura exige metadados suficientes para triagem.
- O runbook actual já tem material sobre PlugNotas; esta story institucionaliza a linha específica “exceção municipal não suportada”.

---

## Critérios de aceite

### Artefato operacional

- [x] Existe artefato documental canónico cobrindo a triagem da exceção `prefeitura.login` / `senha` obrigatórios como caso não suportado no fluxo nacional.
Critério de encerramento: o artefato final existe em `docs/operacao-mei-nfse.md` como secção canónica com matriz/tabela operacional explícita, distinguindo este caso de endpoint errado, IBGE e ambiente/configuração.
- [x] A matriz operacional indica como registar evidência sem expor segredo.
Critério de encerramento: cada linha/cenário contém, no mínimo, `cenário`, `pré-condição/entrada`, `resultado esperado`, `resultado observado`, `decisão` e `evidência/local do registo`.

### Conteúdo mínimo

- [x] O artefato explicita que o fluxo não aceita login/senha de prefeitura no frontend nem no backend.
- [x] O artefato orienta o que fazer quando o emissor pedir credencial municipal.
Critério de encerramento: a orientação operacional verificável inclui, no mínimo:
  `a)` não tentar recolher credenciais no produto,  
  `b)` não reclassificar o caso como endpoint errado,  
  `c)` consultar o runbook/guia operacional e suporte apropriado,  
  `d)` registrar o caso como “exceção municipal não suportada no fluxo nacional”.
- [x] O artefato preserva a causalidade `POST` falho → `GET` negativo.
Critério de encerramento: o conteúdo deixa explícito que o `GET` sem empresa é consequência do cadastro não concluído e não substitui a causa raiz registada no `POST`.
- [x] A linha da matriz para `prefeitura.login` / `senha` obrigatórios exige campos específicos de registo.
Critério de encerramento: além dos campos gerais da matriz, o cenário “exceção municipal bloqueada” registra explicitamente:
  `a)` classificação final = `não suportado no fluxo nacional`,  
  `b)` origem da evidência (`plugnotasCode`, mensagem redigida e/ou referência ao response/log),  
  `c)` decisão operacional final,  
  `d)` local do ticket/story/runbook associado.

### Qualidade

- [x] Se houver alteração de código derivada da regressão, executar `npm run lint`, `npm run typecheck` e `npm test`.
- [x] Se a entrega for documental, registar explicitamente “não aplicável” para gates de código.

---

## Dev Notes

### File Locations

- `docs/operacao-mei-nfse.md`
- `docs/stories/story-fr-natex-p1-operacao-qa-triagem-excecao-prefeitura-login-bloqueada.md`

### Technical Constraints

- Não introduzir política diferente da fixada no PRD.
- Não documentar credenciais reais ou exemplos sensíveis.
- Não duplicar integralmente a arquitetura; produzir material operacional objetivo e executável.

---

## Tasks / Subtasks

1. [x] Definir ou atualizar a secção canónica do runbook para a exceção municipal bloqueada.
2. [x] Adicionar matriz/tabela operacional com campos obrigatórios por cenário.
3. [x] Cobrir, no mínimo, os cenários:
   `a)` sucesso nacional padrão,  
   `b)` erro de ambiente,  
   `c)` erro IBGE/payload genérico,  
   `d)` `prefeitura.login` / `senha` obrigatório como exceção bloqueada,  
   `e)` `GET` negativo posterior.
4. [x] Garantir que a linha da exceção bloqueada registre classificação final, origem da evidência e decisão operacional de forma explícita.
5. [x] Incluir guardrails de privacidade e redaction da evidência.
6. [x] Atualizar esta story com file list, notas e aplicabilidade dos gates.

---

## File list (esperada / a confirmar na execução)

- [x] `docs/operacao-mei-nfse.md`
- [x] `docs/stories/story-fr-natex-p1-operacao-qa-triagem-excecao-prefeitura-login-bloqueada.md`

---

## CodeRabbit Integration

- N/A para lógica de aplicação quando a entrega for documental.
- Se houver alteração de código derivada da regressão, focar em:
  - coerência da classificação
  - ausência de segredo
  - causalidade `POST` / `GET`

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `docs/operacao-mei-nfse.md`
- `docs/stories/story-fr-natex-p1-operacao-qa-triagem-excecao-prefeitura-login-bloqueada.md`

### Debug Log References

- Entrega documental; sem debug log adicional além do diff nos artefatos.

### Completion Notes

- A secção canónica do runbook foi atualizada para classificar `prefeitura.login` / `senha` obrigatório como exceção municipal bloqueada no fluxo nacional.
- Foi adicionada uma matriz operacional NATEX com cenários mínimos, campos obrigatórios por linha e guardrails de evidência/redaction.
- Gates de código registados como não aplicáveis nesta execução, porque não houve alteração de código de aplicação.

### Change Log

- 2026-04-10 — Story criada pelo @sm a partir do PRD NATEX, spec UX e arquitetura técnica, com foco na triagem operacional da exceção municipal bloqueada no fluxo nacional.
- 2026-04-10 — Story refinada pelo @sm após avaliação do @po: formato do artefato explicitado no runbook, orientação operacional tornada verificável e campos específicos adicionados para a linha da exceção bloqueada.
- 2026-04-10 — Runbook `docs/operacao-mei-nfse.md` atualizado com secção canónica NATEX, matriz operacional e guardrails; entrega fechada como documental, sem alteração de código.

---

## QA Results

- A preencher por @qa.
