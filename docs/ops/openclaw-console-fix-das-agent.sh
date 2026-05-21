#!/bin/sh
# Console Easypanel — serviço OpenClaw RUNNING. Cola o ficheiro inteiro ou corre linha a linha.
set -e
WS=/home/node/.openclaw/workspace
mkdir -p "$WS"

test -x "$WS/mf-curl.sh" || {
  test -n "$MF_API_URL" && test -n "$OPENCLAW_WEBHOOK_SECRET" || {
    echo "ERRO: defina MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Easypanel → Restart"
    exit 1
  }
  printf '%s\n' '#!/bin/sh' "exec curl -sS -X POST '$MF_API_URL' \\" \
    "-H 'Content-Type: application/json; charset=utf-8' \\" \
    "-H 'Authorization: Bearer $OPENCLAW_WEBHOOK_SECRET' \\" \
    '-d "$1"' > "$WS/mf-curl.sh"
  chmod +x "$WS/mf-curl.sh"
}

# mf-das.js com includeBase64
cat > "$WS/mf-das.js" << 'NODE_EOF'
#!/usr/bin/env node
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const phone = process.argv[2];
const mes = process.argv[3];
if (!phone || !mes) {
  console.error('uso: node mf-das.js TELEFONE_REMETENTE_55 03/2026');
  process.exit(1);
}
const curl = path.join(dir, 'mf-curl.sh');
const body = JSON.stringify({ phone, action: 'get_das_current', payload: { mes, includeBase64: true } });
const raw = execFileSync(curl, [body], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
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
  console.log(JSON.stringify({ success: false, message: 'sem PDF', apiMessage: r.message }));
  process.exit(1);
}
const fn = String(x.fileName || 'DAS.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
const p = '/tmp/' + fn;
fs.writeFileSync(p, Buffer.from(x.base64, 'base64'));
const acc = x.dasAccount || {};
console.log(JSON.stringify({
  success: true,
  mes: x.mes,
  fileName: fn,
  file: p,
  dasAccount: acc.displayName ? acc : null,
  message: (r.message || '') + (acc.displayName ? ' Conta: ' + acc.displayName : ''),
}));
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
OUT="$("$WS/mf-das.sh" "$PHONE" "$MES")" || { echo '{"success":false,"step":"mf-das.sh"}'; exit 1; }
FILE="$(echo "$OUT" | node -e "let j=JSON.parse(require('fs').readFileSync(0,'utf8'));if(!j.file)process.exit(1);process.stdout.write(j.file)")" || { echo "$OUT"; exit 1; }
openclaw message send --channel whatsapp --target "$TARGET" --media "$FILE" --message "DAS $MES" || { echo '{"success":false,"step":"whatsapp"}'; exit 1; }
echo "{\"success\":true,\"mes\":\"$MES\",\"file\":\"$FILE\",\"whatsapp\":\"sent\"}"
SEND_EOF
chmod +x "$WS/mf-das-send.sh"

printf '#!/bin/sh\nset -e\nWS="$(cd "$(dirname "$0")" && pwd)"\nexec "$WS/mf-das-send.sh" "$@"\n' > "$WS/mf-send-das.sh"
chmod +x "$WS/mf-send-das.sh"

printf '%s\n' \
  'DAS: exec mf-das-send.sh com o TELEFONE DO REMETENTE deste chat (DDI 55).' \
  'PROIBIDO usar 5521996185328 ou outro número de exemplo se não for o remetente.' \
  'Confirme dasAccount.displayName no JSON antes de enviar.' \
  'Proibido: curl manual, get_das_current no chat.' \
  'Só diga enviado se JSON tiver "whatsapp":"sent".' > "$WS/DAS-WHATSAPP.md"

printf '%s\n' \
  'DAS: mf-das-send.sh <telefone_remetente_55> MM/YYYY' \
  'Confirmar só com "whatsapp":"sent" no JSON.' > "$WS/MF-API.md"

echo "=== ficheiros ==="
ls -la "$WS"/mf-*.sh "$WS"/*.md
echo "=== teste (opcional) — troca pelo TEU telefone do painel OpenClaw ==="
echo "mf-curl resolve_user:"
echo "  $WS/mf-curl.sh '{\"phone\":\"55XXXXXXXXXXX\",\"action\":\"resolve_user\"}'"
echo "mf-das + WhatsApp:"
echo "  $WS/mf-das.sh 55XXXXXXXXXXX 02/2026"
echo "  $WS/mf-das-send.sh 55XXXXXXXXXXX 02/2026"
