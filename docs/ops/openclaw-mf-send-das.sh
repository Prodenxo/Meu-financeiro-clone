#!/bin/sh
# Uma linha para o agente OpenClaw: envia DAS no WhatsApp.
# 1) Tenta send_das_whatsapp (n8n/Z-API, resposta curta)
# 2) Se webhook não configurado, usa openclaw message send --media (mf-das-send.sh)
# Uso: mf-send-das.sh 5521996185328 04/2026
set -e
WS="$(cd "$(dirname "$0")" && pwd)"
PHONE="${1:?phone com DDI 55}"
MES="${2:?MM/YYYY}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

"$WS/mf-curl.sh" "{\"phone\":\"$PHONE\",\"action\":\"send_das_whatsapp\",\"payload\":{\"mes\":\"$MES\"}}" > "$TMP"

FALLBACK=0
node -e "
const fs = require('fs');
const r = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
if (!r.success) {
  console.log(JSON.stringify(r));
  process.exit(1);
}
const d = r.data || {};
const st = d.whatsappStatus || '';
if (st === 'sent') {
  console.log(JSON.stringify({ success: true, mes: d.mes, fileName: d.fileName, whatsapp: 'sent', message: r.message }));
  process.exit(0);
}
if (st === 'skipped_no_webhook' || st === 'failed' || st === 'skipped_no_phone') {
  process.exit(42);
}
console.log(JSON.stringify(r));
process.exit(1);
" "$TMP" && exit 0

EC=$?
if [ "$EC" = "42" ]; then
  exec "$WS/mf-das-send.sh" "$PHONE" "$MES"
fi
exit "$EC"
