# PRD — tratativa operacional para `prefeitura_login_required_blocked` no setup fiscal MEI

**Versão:** 1.0  
**Data:** 2026-04-13  
**Tipo:** Brownfield — política operacional e triagem (`POST /api/mei-notas/setup/emissao-fiscal/empresa`)  
**Fonte do briefing:** [`docs/brief/brief-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../brief/brief-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md)

---

## Relação com artefatos existentes

| Artefato | Papel |
|---|---|
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Fonte canónica do roteiro TOP (`2h`) e matriz ROB/NATEX para classificação final |
| [`docs/prd/PRD-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](./PRD-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md) | PRD do teste operacional já formalizado (execução e evidência mínima) |
| [`docs/qa/top-prefeitura-login-required-blocked-2026-04-10.md`](../qa/top-prefeitura-login-required-blocked-2026-04-10.md) | Exemplo de evidência operacional redigida |
| [`docs/stories/story-fr-top-p1-operacao-qa-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md`](../stories/story-fr-top-p1-operacao-qa-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md) | Story que institucionaliza o roteiro canónico no runbook |
| [`docs/stories/story-fr-top-p1-frontend-ux-validacao-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md`](../stories/story-fr-top-p1-frontend-ux-validacao-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md) | Story de validação UI/Network e rastreabilidade operacional |

---

## 1. Resumo executivo

O cenário `HTTP 400` com `errors.plugnotasCode = prefeitura_login_required_blocked` deve ser tratado como **exceção operacional esperada** no fluxo nacional atual, e não como bug de rota.

Este PRD formaliza a política de tratativa para:

1. evitar abertura de correção técnica indevida;
2. padronizar classificação e evidência;
3. definir quando escalar para nova iniciativa de produto.

---

## 2. Problema

Sem política operacional explícita, o mesmo incidente gera diagnósticos divergentes (endpoint/infra/payload/política municipal), com retrabalho entre suporte, QA e produto.

Apesar do cenário já estar classificado no backend e runbook, faltava um PRD específico para governar a decisão operacional de curto prazo e os gatilhos de escalonamento.

---

## 3. Objetivos

1. Consolidar a decisão operacional vigente para `prefeitura_login_required_blocked`.
2. Assegurar que a classificação padrão seja `não suportado no fluxo nacional`.
3. Exigir evidência redigida mínima com causalidade preservada (`POST` -> `GET`).
4. Definir critérios objetivos para abrir iniciativa nova de produto (quando houver recorrência/impacto estratégico).

---

## 4. Fora de escopo

- Implementar suporte municipal (`login`/`senha`) no fluxo atual.
- Alterar contrato funcional do endpoint atual de cadastro.
- Redesenhar a jornada Guia MEI para municipal-first.
- Trocar provedor ou refatorar integração PlugNotas além do comportamento vigente.

---

## 5. Contexto e premissas

1. O produto mantém NFS-e Nacional como política padrão da jornada MEI.
2. `prefeitura_login_required_blocked` representa exceção municipal fora do percurso suportado.
3. O runbook canónico e as stories TOP já validadas são a fonte de execução e evidência.
4. Sem decisão estratégica nova de produto, engenharia não deve alterar o endpoint atual para este caso.

---

## 6. Requisitos funcionais

| ID | Requisito |
|---|---|
| **FR-TRO-01** | Incidentes com `plugnotasCode = prefeitura_login_required_blocked` devem ser classificados operacionalmente como `não suportado no fluxo nacional`. |
| **FR-TRO-02** | O diagnóstico operacional não deve classificar o cenário como “erro de endpoint” quando os metadados indicarem `prefeitura_login_required_blocked`. |
| **FR-TRO-03** | O registo do incidente deve conter, no mínimo: `message`, `errors.plugnotasCode`, `errors.plugnotasRequest.method`, `errors.plugnotasRequest.path`, `errors.httpStatus`. |
| **FR-TRO-04** | O fluxo de triagem deve preservar causalidade: `GET` negativo posterior (ex.: `empresa_nao_cadastrada`) é consequência do `POST` falho, não causa raiz. |
| **FR-TRO-05** | Cada ocorrência deve ficar vinculada a ticket interno com referência ao runbook/artefato local de evidência. |
| **FR-TRO-06** | A decisão final do caso deve ser binária: `esperado pela política vigente` ou `regressão técnica a corrigir`. |
| **FR-TRO-07** | Quando houver recorrência relevante, operação/produto devem abrir avaliação formal para iniciativa nova (PRD dedicado). |
| **FR-TRO-08** | Gatilhos para escalonamento de iniciativa nova: volume recorrente com impacto operacional, demanda comercial explícita, ou decisão estratégica de ampliar cobertura municipal. |

---

## 7. Requisitos não funcionais

| ID | Requisito |
|---|---|
| **NFR-TRO-01** | Evidência obrigatoriamente redigida (sem token, senha, certificado, payload bruto, PII sensível). |
| **NFR-TRO-02** | Processo reproduzível em local/homologação/produção controlada com ambiente explicitado. |
| **NFR-TRO-03** | Não introduzir mudança de comportamento em código de aplicação para fechar esta tratativa operacional. |
| **NFR-TRO-04** | Baixo overhead de operação: usar runbook canónico e artefato local padrão, evitando documentação paralela inconsistente. |

---

## 8. Decisões operacionais vigentes

| ID | Decisão |
|---|---|
| **DP-TRO-01** | O fluxo principal permanece NFS-e Nacional por padrão. |
| **DP-TRO-02** | `prefeitura_login_required_blocked` é tratado como exceção operacional não suportada no fluxo nacional atual. |
| **DP-TRO-03** | O caso não deve ser tratado como falha de endpoint quando o contrato de erro estiver presente. |
| **DP-TRO-04** | Sem alteração de comportamento no endpoint atual enquanto a política de produto permanecer inalterada. |

---

## 9. Critérios de aceite

- [ ] Classificação padrão `não suportado no fluxo nacional` aplicada nos casos com `prefeitura_login_required_blocked`.
- [ ] Evidência mínima FR-TRO-03 registrada com redaction.
- [ ] Causalidade `POST` falho -> `GET` negativo preservada quando aplicável.
- [ ] Ticket interno + referência ao runbook/artefato local registrados.
- [ ] Decisão final binária (`esperado` vs `regressão`) explícita.
- [ ] Gatilhos de escalonamento para iniciativa nova documentados e compreendidos pelas áreas.

---

## 10. Métricas de sucesso

| Métrica | Sinal esperado |
|---|---|
| Diagnóstico consistente | redução de reclassificações indevidas para “erro de endpoint” |
| Qualidade de evidência | maior proporção de tickets com metadados mínimos completos e redigidos |
| Tempo de triagem | menor ciclo entre incidente e decisão operacional final |
| Governança de produto | escalonamento para iniciativa nova apenas quando gatilhos FR-TRO-08 ocorrerem |

---

## 11. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Reabertura recorrente de falso bug técnico | Retrabalho de engenharia | Forçar FR-TRO-01/02 e uso do runbook canónico |
| Evidência sem redaction | Risco de segurança/compliance | Aplicar NFR-TRO-01 e checklist de evidência |
| Escalonamento tardio quando recorrência aumentar | Perda de oportunidade de produto | Monitorar gatilhos FR-TRO-08 em ticket interno |

---

## 12. Dependências e desdobramentos

| Área | Entrega esperada |
|---|---|
| Operação/QA | Triagem padronizada conforme runbook `2h` + evidência redigida em ticket |
| Produto | Avaliar e aprovar (ou não) iniciativa nova quando gatilhos de recorrência forem atingidos |
| Engenharia | Manter comportamento atual, atuando apenas se houver regressão técnica confirmada |

---

## 13. Change log

| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-04-13 | PRD inicial derivado do brief de tratativa operacional para `prefeitura_login_required_blocked`. |
