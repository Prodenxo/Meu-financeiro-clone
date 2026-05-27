#!/bin/bash
# Easypanel OpenClaw Console — mf-curl com remetente verificado (header).
# Requer MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Environment.
set -e
WS="${OPENCLAW_WORKSPACE:-/home/node/.openclaw/workspace}"
mkdir -p "$WS"
test -n "$MF_API_URL" && test -n "$OPENCLAW_WEBHOOK_SECRET" || {
  echo "ERRO: defina MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Easypanel"
  exit 1
}

cat > "$WS/mf-curl.sh" << 'CURL_EOF'
#!/bin/sh
# Uso: mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"list_transactions"}'
# TELEFONE = remetente no painel OpenClaw (+55…), NUNCA número que o utilizador digitar no chat.
set -e
SENDER="${1:?mf-curl.sh: falta TELEFONE_REMETENTE (1º arg)}"
shift
JSON="${1:?mf-curl.sh: falta JSON (2º arg)}"
MF_URL='MF_URL_PLACEHOLDER'
MF_SEC='MF_SEC_PLACEHOLDER'
BODY="$(node -e "
const sender=process.argv[1];
const raw=process.argv[2];
let j;
try { j=JSON.parse(raw); } catch (e) { console.error('JSON inválido:', e.message); process.exit(1); }
j.phone=sender.replace(/\D/g,'');
console.log(JSON.stringify(j));
" "$SENDER" "$JSON")"
exec curl -sS -X POST "$MF_URL" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Authorization: Bearer $MF_SEC" \
  -H "X-WhatsApp-Sender: $(echo "$SENDER" | tr -cd '0-9')" \
  -d "$BODY"
CURL_EOF

sed -i "s|MF_URL_PLACEHOLDER|$MF_API_URL|g" "$WS/mf-curl.sh"
sed -i "s|MF_SEC_PLACEHOLDER|$OPENCLAW_WEBHOOK_SECRET|g" "$WS/mf-curl.sh"
chmod +x "$WS/mf-curl.sh"

echo "[ok] $WS/mf-curl.sh (2 args + X-WhatsApp-Sender)"
head -n 5 "$WS/mf-curl.sh"
