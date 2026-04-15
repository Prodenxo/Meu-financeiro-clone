# PRD -- correção runtime do cadastro de empresa PlugNotas com contrato oficial e triagem municipal

**Versão:** 1.0  
**Data:** 2026-04-14  
**Tipo:** Brownfield -- Guia MEI / setup de emissão fiscal / cadastro de empresa (`POST /api/mei-notas/setup/emissao-fiscal/empresa`)  
**Fonte do briefing:** [`docs/brief/brief-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../brief/brief-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md)

**Referências externas (contrato):**

- [PlugNotas -- Empresa / addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany)
- [PlugNotas -- Consultar disponibilidade do município e metadados](https://docs.plugnotas.com.br/#operation/getCidadeById)
- [PlugNotas -- OpenAPI oficial (`api.json`)](https://docs.plugnotas.com.br/api.json)

---

## Relação com outros artefatos

| Artefato | Papel |
|---|---|
| [`PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](./PRD-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md) | Iniciativa `docs-only` que alinhou a camada documental ao contrato oficial. Este PRD cobre a correção de runtime que ficou explicitamente fora daquele escopo. |
| [`PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](./PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | Formaliza o cluster PLOGIN e as decisões condicionais sobre credenciais municipais. Este PRD reposiciona o problema como correção de runtime do cadastro da empresa. |
| [`PRD-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`](./PRD-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md) | Mapeia `addCompany` ao fluxo Guia MEI e confirma o BFF como fronteira correta. |
| [`docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | Descreve os pontos de extensão técnicos para `prefeitura.login` / `senha` e o papel do trilho B. |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Runbook canônico de triagem e de causalidade `POST` -> `PATCH` -> `GET`. |
| [`docs/stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md`](../stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md) | Backlog histórico do trilho de credenciais municipais com feature flag. |
| `frontend/src/utils/nfEmissionCompany.ts` | Builder do payload atual usado no fluxo de cadastro da empresa. |
| `backend/src/services/plugnotas/empresa.service.js` | Normalização final, fallback e chamada canônica ao PlugNotas. |
| `backend/src/services/plugnotas/prefeituraPortalCredentials.js` | Política atual de bloqueio de credenciais municipais no fluxo ativo. |

---

## 1. Resumo executivo

O problema atual do cadastro da empresa no PlugNotas não está na emissão de notas nem na arquitetura base do produto. A arquitetura principal já está correta:

- frontend chama o BFF;
- backend chama `POST /empresa`;
- o fallback `PATCH /empresa/:cnpj` já existe;
- o `GET` posterior serve apenas como verificação.

O problema está no **runtime do cadastro da empresa**:

1. o payload principal ainda depende de um shape legado com `nfse.nacional`;
2. o sistema não consulta `/nfse/cidades/{codigoIbge}` antes de decidir o caminho do cadastro;
3. o fluxo ativo bloqueia credenciais municipais de forma efetiva, mesmo quando o fornecedor as documenta no schema oficial para alguns municípios.

Este PRD define a seguinte decisão de produto:

1. **MVP obrigatório:** corrigir o contrato runtime do caminho nacional e adicionar triagem municipal antes do `POST /empresa`;
2. **fase condicional:** suporte a `prefeitura.login` / `senha` fica fora do MVP e só entra em backlog separado, atrás de decisão explícita e feature flag;
3. **fronteira arquitetural preservada:** o BFF continua sendo a única integração com o PlugNotas.

O objetivo do MVP é destravar o cadastro onde o município já suporta padrão nacional e deixar de tratar o resto como surpresa pós-erro textual.

---

## 2. Problema

Hoje existem três falhas cumulativas no fluxo de cadastro da empresa:

| Dimensão | Situação atual | Impacto |
|---|---|---|
| Contrato nacional | O runtime usa `nfse.nacional` como chave principal, enquanto o contrato oficial documenta `nfse.config.nfseNacional` e `nfse.config.consultaNfseNacional`. | Municípios compatíveis com o modo nacional podem falhar por payload desalinhado ao fornecedor. |
| Decisão por município | O runtime não consulta `/nfse/cidades/{codigoIbge}` antes do cadastro. | O sistema não sabe previamente se o município suporta padrão nacional ou exige autenticação municipal. |
| Política municipal | O fluxo atual bloqueia `prefeitura.login` / `senha` de forma efetiva. | Municípios que exigem autenticação municipal não conseguem concluir o cadastro da empresa pelo produto. |

Isso produz um resultado ruim para produto, suporte e engenharia:

- o cadastro da empresa falha antes de qualquer emissão;
- o erro é interpretado tarde demais, depois do `POST /empresa`;
- municípios com potencial de funcionar em modo nacional podem ficar bloqueados pelo shape legado;
- municípios que exigem credenciais ficam misturados com problemas de contrato ou ambiente.

---

## 3. Objetivos

1. Corrigir o caminho principal do cadastro da empresa para o contrato oficial nacional do PlugNotas.
2. Introduzir uma decisão de fluxo baseada em metadado oficial do município antes do `POST /empresa`.
3. Diferenciar claramente:
   - município compatível com padrão nacional,
   - município que exige autenticação municipal,
   - rejeição de payload ou ambiente.
4. Preservar a rota atual do BFF, o fallback `PATCH` e a causalidade operacional do fluxo.
5. Criar base de produto para uma eventual fase 2 de suporte municipal seguro, sem acoplá-la ao MVP.

---

## 4. Não objetivos

- trocar a arquitetura BFF por integração direta browser -> PlugNotas;
- redesenhar a Guia MEI inteira;
- persistir credenciais municipais por padrão;
- assumir que toda divergência municipal será resolvida no MVP;
- tratar a iniciativa documental de 2026-04-14 como se já tivesse corrigido o runtime.

---

## 5. Contexto atual

### 5.1 Achados oficiais que passam a governar o runtime

| Fonte oficial | Achado canônico |
|---|---|
| `addCompany` | O cadastro de empresa pode ter validações dinâmicas por documento e município, incluindo dados de acesso à prefeitura. |
| `cadastroEmpresa.nfse.config` | O contrato oficial publica `nfseNacional` e `consultaNfseNacional`. |
| `cadastroEmpresa.nfse.config.prefeitura` | O schema oficial inclui `login`, `senha`, `receitaBruta`, `lei` e `dataInicio`. |
| `/nfse/cidades/{codigoIbge}` | A resposta expõe `padraoNacional`, `login` e `senha`, diferenciando o ambiente. |

### 5.2 Estado atual do produto

| Camada | Estado atual |
|---|---|
| Frontend | `buildNfEmissionEmpresaPayload` monta `nfse.config` com `producao: true` e usa `nfse.nacional` como sinal principal do modo nacional. |
| Backend | `empresa.service.js` reforça o shape legado e aplica a política de bloqueio de `prefeitura.login` / `senha`. |
| Triagem | Não há consulta runtime de `/nfse/cidades/{codigoIbge}` antes do cadastro da empresa. |
| Política local | O fluxo nacional-first bloqueia o caminho municipal no percurso principal. |

### 5.3 Premissas

1. O contrato oficial do PlugNotas é a fonte primária para o cadastro da empresa.
2. O BFF continua sendo a única fronteira de integração.
3. A correção do runtime deve preservar o posicionamento nacional-first no MVP.
4. O suporte municipal com credenciais, se necessário, será entregue em fase separada.

---

## 6. Decisões de produto e governança

| ID | Decisão |
|---|---|
| **DP-RTCAD-01** | O **MVP** desta iniciativa cobre somente `contrato oficial + triagem municipal`, sem incluir suporte municipal completo com credenciais. |
| **DP-RTCAD-02** | O caminho principal do cadastro deve migrar de `nfse.nacional` para o contrato oficial baseado em `nfse.config.*`. |
| **DP-RTCAD-03** | A consulta `/nfse/cidades/{codigoIbge}` passa a ser etapa obrigatória da decisão do fluxo de cadastro da empresa. |
| **DP-RTCAD-04** | Municípios cujo metadado indicar exigência de `login` ou `senha` não entram no caminho nacional do MVP; ficam classificados como dependentes de fase municipal controlada. |
| **DP-RTCAD-05** | A fase de suporte municipal com credenciais continua como backlog separado, atrás de decisão explícita de produto, arquitetura e segurança. |
| **DP-RTCAD-06** | O BFF permanece como fronteira única e nenhuma credencial PlugNotas ou municipal é exposta diretamente ao browser fora do contrato atual do produto. |

---

## 7. Escopo

### 7.1 Dentro do escopo do MVP

- alinhar o payload nacional do cadastro da empresa ao contrato oficial do PlugNotas;
- explicitar e implementar uma regra única para `nfse.config.consultaNfseNacional`;
- consultar `/nfse/cidades/{codigoIbge}` antes da decisão do cadastro;
- usar `padraoNacional`, `login` e `senha` como insumo da decisão do fluxo;
- preservar a rota BFF atual e o fallback `POST` -> `PATCH`;
- devolver classificação estável ao frontend e à operação com base na decisão de fluxo.

### 7.2 Fase condicional posterior

- aceitar e trafegar `prefeitura.login` / `senha` de forma controlada;
- ativar UI específica e feature flag para municípios que exijam autenticação municipal;
- rever persistência, se algum dia for necessária.

### 7.3 Fora do escopo do MVP

- persistência de credenciais municipais;
- rollout geral de fluxo municipal-first;
- qualquer mudança de provedor ou nova arquitetura de integração;
- qualquer conclusão de “runtime já migrado” derivada apenas da iniciativa documental.

---

## 8. Requisitos funcionais

| ID | Requisito |
|---|---|
| **FR-RTCAD-01** | O caminho principal do cadastro da empresa deve usar o contrato oficial do modo nacional em `nfse.config.nfseNacional`, e não depender apenas de `nfse.nacional` como sinal primário de runtime. |
| **FR-RTCAD-02** | O produto deve definir e aplicar uma regra única para `nfse.config.consultaNfseNacional`, com o mesmo comportamento em frontend, backend e testes. |
| **FR-RTCAD-03** | Antes do `POST /empresa` e antes do caminho de fallback relevante, o sistema deve consultar `/nfse/cidades/{codigoIbge}` com base no município do cadastro. |
| **FR-RTCAD-04** | A decisão do fluxo deve considerar o ambiente alvo e os metadados `padraoNacional`, `login` e `senha` retornados pela consulta do município. |
| **FR-RTCAD-05** | Quando o município estiver compatível com padrão nacional no ambiente alvo e não exigir `login` / `senha`, o sistema deve seguir pelo caminho nacional corrigido e permitir o cadastro da empresa sem desvio municipal. |
| **FR-RTCAD-06** | Quando o município exigir `login` ou `senha`, o sistema deve classificar o caso como dependente de fluxo municipal antes ou em substituição a um `POST /empresa` cego baseado apenas no shape nacional. |
| **FR-RTCAD-07** | O backend deve continuar devolvendo metadados estáveis suficientes para o frontend e a operação distinguirem caminho nacional, ambiente, payload/contrato, exceção municipal e ausência de empresa após falha anterior. |
| **FR-RTCAD-08** | O fluxo deve preservar a causalidade `POST` / fallback `PATCH` / `GET`, de modo que um `GET` negativo posterior não apague a causa raiz do cadastro mal sucedido. |
| **FR-RTCAD-09** | Se a fase condicional de suporte municipal for aprovada, ela deve reutilizar a decisão de município já implementada no MVP e não duplicar lógica de triagem. |

---

## 9. Requisitos não funcionais

| ID | Requisito |
|---|---|
| **NFR-RTCAD-01** | Nenhuma credencial municipal real pode aparecer em logs, testes, tickets ou mensagens ao utilizador. |
| **NFR-RTCAD-02** | O browser continua sem chamar o PlugNotas diretamente; toda integração passa pelo BFF. |
| **NFR-RTCAD-03** | A triagem por município deve respeitar o ambiente alvo (`producao` ou `homologacao`) para evitar decisão baseada no ambiente errado. |
| **NFR-RTCAD-04** | O rollout do MVP não pode reabrir regressão do fallback `PATCH /empresa/:cnpj` nem do fluxo de retry parcial já existente. |
| **NFR-RTCAD-05** | Toda implementação derivada deve passar por `npm run lint`, `npm run typecheck` e `npm test`. |

---

## 10. Requisitos de compatibilidade brownfield

| ID | Requisito |
|---|---|
| **CR-RTCAD-01** | A rota pública do produto continua sendo `POST /api/mei-notas/setup/emissao-fiscal/empresa`; o PRD não cria nova rota funcional paralela para cadastro da empresa. |
| **CR-RTCAD-02** | O backend mantém `POST /empresa` como operação canônica de cadastro e `PATCH /empresa/:cnpj` como fallback já documentado. |
| **CR-RTCAD-03** | A iniciativa documental DOCPN continua válida e separada; este PRD não usa a atualização de docs como prova de migração já concluída no código. |
| **CR-RTCAD-04** | A fase de suporte municipal com credenciais não pode vazar para o MVP por configuração implícita; precisa de backlog, decisão e ativação explícitos. |

---

## 11. Critérios de aceite

- [ ] O caminho principal do cadastro usa o contrato oficial nacional no runtime, com regra explícita para `consultaNfseNacional`.
- [ ] O sistema consulta `/nfse/cidades/{codigoIbge}` antes da decisão do fluxo.
- [ ] Municípios com `padraoNacional` compatível e sem exigência de `login` / `senha` conseguem cadastrar a empresa sem ficar presos ao shape legado.
- [ ] Municípios que exigem autenticação municipal deixam de ser detectados apenas depois de um `400` textual do `POST /empresa`.
- [ ] O backend continua devolvendo classificação estável para frontend, QA e operação.
- [ ] O `GET` posterior deixa de ser o principal indicador de causa raiz quando o cadastro da empresa falha.
- [ ] O MVP não introduz persistência nem coleta geral de credenciais municipais.

---

## 12. Métricas de sucesso

| Métrica | Sinal esperado |
|---|---|
| Taxa de cadastro bem-sucedido em municípios compatíveis com padrão nacional | Aumento após correção do contrato runtime nacional |
| Diagnóstico prévio por município | Maior proporção de casos classificados antes do `POST /empresa` |
| Qualidade de triagem | Queda de tickets ambíguos entre `payload legado`, `município exige login` e `erro de ambiente` |
| Preparação para backlog futuro | Suporte municipal com credenciais passa a depender de decisão explícita, não de improviso em runtime |

---

## 13. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| `consultaNfseNacional` continuar sem regra clara | Divergência entre frontend, backend e testes | FR-RTCAD-02 como gate explícito do MVP |
| Metadado oficial do município divergir por ambiente ou timing | Decisão errada do fluxo | NFR-RTCAD-03 + QA por ambiente |
| Latência extra por consulta de município | Percepção de lentidão no cadastro | Implementar triagem de forma enxuta e medir impacto no fluxo |
| Fase 2 municipal vazar para o MVP | Escopo inflado e risco de segurança | DP-RTCAD-05 + CR-RTCAD-04 |
| Time interpretar o MVP como “suporte municipal completo” | Expectativa incorreta de produto | Escopo, não objetivos e epic separados neste PRD |

---

## 14. Estrutura de épico e histórias

**Decisão de estrutura:** dois épicos, com um MVP obrigatório e uma fase condicional separada.

### Epic 1 -- Correção runtime do cadastro da empresa (MVP)

**Epic Goal:** alinhar o runtime do cadastro da empresa ao contrato oficial nacional e adicionar triagem municipal antes do `POST /empresa`, preservando o BFF e o fallback existentes.

#### Story 1.1 -- Contrato runtime nacional

Como equipa de produto e engenharia,  
quero alinhar frontend, backend e testes ao contrato oficial nacional do PlugNotas,  
para que o cadastro da empresa não dependa do shape legado `nfse.nacional`.

**Acceptance Criteria**
1. O runtime usa `nfse.config.nfseNacional` como caminho principal do modo nacional.
2. Existe regra explícita para `nfse.config.consultaNfseNacional`.
3. Tests e builders do payload ficam coerentes entre frontend e backend.

#### Story 1.2 -- Preflight municipal

Como sistema de cadastro da empresa,  
quero consultar `/nfse/cidades/{codigoIbge}` antes do `POST /empresa`,  
para decidir com base no município real se o fluxo nacional é suficiente.

**Acceptance Criteria**
1. O sistema lê `padraoNacional`, `login` e `senha` no ambiente alvo.
2. O resultado do preflight participa da decisão do cadastro.
3. Municípios nacional-compatíveis seguem pelo caminho principal corrigido.

#### Story 1.3 -- Classificação de fluxo e causalidade

Como frontend, operação e QA,  
quero receber classificação estável do caminho de cadastro,  
para distinguir contrato, município, ambiente e causalidade `POST` -> `PATCH` -> `GET`.

**Acceptance Criteria**
1. O backend devolve metadados estáveis para a UI e operação.
2. O `GET` posterior não sobrescreve a causa raiz do cadastro.
3. O fluxo mantém retry/fallback coerentes.

#### Story 1.4 -- QA e validação por município

Como QA,  
quero uma matriz de validação por ambiente e município,  
para comprovar quais casos entram no caminho nacional e quais dependem de fase municipal.

**Acceptance Criteria**
1. A matriz cobre municípios com e sem `padraoNacional`.
2. A matriz cobre casos com `login` / `senha` requeridos.
3. Os gates do repositório passam após a implementação.

### Epic 2 -- Suporte municipal seguro com credenciais (condicional)

**Epic Goal:** suportar, de forma controlada, o cadastro da empresa em municípios que exigem autenticação municipal, sem quebrar a política nacional-first do produto.

#### Story 2.1 -- Decisão de produto e segurança

Como produto e arquitetura,  
quero aprovar explicitamente o suporte municipal com credenciais,  
para que a fase 2 tenha escopo, rollout e segurança definidos antes de código.

#### Story 2.2 -- BFF e feature flag municipal

Como backend,  
quero aceitar credenciais municipais apenas atrás de feature flag e validação explícita,  
para completar o cadastro da empresa em municípios que exigem autenticação.

#### Story 2.3 -- UI controlada para municípios elegíveis

Como frontend,  
quero expor a recolha de credenciais apenas quando o fluxo municipal estiver aprovado e habilitado,  
para evitar expandir o requisito municipal para todos os MEIs.

#### Story 2.4 -- QA, operação e rollout

Como operação e QA,  
quero validar rollout controlado por ambiente e município,  
para mitigar risco de segurança e regressão.

---

## 15. Plano de rollout

1. Entregar primeiro o Epic 1 em ambiente controlado.
2. Validar o cadastro de empresa em municípios:
   - compatíveis com padrão nacional,
   - incompatíveis por exigência de `login` / `senha`,
   - com comportamento diferente entre homologação e produção.
3. Só depois decidir se o Epic 2 é necessário para os municípios relevantes.
4. Caso o Epic 2 seja aprovado, ativá-lo por feature flag e rollout controlado.

---

## 16. Próximos passos canônicos

- **@sm** -- decompor o Epic 1 em histórias detalhadas de runtime, QA e operação.
- **@architect** -- definir a máquina de decisão do BFF para contrato oficial + preflight municipal.
- **@qa** -- preparar matriz de municípios e ambientes para validação do MVP.
- **@po** -- decidir explicitamente se a fase 2 municipal entra em roadmap após a validação do MVP.

---

## 17. Change log

| Data | Versão | Descrição | Autor |
|---|---|---|---|
| 2026-04-14 | 1.0 | PRD inicial criado a partir do brief de correção runtime do cadastro de empresa PlugNotas com contrato oficial e triagem municipal. | PM (Morgan) |
