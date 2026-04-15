# Brief: NFS-e Nacional como padrão no produto, com exceção explícita para credenciais de prefeitura no PlugNotas

**Data:** 2026-04-09  
**Origem:** decisão de produto em brainstorm pós-reprodução do erro `fields.nfse.config.prefeitura.login: Preenchimento obrigatório` no cadastro da empresa via Guia MEI.  
**Produto:** Meu Financeiro — Guia MEI / setup de emissão fiscal (certificado A1 + cadastro da empresa no PlugNotas).

**Referências relacionadas (não substituídas por este brief):**

- [`docs/brief/brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md`](./brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md) — objetivo original de produto: fluxo MEI orientado a **NFS-e Nacional**, sem inscrição municipal e sem seleção de prefeitura no formulário.
- [`docs/brief/brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](./brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) — sintoma real observado: o PlugNotas pode exigir `prefeitura.login` no cadastro da empresa.
- [`docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) — decisão de política e requisitos condicionais PLOGIN.
- [`docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) — fronteiras técnicas e pontos de extensão no BFF.
- [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — runbook e triagem operacional canónica.

---

## 1. Resumo executivo

O produto deve continuar tratando **NFS-e Nacional** como o **modo padrão e preferencial** do fluxo MEI. Isso significa:

- o utilizador **não** deve ser conduzido a um fluxo municipal por padrão;
- o formulário **não** deve nascer exigindo inscrição municipal, prefeitura, login ou senha de portal municipal;
- a narrativa principal do produto continua sendo “configurar emissão fiscal em modo nacional”.

Contudo, a reprodução real mostra que essa decisão de produto **não garante** que o emissor PlugNotas aceite sempre um cadastro “nacional puro”. Em alguns contextos de conta / município / padrão fiscal, o upstream pode responder **400** exigindo **`nfse.config.prefeitura.login`**.

Portanto, a mudança necessária não é abandonar NFS-e Nacional como padrão, mas **formalizar a exceção**:

1. **Padrão de produto:** sempre NFS-e Nacional.  
2. **Exceção operacional/técnica:** quando o PlugNotas exigir autenticação municipal, o sistema precisa ter política explícita para tratar isso, em vez de tratar o caso como “erro de rota” ou como regra geral do fluxo MEI.

---

## 2. Problema que este brief fecha

Hoje há duas verdades parcialmente conflitantes:

| Dimensão | Verdade |
|----------|---------|
| **Produto** | O fluxo MEI quer ser **sempre NFS-e Nacional**. |
| **Upstream real** | O PlugNotas pode exigir `prefeitura.login` / `senha` para determinados cenários, mesmo quando o objetivo funcional é NFS-e Nacional. |

Sem uma decisão explícita, a equipa tende a oscilar entre leituras erradas:

- “o endpoint está errado”;
- “basta usar NFS-e Nacional e o erro desaparece”;
- “todo mundo precisa de credencial municipal”;
- “o produto deve virar municipal”.

Nenhuma dessas conclusões é suficientemente precisa.

---

## 3. Decisão de produto proposta

### 3.1 Regra principal

O Meu Financeiro deve assumir **NFS-e Nacional como política padrão do fluxo MEI**.

Implicações:

- a UI continua simples e orientada ao modo nacional;
- não se cria seleção de prefeitura como passo obrigatório padrão;
- não se comunica ao utilizador que o fluxo é “municipal” por default.

### 3.2 Exceção obrigatória

Quando o emissor retornar erro explícito de credencial municipal, o produto deve tratar isso como **exceção de compatibilidade do emissor**, não como negação da estratégia “nacional por padrão”.

Essa exceção precisa de uma política formal. As duas opções válidas são:

1. **Suportar a exceção**
   - recolher e enviar `nfse.config.prefeitura.login` / `senha` quando o caso concreto exigir;
   - manter “NFS-e Nacional” como narrativa principal, mas com suporte a exceções municipais.

2. **Bloquear a exceção**
   - não recolher credenciais no produto;
   - detectar ou classificar esse cenário e orientar claramente que aquele emissor/município exige requisito não suportado no fluxo atual.

Este brief **não** escolhe sozinho entre as duas políticas; ele fixa que a escolha é necessária e que o padrão de produto continua sendo nacional.

---

## 4. Objetivos

1. Preservar o posicionamento do fluxo MEI como **NFS-e Nacional por padrão**.
2. Evitar que exceções de credencial municipal contaminem a UX principal como se fossem regra geral.
3. Formalizar que `prefeitura.login obrigatório` é uma **exceção tratável**, não evidência de endpoint errado.
4. Forçar backlog e documentação a distinguirem:
   - **modo padrão nacional**
   - **exceção municipal exigida pelo emissor**
5. Reduzir retrabalho de diagnóstico, evitando discussões repetidas sobre rota/endpoint quando o problema real for contrato/política do emissor.

---

## 5. Escopo sugerido

### Dentro do escopo

- decisão de produto sobre como tratar a exceção `prefeitura.login obrigatório`;
- alinhamento de PRD, spec UX e arquitetura para “padrão nacional + exceção explícita”;
- narrativa UX que preserve “NFS-e Nacional” como padrão sem esconder a exceção;
- runbook e QA com distinção operacional entre:
  - nacional puro suportado;
  - nacional com exigência municipal excepcional;
  - cenário não suportado sem credenciais.

### Fora do escopo

- redesenhar o fluxo completo para um produto municipal-first;
- assumir que todos os municípios aceitarão sempre cadastro nacional puro;
- alterar o provedor fiscal;
- definir implementação detalhada de armazenamento de credenciais sem passar por PRD/arquitetura.

---

## 6. Hipóteses de trabalho

1. O utilizador final continua entendendo melhor um fluxo “nacional” do que um fluxo cheio de parâmetros municipais.
2. O erro `prefeitura.login obrigatório` não invalida a estratégia nacional; ele revela uma **restrição residual do emissor**.
3. O mesmo produto pode manter uma UX principal nacional e ainda assim suportar ou bloquear exceções municipais com clareza.
4. O risco maior hoje é de **ambiguidade de política**, não apenas de bug técnico isolado.

---

## 7. Perguntas que precisam virar decisão

1. O produto vai **suportar** credenciais municipais quando o PlugNotas exigir, ou vai **bloquear** esses casos?
2. Se suportar, isso vale:
   - para todos os municípios que exigirem?
   - só para municípios validados?
   - só atrás de feature flag?
3. Se bloquear, qual a mensagem e o critério operacional para declarar “município/conta não suportado no fluxo nacional atual”?
4. Qual será a política de evidência para provar quando um erro é:
   - ambiente/configuração;
   - payload/contrato;
   - exceção municipal com credencial obrigatória?

---

## 8. Critérios de sucesso para os próximos artefatos

1. O PRD derivado deve declarar explicitamente que **NFS-e Nacional é o padrão de produto**.
2. O PRD derivado deve escolher uma política para a exceção `prefeitura.login obrigatório`:
   - suportar
   - bloquear
3. A spec UX derivada deve evitar transformar a exceção em requisito padrão da jornada.
4. A arquitetura derivada deve separar:
   - política padrão nacional;
   - ponto de extensão para exceção municipal.
5. O runbook deve continuar distinguindo esse erro de:
   - endpoint errado;
   - IBGE inválido;
   - ausência simples de `prefeitura`.

---

## 9. Recomendação do analyst

Recomendação de negócio:

- **manter** “NFS-e Nacional sempre” como **regra principal de produto**;
- **não** reinterpretar o erro atual como prova de que o fluxo deva ser municipal por padrão;
- derivar um PRD curto de decisão com duas políticas explícitas:
  - **Policy A:** suportar exceção com credenciais;
  - **Policy B:** bloquear exceção e comunicar limitação.

Se a equipa quiser preservar maior cobertura operacional, a tendência mais pragmática é **Policy A**.  
Se a prioridade for simplicidade, segurança e menor superfície de suporte, a tendência mais conservadora é **Policy B**.

---

## 10. Próximos passos sugeridos

- `@pm`: criar PRD de decisão para “NFS-e Nacional padrão + exceção municipal”.
- `@ux-design-expert`: definir a narrativa UX para erro excepcional sem contaminar a jornada principal.
- `@architect`: fixar ponto técnico de extensão ou bloqueio no BFF.
- `@sm`: derivar stories separadas para:
  - decisão/política;
  - frontend/UX;
  - backend/segurança;
  - operação/QA.

---

## Change log

| Data | Nota |
| --- | --- |
| 2026-04-09 | Versão inicial do brief para formalizar a política “NFS-e Nacional como padrão, com exceção explícita quando o emissor exigir credenciais municipais”. |
