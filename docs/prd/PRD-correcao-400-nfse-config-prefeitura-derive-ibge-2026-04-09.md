# PRD — Correção **400** `nfse.config.prefeitura` via **trilho B** (derivação IBGE) e **404** no `GET` empresa

**Versão:** 1.0  
**Data:** 2026-04-09  
**Tipo:** Brownfield — Guia MEI / `POST` e `GET` `…/mei-notas/setup/emissao-fiscal/empresa` (Plugnotas)  
**Fonte canónica do pedido:** [`docs/brief/brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../brief/brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md)

**Relação com outros artefatos:**

- **`docs/prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`** — ecossistema **`nfse.config.prefeitura`**, trilhos A–D e descoberta de schema. **Este PRD** foca **exclusivamente** no **trilho B** já implementado no código (`applyNfseConfigPrefeituraDeriveIbge` + env `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`). **Não** substitui decisões de **UI explícita** (C) ou **conta/suporte** (A).  
- **`docs/prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`** — matriz P0; o trilho B aqui é **um** caminho de mitigação **técnica** quando `codigoIbge` derivável do endereço basta.  
- **`docs/prd/PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`** — erro **tabela IBGE** / `codigoIBGECidade` **distinto** de “falta `prefeitura`” com IBGE válido de 7 dígitos.  
- **`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`**, **`backend/.env.example`**, código: `nfsePrefeituraPayload.js`, `empresa.service.js`, `nfEmissionCompany.ts`.  
- **Não substitui** contrato oficial Plugnotas nem garante que **só** `codigoIbge` chegue para todos os municípios (§5.2).

---

## 1. Resumo executivo

O Plugnotas pode devolver **HTTP 400** com **`fields.nfse.config.prefeitura: Preenchimento obrigatório`** quando o JSON de empresa **não** inclui `nfse.config.prefeitura`. O cliente (`buildNfEmissionEmpresaPayload`) envia `nfse.config` apenas com **`producao`**, sem **`prefeitura`**.

O backend já suporta **trilho B (P0):** com **`PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true`**, preenche **`nfse.config.prefeitura: { codigoIbge }`** a partir de **`endereco.codigoCidade`** (7 dígitos). Sem a flag **ou** sem IBGE válido, o payload segue sem `prefeitura` → **400** determinístico. O **GET** `…/empresa?cpfCnpj=` em **404** após falha de **POST** é **efeito secundário** (empresa não criada).

Este PRD define **requisitos de produto** para: **(1)** **governança da env** (dev/staging vs produção); **(2)** **documentação operacional** e runbook alinhados ao brief; **(3)** **critérios de sucesso** mensuráveis para o fluxo Guia MEI quando o trilho B for suficiente; **(4)** **encaminhamento explícito** para trilhos **A/C/D** do PRD PREF quando o 400 persistir após B (credenciais municipais, conta, etc.).

---

## 2. Objetivos (Goals)

- Reduzir bloqueios de cadastro de empresa no emissor por **ausência de `nfse.config.prefeitura`** quando a resolução for **derivação IBGE** a partir do endereço já recolhido no Guia MEI.  
- Tornar **previsível** para equipa e operação **quando** a flag deve estar activa e **qual** pré-requisito de dados (`codigoCidade` com 7 dígitos).  
- Evitar confusão entre este cenário e: **(a)** erro de **tabela IBGE** do emissor (outro PRD); **(b)** necessidade de **credenciais** em `prefeitura` (outros trilhos).  
- Manter **opt-in explícito em produção** até evidência operacional (**NFR-PREF-EV-01** / equivalente citado no repositório).

---

## 3. Contexto (Background)

O brief consolidou a **causa raiz** e o **checklist** operacional (env + restart + IBGE). A implementação técnica do trilho B já existe; o gap frequente em desenvolvimento é **variável de ambiente não definida** ou **código IBGE incompleto**, gerando 400 e, na sequência, 404 na consulta. Do ponto de vista de produto, falta uma **linha de decisão** clara: **primeiro** validar trilho B (flag + dados); **depois** escalar para descoberta de schema / UI / conta conforme o PRD de `nfse.config.prefeitura` mais amplo.

---

## 4. Visão de produto (experiência)

1. **Desenvolvedor / staging:** consegue activar o comportamento esperado **sem** adivinhar nomes de env — documentação e `.env.example` estão alinhados (**FR-PREFB-DOC-01**).  
2. **MEI:** quando o município só exige identificação por IBGE no objeto `prefeitura`, o cadastro **completa** após certificado, **sem** novo passo de formulário (desde que IBGE e flag corretos).  
3. **Suporte / operação:** distingue “**faltou trilho B**” de “**trilho B insuficiente**” (credenciais, conta) e segue o PRD / runbook adequado.  
4. **404 no GET:** tratado como **consequência** de POST falhado, não como defeito isolado da rota de leitura.

---

## 5. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Configuração** | Flag `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE` desligada ou ausente → 400 repetido. | Documentação + checklist de deploy; opcionalmente convenção para **dev local** (sem alterar política de prod sem aprovação). |
| **Dados** | `endereco.codigoCidade` sem 7 dígitos após normalização → derivação **não** corre; utilizador não sabe porquê. | Copy ou validação **leve** no Guia MEI (fase 2, se PO priorizar) ou doc de troubleshooting. |
| **Diagnóstico** | Mistura com erro **tabela IBGE** ou com **prefeitura-config** UX. | Ligação explícita entre PRDs e **`docs/operacao-mei-nfse.md`**. |
| **Produção** | Risco de activar flag em massa sem **NFR-PREF-EV-01**. | Critério de release e owner (operação + PO). |

---

## 6. Personas e cenários

| Persona | Cenário |
|---------|---------|
| **MEI** | Conclui certificado e dados de empresa com IBGE válido; espera cadastro sem 400 `prefeitura` quando o emissor aceita só `codigoIbge`. |
| **Dev local** | Define `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true` no `.env` do backend, reinicia API, retesta **POST** → **2xx** e **GET** deixa de 404 para o CNPJ. |
| **Operação** | Em produção, só activa a flag após checklist e evidência; se 400 persistir, escala para **credenciais** / ticket Plugnotas (trilhos do PRD PREF). |
| **PO** | Aprova alteração de **default** da env em ambientes não prod (se proposta). |

**Stakeholders:** PO, Operação, Backend, Frontend (doc/UX), QA, Suporte.

---

## 7. Escopo

### 7.1 Dentro do escopo

1. **Documentação:** `docs/operacao-mei-nfse.md` (ou secção acordada) referencia este PRD, o brief, a env **`PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`**, pré-requisito de **7 dígitos** e o **404** como efeito do POST falhado (**FR-PREFB-DOC-01**).  
2. **Paridade `backend/.env.example`:** comentário ou linha exemplo **clara** para a flag (já referenciada no brief; manter **sincronizado** com texto deste PRD) (**FR-PREFB-ENV-01**).  
3. **Critérios de aceite de release** para equipas: checklist em §12.  
4. **Handoff:** se após trilho B o 400 continuar, utilizador/equipa segue **`PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08`** / **`PRD-acao-p0-…`** (**FR-PREFB-ESC-01**).

### 7.2 Fora do escopo

- Implementação **nova** da derivação (já existente em `nfsePrefeituraPayload.js`) salvo **bugfix** identificado em story à parte.  
- **UI** para credenciais de prefeitura (trilho C) — PRD PREF; não obrigatório neste PRD.  
- Alteração do contrato **Plugnotas** junto do fornecedor (trilho A).  
- Resolver erro **tabela IBGE** / `codigoIBGECidade` — **PRD-correcao-ibge-tabela-…**.

---

## 8. Decisões de produto

| ID | Decisão |
|----|---------|
| **DP-PREFB-01** | O trilho B permanece **opt-in** via env; **produção** exige confirmação explícita (**NFR-PREF-EV-01** ou processo operacional equivalente) antes de `true` em ambientes com utilizadores reais. |
| **DP-PREFB-02** | Ordem de diagnóstico sugerida: **(1)** flag activa + restart; **(2)** `endereco.codigoCidade` com 7 dígitos; **(3)** logs (`PLUGNOTAS_DEBUG` em não-prod se necessário); **(4)** escalar para PRD PREF / P0 se mensagem persistir. |
| **DP-PREFB-03** | Não documentar que **inscrição municipal** na raiz substitui `nfse.config.prefeitura` (alinhado ao PRD PREF). |

---

## 9. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-PREFB-DOC-01** | A documentação operacional (`docs/operacao-mei-nfse.md` ou pointer acordado) inclui: sintoma 400 `fields.nfse.config.prefeitura`; papel da env `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`; necessidade de **7 dígitos** em `endereco.codigoCidade`; relação causal **POST falha → GET 404**; ligações a este PRD e ao brief. |
| **FR-PREFB-ENV-01** | `backend/.env.example` mantém orientação **legível** sobre a flag (comentário que cite trilho B / derivação IBGE), coerente com o §3 do brief. |
| **FR-PREFB-ESC-01** | O mesmo doc ou este PRD §8 indica **explicitamente** o passo seguinte quando o 400 **não** cessa após flag + IBGE: remeter a **`PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08`** / **`PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08`** (credenciais, conta, UI). |
| **FR-PREFB-QA-01** | Os testes de contrato existentes (`backend/tests/plugnotas-empresa.test.js`, `nfsePrefeituraPayload.test.js`) continuam a validar o comportamento com flag `true`; regressões **bloqueiam** merge (já alinhado a `AGENTS.md`). |

---

## 10. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| **NFR-PREFB-01** | Activar `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE` em **produção** só após critério **DP-PREFB-01**; registo da decisão (ticket, change log de deploy ou entrada em `docs/evidence/` sem PII). |
| **NFR-PREFB-02** | Gates do repositório: `npm run lint`, `npm run typecheck`, `npm run test` conforme **`AGENTS.md`**. |
| **NFR-PREFB-03** | Logs de debug de payload não violam política de redacção de secrets já aplicada ao módulo Plugnotas. |

---

## 11. Métricas e sucesso

| Métrica | Alvo |
|---------|------|
| **Tempo médio** para um dev novo configurar env local e obter **POST 2xx** (amostra interna) | Redução qualitativa após **FR-PREFB-DOC-01**. |
| **Tickets** confundindo 404 GET com “bug de consulta” isolada | Redução após doc causal **POST → GET**. |
| **Regressões** nos testes **FR-PREFB-QA-01** | **0** em CI. |

---

## 12. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Flag `true` em prod sem evidência | **NFR-PREFB-01** + owner operação. |
| Município exige **login/senha** além de IBGE | **FR-PREFB-ESC-01** → PRD PREF / P0. |
| IBGE “válido” localmente mas rejeitado por outra regra Plugnotas | Suporte + ticket fornecedor; não prometer 100% só com B. |

---

## 13. Critérios de aceite (checklist de release)

- [ ] **FR-PREFB-DOC-01** satisfeito.  
- [ ] **FR-PREFB-ENV-01** satisfeito (revisão de diff em `.env.example`).  
- [ ] **FR-PREFB-ESC-01** satisfeito (cruzamento de links entre documentos).  
- [ ] **FR-PREFB-QA-01** — CI verde nos módulos referidos.  
- [ ] **NFR-PREFB-01** a **NFR-PREFB-03** verificados para o âmbito deste incremento.  
- [ ] Story em **`docs/stories/`** (quando criada) com checklist e file list actualizados.

---

## 14. Epic e stories (sugestão para @sm)

**Epic 1 — Trilho B documentado e operacional**

| Story | Título (sugestão) | Objetivo |
|-------|-------------------|----------|
| 1.1 | Doc operacional + links PRD/brief | Implementar **FR-PREFB-DOC-01**, **FR-PREFB-ESC-01**. |
| 1.2 | Revisão `.env.example` e notas de deploy | Implementar **FR-PREFB-ENV-01**. |
| 1.3 | Verificação regressão testes trilho B | Implementar **FR-PREFB-QA-01** (ajustes mínimos se necessário). |

*(Epic único; pode ser uma única story se PO comprimir escopo.)*

---

## 15. Change log

| Versão | Data | Autor / papel | Notas |
|--------|------|----------------|-------|
| 1.0 | 2026-04-09 | PM (derivado do brief) | Versão inicial a partir de **`brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09`**. |

---

*PRD brownfield — Meu Financeiro / integração Plugnotas — trilho B `nfse.config.prefeitura` derivado do IBGE do endereço.*
