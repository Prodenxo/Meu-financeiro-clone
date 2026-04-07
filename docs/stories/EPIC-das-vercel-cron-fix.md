# Epic — Correção da Automação DAS: Vercel Cron Job

**ID:** EPIC-DAS-CRON-FIX  
**Data:** 2026-04-06  
**Tipo:** Brownfield Enhancement — Bug Fix / Infra  
**Status:** Draft  
**Prioridade:** Must (funcionalidade core quebrada em produção)  
**PM:** Morgan (Strategist)

---

## Epic Goal

Corrigir a automação mensal de geração do DAS para que funcione em produção na Vercel, substituindo o `setInterval` — incompatível com ambientes serverless — por **Vercel Cron Jobs**, garantindo execução confiável no dia 1 de cada mês às 08:00 (America/Sao_Paulo).

---

## Contexto do Sistema Existente

**Problema raiz identificado pelo @aiox-master:**

A automação DAS foi implementada com `setInterval` no `backend/src/services/mei-das.service.js` e é iniciada dentro de `startServer()` em `server.js`. Porém:

1. `server.js:112` bloqueia `startServer()` quando `VERCEL=1`:
   ```js
   if (process.env.VERCEL !== '1') { void startServer(); }
   ```
2. A Vercel é serverless — cada request é um container efêmero; `setInterval` não sobrevive entre chamadas.

**Resultado:** O scheduler nunca dispara em produção. O DAS não é gerado automaticamente desde o deploy.

**Stack relevante:**
- Backend: Express.js deployado como serverless functions na Vercel
- Database: Supabase (tabelas `das_mensal_status`, `das_mensal_job_runs`)
- Lógica de geração: `mei-das.service.js` — `runMonthlyAutomaticDasDownload()` já implementada e testada
- Lock de idempotência: tabela `das_mensal_job_runs` (já funcional)

**O que NÃO muda:** toda a lógica de negócio de geração do DAS (`generateAndStoreDasForUser`, `runMonthlyAutomaticDasDownload`) permanece intacta. A correção é somente no **mecanismo de disparo**.

---

## Enhancement Details

**O que será adicionado/alterado:**

1. **Endpoint Cron** — `GET /api/cron/das-mensal` com proteção por `CRON_SECRET`
2. **Configuração Vercel Cron** — entry em `backend/vercel.json` (schedule dia 1, 08:00 UTC-3 = 11:00 UTC)
3. **Remoção do scheduler legado** — desativar `startMonthlyDasScheduler()` e o `setInterval` para evitar confusão e dead code

**Como integra:**
- O endpoint chama diretamente `runMonthlyAutomaticDasDownload()` (já existe, já testada)
- A idempotência é garantida pela tabela `das_mensal_job_runs` (já funciona)
- Zero mudança em banco de dados

**Critérios de sucesso:**
- Cron job executa no dia 1 de cada mês (verificável via logs Vercel)
- Tabela `das_mensal_job_runs` registra execução com `run_type = 'automatico'`
- Endpoint retorna 401 para chamadas sem `CRON_SECRET` válido
- Scheduler legado (`setInterval`) removido sem quebrar testes existentes

---

## Stories

### Story 1 — Endpoint Cron + Configuração Vercel
**ID:** STORY-DAS-CRON-01  
**Executor:** `@dev`  
**Quality Gate:** `@architect`  
**Quality Gate Tools:** `[security_validation, api_contract_review, config_review]`

- Criar `backend/src/routes/cron.routes.js` com `GET /api/cron/das-mensal`
- Proteção via middleware que valida header `Authorization: Bearer {CRON_SECRET}`
- Handler chama `runMonthlyAutomaticDasDownload()`
- Adicionar entry de cron em `backend/vercel.json`:
  ```json
  { "path": "/api/cron/das-mensal", "schedule": "0 11 1 * *" }
  ```
- Registrar `CRON_SECRET` como variável de ambiente na Vercel
- **Quality Gates:**
  - Pre-Commit: validação de segurança do endpoint (sem vazamento de dados), header auth obrigatório
  - Pre-PR: revisão de contrato da API, validação da cron expression

**YAML Frontmatter:**
```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [security_validation, api_contract_review, config_review]
```

---

### Story 2 — Remoção do Scheduler Legado (setInterval)
**ID:** STORY-DAS-CRON-02  
**Executor:** `@dev`  
**Quality Gate:** `@qa`  
**Quality Gate Tools:** `[regression_tests, dead_code_removal, test_suite_validation]`

- Remover `startMonthlyDasScheduler()`, `runSchedulerTick()`, `acquireMonthlyRunLock()` de `mei-das.service.js`  
  *(as funções de negócio `runMonthlyAutomaticDasDownload`, `generateAndStoreDasForUser` permanecem)*
- Remover import e chamada de `startMonthlyDasScheduler` em `server.js`
- Atualizar testes para remover cobertura do scheduler legado
- Atualizar `docs/operacao-mei-nfse.md` removendo referência à variável `MEI_DAS_SCHEDULER_ENABLED`
- **Quality Gates:**
  - Pre-Commit: garantir que nenhum teste quebra com a remoção
  - Pre-PR: confirmar que `runMonthlyAutomaticDasDownload` continua exportada e testada

**YAML Frontmatter:**
```yaml
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: [regression_tests, dead_code_removal, test_suite_validation]
```

---

## Sequência de Implementação

```
Story 1 (endpoint + vercel cron) → Story 2 (remover legado) → @devops push + deploy
```

Story 2 pode ser implementada em paralelo após Story 1 estar em review.

---

## Compatibilidade

- [ ] APIs existentes (admin DAS routes) permanecem sem alteração
- [ ] Lógica de negócio de geração (`generateAndStoreDasForUser`) sem alteração
- [ ] Tabelas do banco sem alteração
- [ ] Testes de `runMonthlyAutomaticDasDownload` continuam válidos

---

## Risco e Mitigação

| Risco | Probabilidade | Mitigação |
|---|---|---|
| CRON_SECRET não configurado na Vercel | Médio | Documentar no runbook; endpoint retorna 401 graciosamente |
| Cron expression errada (timezone) | Baixo | Vercel usa UTC; `0 11 1 * *` = 08:00 BRT (UTC-3) |
| Remoção do scheduler quebrar testes | Baixo | Story 2 exige atualização dos testes como pré-requisito |

**Plano de rollback:** Reverter `vercel.json` e restaurar scheduler via `MEI_DAS_SCHEDULER_ENABLED=true` (variável ainda existe até Story 2 ser deployed).

---

## Definition of Done

- [ ] Story 1 completa: endpoint protegido + cron configurado na Vercel
- [ ] Story 2 completa: dead code removido, testes passando
- [ ] Execução manual do endpoint verificada (via curl com `CRON_SECRET`)
- [ ] Primeira execução automática documentada nos logs Vercel
- [ ] `docs/operacao-mei-nfse.md` atualizado

---

## Handoff para @sm

> "Por favor, desenvolva stories detalhadas para este epic. Sistema existente: Express.js serverless na Vercel + Supabase. 
> 
> Pontos críticos:
> - Story 1: o endpoint deve obrigatoriamente validar `CRON_SECRET` via header Authorization — sem isso, qualquer chamada HTTP geraria DAS para todos os usuários
> - Story 2: remover SOMENTE o scheduler (setInterval) — as funções de negócio `runMonthlyAutomaticDasDownload` e `generateAndStoreDasForUser` devem permanecer intactas e testadas
> - Padrões existentes: ver `backend/src/routes/admin.routes.js` para padrão de rotas e middlewares
> - Variável de ambiente nova: `CRON_SECRET` — documentar no runbook de operação"

---

*Epic criada por Morgan (Strategist) em 2026-04-06*
