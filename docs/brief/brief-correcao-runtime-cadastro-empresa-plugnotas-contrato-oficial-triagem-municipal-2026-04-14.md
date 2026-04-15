# Brief: correção runtime do cadastro de empresa PlugNotas — contrato oficial e triagem municipal

**Data:** 2026-04-14  
**Origem:** diagnóstico do incidente de cadastro de empresa bloqueado no PlugNotas, confrontando o runtime atual do Meu Financeiro com o contrato oficial `addCompany`, a OpenAPI `api.json` e a rota de metadados por município `/nfse/cidades/{codigoIbge}`.  
**Produto:** Meu Financeiro — Guia MEI / setup de emissão fiscal (cadastro de certificado + cadastro de empresa no PlugNotas).  
**Natureza:** brief brownfield para correção de runtime e robustez do cadastro da empresa, sem redesenhar a arquitetura BFF existente.

**Referências relacionadas:**

- [PlugNotas — Empresa / addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany)
- [PlugNotas — Consultar disponibilidade do município e metadados](https://docs.plugnotas.com.br/#operation/getCidadeById)
- [PlugNotas — OpenAPI oficial (`api.json`)](https://docs.plugnotas.com.br/api.json)
- [`docs/brief/brief-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md`](./brief-atualizacao-docs-contrato-oficial-plugnotas-cadastro-empresa-2026-04-14.md)
- [`docs/brief/brief-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md`](./brief-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md)
- [`docs/brief/brief-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md`](./brief-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md)
- [`docs/brief/brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](./brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md)
- [`docs/stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md`](../stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md)
- [`docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md)
- [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)
- `frontend/src/utils/nfEmissionCompany.ts`
- `backend/src/services/plugnotas/empresa.service.js`
- `backend/src/services/plugnotas/prefeituraPortalCredentials.js`

---

## 0. Resumo para stakeholders internos

- O problema atual não está na emissão de notas em si; ele acontece antes, no **cadastro da empresa** no PlugNotas.
- O contrato oficial do fornecedor para NFS-e nacional hoje usa `nfse.config.nfseNacional` e `nfse.config.consultaNfseNacional`.
- O runtime atual do Meu Financeiro ainda monta o payload principal com a chave legada `nfse.nacional`.
- O runtime atual não consulta `/nfse/cidades/{codigoIbge}` antes de tentar cadastrar a empresa, perdendo o sinal oficial de `padraoNacional`, `login` e `senha`.
- O backend hoje bloqueia `prefeitura.login` e `prefeitura.senha` de forma efetiva no fluxo ativo, embora o repositório já tenha histórico de um trilho técnico condicional para esse caso.
- Este brief propõe uma iniciativa de runtime em duas camadas: corrigir o contrato nacional e introduzir triagem municipal; depois, se necessário, suportar credenciais municipais de forma controlada.

---

## 1. Resumo executivo

O Meu Financeiro já possui a arquitetura correta de alto nível para cadastrar empresa no PlugNotas:

- frontend chama o BFF em `POST /api/mei-notas/setup/emissao-fiscal/empresa`;
- backend chama o PlugNotas em `POST /empresa`;
- em conflito, o backend pode fazer fallback para `PATCH /empresa/:cnpj`.

O problema real é que o **runtime local** não está alinhado com a melhor fonte oficial hoje disponível para esse cadastro:

1. continua usando `nfse.nacional` como chave principal do modo nacional;
2. não usa a rota oficial de metadados por município antes de decidir o fluxo;
3. trata credenciais municipais como bloqueio global, mesmo em cenários em que o fornecedor as documenta formalmente no schema.

Resultado: o cadastro da empresa pode falhar antes de existir qualquer emissão, e o produto fica sem distinguir de forma robusta:

- município compatível com NFS-e Nacional;
- município que exige autenticação municipal;
- município em que o payload legado está agravando o problema.

Este brief recomenda corrigir o runtime do cadastro de empresa a partir do contrato oficial e da triagem por município, preservando o BFF como fronteira única e evitando solução improvisada apenas por texto de erro.

---

## 2. Problema que este brief quer fechar

Hoje o repositório já tem peças separadas do problema:

- endpoint canónico `POST /empresa`;
- fallback `PATCH /empresa/:cnpj`;
- narrativa de causalidade `POST` falho -> `GET` negativo;
- documentação oficial recente confirmando `nfse.config.nfseNacional`;
- backlog histórico para credenciais municipais (`DP-PLOGIN-01`).

Ainda falta uma resposta única para a pergunta:

> O que precisa mudar no runtime para a empresa conseguir ser cadastrada no PlugNotas com base no contrato oficial do fornecedor e no município real do caso?

Sem esse enquadramento, o time corre o risco de atacar apenas sintomas isolados:

- trocar copy sem corrigir o cadastro;
- corrigir só o payload nacional sem tratar municípios que exigem login;
- reabrir suporte municipal sem pré-triagem por município;
- insistir no mesmo `POST /empresa` legado sem distinguir contrato oficial de política local.

---

## 3. Achados verificados

### 3.1 Contrato oficial do fornecedor

Os achados abaixo foram verificados nas referências oficiais do PlugNotas:

| Fonte | Achado | Implicação |
|---|---|---|
| `addCompany` | O cadastro de empresa pode ter validações dinâmicas por documento e município, incluindo dados de acesso à prefeitura. | O cadastro não pode assumir que “modo nacional” elimina todas as exigências municipais. |
| `api.json` -> `cadastroEmpresa.nfse.config` | O contrato oficial documenta `nfseNacional` e `consultaNfseNacional`. | O runtime atual usa um shape legado e precisa ser revisitado. |
| `api.json` -> `cadastroEmpresa.nfse.config.prefeitura` | O schema oficial inclui `login`, `senha`, `receitaBruta`, `lei` e `dataInicio`. | `prefeitura.login` não é anomalia inventada pelo produto; é parte formal do contrato do fornecedor. |
| `/nfse/cidades/{codigoIbge}` | A resposta expõe `padraoNacional`, `login` e `senha`. | A decisão do fluxo deveria considerar o município antes do `POST /empresa`. |

### 3.2 Estado atual do runtime local

Hoje o runtime principal do Meu Financeiro:

- monta `nfse` com `config: { producao: true }` e `nacional: true`;
- não consulta `/nfse/cidades/{codigoIbge}`;
- bloqueia efetivamente qualquer `prefeitura.login` / `senha` no fluxo ativo;
- mantém em `env.js` a flag `PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED`, mas sem uso efetivo no caminho principal atual.

### 3.3 Conclusão técnica do gap

Há dois gaps distintos e cumulativos:

1. **gap de contrato nacional** — o shape principal do payload está desatualizado face ao contrato oficial;
2. **gap de decisão por município** — o sistema não consulta o metadado oficial que diria se o município suporta padrão nacional puro ou exige autenticação municipal.

---

## 4. Objetivo da iniciativa

Corrigir o runtime do cadastro de empresa PlugNotas para que ele:

1. use o contrato oficial atual como referência primária no fluxo nacional;
2. consulte o município antes de enviar o cadastro;
3. diferencie município compatível com padrão nacional de município que exige credencial municipal;
4. preserve o BFF como fronteira única;
5. permita desdobrar, de forma separada e segura, o suporte a credenciais municipais quando o caso exigir.

---

## 5. Escopo proposto

### 5.1 Bloco A — correção do contrato runtime nacional

**Objetivo:** alinhar o payload principal do cadastro da empresa ao contrato oficial atual do PlugNotas.

**Mudanças esperadas:**

- substituir a dependência principal de `nfse.nacional` por `nfse.config.nfseNacional`;
- decidir explicitamente o comportamento de `nfse.config.consultaNfseNacional`;
- alinhar frontend, backend e testes ao mesmo shape oficial;
- manter `producao`, `ativo`, `tipoContrato` e demais políticas atuais só quando coerentes com o schema oficial.

**Resultado esperado:**

- municípios compatíveis com o padrão nacional deixam de depender de um shape legado para cadastro;
- o diagnóstico passa a separar “payload errado” de “município exige fluxo municipal”.

### 5.2 Bloco B — triagem municipal antes do `POST /empresa`

**Objetivo:** decidir o fluxo de cadastro com base no município real, e não apenas no texto do erro posterior.

**Mudanças esperadas:**

- consultar `/nfse/cidades/{codigoIbge}` antes do `POST /empresa` nos cenários de cadastro/atualização relevantes;
- ler `padraoNacional` conforme o ambiente (`producao` ou `homologacao`);
- ler `login` e `senha` para saber se o município exige autenticação municipal;
- usar esse resultado para classificar o caminho do cadastro.

**Resultado esperado:**

- quando `padraoNacional` estiver ativo e `login=false` / `senha=false`, o sistema segue pelo caminho nacional oficial;
- quando `login=true` ou `senha=true`, o sistema reconhece previamente que o fluxo atual é insuficiente sem suporte municipal;
- a análise deixa de depender apenas do `400` do upstream.

### 5.3 Bloco C — suporte municipal seguro quando necessário

**Objetivo:** resolver os casos em que o município realmente exige autenticação municipal para que a empresa seja cadastrada.

**Mudanças esperadas:**

- reaproveitar ou reimplementar o trilho `DP-PLOGIN-01` de forma funcional no runtime;
- condicionar o uso de `prefeitura.login` / `senha` a decisão de produto e feature flag;
- manter trânsito seguro e redaction de logs;
- evitar persistência por defeito, salvo decisão explícita posterior.

**Resultado esperado:**

- municípios que exigem credenciais deixam de ficar bloqueados para cadastro apenas por política técnica atual;
- o produto passa a ter um caminho formal para completar o cadastro da empresa nesses casos.

---

## 6. Escopo mínimo vs escopo completo

### Escopo mínimo viável

Entregar:

1. correção do payload nacional para o contrato oficial;
2. consulta de município via `/nfse/cidades/{codigoIbge}`;
3. nova classificação técnica do fluxo antes do `POST /empresa`.

**Efeito:** destrava o cadastro onde o município já suporta padrão nacional sem autenticação municipal e melhora o diagnóstico dos restantes casos.

### Escopo completo

Entregar:

1. Bloco A;
2. Bloco B;
3. Bloco C.

**Efeito:** além de corrigir o caminho nacional, também cria caminho real para cadastrar empresa em municípios que exigem login/senha.

---

## 7. Fora de escopo deste brief

- trocar a arquitetura atual BFF por integração direta browser -> PlugNotas;
- redesenhar a Guia MEI inteira;
- alterar o provedor fiscal;
- persistir credenciais municipais por padrão;
- tratar atualização documental como se ela, sozinha, resolvesse o runtime.

---

## 8. Riscos e decisões em aberto

| Tema | Questão |
|---|---|
| `consultaNfseNacional` | Deve acompanhar `nfseNacional` por padrão, ou ser opt-in por ambiente/caso de uso? |
| Timing da triagem | A consulta de município deve ocorrer só no cadastro inicial ou também no fallback `PATCH`? |
| Política de produto | O suporte a credenciais municipais entra atrás de feature flag/piloto ou já como caminho suportado? |
| Segurança | O produto apenas transita as credenciais ou também precisará persisti-las no futuro? |
| Compatibilidade | O backend vai aceitar temporariamente os dois shapes (`nacional` legado e `config.nfseNacional`) ou migrar de forma mais direta? |

---

## 9. Critérios de sucesso para o PRD derivado

- [ ] O cadastro da empresa passa a usar o contrato oficial nacional no caminho principal.
- [ ] O sistema consulta `/nfse/cidades/{codigoIbge}` antes de concluir a decisão do fluxo.
- [ ] Municípios com `padraoNacional` compatível e sem exigência de `login` / `senha` conseguem cadastrar a empresa sem desvio municipal.
- [ ] Municípios que exigem autenticação municipal deixam de ser “surpresa” apenas depois do `POST /empresa`.
- [ ] Se o suporte municipal for incluído, existe caminho seguro e controlado para completar o cadastro com `prefeitura.login` / `senha`.
- [ ] O `GET` posterior deixa de ser o principal indicador de falha quando o cadastro da empresa for corrigido.

---

## 10. Recomendação do analyst

Recomendação: tratar esta iniciativa como **correção runtime do cadastro de empresa**, não como mero ajuste de copy ou documentação.

Sequência recomendada:

1. corrigir o contrato nacional do payload;
2. adicionar triagem por município;
3. decidir explicitamente se o produto vai suportar o caminho municipal seguro quando `login` / `senha` forem exigidos.

Se houver necessidade de fatiamento, o melhor corte é:

1. **fase 1** — `contrato oficial + triagem municipal`;
2. **fase 2** — `suporte municipal com credenciais`, atrás de policy/flag.

---

## 11. Próximos passos sugeridos

1. `@pm` ou `@po`: transformar este brief em PRD com decisão explícita sobre escopo mínimo vs escopo completo.
2. `@architect`: detalhar a máquina de decisão do BFF para contrato oficial + preflight municipal.
3. `@sm`: quebrar em stories separadas para:
   - payload/runtime nacional,
   - consulta municipal,
   - fluxo municipal com credenciais,
   - QA e operação.
4. `@qa`: preparar matriz de validação por município e ambiente.

---

## Change log

| Data | Nota |
|---|---|
| 2026-04-14 | Versão inicial do brief para correção runtime do cadastro de empresa PlugNotas, derivada do diagnóstico de contrato oficial, triagem por município e gap atual do fluxo nacional-first. |
