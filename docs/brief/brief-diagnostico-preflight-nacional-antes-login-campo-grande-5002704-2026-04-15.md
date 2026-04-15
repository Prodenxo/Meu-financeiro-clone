# Brief: diagnóstico final — preflight municipal PlugNotas (`padraoNacional` vs `requiresLogin`)

**Data:** 2026-04-15  
**Agente:** Atlas (Business Analyst, AIOX)  
**Contexto:** branch **Leo-Main** (ambiente local); cadastro de empresa com NFS-e ativa e triagem municipal antes de `POST /empresa` no PlugNotas.  
**Produto:** Meu Financeiro — Guia MEI / setup de emissão fiscal.

---

## Resumo executivo

| Item | Detalhe |
|------|---------|
| Sintoma | `HTTP 400` com `errors.plugnotasCode = prefeitura_login_required_blocked` ao cadastrar empresa. |
| Município exemplo | Campo Grande, MS — IBGE **5002704**. |
| Origem dos dados | Preflight municipal (`GET` de cidade no PlugNotas, ex.: `/nfse/cidades/{codigoIbge}` conforme integração). |
| Causa raiz | **Ordem de prioridade invertida** na decisão de runtime: o fluxo trata **login/senha exigidos** antes de reconhecer **`padraoNacionalEnabled === true`**, bloqueando cidades onde a emissão pode seguir pelo **NFS-e Nacional** sem credenciais do portal municipal. |
| Direção de correção | Avaliar **`padraoNacionalEnabled === true` primeiro**. Se o modo nacional está habilitado, prosseguir com cenário `success_nacional` (sem exigir credenciais municipais para esse ramo). Só aplicar bloqueio por `requiresLogin` / `requiresSenha` quando o **nacional não** estiver disponível (ou quando a política de produto exigir explicitamente outro ramo). |
| Ficheiro-alvo | `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js` — lógica agregada em `resolveEmpresaCadastroMunicipioRuntimeDecision` e consumida por `evaluateEmpresaCadastroMunicipioPreflight`. |

---

## O que o PlugNotas devolve (exemplo Campo Grande)

Para o IBGE `5002704`, o preflight pode devolver **simultaneamente**:

- `padraoNacionalEnabled: true` — município com modo nacional disponível (emissão não depende do portal municipal para o ramo nacional).
- `requiresLogin: true` — o município também assinala necessidade de login da prefeitura em outros contextos ou metadados.

Interpretação de negócio para o fix: quando **nacional está ativo**, a emissão alinhada ao fluxo nacional **não** deve ser barrada só porque `requiresLogin` é `true`; o bloqueio por credenciais municipais aplica-se quando **não** há nacional **ou** quando a tentativa é explicitamente municipal e as credenciais são obrigatórias (conforme matriz de governança do produto).

---

## Mecanismo do bug (comportamento incorreto)

1. Antes do `POST /empresa`, o backend consulta metadados do município.
2. A função de decisão avalia `requiresLogin` / `requiresSenha` **no mesmo patamar ou antes** de conceder `success_nacional` quando `padraoNacionalEnabled === true`.
3. Para Campo Grande, ambos os flags vêm verdadeiros: o ramo de “login obrigatório” **ganha** e devolve `prefeitura_login_required_blocked` com `upstreamCallSkipped = true`, **sem** atingir o cenário nacional.

Resultado: cidade **com nacional habilitado** é bloqueada de forma **injusta** para o fluxo nacional.

---

## Correção pretendida (especificação)

**Regra:** se `preflight.padraoNacionalEnabled === true`, retornar decisão de sucesso nacional (`success_nacional` / `allowUpstream: true` conforme o modelo atual) **antes** de tratar bloqueio por `requiresLogin` ou `requiresSenha`.

**Regra complementar:** bloquear por `prefeitura_login_required_blocked` (ou equivalente) quando **não** houver nacional **e** o município exigir login/senha, ou quando a governança de produto (credenciais parciais, modo municipal, etc.) mandar outro ramo — mantendo coerência com `buildRuntimeDecisionFromPreflight` e testes existentes.

> Nota de implementação: o repositório pode já ter refatorado `evaluateEmpresaCadastroMunicipioPreflight` para delegar em `resolveEmpresaCadastroMunicipioRuntimeDecision`; o ajuste deve ocorrer na **ordem e condições** dessa resolução, não necessariamente num único `if` isolado, desde que o comportamento acima fique garantido e coberto por testes.

---

## Referências cruzadas

- [`docs/brief/brief-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](./brief-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) — contexto anterior da recorrência e análise de política; **este brief de 2026-04-15** consolida o **diagnóstico de causa raiz** e a **direção de fix** (priorizar nacional quando `padraoNacionalEnabled` é verdadeiro).
- [`docs/brief/brief-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](./brief-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) — triagem municipal e contrato oficial.
- Documentação PlugNotas: consulta de cidade / metadados e cadastro de empresa (`addCompany`).

---

## Próximos passos sugeridos (não executados neste brief)

1. Alterar a decisão em `empresa-cadastro-runtime-decision.js` conforme a regra acima.
2. Adicionar ou ajustar testes unitários para o par (`padraoNacionalEnabled: true`, `requiresLogin: true`, IBGE `5002704`).
3. Correr `npm run lint`, `npm run typecheck` e `npm test` no backend conforme quality gates do projeto.

---

*Briefing redigido para alinhamento de produto e desenvolvimento; não substitui story em `docs/stories/` nem PRD, mas informa decisão técnica e de negócio para implementação.*
