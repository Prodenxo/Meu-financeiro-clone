# Evidência QA — FR-PFLNAT P1 — matriz preflight híbrido + superfície UX mínima

**Story:** [`docs/stories/story-fr-pflnat-p1-qa-regressao-matriz-preflight-hibrido.md`](../stories/story-fr-pflnat-p1-qa-regressao-matriz-preflight-hibrido.md)  
**Depende de:** P0 [`story-fr-pflnat-p0-backend-motor-decisao-nacional-antes-login-municipal.md`](../stories/story-fr-pflnat-p0-backend-motor-decisao-nacional-antes-login-municipal.md) mergeado com CI verde.  
**Data:** 2026-04-15 · **Rev. 2026-04-15** (seguimento revisão @qa)

---

## 0. Gate de dependência (P0 + CI) — **preenchimento equipa**

Fechar estes itens **antes** de considerar a story P1 **Done** (alinhado ao cartão e ao DoD):

| # | Critério | Evidência esperada |
|---|----------|-------------------|
| G1 | Story **P0** concluída no **ramo alvo** (ex. `main`) | Link ao PR/merge do P0 **ou** SHA no ramo alvo após merge |
| G2 | **CI verde** no commit que inclui o merge do P0 | URL do *pipeline* / *workflow run* (GitHub Actions, GitLab CI, Bitbucket Pipelines, etc.) **ou** captura com commit SHA visível |
| G3 | Ambiente de validação assinalado | Um de: local · CI · staging (marcar na secção 4) |

**Nota:** neste repositório a pasta `.github/workflows` pode estar ausente ou gerida noutro remoto; o link deve apontar para o **serviço de CI real da organização**, não só para `npm test` local.

---

## 1. Triagem de falhas (obrigatório antes de classificar como “PLOGIN indevido”)

Um **400** no cadastro da empresa **não** implica sozinho falha PFLNAT: validar `errors.plugnotasCode`, `errors.runtimeDecision.scenario` quando presente, e se o bloqueio ocorreu **no preflight** (`upstreamCallSkipped` coerente) ou **após** `POST /empresa`. Não incluir dados pessoais nem credenciais nas notas.

---

## 2. Matriz — rastreio a testes automatizados (evidência reexecutável)

| Cenário (resumo) | Resultado esperado | Evidência (repo) |
|------------------|-------------------|-------------------|
| Híbrido: `padraoNacionalEnabled` + `requiresLogin` (IBGE **5002704**), modo nacional, sem credenciais parciais | `success_nacional` / `allowUpstream`; **não** `prefeitura_login_required_blocked` só por preflight | `backend/tests/empresa-cadastro-runtime-rec500-regression.test.js` (casos `FR-PFLNAT-04`, `FR-PFLNAT-02` com nacional) |
| Sem nacional + auth municipal + política default / fallback | `prefeitura_login_required_blocked` ou `prefeitura_login_required_fallback_available` conforme flag | Mesmo ficheiro + `backend/tests/plugnotas-empresa.test.js`, `backend/tests/mei-notas-empresa-http.test.js` (mocks com `padraoNacional: false` onde aplicável) |
| DP02 (`padraoNacionalEnabled !== true`, sem auth explícita) | `prefeitura_ibge_apenas_insuficiente_dp02` | `empresa-cadastro-runtime-rec500-regression.test.js` |
| Excepção §4: par credencial + `!prefeituraCredentialsEnabled` em modo nacional | `prefeitura_login_required_blocked` | Caso `FR-PFLNAT §4` em `empresa-cadastro-runtime-rec500-regression.test.js` |
| UI: `resolveMeiFiscalScenario` com `runtimeDecision` de preflight híbrido resolvido (`success_nacional`, IBGE 5002704) | Cenário `success_nacional` (não confundir com PLOGIN só por texto) | `frontend/src/lib/fiscalUserError.test.ts` (bloco FR-PFLNAT P1) |
| Hints: mensagem que **ainda inclui** o código BFF `prefeitura_login_required_blocked` | Variante L1 `prefeitura-login-required` (erro a jusante ou legado, não o preflight híbrido pós-P0) | `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts` |

**Comandos (raiz do repositório):** `npm run lint` · `npm run typecheck` · `npm run test`

### 2.1 Pacote mínimo para anexar ao PR / ticket (reprodutibilidade)

1. **Commit:** `git rev-parse HEAD` (colar SHA na nota de evidência).
2. **Saída dos gates:** colar sumário do último `npm run lint && npm run typecheck && npm run test` (ou screenshot do terminal com exit code 0).
3. **CI:** quando existir, **URL do job verde** no mesmo SHA ou no merge commit do P0+P1 (ver §0).

---

## 3. Checklist visual Guia MEI (PFLNAT-UX-L0) — **owner: @qa**

**Rota da app:** `/guias-mei` (utilizador autenticado com acesso à área MEI).

1. Navegar até ao fluxo de **cadastro / configuração da empresa** no emissor fiscal (Guia MEI), com dados que permitam testar município **IBGE 5002704** (ou ambiente de staging equivalente).
2. Abrir **DevTools → Rede** e localizar:
   - pedido ao BFF de preflight/cadastro (`/api/mei-notas/...` / `nfse/cidades` conforme fluxo);
   - resposta **200** no cadastro quando o cenário híbrido está corretamente servido **ou** 400 com corpo JSON analisável.
3. Confirmar que **não** aparece o cartão/copy de **«Exceção municipal não suportada neste fluxo»** (`mapMeiFiscalErrorToCopy` / `prefeitura_login_required_blocked`) **quando** `errors.runtimeDecision.scenario` **não** é `prefeitura_login_required_blocked` no preflight (validar JSON da resposta; ver §1).
4. Se surgir 400, usar §1 para distinguir PLOGIN indevido de erro pós-`POST /empresa` ou outro `plugnotasCode`.

- [ ] Passos 1–3 verificados no ambiente assinalado (staging / local contra BFF real ou mock acordado).
- [ ] Spot check opcional com **@po** nos critérios UX da spec §5.4 / §9.

---

## 4. Sign-off @qa *(não preencher por @dev — apenas @qa ou delegado)*

| Campo | Valor |
|-------|--------|
| **Nome / papel** | *(ex.: Quinn @qa)* |
| **Data** | *(AAAA-MM-DD)* |
| **Ambiente validado** | ☐ local · ☐ CI · ☐ staging |
| **SHA / commit validado** | *(output de `git rev-parse HEAD` ou link ao commit no Git)* |
| **PR / pipeline** | *(URL — **não** substituir pelo ID da story P1)* |
| **P0 merge confirmado no ramo alvo** | ☐ sim *(referência: PR ou SHA)* |
| **CI verde** | ☐ sim *(link §0)* |
| **Checklist §3 Guia MEI** | ☐ concluído · ☐ N/A *(justificar se N/A)* |
| **Amostragem @po** | ☐ feita · ☐ não aplicável |
| **Notas** | *(opcional — sem dados pessoais)* |

**Declaração:** ao assinar, confirmo que revi a matriz §2 e os gates §0 no âmbito acordado.

---

## 5. Change log

| Data | Nota |
|------|------|
| 2026-04-15 | Versão inicial — matriz + rastreio a testes + placeholder sign-off — entrega suporte @dev. |
| 2026-04-15 | Rev. pós-@qa: §0 gate P0/CI, §2.1 pacote PR, §3 passos `/guias-mei` + DevTools, §4 template sign-off. |
