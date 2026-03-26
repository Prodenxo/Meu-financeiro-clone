# Memória do projeto (Cursor)

<!--
CURSOR-MEM-AIOX
Este ficheiro substitui o papel do plugin **claude-mem** no Cursor: factos estáveis
sobre o repo, decisões e preferências da equipa. Atualize após conclusões importantes.
Não grave secrets, tokens nem dados pessoais.
-->

## Mapa rápido do repositório

| Área | Caminho |
|------|---------|
| Frontend | `frontend/` |
| Backend | `backend/` |
| Scripts raiz | `scripts/` |
| Documentação / stories | `docs/` |
| Runbook Supabase / deploy | `docs/runbook/supabase-ambientes-e-deploy.md` |
| Template MR GitLab / Bitbucket | `docs/runbook/gitlab-merge-request-template.md` |
| Validação pós-schema NFS-e (CORR-03) | `docs/runbook/corr-03-validacao-guia-mei-nfse.md` |
| Framework AIOX (local) | `.aiox-core/` |
| Regras Cursor | `.cursor/rules/` |
| Bootstrap / squads | `squads/` |

## Decisões de arquitetura

- Dados mínimos NFS-e do emitente: colunas em `user_mei_certificates` (migrações `20260326140000_*` e `20260326150000_add_tipo_logradouro_user_mei_certificates.sql` para tipo de via); gravação via `POST /mei-guide/certificate` (multipart) e `PATCH /mei-guide/certificate/emitente-nfse`; leitura em `GET /mei-guide/certificate/status` no campo `nfseEmitente`.

## Supabase — ambientes e deploy (CORR-02)

- **Mapeamento ambiente → projeto:** tabela editável em `docs/runbook/supabase-ambientes-e-deploy.md` (placeholders). **Não** versionar passwords nem URLs com credenciais; project ref e nome do projeto no painel ficam no **cofre** da equipa (indicar no runbook *onde* está documentado, não o segredo).
- **Gate de release:** PRs que alterem `supabase/migrations/` ou que dependam de schema novo devem documentar que as migrações foram aplicadas (ou na mesma janela de deploy) no ambiente alvo — checklist em `.github/pull_request_template.md` + detalhe no runbook; GitLab/Bitbucket: `docs/runbook/gitlab-merge-request-template.md`.
- **CI:** workflow `migrations-pr-reminder.yml` (GitHub) emite *notice* se o PR tocar em `supabase/migrations/**` — lembrete, não bloqueia merge.
- **Rastreio de correção schema:** `docs/stories/story-prd-correcao-supabase-schema-tipo-logradouro.md`, `docs/prd/PRD-correcao-supabase-schema-tipo-logradouro-2026-03-26.md`, `docs/brief/brief-correcao-supabase-tipo-logradouro-schema-cache.md`.

## Convenções do repositório

- (ex.: branches, commits, idioma de mensagens)

## Preferências da equipa

- Responder em **português** nas interações do assistente.
- Perguntar antes de alterar código quando o escopo não estiver explícito.
- **CLI first** — `npm run lint`, `typecheck`, `test` como gates (ver `AGENTS.md`).

## Comandos úteis (raiz)

```text
npm run dev              # frontend (via workspace)
npm run dev:backend
npm run lint
npm run typecheck
npm run test
npm run sync:ide              # regras .cursor/rules/agents/ + slash commands .cursor/commands/aiox-*.md
npm run validate:structure
npm run validate:agents
npm run db:verify:nfse-emitente-schema   # CORR-01: confirma colunas NFS-e + tipo_logradouro (SUPABASE_DB_URL em backend/.env)
npm run db:apply:nfse-emitente-schema    # aplica migrações 20260326140000 + 20260326150000 via Postgres direto
npm run db:migrate:prod:check            # Supabase CLI link + migration list (requer SUPABASE_PROD_* + login)
npm run qa:corr03-smoke-backend          # CORR-03: teste unitário rota PATCH emitente-nfse (middlewares)
```

GitHub Actions: `.github/workflows/corr03-smoke-backend.yml` executa o mesmo smoke em PRs que alterem ficheiros `mei-guide*`, `mei-certificate-store*`, migrações `*user_mei*` ou o teste emitente (ver `paths` no workflow).

## Glossário / termos

- (termos de domínio do app para manter consistência na UI e API)

## Armadilhas conhecidas

- `npm run db:verify:nfse-emitente-schema` / `db:apply:nfse-emitente-schema`: se `SUPABASE_URL` e `SUPABASE_DB_URL` existirem em `backend/.env` com **project ref** diferente, o script aborta (evita DDL no projeto errado). `--check` recusa também se `public.user_mei_certificates` não existir, com mensagem explícita.

## Contexto em aberto

- (pendências que afetam mais do que uma story)

## Última atualização

- **2026-03-26** — CORR-03 pós-QA: workflow `corr03-smoke-backend.yml` (smoke `qa:corr03-smoke-backend` em PRs relevantes); PATCH/UI/evidência §4 permanecem manuais.
- **2026-03-26** — CORR-03: roteiro QA `docs/runbook/corr-03-validacao-guia-mei-nfse.md` (API + UI + evidência ticket).
- **2026-03-26** — CORR-02: runbook `docs/runbook/supabase-ambientes-e-deploy.md`, mapeamento + gate de deploy; template de PR em `.github/pull_request_template.md`; pós-QA: `docs/runbook/gitlab-merge-request-template.md` + workflow `migrations-pr-reminder.yml`.
- **2026-03-26** — CORR-01: scripts `db:verify:nfse-emitente-schema` / `db:apply:nfse-emitente-schema` para alinhar DDL remoto com migrações `user_mei_certificates` (sem depender só do SQL Editor).
- **2026-03-26** — Emitente NFS-e persistido em `user_mei_certificates` + rotas `mei-guide` (`nfseEmitente` no status).
- **2026-03-25** — `npm run sync:ide` gera slash commands AIOX em `.cursor/commands/aiox-*.md` (integração IDE sync).
- **2026-03-25** — Protocolo Cursor ampliado (paridade operacional com fluxo claude-mem: leitura obrigatória em trabalhos grandes, formato de entradas, secções glossário/armadilhas).
