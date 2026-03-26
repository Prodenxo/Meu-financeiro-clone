# Story — PRD correção: schema Supabase (`tipo_logradouro` + NFS-e emitente)

**ID:** STORY-PRD-CORR-SCHEMA-NFSE  
**Prioridade:** **Must** (bloqueia valor de FR-P-03/04 em ambientes com DB desatualizado)  
**Fonte:** `docs/prd/PRD-correcao-supabase-schema-tipo-logradouro-2026-03-26.md`  
**Brief:** `docs/brief/brief-correcao-supabase-tipo-logradouro-schema-cache.md`  
**Arquitetura:** `docs/architecture.md` (Express → Supabase/PostgREST; sem mudança de desenho — apenas consistência DDL ↔ código implantado)  
**Relacionado:** `docs/stories/story-fr-p-03-04-nfse-emitente-user-mei-certificates.md` (implementação de código já entregue; esta story é **ops + validação + processo**)

---

## User stories

**CORR-01 — Como** equipa de plataforma,  
**quero** que cada projeto Supabase usado pela aplicação tenha aplicadas as migrações de emitente NFS-e **incluindo** `tipo_logradouro`,  
**para** o PostgREST aceitar `PATCH /api/mei-guide/certificate/emitente-nfse` sem erro de schema cache.

**CORR-02 — Como** membro da equipa que faz deploy,  
**quero** documentação clara de **qual projeto Supabase** corresponde a **cada ambiente** e um **gate** que migrações críticas rodem antes/atualizem com o código,  
**para** não repetir desalinhamento código ↔ DB em próximos releases.

**CORR-03 — Como** QA ou desenvolvedor validando a correção,  
**quero** executar um roteiro de regressão no fluxo Guia MEI (atualizar emitente sem novo `.pfx` + leitura na UI),  
**para** confirmar FR-CORR-01–03 e fechar o incidente com evidência.

---

## Contexto técnico

| Tema | Detalhe |
|------|---------|
| **Causa** | Código referencia `tipo_logradouro` em `user_mei_certificates`; projeto Supabase remoto sem DDL correspondente → PostgREST: *Could not find the 'tipo_logradouro' column … in the schema cache*. |
| **Migrações (repo)** | `supabase/migrations/20260326140000_add_nfse_emitente_fields_to_user_mei_certificates.sql`, `supabase/migrations/20260326150000_add_tipo_logradouro_user_mei_certificates.sql` — aplicar **na ordem** se ainda não estiverem no histórico do projeto. |
| **Verificação** | Query em `information_schema.columns` para `tipo_logradouro` em `public.user_mei_certificates` (ver PRD §6). |
| **Cache PostgREST** | Se coluna existir e erro persistir: **Reload schema** (ou equivalente) no painel Supabase. |
| **RLS** | NFR-CORR-01: DDL não deve alterar políticas; apenas confirmar que políticas existentes cobrem a tabela (sem novas colunas “órfãs” de política — típico: mesma tabela, mesmas regras por `user_id`). |
| **Fora de escopo** | Alterar `mei-certificate-store.js`, rotas ou UI (já tratado em STORY-FR-P-03-04); corrigir 502 Plugnotas. |

---

## Critérios de aceite

### CORR-01 (schema)

- [ ] Migrações `20260326140000_*` e `20260326150000_*` aplicadas no(s) projeto(s) Supabase dos ambientes afetados (ou equivalente idempotente via `IF NOT EXISTS` já nos scripts).
- [ ] Query de catálogo confirma coluna `tipo_logradouro` (e demais colunas da secção NFS-e do brief) no projeto **correto** ligado ao `.env` do backend.
- [ ] Se necessário, schema cache PostgREST recarregado; `PATCH` deixa de falhar com erro de coluna em falta em cenário feliz.

### CORR-02 (processo / documentação)

- [ ] Entrada em `.cursor/mem/PROJECT_MEMORY.md` (ou runbook acordado) com **mapeamento ambiente → projeto Supabase** (sem secrets: apenas indicação de que o URL/projeto está documentado em local seguro ou nome do projeto).
- [ ] Referência cruzada a este ficheiro de story + PRD de correção + brief de correção.
- [ ] Acordo de equipa registado: **migrações aplicadas antes ou em conjunto** com releases que dependem de novas colunas (gate de deploy — pode ser checklist em PR template ou doc de release).

### CORR-03 (validação)

- [ ] `PATCH /api/mei-guide/certificate/emitente-nfse` retorna **2xx** com payload válido (utilizador autenticado, MEI habilitado) após CORR-01.
- [ ] Dados persistidos aparecem no formulário após refresh ou reentrada no ecrã Guia MEI (`nfseEmitente` / status).
- [ ] Evidência anexada ao ticket (notas de teste manual ou screenshot) ou referência a job de CI se existir no futuro.

### Gates de qualidade (repo)

- [ ] Se **não** houver alteração de código: não é obrigatório `npm run lint` no âmbito desta story; se alterar `PROJECT_MEMORY.md` ou scripts, seguir `AGENTS.md` quando aplicável.

---

## Definition of Done

- Checklist acima completo por ambiente corrigido.
- Story `story-fr-p-03-04-nfse-emitente-user-mei-certificates.md`: referência a esta correção na secção **Relacionado** ou **Change Log** se ainda não existir (uma linha).
- Nenhum segredo (URL completa com credenciais, service role) colado em `docs/` versionado.

---

## Qualidade / CodeRabbit

- **Risco:** aplicar migração no **projeto errado** — mitigar validando `SUPABASE_URL` / nome do projeto no painel antes do DDL.
- **Risco:** regressão RLS — smoke test com utilizador autenticado após DDL (leitura/escrita só da própria linha).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor dev (implementação CORR-01 / CORR-02 / CORR-03)

### Completion Notes List

- CORR-01: adicionado `scripts/nfse-emitente-user-mei-certificates-schema.mjs` com `--check` (lista colunas em `information_schema`) e `--apply` (executa SQL idempotente das migrações `20260326140000_*` e `20260326150000_*` + registo em `schema_migrations` quando possível).
- NPM: `db:verify:nfse-emitente-schema`, `db:apply:nfse-emitente-schema` na raiz; requer `SUPABASE_DB_URL` em `backend/.env` (mesmo padrão que `apply-empresa-invites-via-pg.mjs`).
- Pós-apply: se PostgREST persistir erro de cache, usar **Reload schema** no painel Supabase (API). Validação manual `PATCH` / UI fica em CORR-03.
- **Pós-QA:** `--check` falha com mensagem explícita se `public.user_mei_certificates` não existir (`to_regclass`); cruzamento opcional `SUPABASE_URL` ↔ `SUPABASE_DB_URL` (mesmo project ref); `pg` carregado via `createRequire(backend/package.json)`; aviso `schema_migrations` alinhado a `supabase migration repair`.
- **CORR-02:** runbook `docs/runbook/supabase-ambientes-e-deploy.md` (mapeamento ambiente → projeto sem secrets, gate deploy, links story/PRD/brief); secção **Supabase — ambientes e deploy** em `.cursor/mem/PROJECT_MEMORY.md`; checklist de migrações em `.github/pull_request_template.md`.
- **CORR-02 pós-QA:** `docs/runbook/gitlab-merge-request-template.md` (GitLab/Bitbucket); `.github/workflows/migrations-pr-reminder.yml` (notice em PRs que alteram migrações).
- **CORR-03:** roteiro `docs/runbook/corr-03-validacao-guia-mei-nfse.md` (pré-requisitos, `npm run qa:corr03-smoke-backend`, passos API/UI, tabela de evidência para ticket); ligação no runbook Supabase §4.
- **CORR-03 pós-QA (Quinn):** workflow `.github/workflows/corr03-smoke-backend.yml` executa `npm run qa:corr03-smoke-backend` em PR/push (paths `mei-guide*`, `mei-certificate-store*`, migrações `*user_mei*`, teste emitente). PATCH 2xx, UI e evidência §4 continuam manuais — anexar artefactos ao ticket após validação.
- Runbooks `corr-03-validacao-guia-mei-nfse.md` §1 e `supabase-ambientes-e-deploy.md` §4 referenciam o workflow CI; `.cursor/mem/PROJECT_MEMORY.md` (comandos + nota CI).

### File List

- `scripts/nfse-emitente-user-mei-certificates-schema.mjs`
- `package.json`
- `.cursor/mem/PROJECT_MEMORY.md`
- `docs/runbook/supabase-ambientes-e-deploy.md` (incl. §4 — CI smoke CORR-03)
- `docs/runbook/gitlab-merge-request-template.md`
- `.github/pull_request_template.md`
- `.github/workflows/migrations-pr-reminder.yml`
- `docs/runbook/corr-03-validacao-guia-mei-nfse.md`
- `package.json` (`qa:corr03-smoke-backend`)
- `.github/workflows/corr03-smoke-backend.yml`
- `docs/stories/story-prd-correcao-supabase-schema-tipo-logradouro.md` (Dev Agent Record)

### Change Log

- 2026-03-26 — Story STORY-PRD-CORR-SCHEMA-NFSE criada a partir do PRD de correção (`PRD-correcao-supabase-schema-tipo-logradouro-2026-03-26.md`).
- 2026-03-26 — CORR-01: script verify/apply + npm scripts + nota em PROJECT_MEMORY.
- 2026-03-26 — Ajustes após feedback QA: tabela ausente em `--check`, validação ref Supabase, `pg` via backend.
- 2026-03-26 — CORR-02: runbook Supabase + PROJECT_MEMORY + PR template.
- 2026-03-26 — CORR-02 mitigação QA: template GitLab/Bitbucket + workflow lembrete migrações.
- 2026-03-26 — CORR-03: roteiro validação + script `qa:corr03-smoke-backend`.
- 2026-03-26 — CORR-03 pós-QA: workflow GitHub Actions `corr03-smoke-backend.yml` (smoke em PRs relevantes); runbooks CORR-03 §1 e Supabase §4 referenciam CI.

---

## QA Results

**Revisor:** Quinn (QA) — revisão estática da implementação CORR-01 (2026-03-26).

### Gate

**CONCERNS** — Ferramenta alinhada ao escopo CORR-01 e ao padrão `apply-empresa-invites-via-pg.mjs`; **não** substitui evidência de ambiente remoto (DDL aplicado no projeto certo, reload PostgREST, `PATCH` 2xx). Fechar CORR-01 no checklist exige execução operacional + CORR-03.

### Rastreio aos critérios de aceite (CORR-01)

| Critério | Evidência no repo | Lacuna / nota |
|----------|-------------------|----------------|
| Migrações aplicáveis de forma idempotente | `scripts/nfse-emitente-user-mei-certificates-schema.mjs` `--apply` lê `supabase/migrations/20260326140000_*` e `20260326150000_*`; SQL usa `IF NOT EXISTS` nos `ALTER`. | Aplicação real depende de `SUPABASE_DB_URL` correto e rede; não executado nesta revisão contra projeto vivo. |
| Query de catálogo / colunas | `--check` compara `information_schema.columns` com lista `REQUIRED_COLUMNS` (inclui `tipo_logradouro` e restantes NFS-e do brief). | Se a tabela não existir, o resultado é “todas em falta” — mensagem poderia ser mais explícita (melhoria menor). |
| PostgREST + `PATCH` 2xx | Mensagem pós-`--apply` lembra **Reload schema** no painel. | Fora do script; validação manual ou CORR-03. |

### NFRs (amostra)

| ID | Avaliação |
|----|-----------|
| NFR-CORR-01 (RLS) | DDL só adiciona colunas; não altera políticas. Smoke RLS continua a cargo da equipa após apply. |
| NFR-CORR-02 (rastreabilidade) | Uso de ficheiros versionados em `supabase/migrations/` + tentativa de `schema_migrations`. |
| NFR-CORR-03 (regressão) | Sem teste automatizado do script; `node --check` válido para sintaxe. |

### Riscos / limitações

1. **Projeto errado:** o script usa exclusivamente `backend/.env` → `SUPABASE_DB_URL`; não cruza com `SUPABASE_URL`/project ref — mitigação manual (já referida na story).
2. **`schema_migrations`:** inserção pode falhar em bases não standard; aviso no `catch` — DDL ainda pode ter sido aplicado; alinhar depois com `supabase migration repair` se necessário.
3. **Dependência `pg`:** import a partir da raiz do monorepo (padrão igual ao script de empresa invites); se `npm ci` não levantar `pg` no caminho de resolução, documentar execução a partir de `backend/`.
4. **SSL:** `rejectUnauthorized: false` — coerente com outros scripts; aceitável para connection string Supabase típica.

### Testes recomendados (não executados nesta revisão)

- `npm run db:verify:nfse-emitente-schema` contra projeto de **staging** após `--apply`.
- Smoke: utilizador autenticado `PATCH /api/mei-guide/certificate/emitente-nfse` e `GET .../status` com `nfseEmitente` (CORR-03).

### Recomendações

- **Curto prazo:** após primeiro apply em prod, anexar ao ticket output de `--check` (sucesso) ou query SQL do PRD.
- **Opcional:** teste de integração mínimo com Postgres mock ou container que valide `--check` com tabela sem colunas.

---

### Revisão CORR-02 (processo / documentação)

**Revisor:** Quinn (QA) — 2026-03-26.

#### Gate

**PASS** — Runbook, `PROJECT_MEMORY` e template de PR cumprem os critérios de aceite de CORR-02 no repositório; a tabela de mapeamento permanece com placeholders até a equipa operacional preencher (esperado).

#### Rastreio aos critérios de aceite (CORR-02)

| Critério | Evidência |
|----------|-----------|
| Documentação de mapeamento (sem secrets) | `docs/runbook/supabase-ambientes-e-deploy.md` §1; secção Supabase em `.cursor/mem/PROJECT_MEMORY.md` |
| Referências cruzadas story / PRD / brief | Tabela de referências no runbook + `PROJECT_MEMORY` |
| Gate de deploy (checklist) | `docs/runbook/supabase-ambientes-e-deploy.md` §2–3; `.github/pull_request_template.md` |

#### Riscos / limitações

1. **Template de PR:** padrão GitHub (`.github/pull_request_template.md`); outros forges podem exigir outro ficheiro de template.
2. **Cumprimento humano:** checklists não são executadas automaticamente — depende de disciplina em PRs.
3. **Tabela de ambientes:** placeholders até preenchimento — não é defeito do entregável; rastrear como tarefa de ops.

#### Recomendações

- Preencher a tabela do runbook (local / staging / prod) com *ponteiro* para cofre, sem secretos.
- Opcional: job CI que falhe se `supabase/migrations/` mudar sem evidência de migração aplicada (avaliação de custo/benefício).

---

### Revisão CORR-03 (validação / roteiro QA)

**Revisor:** Quinn (QA) — 2026-03-26.

#### Gate

**CONCERNS** — Roteiro e comando `npm run qa:corr03-smoke-backend` cobrem **documentação** e **smoke** de encadeamento da rota; **PATCH 2xx com Supabase real**, **UI pós-refresh** e **evidência no ticket** permanecem manuais e não foram executados nesta revisão estática.

#### Rastreio aos critérios de aceite (CORR-03)

| Critério | Evidência no repo | Lacuna / nota |
|----------|-------------------|----------------|
| PATCH 2xx (autenticado, MEI) | `docs/runbook/corr-03-validacao-guia-mei-nfse.md` §2; `npm run qa:corr03-smoke-backend` confirma stack da rota (middlewares + handler). | Sem teste de integração HTTP com persistência real/mock. |
| Dados no formulário após refresh | Roteiro §3; `GET .../status` em §2. | Execução manual. |
| Evidência no ticket | Modelo §4 (schema / API / UI). | Preenchimento pela equipa. |

#### Observações

1. **Smoke:** `backend/tests/mei-guide-routes-emitente.test.js` corresponde ao que o runbook declara (não substitui prova contra Supabase).
2. **Continuidade:** `docs/runbook/supabase-ambientes-e-deploy.md` §4 liga ao roteiro CORR-03.
3. **Dívida opcional:** supertest + stub Supabase para `PATCH` emitente-nfse — melhoria futura.

#### Recomendações

- Após validação manual bem-sucedida, anexar artefactos da tabela §4 do runbook CORR-03 ao ticket ou à story.
- Opcional: job CI que execute `npm run qa:corr03-smoke-backend` em PRs que alterem `mei-guide` ou `user_mei_certificates`.

— Quinn, guardião da qualidade 🛡️
