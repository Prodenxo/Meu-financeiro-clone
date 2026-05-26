# NFSe — envio automático do PDF (backend + Z-API)

Quando `OPENCLAW_NFSE_AUTO_WHATSAPP_ENABLED=true` no backend de produção:

1. `emit_nfse` (OpenClaw) grava na nota: telefone + `openclawWhatsappPdfPending: true`.
2. O backend tenta enviar em **retries in-process** (5s … 3min) e quando a nota passa a `concluido` (sync Plugnotas / botão Actualizar estado).
3. **Cron** (cada 2 min) é **backup** — consulta pendentes e envia PDF via **Z-API** (sem n8n).
4. O Midas **não** precisa ficar em loop na conversa (ver `openclaw-midas-SOUL.md`).

## Variáveis (Easypanel — serviço **backend**)

```env
OPENCLAW_NFSE_AUTO_WHATSAPP_ENABLED=true
ZAPI_INSTANCE_ID=...
ZAPI_TOKEN=...
ZAPI_CLIENT_TOKEN=...
WHATSAPP_OUTBOUND_MODE=zapi
CRON_SECRET=...
```

(Ou `N8N_WHATSAPP_WEBHOOK_URL` se ainda usar n8n noutro fluxo — NFSe automático preferir Z-API directo.)

## Cron (cron-job.org ou similar)

- **URL:** `GET https://SEU_BACKEND/api/cron/nfse-whatsapp-pending`
- **Header:** `Authorization: Bearer SEU_CRON_SECRET`
- **Intervalo:** cada **2** minutos
- **Timeout:** 30s (resposta **202** imediata; processamento em background)

Teste manual com lote completo:

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://SEU_BACKEND/api/cron/nfse-whatsapp-pending?sync=1"
```

## Fallback OpenClaw

Se Z-API falhar (`skipped_no_whatsapp` / `failed`), o `emit_nfse` devolve `execCommand` com `mf-nfse-send.sh` — instalar com `easypanel-console-install-nfse-BLOCO1.sh`.

## Deploy SOUL

Após alterar `openclaw-midas-SOUL.md`, regenerar partes b64 e redeploy no workspace OpenClaw (como no fluxo SOUL existente).
