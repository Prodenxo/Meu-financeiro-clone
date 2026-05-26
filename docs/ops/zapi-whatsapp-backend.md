# Z-API — envio WhatsApp pelo backend (sem n8n)

O backend envia texto e PDF (DAS MEI, lembretes de agenda, admin) via **Z-API HTTP**, sem passar pelo workflow n8n.

## Dois tokens diferentes

| Variável | Uso |
|----------|-----|
| `ZAPI_WEBHOOK_TOKEN` | **Entrada** — autentica `POST /api/webhooks/zapi/inbound?token=...` |
| `ZAPI_CLIENT_TOKEN` | **Saída** — header `Client-Token` em `send-text` / `send-document/pdf` |

O “token de webhook” que colas na URL da Z-API **não substitui** o `Client-Token` de envio, salvo se no painel Z-API for o mesmo valor de segurança (copia também para `ZAPI_CLIENT_TOKEN`).

## Variáveis no Easypanel / `.env`

```env
WHATSAPP_OUTBOUND_MODE=auto
ZAPI_INSTANCE_ID=<id da instância>
ZAPI_TOKEN=<token do path da URL>
ZAPI_CLIENT_TOKEN=<Client-Token do painel>
# ZAPI_API_BASE_URL=https://api.z-api.io
```

Onde obter:

1. Painel Z-API → instância conectada.
2. URL de exemplo: `https://api.z-api.io/instances/**INSTANCE_ID**/token/**ZAPI_TOKEN**/send-text`
3. **Token de segurança** da conta → `ZAPI_CLIENT_TOKEN`.

Modo `WHATSAPP_OUTBOUND_MODE`:

- `auto` (padrão): Z-API se as três vars de instância estiverem preenchidas; senão n8n.
- `zapi`: força Z-API.
- `n8n`: força webhook legado.

## O que passa a usar Z-API

- `POST` admin envio DAS WhatsApp
- `MEI_DAS_AUTO_WHATSAPP_ENABLED` (cron DAS)
- `GET /api/cron/agenda-lembretes` (lembretes 07:00 / 21:00)
- `openclaw-bot` action `send_das_whatsapp` (quando configurado no backend)

## Teste rápido (texto)

Com o backend a correr e env preenchida:

```bash
node -e "
import { sendZapiText } from './src/services/zapi-outbound.service.js';
const r = await sendZapiText({ phone: '5511999999999', message: 'teste Z-API backend' });
console.log(r);
"
```

(Substitui o número por um válido ligado à instância.)

## Migração n8n → Z-API

1. Preencher `ZAPI_*` no backend de produção.
2. `WHATSAPP_OUTBOUND_MODE=auto` ou `zapi`.
3. Testar um envio admin DAS + um `agenda-lembretes` em staging.
4. Remover ou desactivar workflow n8n de envio quando estiver estável.
5. Manter `ZAPI_WEBHOOK_TOKEN` para mensagens **recebidas** (inbound → relay OpenClaw).

Ver também: `n8n-zapi-das-mei.md` (payload e endpoints HTTP equivalentes).
