# Navegação no app (Expo Router)

## Entrada

- **`package.json` → `"main": "expo-router/entry"`**
- Rotas em [`app/`](../app/) (file-based routing)
- Layout autenticado: [`app/(app)/_layout.tsx`](../app/(app)/_layout.tsx) — drawer, gates de acesso, ativação

## Web vs mobile

- **Web (meiinfinito.com.br):** shell desktop com drawer lateral (`AppShell`, `SideDrawer`)
- **Mobile:** mesmas rotas; header + menu drawer conforme layout

## Deep links

- Scheme: `financas-pessoais` (ver [`app.json`](../app.json))
- Google Calendar OAuth: [`docs/ENV.md`](./ENV.md)
- Recuperação de senha: tratada em [`app/_layout.tsx`](../app/_layout.tsx)

## Histórico

Antes existia navegação custom em `navigation/SimpleNavigator.tsx` via `App.tsx` + `index.ts`. Foi **removida** — o app usa só Expo Router desde SDK 55.
