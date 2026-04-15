# Story — FR-PFLNAT (P2): Documentação — runbook `operacao-mei-nfse` e precedência PFLNAT *(opcional)*

**ID:** STORY-FR-PFLNAT-P2-DOC-RUNBOOK-OPERACAO-MEI-NFSE-PFLNAT  
**Prioridade:** P2  
**Status:** Draft *(refinada 2026-04-15 — critérios @po)* — *no quadro (Jira/Linear, etc.), passar a **Ready for Sprint** quando o **Gate de dependência** estiver assinalado e existir owner.*  
**Estimativa:** *a fechar no planning* — indicativo **1 SP** ou t-shirt **XS** (texto curto + PR de doc); owner único reduz variância.  
**Epic:** Correção precedência preflight NFS-e Nacional vs login municipal (PRD PFLNAT 2026-04-15)  
**Depende de:** [`story-fr-pflnat-p0-backend-motor-decisao-nacional-antes-login-municipal.md`](./story-fr-pflnat-p0-backend-motor-decisao-nacional-antes-login-municipal.md) — **P0** mergeado e comportamento observável em **staging** e/ou **produção** (onde o suporte opera).  
**Recomendado (não bloqueante):** [`story-fr-pflnat-p1-qa-regressao-matriz-preflight-hibrido.md`](./story-fr-pflnat-p1-qa-regressao-matriz-preflight-hibrido.md) — alinhar o runbook ao que QA já validou; **não** é obrigatório esperar pelo P1 se o @po quiser publicar o texto logo após o deploy do P0.

### Gate de dependência (Ready for doc)

- [ ] Story **P0** concluída (**DoD** do P0) no ramo que foi para o ambiente referido no runbook.
- [ ] Deploy disponível para o suporte **assumir a mesma versão** que o texto descreve (versão/commit ou nota de release — sem expor segredos).

### Transição de estado (workflow equipa)

| Estado sugerido | Quando |
|-----------------|--------|
| **Ready for Sprint / Approved** | Gate mínimo aceite e owner definido (@po ou @dev conforme tabela abaixo). |
| **In Progress** | PR aberto; **só** `docs/operacao-mei-nfse.md` no *diff* (salvo correção de *typo* inevitável noutro ficheiro acordado). |
| **Done** | Merge + DoD abaixo; aprovação explícita @po *(ver DoD)*. |

*(Ajustar rótulos ao vosso quadro.)*  
*Sincronização documento ↔ ferramenta:* quando o gate e o owner estiverem claros, actualizar o **estado do cartão** para *Ready for Sprint* (ou equivalente), mesmo que este ficheiro ainda diga *Draft* até ao merge do runbook.

**Fonte PRD:** [`docs/prd/PRD-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md`](../prd/PRD-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md) — Story C (opcional), §16  
**UX:** [`docs/specs/ux-spec-preflight-nacional-precedencia-login-municipal-plugnotas-2026-04-15.md`](../specs/ux-spec-preflight-nacional-precedencia-login-municipal-plugnotas-2026-04-15.md) — §4 (persona suporte), §11  
**Arquitetura:** [`docs/technical/architecture-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md`](../technical/architecture-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md)  

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **owner (conteúdo)** | @po *(preferido)* — tom e mensagem a suporte |
| **owner (execução PR)** | @dev *(opcional)* — abrir PR e aplicar *review* técnico mínimo se @po não usar o IDE |
| **quality_gate** | @qa *(revisão factual — sem inventar comportamento)* |
| **revisão final** | @po |

---

## User story

**Como** membro de operação ou suporte,  
**quero** uma entrada no runbook que explique a precedência **nacional antes de bloqueio PLOGIN** e como ler `runtimeDecision` em municípios híbridos,  
**para** não escalar indevidamente “falta credencial da prefeitura” quando o caso é resolvido pela política PFLNAT.

**Valor para o negócio:** menos tickets duplicados e escalonamentos incorrectos após o fix P0; alinhamento suporte ↔ produto.

---

## Contexto

- O PRD marca esta entrega como **opcional** na mesma *release* que o P0; pode ser planeada em sprint seguinte.
- **Planeamento:** o @po pode deixar esta story **fora da sprint actual** (capacidade, prioridade) **sem** bloquear o encerramento do épico PFLNAT nos critérios P0/P1 — o runbook é melhoria operacional, não requisito de *release* do fix.
- Objetivo: **1–2 parágrafos** + ligação ao PRD/brief, sem duplicar a arquitetura completa.

### Âncora sugerida no runbook *(revisável)*

Incluir uma subsecção com título do tipo **«PFLNAT — preflight nacional vs login municipal (suporte)»** (ou equivalente curto), com *slug* Markdown estável para *links* internos — ajustar o texto final ao índice existente de `docs/operacao-mei-nfse.md`.

---

## Critérios de aceite

- [x] `docs/operacao-mei-nfse.md` inclui secção ou subsecção que referencia **DP-PFLNAT-01** e o brief de diagnóstico [`brief-diagnostico-preflight-nacional-antes-login-campo-grande-5002704-2026-04-15.md`](../brief/brief-diagnostico-preflight-nacional-antes-login-campo-grande-5002704-2026-04-15.md) *(ou equivalente resumido)* — âncora [`#pflnat-preflight-nacional-vs-login-municipal-suporte`](../operacao-mei-nfse.md#pflnat-preflight-nacional-vs-login-municipal-suporte).
- [x] Texto orienta suporte: em IBGE híbrido com nacional, verificar versão deployada e `runtimeDecision` antes de assumir necessidade de credenciais municipais *(UX spec §4)*.
- [x] **NFR:** nenhum exemplo com credenciais reais ou dados pessoais.
- [x] **Escopo de ficheiros:** alterações **apenas** em `docs/operacao-mei-nfse.md` nesta story (salvo excepção explícita no PR e aprovação @po).

---

## Tasks / Subtasks

1. [ ] Confirmar **Gate de dependência** (P0 no ambiente alvo).
2. [x] Redigir 1–2 parágrafos + âncora/título conforme secção «Âncora sugerida» acima.
3. [ ] Abrir **PR de documentação** cujo *diff* se limite a `docs/operacao-mei-nfse.md`; pedir revisão @qa (factual) e @po (tom).
4. [ ] Após merge, deixar evidência para o DoD (comentário de aprovação — ver abaixo).

---

## Definition of Done

- Merge do ficheiro `docs/operacao-mei-nfse.md` com todos os critérios de aceite assinalados no PR ou na checklist da story.
- **Aprovação @po explícita** para suporte: comentário no PR (ex.: «aprovado para suporte»), reacção acordada na equipa, ou nota interna rastreável — *não* basta merge silencioso.
- @qa confirmou que o texto **não** contradiz o comportamento conhecido do BFF (sem afirmações inventadas).

---

## Change log (story)

| Data | Nota |
|------|------|
| 2026-04-15 | Rascunho inicial — River (@sm); prioridade P2 opcional alinhada ao PRD Story C. |
| 2026-04-15 | Refinamento segundo feedback @po (@po 7,5/10): gate P0/deploy, estimativa XS/1 SP, P1 recomendado não bloqueante, transição de estado, âncora sugerida, escopo estrito de ficheiro, owners PO/dev, DoD com aprovação explícita @po, tasks — River (@sm). |
| 2026-04-15 | Terceiro refinamento (@po 9,5/10): nota Status/quadro Ready for Sprint, sync documento ↔ ferramenta, planeamento «fora da sprint» sem bloquear épico — River (@sm). |
| 2026-04-15 | Conteúdo runbook: secção PFLNAT + nota REC500/BFF em [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — Dex (@dev); aguarda revisão @qa factual e **aprovação explícita @po** no PR (DoD). |
| 2026-04-15 | Seguimento @qa: linha REC500 «Decisão formal» explicita âmbito §18 vs PFLNAT; parágrafo «Leitura conjunta» antes do Guardrail — Dex (@dev). |
