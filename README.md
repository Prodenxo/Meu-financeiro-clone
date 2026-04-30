# FINANCAS-PESSOAIS-APP

Monorepo com frontend (Vite + React), backend (Express) e camada Supabase centralizada em `/supabase`.

## Estrutura (alto nível)

```
/backend
  /src
    /config
    /controllers
    /middlewares
    /models
    /routes
    /services
    /utils
  package.json
  .env
/frontend
  /src
  /public
  /services
  package.json
/supabase
/financas-pessoais-mobile (se existir)
README.md
```

## Variáveis de ambiente

- **Nunca commite `.env`.** Use `backend/.env.example` e `frontend/.env.example` como referência; copie para `.env` em cada pasta e preencha com valores reais.
- Arquivos `.env` estão no `.gitignore`; em caso de exposição acidental, rode a rotação de segredos conforme política do projeto.

## Backend (Express)

### Variáveis de ambiente (`backend/.env`)

```
NODE_ENV=development
PORT=3333
CORS_ORIGIN=http://localhost:3000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
PLUGNOTAS_API_BASE_URL=
PLUGNOTAS_API_KEY=
PLUGNOTAS_TIMEOUT_MS=15000
PLUGNOTAS_WEBHOOK_TOKEN=
```

Observações sobre CORS:

- `CORS_ORIGIN` aceita múltiplas origens separadas por vírgula (ex.: `https://meu-financeiro-frontend.vercel.app,http://localhost:3000,http://localhost:3001`).
- Em produção, se `CORS_ORIGIN` não estiver definido, o backend usa `FRONTEND_URL` como fallback.

### Instalação e execução

```
cd backend
npm install
npm run dev
```

**Smoke test (saúde):** com o backend no ar na porta configurada (padrão `3333`), use `GET http://localhost:3333/health` — resposta esperada `{"status":"ok"}`. Esta rota está na **raiz** do `Express`, não sob `/api`. Para a Guia MEI e erros _Failed to fetch_ vs Plugnotas, veja [Antes de atribuir erro ao Plugnotas](docs/operacao-mei-nfse.md#guia-mei-conectividade-local).

### Rotas principais

Lista **não exaustiva** (amostra histórica de onboarding). Para o mapa real de prefixos, use `backend/src/routes/index.js` (`router.use`). Rotas fiscais / Guia MEI / Plugnotas: ver [`docs/operacao-mei-nfse.md`](docs/operacao-mei-nfse.md).

- `GET /health` (raiz do servidor — smoke test rápido)
- `GET /api/health/supabase` (checagem Supabase; ver `backend/src/routes/health.routes.js`)
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/signout`
- `GET /api/auth/session`
- `POST /api/auth/reset-password`
- `POST /api/auth/process-recovery-hash`
- `POST /api/auth/exchange-code-for-session`
- `POST /api/auth/update-password`
- `POST /api/auth/update-phone`
- `POST /api/auth/update-display-name`
- `POST /api/auth/update-role`
- `GET /api/transactions`
- `POST /api/transactions`
- `PUT /api/transactions`
- `DELETE /api/transactions`
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories`
- `DELETE /api/categories`
- `POST /api/users/sync-phone`
- `GET /api/users/empresas/current`
- `GET /api/users/empresas/:empresaId`
- `GET/POST /api/google-calendar/:path`

## Frontend (Vite + React)

### Variáveis de ambiente (`frontend/.env`)

```
VITE_API_URL=http://localhost:3333
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Instalação e execução

```
cd frontend
npm install
npm run dev
```

Por padrão o Vite está configurado para rodar na porta `3000`.

## Scripts na raiz

```
npm run dev         # roda o frontend
npm run dev:frontend
npm run dev:backend
```

## Supabase: migrations e convites por empresa (US-INV-07)

Se o backend retornar erro de banco do tipo **`relation "public.empresa_invites" does not exist`** ao usar **Convites por link** (`POST /api/invites`), em geral faltam **aplicar as migrations** no Postgres **do mesmo** projeto que `SUPABASE_URL` do `backend/.env`, ou o `.env` aponta para outro projeto.

- **Runbook completo** (local, remoto, smoke SQL, checklist de release, triagem de suporte): [`docs/runbooks/supabase-empresa-invites-migrations.md`](docs/runbooks/supabase-empresa-invites-migrations.md).
- **PR (GitHub):** ao alterar migrations ou convites, usar o modelo [`supabase-migrations`](.github/PULL_REQUEST_TEMPLATE/supabase-migrations.md) na descrição do pull request (se o repositório estiver no GitHub).
- **Brief do sintoma:** [`docs/brief/brief-empresa-invites-relation-does-not-exist.md`](docs/brief/brief-empresa-invites-relation-does-not-exist.md).

**NFR-07:** não promover backend com `/api/invites` para staging/produção sem migrations aplicadas e smoke `to_regclass('public.empresa_invites')` no banco alvo (detalhes no runbook).

## Observações

- A fonte canônica de Edge Functions e migrations é `supabase/`.
- O frontend consome o backend via `VITE_API_URL`, usando a camada `frontend/src/services`.
