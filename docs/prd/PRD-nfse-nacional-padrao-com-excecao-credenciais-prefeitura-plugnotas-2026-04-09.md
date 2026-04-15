# PRD — NFS-e Nacional como padrão com exceção explícita para credenciais de prefeitura no PlugNotas

**Versão:** 1.0  
**Data:** 2026-04-09  
**Tipo:** Brownfield — Guia MEI / setup de emissão fiscal (`POST /api/mei-notas/setup/emissao-fiscal/empresa`)  
**Fonte do briefing:** [`docs/brief/brief-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](../brief/brief-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md)

**Referência externa (contrato):** [Documentação da API PlugNotas (Postman)](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest)

---

## Relação com outros artefatos

| Artefato | Papel |
|----------|-------|
| [`PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](./PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) | Define o objetivo original do produto: **NFS-e Nacional** como experiência principal, sem IM/prefeitura no formulário padrão. |
| [`PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](./PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | Trata o sintoma específico `prefeitura.login obrigatório` e as políticas PLOGIN. |
| [`docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | Fronteiras técnicas, segurança e pontos de extensão no BFF para exceções municipais. |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Runbook canónico de triagem, ambiente, fallback e exceções PlugNotas. |
| [`docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`](../adr/ADR-plugnotas-nfse-nacional-empresa-spike.md) | Regista o contrato adotado para o modo nacional e o risco de divergência por conta/ambiente. |
| [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md) | Política de payload apenas NFS-e no cadastro da empresa. |

---

## 1. Resumo executivo

O Meu Financeiro deve manter **NFS-e Nacional** como a **política padrão de produto** no fluxo MEI. Em termos práticos:

- a jornada principal continua nacional-first;
- o utilizador não deve ser levado a um fluxo municipal por padrão;
- inscrição municipal, prefeitura, login e senha de portal municipal não são requisitos padrão da UI.

Ao mesmo tempo, o produto precisa assumir explicitamente que o PlugNotas pode impor **exceções municipais** em alguns contextos reais de conta / município / padrão fiscal. O erro **`fields.nfse.config.prefeitura.login: Preenchimento obrigatório`** mostra que o emissor pode rejeitar um cadastro “nacional puro” mesmo quando a intenção funcional do produto é NFS-e Nacional.

Este PRD fecha essa ambiguidade com a seguinte decisão:

1. **Regra de produto:** NFS-e Nacional permanece o modo padrão do fluxo MEI.
2. **Política para exceções:** quando o emissor exigir credenciais municipais, o produto **não** muda seu posicionamento para “municipal por padrão”; em vez disso, trata o caso como **exceção explícita**.
3. **Decisão recomendada:** adotar **Policy B — bloquear a exceção no produto**, preservando a UX nacional como padrão e deixando explícito que login/senha de prefeitura ficam fora do frontend e do backend deste fluxo.

---

## 2. Problema a ser resolvido

Hoje existe uma tensão entre:

| Dimensão | Realidade |
|----------|-----------|
| **Produto** | O fluxo MEI foi concebido para ser **sempre NFS-e Nacional**. |
| **Upstream** | O PlugNotas pode exigir `nfse.config.prefeitura.login` / `senha` em casos reais, mesmo dentro de um contexto de uso que o produto quer tratar como nacional. |

Sem política explícita, o time cai em diagnósticos ruins:

- confundir erro de contrato/política do emissor com erro de endpoint;
- supor que “NFS-e Nacional” elimina todo requisito municipal;
- transformar a exceção em requisito padrão da jornada;
- ou bloquear a evolução por falta de decisão de produto.

Este PRD existe para impedir essa deriva.

---

## 3. Objetivos

1. Preservar **NFS-e Nacional** como padrão do produto no fluxo MEI.
2. Separar claramente:
   - **modo padrão nacional**
   - **exceção municipal exigida pelo emissor**
3. Definir política de produto para quando o PlugNotas exigir `prefeitura.login` / `senha`, sem introduzir esses campos no frontend ou backend do fluxo MEI.
4. Garantir que frontend, backend, UX, operação e QA trabalhem com a mesma interpretação.
5. Reduzir retrabalho e discussões sobre “rota errada” quando o problema real for política/contrato do emissor.

---

## 4. Não objetivos

- Transformar a Guia MEI em um produto municipal-first.
- Garantir que todos os municípios e contas aceitem sempre cadastro nacional puro.
- Alterar o provedor fiscal.
- Definir qualquer implementação de recolha, trânsito, persistência ou envio de credenciais municipais.

---

## 5. Contexto de produto

O fluxo MEI já foi orientado para **NFS-e Nacional**, com ausência intencional de IM/prefeitura como campos obrigatórios no formulário. Entretanto, a documentação e a reprodução de erro mostram que o PlugNotas pode, em determinados cenários, exigir credenciais municipais mesmo quando o caso de uso do produto continua sendo “emissão nacional”.

Logo:

- o erro atual **não invalida** a estratégia nacional;
- o erro atual **não prova** que a rota esteja errada;
- o erro atual **não obriga** o produto a virar municipal por padrão;
- o erro atual **obriga** o produto a definir uma política explícita de exceção.

---

## 6. Personas e necessidades

| Persona | Necessidade |
|---------|-------------|
| **MEI** | Configurar emissão fiscal em modo nacional sem ser empurrado para um fluxo técnico municipal por padrão. |
| **Suporte / operação** | Distinguir rapidamente entre erro de ambiente, erro de payload e exceção municipal com credencial obrigatória. |
| **Produto / PO** | Ter uma decisão clara de bloquear exceções municipais neste fluxo, sem login/senha no frontend ou backend. |
| **Dev / Architect / QA** | Implementar e testar uma política única, sem ambiguidade de negócio. |

---

## 7. Decisão de produto

### 7.1 Regra principal

O fluxo MEI continua **NFS-e Nacional por padrão**.

Implicações:

- o formulário padrão não exige IM, prefeitura ou credenciais municipais;
- a narrativa UX continua sendo nacional-first;
- documentação e suporte devem refletir isso.

### 7.2 Política recomendada para exceções

**Policy B — bloquear exceção no produto** é a política recomendada neste PRD.

Justificativa:

- preserva a simplicidade do fluxo nacional-first;
- elimina a necessidade de coletar ou trafegar login/senha de prefeitura;
- reduz superfície de segurança, suporte e manutenção;
- evita transformar requisito municipal residual em parte do contrato padrão do produto.

### 7.3 Condições da Policy B

A adoção da Policy B implica:

- o frontend **não** exibe campos de login/senha de prefeitura neste fluxo;
- o backend **não** aceita nem encaminha login/senha de prefeitura neste fluxo;
- quando o emissor exigir credenciais municipais, o produto bloqueia o cadastro nesse contexto com mensagem clara e orientação operacional;
- stories posteriores devem definir a copy, a classificação do erro e a política de evidência, não a coleta de credenciais.

### 7.4 Política descartada neste PRD

**Policy A — suportar exceção com credenciais** fica explicitamente fora da decisão atual.

Ela só poderá ser retomada em novo ciclo de produto se houver:

- novo brief e novo PRD aprovados;
- revisão de arquitetura e segurança;
- decisão explícita de ampliar o escopo do produto para esse tipo de exceção.

---

## 8. Escopo

### 8.1 Dentro do escopo

- formalizar a decisão “NFS-e Nacional padrão + exceção bloqueada no produto”;
- alinhar backlog para UX, backend, operação e QA;
- preservar o fluxo nacional como principal;
- definir requisitos de bloqueio e comunicação da exceção municipal;
- atualizar a documentação operacional e de produto para refletir essa política.

### 8.2 Fora do escopo

- construção imediata de todas as telas e regras detalhadas;
- cobertura universal de todos os municípios;
- definição de regras legais/fiscais fora do contrato PlugNotas;
- substituir a estratégia nacional pelo modo municipal.

---

## 9. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-NATEX-01** | O produto deve manter **NFS-e Nacional** como narrativa e política padrão do fluxo MEI. |
| **FR-NATEX-02** | O formulário padrão da Guia MEI não deve exigir IM, prefeitura, login ou senha municipais como requisitos gerais do percurso principal. |
| **FR-NATEX-03** | Quando o emissor devolver erro explícito de credencial municipal, o sistema deve tratar isso como **exceção de compatibilidade do emissor**, não como “rota errada” nem como mudança da política padrão do produto. |
| **FR-NATEX-04** | O frontend não deve coletar `nfse.config.prefeitura.login` ou `senha` neste fluxo. |
| **FR-NATEX-05** | O backend não deve aceitar nem encaminhar `nfse.config.prefeitura.login` ou `senha` neste fluxo. |
| **FR-NATEX-06** | A UX derivada deve distinguir visualmente o fluxo padrão nacional do cenário excepcional bloqueado, sem transformar a exceção em requisito default da jornada. |
| **FR-NATEX-07** | O runbook deve classificar `prefeitura.login obrigatório` como exceção municipal **não suportada** neste fluxo, distinta de endpoint errado, tabela IBGE e ausência simples de `prefeitura`. |
| **FR-NATEX-08** | A operação e o QA devem conseguir registrar evidência suficiente para distinguir: ambiente/configuração, payload/contrato e exceção municipal bloqueada por decisão de produto. |
| **FR-NATEX-09** | A solução derivada deve preservar a causalidade correta entre `POST /empresa`, fallback `PATCH` e `GET` posterior, sem reabrir a tese de endpoint errado. |

---

## 10. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| **NFR-NATEX-01** | A solução não deve introduzir coleta, persistência, trânsito ou log de login/senha de prefeitura no frontend ou backend deste fluxo. |
| **NFR-NATEX-02** | O frontend não deve exibir campos de credenciais municipais nem persistir esse tipo de dado em storage local neste fluxo. |
| **NFR-NATEX-03** | O backend não deve expandir o contrato do fluxo para aceitar ou encaminhar credenciais municipais neste PRD. |
| **NFR-NATEX-04** | A solução deve continuar distinguindo exceção municipal de erro de ambiente e erro de payload. |
| **NFR-NATEX-05** | Toda implementação derivada deve passar pelos gates do projeto: `npm run lint`, `npm run typecheck` e `npm test`. |

---

## 11. Hipóteses

1. O fluxo nacional continua sendo a melhor experiência default para o público MEI.
2. A exigência de `prefeitura.login` ocorre em subconjunto de municípios/contas, não como regra universal do produto.
3. Bloquear a exceção no produto é suficiente para preservar a proposta nacional sem ampliar a superfície de segurança do sistema.

---

## 12. Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| A exceção municipal virar requisito padrão da UX | Alta confusão do utilizador e regressão de produto | Manter FR-NATEX-01/02/06 explícitos em stories e spec UX |
| Reintrodução de login/senha por implementação futura não alinhada | Alto risco de segurança e desvio de escopo | NFR-NATEX-01/02/03 + revisão @architect |
| Divergência por município/conta maior do que o esperado | Aumento de suporte e bloqueios operacionais | Operação/QA com matriz por cenário e comunicação clara de limitação |
| Time interpretar o erro como endpoint errado | Rework técnico e atraso | Runbook, UX e stories reforçando causalidade e classificação correta |

---

## 13. Métricas de sucesso

| Métrica | Sinal desejado |
|---------|----------------|
| Clareza de produto | A equipa deixa de tratar `prefeitura.login obrigatório` como bug de rota |
| Consistência UX | Jornada padrão continua nacional-first sem campos municipais obrigatórios por defeito |
| Cobertura operacional | Casos com exigência municipal deixam de ficar ambíguos e passam a ser bloqueados com política definida |
| Qualidade de triagem | Suporte e QA distinguem corretamente ambiente, payload e exceção municipal não suportada |

---

## 14. Critérios de aceite do PRD

1. O documento declara explicitamente que **NFS-e Nacional é o padrão de produto**.
2. O documento escolhe uma política para a exceção `prefeitura.login obrigatório`.
3. O documento separa com clareza:
   - fluxo padrão nacional;
   - exceção municipal bloqueada por decisão de produto;
   - riscos e NFRs de segurança.
4. O documento fornece base suficiente para derivação de:
   - spec UX;
   - arquitetura técnica;
   - stories de frontend/backend/operação/QA.

---

## 15. Desdobramentos esperados

| Agente / disciplina | Entrega esperada |
|---------------------|------------------|
| **@ux-design-expert** | Spec UX para “nacional por padrão” com narrativa de bloqueio quando houver exigência municipal |
| **@architect** | Arquitetura técnica para bloquear a exceção sem introduzir login/senha no contrato do fluxo |
| **@sm** | Stories separadas para frontend, backend, operação e QA alinhadas ao bloqueio da exceção |
| **@qa** | Estratégia de testes e matriz de cenários para nacional puro vs exceção municipal não suportada |

---

## 16. Rastreabilidade

| Fonte | Cobertura neste PRD |
|-------|----------------------|
| Brief “NFS-e Nacional padrão + exceção” | §1, §3, §7 |
| PRD “NFS-e Nacional sem IM/prefeitura” | §5, §7, §9 |
| PRD “prefeitura.login obrigatório” | §2, §7, §9, §10 |
| Runbook operacional | §9, §13 |

---

## Change log

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-04-09 | PRD inicial derivado do brief `brief-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`, consolidando “NFS-e Nacional” como padrão de produto e adotando como recomendação a Policy A de suporte à exceção municipal com credenciais. |
| 1.1 | 2026-04-10 | PRD revisto para retirar login/senha de prefeitura do frontend e do backend deste fluxo, adotando como política recomendada a Policy B de bloqueio da exceção no produto. |
