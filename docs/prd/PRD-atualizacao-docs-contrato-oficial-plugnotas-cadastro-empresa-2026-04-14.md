# PRD -- atualizacao das docs canonicas do cadastro de empresa PlugNotas para o contrato oficial

**Versao:** 1.0  
**Data:** 2026-04-14  
**Tipo:** Brownfield -- governanca documental, contrato de integracao e operacao NFS-e  
**Fonte do briefing:** [`docs/brief/brief-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](../brief/brief-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md)

**Referencias externas (contrato):**

- [PlugNotas -- Empresa / addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany)
- [PlugNotas -- Consultar disponibilidade do municipio e metadados](https://docs.plugnotas.com.br/#operation/getCidadeById)
- [PlugNotas -- OpenAPI oficial (`api.json`)](https://docs.plugnotas.com.br/api.json)

---

## Relacao com artefatos existentes

| Artefato | Papel |
|---|---|
| [`docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`](../adr/ADR-plugnotas-nfse-nacional-empresa-spike.md) | Artefato historico que hoje documenta a hipotese adotada de `nfse.nacional`; precisa ser reclassificado perante o contrato oficial atual. |
| [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md) | Documento de politica local do produto para payload NFS-e e bloqueio de credenciais municipais. |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Fonte canonica do runbook operacional e de triagem; principal alvo da atualizacao P0. |
| [`docs/architecture.md`](../architecture.md) | Visao consolidada de arquitetura; hoje ainda aponta `nfse.nacional` como referencia canonica. |
| [`docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`](../brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md) | Brief ativo de mapeamento addCompany; precisa refletir o schema oficial atual. |
| [`docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](./PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | PRD ativo para o erro de `prefeitura.login`; precisa distinguir contrato do fornecedor da politica local do produto. |
| [`docs/specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | Spec UX ativa para o mesmo cluster; precisa ser alinhada ao contrato oficial e ao uso de `/nfse/cidades/{codigoIbge}`. |
| [`docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | Arquitetura tecnica ativa para PLOGIN; precisa registrar a divergencia entre shape legado e schema oficial. |

---

## 1. Resumo executivo

O repositorio hoje possui uma divergencia documental relevante no cadastro de empresa PlugNotas:

- a documentacao oficial atual publica o modo nacional em `nfse.config.nfseNacional` e `nfse.config.consultaNfseNacional`;
- o produto e varias docs internas ainda tratam `nfse.nacional` como referencia principal;
- a rota oficial `/nfse/cidades/{codigoIbge}` expoe `login`, `senha` e `padraoNacional`, mas essa leitura ainda nao esta incorporada de forma canonica no runbook e nos PRDs ativos.

Este PRD define uma iniciativa brownfield exclusivamente documental para corrigir a fonte de verdade do produto, da operacao e da arquitetura, sem prometer migracao imediata de runtime.

O objetivo central e alinhar as docs vivas do Meu Financeiro ao contrato oficial do fornecedor, deixando explicitas tres camadas distintas:

1. **contrato oficial do fornecedor**;
2. **politica atual do produto**;
3. **estado atual da implementacao local**.

---

## 2. Problema

As docs atuais misturam contrato externo, decisao local de produto e hipotese historica de implementacao. Isso gera tres falhas recorrentes:

| Problema | Impacto |
|---|---|
| `nfse.nacional` ainda aparece como se fosse contrato oficial | Leitura errada do schema PlugNotas e troubleshooting enviesado |
| `prefeitura.login` e `prefeitura.senha` ainda podem ser lidos como anomalia nao documentada | Diagnostico incorreto do erro real e do limite do fluxo atual |
| `/nfse/cidades/{codigoIbge}` nao esta firmada como etapa canonica de triagem | Operacao e produto pulam validacoes importantes de `padraoNacional`, `login` e `senha` |

Sem um PRD proprio para a atualizacao documental, o repositorio continua com multiplas verdades concorrentes e aumenta o risco de backlog, QA e suporte derivarem escopo errado.

---

## 3. Objetivos

1. Tornar o contrato oficial do PlugNotas a referencia primaria das docs de cadastro de empresa.
2. Remover das docs canonicas qualquer afirmacao de que `nfse.nacional` e contrato oficial sem qualificador historico.
3. Incorporar a consulta `/nfse/cidades/{codigoIbge}` na triagem canonica de NFS-e e `prefeitura_login_required_blocked`.
4. Separar de forma rastreavel:
   - contrato do fornecedor,
   - politica atual do produto,
   - estado atual da implementacao local.
5. Preservar historico dos artefatos antigos sem reescrever o passado nem quebrar a rastreabilidade.
6. Deixar a migracao eventual de codigo como backlog separado, e nao como obrigacao desta iniciativa documental.

---

<a id="prd-docpn-escopo"></a>
## 4. Escopo

### 4.1 Dentro do escopo

- Atualizacao das docs canonicas P0 listadas no briefing:
  - `docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`
  - `docs/architecture.md`
  - `docs/operacao-mei-nfse.md`
  - `docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`
  - `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`
- Atualizacao dos artefatos ativos de produto, UX e arquitetura que ainda governam o cluster PLOGIN/addCompany.
- Definicao de regras para tratamento de artefatos historicos que ainda citam a hipotese antiga.
- Formalizacao de criterios de aceite e governanca para que o alinhamento documental seja auditavel.

### 4.2 Fora do escopo

- Migrar imediatamente o runtime de `nfse.nacional` para `nfse.config.nfseNacional`.
- Liberar UI ou backend para credenciais municipais.
- Alterar a classificacao atual `prefeitura_login_required_blocked`.
- Reabrir todas as stories fechadas do historico PlugNotas.
- Redefinir a estrategia nacional-first do produto nesta rodada.

---

## 5. Contexto atual

<a id="prd-docpn-achados-canonicos"></a>
### 5.1 Achados oficiais que passam a ser canonicos

| Fonte oficial | Achado canonico |
|---|---|
| `POST /empresa` / `cadastroEmpresa` | `nfse` documentado com `ativo`, `tipoContrato` e `config` |
| `nfse.config` | propriedades oficiais incluem `nfseNacional` e `consultaNfseNacional` |
| `nfse.config.prefeitura` | schema oficial inclui `login`, `senha`, `receitaBruta`, `lei` e `dataInicio` |
| `/nfse/cidades/{codigoIbge}` | resposta inclui `login`, `senha` e `padraoNacional` por ambiente |

<a id="prd-docpn-estado-produto"></a>
### 5.2 Estado atual do produto

| Camada | Estado atual |
|---|---|
| Implementacao local | codigo e testes ainda usam um shape legado com `nfse.nacional` |
| Politica local de produto | fluxo nacional-first bloqueia credenciais municipais no percurso atual |
| Documentacao interna | parte das docs ainda apresenta a hipotese antiga sem a devida qualificacao historica |

### 5.3 Premissas

1. A OpenAPI oficial do PlugNotas e a referencia primaria desta iniciativa.
2. Esta iniciativa corrige documentacao e governanca antes de qualquer mudanca de implementacao.
3. O produto atual continua com politica nacional-first e com bloqueio de credenciais municipais, salvo novo PRD.

---

## 6. Decisoes de produto e governanca

| ID | Decisao |
|---|---|
| **DP-DOCPN-01** | As docs vivas de cadastro de empresa PlugNotas passam a usar o contrato oficial como referencia primaria. |
| **DP-DOCPN-02** | Toda doc ativa do cluster deve distinguir explicitamente contrato do fornecedor, politica do produto e estado atual da implementacao. |
| **DP-DOCPN-03** | Esta iniciativa nao implica migracao imediata de codigo; qualquer mudanca de runtime fica em backlog separado. |
| **DP-DOCPN-04** | Artefatos historicos com a hipotese antiga devem ser preservados com nota de contexto ou marcador de historico, sem apagar o registro do que foi decidido antes. |

---

<a id="prd-docpn-requisitos"></a>
## 7. Requisitos funcionais

| ID | Requisito |
|---|---|
| **FR-DOCPN-01** | Nenhuma doc canonica viva deve afirmar `nfse.nacional` como contrato oficial do PlugNotas sem qualificador de historico ou divergencia local. |
| **FR-DOCPN-02** | Pelo menos um ADR e um documento operacional devem registrar explicitamente que o contrato oficial atual documenta `nfse.config.nfseNacional` e `nfse.config.consultaNfseNacional`. |
| **FR-DOCPN-03** | O runbook canonico deve incorporar `/nfse/cidades/{codigoIbge}` como etapa de triagem, incluindo leitura de `padraoNacional`, `login` e `senha`. |
| **FR-DOCPN-04** | As docs ativas do cluster PLOGIN/addCompany devem explicar que o schema oficial de `prefeitura` inclui `login` e `senha`, enquanto o bloqueio desses campos no produto atual e politica local. |
| **FR-DOCPN-05** | Artefatos ativos de produto, UX e arquitetura devem apontar explicitamente para as tres referencias externas: `addCompany`, `getCidadeById` e `api.json`. |
| **FR-DOCPN-06** | Artefatos historicos que permanecerem em uso devem receber nota de contexto ou marcador `historico` quando citarem a hipotese antiga de `nfse.nacional` como contrato. |
| **FR-DOCPN-07** | O PRD, a spec UX e a arquitetura tecnicas do cluster `prefeitura_login_required_blocked` devem passar a registrar que a exigencia municipal documentada pelo fornecedor nao e evidenciada apenas por erro textual, mas tambem pelo schema oficial e pela rota de metadados do municipio. |
| **FR-DOCPN-08** | Esta iniciativa deve produzir uma estrutura de epic/stories limitada a atualizacao documental e governanca, sem acoplar obrigatoriamente a migracao de runtime. |

---

## 8. Requisitos nao funcionais

| ID | Requisito |
|---|---|
| **NFR-DOCPN-01** | A atualizacao documental nao pode inventar requisitos fora do briefing e das fontes oficiais referenciadas. |
| **NFR-DOCPN-02** | Toda atualizacao deve manter rastreabilidade por fonte, data e artefato impactado. |
| **NFR-DOCPN-03** | A governanca documental deve reduzir duplicidade contraditoria e preservar uma fonte canonica por assunto. |
| **NFR-DOCPN-04** | Nenhuma doc gerada por esta iniciativa deve reproduzir segredos, credenciais reais ou payload sensivel bruto. |
| **NFR-DOCPN-05** | O historico de decisoes anteriores deve continuar auditavel, mesmo quando a referencia vigente for atualizada. |

---

## 9. Requisitos de compatibilidade brownfield

| ID | Requisito |
|---|---|
| **CR-DOCPN-01** | A iniciativa deve preservar os links cruzados entre brief, PRD, spec, arquitetura, ADR e runbook ja existentes no cluster PlugNotas. |
| **CR-DOCPN-02** | A atualizacao das docs nao deve exigir reclassificacao retroativa de incidentes ou stories ja concluidas. |
| **CR-DOCPN-03** | O repositorio deve continuar distinguindo claramente artefatos ativos e artefatos historicos apos a atualizacao. |
| **CR-DOCPN-04** | O alinhamento documental nao deve ser tratado como validacao automatica do runtime atual; a divergencia entre codigo e contrato oficial deve permanecer explicita ate backlog proprio. |

---

<a id="prd-docpn-criterios"></a>
## 10. Criterios de aceite

- [ ] Nenhum artefato canonico vivo afirma `nfse.nacional` como contrato oficial sem qualificador.
- [ ] Pelo menos um ADR e um documento operacional registram `nfse.config.nfseNacional` e `consultaNfseNacional` como contrato oficial atual.
- [ ] O runbook canonico cita `/nfse/cidades/{codigoIbge}`, `padraoNacional`, `login` e `senha`.
- [ ] Os docs ativos de PLOGIN/addCompany apontam para `addCompany`, `getCidadeById` e `api.json`.
- [ ] O cluster documental passa a distinguir fornecedor, politica local e implementacao atual.
- [ ] Artefatos historicos com a hipotese antiga recebem contexto sem perda de rastreabilidade.

---

## 11. Metricas de sucesso

| Metrica | Sinal esperado |
|---|---|
| Clareza de contrato | Queda de referencias internas a `nfse.nacional` como contrato oficial |
| Qualidade de triagem | Aumento de analises que usam `/nfse/cidades/{codigoIbge}` antes de concluir causa raiz |
| Governanca documental | Menos contradicoes entre ADR, runbook, PRD e spec ativa |
| Preparacao de backlog | Separacao clara entre trabalho de docs e eventual migracao de runtime |

---

<a id="prd-docpn-riscos"></a>
## 12. Riscos e mitigacao

| Risco | Impacto | Mitigacao |
|---|---|---|
| Atualizar docs vivas sem qualificar o legado | Time pode achar que o runtime ja foi migrado | Explicitar a divergencia local em ADR, runbook e arquitetura |
| Reescrever artefatos historicos como se nunca houvesse hipotese antiga | Perda de rastreabilidade e auditoria | Usar nota de contexto ou marcador de historico |
| Misturar iniciativa documental com mudanca de codigo | Escopo inflado e backlog confuso | Manter DP-DOCPN-03 e FR-DOCPN-08 como gate de escopo |
| Subutilizar a rota oficial de municipio | Triagem continua incompleta | Tornar `/nfse/cidades/{codigoIbge}` obrigatoria nas docs operacionais |

---

<a id="prd-docpn-estrutura-epico"></a>
## 13. Estrutura de epico e stories

**Decisao de estrutura:** epico unico, pois a iniciativa e coesa e estritamente documental, com entregas encadeadas entre docs canonicas, docs ativas e governanca de historico.

### Epic 1 -- Alinhamento documental do contrato oficial PlugNotas

**Epic Goal:** alinhar as docs canonicas do cadastro de empresa PlugNotas ao contrato oficial atual, preservando o historico do repositorio e deixando explicita a divergencia temporaria entre runtime legado e schema oficial.

#### Story 1.1 -- Atualizar docs canonicas P0

Como responsavel pela documentacao de produto e operacao,  
quero atualizar ADR, arquitetura consolidada e runbook canonico,  
para que a fonte de verdade do projeto use o contrato oficial do PlugNotas e a triagem correta por municipio.

**Acceptance Criteria**
1. `ADR-plugnotas-nfse-nacional-empresa-spike` passa a registrar a divergencia historica e a referencia oficial atual.
2. `docs/architecture.md` deixa de apontar `nfse.nacional` como contrato canonico.
3. `docs/operacao-mei-nfse.md` incorpora `/nfse/cidades/{codigoIbge}`, `padraoNacional`, `login` e `senha`.

<a id="prd-docpn-story-12"></a>
#### Story 1.2 -- Alinhar artefatos ativos de produto, UX e arquitetura

Como produto e UX,  
quero revisar os PRDs, specs e arquiteturas ativas do cluster PLOGIN/addCompany,  
para que a narrativa de erro, contrato e politica do produto fique consistente em todo o repo.

**Acceptance Criteria**
1. Os artefatos ativos apontam para `addCompany`, `getCidadeById` e `api.json`.
2. O cluster `prefeitura_login_required_blocked` passa a explicitar contrato oficial x politica local.
3. Nenhum doc ativa trata `nfse.nacional` como contrato oficial sem ressalva.

<a id="prd-docpn-story-13"></a>
#### Story 1.3 -- Governanca de historico e manutencao continua

Como mantenedor do repositorio,  
quero etiquetar corretamente artefatos historicos e definir criterios de manutencao continua,  
para preservar auditoria e evitar que a hipotese antiga continue sendo reutilizada como fonte vigente.

**Acceptance Criteria**
1. Artefatos historicos relevantes recebem contexto ou marcador de historico.
2. O PRD e o runbook deixam claro que migracao de runtime e backlog separado.
3. O change log e a rastreabilidade permanecem auditaveis.

---

## 14. Plano de rollout

1. Atualizar primeiro os artefatos P0 do briefing.
2. Em seguida, alinhar os artefatos ativos de produto, UX e arquitetura.
3. Por fim, marcar artefatos historicos e fechar a governanca documental.
4. Se, durante a revisao, surgir decisao de migracao de runtime, abrir backlog separado em novo PRD ou epic tecnico.

---

## 15. Proximos passos canonicos

- **@sm** -- decompor o Epic 1 em stories detalhadas com file list e ordem de execucao.
- **@architect** -- revisar a redacao final dos ADRs e da arquitetura ativa para registrar corretamente a divergencia contrato x implementacao.
- **@qa** -- validar se as docs atualizadas sustentam a triagem correta sem contradicoes.
- **@po** -- aprovar a separacao formal entre iniciativa documental e eventual migracao de runtime.

---

## 16. Change log

| Data | Versao | Descricao | Autor |
|---|---|---|---|
| 2026-04-14 | 1.0 | PRD inicial criado a partir do brief de atualizacao das docs do contrato oficial PlugNotas para cadastro de empresa. | PM (Morgan) |
