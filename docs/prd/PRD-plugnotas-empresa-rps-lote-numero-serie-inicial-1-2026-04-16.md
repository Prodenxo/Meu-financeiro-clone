# PRD — Cadastro de empresa PlugNotas: **RPS** inicial (**lote 1**, **número 1**, **série "1"**)

**Versão:** 1.0  
**Data:** 2026-04-16  
**Tipo:** Brownfield — BFF `POST` / `PATCH` empresa → API PlugNotas (`addCompany` / `updateCompany`), fluxo Guia MEI  
**Fonte canónica do pedido:** [`docs/brief/brief-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md`](../brief/brief-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md)

**Relação com outros artefactos:**

- **[`docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`](./PRD-meu-financeiro-produto-brownfield-2026-03-26.md)** — contexto NFS-e e Plugnotas.  
- **[`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md)** — normalização de payload de empresa; alterações ao cadastro devem manter coerência com políticas existentes.  
- **[`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)** — runbook fiscal; falhas upstream devem seguir padrões de escalação já adoptados.  
- **Referência externa:** [Documentação API PlugNotas — `addCompany` (Empresa)](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany).  
- **Código de referência:** `backend/src/services/plugnotas/empresa.service.js`, `frontend/src/utils/nfEmissionCompany.ts`.

**Não substitui** orientação legal ou municipal sobre numeração de RPS; o produto **aplica** valores iniciais canónicos acordados com o integrador.

---

## 1. Resumo executivo

O cadastro de emitente enviado ao **PlugNotas** deve incluir explicitamente o bloco **`rps`** com valores iniciais **padronizados**: **`lote` = 1** e **`numeracao`** com pelo menos **`{ numero: 1, serie: "1" }`**, alinhados à documentação pública do provedor (campos **`numero`** e **`serie`** obrigatórios dentro de `numeracao`).

Hoje o cliente (`buildNfEmissionEmpresaPayload`) **não** envia `rps`; este PRD torna o comportamento **normativo** na aplicação: **criação** de empresa no provedor passa a **sempre** transportar essa configuração inicial, aplicada de forma **centralizada** (preferencialmente no **backend**, fonte única de verdade), com regra explícita para **`PATCH`** (§6.1) de modo a **não** sobrescrever numeração já em uso no emissor.

---

## 2. Visão de produto (experiência)

- O **utilizador final** não precisa de novo campo na UI para “lote” ou “série RPS” neste âmbito: o produto garante **defaults seguros e consistentes** no primeiro registo no PlugNotas.  
- **Suporte e QA** podem assumir que **todo** cadastro inicial bem-sucedido partilha a **mesma** configuração inicial de RPS documentada aqui, simplificando reprodução e documentação.  
- **Operação** trata rejeições do provedor relacionadas com `rps` como **incidente de contrato ou de conta**, com registo e eventual escalação (§5.2, §8).

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Previsibilidade** | `rps` ausente ou implícito no cliente pode gerar comportamento opaco ou variável no PlugNotas. | Payload **explícito** e **único** no BFF em `POST` empresa. |
| **Consistência** | Duplicar a regra no front e no back aumenta risco de divergência. | **Uma** camada canónica (preferência: **backend**). |
| **Risco de regressão** | Enviar `rps` em **`PATCH`** sem critério pode **repor** número/série e conflituar com notas já emitidas. | Política **fechada** neste PRD: **`PATCH` não força `rps`** salvo excepção futura e ADR (**§6.1**). |

---

## 4. Personas e cenários

| Persona | Cenário |
|---------|---------|
| **MEI — primeiro cadastro** | Submete empresa; o BFF envia ao PlugNotas `rps` com **lote 1** e **numeracao** **1 / "1"** conforme §7. |
| **MEI — atualização de dados** | Usa fluxo de `PATCH` (ex.: dados cadastrais); a numeração RPS **remota** **não** é alterada por esta entrega (**FR-RPS-PATCH-01**). |
| **QA** | Valida em sandbox que o corpo upstream do `POST` contém o bloco `rps` esperado após políticas do servidor. |
| **Operação** | Se o PlugNotas devolver **400** referindo `rps`, segue runbook e regista evidência (**NFR-RPS-OBS-01**). |

**Stakeholders:** PO (este PRD), UX (sem obrigação de UI neste MVP), Architect (ponto de extensão no BFF), Backend, QA.

---

## 5. Escopo

### 5.1 Dentro do escopo (P0)

1. Incluir **`rps`** no payload de **criação** de empresa no PlugNotas (**`POST`** via BFF) com **`lote: 1`** (inteiro) e **`numeracao: [{ numero: 1, serie: "1" }]`** (**`numero`** inteiro, **`serie`** string) (**FR-RPS-POST-01**).  
2. Aplicar a regra de forma **canónica no servidor** (merge após validação, juntamente com outras políticas `applyEmpresa…`) (**NFR-RPS-SINGLE-01**).  
3. **Não** incluir **`rps`** no **`PATCH`** de empresa por defeito da política desta entrega (**FR-RPS-PATCH-01**).  
4. **Testes automatizados** que assertem a estrutura de `rps` após a política no caminho de **`POST`** (**FR-RPS-QA-01**).  
5. Documentação mínima: referência cruzada neste PRD e, se o time técnico concluir necessário, **addendum** ou nota no [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md) — **sem** duplicar o PRD inteiro (**NFR-RPS-DOC-01**).

### 5.2 Fora do escopo

- **UI** para o utilizador editar lote, série ou número inicial de RPS.  
- **Múltiplas séries** além da entrada canónica **série "1"** no `POST` inicial (podem ser tratadas depois via **`PATCH /empresa`** no painel Plugnotas ou entrega futura).  
- **Sincronizar** ou **ler de volta** o estado de `rps` do Plugnotas para pré-preencher formulários (pode ser backlog).  
- **Alterar** regras fiscais municipais ou substituir o provedor.

---

## 6. Decisões de produto

### 6.1 `POST` vs `PATCH`

| Operação | Decisão |
|----------|---------|
| **`POST` (criar empresa no Plugnotas)** | **Sempre** enviar **`rps`** conforme **FR-RPS-POST-01**. Se o cliente enviar `rps` com valores diferentes, o **servidor substitui** pelos valores canónicos deste PRD (**FR-RPS-OVR-01**), salvo **revogação explícita** por ADR futuro com justificativa de integração. |
| **`PATCH` (atualizar empresa)** | **Não** enviar nem fundir **`rps`** pela política desta entrega, para **não** repor numeração já consumida no município/emissor (**FR-RPS-PATCH-01**). |

**Racional:** o risco de **duplicidade** ou **conflito** com sequência real de NFS-e é maior em empresas já cadastradas do que no primeiro registo.

### 6.2 Fonte de verdade

**Decisão:** Implementação **preferencial** no **backend** (`empresa.service.js` ou módulo dedicado reutilizado por `POST`). O frontend **pode** espelhar o mesmo bloco para depuração, mas **não** é requisito; a garantia de produto é **servidor** (**NFR-RPS-SINGLE-01**).

### 6.3 Excepções e revogação

Qualquer necessidade futura de **valores diferentes** de `lote` / `numeracao` por município, conta ou convénio comercial deve passar por **novo PRD** ou **addendum** e revisão de **ADR**.

---

## 7. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-RPS-POST-01** | Em todo **`POST`** de empresa ao PlugNotas (criação), o JSON enviado ao upstream deve incluir `rps.lote === 1` e `rps.numeracao` como array com pelo menos um elemento `{ numero: 1, serie: "1" }`. |
| **FR-RPS-OVR-01** | Se o corpo recebido pelo BFF já contiver `rps`, o servidor **normaliza** para os valores de **FR-RPS-POST-01** antes do `fetch` ao PlugNotas (comportamento canónico; sem opção de utilizador neste MVP). |
| **FR-RPS-PATCH-01** | Em **`PATCH`** de empresa, a política implementada **não** deve adicionar nem alterar `rps` (omitir ou não fundir o bloco conforme contrato técnico acordado na story). |
| **FR-RPS-QA-01** | Testes cobrem o caminho de **`POST`** após políticas, verificando presença e valores de `rps` (estrutura estável). |

---

## 8. Requisitos não funcionais e conformidade

| ID | Requisito |
|----|-----------|
| **NFR-RPS-SINGLE-01** | Uma única camada canónica aplica **FR-RPS-POST-01** / **FR-RPS-OVR-01** (preferência: backend). |
| **NFR-RPS-OBS-01** | Em falhas **400** do PlugNotas que mencionem `rps` / `numeracao` / `lote`, registar de forma segura (sem PII desnecessária) para suporte, alinhado aos padrões de log do módulo Plugnotas. |
| **NFR-RPS-DOC-01** | Referência cruzada no ADR ou nota técnica curta se a equipa concluir necessário; este PRD permanece a fonte de requisitos de produto. |
| **NFR-RPS-SBX-01** | Validação manual ou automática em **sandbox** PlugNotas com CNPJ de teste antes de promoção a produção (aceite de QA). |

---

## 9. Critérios de aceite (release)

- [ ] **`POST` empresa** produz upstream `rps` conforme **FR-RPS-POST-01** em ambiente de integração/sandbox.  
- [ ] **`PATCH` empresa** não altera `rps` segundo **FR-RPS-PATCH-01**.  
- [ ] Testes **FR-RPS-QA-01** passam no CI.  
- [ ] `npm run lint`, `npm run typecheck`, `npm test` conforme **`AGENTS.md`** (quality gates do repositório).  
- [ ] Nenhum requisito de **nova** copy de UI obrigatória para este MVP.

---

## 10. Métricas de sucesso (opcionais)

- **Zero** regressões reportadas em cadastro inicial de empresa atribuíveis à ausência ou inconsistência de `rps` após release.  
- Redução de tickets de “numeração / série” não explicáveis no primeiro cadastro (baseline definido pela operação, se disponível).

---

## 11. Delegação (Gate 1)

- **@sm** — elaborar **user story** com file list (`empresa.service.js`, testes, ADR se aplicável), critérios de aceite alinhados ao §9.  
- **@architect** — confirmar o ponto de extensão no BFF e o tratamento exacto de `PATCH` (omit vs strip) face ao cliente HTTP do Plugnotas.  
- **@dev** — implementação.  
- **@qa** — validação sandbox (**NFR-RPS-SBX-01**).

---

*PRD brownfield — Morgan (AIOX PM). Deriva apenas do brief referenciado e artefactos listados; alterações de âmbito exigem revisão de versão.*
