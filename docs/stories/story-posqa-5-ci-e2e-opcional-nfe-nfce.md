# Story — POSQA-5 (P1): Automação opcional E2E / API real **NF-e** / **NFC-e** (CI com secrets)

**ID:** STORY-POSQA-5-CI-E2E-OPCIONAL-NFE-NFCE  
**Prioridade:** P1  
**Depende de:** **STORY-POSQA-1** (runbook estável); política de secrets no repositório CI.  
**Bloqueia:** —  
**Fonte:** `docs/prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md` (**FR-POSQA-07**)  
**Arquitetura:** `docs/technical/architecture-mei-posqa-nfe-nfce-2026-04-07.md` §6, §7 (FR-POSQA-07)  
**UX:** —

## User story

**Como** equipa de engenharia,  
**quero** (opcionalmente) **um** pipeline ou script que execute chamada real a emissão NF-e/NFC-e **ou** smoke API contra sandbox, protegido por **secrets** de CI,  
**para** complementar testes com mock sem substituir o runbook manual (**FR-POSQA-07**).

## Contexto técnico

- **PRD:** automação **só se** o repositório tiver política de secrets; caso contrário manter **manual + evidência** (POSQA-1).  
- **Opções:** (a) GitHub Actions com secrets `PLUGNOTAS_*` + token de utilizador de teste; (b) script `node` em `scripts/` invocável localmente com `.env` ignorado; (c) não fazer — apenas fechar story como **Won’t do** com justificativa.  
- **Segurança:** secrets apenas em cofre CI; **NFR-POSQA-01**.

## Critérios de aceite (**FR-POSQA-07**)

- [x] Decisão documentada: **implementar** vs **adiar** vs **não aplicável** (sem secrets no repo). *(**Implementar** — GitHub Actions com secrets; repositório já usa workflows + política NFR-POSQA-01.)*  
- [x] Se implementar:  
  - [x] Um fluxo mínimo (NFE ou NFCE) que falhe ou suceda de forma determinística em sandbox. *(POST com payload inválido → 4xx no integrador — NF-e e NFC-e.)*  
  - [x] Não bloquear merge em PRs se secret ausente (opcional: `workflow_dispatch` ou `if: secrets.*`). *(Job com `if: secrets.PLUGNOTAS_API_KEY != '' && secrets.PLUGNOTAS_API_BASE_URL != ''`.)*  
- [x] Runbook POSQA-1 referencia o job ou script (se existir). *(Runbook v1.3 — secção Automação opcional.)*

## Tasks (implementação)

1. [x] Avaliar com @devops se GitHub Actions / GitLab suporta secrets necessários. *(GitHub Actions — mesmo padrão que `corr03-smoke-backend.yml`.)*  
2. [x] Se sim: esboçar workflow ou script; se não: marcar critério como N/A e fechar.  
3. [x] Documentar em `docs/runbook/` ou `docs/technical/`. *(Runbook + `architecture-mei-posqa-nfe-nfce` §7 + PRD change log.)*

## File list (checklist implementação)

- [x] `.github/workflows/posqa-5-plugnotas-smoke-optional.yml`  
- [x] `scripts/smoke-nfe-nfce-plugnotas.mjs`  
- [x] `docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md` — referência ao automatismo  
- [x] `docs/prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md` — §14 FR-POSQA-07 + §15  
- [x] `package.json` — `npm run smoke:plugnotas:nfe-nfce`

## Definition of Done

- **FR-POSQA-07** satisfeito ou **explicitamente** descartado com registo no PRD ou story.

## Qualidade / CodeRabbit

- Nunca logar respostas completas com dados fiscais em artefactos CI públicos.

## Dev Agent Record

### Status

Ready for Review

### Completion Notes List

- **2026-04-07:** Implementado **FR-POSQA-07**: `scripts/smoke-nfe-nfce-plugnotas.mjs` (POST `/nfe` + `/nfce` com payload inválido; espera 4xx — conectividade determinística sem emitir nota); `npm run smoke:plugnotas:nfe-nfce`; workflow `.github/workflows/posqa-5-plugnotas-smoke-optional.yml` (`workflow_dispatch` + PR em paths Plugnotas; job só com secrets). PRD v1.2 §14/§15; runbook v1.3; `PROJECT_MEMORY`. **DevOps:** definir secrets `PLUGNOTAS_API_BASE_URL`, `PLUGNOTAS_API_KEY` (e opcional `PLUGNOTAS_API_PATH_PREFIX`) no GitHub para o job correr.
- **2026-04-07 (pós-QA):** Tratado **risco residual** assinalado pelo QA: critérios HTTP e troubleshooting documentados no runbook **v1.4** (secção Automação opcional); cabeçalho do script alinhado. Gate QA **PASS** mantido; não foi necessário alterar workflow.

---

## QA Results

### Revisão (Quinn — 2026-04-07)

**Âmbito:** Script Node + workflow GitHub Actions + documentação (sem alteração ao `mei-notas` / app).

| Critério **FR-POSQA-07** / story | Evidência | Resultado |
|----------------------------------|-----------|-----------|
| Decisão documentada (implementar / adiar / N/A) | Story + PRD v1.2 §15; escolha **implementar** | **OK** |
| Fluxo mínimo NFE ou NFCE determinístico | `smoke-nfe-nfce-plugnotas.mjs`: `POST` `/nfe` e `/nfce` com payload inválido; sucesso quando **4xx** (incl. 404 conforme resposta do integrador) | **OK** — alinha a “smoke API sandbox” do PRD (não exige E2E pela app) |
| Não bloquear merge sem secrets | Workflow: `if: secrets.PLUGNOTAS_API_KEY != '' && secrets.PLUGNOTAS_API_BASE_URL != ''`; job omitido se vazios; forks sem secrets → job skipped | **OK** |
| Runbook referencia automatismo | `runbook-smoke-nfe-nfce-plugnotas-sandbox.md` v1.3 — §“Automação opcional CI / script” + tabela script/NPM/workflow | **OK** |
| **FR-POSQA-07** no PRD | §14 checkbox; §15 linha 1.2 | **OK** |
| **NFR-POSQA-01** (não vazar PII / corpo completo) | Script: truncagem ~180 chars + regex em sequências longas; comentário no cabeçalho; runbook reforça | **OK** |

**Verificação estática do workflow:** `workflow_dispatch` presente; `pull_request` com `paths` relevantes; passo usa `--strict` com env a partir de secrets.

**Risco residual (baixo):** se o Plugnotas alterar comportamento para **2xx** com payload inválido ou passar a devolver só **5xx** de forma estável, o smoke falha — aceitável como sinal de regressão de contrato; revisão de runbook se necessário.

### Gate

**Decisão:** **PASS**

**Conclusão:** Implementação **conforme FR-POSQA-07** e Definition of Done da story. **DevOps:** confirmar secrets no repositório GitHub para o job deixar de aparecer como skipped em cenários onde se pretende evidência CI (opcional).
