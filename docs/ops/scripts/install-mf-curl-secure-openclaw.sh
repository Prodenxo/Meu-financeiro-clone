#!/bin/bash
# Easypanel OpenClaw Console — mf-curl com remetente verificado (header + pin do hook).
# Requer MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Environment.
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WS="${OPENCLAW_WORKSPACE:-/home/node/.openclaw/workspace}"
mkdir -p "$WS"
test -n "$MF_API_URL" && test -n "$OPENCLAW_WEBHOOK_SECRET" || {
  echo "ERRO: defina MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Easypanel"
  exit 1
}

cp "$SCRIPT_DIR/mf-curl-resolve-sender.mjs" "$WS/mf-curl-resolve-sender.mjs"
chmod 644 "$WS/mf-curl-resolve-sender.mjs"

cat > "$WS/mf-curl.sh" << 'CURL_EOF'
#!/bin/sh
# Uso: mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"list_transactions"}'
# 1º arg = número COMPLETO do canal no painel (ex.: 5521983992146). Nunca só "55".
# Resolver: mf-curl-resolve-sender.mjs (arg válido > env > pin).
set -e
WS_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_ARG="${1:?mf-curl.sh: falta TELEFONE_REMETENTE (1º arg)}"
shift
JSON="${1:?mf-curl.sh: falta JSON (2º arg)}"
MF_URL='MF_URL_PLACEHOLDER'
MF_SEC='MF_SEC_PLACEHOLDER'
RESOLVER="$WS_DIR/mf-curl-resolve-sender.mjs"

if [ ! -f "$RESOLVER" ]; then
  echo "mf-curl: falta $RESOLVER — corre install-mf-curl-secure-openclaw.sh" >&2
  exit 1
fi

SENDER="$(node "$RESOLVER" "$WS_DIR" "$AGENT_ARG")" || exit 1
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

echo "[ok] $WS/mf-curl.sh + mf-curl-resolve-sender.mjs"
head -n 10 "$WS/mf-curl.sh"
