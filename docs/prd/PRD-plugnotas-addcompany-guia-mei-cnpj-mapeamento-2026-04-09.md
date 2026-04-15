# PRD — **Paridade addCompany (Plugnotas)** com cadastro **CNPJ / empresa** na **Guia MEI**

**Versão:** 1.0  
**Data:** 2026-04-09  
**Tipo:** Brownfield — conformidade documental, continuidade operacional e governança de integração (sem assumir entrega *greenfield* de novo fluxo)  
**Fonte canónica do pedido:** [`docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`](../brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md)

**Relação com outros artefatos:**

- [Plugnotas — Empresa / addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany) — referência externa da operação equivalente a **POST `/empresa`**.  
- **`docs/prd/PRD-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`** — orquestração certificado → empresa no marco de utilizador; **complementa** este PRD quando a prioridade for UX de conclusão única.  
- **`docs/prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`** e derivados — payload de empresa e políticas de documentos activos.  
- **`docs/operacao-mei-nfse.md`** — ordem de chamadas, ambientes e troubleshooting (quando presente no repositório).  
- **Código de referência:** `backend/src/services/plugnotas/empresa.service.js` (`cadastrarEmpresaPlugNotas`), `frontend/src/utils/plugnotasEmitenteSetup.ts`, `frontend/src/pages/GuidesMei.tsx`.

**Delegação (Gate 1 AIOX):** este PRD define **épicos e requisitos**; a criação de **user stories** detalhadas fica a cargo de **@sm** após aprovação do âmbito.

---

## 1. Resumo executivo

O **Meu Financeiro** já integra o cadastro de empresa no **Plugnotas** na jornada da **Guia MEI**: o utilizador informa o **CNPJ** e dados do emitente, o cliente chama o BFF (`POST /mei-notas/setup/emissao-fiscal/empresa`) e o backend executa **POST `/empresa`**, alinhado à operação **addCompany** da documentação oficial.

Este PRD **não** exige, por si só, um novo ecrã ou rota dedicada “addCompany”. Fixa **requisitos de produto** para: (1) **clareza** para stakeholders (o que o produto já faz face à API pública do provedor); (2) **paridade contínua** entre o contrato **addCompany** e o payload gerado pela Guia MEI + BFF; (3) **observabilidade** e critérios de sucesso quando o provedor alterar campos obrigatórios ou mensagens; (4) **continuidade** da experiência de retry parcial (certificado OK, empresa falha) já suportada.

---

## 2. Visão de produto (iniciativa)

O utilizador **MEI** continua a concluir o cadastro fiscal na **Guia MEI** sem precisar de interpretar a documentação Plugnotas: o produto **traduz** a intenção “registar a minha empresa no emissor” para as chamadas correctas ao provedor. Internamente, equipa de produto e engenharia têm **um PRD único** que amarra a jornada **CNPJ / empresa** à operação canónica **addCompany** / **POST `/empresa`**, reduzindo ambiguidade em roadmap e suporte.

---

## 3. Problema e oportunidade

| Dimensão | Situação | Oportunidade |
|----------|----------|--------------|
| **Alinhamento doc ↔ produto** | Equipas consultam a doc Plugnotas (“addCompany”) e podem assumir que falta funcionalidade no app. | PRD explícito: o fluxo actual **é** o cadastro via POST `/empresa` atrás do BFF. |
| **Deriva de contrato** | O provedor pode tornar campos obrigatórios ou alterar validações. | Processo de **paridade** e critérios de release (§8) antes de considerar “concluído” após mudanças upstream. |
| **Suporte / UX** | Erros de validação Plugnotas são densos. | Manter heurísticas de mensagem e CTAs (retry empresa) **coerentes** com a origem técnica (cadastro empresa). |
| **Ambiente** | Sandbox vs produção mal configurados geram falsos negativos. | Requisito de **configuração** explícita em documentação de operação e checklists de release. |

---

## 4. Personas e stakeholders

| Persona | Necessidade coberta por este PRD |
|---------|----------------------------------|
| **MEI** | Concluir cadastro de empresa (CNPJ) no fluxo Guia MEI com mensagens compreensíveis e caminho de retry quando aplicável. |
| **PO / PM** | Âmbito claro: paridade addCompany vs trabalho já existente; priorização de *gaps* de campo. |
| **Engenharia** | Lista de FRs/NFRs rastreáveis e epic outline para stories **@sm**. |
| **Suporte** | Narrativa única: “cadastro no emissor” = POST empresa Plugnotas via produto, não ação manual paralela obrigatória. |

**Stakeholders:** Produto, UX (copy crítica em erro), Architect (contrato e políticas de payload), Backend, Frontend, QA.

---

## 5. Escopo

### 5.1 Dentro do escopo (must-have para a iniciativa “paridade addCompany”)

- **Rastreabilidade:** requisitos funcionais **FR-ADDCO-\*** (§7) cobrem a jornada utilizador → BFF → POST `/empresa` e o comportamento de **conflito → actualização** já implementado no serviço de empresa.  
- **Paridade documentada:** referência cruzada entre este PRD, o **brief** e a doc Plugnotas (**addCompany**).  
- **Continuidade da sequência canónica:** certificado **antes** de empresa quando o fluxo exige certificado (`FR-ORQ-CERT-02` / `submitPlugnotasEmitenteSetup`); sem alterar unilateralmente essa ordem sem ADR ou PRD de orquestração dedicado.  
- **Retry parcial:** manter capacidade de repetir **só** o registo de empresa após sucesso de certificado, quando o produto já expuser esse fluxo (alinhado ao brief e a `retryPlugnotasEmpresaRegistro`).  
- **Governança:** pelo menos um **epic** (§9) para revisão periódica de paridade OpenAPI ou disparada por changelog Plugnotas relevante.

### 5.2 Fora de escopo

- **Nova** integração directa browser → Plugnotas (segurança e arquitectura — ver **@architect**).  
- Substituição do **PRD de orquestração** única de conclusão (`PRD-empresa-plugnotas-orquestrada-…`); este PRD **complementa** com foco em **mapeamento addCompany**.  
- **Pesquisa de mercado** ou análise competitiva (**@analyst**).  
- Implementação detalhada (**@dev**) — entra via stories **@sm**.

### 5.3 Priorização sugerida (MoSCoW)

| Classificação | Item |
|---------------|------|
| **Must** | FR-ADDCO-01 a FR-ADDCO-04; NFR-ADDCO-01; documentação cruzada (brief ↔ PRD). |
| **Should** | Epic de auditoria de paridade campo a campo após alteração conhecida do provedor. |
| **Could** | Métricas agregadas de falha por fase (certificado vs empresa) para roadmap P1. |
| **Won’t (neste PRD)** | Novo motor fiscal ou mudança de provedor. |

---

## 6. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-ADDCO-01** | Na **Guia MEI**, quando o utilizador concluir o fluxo de configuração fiscal que inclui **cadastro de empresa** com CNPJ válido e dados exigidos pelo produto, o sistema deve provocar (directa ou sequencialmente após certificado) uma chamada ao backend que resulte em **POST `/empresa`** no Plugnotas com `certificado` referenciando o certificado aceite pelo provedor, salvo fluxos documentados de “só actualização” sem novo certificado. |
| **FR-ADDCO-02** | O cadastro de empresa deve usar o **mesmo** contrato de dados de emitente que o BFF valida e normaliza (incluindo políticas de endereço, prefeitura/IBGE e documentos activos quando aplicável), de modo que a semântica corresponda à operação **addCompany** / corpo esperado em **POST `/empresa`**. |
| **FR-ADDCO-03** | Em resposta a **conflito** com empresa já existente no Plugnotas, o comportamento do produto deve seguir a política já implementada no serviço (tentativa de **actualização** / `PATCH` conforme `cadastrarEmpresaPlugNotas`), sem exigir ao utilizador um segundo fluxo paralelo não documentado na app. |
| **FR-ADDCO-04** | Se o **certificado** for aceite e o **cadastro de empresa** falhar, o produto deve manter um caminho explícito para **repetir o registo da empresa** (retry) sem obrigar novo envio de certificado quando o ID do certificado permanecer válido no contexto do fluxo — coerente com o estado actual descrito no brief. |
| **FR-ADDCO-05** (P1) | Após **alteração documentada** do contrato Plugnotas **addCompany**, o produto deve ser avaliado contra uma **checklist de paridade** (campos obrigatórios novos ou obsoletos) antes de release; o resultado fica registado na story/epic associada. |

---

## 7. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| **NFR-ADDCO-01** | **Configuração:** ambientes de desenvolvimento, *staging* e produção devem usar `PLUGNOTAS_API_BASE_URL` e credenciais coerentes com o ambiente alvo, evitando testes inválidos contra o host incorrecto. |
| **NFR-ADDCO-02** | **Segurança:** segredos do Plugnotas não são expostos ao cliente; chamadas permanecem **server-side** via BFF. |
| **NFR-ADDCO-03** | **Observabilidade:** falhas de **certificado** vs **empresa** devem ser distinguíveis para diagnóstico (logs/códigos já existentes ou evolução mínima definida em story **@sm**), sem vazar dados sensíveis em mensagens ao utilizador. |
| **NFR-ADDCO-04** | **Qualidade:** alterações que toquem no fluxo de cadastro empresa devem respeitar `AGENTS.md` (lint, typecheck, testes). |

---

## 8. Métricas de sucesso (produto)

| Métrica | Alvo inicial | Notas |
|---------|----------------|-------|
| **Ambiguidade interna resolvida** | 100% das referências a “cadastrar empresa Plugnotas” na documentação de produto ligadas a este PRD ou ao brief | Revisão trimestral ou em *onboarding* de PM. |
| **Incidentes de “falta funcionalidade addCompany”** | Tendência estável ou em queda após comunicação do PRD | Classificação em suporte: “esperado conforme POST /empresa via app”. |
| **Regressões pós-mudança Plugnotas** | Zero **P0** não detectados em *staging* quando **FR-ADDCO-05** for executado | Depende de processo de release. |

*(Valores numéricos finos podem ser calibrados com Operação após baseline.)*

---

## 9. Épicos propostos e delegação **@sm**

| Epic | Descrição | Owner sugerido |
|------|-----------|----------------|
| **E-ADDCO-01 — Baseline de paridade** | Confirmar mapeamento brief ↔ código ↔ doc Plugnotas; nenhuma lacuna P0 entre **addCompany** e payload actual em caminho feliz. | SM cria stories de verificação (QA/eng). |
| **E-ADDCO-02 — Processo de deriva de contrato** | Quando o provedor publicar alteração relevante, executar **FR-ADDCO-05** + atualização de hints de erro se necessário. | SM prioriza com PO. |
| **E-ADDCO-03 — Comunicação stakeholder** | Resumo de uma página (link PRD + brief) para suporte e *onboarding* interno. | SM / documentação leve. |

**Gate 1:** PM (este PRD) define épicos; **@sm** decompõe em stories com AC técnicos e ficheiros.

---

## 10. Riscos e mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Mudança silenciosa na API Plugnotas | Falhas 400 em massa | **FR-ADDCO-05**, monitorização de erros, *staging* com credenciais sandbox. |
| Confusão “addCompany” vs implementação | Priorização incorrecta | Este PRD + brief; *training* suporte. |
| Sobreposição com PRD de orquestração única | Escopo duplicado | Cruzar §5 com `PRD-empresa-plugnotas-orquestrada-…`; este PRD foca **mapeamento e paridade**. |

---

## 11. Critérios de *go* / aceite de release (iniciativa documental + baseline)

- PRD e brief **referenciados mutuamente** e disponíveis em `docs/`.  
- **FR-ADDCO-01** a **FR-ADDCO-04** verificados no estado actual do código (sem regressão conhecida) ou com *gap* explícito em story aberta.  
- Equipa reconhece que **não** existe requisito de novo endpoint público “addCompany” isolado além do fluxo **POST …/emissao-fiscal/empresa** → **POST `/empresa`**, salvo decisão futura **@architect**.

---

## 12. Histórico

| Data | Versão | Autor | Notas |
|------|--------|-------|-------|
| 2026-04-09 | 1.0 | Morgan (@pm) | Versão inicial a partir do brief **brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09**. |

---

**Fim do PRD.**
