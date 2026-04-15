# Brief: cadastro de empresa PlugNotas robusto para NFS-e Nacional, fallback e exceções municipais

**Data:** 2026-04-10  
**Origem:** consolidação analítica após incidentes recorrentes no cadastro de empresa via Guia MEI, incluindo erro municipal `prefeitura.login obrigatório`, consulta `GET` negativa após `POST` falho e dúvidas sobre endpoint/configuração.  
**Produto:** Meu Financeiro — Guia MEI / setup de emissão fiscal com PlugNotas.  
**Natureza:** brief brownfield para evolução de robustez do fluxo existente, sem inventar nova arquitetura fora do BFF já adoptado.

**Referências relacionadas:**

- [`docs/brief/brief-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](./brief-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md)
- [`docs/brief/brief-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](./brief-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md)
- [`docs/prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](../prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md)
- [`docs/technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](../technical/architecture-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md)
- [`docs/technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](../technical/architecture-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md)
- [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)

---

## 1. Resumo executivo

O cadastro de empresa no PlugNotas já tem uma base funcional correcta:

- frontend chama o BFF em `POST /api/mei-notas/setup/emissao-fiscal/empresa`;
- backend chama o PlugNotas em `POST /empresa`;
- em conflito, o backend pode tentar `PATCH /empresa/:cnpj`;
- a consulta de verificação usa `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=...` e, upstream, `GET /empresa/:cnpj`.

O problema actual não é apenas “fazer um POST”. O problema é tornar esse cadastro **robusto** diante de cenários reais:

1. ambiente configurado de forma incoerente;
2. payload rejeitado por IBGE ou contrato;
3. empresa já existente com necessidade de fallback;
4. exceção municipal em que o emissor exige `prefeitura.login` / `senha`;
5. leitura errada do `GET` negativo como se fosse causa raiz.

Este brief propõe uma evolução de robustez do fluxo, não um redesenho total. A jornada continua **NFS-e Nacional por padrão**, via **BFF**, sem chamada directa browser -> PlugNotas e sem transformar exceção municipal em regra geral.

---

## 2. Problema que este brief fecha

Hoje o time já resolveu partes do problema separadamente:

- endpoint canónico `POST /empresa`;
- narrativa correcta para `POST` falho -> `GET` negativo;
- política NATEX para bloquear credenciais municipais no fluxo nacional;
- matriz operacional para triagem.

Ainda assim, falta uma visão unificada de “cadastro robusto” que responda à pergunta:

> O que o fluxo precisa garantir para funcionar bem em cenários bons, ambíguos e degradados?

Sem isso, cada incidente tende a virar uma leitura incompleta:

- “o endpoint está errado”;
- “é só problema de frontend”;
- “é só problema do PlugNotas”;
- “é só um município estranho”;
- “o GET 404 prova que a rota está errada”.

Este brief fecha essa lacuna e organiza a robustez por cenários.

---

## 3. Princípios orientadores

### 3.1 Fluxo principal preservado

O desenho principal continua sendo:

- UI -> BFF -> PlugNotas
- `POST /empresa` como operação canónica de cadastro
- `PATCH /empresa/:cnpj` como fallback operacional
- `GET /empresa/:cnpj` como verificação posterior

### 3.2 NFS-e Nacional continua padrão

O produto continua orientado a **NFS-e Nacional** como jornada principal.

Isso implica:

- sem campos municipais como requisito padrão da UI;
- sem aceitação de `login`/`senha` de prefeitura no percurso nacional actual;
- exceção municipal tratada como exceção explícita, não como regra do fluxo.

### 3.3 Robustez é comportamento previsível em cenários degradados

O fluxo robusto não é apenas “funcionar quando tudo está certo”.  
Ele precisa:

- falhar de forma classificável;
- preservar causalidade entre operações;
- expor metadados úteis para UI, QA e operação;
- evitar diagnóstico errado de rota/endpoint.

---

## 4. Cenários que o cadastro robusto precisa cobrir

### Cenário A — sucesso nacional padrão

Condição:

- ambiente coerente;
- token correcto;
- payload aceite pelo emissor;
- sem exigência municipal excepcional.

Resultado esperado:

- `POST /empresa` bem-sucedido;
- eventual `GET` posterior encontra a empresa;
- UX confirma cadastro/sincronização sem linguagem técnica desnecessária.

### Cenário B — erro de ambiente/configuração

Condição:

- `PLUGNOTAS_API_BASE_URL`, `PLUGNOTAS_API_PATH_PREFIX` ou token incoerentes;
- possível mistura sandbox/produção.

Resultado esperado:

- erro classificável como ambiente/configuração;
- sem confundir esse caso com payload ou endpoint errado;
- evidência operacional suficiente para triagem rápida.

### Cenário C — rejeição de payload/contrato

Condição:

- erro como `codigoCidade`, tabela IBGE, dados obrigatórios ou contrato do emissor.

Resultado esperado:

- erro apresentado como rejeição de dados/contrato;
- manutenção do `plugnotasRequest`, `plugnotasCode` e `httpStatus` quando existirem;
- sem narrativa de rota errada.

### Cenário D — empresa já existente / fallback

Condição:

- `POST /empresa` não cria porque a empresa já existe ou entra em conflito recuperável.

Resultado esperado:

- backend tenta `PATCH /empresa/:cnpj` quando a policy assim determinar;
- UI comunica “sincronizado/actualizado” em vez de erro arquitectural;
- operação consegue distinguir `created`, `updated` e `existing`.

### Cenário E — exceção municipal bloqueada

Condição:

- PlugNotas exige `prefeitura.login` / `senha` para aquele município/conta/caso.

Resultado esperado:

- fluxo não recolhe credenciais;
- backend classifica o caso como exceção municipal bloqueada;
- UI informa limitação sem sugerir rota errada;
- operação regista `não suportado no fluxo nacional`.

### Cenário F — `GET` negativo após `POST` falho

Condição:

- o cadastro falha no `POST`;
- depois o sistema consulta `GET /empresa/:cnpj`.

Resultado esperado:

- `GET` negativo é tratado como consequência;
- a causa raiz continua sendo o erro do `POST`;
- UX e operação preservam essa causalidade.

---

## 5. Capacidades que a solução robusta deve ter

1. **Classificação estável de erro**
   - ambiente/configuração
   - payload/contrato
   - conflito com fallback
   - exceção municipal bloqueada
   - empresa não encontrada após falha anterior

2. **Metadados úteis entre backend e frontend**
   - `plugnotasRequest.method`
   - `plugnotasRequest.path`
   - `plugnotasCode`
   - `httpStatus`

3. **Observabilidade redigida**
   - logs e respostas úteis sem expor segredo;
   - evidência suficiente para QA e suporte.

4. **Causalidade operacional preservada**
   - o resultado do `GET` não pode apagar a história do `POST`;
   - o fallback `PATCH` não pode parecer erro de rota.

5. **Narrativa UX consistente**
   - sem expor detalhes internos como problema principal;
   - sem pedir dados municipais fora da policy actual;
   - sem prometer suporte onde o produto decidiu bloquear.

---

## 6. Decisões que este brief recomenda preservar

1. Manter o **BFF** como única fronteira com o PlugNotas.
2. Manter `POST /empresa` como endpoint upstream canónico.
3. Não expor chave PlugNotas nem lógica sensível no frontend.
4. Não reabrir `login`/`senha` de prefeitura como requisito padrão da jornada.
5. Tratar a exceção municipal como caso suportado operacionalmente na triagem, mas **não suportado no fluxo nacional actual**.

---

## 7. O que robustez não significa

Este brief **não** recomenda:

- criar uma nova rota visual “add company”;
- trocar o desenho BFF por chamada directa ao PlugNotas no browser;
- assumir que toda falha de cadastro vem de endpoint errado;
- transformar todos os municípios em fluxo municipal-first;
- aceitar credenciais municipais no produto sem novo ciclo formal de decisão.

---

## 8. Escopo sugerido para próximos artefatos

### Dentro do escopo

- PRD de robustez do cadastro empresa;
- especificação UX para estados de sucesso, sincronização, bloqueio e triagem;
- arquitectura técnica de classificação de cenários;
- stories separadas para backend, frontend e operação/QA.

### Fora do escopo

- mudança de provedor fiscal;
- rollout de suporte municipal completo;
- redesign integral da Guia MEI;
- resolver por documentação o que exigir mudança de contrato com o provedor.

---

## 9. Critérios de sucesso para o PRD derivado

O próximo PRD deve explicitar:

1. quais cenários são obrigatórios para o fluxo robusto;
2. quais códigos/metadados o backend deve devolver;
3. como o frontend deve reagir a cada classe de erro;
4. como o fallback `POST` -> `PATCH` é comunicado;
5. como o `GET` posterior preserva causalidade;
6. como operação/QA diferenciam:
   - ambiente
   - payload
   - conflito
   - exceção municipal
   - ausência real da empresa

---

## 10. Recomendação do analyst

Recomendação: criar uma iniciativa específica de **robustez do cadastro empresa PlugNotas**, acima dos fixes pontuais já feitos.

Essa iniciativa deve tratar o cadastro como um **fluxo resiliente e classificável**, e não apenas como uma chamada HTTP isolada.

O melhor desdobramento é:

1. `@pm` escrever um PRD focado em robustez por cenários;
2. `@ux-design-expert` detalhar as respostas de interface e copy;
3. `@architect` formalizar a máquina de decisão backend/BFF;
4. `@sm` derivar stories separadas para:
   - backend de classificação e fallback;
   - frontend/UX de estados e mensagens;
   - operação/QA com matriz canónica consolidada.

---

## Change log

| Data | Nota |
| --- | --- |
| 2026-04-10 | Versão inicial do brief para orientar uma evolução robusta do cadastro de empresa PlugNotas, cobrindo cenário nacional padrão, fallback, rejeições de payload, ambiente e exceções municipais. |
