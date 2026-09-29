# Meu Financeiro

API Express + app **Expo** + Supabase, num so repositorio.

## Comece aqui

```powershell
npm install        # instala backend + frontend (workspaces)
npm run dev        # abre a API (:3333) noutro terminal e o Expo neste (web: tecla w -> :8081)
```

Antes disso, crie os `.env` copiando os exemplos de cada pasta:

- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`
- `web/.env.example` -> `web/.env.local` (Next.js)

## Web em Next.js (`web/`) — migração em andamento

O front web esta a ser migrado do Expo para **Next.js (App Router, JavaScript)**. A pasta `web/` e um
pacote separado (nao entra nos workspaces para nao misturar versoes de React com o Expo).

```powershell
cd web && npm install     # uma vez
npm run dev:web           # na raiz -> http://localhost:3000
```

Ja migrado: telas de acesso (login, **Cadastre-se** = solicitacao de acesso PF/PJ com CNPJ automatico,
cadastro por convite `/register?convite=`, recuperar e redefinir senha, termos/privacidade), casca do app
(menu lateral, tema claro/escuro), a **Visao geral** e **Transacoes** (filtros, recorrencias previstas,
editar/duplicar/excluir, marcar como pago e exportar Excel).
Os itens do menu ainda nao migrados abrem no app Expo (`NEXT_PUBLIC_LEGACY_APP_URL`, ex.: `http://localhost:8081`).

## Estrutura

```
backend/     API Express (porta 3333) — config em backend/config/
frontend/    App Expo (celular + web :8081)
web/         Front web em Next.js (:3000) — migração em andamento
supabase/    migrations e config do banco
scripts/     utilitarios da raiz (dev.ps1, migrate, smoke)
docs/        documentacao (ops, stories, tecnico)
Dockerfile   imagem da API (Easypanel / Docker)
```

## Comandos na raiz

| Comando | Efeito |
|---------|--------|
| `npm run dev` | API + Expo |
| `npm run dev:api` | So a API |
| `npm run dev:frontend` | So o Expo |
| `npm run dev:web` | So o Next.js (`web/`) |
| `npm run lint:web` / `test:web` / `build:web` | Gates do `web/` |
| `npm run typecheck` / `npm test` | Nos workspaces |
| `npm run db:migrate:prod:check` | Verifica migrations em prod |

## Deploy

- **API:** `Dockerfile` na raiz (Easypanel / Docker). Se o painel ainda apontar para `Dockerfile.backend`, troque para `Dockerfile` (era uma copia identica).
- **App:** EAS / lojas — ver `frontend/docs/DEPLOY.md`.
- Front **Vite** antigo (Render/Vercel): removido; fica so no historico do git.
