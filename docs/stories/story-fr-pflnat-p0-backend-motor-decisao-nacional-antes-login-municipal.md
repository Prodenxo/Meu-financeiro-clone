# Story — FR-PFLNAT (P0): Backend — precedência de `padraoNacionalEnabled` sobre bloqueio por login/senha no preflight

**ID:** STORY-FR-PFLNAT-P0-BACKEND-MOTOR-DECISAO-NACIONAL-ANTES-LOGIN-MUNICIPAL  
**Prioridade:** P0  
**Status:** Draft *(refinada 2026-04-15 — critérios @po)*  
**Estimativa:** *a fechar no planning* — indicativo **3–5 SP** (refactor focado + matriz de testes) **ou** t-shirt **S**; ajustar após *task breakdown* com @dev.  
**Epic:** Correção precedência preflight NFS-e Nacional vs login municipal (PRD PFLNAT 2026-04-15)  
**Depende de:** [`docs/stories/story-fr-rtcad-p0-preflight-municipal-bff-plugnotas.md`](./story-fr-rtcad-p0-preflight-municipal-bff-plugnotas.md) — preflight municipal (`GET` cidade / metadados) **antes** do cadastro upstream.

### Gate de dependência (Ready for Dev)

- [ ] Story **RTCAD preflight** concluída e integrada no **ramo alvo** de implementação (ex.: `main` ou branch de release acordada).
- [ ] `consultarCidadePlugNotas` / preflight por IBGE está operacional no ambiente onde se valida esta story (local, CI ou staging).

### Transição de estado (workflow equipa)

| Estado sugerido | Quando |
|-----------------|--------|
| **Ready for Sprint / Approved** | Ambos os itens do **Gate de dependência** estão assinalados e o @po (ou processo equivalente) aceita a estimativa. |
| **In Progress** | *Branch* de trabalho aberta e primeiro commit referencia este ID de story. |
| **Done** | DoD abaixo cumprido, PR mergeado no ramo alvo, CI verde. |

*(Ajustar rótulos ao vosso quadro — Jira, Linear, etc.)*

**Fonte PRD:** [`docs/prd/PRD-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md`](../prd/PRD-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md) — **DP-PFLNAT-01** a **DP-PFLNAT-03**, **FR-PFLNAT-01**, **FR-PFLNAT-02**, **FR-PFLNAT-03**, **NFR-PFLNAT-01**–**04**, **CR-PFLNAT-01**–**03**  
**UX:** [`docs/specs/ux-spec-preflight-nacional-precedencia-login-municipal-plugnotas-2026-04-15.md`](../specs/ux-spec-preflight-nacional-precedencia-login-municipal-plugnotas-2026-04-15.md) — secções 5, 7, 9  
**Arquitetura:** [`docs/technical/architecture-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md`](../technical/architecture-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md) — **AD-PFLNAT-01**, §3–6  

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **revisão** | @architect |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` (backend / raiz conforme repo) |

---

## User story

**Como** sistema de cadastro da empresa no BFF (modo NFS-e Nacional por defeito),  
**quero** que `resolveEmpresaCadastroMunicipioRuntimeDecision` conceda `allowUpstream: true` e cenário `success_nacional` quando `padraoNacionalEnabled === true`, **antes** de bloquear apenas com base em `requiresLogin` / `requiresSenha`,  
**para** que municípios “híbridos” (nacional disponível **e** metadado de login assinalado) não disparem `prefeitura_login_required_blocked` sem tentativa de `POST /empresa`.

**Valor para o utilizador (contexto de negócio):**  
**Como** MEI com empresa em município compatível com NFS-e Nacional (ex.: Campo Grande — MS, IBGE **5002704**), **quero** concluir o cadastro da empresa no Guia MEI **sem** ser bloqueado por uma mensagem de “login da prefeitura” quando o fluxo nacional é válido, **para** avançar no setup fiscal sem suporte desnecessário.

---

## Contexto

- **Causa raiz:** a matriz actual exige `!authRequired` para entrar em `success_nacional`, logo `authRequired && natOk` cai em PLOGIN com `upstreamCallSkipped`.
- **Caso canónico de produto:** IBGE **5002704** (Campo Grande, MS) com `padraoNacionalEnabled: true` e `requiresLogin: true`.
- **Fonte única de verdade:** `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js` (**AD-PFLNAT-01**); não duplicar a precedência em `empresa.service.js`.
- **Inalterado:** rotas HTTP, schema público de erro, política `applyPrefeituraPortalCredentialsPolicy` quando não há chaves `prefeitura` no payload; trilho municipal explícito e guardas de credenciais parciais (ver arquitetura §4).

### Matriz de referência FR-PFLNAT-02 (sem regressão — QA)

| Preflight + governança (resumo) | Resultado esperado |
|---------------------------------|-------------------|
| `padraoNacionalEnabled === true`, `attemptNfseMode === 'nacional'`, sem credenciais parciais, `requiresLogin` e/ou `requiresSenha` verdadeiros | `allowUpstream: true`, cenário `success_nacional` *(caso híbrido corrigido)* |
| `padraoNacionalEnabled !== true`, auth exigido pelo preflight, sem par credencial válido, trilho actual sem credenciais municipais activas | Bloqueio `prefeitura_login_required_blocked` ou fallback `prefeitura_login_required_fallback_available` conforme política já existente |
| `padraoNacionalEnabled !== true`, sem sinal nacional suficiente, sem login/senha exigidos | `prefeitura_ibge_apenas_insuficiente_dp02` (DP02) quando aplicável à matriz actual |

*Nota (linha 3 / DP02):* cenários DP02 já têm cobertura na suíte brownfield; em caso de dúvida sobre *fixtures*, ver casos existentes em `empresa-cadastro-runtime-rec500-regression.test.js` e asserts que mencionem `prefeitura_ibge_apenas_insuficiente_dp02` ou `DP02`. O refactor PFLNAT **não** deve alterar o significado deste ramo — apenas confirmar regressão.

---

## Critérios de aceite

### Motor de decisão

- [ ] Quando `preflight.padraoNacionalEnabled === true`, `attemptNfseMode === 'nacional'` e as guardas de governança existentes (credenciais parciais, etc.) não bloqueiam, o resultado é `allowUpstream: true` e `runtimeDecision.scenario === 'success_nacional'` **mesmo que** `requiresLogin` ou `requiresSenha` sejam verdadeiros no preflight *(FR-PFLNAT-01, DP-PFLNAT-01/02)*.
- [ ] **FR-PFLNAT-02:** para combinações em que **não** se aplica o caso híbrido anterior, o comportamento permanece alinhado à tabela “Matriz de referência FR-PFLNAT-02” (sem regressão nos ramos DP02 / PLOGIN / fallback).
- [ ] **Trilho credenciais + municipal (ambiguidade fechada):** com `authRequired`, par credencial válido, `prefeituraCredentialsEnabled` e `attemptNfseMode === 'municipal'`, o comportamento permanece o definido na [arquitetura §4](../technical/architecture-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md) (ex.: `success_municipal` / `payload_contrato` conforme ramos existentes). Se o refactor tocar nestes ramos, **revisão obrigatória @architect** e teste que cubra o ramo alterado.
- [ ] `runtimeDecision` continua a expor `padraoNacionalEnabled`, `requiresLogin`, `requiresSenha`, `codigoIbge`, `consultedMunicipio`, `upstreamCallSkipped` onde aplicável *(FR-PFLNAT-03)*.

### Testes automatizados

- [ ] Existe teste que cobre o par **IBGE 5002704** (ou mock equivalente) com `padraoNacionalEnabled: true`, `requiresLogin: true`, governança default de `evaluateEmpresaCadastroMunicipioPreflight`, e **assert** de **não** `prefeitura_login_required_blocked` / `allowUpstream === true` *(FR-PFLNAT-04)*.
- [ ] Regressão: matriz existente em `backend/tests/empresa-cadastro-runtime-rec500-regression.test.js` e cenários `resolveEmpresaCadastroMunicipioRuntimeDecision` permanecem verdes ou actualizados de forma justificada.
- [x] **Seguimento QA (@qa):** teste unitário explícito da excepção [arquitetura §4](../technical/architecture-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md#4-condições-de-governança-sem-alteração-de-produto-além-do-prd) — `natOk` + `attemptNfseMode === 'nacional'` + `authRequired` + par credencial (`credParValido`) + `prefeituraCredentialsEnabled === false` → `prefeitura_login_required_blocked` / `upstreamCallSkipped` *(ficheiro regressão, caso `FR-PFLNAT §4`)*.

### Qualidade

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test` *(ou comando de teste canónico do repositório)* — verde na raiz em 2026-04-15 após seguimento QA.

---

## Dev Notes

### File Locations (mínimo)

- `backend/src/services/plugnotas/empresa-cadastro-runtime-decision.js`
- `backend/tests/empresa-cadastro-runtime-rec500-regression.test.js` *(incl. caso `FR-PFLNAT §4` — seguimento QA)*
- *(se novos casos)* ficheiro de teste dedicado ao motor PFLNAT

### Technical Constraints

- Não criar rota nova no BFF.
- Não expor credenciais em logs ou mensagens (**NFR-PFLNAT-01**).
- Preservar `runEmpresaCadastroMunicipioPreflight` e chamadas a `createEmpresaCadastroBlockedErrorFromDecision` — apenas a decisão interna muda.
- Revisar com @architect qualquer alteração a ramos com `hasValidPair`, `prefeituraCredentialsEnabled` e `attemptNfseMode` (ver critério dedicado e arquitetura §4).

---

## Tasks / Subtasks

1. [ ] Confirmar **Gate de dependência** (RTCAD preflight no ramo alvo).
2. [ ] Refactor de `resolveEmpresaCadastroMunicipioRuntimeDecision` conforme arquitetura §3 (precedência `natOk` no percurso nacional default).
3. [ ] Adicionar/actualizar testes para IBGE 5002704 e regressão da matriz (incluindo linhas da tabela FR-PFLNAT-02 quando aplicável).
4. [ ] Correr gates de qualidade e corrigir regressões.
5. [ ] Referenciar esta story no PR checklist / nota de release.

---

## Definition of Done

- **Gate de dependência** assinalado e critérios de aceite marcados com evidência de CI verde.
- Revisão @architect ou delegado no diff do motor de decisão (obrigatória se ramos municipal/credenciais mudarem).
- [`story-fr-pflnat-p1-qa-regressao-matriz-preflight-hibrido.md`](./story-fr-pflnat-p1-qa-regressao-matriz-preflight-hibrido.md) pode prosseguir em paralelo ou a seguir.

---

## Change log (story)

| Data | Nota |
|------|------|
| 2026-04-15 | Rascunho inicial — River (@sm) a partir do PRD PFLNAT e arquitetura. |
| 2026-04-15 | Refinamento segundo feedback @po: valor MEI, gate RTCAD, tabela FR-PFLNAT-02, critério trilho municipal/credenciais, tasks e DoD actualizados — River (@sm). |
| 2026-04-15 | Terceiro refinamento (@po 9,5/10): estimativa indicativa (SP / t-shirt), transição de estado Ready/In Progress/Done, nota DP02 com ponteiro para testes existentes — River (@sm). |
| 2026-04-15 | Seguimento QA: teste unitário excepção §4 (par credencial + política municipal off) em `empresa-cadastro-runtime-rec500-regression.test.js` — Dex (@dev). |
