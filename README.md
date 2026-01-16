# FINANCAS-PESSOAIS-APP

Monorepo com frontend (Vite + React) e backend (Express), mantendo integrações com Supabase e a pasta `/supabase` intacta.

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
```

### Instalação e execução
```
cd backend
npm install
npm run dev
```

### Rotas principais
- `GET /api/health`
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

## Observações
- A pasta `/backend/supabase` e `/supabase` foram preservadas.
- O frontend consome o backend via `VITE_API_URL`, usando a camada `frontend/src/services`.
