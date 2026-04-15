# PRD -- recorrencia de `prefeitura_login_required_blocked` no municipio `5002704`

**Versao:** 1.2  
**Data:** 2026-04-15  
**Tipo:** Brownfield -- decisao de produto, descoberta dirigida e eventual correcao controlada no setup fiscal MEI  
**Fonte do briefing:** [`docs/brief/brief-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../brief/brief-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md)

**Referencias externas (contrato):**

- [PlugNotas -- Empresa / addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany)
- [PlugNotas -- Consultar disponibilidade do municipio e metadados](https://docs.plugnotas.com.br/#operation/getCidadeById)
- [PlugNotas -- OpenAPI oficial (`api.json`)](https://docs.plugnotas.com.br/api.json)

---

## Relacao com artefatos existentes

| Artefato | Papel |
|---|---|
| [`docs/prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](./PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) | PRD amplo do cluster RTCAD. Este documento nao o substitui; ele fecha uma recorrencia real e decide se o caso `5002704` pede excecao controlada ou backlog fase 2. |
| [`docs/prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](./PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md) | Define a classificacao operacional vigente como `nao suportado no fluxo nacional`. Este PRD avalia se a recorrencia real justifica sair do trilho apenas operacional. |
| [`docs/prd/PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md`](./PRD-resolucao-governada-prefeitura-login-required-blocked-2026-04-13.md) | Governa os gatilhos de escalonamento. Este PRD atua como desdobramento quando a recorrencia deixa de ser apenas ruido operacional. |
| [`docs/technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) | Formaliza a precedencia atual do preflight: `login=true` ou `senha=true` bloqueiam antes do `POST /empresa`. |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Runbook canonico de classificacao e causalidade. |
| [`docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`](../qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md) | Matriz QA que hoje audita o ramo `prefeitura_login_required_blocked` com fixture controlado, ainda sem linha propria para `5002704`. |
| `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js` | Motor de decisao atual do BFF. |
| `backend/src/services/plugnotas/plugnotas-cidades.service.js` | Encapsula o preflight por municipio. |
| `frontend/src/lib/fiscalUserError.ts` | Consome a classificacao estavel devolvida pelo backend. |

---

## 1. Resumo executivo

Ha uma recorrencia real do codigo `prefeitura_login_required_blocked` para o municipio `5002704` no ambiente `producao`.

Os metadados redigidos da ocorrencia mostram:

- `padraoNacionalEnabled = true`;
- `requiresLogin = true`;
- `requiresSenha = false`;
- `upstreamCallSkipped = true`.

Isto significa que:

1. o BFF bloqueou o caso **antes** do `POST /empresa`;
2. o bloqueio nao e um erro acidental de endpoint;
3. a recorrencia esta centrada na **precedencia** atual do motor de decisao;
4. o contrato oficial do PlugNotas, por sua vez, documenta coexistencia entre `nfse.config.nfseNacional` e campos dinamicos de `prefeitura`.

Este PRD define a seguinte decisao de produto:

1. **obrigatorio agora:** executar descoberta dirigida e fechar decisao explicita para `5002704`;
2. **condicional depois:** somente se a descoberta validar, implementar correcao **controlada** e **restrita**, sem inverter a precedencia global do runtime;
3. **fallback formal:** se a validacao mostrar que `5002704` realmente depende de auth municipal, manter a policy atual e abrir backlog fase 2 municipal em artefato separado.

---

## 2. Problema

Hoje o cluster RTCAD ja corrige o hot path do cadastro e classifica de forma estavel os cenarios municipais. Ainda assim, a recorrencia de `5002704` mostra um ponto em aberto:

| Dimensao | Situacao atual | Impacto |
|---|---|---|
| Precedencia do motor de decisao | `requiresLogin = true` ou `requiresSenha = true` vencem sempre, mesmo quando `padraoNacionalEnabled = true`. | Casos potencialmente hibridos sao bloqueados antes do `POST /empresa`. |
| Contrato oficial do fornecedor | `addCompany` e `api.json` documentam `nfse.config.nfseNacional` e campos de `prefeitura` no mesmo contrato. | O bloqueio atual e policy local do produto, nao proibicao formal do fornecedor. |
| Evidencia do caso real | O repositorio ainda nao tem linha dedicada para `5002704` em QA, runbook ou teste automatizado. | A recorrencia pode voltar como falso bug tecnico ou escalar sem base suficiente. |

Sem fechar essa lacuna, o time fica preso entre dois erros:

- manter uma policy potencialmente rigida demais sem aprender com a recorrencia;
- ou inverter a precedencia global cedo demais e abrir municipios que realmente exigem autenticacao municipal.

---

## 3. Objetivos

1. Fechar uma decisao explicita de produto para o caso `5002704`.
2. Produzir evidencia redigida e auditavel por ambiente para o preflight desse municipio.
3. Validar se o comportamento atual e:
   - policy correta a manter; ou
   - candidato real a correcao controlada.
4. Evitar uma inversao global da precedencia do motor de decisao sem prova suficiente.
5. Se houver mudanca, garantir que ela seja estreita, testavel e compatível com RTCAD/TRO vigentes.

---

## 4. Nao objetivos

- inverter globalmente a regra `login/senha` vs `padraoNacional`;
- abrir recolha geral de `prefeitura.login` / `senha` na UI atual;
- persistir credenciais municipais;
- redesenhar a jornada Guia MEI para municipal-first;
- substituir ou invalidar o PRD amplo RTCAD;
- tratar toda recorrencia futura como se devesse automaticamente seguir a mesma decisao de `5002704`.

---

## 5. Contexto e achados verificados

### 5.1 Achados do caso real

| Campo | Valor observado |
|---|---|
| Rota | `POST /api/mei-notas/setup/emissao-fiscal/empresa` |
| HTTP | `400 Bad Request` |
| Codigo | `prefeitura_login_required_blocked` |
| Municipio | `5002704` |
| Ambiente | `producao` |
| Preflight | `consultedMunicipio = true` |
| Metadado nacional | `padraoNacionalEnabled = true` |
| Auth municipal | `requiresLogin = true`, `requiresSenha = false` |
| Upstream final | `upstreamCallSkipped = true` |

### 5.2 Leitura do runtime atual

1. O motor de decisao do BFF bloqueia primeiro por `requiresLogin` / `requiresSenha`.
2. A arquitetura RTCAD e a matriz QA institucionalizaram essa precedencia como comportamento do MVP.
3. O frontend atual nao recolhe credenciais municipais.
4. O backend atual rejeita `prefeitura.login` / `senha` no percurso principal.

### 5.3 Leitura do contrato oficial

| Fonte | Achado | Implicacao |
|---|---|---|
| `api.json` -> `nfse.config.nfseNacional` | O modo nacional e parte formal do contrato. | O produto pode e deve operar com esse shape oficial. |
| `api.json` -> `nfse.config.prefeitura` | `login` e `senha` sao campos oficiais do schema. | O fornecedor admite cenarios dinamicos de prefeitura. |
| `/nfse/cidades/{codigoIbge}` | Retorna `padraoNacional`, `login` e `senha`. | O caso `5002704` precisa ser decidido por semantica de preflight, nao por intuicao. |

### 5.4 Conclusao de produto

A recorrencia `5002704` ja nao deve ser tratada apenas como incidente operacional repetido.

Ela passa a ser um caso de decisao de produto porque:

1. ha uma recorrencia real com municipio identificado;
2. a policy atual e claramente local ao produto;
3. existe risco tanto em nao mexer quanto em mexer de forma ampla;
4. o proximo passo correto e uma descoberta dirigida com gate formal de decisao.

---

## 6. Decisoes de produto e governanca

| ID | Decisao |
|---|---|
| **DP-REC500-01** | O caso `5002704` deve ser tratado como descoberta dirigida com decisao explicita de produto, nao apenas como repeticao de triagem operacional. |
| **DP-REC500-02** | Nenhuma inversao global da precedencia `login/senha` vs `padraoNacional` pode ocorrer sem validacao externa e QA dirigida. |
| **DP-REC500-03** | Se houver correcao tecnica, ela deve ser **controlada**, **restrita** e governada por municipio/ambiente ou regra equivalente, sem contaminar o comportamento geral do cluster RTCAD. |
| **DP-REC500-04** | Se a validacao mostrar que `5002704` realmente exige autenticacao municipal para o cadastro da empresa, o resultado nao sera bugfix no runtime atual; sera backlog de fase 2 municipal em artefato separado. |
| **DP-REC500-05** | O BFF permanece como fronteira unica com o PlugNotas; nenhuma credencial municipal e exposta diretamente ao browser fora de decisao posterior explicita. |

---

## 7. Escopo

### 7.1 Dentro do escopo obrigatorio

- capturar evidencia redigida de `GET /nfse/cidades/5002704` em `producao`;
- capturar evidencia comparavel em `homologacao`, quando possivel;
- obter leitura oficial do fornecedor ou evidencia equivalente sobre a semantica do caso hibrido;
- registrar decisao explicita: `correcao controlada` ou `fase 2 municipal`;
- alinhar PRD, QA e runbook ao resultado da decisao.

### 7.2 Dentro do escopo condicional

Somente se a decisao for por correcao controlada:

- ajustar o motor de decisao do BFF para o caso governado;
- adicionar testes automatizados especificos do ramo hibrido;
- atualizar matriz QA e runbook com `5002704`;
- validar rollout controlado.

### 7.3 Fora do escopo

- feature flag ampla de credenciais municipais para todos os municipios;
- persistencia de credenciais;
- rollout geral de fluxo municipal;
- alteracoes de rota publica do produto;
- invalidar a classificacao TRO para os demais casos do cluster.

---

## 8. Requisitos funcionais

| ID | Requisito |
|---|---|
| **FR-REC500-01** | O produto deve capturar e consolidar evidencia redigida do preflight `GET /nfse/cidades/5002704` em `producao`. |
| **FR-REC500-02** | Quando viavel, o produto deve capturar evidencia comparavel do mesmo municipio em `homologacao` para identificar divergencia por ambiente. |
| **FR-REC500-03** | O caso `5002704` deve terminar com decisao formal unica: `manter policy vigente`, `correcao controlada` ou `fase 2 municipal`. |
| **FR-REC500-04** | Se a decisao for por correcao controlada, o backend deve suportar o caso hibrido validado sem inverter globalmente a precedencia para todos os municipios. |
| **FR-REC500-05** | Qualquer correcao controlada deve preservar o comportamento atual dos ramos RTCAD equivalentes fora do escopo governado. |
| **FR-REC500-06** | O repositorio deve ganhar teste automatizado para o ramo `padraoNacionalEnabled = true` combinado com `requiresLogin = true` e/ou `requiresSenha = true`. |
| **FR-REC500-07** | A matriz QA RTCAD deve ganhar cobertura explicita do caso `5002704` e indicar se ele e excecao controlada ou continuidade de bloqueio. |
| **FR-REC500-08** | O runbook operacional deve refletir a decisao final para `5002704`, evitando que a recorrencia volte a ser tratada como bug de endpoint. |
| **FR-REC500-09** | Se a validacao rejeitar a correcao controlada, o resultado deve apontar explicitamente para backlog fase 2 municipal, com link cruzado para o artefato futuro. |

---

## 9. Requisitos nao funcionais

| ID | Requisito | Nota |
|---|---|---|
| **NFR-REC500-01** | Nenhuma credencial, token, certificado ou payload sensivel bruto pode aparecer em evidencias, testes, docs ou tickets. | Seguranca |
| **NFR-REC500-02** | Toda decisao deve ser auditavel por ambiente, municipio, data e artefato associado. | Rastreabilidade |
| **NFR-REC500-03** | A eventual correcao nao pode reabrir regressao no fallback `PATCH`, no `GET` consequente ou na taxonomia atual de `fiscalUserError`. | Integridade brownfield |
| **NFR-REC500-04** | O browser continua sem chamar o PlugNotas diretamente. | Fronteira BFF |
| **NFR-REC500-05** | `npm run lint`, `npm run typecheck` e `npm test` devem passar no recorte final da implementacao. | Quality gate |

---

## 10. Requisitos de compatibilidade brownfield

| ID | Requisito |
|---|---|
| **CR-REC500-01** | A rota publica do produto permanece `POST /api/mei-notas/setup/emissao-fiscal/empresa`. |
| **CR-REC500-02** | O `POST /empresa` continua operacao canonica de cadastro e o fallback `PATCH /empresa/:cnpj` permanece valido. |
| **CR-REC500-03** | O PRD amplo RTCAD continua sendo a referencia geral do cluster; este PRD trata apenas a recorrencia dirigida `5002704`. |
| **CR-REC500-04** | A classificacao operacional `prefeitura_login_required_blocked` continua valida para os demais casos ate que uma excecao controlada seja explicitamente implementada. |
| **CR-REC500-05** | Nenhuma UI geral de auth municipal pode aparecer no MVP desta iniciativa. |

---

## 11. Criterios de aceite

- [ ] Existe decisao formal explicita para o caso `5002704`.
- [ ] Ha evidencia redigida do preflight do municipio em `producao`.
- [ ] Quando viavel, ha evidencia comparavel em `homologacao`.
- [ ] Se houver correcao controlada, ela e restrita e nao equivale a inversao global da precedencia.
- [ ] O repositorio ganha cobertura automatizada do ramo hibrido validado.
- [ ] A matriz QA e o runbook ficam alinhados ao resultado final.
- [ ] Se a decisao for manter bloqueio ou fase 2 municipal, isso fica rastreado sem ambiguidade no PRD e nos artefatos relacionados.

---

## 12. Metricas de sucesso

| Metrica | Sinal esperado |
|---|---|
| Qualidade da decisao | `5002704` deixa de voltar como falso bug tecnico sem dono claro |
| Cobertura de evidencia | existe material redigido por ambiente e municipio para o caso |
| Seguranca da mudanca | nenhuma regressao global na taxonomia RTCAD/TRO |
| Clareza de roadmap | o time diferencia claramente `correcao controlada` de `fase 2 municipal` |

---

## 13. Riscos e mitigacao

| Risco | Impacto | Mitigacao |
|---|---|---|
| Inverter a precedencia global cedo demais | Municipios realmente dependentes de auth municipal podem seguir por caminho incorreto | DP-REC500-02 e gate explicito de QA |
| Nao aprender com a recorrencia | Retrabalho ciclico entre suporte, QA, produto e engenharia | Tornar a descoberta e decisao obrigatorias |
| Criar override sem governanca | Divergencia entre codigo, QA e runbook | DP-REC500-03 + atualizacao obrigatoria de artefatos |
| Confirmar que o caso e fase 2 e mesmo assim tentar remendo tatico | Risco de seguranca e de escopo inflado | DP-REC500-04 |

---

## 14. Estrutura de epico e historias

**Decisao de estrutura:** dois epicos, sendo o primeiro obrigatorio e o segundo condicional.

### Epic 1 -- Descoberta e decisao de produto para `5002704`

**Epic Goal:** produzir evidencia suficiente para decidir se `5002704` e excecao controlada no fluxo atual ou backlog fase 2 municipal.

#### Story 1.1 -- Evidencia dirigida por ambiente

Como QA/operacao,  
quero capturar evidencia redigida do preflight do municipio `5002704`,  
para comparar o comportamento entre `producao` e `homologacao` e fechar base factual do caso.

**Acceptance Criteria**
1. Evidencia redigida de `producao` consolidada.
2. Evidencia de `homologacao` capturada ou impossibilidade registrada.
3. Redaction mantida sem segredos.

#### Story 1.2 -- Validacao da semantica do caso hibrido

Como produto,  
quero validar a semantica oficial do caso `padraoNacional = true` combinado com `login`/`senha`,  
para decidir se `5002704` e bugfix controlado ou fase 2 municipal.

**Acceptance Criteria**
1. Existe posicao do fornecedor ou evidencia equivalente suficiente.
2. A decisao final do caso fica registrada.
3. O resultado aponta para um dos caminhos validos deste PRD.

#### Story 1.3 -- Alinhamento de QA e runbook

Como produto/QA,  
quero refletir a decisao final em QA e documentacao operacional,  
para impedir reabertura ambigua do mesmo caso.

**Acceptance Criteria**
1. Matriz QA RTCAD atualizada.
2. Runbook alinhado ao resultado.
3. Referencias cruzadas entre brief, PRD e QA consolidadas.

### Epic 2 -- Correcao controlada do runtime para `5002704` (condicional)

**Epic Goal:** ajustar o motor de decisao do BFF para o caso governado, sem abrir inversao global da precedencia.

#### Story 2.1 -- Regra controlada no motor de decisao

Como backend,  
quero suportar a excecao controlada aprovada para `5002704`,  
para permitir o comportamento correto sem contaminar os demais municipios.

#### Story 2.2 -- Testes e matriz de regressao

Como QA/engenharia,  
quero cobrir o ramo hibrido com testes e regressao dirigida,  
para proteger RTCAD-04, RTCAD-05 e a taxonomia vigente.

#### Story 2.3 -- Rollout controlado

Como produto/operacao,  
quero validar rollout controlado por ambiente,  
para introduzir a mudanca com baixo risco.

---

## 15. Plano de rollout

1. Concluir primeiro o Epic 1.
2. Nao iniciar qualquer mudanca de runtime antes da decisao formal da Story 1.2.
3. Se a decisao for `correcao controlada`, executar o Epic 2 com validacao dirigida.
4. Se a decisao for `fase 2 municipal`, encerrar este PRD como descoberta concluida e abrir artefato especifico do backlog seguinte.

---

## 16. Proximos passos canonicos AIOX

- **@sm** -- decompor o Epic 1 em historias detalhadas de descoberta e documentacao.
- **@qa** -- preparar evidencia por ambiente e propor linha dedicada na matriz RTCAD.
- **@architect** -- desenhar a alternativa tecnica segura apenas se a Story 1.2 aprovar correcao controlada.
- **@po** -- decidir se `5002704` segue como excecao controlada ou backlog fase 2 municipal.

---

## 17. Change log

| Data | Versao | Descricao | Autor |
|---|---|---|---|
| 2026-04-14 | 1.0 | PRD inicial criado a partir do brief de recorrencia `5002704`, com foco em descoberta dirigida, decisao de produto e eventual correcao controlada. | PM (Morgan) |
| 2026-04-15 | 1.1 | Decisao formal REC500 (Story 1.2): `manter policy vigente` para `5002704`; secao 18; evidencia base e posicao equivalente fornecedor documentadas. | PO + dev (diff canónico) |
| 2026-04-15 | 1.2 | Story 1.3: ponteiro em §18 *Implicacao* para matriz RTCAD (`RTCAD-REC500-01`) e runbook REC500. | dev (alinhamento QA/docs) |

---

## 18. Decisao formal REC500 — municipio 5002704

### Leitura consolidada da semantica do caso hibrido (AC-REC500-PD-01)

- **Evidencia factual base:** [`docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`](../qa/rec500-preflight-5002704-ambientes-2026-04-14.md) — em `producao`, preflight normalizado com `padraoNacionalEnabled = true`, `requiresLogin = true`, `requiresSenha = false` (mais rastreio primario via `consultarCidadePlugNotas` no artefato); comparacao `producao` vs `homologacao` **inconclusiva** por impedimento documentado em homologacao.
- **Semantica:** o cenario e **hibrido** no preflight (nacional habilitado e login municipal exigido pelo metadado PlugNotas). O motor RTCAD atual aplica a precedencia **login/senha municipal antes de** permitir seguir pelo trilho nacional no cadastro — o bloqueio `prefeitura_login_required_blocked` **antes** do `POST /empresa` e **coerente** com essa policy brownfield, nao um defeito de endpoint isolado.

### Posicao do fornecedor ou evidencia equivalente (AC-REC500-PD-01)

- **Evidencia equivalente (origem publica, rastreavel):** documentacao oficial PlugNotas — [OpenAPI `api.json`](https://docs.plugnotas.com.br/api.json), operacoes de municipio (`getCidadeById` / `GET /nfse/cidades/{codigoIbge}`) e contrato de empresa (`addCompany`), que admitem coexistencia de `nfse.config.nfseNacional` / `consultaNfseNacional` com campos de `prefeitura`, **sem** impor ao integrador a precedencia entre modo nacional e autenticacao municipal. **Resumo:** o contrato nao obriga o produto a inverter a precedencia local do motor; a escolha permanece de **policy** do Meu Financeiro, alinhada a **DP-REC500-02**.
- **Data do registo desta leitura:** 2026-04-15.

---

- **Data:** 2026-04-15
- **Responsavel (@po):** decisao registada no repositorio sob orientacao produto (diff canónico Story 1.2); execucao documental **@dev**.
- **Evidencia base:** `docs/qa/rec500-preflight-5002704-ambientes-2026-04-14.md`

### Resultado (um unico)

- [x] **manter policy vigente**
- [ ] correcao controlada (restrita a 5002704 e ambiente autorizado)
- [ ] fase 2 municipal (sem bugfix de runtime como substituto)

### Racional executivo

1. **Rastreabilidade por ambiente (NFR-REC500-02):** sem preflight redigido de **homologacao**, nao ha base suficiente para aprovar **correcao controlada** com o nivel de prova exigido por **DP-REC500-02** e **DP-REC500-03** (override governado).
2. **Escopo brownfield (AC-REC500-PD-03):** nenhuma excecao por municipio/ambiente e aprovada nesta data; **nao** se introduz inversao global da precedencia `login/senha` vs `padraoNacional`.
3. **Caminho Epic 2:** **nao** iniciado — ver **Implicacao** abaixo.

### Implicacao

- **Proximo passo documental:** [`docs/stories/story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md`](../stories/story-fr-rec500-p1-qa-docs-alinhamento-matriz-runbook-5002704-2026-04-14.md) — refletir **manter policy vigente** e estado de homologacao **inconclusivo** na matriz QA e no runbook (sem prometer excecao tecnica).
- **Proximo passo tecnico (Epic 2):** **nao** iniciar [`docs/stories/story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`](../stories/story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) enquanto a decisao for **manter policy vigente**. Reavaliacao futura exige novo ciclo de evidencia (incl. homologacao quando possivel) e decisao formal explicita.
- **Fase 2 municipal (DP-REC500-04):** **nao** selecionada como decisao desta historia; permanece **backlog/initiativa separada** se no futuro se concluir que o unico caminho sustentavel e credencial municipal na jornada — **sem** confundir com Epic 2 (AC-REC500-PD-05).
- **Matriz QA / runbook (pos-Story 1.3):** linha dedicada `RTCAD-REC500-01` em [`docs/qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`](../qa/qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md) e secção canónica em [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) (`#rec500-ibge-5002704-caso-recorrente`).
