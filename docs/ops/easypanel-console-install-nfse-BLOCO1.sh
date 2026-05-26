# BLOCO 1 — colar no Bash OpenClaw (só este bloco), Enter, esperar terminar
WS=/home/node/.openclaw/workspace
rm -f "$WS/mf-nfse.js" "$WS/mf-nfse.sh" "$WS/mf-nfse-send.sh" "$WS/mf-send-nfse.sh"
cat > "$WS/mf-nfse-send.sh" << 'SENDEOF'
#!/bin/sh
set -e
WS="$(cd "$(dirname "$0")" && pwd)"
PHONE="${1:?phone 55}"
NOTA_ID="${2:?uuid nota}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
"$WS/mf-curl.sh" "{\"phone\":\"$PHONE\",\"action\":\"get_nfse_pdf\",\"payload\":{\"id\":\"$NOTA_ID\",\"sync\":true,\"includeBase64\":true}}" > "$TMP"
FILE="$(node -e "
const fs=require('fs');
const r=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
if(!r.success){console.log(JSON.stringify(r));process.exit(1);}
const b=r.data&&r.data.base64;
if(!b){console.log('sem PDF');process.exit(1);}
const fn=String(r.data.fileName||'NFSe.pdf').replace(/[^a-zA-Z0-9._-]/g,'_');
const p='/tmp/'+fn;
fs.writeFileSync(p,Buffer.from(b,'base64'));
process.stdout.write(p);
" "$TMP")"
openclaw message send --channel whatsapp --target "$PHONE" --media "$FILE" --message "Segue a NFSe emitida."
echo "{\"success\":true,\"notaId\":\"$NOTA_ID\",\"file\":\"$FILE\",\"whatsapp\":\"sent\"}"
SENDEOF
chmod +x "$WS/mf-nfse-send.sh"
ln -sf "$WS/mf-nfse-send.sh" "$WS/mf-send-nfse.sh" 2>/dev/null || cp "$WS/mf-nfse-send.sh" "$WS/mf-send-nfse.sh"
chmod +x "$WS/mf-send-nfse.sh"
ls -la "$WS/mf-nfse-send.sh" "$WS/mf-curl.sh"
echo OK bloco1
