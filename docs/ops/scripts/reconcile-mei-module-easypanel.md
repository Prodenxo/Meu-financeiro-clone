# Corrigir MEI fantasma nos pedidos de acesso (sem SQL)

## O que aconteceu

No fluxo **“Quero garantir meu acesso”**, o cadastro gravava:

| Campo | Valor errado | Valor certo |
|-------|--------------|-------------|
| `empresas.max_mei` | **1** (MEI “ligado” na empresa) | **0** |
| `role_x_user_x_empresa.mei` | `false` (já estava certo na aprovação) | `false` |

Ou seja: a empresa **nascia com 1 vaga MEI**, embora ninguém tivesse vendido MEI. Somado ao bug da UI (admin sempre via MEI), parecia que todo mundo tinha MEI liberado.

**Vendas MEI** no vosso modelo são **manuais** no painel (superadmin define `max_mei` e liga o toggle no utilizador). Não depende de Stripe.

## O que o script faz (em linguagem simples)

Para cada empresa:

1. Se **ninguém** tem `mei = true` no vínculo, mas a empresa tem `max_mei = 1` (bug do cadastro) → **`max_mei` passa a `0`**.
2. Se a empresa já tem `max_mei = 0` mas algum vínculo ficou com `mei = true` por engano → **`mei` passa a `false`**.

**Não mexe** em empresas onde alguém já tem `mei = true` (MEI vendido e ligado de propósito).

## Como correr (só a lista de pedidos de acesso — recomendado)

```powershell
cd "C:\Users\Usuário\Documents\Dev\Meu Financeiro\Site\backend"

# Dry-run — só as ~20 empresas do ficheiro scopes/mei-cadastro-bug-2026-06.json
node scripts/one-time/reconcile-mei-module.mjs --scope-file=scripts/one-time/scopes/mei-cadastro-bug-2026-06.json

# Aplicar só nesse escopo
node scripts/one-time/reconcile-mei-module.mjs --scope-file=scripts/one-time/scopes/mei-cadastro-bug-2026-06.json --apply
```

O script resolve empresas por **CNPJ** e por **e-mail do admin** do pedido. Mostra a lista antes de alterar. **Não mexe** em outras empresas.

As empresas da lista devem aparecer com `reset_max_mei` de `1` → `0` quando ninguém tem `mei=true` no vínculo.

## Depois

1. Deploy backend `mei-cadastro-max0-v9` + edge function `submit-access-request`.
2. Clientes **logout/login** (app/web).
3. Novos cadastros já nascem com `max_mei: 0`.

## Alternativa sem script

Superadmin abre **Usuários** ou **Empresas** na web (com backend v9) — a mesma reconciliação corre no servidor.
