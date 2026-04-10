# PRD — cadastro de empresa PlugNotas robusto para cenários de NFS-e Nacional, fallback e exceções municipais

**Versão:** 1.0  
**Data:** 2026-04-10  
**Tipo:** Brownfield — Guia MEI / setup de emissão fiscal PlugNotas  
**Fonte do briefing:** [docs/brief/brief-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md](../brief/brief-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md)

**Referência externa (contrato):** [Documentação da API PlugNotas (Postman)](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest)

---

## 1. Resumo executivo

O cadastro de empresa no PlugNotas já possui desenho funcional correcto no produto:

- frontend chama o BFF em `POST /api/mei-notas/setup/emissao-fiscal/empresa`;
- backend chama o PlugNotas em `POST /empresa`;
- em conflito, existe caminho de fallback via `PATCH /empresa/:cnpj`;
- a consulta de verificação acontece via `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=...` e, upstream, `GET /empresa/:cnpj`.

Este PRD não redefine essa arquitetura. O objectivo é tornar o cadastro **robusto por cenários**, preservando **NFS-e Nacional como padrão de produto** e garantindo comportamento previsível quando o fluxo entra em estados degradados.

Robustez, neste contexto, significa:

1. classificar correctamente falhas de ambiente, payload, conflito e exceção municipal;
2. preservar a causalidade entre `POST`, `PATCH` e `GET`;
3. devolver metadados estáveis do backend para frontend, operação e QA;
4. evitar diagnósticos errados de “endpoint incorreto” quando o problema real for outro;
5. manter a exceção municipal como caso explícito e bloqueado no fluxo nacional actual.

---

## 2. Problema

As correções anteriores resolveram partes relevantes do tema:

- endpoint upstream canónico fixado em `POST /empresa`;
- política NATEX de bloquear credenciais municipais no fluxo nacional;
- preservação da causalidade `POST` falho -> `GET` negativo;
- matriz operacional para triagem.

Ainda assim, o fluxo não está plenamente tratado como um sistema robusto por cenários. Em incidentes reais, o time ainda pode oscilar entre leituras incompletas:

- supor erro de rota;
- tratar rejeição de payload como erro estrutural;
- tratar `GET` negativo como causa raiz;
- perder a distinção entre conflito recuperável e falha real;
- misturar exceção municipal com regra geral da jornada.

Este PRD fecha essa lacuna ao formalizar requisitos de robustez end-to-end para o cadastro de empresa.

---

## 3. Objetivos

1. Preservar o fluxo actual UI -> BFF -> PlugNotas como caminho oficial de cadastro de empresa.
2. Manter `POST /empresa` como endpoint upstream canónico.
3. Manter **NFS-e Nacional** como política padrão da jornada.
4. Classificar de forma estável os principais cenários de cadastro:
   - sucesso nacional;
   - ambiente/configuração;
   - payload/contrato;
   - conflito com fallback;
   - exceção municipal bloqueada;
   - `GET` negativo posterior.
5. Garantir que frontend, backend, operação e QA trabalhem com a mesma interpretação causal do fluxo.

---

## 4. Fora de escopo

- Criar nova UI separada de “add company”.
- Remover o BFF e fazer chamada direta browser -> PlugNotas.
- Reabrir suporte a `login`/`senha` de prefeitura no fluxo nacional actual.
- Tornar o produto municipal-first.
- Alterar o provedor fiscal.

---

## 5. Contexto actual

| Camada | Operação | Papel |
|--------|----------|-------|
| Frontend -> BFF | `POST /api/mei-notas/setup/emissao-fiscal/empresa` | enviar dados do emitente |
| Backend -> PlugNotas | `POST /empresa` | cadastrar empresa |
| Backend -> PlugNotas | `PATCH /empresa/:cnpj` | fallback para empresa existente/conflito |
| Frontend/BFF | `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=...` | verificar presença do cadastro |
| Backend -> PlugNotas | `GET /empresa/:cnpj` | consultar empresa upstream |

Decisões já vigentes que este PRD preserva:

- `POST /empresa` continua sendo o endpoint upstream canónico;
- o frontend não fala diretamente com o PlugNotas;
- o fluxo continua **NFS-e Nacional por padrão**;
- credenciais municipais continuam fora do frontend e do backend desse percurso;
- exigência de `prefeitura.login` / `senha` continua tratada como **exceção municipal não suportada no fluxo nacional**.

---

## 6. Personas

| Persona | Necessidade |
|---------|-------------|
| MEI | concluir cadastro do emitente sem ser exposto a detalhes técnicos ou diagnósticos errados |
| Suporte/operação | distinguir rapidamente ambiente, payload, conflito e exceção municipal |
| Dev/Architect | implementar um fluxo classificável, observável e consistente |
| QA | validar cenários bons, degradados e de fallback com critérios objectivos |
| Produto/PO | preservar jornada nacional sem ampliar escopo para municipal-first |

---

## 7. Princípios de produto

### 7.1 Fluxo principal preservado

O fluxo continua sendo:

- `POST /api/mei-notas/setup/emissao-fiscal/empresa`
- `POST /empresa`
- `PATCH /empresa/:cnpj` quando aplicável
- `GET /empresa/:cnpj` como verificação posterior

### 7.2 NFS-e Nacional continua padrão

O percurso principal permanece **nacional-first**.

Implicações:

- sem recolha padrão de dados municipais sensíveis;
- sem reabrir `login`/`senha` de prefeitura;
- exceção municipal continua explicitamente bloqueada neste fluxo.

### 7.3 Robustez = comportamento previsível em degradação

Uma solução robusta:

- falha de forma classificável;
- expõe metadados úteis;
- preserva a história do fluxo;
- não confunde usuário nem operação sobre a natureza real do problema.

---

## 8. Cenários obrigatórios

### 8.1 Cenário A — sucesso nacional padrão

Condição:

- ambiente coerente;
- token correcto;
- payload aceite;
- sem exigência municipal excepcional.

Resultado esperado:

- `POST /empresa` bem-sucedido;
- eventual `GET` posterior encontra a empresa;
- UX comunica sucesso ou sincronização sem linguagem técnica excessiva.

### 8.2 Cenário B — erro de ambiente/configuração

Condição:

- `PLUGNOTAS_API_BASE_URL`, `PLUGNOTAS_API_PATH_PREFIX` ou token incoerentes;
- mistura sandbox/produção ou configuração incompatível.

Resultado esperado:

- caso classificado como ambiente/configuração;
- sem leitura errada de payload ou endpoint;
- evidência operacional suficiente para triagem.

### 8.3 Cenário C — rejeição de payload/contrato

Condição:

- erro como `codigoCidade`, tabela IBGE, contrato do emissor ou outros campos obrigatórios.

Resultado esperado:

- backend preserva metadados úteis;
- frontend apresenta erro como rejeição de dados/contrato;
- operação não trata isso como erro de rota.

### 8.4 Cenário D — empresa já existente com fallback

Condição:

- `POST /empresa` entra em conflito recuperável ou detecta empresa já existente.

Resultado esperado:

- backend tenta `PATCH /empresa/:cnpj` conforme a policy do fluxo;
- frontend comunica “sincronizado/atualizado” quando aplicável;
- operação consegue distinguir `created`, `updated` e `existing`.

### 8.5 Cenário E — exceção municipal bloqueada

Condição:

- PlugNotas exige `prefeitura.login` / `senha` para município/conta/caso concreto.

Resultado esperado:

- caso classificado como **exceção municipal não suportada no fluxo nacional**;
- sem recolha de credenciais;
- sem narrativa de endpoint errado;
- evidência suficiente para runbook e triagem.

### 8.6 Cenário F — `GET` negativo após `POST` falho

Condição:

- cadastro falha no `POST`;
- sistema consulta `GET /empresa/:cnpj` posteriormente.

Resultado esperado:

- `GET` negativo tratado como consequência;
- causa raiz continua sendo o erro anterior do `POST`;
- UX e operação preservam essa causalidade.

---

## 9. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-ROB-01** | O produto deve manter o frontend chamando apenas o BFF em `POST /api/mei-notas/setup/emissao-fiscal/empresa`. |
| **FR-ROB-02** | O backend deve manter `POST /empresa` como operação principal de cadastro upstream. |
| **FR-ROB-03** | O backend deve manter o caminho de fallback para `PATCH /empresa/:cnpj` quando o cenário indicar empresa já existente ou conflito recuperável. |
| **FR-ROB-04** | O fluxo deve classificar pelo menos as seguintes categorias de resultado: sucesso nacional, ambiente/configuração, payload/contrato, conflito com fallback, exceção municipal bloqueada e empresa não encontrada após falha anterior. |
| **FR-ROB-05** | O backend deve devolver metadados consumíveis pela UI e pela operação, incluindo `plugnotasRequest.method`, `plugnotasRequest.path`, `plugnotasCode` e `httpStatus` quando aplicáveis. |
| **FR-ROB-06** | O frontend deve reagir a cada classe de erro sem reintroduzir narrativa de endpoint errado quando a evidência útil for ambiente, payload, conflito ou exceção municipal. |
| **FR-ROB-07** | A solução deve preservar a causalidade entre `POST`, `PATCH` e `GET`, evitando que o resultado do `GET` apague a causa raiz do `POST`. |
| **FR-ROB-08** | A solução deve continuar tratando `prefeitura.login` / `senha` obrigatório como exceção municipal bloqueada, sem recolha dessas credenciais no fluxo nacional actual. |
| **FR-ROB-09** | Operação e QA devem conseguir mapear cada execução da jornada para uma das classes de cenário previstas neste PRD. |

---

## 10. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| **NFR-ROB-01** | Nenhum segredo PlugNotas deve ser exposto ao browser. |
| **NFR-ROB-02** | Logs, respostas e evidências devem ser redigidos, sem expor token, certificado, payload bruto ou credenciais sensíveis. |
| **NFR-ROB-03** | A solução deve preservar a arquitetura BFF existente e não introduzir nova dependência de chamada direta ao PlugNotas no frontend. |
| **NFR-ROB-04** | A solução deve continuar distinguindo exceção municipal, erro de ambiente e erro de payload como categorias diferentes. |
| **NFR-ROB-05** | Implementações derivadas devem ser verificáveis pelos gates do projeto: `npm run lint`, `npm run typecheck` e `npm test` quando houver alteração de código. |
| **NFR-ROB-06** | A documentação operacional derivada deve permitir triagem consistente sem exigir acesso a segredos ou payload bruto. |

---

## 11. Decisões de produto

| ID | Decisão |
|----|---------|
| **DP-ROB-01** | O fluxo continua orientado a NFS-e Nacional como jornada principal. |
| **DP-ROB-02** | `POST /empresa` permanece o endpoint upstream canónico. |
| **DP-ROB-03** | O BFF continua sendo a única fronteira entre frontend e PlugNotas. |
| **DP-ROB-04** | O produto não reabre suporte a `login`/`senha` de prefeitura neste ciclo. |
| **DP-ROB-05** | Robustez será tratada como classificação de cenários e preservação de causalidade, não como nova arquitetura paralela. |

---

## 12. Critérios de aceite

- [ ] O PRD explicita os seis cenários obrigatórios do fluxo robusto.
- [ ] O PRD mantém `POST /empresa` como endpoint upstream canónico.
- [ ] O PRD mantém `POST /api/mei-notas/setup/emissao-fiscal/empresa` como rota interna oficial do produto.
- [ ] O PRD explicita os metadados mínimos backend -> frontend/operação.
- [ ] O PRD preserva a política NATEX de exceção municipal bloqueada.
- [ ] O PRD distingue claramente ambiente, payload, conflito, exceção municipal e `GET` negativo posterior.

---

## 13. Métricas de sucesso

| Métrica | Sinal desejado |
|---------|----------------|
| Qualidade de triagem | redução de leituras erradas de “endpoint errado” |
| Consistência de UX | mensagens alinhadas ao cenário real do fluxo |
| Robustez operacional | menos ambiguidades entre `POST`, fallback e `GET` posterior |
| Eficiência de suporte/QA | classificação rápida entre ambiente, payload, conflito e exceção municipal |

---

## 14. Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Time voltar a discutir rota errada em vez de cenário real | retrabalho e atraso | reforçar FR-ROB-04/05/07 e documentação operacional |
| Fallback `PATCH` ser comunicado como erro | confusão de utilizador e suporte | separar explicitamente created/updated/existing em UX e QA |
| `GET` negativo apagar a história do `POST` | diagnóstico incorreto | manter causalidade como requisito funcional explícito |
| Exceção municipal voltar a contaminar a jornada padrão | desvio de produto e segurança | preservar DP-ROB-04 e FR-ROB-08 |

---

## 15. Dependências e desdobramentos

| Área | Desdobramento esperado |
|------|------------------------|
| @ux-design-expert | spec UX para estados de sucesso, sincronização, bloqueio e triagem |
| @architect | arquitetura técnica da classificação de cenários, fallback e observabilidade |
| @sm | stories separadas para backend, frontend e operação/QA |
| @qa | regressão orientada a cenários, incluindo causalidade `POST` -> `PATCH` -> `GET` |

---

## 16. Change log

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 2026-04-10 | PRD inicial derivado do brief de robustez do cadastro de empresa PlugNotas por cenários. |

---

*PRD brownfield para evolução robusta do cadastro de empresa PlugNotas na Guia MEI, preservando NFS-e Nacional como padrão, fallback operacional e exceção municipal bloqueada.*
