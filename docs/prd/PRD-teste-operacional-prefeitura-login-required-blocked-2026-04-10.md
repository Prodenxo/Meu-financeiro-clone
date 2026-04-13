# PRD — teste operacional do erro `prefeitura_login_required_blocked` no cadastro de empresa PlugNotas

**Versão:** 1.0  
**Data:** 2026-04-10  
**Tipo:** Brownfield — Guia MEI / setup de emissão fiscal (`POST /api/mei-notas/setup/emissao-fiscal/empresa`)  
**Fonte do briefing:** [`docs/brief/brief-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](../brief/brief-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md)

---

## Relação com artefatos existentes

| Artefato | Papel |
|---|---|
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Runbook canónico para classificação ROB/NATEX e decisão operacional do caso bloqueado |
| [`docs/brief/brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../brief/brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | Contexto funcional do erro de credencial municipal obrigatória |
| [`backend/src/services/plugnotas/prefeituraPortalCredentials.js`](../../backend/src/services/plugnotas/prefeituraPortalCredentials.js) | Política backend e mensagem pública para `prefeitura_login_required_blocked` |
| [`backend/src/services/plugnotas/empresa.service.js`](../../backend/src/services/plugnotas/empresa.service.js) | Classificação do erro upstream e retorno de metadados para frontend |
| [`backend/tests/plugnotas-empresa.test.js`](../../backend/tests/plugnotas-empresa.test.js) | Regressões de classificação e comportamento para o cenário |
| [`backend/tests/mei-notas-empresa-http.test.js`](../../backend/tests/mei-notas-empresa-http.test.js) | Teste HTTP da API interna para bloqueio e metadados esperados |

---

## 1. Resumo executivo

O incidente atual (`HTTP 400` com `errors.plugnotasCode = prefeitura_login_required_blocked`) precisa de validação operacional padronizada para separar:

1. comportamento esperado da política vigente; e
2. regressão técnica real.

Este PRD define o teste operacional oficial para essa validação, com roteiro único, evidências mínimas, critérios de aceite e saída clara de decisão.

---

## 2. Problema

Sem um teste operacional canónico, o mesmo erro tende a gerar diagnósticos conflitantes (endpoint, ambiente, payload, ou política municipal), atrasando triagem e decisão.

O projeto já possui implementação e testes para o código `prefeitura_login_required_blocked`, mas faltava um PRD formal para padronizar execução e evidência operacional desse caso.

---

## 3. Objetivos

1. Padronizar como reproduzir e validar o cenário `prefeitura_login_required_blocked`.
2. Garantir evidência redigida mínima para operação, QA e produto.
3. Preservar causalidade `POST` falho -> `GET` negativo quando aplicável.
4. Encerrar o teste com conclusão explícita:
   - `esperado pela política vigente`; ou
   - `regressão técnica a corrigir`.

---

## 4. Fora de escopo

- Alterar política do produto para recolha de `login`/`senha` municipais.
- Redesenhar fluxo da Guia MEI.
- Trocar provedor ou reescrever integração PlugNotas.
- Definir solução de arquitetura além da execução deste teste operacional.

---

## 5. Contexto e premissas

1. O fluxo nacional-first atual permanece vigente.
2. O código `prefeitura_login_required_blocked` é resposta válida quando o emissor exige credencial municipal.
3. A validação operacional deve usar somente evidências redigidas e sem segredos.
4. Ambiente local de referência observado no briefing:
   - `PLUGNOTAS_API_BASE_URL=https://api.plugnotas.com.br`
   - `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true`

---

## 6. Requisitos funcionais

| ID | Requisito |
|---|---|
| **FR-TOP-01** | O teste deve executar `POST /api/mei-notas/setup/emissao-fiscal/empresa` com cenário que reproduza o incidente. |
| **FR-TOP-02** | O teste deve capturar resposta JSON da API no frontend (Network/Response). |
| **FR-TOP-03** | O teste deve capturar log backend redigido do payload em falha 400 (`[plugnotas empresa cadastro] ... 400 request payload (redacted)`). |
| **FR-TOP-04** | O teste deve registrar os campos diagnósticos mínimos: `message`, `errors.plugnotasCode`, `errors.plugnotasRequest.method`, `errors.plugnotasRequest.path`, `errors.httpStatus`. |
| **FR-TOP-05** | O teste deve executar `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=...` após o `POST` quando aplicável e registrar resultado como consequência causal. |
| **FR-TOP-06** | O teste deve classificar o resultado com base na matriz ROB/NATEX do runbook. |
| **FR-TOP-07** | A saída do teste deve trazer decisão final explícita: `esperado pela política vigente` ou `regressão técnica`. |
| **FR-TOP-08** | Se `plugnotasCode = prefeitura_login_required_blocked`, a classificação final deve ser `não suportado no fluxo nacional` no contexto operacional atual. |

---

## 7. Requisitos não funcionais

| ID | Requisito |
|---|---|
| **NFR-TOP-01** | Evidências devem ser redigidas, sem token, certificado, payload bruto ou credenciais em claro. |
| **NFR-TOP-02** | O teste deve ser reproduzível em ambientes controlados (local/homologação/produção controlada) com pré-condições explícitas. |
| **NFR-TOP-03** | Alterações de `.env` necessárias ao teste devem exigir reinício do backend antes da execução. |
| **NFR-TOP-04** | O teste não deve introduzir alterações de comportamento em código de aplicação; é um procedimento operacional validado por artefato. |

---

## 8. Decisões operacionais vigentes

| ID | Decisão |
|---|---|
| **DP-TOP-01** | `prefeitura_login_required_blocked` não é tratado como erro de endpoint no fluxo atual. |
| **DP-TOP-02** | O caso deve ser encaminhado por runbook/suporte sem abrir coleta de `login`/`senha` no produto neste percurso. |
| **DP-TOP-03** | `GET` negativo após `POST` falho não substitui causa raiz anterior. |

---

## 9. Critérios de aceite

- [ ] Resposta `POST` registrada com os campos diagnósticos mínimos.
- [ ] Log backend redigido anexado para o mesmo evento.
- [ ] Evidência sem segredo/PII sensível.
- [ ] Classificação ROB/NATEX aplicada sem ambiguidade.
- [ ] Causalidade `POST` -> `GET` preservada quando houver consulta posterior.
- [ ] Conclusão final explicitamente marcada como `esperado` ou `regressão`.

---

## 10. Métricas de sucesso

| Métrica | Sinal esperado |
|---|---|
| Tempo de triagem | redução de ciclos de diagnóstico contraditório para o mesmo erro |
| Qualidade da evidência | tickets/QA com metadados mínimos completos e redigidos |
| Consistência de classificação | convergência para decisão única por cenário (`não suportado no fluxo nacional` quando aplicável) |

---

## 11. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Classificar como “endpoint errado” sem validar `plugnotasCode` | Retrabalho técnico | Aplicar FR-TOP-04/06/08 obrigatoriamente |
| Vazamento de dado sensível na evidência | Risco de segurança/compliance | Cumprir NFR-TOP-01 e usar logs redigidos |
| Perda de causalidade entre `POST` e `GET` | Decisão operacional incorreta | Cumprir FR-TOP-05 e DP-TOP-03 |

---

## 12. Dependências e desdobramentos

| Área | Entrega esperada |
|---|---|
| Operação/QA | Execução do teste e registo da evidência no ticket da ocorrência |
| Produto/PO | Decisão sobre próximos passos caso resultado indique regressão |
| Dev | Correção apenas se o resultado final for `regressão técnica` |

---

## 13. Change log

| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-04-10 | PRD inicial derivado do brief de teste operacional de `prefeitura_login_required_blocked`. |

