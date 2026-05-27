#!/bin/sh
# Console Easypanel — serviço OpenClaw RUNNING. Cola o ficheiro inteiro ou corre linha a linha.
set -e
WS=/home/node/.openclaw/workspace
mkdir -p "$WS"

if ! grep -q 'X-WhatsApp-Sender' "$WS/mf-curl.sh" 2>/dev/null; then
  test -n "$MF_API_URL" && test -n "$OPENCLAW_WEBHOOK_SECRET" || {
    echo "ERRO: defina MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Easypanel → Restart"
    exit 1
  }
  node -e "
const fs=require('fs'),path=require('path');
const ws=process.env.OPENCLAW_WORKSPACE||'/home/node/.openclaw/workspace';
const u=process.env.MF_API_URL,s=process.env.OPENCLAW_WEBHOOK_SECRET;
const sh='#!/bin/sh\\nset -e\\nSENDER=\"\${1:?TELEFONE_REMETENTE}\"; shift\\nJSON=\"\${1:?json}\";\\n'
+'BODY=\$(node -e \"const s=process.argv[1],r=process.argv[2];let j=JSON.parse(r);j.phone=s.replace(/\\\\D/g,\\\"\\\");console.log(JSON.stringify(j));\" \"\$SENDER\" \"\$JSON\")\\n'
+'exec curl -sS -X POST '+JSON.stringify(u)
+' -H '+JSON.stringify('Content-Type: application/json; charset=utf-8')
+' -H '+JSON.stringify('Authorization: Bearer '+s)
+' -H \"X-WhatsApp-Sender: \$(echo \"\$SENDER\" | tr -cd 0-9)\" -d \"\$BODY\"\\n';
fs.writeFileSync(path.join(ws,'mf-curl.sh'),sh,{mode:0o755});
console.log('[ok] mf-curl.sh seguro (2 args)');
" OPENCLAW_WORKSPACE="$WS" MF_API_URL="$MF_API_URL" OPENCLAW_WEBHOOK_SECRET="$OPENCLAW_WEBHOOK_SECRET"
else
  echo "OK: mf-curl.sh já é seguro"
fi

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
const body = JSON.stringify({ action: 'get_das_current', payload: { mes, includeBase64: true } });
const raw = execFileSync(curl, [phone, body], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
let r;
try { r = JSON.parse(raw); } catch (e) {
  console.error(raw.slice(0, 500));
  process.exit(1);
}
if (!r.success) {
  const errOut = {
    success: false,
    message: r.message || 'Falha na API',
    code: r.errors?.code || r.data?.code || null,
    botHint: r.errors?.botHint || null,
    mes: r.errors?.mes || mes,
  };
  console.log(JSON.stringify(errOut));
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

# mf-das-send.sh — copiar lógica actualizada (send_das_whatsapp + fallback)
if [ -f "$(dirname "$0")/openclaw-mf-das-send.sh" ]; then
  cp "$(dirname "$0")/openclaw-mf-das-send.sh" "$WS/mf-das-send.sh"
  chmod +x "$WS/mf-das-send.sh"
else
cat > "$WS/mf-das-send.sh" << 'SEND_EOF'
#!/bin/sh
set -e
WS="$(cd "$(dirname "$0")" && pwd)"
PHONE="${1:?phone}"
MES="${2:?MM/YYYY}"
TARGET="${3:-$PHONE}"
API_RAW="$("$WS/mf-curl.sh" "$PHONE" "{\"action\":\"send_das_whatsapp\",\"payload\":{\"mes\":\"$MES\"}}" 2>/dev/null)" || API_RAW=""
if [ -n "$API_RAW" ]; then
  API_OK=$(echo "$API_RAW" | node -e "let j;try{j=JSON.parse(require('fs').readFileSync(0,'utf8'))}catch(e){process.exit(1)};const w=(j.data&&j.data.whatsappStatus)||'';if(j.success&&(w==='sent'||/enviado/i.test(String(j.message||'')))){process.stdout.write('yes');process.exit(0)};process.exit(1)" 2>/dev/null) || API_OK=""
  if [ "$API_OK" = "yes" ]; then echo "$API_RAW"; exit 0; fi
fi
OUT="$("$WS/mf-das.sh" "$PHONE" "$MES")" || { echo '{"success":false,"step":"mf-das.sh"}'; exit 1; }
FILE="$(echo "$OUT" | node -e "let j=JSON.parse(require('fs').readFileSync(0,'utf8'));if(!j.file)process.exit(1);process.stdout.write(j.file)")" || { echo "$OUT"; exit 1; }
openclaw message send --channel whatsapp --target "$TARGET" --media "$FILE" --message "DAS $MES" || { echo '{"success":false,"step":"whatsapp"}'; exit 1; }
echo "{\"success\":true,\"mes\":\"$MES\",\"file\":\"$FILE\",\"whatsapp\":\"sent\"}"
SEND_EOF
chmod +x "$WS/mf-das-send.sh"
fi
printf '#!/bin/sh\nset -e\nWS="$(cd "$(dirname "$0")" && pwd)"\nexec "$WS/mf-das-send.sh" "$@"\n' > "$WS/mf-send-das.sh"
chmod +x "$WS/mf-send-das.sh"

printf '%s\n' \
  'DAS: exec mf-das-send.sh com o TELEFONE DO REMETENTE deste chat (DDI 55).' \
  'PROIBIDO pedir CNPJ ou certificado no chat — a API usa o telefone + certificado da app.' \
  '02/2026 antes da abertura MEI (março): API devolve MEI_DAS_PERIODO_INDISPONIVEL — explique, não peça dados.' \
  'Se mf-das.sh falhar, repita o campo message do JSON; não inventes pedido de certificado.' \
  'Confirme dasAccount.displayName no JSON antes de enviar.' \
  'Só diga enviado se JSON tiver "whatsapp":"sent".' > "$WS/DAS-WHATSAPP.md"

printf '%s\n' \
  'DAS: mf-das-send.sh <telefone_remetente_55> MM/YYYY' \
  'Confirmar só com "whatsapp":"sent" no JSON.' > "$WS/MF-API.md"

echo "=== ficheiros ==="
ls -la "$WS"/mf-*.sh "$WS"/*.md
echo "=== teste (opcional) — troca pelo TEU telefone do painel OpenClaw ==="
echo "mf-curl resolve_user:"
echo "  $WS/mf-curl.sh 55XXXXXXXXXXX '{\"action\":\"resolve_user\"}'"
echo "mf-das + WhatsApp:"
echo "  $WS/mf-das.sh 55XXXXXXXXXXX 02/2026"
echo "  $WS/mf-das-send.sh 55XXXXXXXXXXX 02/2026"
