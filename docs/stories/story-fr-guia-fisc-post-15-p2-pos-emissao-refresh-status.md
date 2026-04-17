# Story — FR-GUIA-FISC-15 (P2): Pós-emissão — onda 1: actualizar status da nota na lista *(épico filho)*

**ID:** STORY-FR-GUIA-FISC-POST-15-POS-EMISSAO-ONDA1  
**Prioridade:** P2  
**Epic:** Epic 2 — Consolidação pós-brainstorm (`docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md`; pós-emissão como épico filho)  
**Depende de:** [story-fr-guia-fisc-p0-lista-filtro-tipos-documento.md](./story-fr-guia-fisc-p0-lista-filtro-tipos-documento.md) (lista com `document_type` / filtro por tipo); `GET /mei-notas` operacional. **Rota de *sync*:** `GET /api/mei-notas/:id?sync=true` documentada em *Completion Notes* (já existia no backend). *QA com NFE/NFC-e na lista:* dependência branda [POST-0 emissão](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md) ou dados equivalentes em staging.  
**Bloqueia:** Ondas seguintes (PDF/XML/cancelamento — FR-GUIA-FISC-15 posteriores)  
**Fonte:** `docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md` (**FR-GUIA-FISC-15**)  
**UX:** `docs/specs/ux-spec-guia-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §7  
**Arquitetura:** `docs/technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §6  
**QA (opcional):** `docs/qa/plugnotas-multitipo-checklist.md` — secção **«Actualizar estado na lista (FR-GUIA-FISC-15 onda 1)»** adicionada; *ticks* manuais após execução de QA.

## User story

**Como** utilizador MEI,  
**quero** **actualizar o estado** de uma nota (NFS-e, NF-e ou NFC-e) na lista quando ainda estiver em processamento ou o status mudou no emissor,  
**para** acompanhar a emissão sem sair da aplicação (**FR-GUIA-FISC-15** — **onda 1** mínima).

## Contexto técnico

- **Primeira onda (esta story):** apenas **refresh de status** por registo (ícone na linha ou acção na *toolbar* — UX §7.2), chamando rota backend que encapsula lógica existente (`refreshWithPlugNotas` em [`mei-notas.service.js`](../../backend/src/services/mei-notas.service.js) ou equivalente). **Não** expor credenciais Plugnotas ao cliente (architecture §6.2).  
- **Não** incluir nesta story: download PDF/XML nem cancelamento (ondas futuras; UX §7.3).  
- Autenticação: mesmo utilizador dono da nota; `requireAuth`, `requireMeiEnabled`.

## BDD (aceite)

| Cenário | Dado | Quando | Então |
|--------|------|--------|-------|
| Pedir actualização | Linha na lista com nota emitida (NFSE/NFE/NFCE) | Utilizador activa **«Actualizar estado»** (ou ícone com `aria-label` — UX §7.2) | É enviado pedido autenticado ao backend; linha entra em estado de *loading* (*spinner* ou *skeleton* — UX §7.2). |
| Sucesso | API devolve dados actualizados | Resposta OK | Coluna **Status** / *badge* reflectem o novo valor persistido; *loading* termina. |
| Erro | API ou integrador falham | Resposta de erro | Mensagem legível na pilha ou na linha; **sem** PII desnecessária (**NFR-POST-02**); *loading* termina. |

**Detalhe:** se o tipo de documento não tiver *refresh* suportado no backend nesta onda, a UI deve desactivar o controlo ou mostrar mensagem honesta (alinhar na *Completion Notes* com lista de tipos suportados).

## Âmbito

| Must | Could | Fora |
|------|-------|------|
| Acção por linha (ou *toolbar* da lista) conforme UX §7.2 | *Toolbar* «actualizar várias» na mesma sprint | PDF/XML; cancelamento (§7.3) |
| Rota ou método HTTP documentado na story/*Completion Notes* + testes | Retry leve cliente se GET lista *stale* (architecture riscos §12) | Novo worker assíncrono obrigatório sem ADR |
| Suporte multitipo **quando** o backend expuser *refresh* para o tipo | | Alterar regras fiscais de estado |

## Definition of Ready

*(Verificação pós-implementação — critérios satisfeitos para desenvolvimento; QA multitipo NFE/NFC-e em staging continua dependente de dados ou POST-0.)*

- [x] [P0 lista + filtro](./story-fr-guia-fisc-p0-lista-filtro-tipos-documento.md) entregue ou paridade de dados de teste para NFSE/NFE/NFCE na lista. Para exercitar **NFE** e **NFC-e** na lista, recomenda-se [POST-0 emissão](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md) ou dados de teste pré-carregados **equivalentes** documentados — *não* bloqueante se a equipa garantir outra forma de ter essas linhas na BD/staging.  
- [x] Equipa confirmou assinatura actual de `refreshWithPlugNotas` e rota HTTP para o cliente: **sim** — `GET /api/mei-notas/:id?sync=true` → `obterNota(..., { sync: true })` (ver *Completion Notes*).  
- [x] Superfície da acção (ícone vs texto) alinhada a UX §7.2: botão **«Actualizar estado»** + ícone `RefreshCw` com `aria-label` multitipo (`MeiNfseListRowActions`).  
- [x] **Owner QA:** responsável pela execução da tabela **QA manual** e preenchimento do bloco *Owner QA* abaixo após validação em ambiente adequado (nome + data).

## Critérios de aceite

### (a) UX e A11y

- [x] Acção **«Actualizar estado»** (ou ícone *refresh* com `aria-label` explícito — UX §7.2) por linha ou escopo acordado com UX §7.2.  
- [x] Durante o pedido: *spinner* / *skeleton* na linha (UX §7.2).  
- [x] Erro mapeado para mensagem legível (sem *stack* cru ao utilizador).

### (b) Dados e API

- [x] Após sucesso, coluna **Status** e *badge* reflectem novo valor persistido (releitura da lista ou merge do registo devolvido — decisão na implementação documentada).  
- [x] Contrato HTTP (método, path, corpo se houver) documentado na story ou *Completion Notes*.

### (c) Multitipo

- [x] Funciona para **NFSE**, **NFE** e **NFCE** **quando** o backend suportar o *refresh* para o tipo; tipos não suportados tratados de forma explícita (ver BDD *Detalhe*).

### (d) Qualidade e observabilidade

- [x] Testes: pedido HTTP **na camada cliente** (`GET /mei-notas/:id?sync=true` via `meiNotasService`) + RTL do botão e helper; alinhado a `AGENTS.md`. *(Teste de integração Node da rota não foi exigido — rota backend pré-existente e inalterada.)*  
- [x] **NFR-POST-02:** no fluxo **Actualizar estado**, a mensagem apresentada ao utilizador em erro é a canónica em português; `plugnotasCode` / `httpStatus` seguem a partir do erro para mapeamento, sem repasse de `Error.message` bruto na *copy* principal (`userFacingMessageOnly` em `setOperationNfseError`).

## Tasks (implementação)

1. [x] Confirmar método em `mei-notas.service.js` e expor rota em `mei-notas.routes.js` / controller se ainda não existir para o cliente (architecture §6.2). — **Já existia:** `GET /api/mei-notas/:id?sync=true` → `obterNota(..., { sync: true })` → `refreshWithPlugNotas`.  
2. [x] Adicionar método em `meiNotasService.ts` (frontend). — **Já existia:** `obterNfse(id, sync)`.  
3. [x] UI na tabela do Guia MEI (`GuidesMei.tsx` ou componente de lista extraído).  
4. [x] Testes + gates `AGENTS.md`.

## QA manual (obrigatório para fecho de DoD)

| # | Acção | Resultado esperado |
|---|--------|---------------------|
| 1 | **NFSE:** linha em processamento ou com estado desactualizado → **Actualizar estado** | *Loading* na linha; status actualizado ou mensagem honesta se tipo não suportado. |
| 1b | **NFE:** repetir **1** (paridade multitipo) | Mesmo padrão que **1**. |
| 1c | **NFCE:** repetir **1** (paridade multitipo) | Mesmo padrão que **1**. |
| 2 | Simular erro de API (mock ou ambiente) | Mensagem legível; sem dados sensíveis em *toast* / pilha. |
| 3 | Teclado / leitor de ecrã no controlo de actualização | Foco e `aria-label` coerentes (UX §7.2). |

**Multitipo:** cruzar com [`docs/qa/plugnotas-multitipo-checklist.md`](../qa/plugnotas-multitipo-checklist.md) (secção FR-15).

*Owner QA:* preencher **uma única vez** em **Dev Agent Record → Owner QA** após executar a tabela acima.

## File list (checklist implementação)

- [x] `backend/src/services/mei-notas.service.js` *(sem alteração — `obterNota` + `refreshWithPlugNotas`)*  
- [x] `backend/src/controllers/mei-notas.controller.js` *(sem alteração — `detalhar` com `sync`)*  
- [x] `backend/src/routes/mei-notas.routes.js` *(sem alteração)*  
- [x] `frontend/src/services/meiNotasService.ts`  
- [x] `frontend/src/pages/GuidesMei.tsx` *(lista de notas)*  
- [x] `frontend/src/components/MeiNfseListRowActions.tsx`

## Definition of Done

- [x] Critérios de aceite (a)–(d) cumpridos no código e testes automatizados relevantes.  
- [ ] QA manual (tabela acima) executado; **Owner QA** preenchido com nome e data.  
- [x] Gates `AGENTS.md` (`lint`, `typecheck`, `npm test`).  
- [x] **NFR-POST-02** para o fluxo *sync* (mensagem canónica ao utilizador — ver AC (d)).  
- [x] `docs/qa/plugnotas-multitipo-checklist.md` actualizado com secção do fluxo (ticks manuais por QA).

**Estado:** implementação **entregue**; **DoD completo** após assinatura **Owner QA**.

## Refinamento

| Iteração | Data | Mudanças |
|----------|------|----------|
| 1 | 2026-04-16 | Alinhamento padrão epic (POST-14): Epic+PRD, dependências com links (P0 lista), BDD, âmbito, DoR, AC (a)–(d), QA multitipo (NFSE/NFE/NFCE), NFR, Dev Agent Record; feedback PO ~7→meta *Ready*. |
| 2 | 2026-04-16 | Feedback PO 9,5/10: dependência branda **POST-0** para QA com NFE/NFCE na lista (DoR + nota no cabeçalho **Depende de**). |
| 3 | 2026-04-16 | Revisão QA (Quinn): DoR/DoD/Status alinhados; AC (d) clarificado (testes cliente); NFR *sync* com mensagem canónica; Owner QA explícito como gate de DoD. |

## Dev Agent Record

### Agent Model Used

Composer / Dex

### Debug Log References

### Completion Notes List

- **Contrato HTTP:** `GET /api/mei-notas/:id?sync=true` (query `sync=true`). Sem corpo. Resposta: registo `mei_nfse` actualizado após `refreshWithPlugNotas` (NFSE/NFE/NFCE via `getAdapterByDocumentType` + `consultar` / `consultarPorIdOuProtocolo` / `consultarPorIntegracao`). Autenticação: `requireAuth`, `requireMeiEnabled`.  
- **Cliente:** `obterNfse(id, true)` / `obterNota(id, true)` em `meiNotasService.ts`.  
- **UI:** `MeiNfseListRowActions` — botão **Actualizar estado** com ícone `RefreshCw` (rotação em *loading*), `aria-label` com tipo de documento, `aria-busy` no botão e na linha (`<tr>` / cartão) durante qualquer acção na linha.  
- **Tipos suportados:** todos os que o backend resolve em `refreshWithPlugNotas` (requer `plugnotas_id`, `protocol` ou `id_integracao` + `cnpj_prestador` válido); caso contrário o botão fica **desactivado** com `title` explicativo (`notaFiscalPodeSincronizarEstadoEmissor`).  
- **Mensagens:** sucesso multitipo — «Estado da nota actualizado com sucesso.»; erro — «Erro ao actualizar o estado da nota.» (texto fixo ao utilizador; **NFR-POST-02** — `setOperationNfseError(..., { userFacingMessageOnly: true })` no `handleSyncNfse`).  
- **Deriva front/back:** o helper `notaFiscalPodeSincronizarEstadoEmissor` deve manter-se coerente com `refreshWithPlugNotas` no backend; alterações futuras no serviço exigem revisão do helper.

### File List (final)

- `frontend/src/services/meiNotasService.ts` — `notaFiscalPodeSincronizarEstadoEmissor`  
- `frontend/src/components/MeiNfseListRowActions.tsx`  
- `frontend/src/components/MeiNfseListRowActions.refresh-status.test.tsx`  
- `frontend/src/services/meiNotasService.test.ts`  
- `frontend/src/pages/GuidesMei.tsx`  
- `docs/qa/plugnotas-multitipo-checklist.md`

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-04-16 | 1 | FR-GUIA-FISC-15 onda 1: UI Actualizar estado, A11y, helper, testes, checklist QA | Dex |
| 2026-04-16 | 2 | Alinhamento pós-QA: DoR/DoD/Status; erro *sync* com mensagem canónica (`userFacingMessageOnly`) | Dex |

### Status

**Implementado (código + testes automatizados).** DoD **completo** após execução da tabela **QA manual** e preenchimento de **Owner QA** (nome + data).

### Owner QA

| Campo | Valor |
|--------|--------|
| **Estado** | Pendente — preencher após execução manual da tabela **QA manual**. |
| **Nome** | *(a preencher)* |
| **Data** | *(AAAA-MM-DD)* |
| **Ambiente** | *(ex.: local / staging / produção)* |
| **Notas** | *(opcional — NFSE / NFE / NFC-e cobertos? bloqueios?)* |
