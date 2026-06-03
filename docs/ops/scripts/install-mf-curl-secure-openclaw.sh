#!/bin/bash
# Easypanel OpenClaw Console — mf-curl com remetente verificado (header + pin do hook).
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
# O 1º arg é fallback; prioridade: .mf-inbound-sender (hook) > env > arg.
set -e
WS_DIR="$(cd "$(dirname "$0")" && pwd)"
PINFILE="$WS_DIR/.mf-inbound-sender"
AGENT_ARG="${1:?mf-curl.sh: falta TELEFONE_REMETENTE (1º arg)}"
shift
JSON="${1:?mf-curl.sh: falta JSON (2º arg)}"
MF_URL='MF_URL_PLACEHOLDER'
MF_SEC='MF_SEC_PLACEHOLDER'

digits() { echo "$1" | tr -cd '0-9'; }

PIN=""
if [ -f "$PINFILE" ]; then
  PIN="$(digits "$(cat "$PINFILE" 2>/dev/null)")"
fi
for envv in "$OPENCLAW_INBOUND_PHONE" "$MF_MANDATORY_SENDER" "$REMETENTE_WHATSAPP"; do
  if [ -z "$PIN" ] && [ -n "$envv" ]; then
    PIN="$(digits "$envv")"
  fi
done
AGENT="$(digits "$AGENT_ARG")"

if [ -n "$PIN" ]; then
  if [ -n "$AGENT" ] && [ "$AGENT" != "$PIN" ]; then
    echo "mf-curl: telefone do agente ($AGENT) ignorado; usa remetente $PIN" >&2
  fi
  SENDER="$PIN"
else
  SENDER="$AGENT"
fi

test -n "$SENDER" || { echo "mf-curl: remetente vazio" >&2; exit 1; }

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
  -H "X-WhatsApp-Sender: $SENDER" \
  -d "$BODY"
CURL_EOF

sed -i "s|MF_URL_PLACEHOLDER|$MF_API_URL|g" "$WS/mf-curl.sh"
sed -i "s|MF_SEC_PLACEHOLDER|$OPENCLAW_WEBHOOK_SECRET|g" "$WS/mf-curl.sh"
chmod +x "$WS/mf-curl.sh"

echo "[ok] $WS/mf-curl.sh (pin + 2 args + X-WhatsApp-Sender)"
head -n 8 "$WS/mf-curl.sh"
