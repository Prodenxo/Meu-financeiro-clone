# PRD — precedência do preflight NFS-e Nacional sobre sinal de login municipal (PlugNotas)

**Versão:** 1.0  
**Data:** 2026-04-15  
**Tipo:** Brownfield — Guia MEI / setup de emissão fiscal / cadastro de empresa (`POST /api/mei-notas/setup/emissao-fiscal/empresa`)  
**Fonte do briefing:** [`docs/brief/brief-diagnostico-preflight-nacional-antes-login-campo-grande-5002704-2026-04-15.md`](../brief/brief-diagnostico-preflight-nacional-antes-login-campo-grande-5002704-2026-04-15.md)

**Referências externas (contrato PlugNotas):**

- [PlugNotas — Empresa / addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany)
- [PlugNotas — Consultar disponibilidade do município e metadados](https://docs.plugnotas.com.br/#operation/getCidadeById)
- [PlugNotas — OpenAPI oficial (`api.json`)](https://docs.plugnotas.com.br/api.json)

---

## Relação com outros artefatos

| Artefato | Papel |
|---|---|
| [`PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md`](./PRD-correcao-runtime-cadastro-empresa-plugnotas-contrato-oficial-triagem-municipal-2026-04-14.md) | Define triagem municipal, contrato nacional e decisões **DP-RTCAD-***. Este PRD **refina** a semântica quando o preflight devolve **simultaneamente** `padraoNacional` habilitado e `login`/`senha` assinalados. |
| [`docs/brief/brief-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../brief/brief-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) | Contexto da recorrência real em Campo Grande (IBGE 5002704). |
| [`PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](./PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | Cluster PLOGIN e mensagens; este PRD evita falso positivo de bloqueio quando o nacional está disponível. |
| `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js` | Onde a máquina de decisão (`resolveEmpresaCadastroMunicipioRuntimeDecision`, `evaluateEmpresaCadastroMunicipioPreflight`) deve aplicar a nova precedência. |
| `backend/src/services/plugnotas/empresa.service.js` | Orquestração do cadastro e consumo da decisão de runtime. |
| `docs/operacao-mei-nfse.md` | Runbook de causalidade e triagem. |

---

## 1. Resumo executivo

O preflight municipal do PlugNotas pode devolver, para o **mesmo** IBGE, `padraoNacionalEnabled: true` **e** `requiresLogin: true` (ou `requiresSenha`). O runtime atual do BFF trata o sinal de autenticação municipal **antes** de conceder o ramo nacional (`success_nacional`), o que bloqueia o cadastro com `prefeitura_login_required_blocked` **sem** chamar o `POST /empresa`, mesmo quando o município suporta NFS-e Nacional.

**Decisão de produto:** na decisão de preflight para o cadastro da empresa no modo nacional, **`padraoNacionalEnabled === true` tem precedência** sobre `requiresLogin` / `requiresSenha` para efeitos de **permitir o upstream** do cadastro. O bloqueio por credenciais de prefeitura mantém-se quando o **nacional não** está disponível no preflight, ou quando a governança existente (credenciais parciais, modo municipal explícito, feature flags) exigir outro ramo — sem duplicar a lógica de triagem.

**Resultado esperado:** utilizadores em municípios híbridos (ex.: Campo Grande — MS, IBGE **5002704**) deixam de ser impedidos injustamente no fluxo nacional; municípios sem nacional continuam sujeitos à classificação e mensagens já definidas para login municipal.

---

## 2. Problema

| Dimensão | Situação atual | Impacto |
|---|---|---|
| Semântica do preflight | O fornecedor expõe vários metadados independentes (`padraoNacional`, `login`, `senha`). | Combinar “nacional disponível” com “login assinalado” não é mutuamente exclusivo. |
| Ordem na decisão | O BFF prioriza bloqueio por `requiresLogin` / `requiresSenha` antes de reconhecer nacional habilitado. | Cadastro bloqueado com `upstreamCallSkipped = true` apesar de nacional viável. |
| Experiência do utilizador | Mensagem `prefeitura_login_required_blocked` sem tentativa de cadastro. | MEI em cidade com nacional não conclui setup; suporte interpreta como falta de credencial quando o problema é precedência na policy. |
| Alinhamento com fornecedor | O modo nacional não deve depender do portal municipal para o mesmo ramo de emissão. | Produto fica mais restritivo que a capacidade declarada via `padraoNacional`. |

---

## 3. Objetivos

1. Garantir que, quando `padraoNacionalEnabled === true`, o preflight de cadastro da empresa no fluxo nacional resulte em decisão **`success_nacional`** (e `allowUpstream` coerente), **salvo** exceções explícitas de governança (payload inválido, credenciais parciais, tentativa municipal, etc.).
2. Manter bloqueio e mensagens de `prefeitura_login_required_blocked` quando **não** houver modo nacional no preflight **e** o município exigir login/senha sem par credencial válido, conforme política vigente.
3. Preservar rota BFF, causalidade `POST` / `PATCH` / `GET` e ausência de integração direta browser → PlugNotas.
4. Tornar o comportamento **testável** com caso fixo IBGE `5002704` e matriz mínima de flags.

---

## 4. Não objetivos

- Novo desenho de UI para recolha de credenciais municipais (permanece backlog / épico condicional).
- Alterar contrato público da API do BFF além dos códigos e `runtimeDecision` já usados.
- Garantir emissão fiscal bem-sucedida pós-cadastro para todos os municípios (escopo do fornecedor e configuração da empresa).
- Substituir o PRD RTCAD 2026-04-14 na íntegra; este documento **complementa** com a regra de precedência.

---

## 5. Contexto e premissas

### 5.1 Premissas

1. A fonte de verdade dos metadados municipais no preflight é a API PlugNotas (ex.: cidade por IBGE), no ambiente alvo (produção vs homologação).
2. `padraoNacionalEnabled === true` significa, para produto, que o ramo nacional do cadastro **não** deve ser barrado **só** por `requiresLogin` / `requiresSenha`.
3. Casos com credenciais parciais, modo municipal explícito ou políticas de segurança existentes continuam a ser tratados pelos ramos já definidos no código (`payload_contrato`, fallback disponível, etc.).

### 5.2 Caso canónico (aceite de produto)

- **IBGE:** 5002704 (Campo Grande, MS)  
- **Preflight:** `padraoNacionalEnabled: true`, `requiresLogin: true` (e `requiresSenha` conforme API).  
- **Comportamento desejado:** decisão `success_nacional` (ou equivalente documentado no runtime), permitindo prosseguir para o cadastro upstream no fluxo nacional, **sem** `prefeitura_login_required_blocked` apenas por causa do login assinalado.

---

## 6. Decisões de produto e governança

| ID | Decisão |
|---|---|
| **DP-PFLNAT-01** | Na máquina de decisão do preflight de cadastro da empresa (modo nacional default), **`padraoNacionalEnabled === true` é avaliado antes** de qualquer bloqueio baseado apenas em `requiresLogin` / `requiresSenha`. |
| **DP-PFLNAT-02** | Se `padraoNacionalEnabled === true`, o cenário de sucesso nacional **não** exige credenciais municipais **para esse ramo** de preflight. |
| **DP-PFLNAT-03** | Se `padraoNacionalEnabled !== true` e o município exige login/senha sem par credencial válido (e sem exceção de governança), mantém-se classificação de bloqueio / fallback já existente. |
| **DP-PFLNAT-04** | Não se altera a fronteira BFF nem se expõem credenciais PlugNotas ou municipais ao browser fora do contrato atual. |
| **DP-PFLNAT-05** | A iniciativa **refina** a leitura de **FR-RTCAD-05 / FR-RTCAD-06** do PRD RTCAD 2026-04-14: a distinção “nacional vs municipal” aplica-se **depois** de resolver a precedência quando **ambos** os sinais aparecem; evita-se bloqueio municipal prematuro quando o nacional está disponível. |

---

## 7. Escopo

### 7.1 Dentro do escopo

- Ajustar a ordem e condições em `resolveEmpresaCadastroMunicipioRuntimeDecision` (e consumidores) para implementar **DP-PFLNAT-01** a **DP-PFLNAT-03**.
- Testes automatizados cobrindo o caso híbrido (`padraoNacionalEnabled` + `requiresLogin`).
- Regressão dos demais cenários já cobertos (sem nacional + login; DP02; credenciais parciais, se aplicável).
- Quality gates: `npm run lint`, `npm run typecheck`, `npm test`.

### 7.2 Fora do escopo

- Épico completo de UI para credenciais municipais e feature flag (mantém-se planeamento existente).
- Alterações à documentação PlugNotas externa.
- Novos endpoints públicos no BFF.

---

## 8. Requisitos funcionais

| ID | Requisito |
|---|---|
| **FR-PFLNAT-01** | Dado preflight com `padraoNacionalEnabled === true`, o sistema deve produzir decisão de sucesso nacional (`success_nacional` ou equivalente) para o fluxo de cadastro nacional **antes** de aplicar `prefeitura_login_required_blocked` baseado apenas em `requiresLogin` / `requiresSenha`. |
| **FR-PFLNAT-02** | Dado preflight com `padraoNacionalEnabled !== true` e exigência de login/senha sem credenciais válidas no contexto da governança atual, o sistema deve manter o comportamento de bloqueio ou fallback já definido para credenciais municipais. |
| **FR-PFLNAT-03** | O `runtimeDecision` retornado deve continuar a incluir `padraoNacionalEnabled`, `requiresLogin`, `requiresSenha`, `codigoIbge` e `upstreamCallSkipped` de forma consistente para o frontend e diagnóstico. |
| **FR-PFLNAT-04** | O caso IBGE **5002704** com `padraoNacionalEnabled: true` e `requiresLogin: true` deve ser coberto por teste automatizado que asserta **não** bloqueio por `prefeitura_login_required_blocked` no percurso nacional default descrito no briefing. |

---

## 9. Requisitos não funcionais

| ID | Requisito |
|---|---|
| **NFR-PFLNAT-01** | Nenhum dado sensível (credenciais) em logs ou mensagens de erro. |
| **NFR-PFLNAT-02** | Integração PlugNotas continua apenas no BFF. |
| **NFR-PFLNAT-03** | A decisão deve respeitar o ambiente alvo (produção / homologação) já usado na triagem. |
| **NFR-PFLNAT-04** | Implementação passa pelos quality gates do repositório (`lint`, `typecheck`, `test`). |

---

## 10. Requisitos de compatibilidade brownfield

| ID | Requisito |
|---|---|
| **CR-PFLNAT-01** | Rota `POST /api/mei-notas/setup/emissao-fiscal/empresa` inalterada em path e método. |
| **CR-PFLNAT-02** | Códigos de erro existentes (`prefeitura_login_required_blocked`, etc.) são reutilizados; apenas a **condição de disparo** é corrigida. |
| **CR-PFLNAT-03** | Fallback `PATCH /empresa/:cnpj` e fluxo de retry não podem regredir. |

---

## 11. Critérios de aceite

- [ ] Preflight com `padraoNacionalEnabled === true` e `requiresLogin === true` (IBGE 5002704 ou mock equivalente) **não** resulta em `prefeitura_login_required_blocked` no caminho nacional default do cadastro da empresa.
- [ ] Preflight com `padraoNacionalEnabled !== true` e exigência de login/senha continua a ser tratado conforme política atual (bloqueio ou fallback, conforme governança).
- [ ] Testes automatizados adicionados ou atualizados demonstram a precedência nacional.
- [ ] `npm run lint`, `npm run typecheck` e `npm test` passam.
- [ ] Documentação operacional: referência cruzada a este PRD e ao brief de diagnóstico (atualização pontual em `docs/operacao-mei-nfse.md` **se** a equipa decidir sincronizar o runbook nesta entrega).

---

## 12. Métricas de sucesso

| Métrica | Sinal esperado |
|---|---|
| Cadastros concluídos em municípios com nacional + login assinalado | Redução de falhas com `prefeitura_login_required_blocked` indevido |
| Tickets de suporte “login prefeitura” em cidades com nacional | Queda para IBGEs conhecidos híbridos |
| Regressões em outros IBGEs | Zero novas regressões detetadas na matriz de QA |

---

## 13. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Metadado PlugNotas inconsistente por ambiente | Decisão errada em homologação vs produção | Testes por ambiente; NFR-PFLNAT-03 |
| Ramo municipal explícito ou credenciais parciais | Comportamento ambíguo após reordenação | Manter ramos existentes; testes de regressão |
| Expectativa de emissão 100% pós-cadastro | Insatisfação se o fornecedor falhar depois | Comunicar que o PRD cobre **preflight/cadastro**, não garantia de emissão |

---

## 14. Estrutura de épico e histórias

**Épico único (MVP desta iniciativa):** corrigir precedência do preflight nacional sobre login municipal.

### Story A — Máquina de decisão

Como sistema de cadastro,  
quero avaliar `padraoNacionalEnabled` antes de bloquear por login/senha no fluxo nacional,  
para não barrar municípios híbridos indevidamente.

**Critérios de aceite:** implementação de **FR-PFLNAT-01** e **FR-PFLNAT-02**; código em `empresa-cadastro-runtime-decision.js` (e chamadas relacionadas, se necessário).

### Story B — Testes e regressão

Como QA engenharia,  
quero testes para IBGE 5002704 e matriz de flags,  
para garantir precedência e ausência de regressão.

**Critérios de aceite:** **FR-PFLNAT-04**; suite verde.

### Story C — (Opcional) Runbook

Como operação,  
quero referência no runbook à nova precedência,  
para diagnóstico consistente de `runtimeDecision`.

**Critérios de aceite:** ligação a este PRD e ao brief; apenas se a equipa incluir na mesma entrega.

> **Delegação @sm:** detalhar tasks, estimativa e checklist em `docs/stories/` conforme processo do projeto.

---

## 15. Plano de rollout

1. Implementar e testar em branch de integração.
2. Validar manualmente cadastro com município Campo Grande (5002704) em ambiente seguro, se disponível.
3. Merge após gates verdes e revisão de código.
4. Monitorizar métricas de suporte e erros 400 no endpoint de empresa nas primeiras versões.

---

## 16. Próximos passos canónicos

- **@sm** — criar ou atualizar story com checklist e file list.
- **@dev** — implementar alteração na máquina de decisão e testes.
- **@qa** — validar matriz IBGE + ambientes.
- **@po** — priorizar na sprint e confirmar se runbook entra no mesmo incremento.

---

## 17. Change log

| Data | Versão | Descrição | Autor |
|---|---|---|---|
| 2026-04-15 | 1.0 | PRD inicial: precedência preflight nacional sobre login municipal; fonte brief diagnóstico 5002704. | PM (Morgan) |
