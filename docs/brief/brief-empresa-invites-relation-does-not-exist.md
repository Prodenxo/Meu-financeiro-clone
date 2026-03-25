# Brief: `relation "public.empresa_invites" does not exist` ao gerar convite por link

| Campo | Valor |
| --- | --- |
| **Data** | 2026-03-25 |
| **Contexto** | Tela **Configurações → Usuários**, seção **Convites por link**; ação **Gerar link** com empresa selecionada (ex.: CF FRANQUIAS). |
| **Severidade percebida** | Alta (fluxo de convites inoperante). |
| **Severidade real (causa raiz)** | **Schema do banco desatualizado** em relação ao código — a tabela `empresa_invites` ainda não existe no Postgres usado pelo backend. |

---

## 1. O que os sintomas indicam (evidência)

1. **Banner na UI:** mensagem explícita do Postgres: `relation "public.empresa_invites" does not exist`.
2. **Toast:** “Erro interno do servidor” — resumo genérico da API; o detalhe útil é o texto do banner / logs do backend.
3. **Network:** `POST http://localhost:5000/api/invites` com **400** e corpo do tipo `{ "success": false, "message": "Erro interno do servidor" }` (o código HTTP pode variar conforme tratamento de erros; o erro de BD já foi exposto na interface em alguns builds).

**Conclusão analítica:** não é falha de “lógica de convite” isolada nem de CORS. O serviço que persiste o convite executa SQL contra **`public.empresa_invites`**, e o banco conectado **não tem** essa relação.

---

## 2. Evidência no repositório (o que *deveria* existir)

A criação da tabela está versionada em:

- `supabase/migrations/20260325120000_create_empresa_invites.sql` — `create table public.empresa_invites (...)` + índices, RLS e políticas.
- `supabase/migrations/20260326120000_empresa_invites_force_row_level_security.sql` — `alter table ... force row level security`.

Se esses arquivos **não** foram aplicados no ambiente (local, staging ou produção) ao qual `SUPABASE_URL` / string de conexão do backend apontam, o erro reproduz exatamente como na tela.

---

## 3. Plano de resolução (ordem recomendada)

### Passo A — Confirmar o alvo do backend

- Garantir que o `.env` do **backend** aponta para o **mesmo** projeto Supabase / instância Postgres onde você pretende ter os dados (evita “migrei o projeto A mas o app fala com o B”).

### Passo B — Aplicar as migrations nesse banco

**Desenvolvimento com Supabase local (CLI):**

1. Na raiz do monorepo, com CLI instalada (`devDependency` `supabase` na raiz).
2. Subir stack local se for o caso (`supabase start`).
3. Aplicar migrações pendentes, por exemplo:

   ```bash
   npx supabase db reset
   ```

   (recria o estado a partir das migrations — útil em DEV; **cuidado:** apaga dados locais conforme comportamento padrão do reset.)

   Ou, se o fluxo do time for só “aplicar o que falta” sem reset:

   ```bash
   npx supabase migration up
   ```

   (confira na documentação do Supabase CLI a variante que o projeto usa: linked project vs local.)

**Projeto Supabase hospedado (remoto):**

- O repositório expõe scripts de migração controlada, por exemplo:

  - `npm run db:migrate:prod:check`
  - `npm run db:migrate:prod` (com variáveis e flags confirmadas — ver `scripts/supabase-migrate-prod.mjs` e comentários no `package.json`).

- Alternativa operacional comum: `supabase link` + `supabase db push` ou pipeline CI que aplica `supabase/migrations/` — desde que seja o **mesmo** projeto ref do backend.

### Passo C — Verificação objetiva no Postgres

Após aplicar, confirmar que a relação existe (SQL no SQL editor do Supabase ou `psql`):

```sql
select to_regclass('public.empresa_invites');
```

Esperado: retorno `empresa_invites` (não `null`).

### Passo D — Retestar a UI

- Voltar a **Gerar link** na empresa correta.
- Esperado: criação do registro sem o erro de relação inexistente; listagem de convites pendentes deve funcionar se o restante do fluxo estiver OK.

---

## 4. Critérios de sucesso (“resolvido”)

1. `public.empresa_invites` existe no banco usado pelo backend.
2. `POST /api/invites` (ou rota equivalente) **não** falha com “relation does not exist”.
3. Convites aparecem na tabela da tela ou erro subsequente, se houver, é **outro** (RLS, permissão, validação de empresa), tratável à parte.

---

## 5. Notas para evitar recorrência

- Documentar no onboarding: **após puxar branch com novas migrations**, rodar o fluxo acordado (local reset/up ou deploy de migrations no projeto remoto).
- Em produção, tratar erro de schema como incidente de release (migrations não aplicadas), não como bug de feature isolado.

---

## 6. Referências no repo

- **Runbook (checklist release + NFR-07):** [`docs/runbooks/supabase-empresa-invites-migrations.md`](../runbooks/supabase-empresa-invites-migrations.md)
- Migrações: `supabase/migrations/20260325120000_create_empresa_invites.sql`, `20260326120000_empresa_invites_force_row_level_security.sql`
- Decisão / RLS: `docs/adr/ADR-empresa-user-invites-table-rls.md`
- Story: `docs/stories/epic-convite-usuario-por-empresa-prd.md` (US-INV-07)

— Brief elaborado para diagnóstico e correção operacional (schema vs. código).
