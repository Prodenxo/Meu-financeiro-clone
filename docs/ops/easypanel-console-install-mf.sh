#!/bin/sh
# Console Easypanel — serviço OpenClaw RUNNING.
# Variáveis: Easypanel → Environment (MF_API_URL, OPENCLAW_WEBHOOK_SECRET), depois Restart.

set -e
WS=/home/node/.openclaw/workspace
mkdir -p "$WS"

if [ ! -x "$WS/mf-curl.sh" ]; then
  test -n "$MF_API_URL" && test -n "$OPENCLAW_WEBHOOK_SECRET" || {
    echo "ERRO: defina MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Easypanel → Environment → Restart"
    exit 1
  }
  printf '%s\n' '#!/bin/sh' "exec curl -sS -X POST '$MF_API_URL' \\" \
    "-H 'Content-Type: application/json; charset=utf-8' \\" \
    "-H 'Authorization: Bearer $OPENCLAW_WEBHOOK_SECRET' \\" \
    '-d "$1"' > "$WS/mf-curl.sh"
  chmod +x "$WS/mf-curl.sh"
  echo "OK: mf-curl.sh criado"
else
  echo "OK: mf-curl.sh já existe"
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
const body = JSON.stringify({ phone, action: 'get_das_current', payload: { mes } });
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
  console.log(JSON.stringify({ success: false, message: 'sem PDF' }));
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
OUT="$("$WS/mf-das.sh" "$PHONE" "$MES")"
FILE="$(echo "$OUT" | node -e "let j=JSON.parse(require('fs').readFileSync(0,'utf8'));if(!j.file)process.exit(1);process.stdout.write(j.file)")"
openclaw message send --channel whatsapp --target "$TARGET" --media "$FILE" --message "DAS $MES"
echo "{\"success\":true,\"mes\":\"$MES\",\"file\":\"$FILE\",\"whatsapp\":\"sent\"}"
SEND_EOF
chmod +x "$WS/mf-das-send.sh"

cat > "$WS/mf-send-das.sh" << 'MF_SEND_EOF'
#!/bin/sh
set -e
WS="$(cd "$(dirname "$0")" && pwd)"
PHONE="${1:?phone com DDI 55}"
MES="${2:?MM/YYYY}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
"$WS/mf-curl.sh" "{\"phone\":\"$PHONE\",\"action\":\"send_das_whatsapp\",\"payload\":{\"mes\":\"$MES\"}}" > "$TMP"
node -e "
const fs=require('fs');
const r=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
if(!r.success){console.log(JSON.stringify(r));process.exit(1);}
const d=r.data||{};
const st=d.whatsappStatus||'';
if(st==='sent'){console.log(JSON.stringify({success:true,mes:d.mes,fileName:d.fileName,whatsapp:'sent'}));process.exit(0);}
if(st==='skipped_no_webhook'||st==='failed'||st==='skipped_no_phone')process.exit(42);
console.log(JSON.stringify(r));process.exit(1);
" "$TMP" && exit 0
EC=$?
[ "$EC" = "42" ] && exec "$WS/mf-das-send.sh" "$PHONE" "$MES"
exit "$EC"
MF_SEND_EOF
chmod +x "$WS/mf-send-das.sh"

cat > "$WS/MF-API.md" << EOF
# Meu Financeiro — OBRIGATÓRIO

## DAS = PDF no WhatsApp (não texto)
PROIBIDO: "DAS-03-2026.pdf", [[MEDIA:]], get_das_current via mf-curl, base64 no chat.
OBRIGATÓRIO exec (cada mês pedido):
  $WS/mf-send-das.sh 5521996185328 04/2026
Responda só após success:true: "Enviei o PDF da competência MM/YYYY."

## Outras ações
  $WS/mf-curl.sh '{"phone":"5521...","action":"..."}'
EOF

echo "--- DAS 03/2026 ---"
"$WS/mf-das.sh" 5521996185328 03/2026
echo "--- DAS 04/2026 ---"
"$WS/mf-das.sh" 5521996185328 04/2026
echo "--- Envio WhatsApp (teste manual) ---"
echo "Corre: $WS/mf-send-das.sh 5521996185328 04/2026"
