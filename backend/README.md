# Backend (Express API)

Esta pasta contém o backend principal em Node + Express.

## Estrutura

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   └── utils/
├── tests/
└── package.json
```

## Fonte canônica do Supabase

- **Edge Functions**: `supabase/functions/` (na raiz do projeto)
- **Migrations**: `supabase/migrations/` (na raiz do projeto)

O diretório `backend/supabase/functions` foi descontinuado para evitar drift entre cópias.

## Rodando localmente

```bash
cd backend
npm install
npm run dev
```

## Testes

```bash
cd backend
npm test
```

## Deploy de Edge Functions (Supabase)

Use a pasta canônica `supabase/`:

```bash
cd supabase
supabase link --project-ref <seu-project-ref>
supabase functions deploy google-calendar
```
