# Meu Financeiro — Site (Next.js)

Front web em **`web/`** (Next.js, App Router, `:3000`).

**API Express, app Expo (celular) e Supabase “de produto”** ficam no repositório irmão:

`Documents/Dev/Meu-financeiro-app`

(Este repo ainda traz cópia de `supabase/` e scripts de migrate para quem só trabalha no site; o canônico para app+API é o repo irmão.)

## Começar

```powershell
cd web && npm install    # uma vez
npm run dev              # na raiz -> http://localhost:3000
```

Env: `web/.env.local` ← `web/.env.example`  
`MEI_API_URL` aponta para a API (local `:3333` ou produção).

## Comandos na raiz

| Comando | Efeito |
|---------|--------|
| `npm run dev` | Next.js (`web/`) |
| `npm run lint:web` / `test:web` / `build:web` | Gates do site |

## Estrutura

```
web/         Site Next.js
supabase/    migrations / Edge Functions (espelho; ver repo app)
scripts/     utilitários (migrate, etc.)
docs/        documentação (histórico compartilhado)
```

## Mobile + backend

Não estão mais neste repositório. Use **Meu-financeiro-app** (`npm run dev` = API + Expo).
