# ADR — Tabela `empresa_invites` e RLS (convite por empresa)

| Campo | Valor |
| --- | --- |
| **Status** | Aceito (implementação US-INV-01) |
| **Data** | 2026-03-25 |
| **Contexto** | PRD [`docs/prd/PRD-convite-usuario-por-empresa.md`](../prd/PRD-convite-usuario-por-empresa.md); épico [`docs/stories/epic-convite-usuario-por-empresa-prd.md`](../stories/epic-convite-usuario-por-empresa-prd.md) |

## Decisão

1. **Nome da tabela:** `public.empresa_invites`.
2. **Segredo do convite:** o valor aleatório entregue na URL **não** é persistido em claro. Persiste-se apenas **`token_hash`** (esperado: **SHA-256** do token em **hex**, 64 caracteres — definido na camada de aplicação na US-INV-02).
3. **Auditoria mínima:** `created_by`, `created_at`, `expires_at`, `used_at`, `revoked_at`, `empresas_id`; opcional `invited_email` (nulo até US-INV-06).
4. **RLS:** papéis **`usuario`** / **`outsider`** / não administrativos **não** possuem políticas `SELECT`/`INSERT`/`UPDATE` → acesso negado via cliente Supabase autenticado comum. **`admin`** só enxerga e altera linhas com `empresas_id = current_empresa_id()`. **`superadmin`** acessa todas as linhas, reconhecido por `current_app_role() = 'superadmin'` **ou** `current_role() = 'superadmin'` (perfil em `profiles`), alinhado ao risco de superadmin existir só em `profiles`. **FORCE ROW LEVEL SECURITY** está habilitado na tabela (migração `20260326120000_empresa_invites_force_row_level_security.sql`), alinhando ao endurecimento usado em outras tabelas sensíveis do projeto.
5. **Papel `anon`:** nenhuma política nesta tabela na US-INV-01; validação pública do token (PRD FR-05) fica na **API backend** (service role) na US-INV-02, evitando vazar estado de convites para o cliente anônimo.
6. **URL / query string:** o formato exato (`/register?convite=…` ou path dedicado) e a geração do token são responsabilidade da aplicação; este ADR **não** documenta formato do segredo.

## FR-A02 (consumo pós-cadastro) — US-INV-03

**Momento:** após **signUp / signIn bem-sucedido** no cliente Supabase, o front chama **`POST /api/invites/accept`** com **Bearer** (sessão do usuário recém-criado) e corpo **`{ "token": "<token bruto do link>" }`**.

**Campo opcional `mei` (boolean):** default no backend **`true`** — o convidado entra na contagem **MEI** (`max_mei` / `countActiveUsersByMei` com `mei` true), alinhado ao fluxo típico do app. O front (**US-INV-05**) deve enviar **`"mei": false`** quando o convidado for **não-MEI**, para aplicar `max_usuarios_nao_mei` e a mesma regra que `createUser`.

**Backend (Express + service role):** valida elegibilidade (`assertUserEligibleForEmpresaInvite` — sem vínculo ativo em `role_x_user_x_empresa`, perfil não admin/superadmin); valida convite; **atualização condicional** `used_at` só se `used_at` e `revoked_at` nulos e `expires_at` futuro; `ensureEmpresaCapacity` (mesma regra que `createUser`); insere `role_x_user_x_empresa` com papel **`usuario`** via `ensureRoleId`; **upsert** em `profiles` com **`role: 'usuario'`** (coerência com `current_role()` / QA US-INV-03). Se capacidade, insert, upsert de profile ou passo intermediário falhar: remove o vínculo inserido (se houver), depois **`used_at` → `null`** (compensação). Falhas ao reverter são logadas em `console.error` para diagnóstico. Atomicidade total exigiria transação/RPC no Postgres — não nesta entrega; ver smoke em staging.

## Migração

- Criação da tabela e políticas: [`supabase/migrations/20260325120000_create_empresa_invites.sql`](../../supabase/migrations/20260325120000_create_empresa_invites.sql).
- **FORCE RLS (revisão QA US-INV-01):** [`supabase/migrations/20260326120000_empresa_invites_force_row_level_security.sql`](../../supabase/migrations/20260326120000_empresa_invites_force_row_level_security.sql).

## API HTTP (US-INV-02)

Prefixo do backend: `/api` (ver `server.js`). Rotas em [`backend/src/routes/empresa-invites.routes.js`](../../backend/src/routes/empresa-invites.routes.js):

| Método | Caminho | Auth | Descrição |
| --- | --- | --- | --- |
| `POST` | `/api/invites` | Bearer | Cria convite; resposta inclui `inviteUrl` absoluto (`INVITE_APP_BASE_URL` → `FRONTEND_URL` → `Origin`). |
| `GET` | `/api/invites` | Bearer | Lista pendentes (`used_at`/`revoked_at` nulos, `expires_at` futuro). Query `empresas_id` só para superadmin. |
| `POST` / `PATCH` | `/api/invites/:inviteId/revoke` | Bearer | Revoga pendente no escopo. |
| `GET` | `/api/invites/validate?token=` | Público | Estado: `valid` \| `expired` \| `revoked` \| `used` \| `invalid`. Rate limit in-memory (env `INVITE_VALIDATE_MAX_PER_MINUTE`). |
| `POST` | `/api/invites/validate` | Público | Corpo JSON `{ "token": "..." }`; mesmo rate limit. |
| `POST` | `/api/invites/accept` | Bearer | Corpo `{ "token": "..." }`, opcional `"mei"` (bool, default `true`); consome convite, vínculo `usuario`, alinha `profiles.role` (US-INV-03). |

TTL padrão ao criar: **7 dias** (`empresa-invites.service.js`).

## Operação / deploy

- Após merge, aplicar migrações no ambiente (`supabase db push`, CI ou fluxo do time) e fazer smoke mínimo: usuário `authenticated` com papel `usuario` não deve conseguir `select` em `empresa_invites` pelo cliente; `admin` só vê convites da própria empresa. Rotas autenticadas exigem `admin` ou `superadmin` (validação no serviço).

**Smoke `accept` (staging):** criar convite → registro com link → `POST /api/invites/accept` com token → verificar `empresa_invites.used_at`, linha em `role_x_user_x_empresa`, `profiles.role = 'usuario'` para o novo usuário; repetição com mesmo token deve retornar erro controlado sem segundo vínculo.

## Consequências

- Operações administrativas diretas no painel Supabase com `authenticated` respeitam RLS; **service role** continua bypass (uso esperado do backend).
- Expiração padrão (ex.: 7 dias) é definida na aplicação ao inserir `expires_at`, não no banco.
