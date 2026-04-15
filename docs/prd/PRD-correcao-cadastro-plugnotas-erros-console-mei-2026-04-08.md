# PRD — Correção integrada: cadastro Plugnotas e triagem de erros na consola (Guia MEI)

**Versão:** 1.0  
**Data:** 2026-04-08  
**Tipo:** Brownfield — Guia MEI, `POST/GET` empresa emissão fiscal (Plugnotas), `POST` validação guia (Serpro)  
**Fonte canónica do pedido:** [`docs/brief/brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md`](../brief/brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md)

**Relação com outros artefatos (este PRD orquestra, não substitui):**

| Artefacto | Papel |
|-----------|--------|
| [`PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) | **Canónico** para payload `nfse.config.prefeitura`, trilhos A–D, **FR-PREF-***, **NFR-PREF-***. |
| [`PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) | Modo NFS-e Nacional sem IM/prefeitura no formulário; **FR-NAT-***, **NFR-N04**. |
| [`brief-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](../brief/brief-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) | Descoberta schema `prefeitura`, opções técnicas. |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Variáveis Plugnotas, debug, operação. |
| [`ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md), [`ADR-plugnotas-nfse-nacional-empresa-spike.md`](../adr/ADR-plugnotas-nfse-nacional-empresa-spike.md) | Contrato `nfse` / nacional. |

**Âmbito distintivo deste PRD:** além do bloqueio **`nfse.config.prefeitura`**, formalizar **triagem da “tríade” de erros na consola** (GET 404 empresa, POST empresa 400, `mei-guide/validate` 400 com texto genérico), **mensagens accionáveis**, **documentação de suporte** e **semântica HTTP** adequada para falhas Serpro — sem duplicar os requisitos de payload já cobertos por **FR-PREF-***.

---

## 1. Goals and Background Context

### 1.1 Goals

- O utilizador **compreende** que o **404** em `GET …/emissao-fiscal/empresa` após falha de cadastro é **esperado** até o `POST` empresa ser aceite pelo Plugnotas, e **não** interpreta como “bug de sincronização” isolado.
- O **bloqueio real** do cadastro — **400** com `fields.nfse.config.prefeitura: Preenchimento obrigatório` — é **resolvido ou desbloqueado** conforme trilho aprovado em **PRD-PREF** (conta, payload, UX híbrida).
- Erros de **`POST /api/mei-guide/validate`** (ex.: corpo com mensagem **Internal Server Error**) são **distinguíveis** de falhas Plugnotas: copy, código HTTP ou documentação interna deixam claro **origem Serpro** e **próximo passo**.
- Operação e QA dispõem de **mapa de erros** (brief + operação + este PRD) para reprodução e escalamento.
- Gates de qualidade do repositório (**`AGENTS.md`**: lint, typecheck, test) permanecem verdes nas entregas.

### 1.2 Background Context

O brief de correção consolidou a **cadeia causal**: falha do **`POST /api/mei-notas/setup/emissao-fiscal/empresa`** impede a criação da empresa no Plugnotas; o **`GET`** por CNPJ continua a devolver **404**; em paralelo, o **`POST /api/mei-guide/validate`** pode falhar por chamadas **Serpro** (`emitirServico`), com respostas não-OK mapeadas hoje para **HTTP 400** e mensagem espelhada do upstream — o que **confunde** diagnóstico na consola do browser.

O produto já envia `nfse` com `nacional: true` e `config: { producao: true }` **sem** `prefeitura` (**`buildNfEmissionEmpresaPayload`**). A validação remota pode continuar a exigir **`nfse.config.prefeitura`** (**NFR-N04** / tensão com modo nacional). Esse núcleo está detalhado no **PRD-PREF**; aqui fixamos **requisitos transversais** de experiência, observabilidade e **separação cognitiva** entre integrações.

### 1.3 Change log

| Data | Versão | Descrição | Autor |
| --- | --- | --- | --- |
| 2026-04-08 | 1.0 | PRD inicial a partir do brief `brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md`; épicos, FR/NFR **FR-CONS-***, ligação a PRD-PREF/NAT. | PM |

---

## 2. Requirements

### 2.1 Functional

1. **FR-CONS-MAP-01:** A documentação orientada ao utilizador ou ao suporte (mínimo: `docs/operacao-mei-nfse.md` ou secção equivalente aprovada pelo PO) **descreve a tríade** de erros da consola — **404 GET empresa**, **400 POST empresa (`prefeitura`)**, **400/503 POST validate (Serpro)** — com **causa provável** e **ordem de verificação** (alinhada ao diagrama do brief).
2. **FR-CONS-UX-01:** Quando o fluxo de cadastro empresa falhar com erro Plugnotas já tratado por **FR-PREF-UX-01** / **FR-NAT-ERR-01**, a UI **não** deve sugerir que o utilizador “confirme se a empresa existe” no emissor **sem** mencionar que o **cadastro anterior falhou** (evitar culpar só o GET 404).
3. **FR-CONS-UX-02:** Onde a aplicação **mostrar** estado após retry (ex.: polling `GET empresa`), mensagens de “empresa não encontrada” **contextualizam** que o registo pode ainda **não existir** após falha de `POST`, quando aplicável ao fluxo implementado (wording fino na story).
4. **FR-CONS-SERPRO-01:** Falhas do **Serpro** no caminho `validateGuide` → `emitirServico` **não** devem aparecer ao utilizador como falha genérica indistinguível da **emissão fiscal / Plugnotas**; a resposta deve incluir **identificação da integração** (ex.: prefixo ou código estável documentado) e, quando tecnicamente viável, **código HTTP** que não sugira “pedido mal formado” para **5xx** upstream (**ver NFR-CONS-SERPRO-01**).
5. **FR-CONS-EVID-01:** Critérios de aceite de release exigem **ligação explícita** entre este PRD, o brief da consola e o **PRD-PREF** nas stories de implementação (rastreabilidade em checklist de story).
6. **FR-CONS-PREF-DELEG-01:** Requisitos de **payload** `nfse.config.prefeitura`, descoberta schema, trilhos **B/C/D** e **FR-PREF-API-01** permanecem **canónicos** no **PRD-PREF**; este PRD **não** os reescreve — apenas exige que a solução de cadastro **cumpra** o PRD-PREF escolhido para fechar o **400 prefeitura**.

### 2.2 Non-functional

1. **NFR-CONS-01:** **Observabilidade:** em ambiente não-prod (e em prod com flags existentes), deve ser possível correlacionar falha `POST empresa` com tentativas subsequentes de `GET empresa` (logs ou documentação de suporte — sem PII em docs públicos).
2. **NFR-CONS-SERPRO-01:** Respostas **5xx** do Serpro no `emitirServico` **não** devem ser propagadas ao cliente como **HTTP 400** com corpo que implica apenas “requisição inválida”; mapear para **503** (ou **502**) com mensagem controlada, **salvo** decisão arquitectural documentada de manter 400 por compatibilidade retroactiva (neste caso **NFR-CONS-SERPRO-02** obriga documentação de excepção e deprecação).
3. **NFR-CONS-02:** **Segurança e privacidade:** mensagens de erro **não** expõem stack traces nem secrets; alinhado a práticas actuais do `errorHandler`.
4. **NFR-CONS-03:** **Testes:** alterações em `emitir.service.js` ou rotas de validate **incluem** testes que cobrem mapeamento de status (ex.: Serpro 500 → 503) quando **NFR-CONS-SERPRO-01** for adoptada.
5. **NFR-CONS-04:** Gates **`npm run lint`**, **`npm run typecheck`**, **`npm test`** após entregas.

---

## 3. User Interface Design Goals

### 3.1 Overall UX Vision

Reduzir **ansiedade e suporte** quando a consola do browser mostra **vários erros em sequência**: o utilizador entende **qual integração falhou**, **qual é o bloqueio principal** (cadastro Plugnotas) e **que ações** são relevantes (painel Plugnotas, ambiente, suporte Serpro vs Plugnotas).

### 3.2 Key Interaction Paradigms

- **Erro primário destacado:** mensagem modal ou callout prioriza o **POST empresa** quando a mensagem contiver `nfse.config.prefeitura` ou equivalente classificado por `nfseNacionalPlugnotasErrorHints`.
- **Secundário colapsado ou link:** 404 de GET e validate podem ser explicados em “detalhes técnicos” ou link para guia interno, conforme decisão UX na story.

### 3.3 Core Screens and Views

- **Guia MEI — cadastro emissão fiscal / empresa** (fluxo onde ocorre `POST …/emissao-fiscal/empresa`).
- **Guia MEI — passos que disparam `POST …/mei-guide/validate`** (se visível ao utilizador).
- **Documentação / guia fiscal** (link “Ver guia de operação fiscal” ou equivalente) actualizado para **FR-CONS-MAP-01**.

### 3.4 Accessibility

**WCAG AA** onde o produto já se compromete globalmente; novos textos de erro devem ser **anunciáveis** por leitor de ecrã (sem depender só de cor).

### 3.5 Branding

Manter tom e componentes existentes (shadcn / design system do frontend).

### 3.6 Target Platforms

**Web responsivo** (fluxo actual Guia MEI).

---

## 4. Technical Assumptions

| Tema | Assunção |
|------|-----------|
| **Repository** | Monorepo actual (`frontend/`, `backend/`). |
| **Arquitectura** | BFF Express: rotas `/api/mei-notas/...` e `/api/mei-guide/...`; Plugnotas e Serpro como upstreams. |
| **Payload empresa** | Continua definido em `nfEmissionCompany.ts` + `empresa.service.js` + políticas ADR; alterações de `prefeitura` seguem **PRD-PREF** + ADR. |
| **Serpro** | `backend/src/services/gestao/emitir.service.js` centraliza `fetch` e tratamento de erro; mudança de status HTTP é localizada. |
| **Testes** | Jest ou framework existente em `backend/tests/` para rotas/serviços tocados. |

---

## 5. Epic List

1. **Épico 1 — Desbloquear cadastro empresa Plugnotas (núcleo PREF):** Implementar decisão de produto e engenharia do **PRD-PREF** (trilho A e/ou B/C/D), incluindo copy **FR-PREF-UX-01**, documentação **FR-PREF-DOC-01**, e critérios **§10** do PRD-PREF. **Critério de valor:** `POST /empresa` bem-sucedido no cenário alvo.  
2. **Épico 2 — Triagem de erros na consola e semântica Serpro:** Entregar **FR-CONS-MAP-01**, **FR-CONS-UX-01/02**, **FR-CONS-SERPRO-01** e **NFR-CONS-SERPRO-01** (ou excepção **NFR-CONS-SERPRO-02** documentada). **Critério de valor:** utilizador e suporte distinguem falhas Plugnotas vs Serpro; menos diagnósticos incorrectos.  
3. **Épico 3 — QA, operação e fecho de release:** Matriz de testes manuais / automatizados cruzando os três endpoints; actualização de checklists; evidência **FR-CONS-EVID-01**.

*Nota:* Os épicos 1 e 2 podem ser desenvolvidos em **paralelo** após PO fechar trilho PREF para o épico 1; o épico 3 agrega verificação final.

---

## 6. Epic Details

### Épico 1 — Desbloquear cadastro empresa Plugnotas (núcleo PREF)

**Objectivo alargado:** Eliminar o **400** `nfse.config.prefeitura` (ou substituí-lo por fluxo accionável aprovado) de forma consistente com **PRD-nfse-nacional** e **PRD-PREF**, preservando política “apenas NFS-e”.

#### Story 1.1 — Descoberta e decisão de trilho (PO + Architect)

**Como** PO / Architect, **quero** documentar evidência Plugnotas (schema `prefeitura` ou dispensa com nacional) e o trilho **A** vs **B/C/D**, **para** desbloquear implementação sem inventar chaves.

**Critérios de aceite:**

1. Registo em ADR, evidência ou nota operacional conforme **NFR-PREF-EV-01** / **§10** do PRD-PREF.  
2. Decisão explícita de trilho registada no **PRD-PREF** (change log) ou apêndice ligado a este PRD.

#### Story 1.2 — Implementação técnica do trilho aprovado (@dev)

**Como** utilizador MEI, **quero** concluir o cadastro da empresa no emissor **para** prosseguir com NFS-e no produto.

**Critérios de aceite:**

1. Cumprimento de **FR-PREF-API-01** (se B/C/D) ou confirmação operacional de **A** sem mudança de código além de copy/doc.  
2. **FR-PREF-UX-01**, **FR-PREF-DOC-01**, **FR-PREF-HINT-01** conforme PRD-PREF.  
3. Testes de contrato e CI verdes (**NFR-PREF-03** / **NFR-CONS-04**).

#### Story 1.3 — Regressão contas “só nacional” (@qa)

**Como** negócio, **quero** garantir que CNPJs em contas que **não** exigem `prefeitura` continuam a cadastrar sem novos campos **para** evitar regressão.

**Critérios de aceite:**

1. Casos de teste documentados e executados; ligação a **FR-CONS-PREF-DELEG-01**.

---

### Épico 2 — Triagem de erros na consola e semântica Serpro

**Objectivo alargado:** Alinhar percepção do utilizador e da consola com a arquitectura real (Plugnotas vs Serpro; 404 esperado após falha de POST).

#### Story 2.1 — Documentação do mapa de erros (@dev ou @pm com @dev)

**Como** suporte interno, **quero** um mapa único dos três erros típicos **para** orientar utilizadores sem confundir integrações.

**Critérios de aceite:**

1. **FR-CONS-MAP-01** cumprido; link a partir do brief da consola e deste PRD.  
2. Revisão rápida por Operação.

#### Story 2.2 — Copy e UI: contexto 404 GET após falha POST (@dev + UX)

**Como** utilizador, **quero** mensagens que não me façam culpar um “GET quebrado” **para** focar em corrigir o cadastro.

**Critérios de aceite:**

1. **FR-CONS-UX-01** e **FR-CONS-UX-02** verificáveis em fluxo manual ou teste E2E opcional.  
2. Não contradizer **FR-PREF-UX-01** / hints existentes.

#### Story 2.3 — Mapeamento HTTP e mensagem Serpro no validate (@dev)

**Como** utilizador ou integrador, **quero** que falhas Serpro não pareçam “Bad Request genérico do nosso API” **para** saber que o problema não é o Plugnotas.

**Critérios de aceite:**

1. **FR-CONS-SERPRO-01** cumprido.  
2. **NFR-CONS-SERPRO-01** cumprido **ou** excepção **NFR-CONS-SERPRO-02** documentada com plano de deprecação.  
3. **NFR-CONS-03:** testes adicionados para o novo mapeamento.

---

### Épico 3 — QA, operação e fecho de release

#### Story 3.1 — Matriz de verificação cruzada (@qa)

**Como** QA, **quero** uma matriz endpoint × sintoma × expectativa **para** assinar o release.

**Critérios de aceite:**

1. Matriz cobre: sucesso `POST empresa`; falha `prefeitura`; `GET 404` subsequente; `validate` com falha Serpro simulada ou registada em staging.  
2. **FR-CONS-EVID-01:** stories referenciam PRDs e briefs nos metadados/checklist.

#### Story 3.2 — Checklist de release PO (@pm)

**Como** PO, **quero** confirmar métricas e critérios de **§7–8** deste PRD **para** aprovar release.

**Critérios de aceite:**

1. Itens de **§8** verificados.  
2. Change log deste PRD actualizado se houver desvios aprovados.

---

## 7. Métricas de sucesso

- **Redução** de relatórios internos do tipo “GET empresa está em erro 404” **sem** menção à falha prévia do `POST` (baseline a definir com suporte após **FR-CONS-MAP-01**).  
- **100%** dos utilizadores que recebem erro classificado como Plugnotas `prefeitura` vêem copy alinhada a **FR-PREF-UX-01** (herdado PRD-PREF) **e** não mensagem que culpe apenas o Serpro.  
- Após **Story 2.3:** **0** ocorrências em QA de `validate` com **5xx** Serpro devolvido como **400** sem documentação de excepção (salvo **NFR-CONS-SERPRO-02**).  
- Taxa de sucesso de `POST empresa` no cenário de reprodução interna: alinhar ao **§9** do PRD-PREF quando o trilho B/C/D estiver activo.

---

## 8. Critérios de aceite de release (consolidados)

1. **Cadastro:** Critérios **§10** do **PRD-PREF** satisfeitos (ou trilho **A** puro com evidência operacional).  
2. **Triagem consola:** **FR-CONS-MAP-01**, **FR-CONS-UX-01**, **FR-CONS-UX-02** satisfeitos.  
3. **Serpro:** **FR-CONS-SERPRO-01** + **NFR-CONS-SERPRO-01** (ou excepção documentada **NFR-CONS-SERPRO-02**).  
4. **Rastreabilidade:** **FR-CONS-EVID-01** e **FR-CONS-PREF-DELEG-01** verificados nas stories fechadas.  
5. **Qualidade:** **NFR-CONS-04** verde no pipeline relevante.

---

## 9. Dependências e riscos

| Tipo | Descrição |
|------|-----------|
| **Dependência** | Resposta Plugnotas / conta / ambiente para fechar trilho PREF. |
| **Dependência** | Serpro indisponível ou instável dificulta testar **Story 2.3** — considerar mock ou gravação de contrato em teste. |
| **Risco** | Mudar 400→503 no validate pode **alterar** comportamento de clientes que parseiem só `status === 400` — avaliar versão de API ou feature flag (**NFR-CONS-SERPRO-02**). |
| **Risco** | Copy excessivamente técnica na UI — equilibrar com link para doc (**FR-CONS-MAP-01**). |

---

## 10. Rastreabilidade brief → PRD

| Secção do brief | Onde neste PRD |
|-----------------|----------------|
| Resumo executivo (tabela erros) | §1.1 Goals, §2.1 **FR-CONS-***, §5–6 |
| Cadeia causal (mermaid) | §1.2 Background, **FR-CONS-MAP-01** |
| Plano §3 (ambiente, debug, A–D, validate) | §5 Épicos 1–2, §6 stories |
| Critérios §4 brief | §8 |
| Ref. código §5 brief | §4 Technical Assumptions |

---

## 11. Next Steps (handoff)

### 11.1 UX Expert Prompt

> Rever fluxo Guia MEI após falha de `POST empresa` e após `GET 404`: hierarquia visual do erro primário (Plugnotas), texto de “detalhes” para 404 e validate, e acessibilidade. Input: **§3** deste PRD + `GuidesMei.tsx` (trechos emissão fiscal).

### 11.2 Architect Prompt

> Validar **NFR-CONS-SERPRO-01** vs compatibilidade de API pública; propor contrato de erro estável (`code` + `message`) para `POST /mei-guide/validate`. Cruzar com **emitir.service.js**. Input: **§2.2** e **§9** deste PRD.

### 11.3 Dev Prompt

> Implementar épicos na ordem acordada com SM: prioridade **Épico 1** conforme PRD-PREF; em paralelo **Épico 2** story 2.1–2.3. Referenciar ficheiros do brief §5.

---

## 12. Change log (documento)

| Data | Versão | Nota |
| --- | --- | --- |
| 2026-04-08 | 1.0 | Versão inicial completa. |

---

*PRD gerado a partir do project brief; implementação detalhada permanece nas stories. Contrato `nfse.config.prefeitura` continua canónico em **PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md**.*
