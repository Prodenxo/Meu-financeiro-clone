# Aprovar cadastros pelo OpenClaw (sem mudar webhook Z-API)

Se o **Ao receber** da Z-API continua no **n8n** (`/webhook/financas`), não precisas alterar o painel Z-API.

## Fluxo

```text
WhatsApp → Z-API → n8n/financas → OpenClaw (Midas)
                                    └─ mf-curl.sh → backend list_access_requests / approve_access_request
```

## O que fazer

1. **Deploy do backend** no Easypanel (código com as actions novas).
2. **SOUL** no OpenClaw: secção “solicitações de cadastro” em `openclaw-midas-SOUL.md` (curl Git, 1 colagem — ver `deploy-soul-sem-b64.md`).
3. No WhatsApp, como **superadmin** (telefone na app):

| Tu escreves | O Midas deve |
|-------------|--------------|
| mf pendentes / lista cadastros pendentes | `list_access_requests` |
| aprovar cadastro milena@email.com | `approve_access_request` + email |
| recusar cadastro fulano@email.com | `reject_access_request` |

## Teste rápido (PowerShell)

```powershell
curl.exe -s -X POST "https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/bot/openclaw/action" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer SEU_OPENCLAW_WEBHOOK_SECRET" `
  -d "{\"phone\":\"5521996185328\",\"action\":\"list_access_requests\"}"
```

(Troca telefone e segredo.)

## Env no backend

- `OPENCLAW_WEBHOOK_SECRET` — já usas no Midas
- `ACCESS_REQUEST_WHATSAPP_NOTIFY_ENABLED=true` — aviso ao aprovar para o solicitante

**Não precisas** de `ZAPI_WEBHOOK_TOKEN` no Easypanel se o webhook Z-API ficar só no n8n.
