#!/bin/sh
# Console Easypanel — serviço OpenClaw RUNNING.
# Variáveis: Easypanel → Environment (MF_API_URL, OPENCLAW_WEBHOOK_SECRET), depois Restart.

set -e
WS=/home/node/.openclaw/workspace
mkdir -p "$WS"

if ! grep -q 'X-WhatsApp-Sender' "$WS/mf-curl.sh" 2>/dev/null; then
  test -n "$MF_API_URL" && test -n "$OPENCLAW_WEBHOOK_SECRET" || {
    echo "ERRO: defina MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Easypanel → Environment → Restart"
    exit 1
  }
  echo "AVISO: mf-curl antigo detectado — corre apply-soul-patches-all-easypanel.sh ou openclaw-console-fix-das-agent.sh"
fi

rm -f "$WS/mf-das-parse.js"

cat > "$WS/mf-das.js" << 'NODE_EOF'
#!/usr/bin/env node
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const phone = process.argv[2];
const mes = process.argv[3];
if (!phone || !mes) {
  console.error('uso: node mf-das.js 5521996185328 03/2026');
  process.exit(1);
}
const curl = path.join(dir, 'mf-curl.sh');
const body = JSON.stringify({ action: 'get_das_current', payload: { mes, includeBase64: true } });
const raw = execFileSync(curl, [phone, body], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
let r;
try { r = JSON.parse(raw); } catch (e) {
  console.error(raw.slice(0, 500));
  process.exit(1);
}
if (!r.success) {
  console.log(raw);
  process.exit(1);
}
const x = r.data || {};
if (!x.base64) {
  console.log(JSON.stringify({
    success: false,
    message: x.includeBase64 === false ? 'API sem base64 (atualize mf-das.js com includeBase64:true)' : 'sem PDF na API',
    apiMessage: r.message,
    hint: x.execCommand || null,
  }));
  process.exit(1);
}
const fn = String(x.fileName || 'DAS.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
const p = '/tmp/' + fn;
fs.writeFileSync(p, Buffer.from(x.base64, 'base64'));
console.log(JSON.stringify({ success: true, mes: x.mes, fileName: fn, file: p }));
NODE_EOF

printf '#!/bin/sh\nexec node "%s/mf-das.js" "$@"\n' "$WS" > "$WS/mf-das.sh"
chmod +x "$WS/mf-das.js" "$WS/mf-das.sh"

cat > "$WS/mf-das-send.sh" << 'SEND_EOF'
#!/bin/sh
set -e
WS="$(cd "$(dirname "$0")" && pwd)"
PHONE="${1:?phone}"
MES="${2:?MM/YYYY}"
TARGET="${3:-$PHONE}"
OUT="$("$WS/mf-das.sh" "$PHONE" "$MES")" || {
  echo '{"success":false,"step":"mf-das.sh"}'
  exit 1
}
FILE="$(echo "$OUT" | node -e "let j=JSON.parse(require('fs').readFileSync(0,'utf8'));if(!j.file)process.exit(1);process.stdout.write(j.file)")" || {
  echo "$OUT"
  echo '{"success":false,"step":"parse"}'
  exit 1
}
if ! openclaw message send --channel whatsapp --target "$TARGET" --media "$FILE" --message "DAS $MES" 2>/tmp/mf-das-send.err; then
  echo '{"success":false,"step":"openclaw message send"}'
  head -c 200 /tmp/mf-das-send.err 2>/dev/null || true
  exit 1
fi
echo "{\"success\":true,\"mes\":\"$MES\",\"file\":\"$FILE\",\"whatsapp\":\"sent\"}"
SEND_EOF
chmod +x "$WS/mf-das-send.sh"

printf '#!/bin/sh\nset -e\nWS="$(cd "$(dirname "$0")" && pwd)"\nexec "$WS/mf-das-send.sh" "$@"\n' > "$WS/mf-send-das.sh"
chmod +x "$WS/mf-send-das.sh"

cat > "$WS/DAS-WHATSAPP.md" << 'EOF'
# DAS WhatsApp — OBRIGATÓRIO
Um comando por mês (envia PDF de verdade):
  /home/node/.openclaw/workspace/mf-das-send.sh 5521996185328 MM/YYYY
Proibido: curl, get_das_current, só mf-das.sh, dizer "enviei" sem "whatsapp":"sent" no JSON do exec.
EOF

cat > "$WS/MF-API.md" << EOF
# Meu Financeiro

## DAS (único fluxo)
exec: $WS/mf-das-send.sh 5521996185328 03/2026
(ou mf-send-das.sh — mesmo script)
Só confirmar envio se JSON tiver "whatsapp":"sent".
Proibido: curl, fetch, get_das_current, mf-das.sh sozinho.

## Status pagamento DAS
  $WS/mf-curl.sh '{"phone":"5521...","action":"get_das_payment_status","payload":{"mes":"03/2026"}}'

## Outras ações
  $WS/mf-curl.sh '{"phone":"5521...","action":"..."}'
EOF

echo "--- DAS 03/2026 ---"
"$WS/mf-das.sh" 5521996185328 03/2026
echo "--- DAS 04/2026 ---"
"$WS/mf-das.sh" 5521996185328 04/2026
echo "--- Envio WhatsApp (teste manual) ---"
echo "Corre: $WS/mf-send-das.sh 5521996185328 04/2026"
