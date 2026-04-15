# Brief: recorrencia de `prefeitura_login_required_blocked` no municipio `5002704` -- reavaliacao para correcao

**Data:** 2026-04-14  
**Origem:** nova ocorrencia real em `POST /api/mei-notas/setup/emissao-fiscal/empresa`, com `HTTP 400` e `runtimeDecision` redigido indicando `codigoIbge = 5002704`, `environment = producao`, `padraoNacionalEnabled = true`, `requiresLogin = true`, `requiresSenha = false` e `upstreamCallSkipped = true`.  
**Produto:** Meu Financeiro -- Guia MEI / setup de emissao fiscal.  
**Natureza:** brief brownfield de reavaliacao apos recorrencia real; objetivo = decidir se o caso exige ajuste de policy/preflight no BFF ou confirmacao formal de backlog fase 2 municipal.

## Referencias canonicas

- [PlugNotas -- Empresa / addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany)
- [PlugNotas -- Consultar disponibilidade do municipio e metadados](https://docs.plugnotas.com.br/#operation/getCidadeById)
- [PlugNotas -- OpenAPI oficial (`api.json`)](https://docs.plugnotas.com.br/api.json)
- [`docs/brief/brief-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](./brief-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md)
- [`docs/prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../prd/PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md)
- [`docs/technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](../technical/architecture-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md)
- [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)
- [`docs/prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`](../prd/PRD-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md)
- `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/src/services/plugnotas/plugnotas-cidades.service.js`
- `backend/src/services/plugnotas/prefeituraPortalCredentials.js`
- `frontend/src/utils/nfEmissionCompany.ts`
- `frontend/src/lib/fiscalUserError.ts`

---

## 0. Resumo para stakeholders internos

- A ocorrencia atual **nao** veio do `POST /empresa` no fornecedor; o BFF bloqueou o caso **antes** do upstream final.
- O runtime atual do BFF aplica a precedencia `login/senha exigidos` -> `prefeitura_login_required_blocked`, mesmo quando `padraoNacionalEnabled = true`.
- A arquitetura RTCAD e a matriz QA vigentes institucionalizaram esse comportamento como policy do MVP, nao como bug acidental.
- O contrato oficial do PlugNotas, por outro lado, documenta tanto `nfse.config.nfseNacional` quanto `nfse.config.prefeitura.login` / `senha`, o que mostra que o bloqueio atual e uma **policy local do produto**, nao uma impossibilidade formal do fornecedor.
- A recorrencia em `5002704` muda a pergunta principal: o problema ja nao e "por que o endpoint falhou?", e sim "a policy atual esta rigida demais para um caso hibrido do preflight?".
- Recomendacao deste brief: **nao** inverter a precedencia global agora; primeiro executar descoberta controlada para `5002704`, e so depois decidir entre override pontual ou backlog fase 2 municipal.

---

## 1. Sintoma atual da recorrencia

| Campo | Valor redigido observado |
|---|---|
| Rota BFF | `POST /api/mei-notas/setup/emissao-fiscal/empresa` |
| HTTP | `400 Bad Request` |
| Codigo | `errors.plugnotasCode = prefeitura_login_required_blocked` |
| Municipio | `codigoIbge = 5002704` |
| Ambiente | `producao` |
| Preflight | `consultedMunicipio = true` |
| Metadado nacional | `padraoNacionalEnabled = true` |
| Auth municipal | `requiresLogin = true`, `requiresSenha = false` |
| Chamada ao cadastro | `upstreamCallSkipped = true` |
| Leitura imediata | bloqueio antecipado do BFF, sem tentativa de `POST /empresa` |

---

## 2. Diagnostico consolidado

### 2.1 O que foi verificado no runtime local

1. O cadastro da empresa executa preflight municipal obrigatorio via `GET /nfse/cidades/{codigoIbge}` antes do `POST /empresa`.
2. A funcao de decisao atual bloqueia o caso assim que `requiresLogin = true` ou `requiresSenha = true`, sem deixar `padraoNacionalEnabled = true` vencer a precedencia.
3. Esse comportamento nao esta so no codigo: a arquitetura RTCAD define explicitamente `login = true ou senha = true` como ramo `municipio_municipal_auth_required`.
4. A matriz QA RTCAD tambem audita esse ramo como `RTCAD-04`, com classificacao final `nao suportado no fluxo nacional`.
5. O frontend atual nao recolhe credenciais municipais e o backend atual rejeita qualquer `prefeitura.login` / `senha` no percurso principal.

### 2.2 O que foi verificado no contrato oficial do fornecedor

| Fonte | Achado verificado | Implicacao |
|---|---|---|
| `addCompany` | O cadastro de empresa admite validacoes dinamicas por municipio, incluindo dados de acesso a prefeitura. | O fornecedor nao trata auth municipal como anomalia fora de contrato. |
| `api.json` -> `nfse.config` | O contrato oficial publica `nfseNacional` e `consultaNfseNacional`. | O produto esta correto em migrar para o shape oficial nacional. |
| `api.json` -> `nfse.config.prefeitura` | O schema oficial publica `login` e `senha` como campos validos. | O bloqueio atual do produto e escolha local, nao proibicao do fornecedor. |
| `/nfse/cidades/{codigoIbge}` | A rota oficial devolve `padraoNacional`, `login` e `senha`. | O caso recorrente precisa ser lido como problema de semantica/precedencia da triagem. |

### 2.3 Leitura do gap real

O gap confirmado por esta recorrencia e o seguinte:

1. o produto assume que `login/senha` exigidos significam **bloqueio absoluto** do fluxo atual;
2. o contrato oficial do fornecedor permite coexistencia entre modo nacional e dados adicionais de prefeitura no cadastro;
3. o caso `5002704` sugere um municipio com semantica potencialmente **hibrida** no preflight;
4. o repositorio ainda nao tem artefato proprio nem teste automatizado especifico para `5002704`.

---

## 3. Pergunta que este brief quer fechar

> Quando o preflight do municipio devolver `padraoNacionalEnabled = true` e, ao mesmo tempo, `requiresLogin = true` ou `requiresSenha = true`, o fluxo do produto deve:
>
> 1. manter o bloqueio antecipado como policy vigente; ou
> 2. permitir excecao controlada para municipios/ambientes especificos apos validacao com o fornecedor?

Sem fechar essa pergunta, qualquer tentativa de correcao corre risco de cair num dos dois extremos errados:

- tratar uma policy recorrente como se fosse bug tecnico acidental;
- liberar globalmente municipios que realmente exigem auth municipal e quebrar a taxonomia RTCAD.

---

## 4. Opcoes de decisao

### Opcao A -- manter policy atual sem mudanca de runtime

**Leitura:** `5002704` confirma apenas que o caso continua fora do fluxo nacional atual.

**Vantagens:**

- nenhuma mudanca de codigo;
- preserva integralmente RTCAD, TRO e UX atuais;
- risco baixo de regressao tecnica.

**Custos:**

- a recorrencia continua a voltar como falso bug tecnico;
- o produto nao aprende nada novo sobre o caso hibrido;
- suporte e operacao seguem a absorver o ruido.

### Opcao B -- correcao controlada para caso hibrido validado

**Leitura:** alguns municipios/ambientes podem continuar elegiveis ao caminho nacional, mesmo com metadado adicional de auth municipal no cadastro.

**Vantagens:**

- ataca o caso recorrente sem virar inversao global;
- preserva a taxonomia atual para os restantes municipios;
- cria base para override governado por municipio/ambiente.

**Custos:**

- exige validacao com o fornecedor;
- exige nova regra explicita no motor de decisao;
- exige testes e QA especificos por municipio/ambiente.

### Opcao C -- inverter a precedencia global

**Leitura:** `padraoNacionalEnabled = true` passaria a vencer mesmo quando `login/senha = true`.

**Vantagens:**

- mudanca simples de regra.

**Custos:**

- alto risco de abrir municipios realmente dependentes de auth municipal;
- contraria a arquitetura RTCAD vigente sem prova suficiente;
- pode gerar mais falhas no `POST /empresa` ou comportamento incoerente entre ambientes.

**Recomendacao deste brief:** **nao seguir a Opcao C** sem prova externa e QA dirigida.

---

## 5. Recomendacao do analyst

Recomendacao: seguir uma estrategia **discovery first, correction second**.

### 5.1 Decisao recomendada agora

1. Nao inverter a precedencia global do motor de decisao.
2. Tratar a recorrencia `5002704` como gatilho legitimo para **briefing de correcao dirigida**, nao como simples repeticao operacional.
3. Abrir validacao controlada do caso hibrido em `producao` e `homologacao`, com evidencia redigida.

### 5.2 Condicao para mudar o runtime

So mudar o runtime se houver confirmacao suficiente de que:

- o fornecedor permite prosseguir no caminho nacional para o municipio/caso alvo; ou
- existe regra pontual bem definida para municipio/ambiente, sem contaminar os demais casos.

### 5.3 Se a validacao falhar

Se o fornecedor confirmar que `5002704` realmente exige auth municipal para o cadastro da empresa, o caso deixa de ser bugfix e passa a ser:

- gap formal de produto fase 2 municipal; e
- backlog separado de UI/BFF/seguranca para credenciais municipais.

---

## 6. Escopo proposto para a correcao derivada

### 6.1 Bloco A -- descoberta e validacao do caso real

Entregaveis minimos:

1. capturar evidencia redigida de `GET /nfse/cidades/5002704` em `producao`;
2. capturar evidencia redigida do mesmo municipio em `homologacao`, se disponivel;
3. confirmar com o fornecedor a semantica esperada quando `padraoNacional = true` coexistir com `login = true` ou `senha = true`;
4. consolidar a decisao num artefato QA ou runbook complementar.

### 6.2 Bloco B -- correcao tecnica controlada, se aprovada

Possiveis frentes:

- ajustar `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js`;
- introduzir override explicito por municipio/ambiente ou regra equivalente;
- adicionar testes automatizados especificos para `padraoNacionalEnabled = true` + `requiresLogin = true`;
- atualizar a matriz QA RTCAD com o caso real `5002704`.

### 6.3 Bloco C -- se a policy atual permanecer

Se a decisao final for manter o bloqueio:

- registrar `5002704` como caso recorrente conhecido;
- reforcar a classificacao operacional;
- abrir backlog de fase 2 municipal apenas se o gatilho de produto for confirmado.

---

## 7. Fora de escopo deste brief

- liberar globalmente todos os municipios com `padraoNacionalEnabled = true`;
- reabrir coleta geral de `login` / `senha` na UI atual sem decisao formal;
- persistir credenciais municipais;
- reinterpretar `prefeitura_login_required_blocked` como erro de endpoint;
- substituir RTCAD por remendo tatico sem validacao externa.

---

## 8. Evidencias e criterios de aceite para o PRD/story derivado

### Evidencias minimas

1. resposta redigida de `GET /nfse/cidades/5002704` em `producao`;
2. resposta redigida comparavel em `homologacao`, quando possivel;
3. posicao do fornecedor sobre a semantica do caso hibrido;
4. leitura consolidada da classificacao final: `bugfix controlado` ou `fase 2 municipal`.

### Criterios de aceite

- [ ] Existe decisao explicita para o caso `5002704`.
- [ ] O repositorio ganha cobertura automatizada do ramo `padraoNacionalEnabled = true` + `requiresLogin = true`.
- [ ] A documentacao QA/runbook deixa claro se `5002704` e excecao controlada ou continuidade de bloqueio.
- [ ] Nenhuma eventual mudanca de runtime reabre regressao para `RTCAD-04` e `RTCAD-05`.
- [ ] O produto deixa explicito se a recorrencia continua operacao ou se vira iniciativa nova.

---

## 9. Riscos e mitigacao

| Risco | Impacto | Mitigacao |
|---|---|---|
| Inverter a precedencia global cedo demais | Cadastro incorreto em municipios realmente dependentes de auth municipal | Nao seguir Opcao C sem validacao externa e QA dirigida |
| Manter bloqueio sem aprender com a recorrencia | Retrabalho ciclico entre suporte, QA e engenharia | Executar Bloco A e fechar decisao explicita para `5002704` |
| Criar override sem governanca | Divergencia entre codigo, QA e runbook | Formalizar regra em PRD/story e atualizar matriz RTCAD |
| Abrir fase 2 municipal sem escopo controlado | Inflacao de escopo e risco de seguranca | Exigir backlog separado e decisao formal de produto |

---

## 10. Proximos passos sugeridos

1. `@qa` / operacao: consolidar evidencia redigida do preflight real de `5002704` em `producao` e, se possivel, em `homologacao`.
2. `@pm` / `@po`: decidir se a recorrencia ja aciona gatilho suficiente para PRD/story de correcao dirigida.
3. `@architect`: desenhar a alternativa tecnica segura caso o fornecedor valide excecao controlada.
4. `@sm`: se aprovado, quebrar em story de descoberta + story de implementacao/teste.
5. `@dev`: so alterar o motor de decisao depois da validacao do caso hibrido.

---

## 11. Change log

| Data | Nota |
|---|---|
| 2026-04-14 | Brief criado a partir de analise aprofundada da recorrencia real `5002704`, com foco em policy local, precedencia do preflight e decisao de correcao dirigida. |
