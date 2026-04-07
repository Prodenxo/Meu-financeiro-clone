# Runbook — Supabase: ambientes, mapeamento e gate de deploy

**Objetivo (CORR-02):** evitar desalinhamento entre código implantado e schema PostgREST/Postgres (ex.: colunas em falta em `user_mei_certificates`).

**RLS (`user_mei_certificates`):** a migração `20260407150000_user_mei_certificates_rls.sql` ativa RLS com políticas *own row* (`user_id = auth.uid()`). O backend Node usa **service role** e continua a ler/gravar sem depender dessas políticas; clientes **anon** não têm políticas ⇒ sem acesso direto à tabela via PostgREST com chave anon.

**Referências canónicas**

| Documento | Caminho |
|-----------|---------|
| Story | `docs/stories/story-prd-correcao-supabase-schema-tipo-logradouro.md` |
| PRD | `docs/prd/PRD-correcao-supabase-schema-tipo-logradouro-2026-03-26.md` |
| Brief | `docs/brief/brief-correcao-supabase-tipo-logradouro-schema-cache.md` |
| Memória do repo | `.cursor/mem/PROJECT_MEMORY.md` |

---

## 1. Mapeamento ambiente → projeto Supabase

**Regra:** não versionar connection strings com password, nem `service_role` em claro. Guardar **nome do projeto no painel** e **project ref** (20 caracteres) no cofre da equipa (ex.: gestor de segredos, 1Password).

| Ambiente | App / backend `.env` | Onde está o project ref / URL (sem colar aqui) |
|----------|----------------------|-----------------------------------------------|
| Local dev | `backend/.env` | *Preencher: ex. “cofre X, entrada Y”* |
| Staging | *variável de deploy* | *Preencher* |
| Produção | *variável de deploy* | *Preencher* |

**Validação rápida no repo:** se `SUPABASE_URL` e `SUPABASE_DB_URL` existirem no mesmo `.env`, o script `npm run db:verify:nfse-emitente-schema` exige que o **mesmo** project ref apareça no host da API e no host `db.<ref>.supabase.co`.

---

## 2. Gate de deploy (migrações ↔ código)

**Acordo de equipa:** alterações em `supabase/migrations/` **ou** código que dependa de DDL novo (novas colunas, tabelas) só entram em produção quando:

1. As migrações **já foram aplicadas** (ou serão aplicadas **na mesma** janela de release, antes do tráfego usar o código novo), no projeto Supabase correspondente ao ambiente.
2. Após deploy, se o PostgREST devolver erro de *schema cache*, usar **Reload schema** no painel Supabase (API) quando necessário.

**Verificação sugerida (exemplo NFS-e emitente):**

```text
npm run db:verify:nfse-emitente-schema
```

Ou, com Supabase CLI ligado ao projeto: `npm run db:migrate:prod:check` (ver `package.json` e variáveis `SUPABASE_PROD_*`).

---

## 3. Checklist de PR / MR

- **GitHub:** `.github/pull_request_template.md` — item explícito para migrações ou código que dependa de schema novo.
- **GitLab / Bitbucket:** ver `docs/runbook/gitlab-merge-request-template.md` (mesmo checklist, caminhos de ficheiro do forge).
- **CI:** em GitHub Actions, o workflow `.github/workflows/migrations-pr-reminder.yml` regista um *notice* quando o PR altera `supabase/migrations/**` (lembrete; não substitui revisão humana).

---

## 4. Validação pós-deploy (CORR-03)

Após DDL e deploy, validar o fluxo Guia MEI / emitente NFS-e (PATCH + UI): `docs/runbook/corr-03-validacao-guia-mei-nfse.md`.

- **CI (smoke de rota):** `.github/workflows/corr03-smoke-backend.yml` corre `npm run qa:corr03-smoke-backend` em PRs que toquem código ou migrações relevantes (não substitui validação manual §2–4 do roteiro).

---

**Última atualização:** 2026-04-07 — nota RLS `user_mei_certificates` (FR-CAD-DOC P1); 2026-03-26 — CORR-02; 2026-03-26 — templates outros forges + workflow lembrete (pós-QA); 2026-03-26 — CORR-03 (ligação roteiro validação); 2026-03-26 — CORR-03 workflow smoke CI (pós-QA Quinn).
