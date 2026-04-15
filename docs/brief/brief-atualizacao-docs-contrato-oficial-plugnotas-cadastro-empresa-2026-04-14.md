# Brief: atualizacao de docs -- contrato oficial PlugNotas para cadastro de empresa

**Data:** 2026-04-14  
**Origem:** verificacao oficial da documentacao PlugNotas (`addCompany`, `/nfse/cidades/{codigoIbge}`, `api.json`) confrontada com a implementacao e com as docs atuais do Meu Financeiro.  
**Produto:** Meu Financeiro -- Guia MEI, BFF PlugNotas, documentacao canonica de cadastro de empresa e triagem NFS-e.

**Documentos relacionados (nao substituidos por este brief):**

- [PlugNotas -- Empresa / addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany)
- [PlugNotas -- Consultar disponibilidade do municipio e metadados](https://docs.plugnotas.com.br/#operation/getCidadeById)
- [PlugNotas -- OpenAPI oficial (`api.json`)](https://docs.plugnotas.com.br/api.json)
- [`docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`](../adr/ADR-plugnotas-nfse-nacional-empresa-spike.md)
- [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md)
- [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`](./brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md)
- [`docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md)
- [`docs/specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md)
- [`docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md)
- `frontend/src/utils/nfEmissionCompany.ts`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/src/services/plugnotas/prefeituraPortalCredentials.js`

**Proximos passos tipicos (conforme tipo de pedido):** atualizacao de ADR/arquitetura -> `@architect`; decisao de produto sobre contrato legado x contrato oficial -> `@po` / `@pm`; fatiamento em story -> `@sm`; alinhamento de implementacao e regressao -> `@dev` + `@qa`.

---

## 0. Resumo para stakeholders internos

- A documentacao oficial do PlugNotas hoje deixa visivel que o cadastro de empresa usa o schema `cadastroEmpresa` e que o modo nacional de NFS-e esta documentado em `nfse.config.nfseNacional` e `nfse.config.consultaNfseNacional`, nao em `nfse.nacional`.
- A mesma documentacao oficial registra que o `POST /empresa` pode exigir validacoes dinamicas por documento e municipio, incluindo dados de acesso a prefeitura.
- A rota oficial `/nfse/cidades/{codigoIbge}` expoe metadados operacionais que hoje faltam na narrativa canonica do repo: `login`, `senha` e `padraoNacional.producao/homologacao`.
- O repositorio ainda trata `nfse.nacional` como chave adotada por hipotese no codigo, nos testes e em docs centrais. Isso hoje virou divergencia documentada entre implementacao local e contrato oficial do fornecedor.
- O objetivo deste brief e corrigir primeiro a documentacao canonica e explicitar a divergencia. Migracao de codigo e backlog separado.

---

## 1. Problema

As docs atuais do projeto misturam tres camadas que agora precisam ser separadas:

1. **Contrato oficial do fornecedor:** o que a OpenAPI publica hoje para `POST /empresa` e para consulta de metadados por municipio.
2. **Politica atual do produto:** o fluxo nacional-first do Meu Financeiro bloqueia credenciais municipais e classifica certos casos como `prefeitura_login_required_blocked`.
3. **Hipotese historica de implementacao:** o repositorio adotou `nfse.nacional` como chave de payload antes de haver prova publica estavel no repo.

Com a documentacao oficial agora verificavel, varias docs vivas do projeto ficaram atrasadas. Isso gera tres riscos:

- troubleshooting incorreto do erro real, porque o time pode assumir que `nacional: true` deveria bastar em qualquer conta;
- leitura errada do contrato, porque o repo ainda fala de `nfse.nacional` como referencia principal;
- decisao de produto mal enquadrada, porque a politica local de bloqueio pode ser lida como se fosse limitacao nativa e oficial do PlugNotas.

---

## 2. Achados verificados na fonte oficial

| Fonte oficial | Achado verificado | Implicacao para o repo |
|---|---|---|
| `addCompany` | O `POST /empresa` faz validacoes dinamicas por documento e municipio e pode requerer inscricao municipal, inscricao estadual, certificado digital e dados de acesso a prefeitura. | A narrativa de erro nao pode presumir que tudo se resolve apenas com "modo nacional". |
| `api.json` -> `cadastroEmpresa` | O objeto `nfse` documentado tem `ativo`, `tipoContrato` e `config`. | A chave nacional documentada nao esta na raiz de `nfse`. |
| `api.json` -> `cadastroEmpresa.nfse.config` | Existem `nfseNacional` e `consultaNfseNacional` como propriedades oficiais da configuracao. | O repo precisa parar de descrever `nfse.nacional` como contrato oficial. |
| `api.json` -> `cadastroEmpresa.nfse.config.prefeitura` | O schema oficial de `prefeitura` inclui ao menos `login`, `senha`, `receitaBruta`, `lei` e `dataInicio`. | O erro de `prefeitura.login` nao e um "fantasma"; ele esta coerente com o contrato publicado. |
| `/nfse/cidades/{codigoIbge}` | A resposta inclui `login`, `senha` e `padraoNacional` com flags separadas para `producao` e `homologacao`. | A triagem operacional deve usar essa rota antes de concluir que o problema e "nao suportado" ou "payload errado". |

**Inferencia operacional a partir da fonte oficial:** se o municipio consultado retornar `padraoNacional` ativo no ambiente alvo e `login=false` / `senha=false`, o payload legado do repo vira suspeito forte. Se retornar `login=true` ou `senha=true`, a exigencia municipal deixa de ser hipotese fraca e passa a ser sinal tecnico coerente com o fornecedor.

---

## 3. Gap atual no repositorio

### 3.1 Divergencia entre docs oficiais e implementacao local

Hoje o repositorio ainda envia e documenta:

```json
"nfse": {
  "ativo": true,
  "tipoContrato": 0,
  "config": { "producao": true },
  "nacional": true
}
```

Esse shape aparece em:

- `frontend/src/utils/nfEmissionCompany.ts`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/tests/plugnotas-empresa.test.js`
- `docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`
- `docs/operacao-mei-nfse.md`
- `docs/architecture.md`

Pela OpenAPI oficial atual, a referencia canonica publicada e:

```json
"nfse": {
  "ativo": true,
  "tipoContrato": 0,
  "config": {
    "producao": true,
    "nfseNacional": true,
    "consultaNfseNacional": true
  }
}
```

**Nota importante:** este brief nao conclui automaticamente que o runtime atual esteja quebrado em todos os ambientes. Ele conclui que a **documentacao do repo** nao pode mais tratar `nfse.nacional` como contrato oficial sem qualificador.

### 3.2 Divergencia entre contrato do fornecedor e politica do produto

O backend local bloqueia explicitamente `nfse.config.prefeitura.login` e `.senha` em `backend/src/services/plugnotas/prefeituraPortalCredentials.js`. Isso e uma **decisao de produto local**, nao a definicao do contrato externo.

As docs precisam passar a dizer claramente:

- o fornecedor documenta suporte a campos de prefeitura;
- o produto atual escolhe nao aceitar essas credenciais no fluxo nacional-first;
- quando o erro real exigir login municipal, existe um gap entre produto atual e contrato possivel do fornecedor.

---

## 4. Objetivo da atualizacao em docs

Produzir um alinhamento documental que:

1. use o contrato oficial do PlugNotas como referencia primaria para `POST /empresa`;
2. diferencie contrato do fornecedor, politica do produto e hipotese historica de implementacao;
3. incorpore a rota `/nfse/cidades/{codigoIbge}` na triagem canonica;
4. deixe explicita a divergencia atual entre docs oficiais e shape legado usado pelo codigo;
5. prepare backlog separado para eventual migracao de implementacao, sem inventar requisito novo nesta rodada documental.

---

## 5. Escopo proposto da atualizacao

### P0 -- docs canonicas vivas

| Artefato | Atualizacao necessaria |
|---|---|
| `docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md` | Rebaixar de "hipotese adotada vigente" para "spike historico superseded"; registrar que a OpenAPI oficial publica `nfse.config.nfseNacional` e `consultaNfseNacional`. |
| `docs/architecture.md` | Trocar a frase que aponta `nfse.nacional` como campo implementado canonico por nota de divergencia entre implementacao atual e contrato oficial. |
| `docs/operacao-mei-nfse.md` | Atualizar secao de NFS-e Nacional e triagem para incluir `/nfse/cidades/{codigoIbge}`, `padraoNacional`, `login` e `senha`; remover qualquer formulacao que trate `nfse.nacional` como prova de contrato oficial. |
| `docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md` | Atualizar o mapeamento addCompany para refletir o schema oficial atual e explicitar o gap do payload legado. |
| `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` | Ajustar texto para separar "produto nao aceita credenciais municipais hoje" de "fornecedor documenta campos de prefeitura". |

### P1 -- artefatos ativos de produto, UX e arquitetura

| Artefato | Atualizacao necessaria |
|---|---|
| `docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md` | Trocar a referencia principal de contrato para docs oficiais atuais e acrescentar que o municipio deve ser verificado via `/nfse/cidades/{codigoIbge}`. |
| `docs/specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md` | Ajustar a copy interna de equipes para nao sugerir que o erro decorre apenas de "trilho B insuficiente"; incluir a distincao contrato oficial x politica do produto. |
| `docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md` | Atualizar fluxo tecnico e placeholders para referenciar `nfse.config.nfseNacional` e a consulta de metadados do municipio. |
| Artefatos addCompany robustos de 2026-04-10 | Atualizar qualquer trecho que trate `nfse.nacional` como shape oficial, mantendo anotacao clara se o codigo ainda estiver legado. |

### P2 -- artefatos historicos

| Tipo | Acao recomendada |
|---|---|
| briefs, evidencias e stories fechadas que registram a hipotese antiga | Nao reescrever como se a historia nao tivesse existido; adicionar nota de contexto ou marcador `historico` quando o artefato continuar sendo usado como referencia. |
| templates ou evidencias que ainda falem em compatibilidade com `nfse.nacional` | Ajustar para "payload legado/local" ou substituir pela chave oficial quando o objetivo for orientar trabalho futuro. |

---

## 6. Conteudo minimo que precisa entrar nas docs atualizadas

### 6.1 Contrato oficial

- `POST /empresa` usa o schema `cadastroEmpresa`.
- O modo nacional oficialmente documentado esta em `nfse.config.nfseNacional`.
- A consulta do modo nacional esta documentada em `nfse.config.consultaNfseNacional`.
- O objeto `nfse.config.prefeitura` oficialmente documentado inclui campos como `login` e `senha`.

### 6.2 Regra de triagem

Antes de concluir que o caso e apenas "fora do fluxo nacional", a documentacao operacional deve mandar verificar:

1. o `codigoIbge` efetivamente usado no cadastro;
2. `/nfse/cidades/{codigoIbge}` no ambiente relevante;
3. `padraoNacional.producao` ou `padraoNacional.homologacao`;
4. `login` e `senha` retornados como `true` ou `false`;
5. se o erro pode estar sendo agravado pela divergencia entre payload legado do produto e contrato oficial atual.

### 6.3 Distincao obrigatoria

As docs precisam usar formula similar a esta:

- **Contrato do fornecedor:** suporta configuracoes nacionais em `nfse.config.*` e pode exigir dados de prefeitura conforme municipio.
- **Politica atual do produto:** o Meu Financeiro nao aceita credenciais municipais no fluxo nacional-first e pode bloquear esse caso antes ou depois do upstream.
- **Estado atual da implementacao:** o codigo ainda usa um shape legado com `nfse.nacional`, que precisa ser tratado como divergencia conhecida, nao como contrato canonico.

---

## 7. Fora de escopo deste brief

- Migrar imediatamente o codigo de `nfse.nacional` para `nfse.config.nfseNacional`.
- Liberar UI para credenciais de prefeitura.
- Alterar a classificacao atual `prefeitura_login_required_blocked`.
- Reabrir todas as stories fechadas do cluster historico.

Esses pontos podem virar backlog proprio depois que a documentacao canonica estiver corrigida.

---

## 8. Criterios de aceite para a atualizacao documental

- [ ] Nenhum artefato canonico vivo afirma `nfse.nacional` como contrato oficial do PlugNotas sem qualificador.
- [ ] Pelo menos um ADR e um documento operacional explicam a divergencia atual entre implementacao local e OpenAPI oficial.
- [ ] O runbook canonico passa a citar `/nfse/cidades/{codigoIbge}`, `padraoNacional`, `login` e `senha`.
- [ ] Os docs ativos de PLOGIN / addCompany apontam explicitamente para as tres fontes oficiais: `addCompany`, `getCidadeById` e `api.json`.
- [ ] Artefatos historicos que permanecerem com a hipotese antiga recebem nota de contexto ou marcador de historico.

---

## 9. Riscos e questoes em aberto

| Tema | Nota |
|---|---|
| Compatibilidade real do payload legado | A documentacao oficial mostra outro shape, mas ainda falta decidir se o produto vai migrar imediatamente ou documentar o legado por enquanto. |
| `consultaNfseNacional` | O contrato oficial publica a propriedade; o backlog tecnico ainda precisa decidir quando ela deve acompanhar `nfseNacional` no produto. |
| Ambiente | A analise operacional continua dependendo de comparar sandbox x producao com o municipio real. |
| Politica de produto | Precisa ficar decidido se o sistema continuara bloqueando qualquer credencial municipal ou se havera fluxo suportado em backlog futuro. |

---

## 10. Recomendacao de execucao

1. Atualizar primeiro `ADR-plugnotas-nfse-nacional-empresa-spike`, `docs/architecture.md` e `docs/operacao-mei-nfse.md`.
2. Em seguida, alinhar os artefatos addCompany e PLOGIN ainda usados como referencia ativa.
3. So depois abrir decisao de implementacao: `docs-only`, `docs + contrato`, ou `docs + contrato + fluxo municipal`.

---

## 11. Historico

| Data | Autor / ferramenta | Alteracao |
|---|---|---|
| 2026-04-14 | Atlas + Orion (`@analyst` / `@aiox-master`) | Versao inicial do briefing de atualizacao documental com base na OpenAPI oficial do PlugNotas e no gap atual do repositorio. |

