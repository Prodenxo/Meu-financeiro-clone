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

cat > "$WS/MF-API.md" << EOF
# Meu Financeiro
- API: $WS/mf-curl.sh '{"phone":"5521...","action":"..."}'
- DAS: $WS/mf-das.sh 5521996185328 03/2026  (grava PDF em /tmp, JSON curto na saída)
- Envio WA: openclaw message send --channel whatsapp --target 5521996185328 --media /tmp/DAS-03-2026.pdf
- NUNCA curl com \$MF_API_URL nem mostrar base64
EOF

echo "--- DAS 03/2026 ---"
"$WS/mf-das.sh" 5521996185328 03/2026
echo "--- DAS 04/2026 ---"
"$WS/mf-das.sh" 5521996185328 04/2026
