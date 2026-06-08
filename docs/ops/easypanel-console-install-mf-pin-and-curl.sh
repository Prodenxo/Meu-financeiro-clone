#!/bin/bash
# Colar TUDO no Easypanel → OpenClaw → Console → Bash (uma vez).
# Requer no Environment: MF_API_URL, OPENCLAW_WEBHOOK_SECRET
set -e
WS="${OPENCLAW_WORKSPACE:-/home/node/.openclaw/workspace}"
HOOK_DIR="${HOME:-/home/node}/.openclaw/hooks/mf-pin-sender"
CFG="${OPENCLAW_STATE_DIR:-${HOME:-/home/node}/.openclaw}/openclaw.json"

test -n "$MF_API_URL" && test -n "$OPENCLAW_WEBHOOK_SECRET" || {
  echo "ERRO: defina MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Easypanel → Environment → Restart"
  exit 1
}

mkdir -p "$WS" "$(dirname "$HOOK_DIR")"

echo "=== 1/3 mf-curl.sh (pin do remetente) ==="
cat > "$WS/mf-curl.sh" << CURL_EOF
#!/bin/sh
set -e
WS_DIR="\$(cd "\$(dirname "\$0")" && pwd)"
PINFILE="\$WS_DIR/.mf-inbound-sender"
AGENT_ARG="\${1:?mf-curl: falta telefone (1º arg)}"
shift
JSON="\${1:?mf-curl: falta JSON (2º arg)}"
MF_URL="\${MF_API_URL:-$MF_API_URL}"
MF_SEC="\${OPENCLAW_WEBHOOK_SECRET:-$OPENCLAW_WEBHOOK_SECRET}"
case "\$MF_URL" in
  https://*) ;;
  *)
    echo "mf-curl: MF_API_URL inválida (defina no Easypanel Environment e regenere mf-curl.sh)" >&2
    echo "mf-curl: valor atual=\$MF_URL" >&2
    exit 1
    ;;
esac
[ -n "\$MF_SEC" ] || { echo "mf-curl: OPENCLAW_WEBHOOK_SECRET vazio" >&2; exit 1; }
digits() { echo "\$1" | tr -cd '0-9'; }
PIN=""
[ -f "\$PINFILE" ] && PIN="\$(digits "\$(cat "\$PINFILE" 2>/dev/null)")"
for envv in "\$OPENCLAW_INBOUND_PHONE" "\$MF_MANDATORY_SENDER" "\$REMETENTE_WHATSAPP"; do
  [ -z "\$PIN" ] && [ -n "\$envv" ] && PIN="\$(digits "\$envv")"
done
AGENT="\$(digits "\$AGENT_ARG")"
if [ -n "\$PIN" ]; then
  [ -n "\$AGENT" ] && [ "\$AGENT" != "\$PIN" ] && echo "mf-curl: agente (\$AGENT) ignorado; usa \$PIN" >&2
  SENDER="\$PIN"
else
  SENDER="\$AGENT"
fi
[ -n "\$SENDER" ] || { echo "mf-curl: remetente vazio" >&2; exit 1; }
BODY="\$(node -e "
const s=process.argv[1],r=process.argv[2];
let j=JSON.parse(r); j.phone=s.replace(/\\\\D/g,''); console.log(JSON.stringify(j));
" "\$SENDER" "\$JSON")"
exec curl -sS -X POST "\$MF_URL" \\
  -H "Content-Type: application/json; charset=utf-8" \\
  -H "Authorization: Bearer \$MF_SEC" \\
  -H "X-WhatsApp-Sender: \$SENDER" \\
  -d "\$BODY"
CURL_EOF
chmod +x "$WS/mf-curl.sh"
echo "[ok] mf-curl.sh"
grep -n 'MF_URL=' "$WS/mf-curl.sh" | head -n 1 || true
head -n 12 "$WS/mf-curl.sh"

echo "=== 2/3 hook mf-pin-sender ==="
mkdir -p "$HOOK_DIR"
cat > "$HOOK_DIR/HOOK.md" << 'HOOKMD'
---
name: mf-pin-sender
description: "Grava telefone do remetente WhatsApp para mf-curl.sh"
metadata: { "openclaw": { "emoji": "📌", "events": ["message:received"] } }
---
HOOKMD

cat > "$HOOK_DIR/handler.ts" << 'HANDLEREOF'
import fs from 'node:fs';
import path from 'node:path';
const workspaceDir = () =>
  (process.env.OPENCLAW_WORKSPACE || '/home/node/.openclaw/workspace').trim();
const digitsOnly = (v: unknown) => String(v ?? '').replace(/\D/g, '');
const resolveInboundDigits = (context: Record<string, unknown>): string => {
  const meta =
    context.metadata && typeof context.metadata === 'object'
      ? (context.metadata as Record<string, unknown>)
      : {};
  for (const raw of [meta.senderE164, meta.senderId, context.from, meta.from]) {
    const d = digitsOnly(raw);
    if (d.length >= 10) return d;
  }
  return '';
};
const handler = async (event: {
  type?: string;
  action?: string;
  context?: Record<string, unknown>;
}) => {
  if (event.type !== 'message' || event.action !== 'received') return;
  const phone = resolveInboundDigits(event.context || {});
  if (!phone) return;
  const ws = workspaceDir();
  fs.mkdirSync(ws, { recursive: true });
  fs.writeFileSync(path.join(ws, '.mf-inbound-sender'), phone, 'utf8');
};
export default handler;
HANDLEREOF
echo "[ok] $HOOK_DIR"

echo "=== 3/3 openclaw.json (hooks internos) ==="
node -e "
const fs=require('fs');
const p=process.argv[1];
let c={};
try{c=JSON.parse(fs.readFileSync(p,'utf8'));}catch(e){}
c.hooks=c.hooks||{};
c.hooks.internal=c.hooks.internal||{};
c.hooks.internal.enabled=true;
c.hooks.internal.entries=c.hooks.internal.entries||{};
c.hooks.internal.entries['mf-pin-sender']={enabled:true};
fs.mkdirSync(require('path').dirname(p),{recursive:true});
fs.writeFileSync(p,JSON.stringify(c,null,2));
console.log('[ok] hooks.internal.enabled=true, mf-pin-sender enabled');
" "$CFG"

if command -v openclaw >/dev/null 2>&1; then
  openclaw hooks enable mf-pin-sender 2>/dev/null || true
  openclaw hooks list 2>/dev/null | grep -i mf-pin || true
fi

echo ""
echo "=== PRONTO ==="
echo "1) Easypanel → Restart contentor OpenClaw"
echo "2) WhatsApp → /new"
echo "3) Teste: Angélica manda msg → cat $WS/.mf-inbound-sender"
echo "4) mf-curl com arg errado deve usar o pin:"
echo "   $WS/mf-curl.sh 5521996185328 '{\"action\":\"resolve_user\"}'"
