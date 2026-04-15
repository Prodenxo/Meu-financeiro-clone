# Story — FR-PFLNAT (P1): QA e regressão — matriz preflight híbrido + verificação UX mínima

**ID:** STORY-FR-PFLNAT-P1-QA-REGRESSAO-MATRIZ-PREFLIGHT-HIBRIDO  
**Prioridade:** P1  
**Status:** Draft *(refinada 2026-04-15 — critérios @po)* — *no quadro, passar a **Ready for Sprint** quando o **Gate de dependência** estiver assinalado.*  
**Estimativa:** *a fechar no planning* — indicativo **2–3 SP** (matriz + evidências + possível ajuste mínimo de testes front) **ou** t-shirt **S**; ajustar após *task breakdown* com @qa / @dev.  
**Epic:** Correção precedência preflight NFS-e Nacional vs login municipal (PRD PFLNAT 2026-04-15)  
**Depende de:** [`story-fr-pflnat-p0-backend-motor-decisao-nacional-antes-login-municipal.md`](./story-fr-pflnat-p0-backend-motor-decisao-nacional-antes-login-municipal.md) — motor PFLNAT mergeado e testes base verdes.

### Gate de dependência (Ready for QA)

- [ ] Story **P0** concluída (**DoD** do P0) no **ramo alvo** onde se valida (ex.: `main` ou release branch).
- [ ] CI do repositório **verde** no commit que inclui o merge do P0 (ou evidência equivalente).
- [ ] Ambiente de validação acordado disponível: **local** (com mocks/fixtures), **CI**, e/ou **staging** — assinalar qual foi usado na evidência de QA.

### Transição de estado (workflow equipa)

| Estado sugerido | Quando |
|-----------------|--------|
| **Ready for Sprint / Approved** | Gate de dependência preenchido e estimativa aceite no planning. |
| **In Progress** | Matriz de testes em execução; evidências a recolher. |
| **Done** | DoD abaixo cumprido, sign-off @qa, artefacto de evidência ligado (PR, ticket ou anexo). |

*(Ajustar rótulos ao vosso quadro — Jira, Linear, etc.)*  
*Sincronização documento ↔ ferramenta:* quando todos os itens do gate estiverem verdadeiros, actualizar o **estado do cartão** para *Ready for Sprint* (ou equivalente), mesmo que este ficheiro ainda diga *Draft* até ao merge final.

**Fonte PRD:** [`docs/prd/PRD-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md`](../prd/PRD-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md) — §11–13, **FR-PFLNAT-04**, métricas  
**UX:** [`docs/specs/ux-spec-preflight-nacional-precedencia-login-municipal-plugnotas-2026-04-15.md`](../specs/ux-spec-preflight-nacional-precedencia-login-municipal-plugnotas-2026-04-15.md) — §5.4, §9  
**Arquitetura:** [`docs/technical/architecture-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md`](../technical/architecture-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md) — §9  

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @qa *(owner)*; @dev *(suporte a testes e2e/fixtures)* |
| **quality_gate** | @qa |
| **revisão** | @po *(amostragem de critérios de aceite UX)* |

---

## User story

**Como** responsável de QA do produto fiscal,  
**quero** validar a matriz de cenários preflight (incluindo município híbrido **5002704**) e confirmar que a UI **não** apresenta falso positivo PLOGIN quando o backend já não devolve `prefeitura_login_required_blocked` nesse percurso,  
**para** cumprir os critérios de aceite do PRD e a spec UX sem regressões em `fiscalUserError` / hints.

**Valor para o negócio / utilizador:**  
**Como** equipa de produto e **Como** MEI em município híbrido, **queremos** confiança verificada de que o fix PFLNAT não regrediu outros municípios e que o utilizador **não** vê PLOGIN indevido após o deploy, **para** dar **go** de comunicação ou suporte sem surpresas.

---

## Contexto

- O PRD prioriza backend; esta story fecha o **anel de regressão** integrado + verificação de superfície conforme **PFLNAT-UX-L0/L1** na spec UX.
- **Sem obrigatoriedade** de novos componentes de UI nesta entrega; foco em **comportamento observável** e testes.

### Triagem de falhas (evitar falso diagnóstico)

- Um **400** no cadastro da empresa **não** é automaticamente “PLOGIN indevido”: pode ser payload, ambiente, resposta PlugNotas **após** `POST /empresa`, etc.
- Para **atribuir** o cenário ao escopo PFLNAT, a evidência deve incluir pelo menos: `errors.plugnotasCode`, `errors.runtimeDecision.scenario` (se presente) e, se aplicável, indicação de que o bloqueio **não** ocorreu no preflight com `upstreamCallSkipped: true` por PLOGIN quando o esperado era nacional *(sem dados pessoais nem credenciais)*.

---

## Critérios de aceite

### Matriz QA (backend já integrado)

- [x] Cenário **híbrido** documentado: `padraoNacionalEnabled: true` + `requiresLogin: true` (IBGE 5002704 ou fixture) → cadastro **não** falha com `prefeitura_login_required_blocked` **causado só pelo preflight**; resultado aceitável: **2xx** no cadastro **ou** erro **posterior** ao preflight (ex.: PlugNotas `POST /empresa`) com `plugnotasCode` / mensagem **distinta** de PLOGIN por preflight *(espelho PRD §11 item 1)* — ver tabela em [`docs/qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md`](../qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md) + testes backend referenciados.
- [x] **Evidência obrigatória** para o cenário híbrido: nota de QA ou anexo com **redacção segura** — mínimo `runtimeDecision.scenario` esperado (`success_nacional` antes do upstream) e/ou corpo de erro com `plugnotasCode` **quando** houver 400, para distinguir PLOGIN indevido de outras causas *(ver “Triagem de falhas” acima)* — **artefacto base** em [`docs/qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md`](../qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md) (**§0** gate P0/CI, **§2.1** pacote PR, **§4** template sign-off); **sign-off @qa** e checklist §3 **Guia MEI** permanecem com **@qa** até preenchimento.
- [x] Cenário **sem nacional** + login obrigatório: mantém bloqueio / mensagens esperadas *(PRD §11 item 2)* — documentado na mesma tabela + testes com `padraoNacional: false` nos mocks.
- [x] Regressão **REC500** / `empresa-cadastro-runtime` referenciada no relatório de QA ou pipeline verde — rastreio na tabela de evidência; `npm test` verde na raiz com esta entrega.

### UX / front-end (mínimo)

- [x] Verificação de que `resolveMeiFiscalScenario` / `mapMeiFiscalErrorToCopy` **não** exigem alteração obrigatória; se algum teste de `nfseNacionalPlugnotasErrorHints` ou `fiscalUserError` falhar por mensagem desactualizada, actualizar **apenas** com alinhamento à spec UX *(secção 7 da UX spec — ficheiros listados)* — cobertura reforçada com testes FR-PFLNAT P1; sem alteração obrigatória ao mapeamento principal.
- [ ] Checklist visual rápido na Guia MEI: fluxo cadastro empresa **não** mostra cartão PLOGIN indevido após deploy do P0 *(PFLNAT-UX-L0)* — **owner:** @qa com *spot check* opcional @po.

### Qualidade

- [x] Evidência de `npm run lint`, `npm run typecheck`, `npm test` na revisão de release (ou link CI), **incluindo** eventual PR de ajuste mínimo de testes front — **verde local** em 2026-04-15 com esta entrega.
- [x] Procedimento para **ligar evidência a CI / commit** (URL de pipeline ou SHA) documentado no artefacto QA **§0** e **§2.1** — a equipa deve anexar o link real ao fechar o PR de validação.

---

## Tasks / Subtasks

1. [ ] Confirmar **Gate de dependência** (P0 mergeado + CI verde no commit alvo).
2. [x] Executar matriz manual ou automatizada conforme ambiente assinalado no gate (staging / local com mocks) — **parcial:** matriz rastreável a testes automatizados + doc `docs/qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md`; staging/manual por @qa.
3. [ ] Registar resultado e **evidência mínima** (sign-off): comentário no **pull request que documenta ou acompanha a validação QA** (PR de evidência ou PR onde o @qa deixa o sign-off), secção “QA sign-off” nesse PR, ou ticket com link para commit/CI *(artefacto único rastreável — evitar confundir com o ID da story **P1**)* — **template** em [`docs/qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md` §4](../qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md).
4. [x] Se necessário, ajustar testes front em `fiscalUserError` / hints com diff mínimo (PR dedicado ou mesmo PR se equipa acordar).
5. [x] Opcional: adicionar caso à matriz em [`story-fr-rtcad-p1-qa-matriz-validacao-municipio-ambiente-plugnotas.md`](./story-fr-rtcad-p1-qa-matriz-validacao-municipio-ambiente-plugnotas.md) *(referência cruzada, não bloqueante)*.

---

## Definition of Done

- **Gate de dependência** assinalado e critérios de aceite marcados com **artefacto de evidência** (link a PR de validação/sign-off, ticket ou anexo com sign-off @qa — **não** confundir com o número/ID da story).
- Revisão de amostragem **@po** nos critérios UX quando aplicável.
- Nenhum bug P0 aberto contra critérios PRD §11 para o escopo PFLNAT.

---

## Change log (story)

| Data | Nota |
|------|------|
| 2026-04-15 | Rascunho inicial — River (@sm). |
| 2026-04-15 | Refinamento segundo feedback @po (@po 8/10): gate P0/CI/ambiente, estimativa, transição de estado, valor negócio, triagem de falhas vs outros 400, evidência mínima `runtimeDecision`/`plugnotasCode`, DoD com artefacto, tasks e spot check PO — River (@sm). |
| 2026-04-15 | Terceiro refinamento (@po 9,5/10): clarificação PR de evidência vs ID story P1; DoD alinhado; nota Status/quadro Ready for Sprint e sync com ferramenta — River (@sm). |
| 2026-04-15 | Entrega suporte @dev: artefato [`docs/qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md`](../qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md) + testes front FR-PFLNAT P1 (`fiscalUserError`, `nfseNacionalPlugnotasErrorHints`); referência cruzada na story RTCAD P1. |
| 2026-04-15 | Seguimento revisão @qa: evidência rev. §0 gate P0/CI, §2.1 pacote PR, §3 passos `/guias-mei`, §4 sign-off — Dex (@dev). |
