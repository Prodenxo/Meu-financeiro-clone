---
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: [regression_tests, dead_code_removal, test_suite_validation]
---

# Story — DAS-CRON-02: Remoção do scheduler setInterval legado

**ID:** STORY-DAS-CRON-02  
**Epic:** EPIC-DAS-CRON-FIX  
**Prioridade:** Must  
**Fonte:** `docs/stories/EPIC-das-vercel-cron-fix.md`  
**Depende de:** STORY-DAS-CRON-01 (deve estar em review ou done antes desta iniciar)  
**Status:** Draft

## User story

**Como** desenvolvedor do projeto,  
**quero** remover o scheduler `setInterval` legado que nunca funciona em produção,  
**para** eliminar dead code confuso e garantir que a única fonte de disparo seja o Vercel Cron Job implementado na DAS-CRON-01.

## Contexto técnico

- **Dead code a remover:** `startMonthlyDasScheduler()`, `runSchedulerTick()`, `acquireMonthlyRunLock()` em `backend/src/services/mei-das.service.js`.
- **O que NÃO remover:** `runMonthlyAutomaticDasDownload()`, `generateAndStoreDasForUser()`, e todas as funções de negócio. Apenas o mecanismo de agendamento via `setInterval` deve ser deletado.
- **server.js:** remover o `import` de `startMonthlyDasScheduler` e sua chamada dentro de `app.listen()`.
- **Testes afetados:** `backend/tests/mei-das.service.test.js` provavelmente cobre `shouldRunMonthlyJob()` e lógica do scheduler — esses testes devem ser removidos ou adaptados.
- **Variável de ambiente obsoleta:** `MEI_DAS_SCHEDULER_ENABLED` não terá mais uso após esta story.
- **Stack:** Node ESM, Express. [Source: docs/framework/tech-stack.md]

## Critérios de aceite

- [ ] As funções `startMonthlyDasScheduler`, `runSchedulerTick` e `acquireMonthlyRunLock` não existem mais em `mei-das.service.js`.
- [ ] `server.js` não importa nem chama `startMonthlyDasScheduler`.
- [ ] A constante `SCHEDULER_INTERVAL_MS`, `SCHEDULER_HOUR`, `SCHEDULER_TIMEZONE` e a variável `schedulerHandle`/`lastRunKey` são removidas se não mais referenciadas.
- [ ] As funções `runMonthlyAutomaticDasDownload` e `generateAndStoreDasForUser` continuam exportadas e funcionais.
- [ ] `npm test` passa — testes do scheduler removidos; testes de negócio do DAS intactos.
- [ ] `npm run lint` e `npm run typecheck` passam.
- [ ] `docs/operacao-mei-nfse.md` não menciona mais `MEI_DAS_SCHEDULER_ENABLED`.

## Fora de escopo

- Alteração da lógica de geração de DAS (`generateAndStoreDasForUser`, `runMonthlyAutomaticDasDownload`).
- Alterações no endpoint cron (responsabilidade da STORY-DAS-CRON-01).
- Alterações de banco de dados.

## Definition of Done

- Dead code removido; `npm test` verde; documentação atualizada.

## Notas técnicas para o Dev

### Funções a remover de `mei-das.service.js`

```
startMonthlyDasScheduler()   → remover export e implementação
runSchedulerTick()           → remover (função interna)
acquireMonthlyRunLock()      → remover (função interna)
```

### Constantes/variáveis a remover de `mei-das.service.js`

```javascript
// Remover estas linhas se não forem mais referenciadas por nenhuma função restante:
const SCHEDULER_INTERVAL_MS = 5 * 60 * 1000;
const SCHEDULER_HOUR = 8;
// SCHEDULER_TIMEZONE pode permanecer se ainda usado em getSaoPauloDateParts
let schedulerHandle = null;
let lastRunKey = null;
```

> **Atenção:** `SCHEDULER_TIMEZONE` é usado por `getSaoPauloDateParts()` que é usada por `shouldRunMonthlyJob()`, `getPreviousCompetencia()` etc. Verificar dependências antes de remover.

### Funções a MANTER em `mei-das.service.js`

```
runMonthlyAutomaticDasDownload()   ← manter (chamada pelo endpoint cron)
generateAndStoreDasForUser()       ← manter
getPreviousCompetencia()           ← manter
normalizeCompetencia()             ← manter
normalizeStatusFilter()            ← manter
shouldRunMonthlyJob()              ← avaliar: pode remover se não usado pelo endpoint
listAdminCompanyDasStatus()        ← manter
listAdminCompanyPendingDas()       ← manter
reprocessDasForAdmin()             ← manter
```

### Modificação em `server.js`

```javascript
// REMOVER esta linha de import:
import { startMonthlyDasScheduler } from './services/mei-das.service.js';

// REMOVER esta chamada dentro de app.listen():
startMonthlyDasScheduler();
```

### Testes a remover/adaptar em `backend/tests/mei-das.service.test.js`

- Remover testes que cobrem `startMonthlyDasScheduler`, `runSchedulerTick`, `shouldRunMonthlyJob` (se este último for removido).
- Manter testes de `normalizeCompetencia`, `getPreviousCompetencia`, `normalizeStatusFilter`, `runMonthlyAutomaticDasDownload`.

### Documentação a atualizar

`docs/operacao-mei-nfse.md`: remover qualquer referência a `MEI_DAS_SCHEDULER_ENABLED` e ao scheduler `setInterval`. Substituir pela referência ao Vercel Cron Job (configurado em `backend/vercel.json`, variável `CRON_SECRET`).

---

## 🤖 CodeRabbit Integration

**Story Type Analysis:**
- Primary Type: Architecture (remoção de dead code / refactor)
- Complexity: Low — remoção cirúrgica, sem novos arquivos, impacto controlado

**Specialized Agent Assignment:**
- Primary: `@dev` (implementação)
- Supporting: `@qa` (validação de que nenhuma funcionalidade de negócio foi quebrada)

**Quality Gate Tasks:**
- [ ] Pre-Commit (`@dev`): `coderabbit --prompt-only -t uncommitted` — verificar que nenhuma export usada externamente foi removida
- [ ] Pre-PR (`@devops`): `coderabbit --prompt-only --base main` — confirmar zero regressão

**Self-Healing Configuration:**
- Primary Agent: `@dev` — light mode
- Max Iterations: 2
- Severity Filter: CRITICAL only

**Focus Areas:**
- Backward compatibility: `runMonthlyAutomaticDasDownload` e `generateAndStoreDasForUser` continuam exportadas
- Remoção limpa: sem referências mortas a `schedulerHandle`, `lastRunKey`
- Testes: suite continua verde após remoção dos testes do scheduler

---

## Dev Agent Record

### Status

Draft

### File List

*(preencher após implementação)*

### Change Log

- 2026-04-06 — Story criada por River (@sm) para epic EPIC-DAS-CRON-FIX.
