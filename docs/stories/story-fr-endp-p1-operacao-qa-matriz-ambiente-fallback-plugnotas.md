# Story — FR-ENDP (P1): Operação/QA — matriz de ambiente, fallback e consulta do cadastro empresa Plugnotas

**ID:** STORY-FR-ENDP-P1-OPERACAO-QA-MATRIZ-AMBIENTE-FALLBACK-PLUGNOTAS  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** [`docs/stories/story-fr-endp-p0-backend-endpoint-canonico-plugnotas.md`](./story-fr-endp-p0-backend-endpoint-canonico-plugnotas.md), [`docs/stories/story-fr-endp-p0-frontend-ux-diagnostico-cadastro-plugnotas.md`](./story-fr-endp-p0-frontend-ux-diagnostico-cadastro-plugnotas.md), [`docs/prd/PRD-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../prd/PRD-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md), [`docs/technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md)  
**Fonte PRD:** [`docs/prd/PRD-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../prd/PRD-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md) — **FR-ENDP-03**, **FR-ENDP-04**, **FR-ENDP-06**, **NFR-ENDP-02**, **NFR-ENDP-04**  
**UX:** [`docs/specs/ux-spec-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../specs/ux-spec-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md) — secções 5, 9 e 10  
**Arquitetura:** [`docs/technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md) — secções 5, 6, 8 e 11

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
**quero** uma matriz objetiva de verificação para ambiente, fallback e consulta do cadastro de empresa no Plugnotas,  
**para** validar a correção em dev/staging sem confundir erro de ambiente com erro de payload e sem interpretar o `GET` negativo fora de contexto.

---

## Contexto

- O PRD explicitou que boa parte da confusão vinha de ambiente, `path prefix`, token e causalidade incorreta entre `POST` e `GET`.
- A arquitetura exige coerência entre sandbox/produção e logs redigidos.
- Esta story institucionaliza o procedimento de verificação e regressão da iniciativa ENDP.

---

## Critérios de aceite

### Matriz de verificação

- [ ] Existe artefato documental com matriz mínima cobrindo:
  - ambiente coerente (`PLUGNOTAS_API_BASE_URL`, token, prefixo);
  - `POST /empresa` bem-sucedido;
  - `POST` com conflito seguido de fallback `PATCH`;
  - `POST` falho seguido de `GET` sem empresa;
  - diferenciação entre erro de ambiente/configuração e erro de payload.
Critério de encerramento: o artefato final existe em local canónico definido pela story e adopta formato explícito de matriz/tabela operacional.
- [ ] A matriz define campos obrigatórios por cenário.
Critério de encerramento: cada linha da matriz contém, no mínimo, `cenário`, `pré-condição/entrada`, `resultado esperado`, `resultado observado`, `decisão` e `evidência/local do registo`.

### Operação e QA

- [ ] O artefato define claramente o que verificar antes de concluir “rota errada”.
- [ ] O artefato orienta o registo da evidência sem expor segredos ou payload sensível bruto.
- [ ] A matriz aponta onde anotar resultado, ambiente e decisão final.

### Qualidade

- [ ] Se houver alteração de código derivada da regressão, executar `npm run lint`, `npm run typecheck` e `npm test`.
- [ ] Se a entrega for documental, registar explicitamente “não aplicável” para gates de código.

---

## Dev Notes

### File Locations

- `docs/operacao-mei-nfse.md`
- `docs/stories/story-fr-endp-p1-operacao-qa-matriz-ambiente-fallback-plugnotas.md`
- `backend/.env.example` *(somente se o artefato exigir alinhamento adicional de comentários)*

### Technical Constraints

- Não introduzir nova política de negócio fora do PRD.
- Não duplicar arquitetura inteira; criar matriz operacional objetiva e executável.
- O artefato final deve ter formato único e canónico, não apenas bullets soltos.

---

## Tasks / Subtasks

1. [x] Definir o local canónico da matriz ENDP.
2. [x] Criar o artefato final em formato explícito de matriz/tabela operacional.
3. [x] Garantir que cada cenário da matriz contém os campos obrigatórios: `cenário`, `pré-condição/entrada`, `resultado esperado`, `resultado observado`, `decisão`, `evidência/local do registo`.
4. [x] Cobrir os cenários mínimos de ambiente, fallback e consulta definidos nos critérios de aceite.
5. [x] Incluir guardrails de privacidade e redacção de evidências.
6. [x] Definir como registar o resultado da execução futura.
7. [x] Atualizar esta story com file list, notas e aplicabilidade dos gates.

---

## File list (esperada / a confirmar na execução)

- [x] `docs/operacao-mei-nfse.md`
- [x] `docs/stories/story-fr-endp-p1-operacao-qa-matriz-ambiente-fallback-plugnotas.md`
- [ ] `backend/.env.example` *(não necessário nesta execução documental)*

---

## CodeRabbit Integration

- N/A para lógica de aplicação quando a entrega for documental.
- Se houver alteração de código derivada da regressão, focar em:
  - não vazamento de segredos
  - coerência sandbox/produção
  - regressão POST/PATCH/GET

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `docs/operacao-mei-nfse.md`
- `docs/stories/story-fr-endp-p1-operacao-qa-matriz-ambiente-fallback-plugnotas.md`

### Debug Log References

- `docs/operacao-mei-nfse.md#2f-matriz-canónica-endp--ambiente-fallback-e-consulta-do-cadastro-empresa`

### Completion Notes

- A matriz canónica ENDP foi institucionalizada em `docs/operacao-mei-nfse.md`, com formato único de tabela operacional e campos obrigatórios por linha.
- Os cenários mínimos cobertos são: ambiente coerente, `POST /empresa` bem-sucedido, fallback `POST` -> `PATCH`, `POST` falho seguido de `GET` sem empresa e diferenciação entre ambiente/configuração e payload/contrato.
- A secção inclui guardrails de privacidade e redacção para evidências de backend, browser e operação, sem expor segredos ou payload sensível bruto.
- Entrega documental: `npm run lint`, `npm run typecheck` e `npm test` marcados como não aplicáveis nesta story porque não houve alteração de código de aplicação.

### Change Log

- 2026-04-09 — Story criada pelo @sm a partir do PRD ENDP, spec UX e arquitetura técnica.
- 2026-04-09 — Story refinada pelo @sm após avaliação do @po: dependências nomeadas, formato mínimo do artefato explicitado e campos obrigatórios da matriz adicionados.
- 2026-04-09 — @dev definiu `docs/operacao-mei-nfse.md` como local canónico da matriz ENDP, adicionou a tabela operacional com cenários mínimos e guardrails de evidência, e promoveu a story para `Ready for Review`.

---

## QA Results

- A preencher por @qa.
