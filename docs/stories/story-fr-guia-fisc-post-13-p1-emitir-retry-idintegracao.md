# Story — FR-GUIA-FISC-13 (P1): Política de emissão — anti-duplo clique e retry transitório (`idIntegracao`)

**ID:** STORY-FR-GUIA-FISC-POST-13-EMITIR-RETRY  
**Prioridade:** P1  
**Epic:** Epic 2 — Consolidação pós-brainstorm (`docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md`)  
**Depende de:** [story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md) (fluxo Emitir); **FR-GUIA-FISC-12** — feedback de erro e UX §5.2 (`docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md`; story dedicada em `docs/stories/` quando existir, ex.: `story-fr-guia-fisc-post-12-p1-emitir-feedback-erro.md`)  
**Bloqueia:** —  
**Fonte:** `docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md` (**FR-GUIA-FISC-13**)  
**UX:** `docs/specs/ux-spec-guia-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §5  
**Arquitetura:** `docs/technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §4  
**QA (opcional):** `docs/qa/plugnotas-multitipo-checklist.md` — validar anti-duplo clique e retry em NFSE/NFE/NFCE quando aplicável.

## User story

**Como** utilizador MEI,  
**quero** que o botão **Emitir** não dispare **duas emissões** por duplo clique e que, em falha **momentânea**, possa **tentar novamente** com mensagem clara,  
**para** evitar duplicidade no emissor e reduzir frustração (**FR-GUIA-FISC-13**).

## Contexto técnico

- Servidor: `mei-notas.service.js` — `emitirNota` define `payload.idIntegracao = mei-${userId}-${Date.now()}` quando ausente (propriedade **camelCase** como no código); **cada POST** gera novo id (não reutilizar no cliente para «retry» como se fosse o mesmo pedido).  
- Cliente: estado *pending* no *submit*; desactivar **Emitir** e, de preferência, o seletor de tipo até resposta (evitar troca de tipo a meio do pedido).  
- Retry: novo `POST` com o mesmo corpo de negócio é válido; **não** reutilizar manualmente o mesmo `idIntegracao` no cliente para simular retry — cada tentativa é novo id.  
- Classificação **retryable** vs **não retryable**: alinhar com **FR-GUIA-FISC-12** no PRD (e com a story dedicada quando existir em `docs/stories/`): exemplos típicos — 5xx, timeout de rede, 429; 4xx de validação/negócio = não retryable salvo decisão explícita documentada. Opcional backend: envelope `retryable` — só se fechado na implementação.

## BDD (aceite)

| Cenário | Dado | Quando | Então |
|--------|------|--------|--------|
| Anti-duplo clique | Formulário válido e utilizador clica **Emitir** | Clicar **Emitir** uma segunda vez antes da resposta (ou duplo clique rápido) | Apenas **um** pedido de emissão é enviado; **Emitir** permanece desactivado/loading até resposta. |
| Retry transitório | Resposta de erro **retryable** (ex.: 5xx, timeout) | Utilizador escolhe **Tentar novamente** | É enviado **um** novo POST (novo `idIntegracao` atribuído no servidor); estado de loading aplicado de novo; sem sugerir retry para erro **não retryable**. |
| Sucesso após retry | Após um erro **retryable**, o segundo POST conclui com sucesso | Resposta HTTP de sucesso no novo envio | **Paridade** com um primeiro envio bem-sucedido: feedback de sucesso, pilha de mensagens e actualização de lista/estado como em [POST-0](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md) (*submit* com sucesso); UX `docs/specs/ux-spec-guia-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §5 onde aplicável. |

**Detalhe (Então — retry):** após **Tentar novamente**, o utilizador vê o mesmo padrão de loading que no primeiro envio; em sucesso, **mesmo resultado** que num envio à primeira (POST-0); em falha não retryable, mensagem sem CTA de retry enganoso (**FR-GUIA-FISC-12**, UX §5.2).

## Âmbito

| Must | Could | Fora |
|------|-------|------|
| *Pending* + *disabled* em **Emitir** (e bloqueio coerente do seletor) durante o pedido | Envelope `retryable` no backend | Reprocessamento server-side do «mesmo» `idIntegracao`; fila offline |
| CTA **Tentar novamente** só para erros retryable; alinhado a UX §5.3 | Métricas de duplo clique bloqueado | Alterar regras fiscais ou payload além do fluxo já definido |
| Documentar lista/contrato de erros retryable (story ou código) | | |

## Definition of Ready

- [ ] [POST-0](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md) (fluxo Emitir) compreendido pela equipa.  
- [ ] **FR-GUIA-FISC-12** no PRD (`docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md`) — feedback de erro e UX §5.2 — compreendido; quando existir story em `docs/stories/`, cruzar com o mesmo contrato de *retryable*.  
- [ ] Critérios (a) e (b) abaixo aceites pelo PO.  
- [ ] Lista inicial de erros *retryable* acordada (pode espelhar FR-12 / decisão da story dedicada).

## Critérios de aceite

### (a) Anti-duplo clique / um pedido por ação consciente

- [x] Enquanto o pedido de emissão está em curso, **Emitir** está em estado loading/disabled e **não** aceita segundo *submit* (duplo clique ou cliques repetidos).  
- [x] O seletor de tipo (NFSE/NFE/NFCE) não permite alteração que invalide o pedido em voo (desactivado ou equivalente acordado com UX §5).  
- [x] Comportamento verificável por teste automatizado (RTL: segundo clique não dispara novo handler de envio) ou prova documentada na *Completion Notes*.

### (b) Retry transitório e `idIntegracao`

- [x] Em erro **retryable**, a UI mostra mensagem + **Tentar novamente** (UX §5.3); ao clicar, é efectuado **um** novo POST; o servidor atribui **novo** `idIntegracao` (não reutilização manual no cliente).  
- [x] Se o segundo POST (após **Tentar novamente**) for bem-sucedido, o resultado é **indistinguível** (UX e dados) de um primeiro envio com sucesso: critérios de feedback/lista como em POST-0 (*submit* sucesso).  
- [x] Em erro **não retryable**, não é apresentado CTA de retry que sugira repetir o mesmo envio de forma enganosa.  
- [x] Lista ou referência aos códigos/situações retryable documentada (comentário técnico, tipo partilhado ou contrato API).  
- [x] Teste (RTL ou serviço mockado): sequência falha retryable → utilizador confirma retry → segundo POST; ou documentação equivalente na *Completion Notes*.

### NFR e observabilidade

- [x] **NFR-POST-02:** mensagens e eventos de erro **sem PII** (sem payload completo, sem CPF/CNPJ, sem chaves de API); apenas códigos HTTP, tipo de nota, `requestId`/`idIntegracao` se necessário para suporte.  
- [x] Logs estruturados no cliente (nível *warn*/*error*) para falha de emissão e para *retry*, sem dados sensíveis.

## Tasks (implementação)

1. [x] Estado *pending* + *disabled* em **Emitir** e bloqueio do seletor de tipo em `GuidesMei` (ou wrapper de emissão) para **NFSE, NFE e NFCE**.  
2. [x] Integrar com feedback de erro (**FR-GUIA-FISC-12**; story dedicada quando existir): CTA **Tentar novamente** só quando `retryable`; mapear erros (com backend se necessário).  
3. [x] Testes automatizados (RTL e/ou serviço) + gates `AGENTS.md`.

## QA manual (obrigatório)

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 1 | Preencher NFSE válido, clicar **Emitir** duas vezes rapidamente | Um único envio; botão em loading até resposta. |
| 2 | Simular erro retryable (mock ou ambiente); clicar **Tentar novamente** | Novo POST; novo `idIntegracao` no servidor (ver rede ou logs). |
| 2b | Após retry, resposta de sucesso | Comportamento igual ao primeiro envio com sucesso (POST-0). |
| 3 | Erro 4xx de validação | Sem CTA de retry enganoso; mensagem alinhada a **FR-GUIA-FISC-12** / UX §5.2. |
| 4 | Repetir para NFE e NFCE se o fluxo estiver disponível | Mesmo padrão anti-duplo clique e retry. |

*Owner QA:* preencher **uma única vez** em **Dev Agent Record → Owner QA** (fim deste documento).

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx` *(ou componente de emissão extraído)*  
- [x] `frontend/src/services/meiNotasService.ts` *(se classificação de erro no cliente)* — **sem alteração** (classificação no cliente).  
- [ ] `backend/src/services/mei-notas.service.js` *(opcional — envelope `retryable`)* — **não aplicado**.

## Definition of Done

- Critérios de aceite (a) e (b) cumpridos; QA manual executado; **Owner QA** preenchido.  
- Testes e gates `AGENTS.md`.  
- **NFR-POST-02** verificada para mensagens/logs desta story.

## Refinamento

| Iteração | Data | Mudanças |
|----------|------|----------|
| 1 | 2026-04-16 | Primeira passagem SM: dependência POST-0, BDD, âmbito, DoR, AC (a)/(b), QA manual, NFR-POST-02, checklist multitipo opcional. |
| 2 | 2026-04-16 | Feedback PO: `idIntegracao` alinhado ao código; BDD «sucesso após retry» + AC/QA; Owner QA único (Dev Agent Record); sucesso após retry referenciado a POST-0 (paridade com primeiro envio). |
| 3 | 2026-04-16 | Dependência POST-12: referência PRD + nome de story alvo (evitar link quebrado); BDD sucesso sem ficheiro POST-11 inexistente. |
| 4 | 2026-04-16 | Feedback PO 9,5/10: DoR e texto alinhados a **FR-GUIA-FISC-12** (PRD) vs story ainda inexistente; refinamento it.1 sem referência obsoleta POST-11/12; tasks/QA/contexto com mesma linguagem. |

## Dev Agent Record

### Agent Model Used

Composer / Dex (implementação frontend).

### Debug Log References

### Completion Notes List

- **Anti-duplo clique:** `meiEmitInFlightRef` (barreira síncrona) + `nfseSubmitting` / `nfeLikeSubmitting`; `MeiFiscalEmissionTypeSegmented` já desactivado durante envio.  
- **Retryable:** `isMeiEmissionErrorRetryable` — 408, 429, 5xx, `plugnotas_gateway_*`, falhas de rede (`isFetchConnectivityFailure`).  
- **NFS-e + `idIntegracao` manual:** `omitClientIdIntegracaoOnNextEmitRef` no clique «Tentar novamente» para o servidor gerar novo id; NF-e/NFC-e não enviam `idIntegracao` no payload do formulário.  
- **Logs:** `console.warn('[mei-emission]', { phase, retryable?, httpStatus?, documentType? })` — sem corpo de payload nem documentos.  
- **QA (Quinn):** RTL em `GuidesMei.emission-fr-guia-fisc-13.test.tsx` — smoke anti-duplo clique para **NF-e** e **NFC-e**; após retry NFS-e e retry NF-e, asserção de `data-nfse-feedback-tier="success"` com texto de protocolo (paridade com POST-0). `afterEach` limpa `document.body` para isolamento entre casos; troca NFS-e → NF-e/NFC-e confirma o diálogo «Alterar tipo» quando presente.

### File List (final)

- `frontend/src/utils/meiEmissionRetryable.ts`  
- `frontend/src/utils/meiEmissionRetryable.test.ts`  
- `frontend/src/pages/GuidesMei.tsx`  
- `frontend/src/pages/GuidesMei.emission-fr-guia-fisc-13.test.tsx`  
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx` (`EmissaoFiscalErrorAlert` + modal: prop `onRetry`)  
- `docs/qa/plugnotas-multitipo-checklist.md`

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-04-16 | 1 | FR-GUIA-FISC-13: in-flight ref, retry CTA, omit idIntegracao no retry NFS-e, testes | Dex |

### Status

Implementado — QA manual conforme tabela na story (Owner QA).

### Owner QA

*(nome / data — preencher após execução manual)*
