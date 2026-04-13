# PRD — resolucao governada para `prefeitura_login_required_blocked` (trilha operacional + escalonamento condicional)

**Versao:** 1.0  
**Data:** 2026-04-13  
**Tipo:** Brownfield — governanca operacional e decisao de produto para excecao municipal no setup fiscal MEI  
**Fonte do briefing:** [`docs/brief/brief-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`](../brief/brief-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md)

---

## Relacao com artefatos existentes

| Artefato | Papel |
|---|---|
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Fonte canonica do protocolo operacional TRO (triagem, evidencia e decisao binaria). |
| [`docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`](../architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md) | Governanca dos gatilhos FR-TRO-08 e manutencao continua do cluster de ocorrencias. |
| [`docs/prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](./PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md) | PRD anterior de tratativa operacional; este documento amplia para decisao governada trilho A/B orientada por gatilhos. |
| [`docs/stories/story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md`](../stories/story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md) | Story de execucao operacional e rastreabilidade da evidencia FR-TRO-03. |
| [`docs/stories/story-fr-tro-p1-produto-operacao-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`](../stories/story-fr-tro-p1-produto-operacao-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md) | Story de governanca para escalonamento condicional da iniciativa nova. |

---

## 1. Resumo executivo

O erro `HTTP 400` com `errors.plugnotasCode = prefeitura_login_required_blocked` representa excecao municipal fora da politica padrao do fluxo NFS-e Nacional, e nao bug de endpoint.

Este PRD formaliza uma resolucao governada em dois trilhos:

1. **Trilho A (agora):** tratativa operacional obrigatoria com classificacao canonica, evidencia minima redigida e decisao binaria do caso.
2. **Trilho B (condicional):** escalonamento para iniciativa nova apenas quando pelo menos um gatilho FR-TRO-08 for confirmado.

O objetivo e evitar retrabalho ciclico, preservar clareza de responsabilidade entre Operacao/QA, Produto e Engenharia, e garantir que expansao de cobertura municipal ocorra por decisao estrategica explicitamente rastreada.

---

## 2. Problema e oportunidade

| Problema atual | Impacto | Oportunidade de produto |
|---|---|---|
| Casos `prefeitura_login_required_blocked` podem ser confundidos com falha de rota/endpoint. | Retrabalho entre suporte, QA e engenharia. | Padronizar classificacao operacional e narrativa causal. |
| Evidencias operacionais sem padrao unico dificultam auditoria e decisao. | Baixa rastreabilidade e decisoes inconsistentes entre ciclos. | Instituir evidencia minima FR-TRO-03 e fechamento binario obrigatorio. |
| Escalonamento para nova iniciativa pode ocorrer cedo demais ou tarde demais. | Custo operacional alto ou perda de oportunidade comercial. | Governanca por gatilhos FR-TRO-08 sem extensoes ad hoc. |

---

## 3. Objetivos

1. Consolidar a decisao operacional padrao para `prefeitura_login_required_blocked` como `nao suportado no fluxo nacional`.
2. Tornar obrigatorio o encerramento binario de cada ocorrencia: `esperado pela politica vigente` ou `regressao tecnica a corrigir`.
3. Garantir evidencia minima redigida por ticket, preservando causalidade `POST` falho -> `GET` negativo consequente.
4. Definir um gate claro e auditavel para abertura de iniciativa nova baseado apenas em FR-TRO-08.
5. Proteger o endpoint atual de mudancas reativas sem decisao formal de produto.

---

## 4. Escopo

### 4.1 Dentro do escopo

- Governanca da tratativa operacional imediata (trilho A).
- Regras de classificacao, evidencia e decisao final por ocorrencia.
- Regras de escalonamento condicional para iniciativa nova (trilho B).
- Definicao de entradas obrigatorias para decisao de produto por ocorrencia/cluster.

### 4.2 Fora do escopo

- Implementar suporte municipal com credenciais (`login`/`senha`) no fluxo atual.
- Alterar comportamento funcional do endpoint `POST /api/mei-notas/setup/emissao-fiscal/empresa` sem gatilho ativo e aprovacao de produto.
- Troca de integrador, redesenho da jornada fiscal ou mudancas arquiteturais fora do dominio FR-TRO.

---

## 5. Contexto e premissas

1. O produto Meu Financeiro mantem NFS-e Nacional como politica padrao para o Guia MEI.
2. O codigo `prefeitura_login_required_blocked` caracteriza excecao municipal esperada no fluxo vigente.
3. A decisao operacional deve usar os metadados de erro retornados pelo contrato atual (`message`, `plugnotasCode`, request e status).
4. Sem gatilho FR-TRO-08, a saida esperada e manter politica vigente com governanca/evidencia atualizadas.
5. Engenharia atua em codigo apenas quando houver regressao tecnica comprovada e rastreavel.

---

## 6. Requisitos funcionais

| ID | Requisito | Prioridade |
|---|---|---|
| **FR-TRO-01** | Incidentes com `plugnotasCode = prefeitura_login_required_blocked` devem ser classificados como `nao suportado no fluxo nacional`. | P0 |
| **FR-TRO-02** | E proibido diagnosticar o caso como "erro de endpoint" quando o contrato de erro estiver presente. | P0 |
| **FR-TRO-03** | Evidencia minima obrigatoria por ocorrencia: `message`, `errors.plugnotasCode`, `errors.plugnotasRequest.method`, `errors.plugnotasRequest.path`, `errors.httpStatus`. | P0 |
| **FR-TRO-04** | A narrativa operacional deve preservar causalidade: `GET` negativo posterior e consequencia do `POST` falho. | P0 |
| **FR-TRO-05** | Cada ocorrencia deve estar vinculada a ticket interno e artefato versionado em `docs/qa/`. | P0 |
| **FR-TRO-06** | Encerramento do caso deve sempre registrar decisao binaria: `esperado pela politica vigente` ou `regressao tecnica a corrigir`. | P0 |
| **FR-TRO-07** | Produto/Operacao devem avaliar abertura de iniciativa nova quando houver recorrencia relevante no cluster. | P1 |
| **FR-TRO-08** | Escalonamento para iniciativa nova so pode ocorrer com pelo menos um gatilho ativo: (1) volume recorrente com impacto operacional, (2) demanda comercial explicita, (3) decisao estrategica de ampliar cobertura municipal. | P1 |

---

## 7. Requisitos nao funcionais

| ID | Requisito | Nota |
|---|---|---|
| **NFR-TRO-01** | Evidencia obrigatoriamente redigida, sem token, credencial, certificado ou payload sensivel bruto. | Seguranca e compliance |
| **NFR-TRO-02** | Processo reproduzivel em ambiente identificado (local/homologacao/producao controlada). | Operacao |
| **NFR-TRO-03** | Esta tratativa nao deve introduzir mudanca funcional no endpoint atual para "resolver" excecao municipal. | Integridade do fluxo |
| **NFR-TRO-04** | Governanca com baixo overhead: fonte canonica unica e sem duplicidade contraditoria. | Manutencao |
| **NFR-TRO-05** | Decisoes e evidencias devem ser auditaveis por data, ticket, responsavel e artefato associado. | Rastreabilidade |

---

## 8. Requisitos de compatibilidade (brownfield)

| ID | Requisito |
|---|---|
| **CR-TRO-01** | Preservar contrato atual de erro e endpoints existentes do fluxo fiscal MEI sem breaking change. |
| **CR-TRO-02** | Nao regredir roteiro canonico em `docs/operacao-mei-nfse.md` e manter compatibilidade com evidencias historicas `top-...` e novas `tro-...`. |
| **CR-TRO-03** | Nao criar novos gatilhos alem de FR-TRO-08 sem novo PRD/decisao formal de produto. |
| **CR-TRO-04** | Se houver escalonamento, o PRD dedicado deve ter link cruzado com governanca TRO e manter continuidade de historico por cluster. |

---

## 9. Modelo de decisao governada (trilho A/B)

<a id="prd-fr-tro-trilho-a-operacional"></a>

### 9.1 Trilho A — tratativa operacional imediata (obrigatorio)

1. Classificar caso como `nao suportado no fluxo nacional`.
2. Coletar evidencia minima FR-TRO-03 com redaction.
3. Registrar causalidade `POST` falho -> `GET` consequente (quando aplicavel).
4. Encerrar com decisao binaria FR-TRO-06.
5. Publicar rastreabilidade em ticket + artefato `docs/qa/tro-...`.

<a id="prd-fr-tro-trilho-b-escalonamento"></a>

### 9.2 Trilho B — escalonamento condicional (somente com gatilho)

1. Reavaliar FR-TRO-08 no cluster de ocorrencias.
2. Se nenhum gatilho estiver ativo: manter politica vigente e atualizar governanca.
3. Se qualquer gatilho estiver ativo: abrir PRD dedicado da iniciativa nova e linkar ao artefato canonico de governanca.

### 9.3 Matriz de responsabilidades

| Area | Responsabilidade |
|---|---|
| **Operacao/QA** | Executar protocolo TRO, consolidar evidencia redigida e registrar ticket por ocorrencia. |
| **Produto** | Decidir `manter politica vigente` vs `abrir PRD dedicado` com base nos gatilhos FR-TRO-08. |
| **Engenharia** | Nao alterar endpoint por tratativa operacional; atuar apenas em regressao tecnica comprovada. |

---

## 10. Cenarios e entregaveis minimos

| Cenario | Entregavel minimo |
|---|---|
| **Sem gatilho ativo** | Ticket + artefato `docs/qa/tro-...` + decisao formal `manter politica vigente`. |
| **Com gatilho ativo** | Abertura de PRD dedicado + atualizacao do artefato de governanca com link cruzado + plano inicial de escopo. |

---

<a id="prd-fr-tro-criterios-aceite"></a>

## 11. Criterios de aceite (Definition of Done de produto)

- [ ] Classificacao padrao FR-TRO-01 aplicada em ocorrencias `prefeitura_login_required_blocked`.
- [ ] Regra FR-TRO-02 (nao classificar como endpoint errado) registrada e seguida no protocolo.
- [ ] Evidencia minima FR-TRO-03 presente e redigida.
- [ ] Causalidade `POST` -> `GET` documentada quando houver cadeia de efeitos.
- [ ] Encerramento binario FR-TRO-06 registrado em cada ocorrencia auditada.
- [ ] Decisao de governanca por cluster (`manter politica` ou `abrir PRD`) registrada no artefato canonico.
- [ ] Escalonamentos aderentes exclusivamente aos gatilhos FR-TRO-08.

---

<a id="prd-fr-tro-metricas-sucesso"></a>

## 12. Metricas de sucesso

| Metrica | Sinal esperado |
|---|---|
| Diagnostico consistente | Queda de classificacao indevida como "erro de endpoint". |
| Qualidade de evidencia | Aumento de ocorrencias com FR-TRO-03 completo e redigido. |
| Tempo de triagem | Menor tempo entre incidente e decisao binaria final. |
| Governanca de escalonamento | Escalonamentos somente quando gatilho FR-TRO-08 estiver ativo. |

---

<a id="prd-fr-tro-riscos-mitigacao"></a>

## 13. Riscos e mitigacao

| Risco | Impacto | Mitigacao |
|---|---|---|
| Reabrir incidente como bug tecnico sem evidencia | Retrabalho e ruido entre equipes | Forcar FR-TRO-01/02/03 no runbook e no ticket. |
| Escalonamento prematuro sem gatilho | Custo de oportunidade e desviacao de roadmap | Aplicar gate FR-TRO-08 e decisao formal registrada. |
| Escalonamento tardio com recorrencia real | Perda comercial e desgaste operacional | Revisao por cluster com leitura obrigatoria de metricas. |
| Deriva documental entre fontes | Quebra de governanca e inconsistencias | Manter fonte canonica unica e links cruzados obrigatorios. |

---

## 14. Estrutura de epico e stories (proposta)

**Decisao de estrutura:** epico unico, pois o trabalho e uma melhoria brownfield coesa de governanca operacional com dois blocos sequenciais (execucao operacional + decisao de escalonamento), sem necessidade de multiplos epicos desconexos.

### Epic 1 — Resolucao governada do cluster `prefeitura_login_required_blocked`

**Epic Goal:** institucionalizar a tratativa operacional obrigatoria e o mecanismo de escalonamento condicional, preservando a politica nacional vigente e reduzindo retrabalho entre areas.

<a id="prd-fr-tro-story-11"></a>

#### Story 1.1 — Operacao/QA: protocolo canonico e evidencia minima

Como equipe de operacao e QA,  
quero aplicar um protocolo unico de triagem e evidencia para `prefeitura_login_required_blocked`,  
para encerrar cada ocorrencia com decisao binaria padronizada e rastreavel.

**Acceptance Criteria**
1. Classificacao `nao suportado no fluxo nacional` aplicada em ocorrencias validas.
2. Evidencia FR-TRO-03 registrada com redaction obrigatoria.
3. Causalidade `POST` falho -> `GET` consequente documentada.
4. Ticket interno e artefato `docs/qa/tro-...` vinculados por ocorrencia.

<a id="prd-fr-tro-story-12"></a>

#### Story 1.2 — Produto/Operacao: governanca de gatilhos FR-TRO-08

Como produto e operacao,  
quero um processo unico para decidir se mantemos politica vigente ou abrimos iniciativa nova,  
para escalar apenas quando houver base objetiva de impacto/estrategia.

**Acceptance Criteria**
1. Artefato canonico de governanca lista apenas os tres gatilhos FR-TRO-08.
2. Decisao formal por ocorrencia/cluster registrada com justificativa e aprovador.
3. Sem gatilho: manter politica vigente com update de rastreabilidade.
4. Com gatilho: abrir PRD dedicado e registrar link cruzado no artefato de governanca.

<a id="prd-fr-tro-story-13"></a>

#### Story 1.3 — Qualidade de governanca e operacao continua

Como lideranca de produto,  
quero metricas e revisao periodica do cluster TRO,  
para evitar deriva de processo e sustentar decisoes futuras.

**Acceptance Criteria**
1. Metricas de diagnostico, evidencia, tempo de triagem e escalonamento sao revisadas por cluster.
2. Riscos e mitigacoes permanecem atualizados no artefato canonico.
3. Mudancas de decisao ficam versionadas no change log do PRD e no artefato de governanca.

---

<a id="prd-fr-tro-rollout-operacao"></a>

## 15. Plano de rollout e operacao

1. Consolidar e validar o protocolo TRO no runbook.
2. Executar auditoria de amostra de ocorrencias recentes para confirmar aderencia aos ACs.
3. Formalizar decisao do ciclo atual (`manter politica vigente` ou `abrir PRD`) em ritual de produto/operacao.
4. Agendar revisao em nova recorrencia relevante para reavaliacao FR-TRO-08.

---

## 16. Proximos passos canonicos AIOX

- **@sm** — detalhar stories derivadas do Epic 1 com checklist DoR/DoD e file list.
- **@qa** — executar validacao por amostra da rastreabilidade FR-TRO-03 e decisao binaria.
- **@po** — registrar decisao formal do cluster atual e aprovar criterio de escalonamento.
- **@architect** — revisar impacto tecnico caso algum gatilho FR-TRO-08 ative iniciativa nova.

---

## 17. Change log

| Data | Versao | Descricao | Autor |
|---|---|---|---|
| 2026-04-13 | 1.0 | PRD completo criado a partir do brief de resolucao governada (`trilho A/B`) para `prefeitura_login_required_blocked`. | PM (Morgan) |
