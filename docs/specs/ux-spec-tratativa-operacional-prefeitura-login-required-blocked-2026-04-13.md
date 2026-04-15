# Especificação de front-end e UX — tratativa operacional `prefeitura_login_required_blocked`

**Versão:** 1.0  
**Data:** 2026-04-13  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**PRD de origem:** [`docs/prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md) (**FR-TRO-01** a **FR-TRO-08**, **NFR-TRO-01** a **NFR-TRO-04**, **DP-TRO-01** a **DP-TRO-04**)  
**Brief base:** [`docs/brief/brief-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../brief/brief-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md)

**Relação com artefatos existentes (complementar, não substitui):**

| Artefato | Papel |
|---|---|
| [`docs/specs/ux-spec-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](./ux-spec-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md) | Execução do teste operacional (passos A-D) |
| [`docs/specs/ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](./ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md) | Política UX nacional-first e bloqueio da exceção municipal |
| [`docs/operacao-mei-nfse.md#top-roteiro-operacional-prefeitura-login-required-blocked`](../operacao-mei-nfse.md#top-roteiro-operacional-prefeitura-login-required-blocked) | Fonte canónica de operação/QA para classificação ROB/NATEX |
| [`docs/qa/top-prefeitura-login-required-blocked-2026-04-10.md`](../qa/top-prefeitura-login-required-blocked-2026-04-10.md) | Exemplo de evidência operacional redigida |

---

## 1. Objetivo do documento

Definir o contrato de UX/front-end para a **tratativa operacional** do cenário:

- `POST /api/mei-notas/setup/emissao-fiscal/empresa` com `HTTP 400`;
- `errors.plugnotasCode = prefeitura_login_required_blocked`.

Esta spec formaliza como a interface e a triagem devem comunicar e classificar o caso para evitar falso diagnóstico de “erro de endpoint”.

---

## 2. Escopo UX

### 2.1 Dentro do escopo

- narrativa UX coerente com a política nacional vigente;
- critérios de interpretação operacional (`esperado` vs `regressão`);
- captura e redação da evidência mínima obrigatória;
- preservação de causalidade `POST` falho -> `GET` negativo posterior.

### 2.2 Fora do escopo

- novo fluxo para `login`/`senha` municipal;
- mudança de contrato do endpoint atual de cadastro;
- redesign completo da Guia MEI;
- suporte municipal-first sem iniciativa formal de produto.

---

## 3. Metas e princípios de UX

| Meta | Princípio aplicado |
|---|---|
| Evitar retrabalho de diagnóstico | **Erro certo, narrativa certa:** não classificar `prefeitura_login_required_blocked` como falha de rota |
| Padronizar decisão operacional | **Decisão binária:** `esperado pela política vigente` ou `regressão técnica` |
| Proteger qualidade da evidência | **Rastreabilidade com redaction:** registrar metadados mínimos sem segredo/PII sensível |
| Reduzir ambiguidade entre times | **Causa antes de consequência:** `GET` negativo após falha no `POST` não é causa raiz |

---

## 4. Atores e superfícies

| Ator | Superfície | Resultado esperado |
|---|---|---|
| Utilizador MEI | Guia MEI (`GuidesMei`) | Receber mensagem de bloqueio compatível com política nacional, sem pedido de credenciais municipais |
| Operação/QA | UI + DevTools Network + runbook | Registrar evidência mínima e concluir classificação |
| Produto | Ticket/evidência consolidada | Decidir se mantém política atual ou abre iniciativa nova por gatilho de recorrência |

---

## 5. Tradução dos requisitos do PRD para UX/front-end

| Requisito PRD | Especificação UX correspondente |
|---|---|
| **FR-TRO-01** | Em casos com `prefeitura_login_required_blocked`, classificar como `não suportado no fluxo nacional` |
| **FR-TRO-02** | UI/documentação operacional não devem sugerir “endpoint errado” para esse código |
| **FR-TRO-03** | Evidência obrigatória com `message`, `plugnotasCode`, `plugnotasRequest.method`, `plugnotasRequest.path`, `httpStatus` |
| **FR-TRO-04** | Em triagem, registrar explicitamente que `GET` negativo posterior é consequência do `POST` falho |
| **FR-TRO-05** | Cada ocorrência deve estar ligada a ticket interno + referência local (runbook/`docs/qa`) |
| **FR-TRO-06** | Conclusão sempre binária: `esperado` ou `regressão` |
| **FR-TRO-07** | Recorrência relevante deve ser encaminhada para avaliação formal de produto |
| **FR-TRO-08** | Gatilhos de escalonamento (volume, demanda comercial, decisão estratégica) devem estar visíveis no resultado operacional |
| **NFR-TRO-01** | Evidência redigida: sem token, certificado, credenciais ou payload sensível |
| **NFR-TRO-03** | Sem alteração de comportamento de código para encerrar a tratativa operacional |

---

## 6. Fluxo UX de tratativa operacional

### 6.1 Passo A — tentativa de cadastro

- Executar o cadastro na Guia MEI.
- Se ocorrer `400` com `prefeitura_login_required_blocked`, manter narrativa de exceção municipal fora do fluxo nacional.

### 6.2 Passo B — captura de resposta técnica mínima

- Abrir request `POST /setup/emissao-fiscal/empresa` em Network.
- Registrar os cinco campos mínimos de evidência (FR-TRO-03), com redaction.

### 6.3 Passo C — validação de causalidade

- Quando aplicável, executar `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=...` após o `POST` falho.
- Registrar o `GET` negativo como efeito da não conclusão do cadastro.

### 6.4 Passo D — decisão e encaminhamento

- Classificar o caso usando runbook/ROB-NATEX.
- Registrar decisão binária final e encaminhar gatilho para produto se houver recorrência relevante.

---

## 7. Regras de copy e linguagem operacional

### 7.1 Deve comunicar

- limite do fluxo nacional vigente;
- impossibilidade de concluir cadastro nesse percurso;
- orientação para tratativa operacional sem culpar o utilizador.

### 7.2 Não deve comunicar

- “endpoint errado” para `prefeitura_login_required_blocked`;
- solicitação de `login`/`senha` municipal na UI atual;
- conclusão de regressão sem checagem do código de erro e causalidade.

---

## 8. Matriz de estados UX para triagem

| Estado observado | Interpretação padrão |
|---|---|
| `POST` sucesso | Fluxo segue normal |
| `POST` 400 + `prefeitura_login_required_blocked` | Exceção esperada e não suportada no fluxo nacional |
| `GET` posterior negativo após `POST` falho | Consequência do cadastro não concluído |
| `POST` 400 com outro código | Tratar conforme código específico; pode exigir investigação técnica |

---

## 9. Evidência, privacidade e acessibilidade

- Capturas e transcrições devem ser redigidas (NFR-TRO-01).
- Não registrar segredo em artefatos (`token`, `certificado`, `senha`, payload sensível).
- Manter alerta primário acessível (`role="alert"` ou equivalente vigente), sem duplicidade desnecessária.
- Evidência deve indicar ambiente (`local`/`homologação`/`produção controlada`) e responsável.

---

## 10. Pontos de implementação/validação no frontend

| Arquivo | Papel na validação |
|---|---|
| `frontend/src/pages/GuidesMei.tsx` | Superfície de mensagem/estado da jornada |
| `frontend/src/lib/fiscalUserError.ts` | Mapeamento de narrativa por `plugnotasCode` |
| `frontend/src/utils/apiClientError.ts` | Normalização e propagação de metadados de erro |

Diretriz: sem mudança funcional para fechar esta tratativa, salvo regressão técnica comprovada.

---

## 11. Critérios de aceite UX

- [ ] Casos com `prefeitura_login_required_blocked` não são narrados como erro de endpoint (**FR-TRO-01/02**).
- [ ] Evidência contém os campos mínimos obrigatórios e redigidos (**FR-TRO-03**, **NFR-TRO-01**).
- [ ] Causalidade `POST` falho -> `GET` negativo está explícita quando aplicável (**FR-TRO-04**).
- [ ] Há vínculo com ticket interno + referência ao runbook/artefato local (**FR-TRO-05**).
- [ ] Decisão final está registrada de forma binária (**FR-TRO-06**).
- [ ] Gatilhos de escalonamento para produto estão previstos no fechamento do caso (**FR-TRO-07/08**).
- [ ] Não há pedido de credenciais municipais na UI do fluxo atual (**DP-TRO-01/02**).

---

## 12. Change log

| Versão | Data | Nota |
|---|---|---|
| 1.0 | 2026-04-13 | Spec inicial de UX/front-end para tratativa operacional `prefeitura_login_required_blocked`, derivada do PRD de 13/04/2026. |

