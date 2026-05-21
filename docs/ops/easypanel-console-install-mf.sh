#!/bin/sh
# Cola no Console Easypanel (serviço OpenClaw, status Running).
# Requer MF_API_URL e OPENCLAW_WEBHOOK_SECRET nas variáveis do contentor.

set -e
WS=/home/node/.openclaw/workspace
mkdir -p "$WS"

if [ -z "$MF_API_URL" ] || [ -z "$OPENCLAW_WEBHOOK_SECRET" ]; then
  echo "ERRO: MF_API_URL e OPENCLAW_WEBHOOK_SECRET têm de estar definidos no Easypanel → Environment"
  exit 1
fi

export WS MF_URL="$MF_API_URL" MF_SEC="$OPENCLAW_WEBHOOK_SECRET"

node -e "
const fs = require('fs');
const path = require('path');
const d = process.env.WS;
const url = process.env.MF_URL;
const sec = process.env.MF_SEC;
const curl = path.join(d, 'mf-curl.sh');
const sh = '#!/bin/sh\n'
  + 'exec curl -sS -X POST ' + JSON.stringify(url)
  + ' -H ' + JSON.stringify('Content-Type: application/json; charset=utf-8')
  + ' -H ' + JSON.stringify('Authorization: Bearer ' + sec)
  + ' -d \"\$1\"\n';
fs.writeFileSync(curl, sh, { mode: 0o755 });
const das = '#!/bin/sh\nset -e\n'
  + 'MF_CURL=\"' + curl + '\"\n'
  + 'PHONE=\"\${1:?phone 5521996185328}\"\n'
  + 'MES=\"\${2:?MM/YYYY}\"\n'
  + 'TMP=\"\$(mktemp)\"; trap \"rm -f \\\"\$TMP\\\"\" EXIT\n'
  + '\"\$MF_CURL\" \"{\\\"phone\\\":\\\"\$PHONE\\\",\\\"action\\\":\\\"get_das_current\\\",\\\"payload\\\":{\\\"mes\\\":\\\"\$MES\\\"}}\" > \"\$TMP\"\n'
  + 'node -e \"const fs=require(\\\"fs\\\");const r=JSON.parse(fs.readFileSync(process.argv[1],\\\"utf8\\\"));'
  + 'if(!r.success){console.log(JSON.stringify(r));process.exit(1);}const x=r.data||{};'
  + 'if(!x.base64){console.log(JSON.stringify({success:false,message:\\\"sem PDF\\\"}));process.exit(1);}'
  + 'const fn=String(x.fileName||\\\"DAS.pdf\\\").replace(/[^a-zA-Z0-9._-]/g,\\\"_\\\");'
  + 'const p=\\\"/tmp/\\\"+fn;fs.writeFileSync(p,Buffer.from(x.base64,\\\"base64\\\"));'
  + 'console.log(JSON.stringify({success:true,mes:x.mes,fileName:fn,file:p}));\" \"\$TMP\"\n';
fs.writeFileSync(path.join(d, 'mf-das.sh'), das, { mode: 0o755 });
fs.writeFileSync(path.join(d, 'MF-API.md'),
  '# Meu Financeiro\n'
  + 'SEMPRE: ' + curl + ' JSON numa linha\n'
  + 'DAS: ' + path.join(d, 'mf-das.sh') + ' 5521996185328 03/2026\n'
  + 'Depois: openclaw message send --channel whatsapp --target 5521996185328 --media /tmp/DAS-03-2026.pdf\n'
  + 'NUNCA curl com $MF_API_URL. NUNCA mostrar base64.\n'
);
console.log('OK:', curl);
console.log('OK:', path.join(d, 'mf-das.sh'));
"

echo "--- ping ---"
"$WS/mf-curl.sh" '{"action":"ping"}' | head -c 200
echo ""
echo "--- DAS 03/2026 (JSON curto) ---"
"$WS/mf-das.sh" 5521996185328 03/2026
