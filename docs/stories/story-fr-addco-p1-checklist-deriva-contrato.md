# Story — FR-ADDCO (P1): Checklist de deriva de contrato addCompany e revisão de hints/copy

**ID:** STORY-FR-ADDCO-P1-CHECKLIST-DERIVA-CONTRATO  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** baseline da iniciativa documentada em `STORY-FR-ADDCO-P0-BASELINE-PARIDADE-GUIAMEI`  
**Bloqueia:** releases futuras quando houver alteração documentada em `addCompany` sem checklist executada  
**Fonte PRD:** [`docs/prd/PRD-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`](../prd/PRD-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md) — **FR-ADDCO-05**, **NFR-ADDCO-01**, **NFR-ADDCO-03**  
**UX:** [`docs/specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md`](../specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md) — secções 7, 8, 10, 11  
**Arquitetura:** [`docs/technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`](../technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md) — secções 4, 7, 9, 10

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | revisão documental + `npm run lint`, `npm run typecheck`, `npm test` se houver ajuste de código/copy |

---

## User story

**Como** equipa responsável por manter a integração Plugnotas saudável após mudanças upstream,  
**quero** uma checklist executável de deriva de contrato para `addCompany`, incluindo revisão de payload, hints e copy da Guia MEI,  
**para** evitar regressões P0 não detectadas quando o provedor alterar campos obrigatórios, mensagens ou validações.

---

## Contexto

- O PRD define explicitamente **FR-ADDCO-05** como requisito P1.  
- A arquitetura determina três pontos obrigatórios de revisão quando o contrato `addCompany` mudar: payload frontend, normalização backend e copy/hints da UI.  
- A spec UX exige rever labels, hints de IBGE/prefeitura e mensagens mapeadas quando houver alteração do contrato upstream.

## Escopo e fronteira

- Esta story cria e institucionaliza uma **checklist operacional de deriva de contrato**, não executa por si só uma revisão completa de cada mudança upstream futura.
- O resultado esperado é deixar o repositório preparado para que futuras alterações documentadas em `addCompany` sejam avaliadas de forma consistente antes de release.
- A story pode incluir ajuste pontual de documentação e, apenas se estritamente necessário para coerência do artefato, ajustes mínimos de código/copy derivados da revisão em curso.
- Esta story não autoriza invenção de novos campos, bypass do BFF, nem redesign da UX fora do que estiver documentado nos artefatos fonte.

---

## Critérios de aceite

### Formato mínimo do artefato

- [ ] A checklist passa a existir em local explícito e canónico do repositório: `docs/operacao-mei-nfse.md`.
- [ ] O artefato contém, no mínimo, seções para: gatilho de uso, passos de revisão, pontos obrigatórios de inspeção, decisão final e local de registo da execução.
- [ ] O `Dev Agent Record` desta story registra onde a checklist foi criada/atualizada e qual foi o formato final adotado.

### Processo de checklist

- [ ] Existe um artefato operativo no repositório com checklist objetiva para revisão de paridade de `addCompany`, acionável antes de release.
Critério de encerramento: arquivo documental criado ou atualizado com passos enumerados e linguagem operacional.
- [ ] A checklist cobre explicitamente os três pontos definidos pela arquitetura: `buildNfEmissionEmpresaPayload`, `cadastrarEmpresaPlugNotas` e copy/hints da Guia MEI.
Critério de encerramento: os três pontos aparecem nominalmente no artefato final.
- [ ] A checklist inclui verificação de ambiente (`PLUGNOTAS_API_BASE_URL`, credenciais e sandbox/prod`) para reduzir falsos negativos, conforme **NFR-ADDCO-01**.
Critério de encerramento: existe item dedicado de validação de ambiente antes da conclusão da revisão.
- [ ] A checklist inclui decisão binária: “sem gap”, “gap documentado sem bloqueio” ou “gap bloqueante para release”.
Critério de encerramento: o artefato define as três saídas possíveis e o local onde a decisão será registada.

### UX e observabilidade

- [ ] Se a mudança upstream exigir ajuste em mensagens, a story orienta revisão de `GuiaMeiEmpresaCadastroErrorPanel`, hints relacionados e estados de retry parcial antes de release.
Critério de encerramento: a checklist referencia explicitamente o painel/áreas de copy e os estados de retry a rever.
- [ ] A checklist exige distinguir impactos por fase (`certificado` vs `empresa`) para preservar **NFR-ADDCO-03**.
Critério de encerramento: existe item explícito de avaliação por fase no artefato final.
- [ ] A checklist proíbe expor segredos ou detalhes sensíveis do provedor em mensagens ao utilizador.
Critério de encerramento: o artefato inclui guardrail textual sobre não vazamento de segredos e detalhes sensíveis.

### Evidência

- [ ] O resultado de execução futura da checklist fica previsto para ser registado na própria story/epic ou artefato associado, conforme PRD §6 e §11.
Critério de encerramento: a documentação criada/atualizada define explicitamente onde a execução futura será anotada.
- [ ] Gates do projeto são executados quando a revisão de deriva resultar em alteração de código.

---

## Dev Notes

### Process Guidance

- A arquitetura exige revisão coordenada de payload frontend, normalização backend e copy/hints da UI em caso de mudança upstream. [Source: architecture/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md#7-estrategia-de-erros-e-observabilidade]
- A spec UX liga explicitamente `FR-ADDCO-05` à revisão de labels, hints de IBGE/prefeitura e mensagens de erro mapeadas. [Source: docs/specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md#8-requisitos-de-ui-mapeados-aos-frs]

### File Locations

- `docs/operacao-mei-nfse.md`
- `docs/technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`
- `frontend/src/utils/nfEmissionCompany.ts`
- `backend/src/services/plugnotas/empresa.service.js`
- `frontend/src/pages/GuidesMei.tsx`

### Technical Constraints

- Não inventar campos novos sem alteração documentada do provedor. [Source: docs/prd/PRD-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md#6-requisitos-funcionais]
- BFF continua a ser a única fronteira externa; a checklist não deve induzir browser -> Plugnotas. [Source: architecture/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md#1-decisao-arquitetural]
- Se não houver alteração de código, os gates podem ser registados como “não aplicável nesta execução documental”, sem omitir a decisão.

---

## Tasks / Subtasks

1. [x] Definir o local canónico da checklist de deriva de contrato addCompany e registar esse local na própria story. (AC: formato mínimo do artefato)
2. [x] Criar ou atualizar o artefato com passos operacionais, gatilho de uso, pontos obrigatórios de inspeção e saídas de decisão. (AC: formato mínimo do artefato, processo de checklist)
3. [x] Garantir que a checklist cobre explicitamente payload frontend, backend normalizador, copy/hints da UI, verificação de ambiente e análise por fase (`certificado` vs `empresa`). (AC: processo de checklist, UX e observabilidade)
4. [x] Definir no artefato onde a execução futura da checklist será registada e qual decisão deve ser anotada (`sem gap`, `gap sem bloqueio`, `gap bloqueante`). (AC: processo de checklist, evidência)
5. [x] Registar no `Dev Agent Record` o local final da checklist, o resumo do conteúdo criado/alterado e a decisão sobre aplicabilidade dos gates. (AC: formato mínimo do artefato, evidência)
6. [x] Se houver ajuste de código como parte do story, executar `npm run lint`, `npm run typecheck` e `npm test`; se não houver, registar explicitamente “não aplicável”. (AC: evidência)

---

## File list (esperada / a confirmar na execução)

- [ ] `docs/operacao-mei-nfse.md`
- [ ] `docs/stories/story-fr-addco-p1-checklist-deriva-contrato.md`
- [ ] `docs/technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md` *(se precisar apontar a checklist ou o local de registo)*
- [ ] `frontend/src/pages/GuidesMei.tsx` *(somente se houver ajuste de copy/hints derivado da mudança upstream)*
- [ ] `frontend/src/utils/nfEmissionCompany.ts` *(somente se houver ajuste de contrato)*
- [ ] `backend/src/services/plugnotas/empresa.service.js` *(somente se houver ajuste de normalização)*

---

## 🤖 CodeRabbit Integration

**Story Type Analysis**  
Primary Type: Architecture  
Secondary Type(s): Integration, Frontend  
Complexity: Medium

**Specialized Agent Assignment**
- Primary Agents:
  - @dev
  - @architect
- Supporting Agents:
  - @qa

**Quality Gate Tasks**
- [ ] Pre-Commit (@dev): revisar mudanças de checklist e eventuais ajustes de código relacionados
- [ ] Pre-PR (@github-devops): revisão arquitetural antes de PR quando a checklist resultar em alteração de contrato ou copy crítica

**CodeRabbit Focus Areas**
- Primary Focus:
  - coerência entre payload, backend e UX
  - prevenção de regressão em mudança upstream
- Secondary Focus:
  - manutenção da separação browser -> BFF -> Plugnotas
  - não vazamento de detalhes sensíveis do provedor

---

## Dev Agent Record

### Status

Ready for Review

### Completion Notes

- **Local final da checklist:** `docs/operacao-mei-nfse.md`.
- **Resumo do artefato criado/atualizado:** Foi adicionada a secção `Checklist de deriva de contrato addCompany (FR-ADDCO-05)` no runbook, com gatilho de uso, passos de revisão, pontos obrigatórios de inspeção, decisão final e local de registo da execução.
- **Cobertura confirmada (`payload`, `backend`, `copy/hints`, `ambiente`, `fases`):** A checklist cita nominalmente `buildNfEmissionEmpresaPayload`, `cadastrarEmpresaPlugNotas`, copy/hints da Guia MEI, retry parcial, verificação de ambiente e distinção por fase `certificado` vs `empresa`.
- **Local definido para registo de execuções futuras:** A própria checklist define registo em story, epic ou ticket interno associado à mudança, com data, ambiente, decisão final, links e resumo de impacto.
- **Gates (`executados` ou `não aplicável`):** `não aplicável nesta execução documental`; não houve alteração de código nem de copy executável.

### File List

- `docs/operacao-mei-nfse.md`
- `docs/stories/story-fr-addco-p1-checklist-deriva-contrato.md`

### Checklist Outcome Summary

| Item | Evidência | Status |
|------|------|------|
| Local canónico da checklist definido | `docs/operacao-mei-nfse.md` com secção `Checklist de deriva de contrato addCompany (FR-ADDCO-05)`. | concluído |
| Payload frontend incluído | Secção de pontos obrigatórios de inspeção cita `buildNfEmissionEmpresaPayload`. | concluído |
| Backend normalizador incluído | Secção de passos de revisão e pontos obrigatórios cita `cadastrarEmpresaPlugNotas`. | concluído |
| Copy/hints e retry incluídos | Checklist cita Guia MEI, `GuiaMeiEmpresaCadastroErrorPanel`, hints e retry parcial. | concluído |
| Verificação de ambiente incluída | Checklist exige verificação de `PLUGNOTAS_API_BASE_URL` e `PLUGNOTAS_API_KEY` no mesmo ambiente. | concluído |
| Registo futuro da execução definido | Checklist define registo em story, epic ou ticket interno com decisão final e resumo de impacto. | concluído |
| Guardrails de observabilidade e segredos incluídos | Checklist exige distinção por fase e proíbe expor segredos ou detalhes sensíveis do provedor. | concluído |

### Change Log

| Data | Nota |
|------|------|
| 2026-04-09 | Story criada pelo @sm a partir do requisito FR-ADDCO-05 do PRD e das guardrails da arquitetura/spec UX. |
| 2026-04-09 | Story refinada para explicitar escopo, formato mínimo do artefato, critérios de encerramento e rastreabilidade da checklist. |
| 2026-04-09 | Checklist canónica addCompany implementada em `docs/operacao-mei-nfse.md`; execução desta story foi documental, sem alteração de código. |

---

## Checklist DoD (story)

- [ ] Checklist criada ou atualizada no local definido
- [ ] Critérios de aceite encerrados com evidência objetiva
- [ ] Local de registo futuro da execução documentado
- [ ] File list preenchida
- [ ] Gates executados ou marcados como não aplicável

---

## QA Results

- A preencher por @qa.
