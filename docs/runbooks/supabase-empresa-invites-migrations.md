# Runbook: migrations `empresa_invites` e release de `/api/invites`

| Campo | Valor |
| --- | --- |
| **Story** | US-INV-07 |
| **PRD** | [`docs/prd/PRD-convite-usuario-por-empresa.md`](../prd/PRD-convite-usuario-por-empresa.md) §2.4, NFR-07 |
| **Brief (sintoma)** | [`docs/brief/brief-empresa-invites-relation-does-not-exist.md`](../brief/brief-empresa-invites-relation-does-not-exist.md) |

## NFR-07 (gate de release)

Nenhuma promoção de backend que exponha **`POST /api/invites`** e rotas relacionadas deve ir a **staging** ou **produção** sem:

1. Migrations aplicadas no Postgres **do mesmo** projeto Supabase referenciado por `SUPABASE_URL` no `.env` do backend.
2. Smoke SQL abaixo com resultado positivo.

Aceite operacional: **@po** / **@github-devops** (ou processo equivalente do time) confirma o checklist em PR de release ou registro de deploy.

---

## Sintoma típico (suporte — OR-05)

- **UI:** banner ou resposta com `relation "public.empresa_invites" does not exist`.
- **API:** `400` + mensagem genérica “Erro interno do servidor” enquanto o Postgres devolve o erro acima.

**Classificação:** em primeiro nível, tratar como **schema desatualizado** ou **backend apontando para projeto/banco errado** (migrations não aplicadas nesse alvo), **não** como bug da regra de negócio do convite, até existir evidência em contrário.

Brief detalhado: [`brief-empresa-invites-relation-does-not-exist.md`](../brief/brief-empresa-invites-relation-does-not-exist.md).

---

## Pré-requisito: paridade `.env` ↔ Supabase (OR-02)

- `backend/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (e anon se usado) devem ser do **mesmo** projeto em que as migrations serão aplicadas.
- Evitar cenário “apliquei migration no projeto **A** mas o backend fala com o projeto **B**”.

---

## Migrações relevantes (OR-01)

Arquivos canônicos no repositório:

- `supabase/migrations/20260325120000_create_empresa_invites.sql`
- `supabase/migrations/20260326120000_empresa_invites_force_row_level_security.sql`

Decisão técnica / RLS: [`docs/adr/ADR-empresa-user-invites-table-rls.md`](../adr/ADR-empresa-user-invites-table-rls.md).

---

## Desenvolvimento local (OR-03)

Na **raiz** do monorepo (dependência `supabase` na raiz):

1. Garantir Docker disponível se usar stack local do Supabase.
2. Subir ambiente local conforme documentação do time (`supabase start`).
3. Aplicar migrações pendentes:
   - **Reset completo** (apaga dados locais; útil para alinhar ao estado das migrations):

     ```bash
     npx supabase db reset
     ```

   - Ou apenas aplicar o que falta (sem reset), conforme fluxo acordado:

     ```bash
     npx supabase migration up
     ```

     `npx supabase migration up` (e `db reset`) aplicam-se ao **contexto atual da CLI**: stack local após `supabase start`, **ou** projeto **remoto** já associado com `supabase link` na pasta `supabase/`. Sem `link` nem stack local, o comando não tem alvo definido.

4. Confirmar smoke SQL (seção seguinte).

### Só projeto Supabase remoto (sem `supabase start` local)

Se **não** usas Postgres local via Docker:

1. Na pasta `supabase/`: `supabase login` (se necessário) e `supabase link --project-ref <ref>` ao mesmo projeto que o `backend/.env`.
2. Aplicar migrations ao remoto, por exemplo:

   ```bash
   npx supabase db push
   ```

   (ou `npx supabase migration up` com projeto linkado — ver [documentação Supabase CLI](https://supabase.com/docs/guides/cli) para a variante do teu fluxo.)

3. Executar o smoke SQL no **SQL Editor** desse projeto (secção seguinte).

---

## Staging / produção (remoto) (OR-03)

Scripts na raiz do monorepo (variáveis obrigatórias e flags — ver fonte):

- `npm run db:migrate:prod:check`
- `npm run db:migrate:prod` (aplicação controlada; exige confirmação e env)

Implementação: `scripts/supabase-migrate-prod.mjs`.

Alternativa: `supabase link` + `supabase db push` (ou pipeline CI/CD que aplica `supabase/migrations/`) desde que o **project ref** seja o mesmo do backend.

### Fallback: `db push` com erro no pooler (timeout / SASL)

Se `npx supabase db push` falhar ao ligar a `*.pooler.supabase.com`, mas tiveres **`SUPABASE_DB_URL`** (Postgres direto `db.<ref>.supabase.co`) em `backend/.env`:

```bash
npm run db:apply:empresa-invites
```

Script: [`scripts/apply-empresa-invites-via-pg.mjs`](../../scripts/apply-empresa-invites-via-pg.mjs) — aplica só as duas migrations de `empresa_invites` e regista versões em `supabase_migrations.schema_migrations` em falta. **Requisito:** rede acede ao host `db.*.supabase.co` e password válida na URL.

---

## Smoke pós-deploy (OR-04)

No SQL Editor do Supabase ou `psql` contra o banco **do ambiente**:

```sql
select to_regclass('public.empresa_invites');
```

**Esperado:** retorno `empresa_invites` (nome da relação), **não** `null`.

---

## Checklist rápido (PR / release)

- [ ] `SUPABASE_URL` do backend = projeto onde as migrations rodaram.
- [ ] Migrations de convites aplicadas (ou pipeline verde equivalente).
- [ ] `select to_regclass('public.empresa_invites');` ≠ `null` no banco alvo.
- [ ] Smoke manual opcional: `POST /api/invites` autenticado em ambiente de teste não retorna erro de relação inexistente.

---

## Referências

- `package.json` — scripts `db:migrate:prod*`
- PR template (GitHub): [`.github/PULL_REQUEST_TEMPLATE/supabase-migrations.md`](../../.github/PULL_REQUEST_TEMPLATE/supabase-migrations.md) — checklist ao abrir PR que toca migrations / convites
- Épico: [`docs/stories/epic-convite-usuario-por-empresa-prd.md`](../stories/epic-convite-usuario-por-empresa-prd.md) (US-INV-07)
