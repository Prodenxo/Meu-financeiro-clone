# Tech Stack

Stack tecnológica do Meu-financeiro (finanças pessoais + módulo MEI).

## Frontend

- **Runtime:** React 18, Vite 5
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS
- **Estado:** Zustand
- **Roteamento:** React Router
- **Gráficos / calendário:** Chart.js, react-big-calendar
- **Auth/cliente dados:** Supabase JS (anon key apenas; API via backend)

## Backend

- **Runtime:** Node (ESM)
- **Framework:** Express
- **Auth/dados:** Supabase JS (anon + service role)
- **Middleware:** CORS, morgan

## Dados e Auth

- **Plataforma:** Supabase
- **Banco:** Postgres (migrations em `supabase/migrations/`)
- **Auth:** Supabase Auth (email/senha, recovery, Google OAuth)
- **Edge:** Edge Functions (Deno) para auth, users, transactions, categories, google-calendar

## Integrações externas

- **PlugNotas:** NFSe, NFC-e, NFe (API key apenas no backend; webhook com token)
- **Serpro:** MEI (guias, certificado)
- **Google Calendar:** OAuth + proxy/Edge Function
- **n8n/WhatsApp (Z-API):** automação DAS (envio de mensagens)

## Build e qualidade

- **Build raiz:** `npm run build` (frontend); backend sem build (Node ESM)
- **Gates:** `npm run lint`, `npm run typecheck`, `npm test` (workspaces)
- **Deploy:** frontend estático (Render/Vercel); backend em serviço separado
