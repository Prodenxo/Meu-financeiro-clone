# PRD — Guia MEI / certificado Plugnotas: **normalização de erros de gateway (502/503/504) e corpo HTML upstream**

**Versão:** 1.0  
**Data:** 2026-04-08  
**Tipo:** Brownfield — integração emissor fiscal (Plugnotas), BFF `POST …/certificado`, experiência de erro no Guia MEI  
**Fonte canónica do pedido:** [`docs/brief/brief-mei-plugnotas-certificado-502-bad-gateway-2026-04-08.md`](../brief/brief-mei-plugnotas-certificado-502-bad-gateway-2026-04-08.md)

**Relação com outros artefatos**

- **`docs/prd/PRD-mensagens-erro-ux-usuario-final-2026-04-07.md`** — taxonomia e hierarquia de erros; este PRD **especializa** o caso **indisponível / gateway upstream** no fluxo fiscal, sem contradizer o padrão *título humano + orientação + origem*.  
- **`docs/prd/PRD-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`** — cadastro certificado + empresa; este PRD **não** altera o contrato feliz-path do `POST …/certificado`, apenas o **tratamento de falha** quando o upstream devolve HTML ou status de gateway.  
- **`docs/technical/architecture-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`** — BFF e orquestração; referência para onde encaixar normalização no serviço Plugnotas.  
- **`docs/operacao-mei-nfse.md`** — troubleshooting; **deve** ser actualizado (**NFR-DOC-MEI-01**).  
- **Código âncora:** `backend/src/services/plugnotas/empresa.service.js`, `backend/src/services/plugnotas/plugnotas-error-message.js`, `frontend/src/lib/fiscalUserError.ts`, `frontend/src/lib/meiFiscalUserCopyToUserFacing.ts`, `frontend/src/components/FiscalIntegrationErrorAlert.tsx`, `frontend/src/utils/isFetchConnectivityFailure.ts` (alinhamento opcional com padrões de conectividade).

**IDs de rastreio (brief):** **FR-MEI-CERT-GW-01**, **FR-UX-FISC-GW-01**, **NFR-DOC-MEI-01** — detalhados nas secções 7–8 com sub-requisitos quando necessário.

---

## 1. Resumo executivo

Quando o Plugnotas ou uma **camada intermédia** (proxy, API gateway, balanceador) responde ao envio do certificado A1 com **HTTP 502, 503 ou 504** e corpo frequentemente em **HTML** (ex.: *502 Bad Gateway*), o backend actual propaga essa string como `message` no JSON do BFF. O frontend classifica o erro como **“validação ou rejeição no provedor”** e exibe **HTML cru** (por vezes **duplicado** entre o corpo principal e o detalhe colapsável), com rodapé que fala em **validação de JSON** — o que **não corresponde** à natureza do problema (**indisponibilidade temporária / gateway**).

Um **404** subsequente em `GET …/setup/emissao-fiscal/empresa?cpfCnpj=…` (*«Não localizamos qualquer Empresa…»*) é, na maior parte dos casos, **consequência esperada** se o certificado **não** foi registado com sucesso; **não** constitui, por si só, bug a “corrigir” antes de estabilizar o passo do certificado.

Este PRD fixa **requisitos rastreáveis** para: (1) **normalizar no BFF** a mensagem exposta ao cliente e **não** devolver HTML completo ao browser; (2) **mapear no frontend** título e copy para **indisponibilidade / tente mais tarde**, alinhados à taxonomia de erros global; (3) **evitar duplicação** de conteúdo inútil na UI; (4) **documentar** o cenário operacional (502/503, 404 após falha de certificado).

---

## 2. Visão de produto (experiência)

- O utilizador **MEI** percebe que o **serviço de emissão fiscal** está **temporariamente indisponível** ou com **problema de ligação no servidor**, **não** que o certificado foi “rejeitado por validação JSON”.  
- **Não** vê uma página HTML completa nem blocos repetidos do mesmo texto técnico na área principal do alerta.  
- A **origem** continua clara: a mensagem orientadora vem do **contexto fiscal / emissor**, sem culpar incorrectamente o “Meu Financeiro” pela validação de negócio — e **sem** misturar gateway com rejeição de campos fiscais.  
- Opcional: **CTA** ou texto de apoio alinhado a **“tentar de novo dentro de alguns minutos”** e checklist operacional (URL, chave, rede) referenciada na documentação.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Semântica do erro** | 502 + HTML é tratado como “validação no provedor”. | Classificação explícita como **indisponível / gateway upstream** (coerente com **PRD mensagens erro**). |
| **Conteúdo na resposta API** | `message` do BFF contém HTML de proxy. | Mensagem **estável em português** no JSON; detalhe técnico só em **log server-side redigido**. |
| **UX** | `LongFiscalErrorMessage` repete HTML; rodapé fala em JSON. | Uma hierarquia legível; rodapé **condicional** ou copy que **não** cite validação JSON para este caso. |
| **Suporte** | Utilizadores e operação interpretam 404 empresa como “CNPJ errado” ignorando falha prévia do certificado. | Runbook em **`operacao-mei-nfse.md`** liga 404 ao fluxo certificado → empresa. |
| **Observabilidade** *(opcional)* | Frontend inspecciona HTML para ramificar copy. | Campo **`errors.fiscalErrorCode`** estável (`plugnotas_gateway_502`, etc.) para mapeamento limpo. |

---

## 4. Personas, stakeholders e cenários

| Persona | Cenário |
|---------|---------|
| **MEI — primeiro envio de certificado** | Recebe 502 por instabilidade do sandbox; vê mensagem **humana** e sabe **voltar a tentar**, sem pânico com HTML. |
| **MEI — após 502** | Consulta estado da empresa; 404 é **esperado** até cadastro bem-sucedido; documentação explica a ordem dos passos. |
| **Operação / suporte** | Distingue **gateway** (infra/provedor) de **400 validação**; segue checklist URL/chave/ambiente. |
| **Engenharia** | Testes unitários cobrem corpo HTML + status 502; regressão garante que **400 JSON Plugnotas** mantém fluxo actual de validação. |

**Stakeholders:** PO (aprovação de copy final), UX (título, tom, rodapé), Architect (camada BFF vs dupla defesa no FE), Backend, Frontend, QA.

---

## 5. Escopo

### 5.1 Dentro do escopo

1. **Backend (BFF / serviço Plugnotas):** ao detectar resposta **502, 503, 504** do upstream **ou** corpo de erro claramente **HTML de gateway** (heurística documentada: ex. início com `<`, presença de `Bad Gateway` / `Gateway Timeout` em contexto de status de gateway), **substituir** a string exposta em `message` (e equivalentes no handler da rota) por texto **canónico em português** aprovado na story (**FR-MEI-CERT-GW-01**).  
2. **Logging:** registar `status`, `content-type` e identificador de rota **sem** gravar o HTML completo em logs de aplicação em nível que chegue a agregadores sensíveis — seguir padrões de redacção existentes no módulo Plugnotas (**NFR-GW-02**).  
3. **Frontend:** `mapMeiFiscalErrorToCopy` (ou camada única invocada pelo Guia MEI / certificado) deve produzir **título e descrição** de **indisponibilidade / gateway** quando `status` for 502/503/504 **ou** `rawMessage` corresponder às mesmas heurísticas de HTML/gateway (**FR-UX-FISC-GW-01**).  
4. **Frontend:** evitar que o utilizador veja **duas vezes** o mesmo bloco técnico inútil (HTML); para este tipo de erro, **omitir** detalhe colapsável ou limitar a uma linha estável (**FR-UX-FISC-GW-02**).  
5. **Rodapé / texto auxiliar** do alerta fiscal: quando o erro for classificado como gateway/indisponível, **não** exibir copy que implique **validação de JSON** ou **campos fiscais** como causa principal (**FR-UX-FISC-GW-03**).  
6. **Opcional (P2):** expor `errors.fiscalErrorCode` estável no JSON do BFF para o cliente mapear sem parse de HTML (**FR-MEI-CERT-GW-02**).  
7. **Opcional (P2):** alinhar visualmente com padrão de **conectividade** (ex.: referência **US-CONN-MEI-03**) quando o produto já tiver componente reutilizável — sem duplicar lógica divergente (**FR-UX-FISC-GW-04**).  
8. **Testes automatizados:** backend e/ou frontend conforme prática do repo — ver **FR-GW-QA-01**.  
9. **Documentação:** **`docs/operacao-mei-nfse.md`** — bullets sobre 502/503 no POST certificado e 404 GET empresa após falha (**NFR-DOC-MEI-01**).

### 5.2 Fora do escopo

- Garantir **disponibilidade** do Plugnotas ou corrigir infraestrutura de terceiros.  
- Alterar o contrato de **sucesso** do `POST …/certificado` (multipart, campos).  
- Tratar o **404** do `GET empresa` como erro de produto **enquanto** o certificado não tiver sido aceite — excepto melhorias **opcionais** de copy explicativa (“complete primeiro o certificado”) numa story futura, **não** obrigatória neste PRD.  
- Internacionalização (i18n) além de **português**.  
- Alterar comportamento de **outros** integradores fiscais fora do fluxo Plugnotas / Guia MEI descrito no brief, salvo se a implementação for **centralizada** no mesmo helper sem regressão.

---

## 6. Decisões de produto

### 6.1 Copy canónica (proposta — sujeita a revisão UX/PO na story)

**Mensagem principal (descrição visível):**  
*«O emissor fiscal não está a responder neste momento (erro temporário no servidor). Tente de novo dentro de alguns minutos. Se o problema continuar, confirme no servidor a URL e a chave de API do emissor, ou contacte o suporte do emissor fiscal.»*

**Título sugerido:** *«Emissor fiscal temporariamente indisponível»* ou *«Ligação com o emissor fiscal falhou»* — escolha única na story para consistência com **`PRD-mensagens-erro-ux`**.

### 6.2 Prioridade de entrega

1. **P0** — **FR-MEI-CERT-GW-01** + **FR-UX-FISC-GW-01** + **FR-UX-FISC-GW-02** + **FR-UX-FISC-GW-03**.  
2. **P1** — **NFR-DOC-MEI-01** + **FR-GW-QA-01**.  
3. **P2** — **FR-MEI-CERT-GW-02**, **FR-UX-FISC-GW-04** (se esforço marginal baixo).

### 6.3 Dupla defesa (BFF + FE)

**Decisão:** Implementar **normalização no BFF** como fonte de verdade para o payload JSON; o **frontend** mantém heurística **defensiva** (502/503/504 + HTML) para respostas antigas, caches ou outros call sites — sem depender exclusivamente do backend em cenários edge.

---

## 7. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-MEI-CERT-GW-01** | Para chamadas ao upstream relacionadas com **`POST …/certificado`** (e helpers partilhados que propaguem o mesmo tipo de erro), quando o status HTTP for **502, 503 ou 504** **ou** o corpo de erro for identificado como **HTML de página de gateway** (heurística documentada no código), a resposta JSON ao cliente **não** inclui o HTML bruto em `message`; inclui texto humano canónico em português (§6.1 ou variante aprovada na story). |
| **FR-MEI-CERT-GW-02** | *(Opcional)* O payload de erro JSON pode incluir `errors.fiscalErrorCode` (ou nome final alinhado ao contrato existente) com valor estável, ex.: `plugnotas_gateway_502`, `plugnotas_gateway_503`, `plugnotas_gateway_504`, para o frontend priorizar mapeamento sem analisar `message`. |
| **FR-UX-FISC-GW-01** | O mapeamento de erros fiscais do Guia MEI (ex.: `mapMeiFiscalErrorToCopy` ou função dedicada invocada no fluxo certificado) classifica **502/503/504** e/ou mensagem gateway/HTML conforme heurística **como indisponibilidade / gateway**, produzindo título e descrição **distintos** de *“validação ou rejeição no provedor”* quando aplicável apenas a validação de negócio. |
| **FR-UX-FISC-GW-02** | Para esse classificação, a UI **não** repete o mesmo conteúdo técnico longo (HTML) em múltiplos blocos visíveis; detalhe técnico colapsável é **omitido** ou reduzido a referência mínima (ex.: código estável), conforme decisão na story. |
| **FR-UX-FISC-GW-03** | Texto de rodapé ou hint associado ao alerta **não** sugere **validação de JSON** ou **campos fiscais** como causa quando o erro estiver classificado como gateway/indisponível. |
| **FR-UX-FISC-GW-04** | *(Opcional)* Reutilizar padrão visual/copy de **conectividade** (ex.: painel existente no Guia MEI) quando o `@dev` confirmar reuso sem inconsistência de semântica (gateway servidor ≠ apenas “sem internet”). |
| **FR-GW-QA-01** | Existem testes automáticos que cobrem: (a) resposta simulada com `message` contendo HTML *502 Bad Gateway* → copy/título de gateway ou `message` normalizada no BFF; (b) status **502** sem HTML → mesmo ramo; (c) regressão: **400** com payload JSON de validação Plugnotas **realista** continua a exibir fluxo de **validação no provedor** com comportamento actual ou melhorado sem este PRD o reverter. |

---

## 8. Requisitos não funcionais e compatibilidade

| ID | Requisito |
|----|-----------|
| **NFR-DOC-MEI-01** | `docs/operacao-mei-nfse.md` inclui secção ou bullets: (1) **502/503/504** no POST certificado = indisponibilidade/gateway — checklist URL, chave, ambiente, retry; (2) **404** GET empresa após falha de certificado = esperado até sucesso do cadastro; ligação a este PRD. |
| **NFR-GW-01** | Gates do repositório: `npm run lint`, `npm run typecheck`, `npm test` conforme **`AGENTS.md`**. |
| **NFR-GW-02** | Não expandir logs com PII nem colar HTML completo de erro em destinos inadequados; alinhar a práticas existentes de redacção no backend. |
| **NFR-GW-03** | **Compatibilidade:** clientes que parseiem apenas `message` continuam a receber texto **legível**; campos novos em `errors` são **aditivos** (opcional). |

| ID | Requisito de compatibilidade (brownfield) |
|----|--------------------------------------------|
| **CR-GW-01** | Contratos de **sucesso** das rotas `…/emissao-fiscal/certificado` e `…/empresa` **inalterados** para respostas 2xx. |
| **CR-GW-02** | Fluxos de erro **400** com JSON Plugnotas de validação **preservados** em comportamento percebido pelo utilizador (salvo melhorias cosméticas aprovadas que não removam informação útil). |
| **CR-GW-03** | Componentes fiscais existentes (`FiscalIntegrationErrorAlert`, `meiFiscalUserCopyToUserFacing`) mantêm **acessibilidade** e categorias `provedor_fiscal` / fonte, ajustando apenas copy e supressão de detalhe para o subcaso gateway. |

---

## 9. Métricas e sucesso

| Métrica | Alvo |
|---------|------|
| **Ocorrências de HTML bruto** visível ao utilizador no alerta do fluxo certificado após release | **0** em testes de regressão automatizados e validação manual do cenário 502 simulado. |
| **Taxa de contactos de suporte** interpretando 502 como “certificado inválido” | Redução **qualitativa** (sem KPI obrigatório na v1); entrevista rápida pós-release opcional. |
| **Coerência com PRD mensagens erro** | Revisão PO/UX: título + descrição + ausência de rodapé enganador no caso gateway. |

---

## 10. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Heurística HTML demasiado larga mascara erros úteis | Limitar a **status 502–504** ou combinação **status + prefixo `<` + palavras-chave**; testes de regressão **400**. |
| Divergência BFF vs FE | Dupla defesa documentada §6.3; testes **FR-GW-QA-01**. |
| Utilizador ignora causa operacional | **NFR-DOC-MEI-01** + copy com “tente mais tarde” e checklist. |

---

## 11. Critérios de aceite (checklist de release)

- [ ] **FR-MEI-CERT-GW-01** implementado e revisto em code review.  
- [ ] **FR-UX-FISC-GW-01**, **FR-UX-FISC-GW-02**, **FR-UX-FISC-GW-03** implementados.  
- [ ] **FR-GW-QA-01** satisfeito no CI.  
- [ ] **NFR-DOC-MEI-01** e **NFR-GW-01** a **NFR-GW-03** verificados.  
- [ ] **CR-GW-01** a **CR-GW-03** confirmados em regressão manual mínima (certificado + empresa).  
- [ ] **FR-MEI-CERT-GW-02** e **FR-UX-FISC-GW-04** implementados **ou** explicitamente deferidos com nota no change log.  
- [ ] Story em `docs/stories/` (quando criada pelo **@sm**) referencia este PRD e actualiza file list / checklist.

---

## 12. Entregáveis e handoff

| Papel | Acção |
|-------|--------|
| **@sm** | Quebrar em uma ou mais stories (sugestão: story única “Gateway certificado Plugnotas” com tarefas BE/FE/QA/DOC). |
| **@architect** | Confirmar ponto único de normalização no serviço Plugnotas vs middleware da rota MEI-notas. |
| **@dev** | Implementação + testes. |
| **@qa** | Cenários §11 e regressão 400. |

---

## 13. Change log

| Versão | Data | Autor / papel | Notas |
|--------|------|----------------|-------|
| 1.0 | 2026-04-08 | PM (derivado do brief) | Versão inicial a partir de **`brief-mei-plugnotas-certificado-502-bad-gateway-2026-04-08`**. |

---

*PRD brownfield — Meu Financeiro / Guia MEI / integração Plugnotas — erros de gateway no envio de certificado.*
