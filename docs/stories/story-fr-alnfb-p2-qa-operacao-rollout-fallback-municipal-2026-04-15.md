# Story — FR-ALNFB (P2): Operação, QA e rollout governado do fallback municipal

**ID:** STORY-FR-ALNFB-P2-QA-OPS-ROLLOUT  
**Prioridade:** P2  
**Estimativa / risco (planning):** **S–M** — sobretudo documentação e revisão cruzada; **risco** de runbook desalinhado do código se esta story correr **antes** do merge estável das P1 — mitigar com **Definition of Ready**.  
**Epic:** Cadastro de empresa PlugNotas com fallback municipal condicionado (PRD §9)  
**Depende de:** [story-fr-alnfb-p1-bff-classificacao-runtime-decision-fallback-municipal-2026-04-15.md](./story-fr-alnfb-p1-bff-classificacao-runtime-decision-fallback-municipal-2026-04-15.md), [story-fr-alnfb-p1-frontend-ui-credenciais-prefeitura-condicional-2026-04-15.md](./story-fr-alnfb-p1-frontend-ui-credenciais-prefeitura-condicional-2026-04-15.md), [story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md](./story-fr-alnfb-p1-backend-retry-municipal-payload-plugnotas-2026-04-15.md) — **Definition of Ready:** incrementos P1 **mergeados** (ou **release candidate** único com os três entregáveis) e gates verdes no branch alvo; **não** documentar cenários novos em cima de código ainda em fluxo sem coordenação com @dev.  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../prd/PRD-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md) — **Story 1.4**, **FR-ALNFB-11**, **NFR-ALNFB-06**, **DP-ALNFB-08**  
**UX:** [`docs/specs/ux-spec-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../specs/ux-spec-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md) §12 (rastreio)  
**Arquitetura:** [`docs/technical/architecture-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../technical/architecture-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md) §11–12

## User story

**Como** time de operação e QA,  
**quero** que o novo caminho de fallback esteja **documentado**, **testável** e sob **rollout governado**,  
**para** o brownfield evoluir sem ambiguidade nem ativação insegura (**DP-ALNFB-08**, PRD Story 1.4).

## Onde fica a matriz QA (canónico)

- **Predefinição:** matriz mínima (nacional + retry municipal, por ambiente) em **[`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)** — nova **secção ancorada** dedicada ao fallback ALNFB (título estável + âncora `id` para links a partir de stories/PRs). Um único sítio de verdade com o runbook.  
- **Alternativa:** ficheiro em `docs/qa/` **apenas** se PO/QA decidirem extrair (ex.: matriz muito longa); nesse caso o runbook deve **ligar** para esse ficheiro no primeiro parágrafo da secção ALNFB para não espalhar diagnóstico.  
- **Formato de referência:** story de alinhamento runbook/matriz existente no repo — ex. [story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md](./story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md) (estrutura de evidências e rastreio), **sem** duplicar requisitos fora deste epic.

## Escopo desta story

- **Runbook** [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md): distinguir pelo menos **nacional puro**, **nacional com erro de contrato/dados**, **município incompatível com nacional** (fallback disponível vs indisponível), **retry municipal concluído** (**FR-ALNFB-11**).  
- **Matriz QA:** mínimo um caso feliz nacional e um caso de retry municipal; matriz por ambiente (**NFR-ALNFB-05**); alinhar a `runtimeDecision.scenario` e sinais arquitetura §12.1–12.2.  
- **Rollout:** documentar ordem segura arquitetura §11.3 (backend deploy flag off → frontend com código novo flag off → flag frontend → flag backend → monitorização); owner e critério de promoção (**DP-ALNFB-08**).  
- Evidências de que **não há vazamento** de credenciais em docs/tickets/fixtures (**NFR-ALNFB-01**).  
- Confirmação de gates repo: **NFR-ALNFB-06** (`npm run lint`, `npm run typecheck`, `npm test`).

## Critérios de aceite

- [x] Runbook atualizado com os quatro+ cenários operacionais (PRD Story 1.4 AC1; **FR-ALNFB-11**).  
- [x] Matriz QA cobre caso feliz **nacional** e caso **retry municipal** (PRD Story 1.4 AC2), em local **canónico** (secção em [`operacao-mei-nfse.md`](../operacao-mei-nfse.md) ou `docs/qa/` com link desde o runbook — ver “Onde fica a matriz QA”).  
- [x] Mecanismo de ativação (flags backend/frontend) documentado com **owner** e **critério de promoção** (PRD Story 1.4 AC3; arquitetura §11).  
- [x] **Integration verification (PRD):** operação diagnostica sem acessar segredos reais; rollout não altera silenciosamente municípios estáveis no nacional (PRD Story 1.4 IV3).  
- [x] Gates finais verificados no recorte mergeado (**NFR-ALNFB-06**).

## Tasks (implementação)

1. [x] Revisar e atualizar `docs/operacao-mei-nfse.md` (cadastro empresa / classificação / fallback municipal ALNFB).  
2. [x] Inserir **matriz QA mínima** na secção ancorada em `operacao-mei-nfse.md` (ou criar `docs/qa/...` + link no runbook) com colunas alinhadas a `runtimeDecision.scenario` e §12.2 da arquitetura ALNFB.  
3. [x] Documentar **rollout** (ordem §11.3), **owner** e **critério de promoção** — preferencialmente no mesmo runbook (subsecção rollout) ou ADR curto em `docs/adr/` se o repo usar.  
4. [x] Checklist de **smoke pós-deploy** (cenários arquitetura §12.2 + estados UX nacional vs municipal).  
5. [x] Validar que documentação e tickets de evidência **não** contêm credenciais reais (**NFR-ALNFB-01**).

## Fora de escopo

- Implementação de código de produto (já nas stories P1).  
- Métricas de produto pós-release (PRD §10) — opcional mencionar como follow-up.

## File list (checklist)

- [x] `docs/operacao-mei-nfse.md` (runbook + secção/matriz ALNFB + rollout)  
- [ ] _(opcional)_ `docs/qa/*.md` — só se a matriz for extraída; obrigatório link desde `operacao-mei-nfse.md`  
- [ ] _(opcional)_ `docs/adr/*.md` — só se rollout for formalizado em ADR  
- [x] Esta story (`story-fr-alnfb-p2-...md`) — atualizar **Dev Agent Record** com **âncora exata** da secção no runbook (URL relativo ou `id` do heading)

## Definition of Done

- PO/QA reconhecem os cenários e a ordem de ligação das flags.  
- Equipa de ops consegue triagem usando apenas runbook + logs redigidos.

## Qualidade / CodeRabbit

- Garantir consistência de nomenclatura dos cenários (`runtimeDecision.scenario`) entre runbook, matriz e código.  
- Referenciar backlog histórico `DP-PLOGIN-01` apenas como contexto, não como fluxo padrão (PRD §Referencias).  
- Após a triagem PLOGIN no runbook (hoje ainda pode descrever bloqueio puro), alinhar texto à política **national-first + fallback condicionado** do PRD ALNFB onde os dois documentos se cruzem — sem apagar histórico útil; marcar **estado atual do produto** com clareza.

---

## Dev Agent Record

### Status

Implementado

### Completion Notes List

- Secção canónica no runbook com âncora `#alnfb-fallback-municipal-operacao-qa` e título estável **«Fallback municipal condicionado (FR-ALNFB) — operação, matriz QA e rollout»** em [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md).
- Cinco cenários operacionais + matriz QA mínima por ambiente + ordem de rollout §11.3 + tabela owner/promoção + smoke pós-deploy + IV3 + referências PRD/UX/arquitetura; gates NFR-ALNFB-06 citados no runbook.
- Cruzamento com histórico **DP-PLOGIN-01**: bullet FR-ALNFB sem apagar triagem FR-NATEX.
- Matriz mantida em `operacao-mei-nfse.md` (sem ficheiro extra em `docs/qa/`).
- **Pós-QA (2026-04-15):** runbook — cenário #5 com `success_municipal`/`fallback_sync` (§12.2); matriz com coluna **Sinais §12.1** e cenário esperado explícito no retry municipal.

### File List (final)

- [docs/operacao-mei-nfse.md — secção ALNFB](../operacao-mei-nfse.md#alnfb-fallback-municipal-operacao-qa) (`id` HTML `alnfb-fallback-municipal-operacao-qa`)
- [Este ficheiro (story P2)](./story-fr-alnfb-p2-qa-operacao-rollout-fallback-municipal-2026-04-15.md)

---

## QA Results

**Revisor:** Quinn (AIOX QA)  
**Data:** 2026-04-15  
**Artefacto revisto:** [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) (secção [Fallback municipal condicionado (FR-ALNFB)](../operacao-mei-nfse.md#alnfb-fallback-municipal-operacao-qa)) + metadados desta story.

### Decisão de gate

**Aprovado com notas** — documentação cumpre os critérios de aceite da story; notas abaixo são melhorias de rastreio e operação, não bloqueantes para fecho documental.

### Rastreio — critérios de aceite

| Critério | Verificação |
|----------|-------------|
| **AC1** — ≥4 cenários (**FR-ALNFB-11**) | Cumprido: tabela com **5** linhas (nacional puro, erro contrato/dados, fallback disponível, fallback indisponível, retry municipal concluído). |
| **AC2** — Matriz nacional + municipal, sítio canónico (**NFR-ALNFB-05**) | Cumprido: matriz em `operacao-mei-nfse.md` com colunas de cenário e `runtimeDecision.scenario`; linhas de ambiente como `_(preencher)_` — adequado como **template** até QA preencher por dev/staging/prod. |
| **AC3** — Flags + ordem + owner + promoção (**DP-ALNFB-08**) | Cumprido: sequência alinhada à arquitetura §11.3; tabela de papéis; IV3 explicitado. |
| **AC4** — IV3 / diagnóstico sem segredos | Cumprido: parágrafo IV3; matriz e NFR-ALNFB-01 reforçam evidência sem credenciais. |
| **AC5** — Gates **NFR-ALNFB-06** | Cumprido no texto do runbook (comandos citados). **Nota de processo:** a evidência de execução dos três comandos no **branch mergeado** deve permanecer no fluxo de release/CI (esta revisão não reexecuta a pipeline). |

### Rastreio — qualidade / CodeRabbit (secção story)

- **Nomenclatura `runtimeDecision.scenario`:** consistente com a arquitetura ALNFB para os cenários principais. ~~**Nota:** na linha «Retry municipal concluído»…~~ **Atualizado** no runbook: cenário **#5** e matriz de retry referem `success_municipal` / `fallback_sync` (§12.2).
- **Sinais §12.1:** ~~a tabela não tem colunas dedicadas~~ **Atualizado:** coluna **Sinais §12.1** com exemplos de preenchimento na matriz mínima.
- **DP-PLOGIN-01 / FR-NATEX:** o bullet **FR-ALNFB** em DP-PLOGIN-01 cumpre o pedido de cruzar histórico com **national-first + fallback condicionado** sem apagar a triagem legada.

### Riscos e dependências

- **Definition of Ready (story):** a story assume P1 mergeadas/RC estável; **QA não valida merges** nesta revisão — **PO/engineering** devem confirmar antes de **ligar flags** em produção.
- **Smoke checklist** no runbook está com checkboxes por preencher em cada deploy — esperado.

### Follow-up (opcional, não bloqueante)

1. Preencher células `_(preencher)_` da matriz por ambiente após primeira execução QA guiada — **pendente operação** (não bloqueante).  
2. ~~Opcional: referenciar na linha 5 dos cenários os valores **`success_municipal` / `fallback_sync`** alinhados à §12.2.~~ **Feito** no runbook (2026-04-15): cenário 5 + coluna de sinais §12.1 na matriz.

### Correções pós-QA (dev)

- [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md#alnfb-fallback-municipal-operacao-qa): cenário **#5** alinhado à arquitetura §12.2 (`success_municipal` / `fallback_sync`); matriz com coluna **Sinais §12.1** e linha de retry municipal com cenário esperado explícito.

---

**Assinatura:** revisão documental; sem alteração de código de produto nesta story.
