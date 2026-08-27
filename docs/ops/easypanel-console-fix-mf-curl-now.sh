#!/bin/bash
# Colar TUDO no Easypanel → openclaw-gateway → Console (Bash).
# Corrige mf-curl.sh QUEBRADO (151 bytes / 0 lines / no line terminators).
set -e

WS="${OPENCLAW_WORKSPACE:-/home/node/.openclaw/workspace}"
MF_URL="${MF_API_URL:-https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/bot/openclaw/action}"
MF_SEC="${OPENCLAW_WEBHOOK_SECRET:-}"
TARGET="$WS/mf-curl.sh"

if [ -z "$MF_SEC" ]; then
  echo "ERRO: OPENCLAW_WEBHOOK_SECRET vazio. Environment → confira → Restart → rode de novo."
  exit 1
fi
mkdir -p "$WS"
rm -f /home/node/.openclaw/mf-curl.sh "$TARGET"

echo "=== Gerando mf-curl.sh via node (newlines garantidos) ==="
MF_URL="$MF_URL" MF_SEC="$MF_SEC" TARGET="$TARGET" node << 'NODE'
const fs = require('fs')
const url = process.env.MF_URL || ''
const sec = process.env.MF_SEC || ''
const target = process.env.TARGET || ''
if (!url || !sec || !target) throw new Error('env incompleta')

const lines = [
  '#!/bin/sh',
  'set -e',
  'WS_DIR="$(cd "$(dirname "$0")" && pwd)"',
  'PINFILE="$WS_DIR/.mf-inbound-sender"',
  'AGENT_ARG="${1:?mf-curl: falta telefone}"',
  'JSON="${2:?mf-curl: falta JSON}"',
  `MF_URL="${url.replace(/"/g, '\\"')}"`,
  `MF_SEC="${sec.replace(/"/g, '\\"')}"`,
  "digits() { printf '%s' \"$1\" | tr -cd '0-9'; }",
  'PIN=""',
  '[ -f "$PINFILE" ] && PIN="$(digits "$(cat "$PINFILE" 2>/dev/null || true)")"',
  'for envv in "${OPENCLAW_INBOUND_PHONE:-}" "${MF_MANDATORY_SENDER:-}" "${REMETENTE_WHATSAPP:-}"; do',
  '  [ -z "$PIN" ] && [ -n "$envv" ] && PIN="$(digits "$envv")"',
  'done',
  'AGENT="$(digits "$AGENT_ARG")"',
  'if [ -n "$PIN" ]; then SENDER="$PIN"; else SENDER="$AGENT"; fi',
  '[ -n "$SENDER" ] || { echo "mf-curl: remetente vazio" >&2; exit 1; }',
  'case "$JSON" in',
  '  *\'"phone"\'*) BODY="$JSON" ;;',
  '  *) BODY=$(printf \'{"phone":"%s",\' "$SENDER"; printf \'%s\' "$JSON" | sed \'1s/^{//\') ;;',
  'esac',
  'exec curl -sS --connect-timeout 10 --max-time 40 -X POST "$MF_URL" \\',
  '  -H "Content-Type: application/json; charset=utf-8" \\',
  '  -H "Authorization: Bearer $MF_SEC" \\',
  '  -H "X-WhatsApp-Sender: $SENDER" \\',
  '  -d "$BODY"',
  '',
]

fs.writeFileSync(target, lines.join('\n'), { mode: 0o755 })
const size = fs.statSync(target).size
const count = lines.length
console.log('[ok]', target, size, 'bytes', count, 'lines')
if (count < 15) throw new Error('mf-curl gerado inválido')
NODE

echo "=== Validação ==="
wc -l "$TARGET"
head -2 "$TARGET"
file "$TARGET" 2>/dev/null || true

echo "=== Teste ping ==="
OUT=$("$TARGET" 5521996185328 '{"action":"ping"}')
echo "$OUT"
echo "$OUT" | grep -q '"pong":true' || { echo "FALHOU ping"; exit 1; }
echo "[ok] ping OK"

echo ""
echo "=== SUCESSO ==="
echo "Restart openclaw-gateway → WhatsApp /new → testar."
