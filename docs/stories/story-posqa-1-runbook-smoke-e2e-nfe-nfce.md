# Story — POSQA-1 (P0): Runbook smoke E2E **NF-e** e **NFC-e** (sandbox / homologação)

**ID:** STORY-POSQA-1-RUNBOOK-SMOKE-NFE-NFCE  
**Prioridade:** P0  
**Depende de:** —  
**Bloqueia:** evidência formal para release que cite **FR-POSQA-01**; QA piloto recomendado antes de fechar **STORY-POSQA-3**.  
**Fonte:** `docs/prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md` (**FR-POSQA-01**, **FR-POSQA-02**, **NFR-POSQA-01**, **NFR-POSQA-04**)  
**Arquitetura:** `docs/technical/architecture-mei-posqa-nfe-nfce-2026-04-07.md` §6  
**UX:** — (processo operacional; sem ecrã novo)

## User story

**Como** membro da equipa (QA ou Dev),  
**quero** um **runbook reproduzível** para executar smoke E2E de emissão **NF-e** e **NFC-e** em ambiente **não produtivo**, com pré-condições e template de evidência,  
**para** validar integração real Plugnotas além dos testes unitários com mock (**FR-POSQA-01**, **FR-POSQA-02**).

## Contexto técnico

- **Endpoints:** `POST /mei-notas/emitir` com `documentType` **NFE** / **NFCE** e `payload` válido (`validateNfeLikePayload`); `GET /mei-notas/setup/emissao-fiscal/empresa`; opcionalmente downloads PDF/XML quando existir `plugnotas_id`.  
- **Segurança:** **NFR-POSQA-01** — não versionar API keys, certificados ou passwords; referir variáveis de ambiente / cofre.  
- **Local sugerido:** novo ficheiro em `docs/runbook/` (ex.: `runbook-smoke-nfe-nfce-plugnotas-sandbox.md`) **ou** secção dedicada em `docs/operacao-mei-nfse.md` com âncora clara.  
- **Limitações:** sandbox ≠ produção por UF — documentar no runbook (PRD §12).

## Critérios de aceite

### Runbook (**FR-POSQA-01**)

- [ ] Documento único identificável (path em `docs/runbook/` ou extensão de `operacao-mei-nfse` com índice).  
- [ ] **Pré-condições:** backend com `PLUGNOTAS_API_BASE_URL` + `PLUGNOTAS_API_KEY`; utilizador com `requireMeiEnabled`; certificado A1 quando aplicável; CNPJ de teste; empresa Plugnotas com modalidades **ativas** para cenário “sucesso fim-a-fim” (ou sub-secção “cenário bloqueado” com `GET` empresa).  
- [ ] **Passos ordenados:** autenticação → (opcional) `GET` empresa → `POST` emitir NFE → `POST` emitir NFCE → `GET` listar com `documentType` → opcional PDF/XML.  
- [ ] **Payload mínimo:** referência a exemplos alinhados a testes (`mei-notas-core.test.js`) ou formulário Guia MEI, **sem** dados reais de terceiros.

### Resultado esperado e evidência (**FR-POSQA-02**)

- [ ] Secção “Resultado esperado” (ex.: nota `processando` / `concluido` conforme sandbox).  
- [ ] “Onde registar evidência” (ticket interno, campos mínimos: ID da nota interna, `document_type`, status, data/hora, **sem** colar `response_json` completo com dados sensíveis).

### Manutenção (**NFR-POSQA-04**)

- [ ] Linha “Owner / quando rever” quando `mei-notas` ou serviços Plugnotas NFe/NFCe mudarem.

## Tasks (implementação)

1. [x] Redigir runbook em Markdown com secções acima.  
2. [x] Referenciar PRD POSQA e arquitetura §6 no cabeçalho do doc.  
3. [x] Opcional: link a partir de `docs/operacao-mei-nfse.md` ou `PROJECT_MEMORY` (comando útil).  
4. [ ] Primeira execução piloto por QA (fora do âmbito de código — checklist manual).

## File list (checklist implementação)

- [x] `docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md` *(nome ajustável)*  
- [x] `docs/operacao-mei-nfse.md` — link de entrada *(se aplicável)*  
- [x] `.cursor/mem/PROJECT_MEMORY.md` — linha em “Comandos úteis” ou “Última atualização” *(opcional)*

## Definition of Done

- Critérios de aceite verificados por revisão de pares (Dev ou QA lead).  
- **NFR-POSQA-01:** grep no ficheiro — zero secrets em claro.  
- PRD §14 — **FR-POSQA-01** e **FR-POSQA-02** satisfeitos.

## Qualidade / CodeRabbit

- Não commitar ficheiros `.env` nem exemplos com API keys reais.

## Dev Agent Record

### Status

Ready for Review

### Completion Notes List

- Runbook criado em `docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md` com pré-condições, rotas `/api/mei-notas/*`, payloads JSON de exemplo (CNPJs fictícios alinhados a `mei-notas-core.test.js`), cenários A/B, resultado esperado, template de evidência, manutenção NFR-POSQA-04 e limitações sandbox/UF.  
- Entrada de índice em `docs/operacao-mei-nfse.md` (secção Objetivo) com link ao runbook.  
- `PROJECT_MEMORY.md` atualizado com ponteiro ao runbook em “Comandos úteis”.  
- Task 4 (piloto QA) permanece para equipa QA.  
- Critérios de aceite no corpo da story: marcar após revisão por pares / grep NFR-POSQA-01.  
- **Correcção pós-QA (obs. não bloqueante):** runbook v1.1 com rotas explícitas `GET /api/mei-notas/:id/pdf` e `GET /api/mei-notas/:id/xml` (secção «Base URL e rotas» e passo 7 do Cenário A). Execução E2E real e Task 4 continuam dependentes de ambiente/credenciais sandbox (alinhado às observações 1–2 do QA).

### File List (final)

- `docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md`  
- `docs/operacao-mei-nfse.md`  
- `.cursor/mem/PROJECT_MEMORY.md`

---

## QA Results

### Revisão QA — 2026-04-07 (Quinn)

**Decisão de gate:** **PASS com observações** (entrega documental; execução piloto ainda pendente).

#### Rastreio — critérios de aceite (story)

| Área | Veredicto | Evidência / notas |
|------|-----------|-------------------|
| **FR-POSQA-01** — Documento único em `docs/runbook/` | **Satisfeito** | `docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md` existe; índice em `docs/operacao-mei-nfse.md` (secção Objetivo). |
| **FR-POSQA-01** — Pré-condições (env, MEI, certificado, modalidades, cenário bloqueado) | **Satisfeito** | Tabela § Pré-condições + Cenário B; política “apenas NFS-e” e `nfe`/`nfce` inactivos explícitos. |
| **FR-POSQA-01** — Passos ordenados | **Satisfeito** | Cenário A: auth → GET empresa → POST NFE → POST NFCE → GET listar → opcional PDF/XML (passo 7). |
| **FR-POSQA-01** — Payload mínimo + referência testes | **Satisfeito** | JSON de exemplo + ponteiro a `mei-notas-core.test.js`; CNPJs/CPFs fictícios; menção a UI Guia MEI. |
| **FR-POSQA-02** — Resultado esperado | **Satisfeito** | Secção “Resultado esperado” com estados `processando` / fluxos de erro. |
| **FR-POSQA-02** — Template de evidência | **Satisfeito** | Tabela de campos mínimos; proibição explícita de `response_json` completo e secrets. |
| **NFR-POSQA-04** — Owner / quando rever | **Satisfeito** | Secção “Manutenção” com owner e gatilhos de revisão. |
| **NFR-POSQA-01** — Sem secrets no doc | **Satisfeito** (revisão estática) | Nenhuma API key ou credencial em claro; apenas menções genéricas a `Authorization` / `x-api-key` como “não colar”. |
| **Task 4** — Primeira execução piloto QA | **Em aberto** | Não executado nesta revisão (sem ambiente sandbox ligado). |

#### Observações (não bloqueantes)

1. **Passo opcional PDF/XML:** o runbook referencia `mei-notas.routes.js`; rotas reais são `GET /api/mei-notas/:id/pdf` e `GET /api/mei-notas/:id/xml` — opcional acrescentar uma linha explícita no runbook para quem seguir só por API (melhoria de clareza).
2. **Execução E2E real:** o gate **PASS** aplica-se à **qualidade do artefacto**; validação operacional completa exige correr o procedimento num sandbox com credenciais (Task 4) e anexar evidência ao ticket interno.
3. **Checkboxes no corpo da story:** os critérios de aceite em Markdown permanecem por marcar no fluxo PO/SM após aceitação formal; esta revisão QA não altera essa secção (política de edição do ficheiro de story).

#### Testes automáticos

- N/A — story só entrega documentação.

**CodeRabbit:** não executado nesta revisão.

— Quinn, guardião da qualidade 🛡️
