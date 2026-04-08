# PRD — **Empresa Plugnotas orquestrada** no cadastro de certificado (site)

**Versão:** 1.0  
**Data:** 2026-04-07  
**Tipo:** Brownfield — Guia MEI / setup emissão fiscal (`POST` certificado + `POST`/`PATCH` empresa)  
**Fonte canónica do pedido:** [`docs/brief/brief-empresa-plugnotas-orquestrada-no-cadastro-certificado-2026-04-07.md`](../brief/brief-empresa-plugnotas-orquestrada-no-cadastro-certificado-2026-04-07.md)

**Relação com outros artefatos:**

- **`docs/prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`** — documentos activos no cadastro; payload de empresa e policy layer. Este PRD **não substitui** esses requisitos; **garante** que o cadastro de empresa ocorre **no mesmo marco de utilizador** que o envio do certificado quando aplicável.  
- **`docs/prd/PRD-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`** — espelho `documentos_ativos`; após orquestração bem-sucedida, **`persistDocumentosAtivosMirrorAfterEmpresa`** mantém-se quando `documentosAtivos` estiver no payload (§6.3).  
- **`docs/operacao-mei-nfse.md`** — ordem das chamadas, 404 empresa, 409 certificado, ambientes.  
- **`backend/src/controllers/mei-notas.controller.js`** — `cadastrarPlugNotasCertificado`, `cadastrarPlugNotasEmpresa`.  
- **`backend/src/services/plugnotas/empresa.service.js`** — `cadastrarCertificadoPlugNotas`, `cadastrarEmpresaPlugNotas`, resolução 409.  
- **Não substitui** orientação legal; o produto orquestra chamadas ao provedor.

---

## 1. Resumo executivo

Hoje o utilizador pode **concluir o envio do certificado A1** no site **sem** que, na mesma jornada, exista **empresa/emitente** registada no Plugnotas para o CNPJ em causa. Isso desalinha a expectativa com o painel **Empresas** em `app2.plugnotas.com.br` e aumenta falhas posteriores (consulta, emissão, suporte).

Este PRD define requisitos rastreáveis (**FR-ORQ-CERT-\***), NFRs, decisões de produto **fechadas** (incluindo modelo de UI, validação pré-upload, falha parcial e estratégia de API), compatibilidade brownfield e critérios de release para que **uma única conclusão consciente do fluxo** no site resulte em **certificado referenciado** e **empresa criada ou actualizada** no Plugnotas, respeitando a restrição técnica: **`POST /empresa` exige payload completo de emitente**, não apenas o ficheiro `.pfx`.

---

## 2. Visão de produto (experiência)

O utilizador percebe que **“concluir a configuração fiscal”** envia **ao mesmo tempo** (na mesma intenção de utilizador) o certificado e os dados do emitente ao Plugnotas. Vê **progresso em duas fases** na interface (“certificado…” → “empresa…”) e recebe **uma confirmação única** em caso de sucesso. Se a segunda fase falhar, entende que o certificado **pode** já estar no provedor e dispõe de um caminho claro para **repetir só o registo da empresa** sem obrigatoriamente reenviar o `.pfx`.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Estado remoto** | Certificado no Plugnotas sem linha em **Empresas**. | Estado coerente após conclusão do fluxo no site. |
| **Abandono** | Dois passos desligados cognitivamente. | Um marco de conclusão alinhado ao painel do provedor. |
| **Suporte** | “Já enviei o certificado” sem emitente. | Menos tickets e menos `GET /empresa` 404 evitáveis. |
| **Falha parcial** | Orquestração futura pode falhar a meio. | Política de erro, retry e mensagens honestas (§6.2). |

---

## 4. Personas e cenários

| Persona | Cenário de validação |
|---------|----------------------|
| **MEI — primeiro cadastro** | Preenche dados do emitente + `.pfx`; conclui; no app2 o CNPJ aparece em **Empresas** com configuração esperada (incl. documentos activos se o fluxo já os expuser). |
| **MEI — empresa já existia no Plugnotas** | Fluxo resolve conflito como hoje (`cadastrarEmpresaPlugNotas` → actualização); utilizador vê sucesso coerente, sem duplicação confusa de mensagens. |
| **MEI — certificado 409** | Resolução actual de ID mantém-se; **em seguida** empresa é registada com o ID correcto; sem mensagens contraditórias (§6.4). |
| **MEI — falha só na empresa** | Certificado pode ter sido aceite; UI oferece **“Tentar registrar empresa novamente”** com os dados já preenchidos e reutilização do ID do certificado quando disponível na resposta/sessão. |
| **Utilizador — só actualização sem novo certificado** | Fluxo **“Atualizar cadastro (sem novo certificado)”** permanece independente; não é obrigatório passar pelo upload de `.pfx` (§5.2). |

**Stakeholders:** PO, UX (copy e estados de loading), Architect (contrato, correlacionação de erros), Backend, Frontend, QA, Suporte.

---

## 5. Escopo

### 5.1 Dentro do escopo (MVP / P0)

- **Orquestração no marco de utilizador:** após **sucesso** de `POST …/certificado` (incluindo ramo 409 com ID recuperado), o **mesmo fluxo** dispara **imediatamente** o cadastro de empresa com `certificado` = ID devolvido pelo Plugnotas, **sem** exigir segundo clique não comunicado (“mágico”).  
- **Pré-validação:** o utilizador **não** pode iniciar o envio do `.pfx` até o **formulário de dados de emitente** necessário a `POST /empresa` estar **válido** segundo as regras já expostas na Guia MEI (§6.1).  
- **UI:** copy explícita (§2); indicador de **duas fases**; mensagem única de sucesso; estado de erro da fase 2 com CTA de retry (§6.2).  
- **Compatibilidade:** reutilizar `cadastrarEmpresaPlugNotas` e política de payload MEI / documentos activos (requisitos **FR-CAD-DOC-01** … **FR-CAD-DOC-11** do PRD de documentos activos, quando aplicável).  
- **Espelho Supabase:** quando o payload de empresa incluir `documentosAtivos`, chamar **`persistDocumentosAtivosMirrorAfterEmpresa`** após sucesso (comportamento actual do controller).  
- **Observabilidade mínima:** distinguir em logs ou códigos de erro expostos ao cliente **falha de certificado** vs **falha de empresa** (sem vazar segredos — NFR).  
- **Testes:** cenários §11 e gates do `AGENTS.md`.

### 5.2 Fora do escopo (fase 2 ou explícito)

- **Endpoint composto** dedicado no backend (**opcional P1** — §6.5).  
- Garantir **autorização** de nota fiscal no mesmo request.  
- Webhook ou sync em tempo real só pelo painel Plugnotas.  
- Eliminar a possibilidade técnica de certificado órfão em **todas** as condições de rede (compensação transaccional distribuída completa).  
- Alterar o modelo de recursos do Plugnotas (REST continua com `/certificado` e `/empresa` separados no provedor).

### 5.3 P1 (opcional pós-MVP)

- **`POST …/setup/emissao-fiscal/emitente`** (nome final na story) que aceita multipart + metadados e executa certificado → empresa no servidor com **request-id** único para suporte.  
- Métricas agregadas (taxa de falha fase 2, retries).

---

## 6. Decisões de produto (fechadas neste PRD)

### 6.1 Validação antes do upload do certificado

**Decisão:** **Bloquear** o envio do ficheiro `.pfx` (botão desactivado ou validação ao clicar) até **todos os campos obrigatórios** do emitente para `POST /empresa` estarem válidos no formulário **e** (quando já existir na UI) a selecção de **documentos activos** cumprir **FR-CAD-DOC-03** (pelo menos um tipo).

**Racional:** reduz a classe de falha “certificado aceite, empresa recusada” e evita estado órfão na maioria dos casos felizes.

**Critério de fecho:** story lista campos mínimos exactos (alinhados ao backend e a `operacao-mei-nfse.md`).

### 6.2 Falha após certificado bem-sucedido

**Decisão:**

1. Mostrar mensagem que explica que **o certificado pode já estar no Plugnotas** e que os **dados do emitente não foram concluídos**.  
2. Oferecer **“Tentar registrar empresa novamente”** que reexecuta **apenas** a chamada de empresa com o **mesmo** `certificado` ID (obtido da resposta de sucesso do primeiro passo, ou da resolução 409, persistido em estado de fluxo no cliente até conclusão ou abandono explícito).  
3. **Não** exigir re-upload do `.pfx` neste retry **se** o ID do certificado for conhecido e ainda válido para o Plugnotas.  
4. Se o retry falhar por motivo não recuperável, link ou texto de ajuda para **`docs/operacao-mei-nfse.md`** / painel Plugnotas (sem jargão de API na mensagem principal).

**Critério de fecho:** QA reproduz falha simulada na fase 2 e valida retry e copy.

### 6.3 Espelho `documentos_ativos`

**Decisão:** Manter **`persistDocumentosAtivosMirrorAfterEmpresa`** após sucesso da **fase empresa** quando `documentosAtivos` estiver presente no body, como em `cadastrarPlugNotasEmpresa` actual. Nenhuma regressão em relação a **`PRD-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`**.

### 6.4 Certificado 409 (duplicado)

**Decisão:** Manter o fluxo actual de **resolução de ID**; a fase **empresa** deve usar o **ID final** devolvido ou recuperado. A mensagem ao utilizador deve ser **única e coerente** após ambas as fases (evitar “certificado criado” se apenas se recuperou ID — alinhar copy na story ao comportamento real).

### 6.5 Modelo de UI e API interna (MVP)

**Decisão:**

| Aspecto | MVP (P0) |
|---------|----------|
| **Interacção** | **Um único CTA principal** de conclusão (ex.: **“Concluir configuração fiscal”** ou equivalente) que inicia a **sequência** certificado → empresa; o utilizador pode ainda **navegar** por secções do formulário antes disso. |
| **Chamadas HTTP** | **Duas** chamadas sequenciais às rotas **existentes** (`POST …/certificado` depois `POST …/empresa`), com **estado de loading unificado** e sub-estados na copy (fase 1 / fase 2). |
| **Novo endpoint** | **Não obrigatório** no MVP; **P1** opcional para observabilidade e futuros clientes (mobile). |

**Racional:** entrega mais rápida, **CR** explícito para rotas actuais, menor risco de regressão; Architect pode propor endpoint composto na mesma release se o esforço for marginal (decisão na story).

### 6.6 Idempotência e empresa já existente

**Decisão:** Comportamento actual de **`cadastrarEmpresaPlugNotas`** (conflito → tentativa de actualização) é **canónico**; a orquestração **não** deve alterar semântica sem ADR ou extensão de PRD.

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-ORQ-CERT-01** | O fluxo de **primeiro cadastro** com certificado A1 exige que o utilizador **complete e valide** os dados de emitente **antes** de enviar o `.pfx` (§6.1). | P0 |
| **FR-ORQ-CERT-02** | Ao **concluir** o fluxo, o sistema executa **primeiro** o cadastro do certificado e **em seguida** o cadastro/actualização da empresa com o campo **`certificado`** preenchido com o identificador obtido do Plugnotas. | P0 |
| **FR-ORQ-CERT-03** | A interface apresenta **duas fases** de progresso discerníveis (texto ou componente equivalente) durante a submissão. | P0 |
| **FR-ORQ-CERT-04** | Em **sucesso completo**, uma **única** mensagem confirma que **certificado e dados do emitente** foram enviados ao serviço de emissão (sem termos `POST`/`PATCH`). | P0 |
| **FR-ORQ-CERT-05** | Se a **fase empresa** falhar após sucesso da **fase certificado**, o sistema explica a situação e oferece **retry da fase empresa** sem re-upload obrigatório do `.pfx` quando o ID do certificado for conhecido (§6.2). | P0 |
| **FR-ORQ-CERT-06** | O fluxo **409** no certificado continua suportado; após ID resolvido, a **fase empresa** prossegue automaticamente **no mesmo marco** de conclusão (sem novo clique intermédio). | P0 |
| **FR-ORQ-CERT-07** | O fluxo **“Atualizar cadastro (sem novo certificado)”** permanece disponível e **independente** do fluxo de upload de certificado (não regressão). | P0 |
| **FR-ORQ-CERT-08** | Quando `documentosAtivos` for enviado no payload de empresa, o espelho Supabase é actualizado conforme lógica actual de `persistDocumentosAtivosMirrorAfterEmpresa` (§6.3). | P0 |
| **FR-ORQ-CERT-09** | (P1) Telemetria anónima: contagem de conclusões com sucesso total vs falha na fase 2 — **só** com base legal/política do produto. | P1 |

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|-------|
| **NFR-ORQ-CERT-01** | **Segurança** | Não persistir senha do certificado em `localStorage` além do já acordado no produto; não logar binários nem credenciais. |
| **NFR-ORQ-CERT-02** | **Observabilidade** | Logs ou metadados de erro permitem distinguir `certificado` vs `empresa` em diagnóstico (ex.: campo `phase` em erro estruturado interno ou código público estável). |
| **NFR-ORQ-CERT-03** | **Performance** | A sequência é **síncrona do ponto de vista do utilizador** (um loading); timeouts e mensagens alinhados ao comportamento actual das rotas. |
| **NFR-ORQ-CERT-04** | **Acessibilidade** | Anúncio de estado (ex.: `aria-live`) para mudança de fase e para erro, sem depender só de cor. |
| **NFR-ORQ-CERT-05** | **Qualidade** | Gates `npm run lint`, `npm run typecheck`, `npm test` (`AGENTS.md`); ficheiros tocados na story. |

---

## 9. Requisitos de compatibilidade (brownfield)

| ID | Requisito |
|----|-----------|
| **CR-ORQ-CERT-01** | Endpoints existentes `POST …/setup/emissao-fiscal/certificado` e `POST …/setup/emissao-fiscal/empresa` (e aliases em `mei-notas.routes.js`) **permanecem**; clientes que ainda chamam em **duas acções manuais** não são quebrados. |
| **CR-ORQ-CERT-02** | Respostas de sucesso/erro das rotas individuais mantêm **shape** compatível ou migração documentada na story. |
| **CR-ORQ-CERT-03** | **FR-CAD-DOC-\*** e policy de payload **não** são enfraquecidos; combinação de documentos activos continua válida. |
| **CR-ORQ-CERT-04** | `consultarPlugNotasEmpresa` e fluxos de `PATCH` **não** regressam. |

---

## 10. Integração técnica (resumo — detalhe na story + architect)

| Área | Abordagem |
|------|-----------|
| **Frontend** | `GuidesMei` (ou módulo do setup fiscal): estado de fluxo com `certificadoId`, sequência de `fetch`, tratamento de erro por fase, CTA retry. |
| **Backend** | MVP: sem mudança obrigatória; opcional serviço partilhado se se quiser deduplicar lógica entre controller futuro composto e controllers actuais. |
| **Plugnotas** | Ordem: `POST /certificado` → `POST /empresa` com `certificado`; erros mapeados existentes. |
| **Testes** | Testes de integração HTTP e/ou unitários no serviço Plugnotas simulando 200, 409+resolve, falha na segunda chamada. |

---

## 11. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| **Paridade painel** | Utilizador em sandbox/produção vê CNPJ em **Empresas** no app2 após conclusão do fluxo (teste manual + QA). |
| **Menos estado incompleto** | Redução qualitativa de ocorrências “só certificado” (suporte / auditoria de erros 404 em `GET empresa` pós-onboarding). |
| **Resiliência** | Retry da fase 2 recupera casos de falha transitória (teste automatizado ou manual documentado). |
| **Qualidade** | Zero regressão nos fluxos **sem** novo certificado e **consulta** emitente. |

---

## 12. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Falha de rede entre as duas chamadas | Estado parcial | §6.2 retry + copy honesta; operação documentada. |
| ID de certificado expira ou invalida entre tentativas | Retry inútil | Mensagem a orientar novo upload ou suporte; edge case na story. |
| Duplo clique no CTA | Chamadas duplicadas | Desactivar botão durante submissão; idempotência no lado empresa já tratada pelo serviço existente quando aplicável. |
| Confusão com “documentos activos” | Escopo cruzado | Alinhamento explícito a **PRD-cadastro-empresa-documentos-ativos** na mesma sprint ou dependência de story. |

---

## 13. Epic e stories (proposta)

**Épico sugerido:** Setup fiscal MEI — **orquestração certificado + empresa Plugnotas**.

| Story sugerida | Conteúdo mínimo |
|----------------|-----------------|
| **Story A (P0)** | Frontend: validação pré-upload; estado de duas fases; sequência chamadas; retry fase 2; testes E2E ou integração conforme repo. |
| **Story B (P0)** | Backend (se necessário): expor `certificadoId` de forma estável na resposta JSON do certificado para o cliente **se** hoje não for suficiente; documentar contrato. |
| **Story C (P0)** | QA: matriz de casos §4 + 409 + conflito empresa. |
| **Story D (P1)** | Endpoint composto opcional + correlacionação de logs (§5.3). |

Cada story deve referenciar este PRD, o brief, checklist, **file list** e gates.

---

## 14. Critérios de release / Definition of Done (produto)

- [ ] **FR-ORQ-CERT-01** a **FR-ORQ-CERT-08** satisfeitos.  
- [ ] **FR-ORQ-CERT-09** satisfeito ou adiado com acordo PO.  
- [ ] **NFR-ORQ-CERT-01** a **NFR-ORQ-CERT-05** verificados.  
- [ ] **CR-ORQ-CERT-01** a **CR-ORQ-CERT-04** sem regressão comprovada.  
- [ ] Decisões **§6.1** a **§6.6** reflectidas na implementação e, se necessário, em `operacao-mei-nfse.md`.  
- [ ] Architect validou contrato de resposta do certificado e impacto em mobile/futuros clientes.

---

## 15. Checklist de QA (produto)

1. Fluxo feliz: certificado + empresa; verificação no app2 Plugnotas.  
2. Formulário incompleto: botão de envio bloqueado ou validação clara (**FR-ORQ-CERT-01**).  
3. Simular falha na segunda chamada: copy + retry sem novo `.pfx`.  
4. **409** certificado: sequência completa até empresa.  
5. Empresa já existente: actualização sem erro de produto indevido.  
6. **Atualizar sem novo certificado:** smoke sem regressão.  
7. Leitor de ecrã: anúncio de fase de progresso e de erro.

---

## 16. Change log

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-07 | PM (Morgan) | Versão inicial a partir de `brief-empresa-plugnotas-orquestrada-no-cadastro-certificado-2026-04-07.md`; decisões §6 fechadas no PRD. |

---

*Próximo passo canónico AIOX: **@architect** — contrato de resposta `certificado`, opcional endpoint composto, correlacionação de erros; **@sm** — story(ies) em `docs/stories/` com IDs **FR-ORQ-CERT-**\*; **@dev** — implementação com gates do `AGENTS.md`; **@qa** — matriz §15.*
