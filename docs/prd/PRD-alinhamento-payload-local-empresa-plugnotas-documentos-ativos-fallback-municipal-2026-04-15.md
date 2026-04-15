# PRD -- alinhamento do payload local de empresa PlugNotas com documentos ativos e fallback municipal condicionado

**Versao:** 1.0  
**Data:** 2026-04-15  
**Tipo:** Brownfield -- Guia MEI / setup de emissao fiscal / cadastro de empresa (`POST /api/mei-notas/setup/emissao-fiscal/empresa`)  
**Fonte do briefing:** [`docs/brief/brief-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-2026-04-15.md`](../brief/brief-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-2026-04-15.md)

**Referencias externas (contrato):**

- [PlugNotas -- Empresa / addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany)
- [PlugNotas -- OpenAPI oficial (`api.json`)](https://docs.plugnotas.com.br/api.json)
- [PlugNotas -- colecao Postman / Empresa](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest#54bcc736-6cd3-4e96-bc51-cab153c2f976)

---

## Relacao com outros artefatos

| Artefato | Papel |
|---|---|
| [`docs/prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](./PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) | Define a base de produto para documentos ativos no cadastro da empresa. Este PRD fecha a lacuna de coerencia do payload local e adiciona o fallback municipal condicionado. |
| [`docs/prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](./PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) | Formaliza o cluster RTCAD, o uso do contrato oficial e a triagem municipal no BFF. Este PRD herda essa base e explicita o segundo passo municipal quando o caminho nacional falhar. |
| [`docs/prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](./PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md) | Artefato historico que recomendava bloqueio da excecao municipal. Este novo PRD substitui essa politica por `national-first + fallback municipal condicionado`, sem transformar o produto em municipal-first. |
| [`docs/stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md`](../stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md) | Backlog existente do trilho de credenciais municipais. Este PRD reaproveita esse backlog, mas redefine seu enquadramento como fallback guiado e nao como fluxo padrao. |
| [`docs/technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md) | Arquitetura historica de bloqueio puro. Deve ser revista em follow-up tecnico para refletir a nova decisao de produto deste PRD. |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Runbook canonico para triagem, causalidade e operacao do fluxo fiscal MEI. |
| `frontend/src/utils/nfEmissionCompany.ts` | Builder local do payload de empresa. Ja carrega o baseline de coerencia com `documentosAtivos`. |
| `frontend/src/pages/GuidesMei.tsx` | Tela principal do setup fiscal onde o fallback municipal devera ser revelado de forma condicional. |
| `backend/src/services/plugnotas/empresa.service.js` | Fronteira de negocio onde a classificacao e o retry municipal devem ser governados. |

---

## 1. Resumo executivo

O brief de 2026-04-15 consolidou dois eixos do mesmo problema:

1. o payload local do browser precisava espelhar corretamente as selecoes de `Documentos ativos`;
2. o produto precisava oferecer uma continuacao controlada quando o municipio ou o emissor nao aceitarem `nfseNacional=true`.

O primeiro eixo ja esta tratado como baseline do produto: o builder local agora reflete `nfse`, `nfe` e `nfce` conforme a selecao da UI. O segundo eixo passa a ser a decisao de produto deste PRD:

- a jornada continua `NFS-e Nacional` por padrao;
- o usuario nao entra em fluxo municipal por default;
- se a tentativa nacional falhar com classificacao compativel com exigencia municipal, a UI deve abrir o segundo passo para `login` e `senha` da prefeitura;
- o retry municipal deve ocorrer pelo mesmo BFF, com `nfse.config.nfseNacional=false`, `nfse.config.consultaNfseNacional=false` e `nfse.config.prefeitura.login/senha`.

Este PRD nao muda o posicionamento do produto para municipal-first. Ele define um fallback guiado, seguro e condicionado por erro ou classificacao de municipio.

---

## 2. Analise do projeto e contexto

### 2.1 Fonte de analise

- Analise no IDE, com base no brief de 2026-04-15 e nos PRDs, stories e artefatos tecnicos correlatos ja presentes em `docs/`.

### 2.2 Estado atual do projeto

| Camada | Estado atual |
|---|---|
| Frontend | `GuidesMei` envia o cadastro da empresa ao BFF. O builder local ja deriva `nfse`, `nfe` e `nfce` de `documentosAtivos`, evitando payload contraditorio no browser. |
| Backend | O BFF continua como fronteira unica com o PlugNotas, concentrando validacao, triagem, classificacao, fallback e redaction. |
| Runtime fiscal | O cluster RTCAD ja formalizou uso do contrato oficial e da triagem municipal no backend. |
| Produto | A politica anterior de bloqueio puro da excecao municipal tornou-se insuficiente para o objetivo agora declarado no brief: abrir o segundo passo municipal quando o caminho nacional falhar. |

### 2.3 Documentacao disponivel e relevante

- Brief de origem do alinhamento de payload e fallback municipal.
- PRD de documentos ativos no cadastro da empresa.
- PRD de correcao runtime e triagem municipal.
- PRD historico de bloqueio da excecao municipal.
- Story backlog `DP-PLOGIN-01` para credenciais de prefeitura.
- Arquitetura e runbook do fluxo fiscal MEI.

### 2.4 Definicao do escopo da melhoria

| Dimensao | Classificacao |
|---|---|
| Tipo de melhoria | Major feature modification + integration with existing systems |
| Impacto no brownfield | Significativo, porque altera UX, contrato interno do fluxo, classificacao de erro e runtime do BFF |
| Fronteira arquitetural | Preservada: browser continua chamando o BFF e o BFF continua sendo a unica fronteira com o PlugNotas |

### 2.5 Objetivos da melhoria

- Manter `NFS-e Nacional` como experiencia principal do setup fiscal MEI.
- Garantir coerencia total entre selecao de documentos ativos, payload local e contrato efetivo do cadastro.
- Abrir fallback municipal somente quando o caminho nacional falhar por incompatibilidade municipal.
- Permitir conclusao do cadastro da empresa via trilho municipal controlado, sem expor segredos fora do BFF.
- Preservar observabilidade, redaction, causalidade `POST -> PATCH -> GET` e qualidade brownfield.

### 2.6 Contexto de negocio

O erro `prefeitura_login_required_blocked` deixou de ser apenas um sinal operacional. O produto agora precisa tratar esse caso como uma bifurcacao de jornada: continua nacional-first, mas nao encerra a experiencia do usuario quando o municipio exigir autenticacao municipal.

Ao mesmo tempo, a simples existencia do contrato `prefeitura.login/senha` nao autoriza abrir um fluxo municipal generico para todos. O valor do produto continua em um percurso principal enxuto, com fallback somente quando houver evidencia suficiente de incompatibilidade do modo nacional.

---

## 3. Problema e oportunidade

| Dimensao | Problema atual | Oportunidade |
|---|---|---|
| Coerencia de payload | Historicamente a UI dizia uma coisa e o payload local dizia outra. | Baseline ja corrigido no builder; o PRD consolida isso como requisito permanente. |
| Continuidade da jornada | O caso municipal podia encerrar o fluxo com `400`, sem segundo passo util para o usuario. | Abrir fallback municipal contextualizado, no mesmo percurso, apos classificacao compativel. |
| Politica de produto | O repositorio tem artefatos que bloqueavam a excecao municipal e outros que ja sugeriam triagem mais rica. | Unificar a politica em `national-first + fallback condicionado`. |
| Seguranca e governanca | Credenciais municipais sao sensiveis e nao podem vazar para logs, docs ou UI fora de contexto. | Manter o BFF como fronteira unica, com rollout controlado, redaction e criterio explicito de abertura do fallback. |

---

## 4. Objetivos e nao objetivos

### 4.1 Objetivos

1. Preservar `NFS-e Nacional` como fluxo principal do produto.
2. Tornar a coerencia entre UI e payload local um contrato permanente.
3. Oferecer UI de `login` e `senha` da prefeitura apenas quando o caso for classificado como incompatibilidade municipal do trilho nacional.
4. Permitir retry municipal governado pelo BFF com `nfseNacional=false`.
5. Reaproveitar o backlog `DP-PLOGIN-01` como trilho condicionado e nao como requisito default.
6. Manter gates de seguranca, observabilidade, runbook e QA alinhados ao brownfield.

### 4.2 Nao objetivos

- transformar o produto em municipal-first;
- expor login/senha de prefeitura por padrao na tela;
- permitir browser -> PlugNotas direto;
- persistir credenciais municipais por padrao sem decisao adicional de seguranca e dados;
- misturar, no mesmo payload, sinais ambiguos de trilho nacional e trilho municipal;
- prometer suporte universal e automatico para todos os municipios.

---

## 5. Decisoes de produto e governanca

| ID | Decisao |
|---|---|
| **DP-ALNFB-01** | O fluxo de cadastro da empresa permanece `national-first`. A tentativa inicial continua com `nfse.config.nfseNacional=true` quando `NFS-e` estiver ativa. |
| **DP-ALNFB-02** | `nfse`, `nfe` e `nfce` devem refletir exatamente a selecao de `documentosAtivos` no browser e no payload tratado pelo BFF. |
| **DP-ALNFB-03** | A abertura dos campos de `login` e `senha` da prefeitura e permitida apenas apos erro ou classificacao compativel com exigencia municipal. |
| **DP-ALNFB-04** | O retry municipal deve usar `nfse.config.nfseNacional=false` e `nfse.config.consultaNfseNacional=false`, preservando `documentosAtivos` e adicionando `nfse.config.prefeitura.login/senha`. |
| **DP-ALNFB-05** | O BFF continua como fronteira unica para validacao, redaction, classificacao, retry e montagem final do payload PlugNotas. |
| **DP-ALNFB-06** | O caminho equivalente a `DP-PLOGIN-01` fica aprovado somente como fallback guiado e condicionado, nao como politica global do produto. |
| **DP-ALNFB-07** | O produto deve continuar devolvendo uma classificacao estavel quando o fallback municipal nao puder ser aberto, estiver desativado ou nao for aplicavel. |
| **DP-ALNFB-08** | O rollout do fallback municipal deve ser controlado por governanca explicita de produto e arquitetura, preferencialmente com mecanismo de ativacao progressiva ja rastreavel no brownfield. |

---

## 6. Requisitos

Estas exigencias sao derivadas do estado atual do sistema e do briefing de 2026-04-15.

### 6.1 Requisitos funcionais

| ID | Requisito |
|---|---|
| **FR-ALNFB-01** | O payload local do browser deve manter `nfse`, `nfe` e `nfce` coerentes com os checkboxes de `Documentos ativos`. |
| **FR-ALNFB-02** | `nfse.config.nfseNacional` e `nfse.config.consultaNfseNacional` so podem sair `true` quando `NFS-e` estiver ativa e o fluxo estiver no trilho nacional. |
| **FR-ALNFB-03** | A tentativa inicial de cadastro da empresa deve continuar usando a rota atual `POST /api/mei-notas/setup/emissao-fiscal/empresa` e o BFF como unica fronteira com o PlugNotas. |
| **FR-ALNFB-04** | O BFF deve conseguir classificar o caso como compativel com fallback municipal a partir de preflight municipal, resposta do fornecedor ou codigo de erro estavel equivalente a exigencia de autenticacao municipal. |
| **FR-ALNFB-05** | Quando a classificacao indicar incompatibilidade do trilho nacional e `NFS-e` estiver ativa, a UI deve abrir os campos de `login` e `senha` da prefeitura no mesmo fluxo do setup fiscal. |
| **FR-ALNFB-06** | O retry municipal deve reenviar o cadastro da empresa com `nfse.config.nfseNacional=false`, `nfse.config.consultaNfseNacional=false` e `nfse.config.prefeitura.login/senha`, preservando os blocos de documentos ativos selecionados. |
| **FR-ALNFB-07** | O backend deve validar os campos municipais com regras coerentes de presenca, trim e paridade `login+senha`, sem aceitar strings vazias ou payload ambiguo. |
| **FR-ALNFB-08** | O frontend deve distinguir visualmente o primeiro passo nacional do segundo passo municipal, deixando claro por que o fallback foi aberto. |
| **FR-ALNFB-09** | Se o fallback municipal nao estiver disponivel por governanca ou configuracao, o sistema deve devolver classificacao estavel e copy compreensivel, sem insinuar erro de endpoint. |
| **FR-ALNFB-10** | O fluxo deve preservar a causalidade `POST`, eventual `PATCH` e `GET` posterior, sem deixar que a consulta negativa esconda a causa raiz do cadastro falho. |
| **FR-ALNFB-11** | O runbook e a matriz de QA devem distinguir, no minimo, quatro situacoes: nacional puro, nacional com erro de contrato/dados, municipio incompativel com nacional e retry municipal concluido. |

### 6.2 Requisitos nao funcionais

| ID | Requisito |
|---|---|
| **NFR-ALNFB-01** | Nenhuma credencial municipal real pode aparecer em logs, traces, fixtures, docs, tickets ou mensagens ao usuario. |
| **NFR-ALNFB-02** | O browser nao chama o PlugNotas diretamente em nenhuma etapa do fluxo. |
| **NFR-ALNFB-03** | A revelacao dos campos municipais deve seguir os padroes de acessibilidade e consistencia visual ja usados em `GuidesMei`. |
| **NFR-ALNFB-04** | O retry municipal nao pode quebrar o baseline de quem continua usando somente `NFS-e Nacional` em municipios compativeis. |
| **NFR-ALNFB-05** | A classificacao do municipio e o retry precisam respeitar o ambiente alvo (`producao` ou `homologacao`). |
| **NFR-ALNFB-06** | Toda implementacao derivada deve passar por `npm run lint`, `npm run typecheck` e `npm test`. |

### 6.3 Requisitos de compatibilidade brownfield

| ID | Requisito |
|---|---|
| **CR-ALNFB-01** | A rota publica do produto permanece `POST /api/mei-notas/setup/emissao-fiscal/empresa`. |
| **CR-ALNFB-02** | O BFF continua orquestrando `POST /empresa` e o fallback `PATCH /empresa/:cnpj` conforme a politica existente, sem nova rota paralela para cadastro da empresa. |
| **CR-ALNFB-03** | Usuarios e municipios que funcionam no trilho nacional nao devem passar por aumento obrigatorio de friccao nem por exibicao padrao de credenciais municipais. |
| **CR-ALNFB-04** | O baseline ja entregue de coerencia entre `documentosAtivos` e payload local nao pode regredir na implementacao do fallback municipal. |
| **CR-ALNFB-05** | O produto nao deve aceitar payloads que combinem `nfseNacional=true` com credenciais municipais no retry de forma ambigua. |

---

## 7. Objetivos de UI

### 7.1 Integracao com a UI existente

O fallback municipal deve se encaixar no fluxo atual de `GuidesMei`, sem criar uma jornada paralela nem esconder o passo nacional. A tela continua partindo dos mesmos campos de cadastro e dos mesmos `Documentos ativos`, adicionando um segundo estado de interface somente quando o backend indicar a necessidade.

### 7.2 Telas e vistas alteradas

- Setup fiscal / cadastro da empresa em `GuidesMei`
- Mapeamento de hints e mensagens de erro para o fluxo de empresa
- Eventual area de confirmacao/retry do cadastro apos classificacao municipal

### 7.3 Requisitos de consistencia da UI

- os campos municipais nao podem aparecer por padrao;
- a copy deve explicar que o municipio nao aceitou o modo nacional naquela tentativa;
- `login` e `senha` precisam ser apresentados como etapa excepcional e contextual;
- o usuario deve conseguir entender se esta na primeira tentativa nacional ou no retry municipal;
- estados de loading, erro e sucesso nao podem misturar as duas etapas de forma opaca.

---

## 8. Restricoes tecnicas e abordagem de integracao

### 8.1 Stack existente relevante

**Frontend:** React/Vite/TypeScript, testes no workspace `frontend`  
**Backend:** Node.js/JavaScript com BFF para o fluxo fiscal  
**Infraestrutura:** integracao existente com PlugNotas, sem chamada direta do browser ao fornecedor  
**Dependencias externas:** contrato oficial `addCompany`, preflight municipal e colecao Postman do PlugNotas

### 8.2 Abordagem de integracao

**API Integration Strategy:** manter a rota publica existente, ampliar a classificacao do BFF e permitir o retry municipal pela mesma fronteira.  
**Frontend Integration Strategy:** expandir `GuidesMei` e o builder de payload para suportar o segundo passo municipal sem reabrir contradicao no shape local.  
**Testing Integration Strategy:** cobrir builder, UI condicional, classificacao BFF, retry municipal, redaction e nao regressao do caminho nacional.  
**Operations Integration Strategy:** atualizar runbook, hints e matriz QA para incluir o fallback municipal como estado oficial do produto.

### 8.3 Organizacao de codigo e padroes

**File Structure Approach:** preservar a divisao atual entre `frontend/src/pages`, `frontend/src/utils` e `backend/src/services/plugnotas`.  
**Naming Conventions:** reutilizar nomenclatura do contrato oficial (`nfseNacional`, `consultaNfseNacional`, `prefeitura.login`, `prefeitura.senha`) apenas onde o contrato exigir.  
**Documentation Standards:** todo artefato derivado deve referenciar este PRD, o brief de origem e o backlog `DP-PLOGIN-01`.  
**Security Standards:** redaction obrigatoria de campos sensiveis e fixtures sempre ficticias.

### 8.4 Riscos e mitigacao

| Risco | Impacto | Mitigacao |
|---|---|---|
| Abertura precoce do fluxo municipal para casos nao compativeis | Escopo inflado e regressao de UX | DP-ALNFB-03, FR-ALNFB-04 e rollout controlado |
| Vazamento de `login`/`senha` em logs ou testes | Alto risco de seguranca | NFR-ALNFB-01, policy de redaction e QA dirigido |
| Regressao do caminho nacional | Perda de confianca e tickets | CR-ALNFB-03, CR-ALNFB-04 e testes dedicados |
| Ambiguidade entre preflight, erro upstream e retry | Diagnostico ruim | FR-ALNFB-04, FR-ALNFB-08, FR-ALNFB-10 e runbook atualizado |
| Divergencia por ambiente | Comportamento inconsistente | NFR-ALNFB-05 e matriz QA por ambiente |

---

## 9. Estrutura de epico e stories

**Decisao de estrutura:** um unico epic brownfield com quatro stories sequenciais.  
**Racional:** a entrega altera um unico fluxo de negocio, com dependencias claras entre contrato do BFF, UX condicional, retry municipal e readiness operacional.

## Epic 1: Cadastro de empresa PlugNotas com fallback municipal condicionado

**Epic Goal:** permitir que o cadastro da empresa continue `national-first`, mas ofereca um retry municipal seguro e contextual quando o municipio nao aceitar `nfseNacional=true`, preservando coerencia de payload, seguranca e comportamento brownfield.

**Integration Requirements:** manter a rota publica atual, preservar `documentosAtivos`, nao reabrir contradicoes de payload local e manter o BFF como unica fronteira com o PlugNotas.

### Story 1.1 Contrato de classificacao e decisao de fallback

Como time de produto e engenharia,  
quero uma classificacao estavel do BFF para os cenarios que exigem fallback municipal,  
para que a UI so abra o segundo passo excepcional quando o sistema tiver evidencia suficiente.

#### Acceptance Criteria

1. O backend diferencia explicitamente nacional puro, erro de contrato/dados e caso compativel com fallback municipal.
2. A classificacao pode ser acionada por preflight municipal, resposta do fornecedor ou codigo de erro estavel equivalente.
3. O contrato de resposta para a UI deixa claro quando o segundo passo municipal esta disponivel.

#### Integration Verification

1. O fluxo atual de cadastro nacional continua funcional em municipios compativeis.
2. A classificacao nao quebra o fallback `PATCH /empresa/:cnpj`.
3. O custo operacional da triagem continua coerente com o runtime existente.

### Story 1.2 UI condicional de credenciais municipais

Como MEI bloqueado por exigencia municipal,  
quero que a tela de setup abra `login` e `senha` da prefeitura apenas quando necessario,  
para que eu consiga continuar o cadastro sem entrar em um fluxo municipal por padrao.

#### Acceptance Criteria

1. `login` e `senha` da prefeitura so aparecem apos classificacao compativel.
2. A UI explica por que o trilho nacional nao foi aceito naquela tentativa.
3. O usuario consegue reenviar o cadastro no segundo passo sem perder a selecao de `Documentos ativos`.

#### Integration Verification

1. A tela `GuidesMei` continua consistente para quem usa apenas o caminho nacional.
2. Os novos campos seguem o padrao visual e de acessibilidade ja usado na pagina.
3. O mapeamento de mensagens nao reintroduz narrativa de endpoint errado.

### Story 1.3 Retry municipal seguro pelo BFF

Como responsavel pelo servico de backend,  
quero que o BFF aceite o retry municipal guiado e monte o payload correto para o PlugNotas,  
para que a empresa possa ser cadastrada com `nfseNacional=false` quando o municipio exigir autenticacao municipal.

#### Acceptance Criteria

1. O retry municipal envia `nfse.config.nfseNacional=false` e `nfse.config.consultaNfseNacional=false`.
2. O payload inclui `nfse.config.prefeitura.login` e `nfse.config.prefeitura.senha` somente no retry municipal.
3. Validacao, redaction e logs cobrem o novo caminho sem vazamento de segredos.

#### Integration Verification

1. O shape final preserva `documentosAtivos` e os blocos `nfse/nfe/nfce`.
2. O backend continua respeitando a causalidade `POST -> PATCH -> GET`.
3. O caminho nacional existente nao sofre regressao.

### Story 1.4 Operacao, QA e rollout governado

Como time de operacao e QA,  
quero que o novo caminho de fallback esteja documentado, testavel e sob rollout governado,  
para que o brownfield evolua sem ambiguidade nem ativacao insegura.

#### Acceptance Criteria

1. O runbook distingue nacional puro, municipio incompativel, fallback municipal habilitado e fallback municipal concluido.
2. A matriz QA cobre ao menos um caso feliz nacional e um caso de retry municipal.
3. O mecanismo de ativacao do fallback fica documentado com owner e criterio de promocao.

#### Integration Verification

1. `npm run lint`, `npm run typecheck` e `npm test` passam no recorte final.
2. A operacao consegue diagnosticar o caso sem acessar segredos reais.
3. O rollout nao muda silenciosamente o comportamento de municipios ja estaveis no caminho nacional.

---

## 10. Metricas de sucesso

| Metrica | Sinal esperado |
|---|---|
| Taxa de conclusao do cadastro em municipios antes bloqueados por `nfseNacional` | Crescimento apos disponibilizacao do fallback municipal |
| Coerencia de payload inspecionado no browser | Ausencia de contradicao entre UI e shape local |
| Qualidade de triagem | Queda de casos ambigios entre `erro de contrato`, `municipio exige login` e `endpoint errado` |
| Seguranca operacional | Zero vazamento de credenciais municipais em logs, testes e docs |
| Estabilidade do caminho nacional | Nenhuma regressao critica em municipios compativeis com `NFS-e Nacional` |

---

## 11. Criterios de aceite do PRD

1. O documento declara explicitamente que `NFS-e Nacional` continua sendo o fluxo principal do produto.
2. O documento transforma o fallback municipal em opcao condicionada e nao em requisito padrao.
3. O documento fixa o retry municipal com `nfseNacional=false` e `prefeitura.login/senha` via BFF.
4. O documento preserva coerencia entre `documentosAtivos`, payload local e payload final do cadastro.
5. O documento fornece base suficiente para derivacao de arquitetura atualizada, stories executaveis, QA matrix e rollout controlado.

---

## 12. Desdobramentos esperados

| Disciplina | Entrega esperada |
|---|---|
| `@architect` | Atualizar a arquitetura tecnica para substituir o bloqueio puro por fallback municipal condicionado, preservando o BFF como fronteira unica. |
| `@sm` | Derivar stories brownfield a partir do Epic 1, com checklist, file list e sequenciamento de baixo risco. |
| `@qa` | Atualizar matriz QA, criterios de evidencias redigidas e regressao do caminho nacional. |
| `@ux-design-expert` | Refinar a UX do segundo passo municipal, copy contextual e estados de loading/erro/sucesso. |
| `@dev` | Implementar classificacao BFF, UI condicional, retry municipal e testes alinhados aos FR/NFR/CR deste PRD. |

---

## 13. Change log

| Change | Date | Version | Description | Author |
|---|---|---|---|---|
| Criacao inicial do PRD | 2026-04-15 | 1.0 | Formaliza o alinhamento entre payload local, documentos ativos e fallback municipal condicionado com `nfseNacional=false` no retry. | `@pm` |
