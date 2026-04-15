# Especificacao de front-end e UX -- alinhamento do payload local de empresa PlugNotas com documentos ativos e fallback municipal condicionado

**Versao:** 1.0  
**Data:** 2026-04-15  
**Autoria:** Uma (ux-design-expert, fluxo AIOX)  
**PRD de origem:** [`docs/prd/PRD-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md`](../prd/PRD-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-fallback-municipal-2026-04-15.md)  
**Brief de origem:** [`docs/brief/brief-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-2026-04-15.md`](../brief/brief-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-2026-04-15.md)

**Relacao com outras specs e artefatos:**

| Artefato | Papel |
|---|---|
| [`ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](./ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) | Base da UX de `Documentos ativos`. Esta spec preserva essa estrutura e adiciona o segundo passo municipal condicionado. |
| [`ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](./ux-spec-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) | Base da classificacao brownfield do cadastro da empresa. Esta spec usa essa triagem como gatilho para revelar ou nao o fallback municipal. |
| [`ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](./ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md) | Artefato historico de bloqueio puro. Esta nova spec substitui essa resposta por `national-first + fallback municipal condicionado`. |
| [`ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](./ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | Preserva vocabulario e guardrails do caso `prefeitura.login`, mas agora com desbloqueio condicional do formulario. |
| [`docs/stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md`](../stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md) | Backlog que ja detalha os campos, rollout e guardrails do trilho municipal. Esta spec reposiciona esse trilho como passo excepcional da mesma jornada. |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Runbook canonico para classificacao, operacao e messaging do fluxo. |

---

## 1. Objetivo deste documento

Traduzir o novo PRD em comportamento de front-end e UX para a jornada de cadastro da empresa na Guia MEI.

O objetivo desta spec e garantir que a interface:

1. mantenha `NFS-e Nacional` como narrativa padrao quando `NFS-e` estiver ativa;
2. preserve a secao `Documentos ativos` como fonte visivel de verdade da escolha do usuario;
3. abra `login` e `senha` da prefeitura apenas quando o BFF devolver classificacao compativel com fallback municipal;
4. permita retry municipal no mesmo fluxo, sem criar uma nova rota visual;
5. continue segura, acessivel e legivel para operacao, QA e utilizador final.

---

## 2. Principios de UX

| Principio | Aplicacao |
|---|---|
| **National-first** | O fluxo continua apresentando `NFS-e Nacional` como experiencia principal. O segundo passo municipal so aparece quando o primeiro falha por incompatibilidade municipal. |
| **Uma unica jornada** | O utilizador permanece na mesma tela de setup fiscal. O fallback municipal e uma expansao contextual do mesmo fluxo, nao uma jornada paralela. |
| **Coerencia entre UI e payload** | O que o usuario marca em `Documentos ativos` precisa continuar coerente com o shape local e com a narrativa da tela. |
| **Desbloqueio por contrato, nao por chute** | O formulario municipal nao pode ser aberto apenas por substring ou heuristica textual do frontend. Ele depende de um sinal estavel do BFF. |
| **Causa antes de consequencia** | O erro principal continua sendo a falha do cadastro da empresa. `GET` negativo posterior nao vira causa raiz na UI. |
| **Dados sensiveis com friccao boa** | `login` e `senha` da prefeitura sao mostrados somente quando o caso exige, com linguagem clara e sem vazamento em logs, storage ou mensagens. |

---

## 3. Escopo UX e front-end

### 3.1 Dentro do escopo

- estados visuais do cadastro da empresa no setup fiscal;
- revelacao condicional do bloco de credenciais da prefeitura;
- copy do primeiro passo nacional e do segundo passo municipal;
- comportamento dos CTAs, validacao e retorno visual do retry municipal;
- guardrails de frontend para nao abrir o fallback por classificacao instavel;
- acessibilidade e privacidade do novo bloco.

### 3.2 Fora do escopo

- redesign completo da Guia MEI;
- mudanca de arquitetura para browser -> PlugNotas;
- persistencia local de `login`/`senha` em `localStorage`, `sessionStorage`, URL ou similares;
- definicao de contrato backend exato alem do minimo necessario para a UX;
- rollout global sem mecanismo de ativacao controlada.

---

## 4. Superficies afetadas

| Superficie | Papel na experiencia |
|---|---|
| `GuidesMei.tsx` | Tela principal do setup fiscal, onde a secao `Documentos ativos`, o callout nacional, os alertas e o bloco municipal convivem. |
| `nfEmissionCompany.ts` | Builder local que deve permanecer coerente com a selecao da UI e com o estado do fallback municipal. |
| `fiscalUserError.ts` | Fonte de copy de erro normalizada para o cadastro da empresa. |
| `nfseNacionalPlugnotasErrorHints.ts` | Camada secundaria de hints; pode enriquecer a copy, mas nao autoriza sozinha a abertura do formulario municipal. |
| `docs/operacao-mei-nfse.md` | Espelho operacional das mesmas classificacoes e proximos passos apresentados na UI. |

---

## 5. Arquitetura de informacao

### 5.1 Ordem recomendada na tela

| Ordem | Bloco | Regra UX |
|---|---|---|
| ALNFB-L0 | Alertas e contexto do setup fiscal | Mantidos como hoje. |
| ALNFB-L1 | `Documentos ativos` | Mantido como primeiro bloco de configuracao fiscal. |
| ALNFB-L2 | Callout do modo nacional | Aparece quando `NFS-e` estiver ativa e o fluxo estiver no primeiro passo nacional. |
| ALNFB-L3 | Painel principal de erro/classificacao | Recebe a narrativa do municipio incompativel com nacional. |
| ALNFB-L4 | Bloco de credenciais da prefeitura | So aparece quando o fallback municipal estiver autorizado pela classificacao do BFF. |
| ALNFB-L5 | Formulario base da empresa | Mantido; nao perde contexto nem selecao de documentos. |
| ALNFB-L6 | Barra de acoes | CTA principal muda conforme o estado: tentativa nacional ou retry municipal. |

### 5.2 Regra de visibilidade

- se `NFS-e` estiver desmarcada, o fallback municipal nao se aplica e o bloco de credenciais nao pode aparecer;
- se `NFS-e` estiver marcada, mas nao houver classificacao estavel do BFF para fallback municipal, o bloco continua oculto;
- se o usuario alterar municipio, `codigoIbge` ou desligar `NFS-e` depois de o bloco municipal ter sido aberto, o estado de fallback deve ser invalidado, os campos devem ser limpos e a tela deve voltar ao estado nacional-first.

---

## 6. Modelo de estados UX

### 6.1 ALNFB-UX-L0 -- estado inicial

**Objetivo:** manter `NFS-e Nacional` como historia principal.

**Copy sugerida do callout:**

**Titulo:** `NFS-e Nacional como padrao`  
**Texto:** `Esta etapa tenta configurar a empresa no emissor pelo fluxo nacional. Se o sistema identificar uma exigencia municipal compativel com este fluxo, a proxima etapa aparece aqui mesmo.`

**Regra:** o callout nacional so aparece quando `NFS-e` estiver ativa.

### 6.2 ALNFB-UX-L1 -- tentativa nacional em processamento

**Comportamento:**

- CTA principal e o de cadastro nacional;
- `Documentos ativos` e campos do formulario ficam desabilitados durante o envio;
- a tela pode exibir texto como `Cadastrando a empresa no emissor...` ou `Validando o municipio e concluindo o cadastro...`.

### 6.3 ALNFB-UX-L2 -- sucesso nacional

**Titulo sugerido:** `Empresa configurada com sucesso`  
**Texto sugerido:** `O cadastro da empresa foi concluido pelo fluxo nacional.`  
**CTA sugerido:** `Continuar`

### 6.4 ALNFB-UX-L3 -- fallback municipal disponivel

**Objetivo:** explicar por que a tentativa nacional nao concluiu e abrir a segunda etapa.

**Titulo sugerido:** `Seu municipio nao aceitou o modo nacional nesta tentativa`  
**Texto sugerido:** `Para continuar o cadastro desta empresa, informe o login e a senha do portal da prefeitura. A tentativa seguinte sera feita pelo trilho municipal.`

**Regras obrigatorias:**

- este estado precisa vir de classificacao estavel do BFF;
- o painel deve ficar acima do bloco de credenciais;
- o usuario continua a ver os `Documentos ativos` ja escolhidos;
- o CTA principal nacional deixa de ser o foco e o CTA do retry municipal passa a ser a acao primaria.

### 6.5 ALNFB-UX-L4 -- erro de validacao do bloco municipal

**Objetivo:** impedir retry municipal incompleto.

**Mensagens inline sugeridas:**

- `Informe o login da prefeitura.`
- `Informe a senha da prefeitura.`

**Regras:**

- `login` e `senha` sao obrigatorios em conjunto;
- o formulario nao envia com um campo vazio e o outro preenchido;
- o foco vai para o primeiro campo com erro.

### 6.6 ALNFB-UX-L5 -- retry municipal em processamento

**Copy sugerida:** `Concluindo o cadastro com os dados da prefeitura...`

**Regras:**

- todos os campos do bloco municipal ficam desabilitados;
- o CTA principal mostra loading;
- `Documentos ativos` e os campos de empresa tambem ficam desabilitados para evitar divergencia entre classificacao e payload em voo.

### 6.7 ALNFB-UX-L6 -- sucesso municipal

**Titulo sugerido:** `Empresa configurada com sucesso`  
**Texto sugerido:** `O cadastro da empresa foi concluido com a configuracao exigida pelo municipio.`  
**CTA sugerido:** `Continuar`

### 6.8 ALNFB-UX-L7 -- fallback nao disponivel

**Objetivo:** comunicar bloqueio governado sem abrir os campos.

**Titulo sugerido:** `Este municipio exige uma configuracao ainda nao disponivel`  
**Texto sugerido:** `A aplicacao identificou que este cadastro precisa de autenticacao da prefeitura, mas esta opcao nao esta disponivel neste ambiente ou nesta configuracao do produto.`  
**CTA sugerido:** `Ver guia de operacao`

**Regra:** este estado nao revela `login` e `senha`, mesmo que a heuristica textual local reconheca o erro.

### 6.9 ALNFB-UX-L8 -- erro generico de contrato, dados ou ambiente

**Regra:** manter as narrativas ja existentes de erro de payload, contrato ou ambiente. Nao abrir fallback municipal e nao misturar a copy com `prefeitura.login` se o BFF nao classificar o caso como municipal.

---

## 7. Componentes e comportamento

### 7.1 Secao `Documentos ativos`

Esta spec preserva o desenho da spec de 2026-04-07:

- tres checkboxes: `NFS-e`, `NF-e`, `NFC-e`;
- `NFS-e` continua sendo o eixo do fallback municipal;
- a confirmacao ao desmarcar `NFS-e` definida na spec de `Documentos ativos` continua valida;
- se `NFS-e` for desligada enquanto o fallback municipal estiver aberto, o bloco municipal e limpo e ocultado.

### 7.2 Callout nacional

**Uso:** bloco informativo acima do formulario base da empresa.

**Objetivo:** reforcar que o passo atual ainda e o percurso principal do produto.

**Regras:**

- deve ser informativo, nao alarmista;
- nao mencionar `login`/`senha` logo de inicio;
- some quando a tela entrar no estado `ALNFB-UX-L3` e o foco passar a ser o fallback municipal.

### 7.3 Painel principal de classificacao

**Uso:** bloco de alerta unico e prioritario para o estado `ALNFB-UX-L3` ou `ALNFB-UX-L7`.

**Regras:**

- um unico `role="alert"` por estado principal;
- o texto principal precisa explicar a causa em linguagem humana;
- hints secundarios podem complementar, mas nao disputar a manchete com o alerta principal.

### 7.4 Bloco de credenciais da prefeitura

**Padrao recomendado:** card inline dentro da mesma pagina, abaixo do painel principal e acima da barra de acoes.

**Motivo:** manter contexto, evitar perda de dados e impedir que o usuario interprete a etapa como outra jornada.

**Estrutura recomendada:**

- titulo do bloco;
- texto curto de contexto;
- campo `Login da prefeitura`;
- campo `Senha da prefeitura`;
- nota curta de sensibilidade do dado;
- acoes primaria e secundaria.

**Labels sugeridas:**

- `Login da prefeitura`
- `Senha da prefeitura`

**Helper text sugerido:**

- `Use as credenciais do portal da prefeitura exigidas para este municipio.`

**Regras de input:**

- `senha` precisa ser mascarada;
- o comportamento de autocomplete deve seguir a decisao de seguranca/arquitetura adotada para campos sensiveis;
- nenhum valor pode ser enviado para console, URL ou storage local.

### 7.5 Barra de acoes

**Estado nacional:** manter CTA principal existente do cadastro da empresa.  
**Estado municipal:** a acao primaria passa a ser o retry municipal.

**Label sugerida da acao primaria municipal:** `Concluir cadastro com dados da prefeitura`

**Acao secundaria sugerida:** `Voltar e revisar dados`

**Regra:** `Tentar novamente` generico nao deve ser a acao principal quando o sistema ja souber que o proximo passo correto e o fallback municipal.

---

## 8. Regras de desbloqueio do bloco municipal

O frontend so pode abrir `login` e `senha` quando todas as condicoes abaixo forem verdadeiras:

1. `NFS-e` estiver ativa em `Documentos ativos`;
2. o BFF devolver classificacao estavel indicando fallback municipal disponivel;
3. o mecanismo de ativacao do recurso estiver ligado para o ambiente/caso atual;
4. a resposta nao estiver em conflito com uma classificacao superior de ambiente, contrato ou indisponibilidade.

**Regra critica:** heuristicas de `nfseNacionalPlugnotasErrorHints.ts` podem melhorar a copy, mas nunca podem, sozinhas, revelar o formulario municipal.

---

## 9. Regras de copy

### 9.1 Copy que a UI deve comunicar

- o fluxo principal continua sendo o nacional;
- esta tentativa especifica nao foi aceita pelo municipio no modo nacional;
- existe uma segunda etapa com credenciais da prefeitura quando o sistema permitir;
- os dados da prefeitura sao sensiveis e devem ser informados apenas no formulario correto;
- o usuario pode revisar os dados antes de tentar novamente.

### 9.2 Copy que a UI deve evitar

- `endpoint errado`
- `rota errada`
- `preencha nfse.config.prefeitura.login`
- `bug do emissor`
- `tente varias vezes para ver se passa`
- promessas de persistencia ou nao persistencia que nao estejam confirmadas na arquitetura

### 9.3 Textos sugeridos

| Elemento | Texto sugerido |
|---|---|
| Titulo do fallback disponivel | `Seu municipio nao aceitou o modo nacional nesta tentativa` |
| Texto do fallback disponivel | `Para continuar o cadastro desta empresa, informe o login e a senha do portal da prefeitura.` |
| Nota de sensibilidade | `Esses dados sao sensiveis. Informe apenas as credenciais do portal da prefeitura vinculadas a este emissor.` |
| Titulo do fallback indisponivel | `Este municipio exige uma configuracao ainda nao disponivel` |
| Texto do fallback indisponivel | `A aplicacao identificou a necessidade de autenticacao da prefeitura, mas esta opcao nao esta disponivel neste contexto.` |

---

## 10. Acessibilidade e privacidade

- o alerta principal do estado usa `role="alert"` ou equivalente ja adotado na tela;
- o bloco municipal usa `role="region"` com titulo visivel e `aria-labelledby`;
- labels e campos precisam de associacao explicita;
- o primeiro erro de validacao recebe foco apos submit falho;
- `senha` permanece mascarada por padrao;
- o frontend nao grava `login`/`senha` em `localStorage`, `sessionStorage`, querystring ou logs do browser;
- se a tela usar telemetria, ela nao envia os valores de `login` e `senha`.

---

## 11. Wireframes textuais

### 11.1 Estado inicial nacional

```text
[ Setup fiscal / cadastro da empresa ]

[ Documentos ativos ]
[x] NFS-e
[ ] NF-e
[ ] NFC-e

[ NFS-e Nacional como padrao ]
Esta etapa tenta configurar a empresa no emissor pelo fluxo nacional.

[ Formulario base da empresa ]

[ Cadastrar empresa ]
```

### 11.2 Fallback municipal disponivel

```text
[ Documentos ativos ]
[x] NFS-e
[ ] NF-e
[ ] NFC-e

[ Alerta principal ]
Seu municipio nao aceitou o modo nacional nesta tentativa.
Para continuar o cadastro desta empresa, informe o login e a senha
do portal da prefeitura.

[ Credenciais da prefeitura ]
Login da prefeitura  [____________]
Senha da prefeitura  [••••••••••]
Esses dados sao sensiveis.

[ Voltar e revisar dados ] [ Concluir cadastro com dados da prefeitura ]
```

### 11.3 Fallback indisponivel

```text
[ Alerta principal ]
Este municipio exige uma configuracao ainda nao disponivel.

[ Ver guia de operacao ] [ Revisar dados ]
```

---

## 12. Rastreio PRD -> UX

| ID | Cobertura nesta spec |
|---|---|
| **FR-ALNFB-01** | Secoes 5, 7.1 e 12 preservam `Documentos ativos` como fonte visivel de verdade. |
| **FR-ALNFB-02** | Secoes 5.2 e 6.1 limitam a narrativa nacional ao caso com `NFS-e` ativa. |
| **FR-ALNFB-03** | Secoes 3 e 4 mantem a mesma rota e a mesma tela como jornada principal. |
| **FR-ALNFB-04** | Secoes 6.4 e 8 exigem classificacao estavel do BFF para abrir o fallback. |
| **FR-ALNFB-05** | Secoes 5.2, 6.4 e 7.4 definem a revelacao condicional do bloco municipal. |
| **FR-ALNFB-06** | Secoes 6.5 e 7.5 definem o retry municipal como acao primaria do segundo passo. |
| **FR-ALNFB-07** | Secoes 6.5, 7.4 e 10 exigem validacao conjunta de `login+senha` e guardrails de dado sensivel. |
| **FR-ALNFB-08** | Secoes 6 e 9 separam claramente o primeiro passo nacional do segundo passo municipal. |
| **FR-ALNFB-09** | Secao 6.8 cobre o caso em que o fallback continua indisponivel. |
| **FR-ALNFB-10** | Principios e estados preservam a causalidade de erro principal vs consulta posterior. |
| **FR-ALNFB-11** | Secoes 6 e 12 diferenciam nacional puro, fallback disponivel, fallback indisponivel e erro generico. |
| **NFR-ALNFB-01** | Secoes 7.4 e 10 proíbem vazamento e persistencia local de credenciais. |
| **NFR-ALNFB-03** | Secoes 5, 7 e 10 definem acessibilidade e consistencia visual. |
| **CR-ALNFB-03** | Secoes 5.2, 6.1 e 7.2 evitam friccao extra para quem continua no trilho nacional. |
| **CR-ALNFB-04** | Secoes 7.1 e 8 impedem regressao da coerencia ja entregue em `Documentos ativos`. |

---

## 13. Criterios de aceite UX

- [ ] `Documentos ativos` continua visivel e coerente com o restante da jornada.
- [ ] O callout nacional so aparece quando `NFS-e` estiver ativa e antes de o fallback municipal ser aberto.
- [ ] `login` e `senha` da prefeitura so aparecem quando houver classificacao estavel do BFF para fallback municipal.
- [ ] O frontend nao revela o formulario municipal apenas por heuristica textual local.
- [ ] O CTA do retry municipal se torna a acao primaria quando o segundo passo estiver aberto.
- [ ] Se o fallback nao estiver disponivel, a UI explica isso sem abrir os campos.
- [ ] O usuario consegue distinguir claramente se esta na tentativa nacional ou no retry municipal.
- [ ] `login` e `senha` nao ficam persistidos em storage local ou expostos em logs do browser.
- [ ] O fluxo permanece acessivel com labels, foco e anuncio correto de erros.

---

## 14. Arquivos provaveis para implementacao

| Arquivo | Papel provavel |
|---|---|
| `frontend/src/pages/GuidesMei.tsx` | Hierarquia da pagina, callout nacional, painel principal e bloco de credenciais municipais. |
| `frontend/src/utils/nfEmissionCompany.ts` | Garantia de coerencia entre `Documentos ativos`, passo nacional e retry municipal. |
| `frontend/src/lib/fiscalUserError.ts` | Copy principal para estados `fallback disponivel`, `fallback indisponivel` e erros genericos. |
| `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` | Hints secundarios, sem autoridade para revelar o formulario. |
| `docs/operacao-mei-nfse.md` | Atualizacao do runbook para refletir os mesmos estados da UI. |

---

## 15. Change log

| Versao | Data | Notas |
|---|---|---|
| 1.0 | 2026-04-15 | Spec inicial derivada do PRD de alinhamento entre payload local, `Documentos ativos` e fallback municipal condicionado. |

---

— Uma · especificacao de front-end e UX alinhada ao brownfield do setup fiscal MEI.
