# Story: Open Finance (Pluggy) — web Contas MVP

**Status:** InProgress  
**Escopo:** Somente site Next (`web/`), tela `/contas`. Sem Expo/mobile nesta entrega.

## Objetivo

Permitir que o usuário conecte uma instituição via Pluggy Connect (sandbox/produção) e importe **contas** para `contas_financeiras`.

## Fora de escopo (backlog)

- Importar extrato para `lancamentos_id`
- Webhooks Pluggy
- App mobile

## Critérios de aceite

- [ ] Com `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` no backend, botão **Conectar banco (Open Finance)** aparece em Contas.
- [ ] Widget Pluggy abre com connect token gerado no servidor (secret nunca no browser).
- [ ] Após conexão bem-sucedida, contas Pluggy aparecem na lista com `of_provider=pluggy` e `of_external_id` preenchido.
- [ ] Reconectar o mesmo item atualiza contas existentes sem duplicar (índice único).
- [ ] Migração `20261002150000_open_finance_pluggy.sql` aplicada no Supabase.

## File List

- `supabase/migrations/20261002150000_open_finance_pluggy.sql`
- `web/components/contas/OpenFinanceConnect.jsx`
- `web/app/(app)/contas/openFinanceActions.js`
- `web/components/contas/ContasView.jsx`
- Repo app: `backend/src/services/pluggy*.js`, `openFinance*.js`, routes, tests

## Referência

- [Pluggy Docs (PT)](https://docs.pluggy.ai/pt)
