#!/bin/bash
# Easypanel OpenClaw — instala hook mf-pin-sender + activa em openclaw.json
set -e
SRC_DIR="$(cd "$(dirname "$0")/../hooks/mf-pin-sender" && pwd)"
DEST="${HOME:-/home/node}/.openclaw/hooks/mf-pin-sender"
CFG="${OPENCLAW_STATE_DIR:-${HOME:-/home/node}/.openclaw}/openclaw.json"

test -f "$SRC_DIR/handler.ts" || {
  echo "ERRO: não encontrado $SRC_DIR — copia hooks/mf-pin-sender para o contentor"
  exit 1
}

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -r "$SRC_DIR" "$DEST"
echo "[ok] hook copiado para $DEST"

node -e "
const fs=require('fs');
const p=process.argv[1];
let c={};
try{c=JSON.parse(fs.readFileSync(p,'utf8'));}catch(e){console.warn('openclaw.json novo');}
c.hooks=c.hooks||{};
c.hooks.internal=c.hooks.internal||{};
c.hooks.internal.enabled=true;
c.hooks.internal.entries=c.hooks.internal.entries||{};
c.hooks.internal.entries['mf-pin-sender']={enabled:true};
fs.mkdirSync(require('path').dirname(p),{recursive:true});
fs.writeFileSync(p,JSON.stringify(c,null,2));
console.log('[ok] hooks.internal.enabled + mf-pin-sender');
" "$CFG"

if command -v openclaw >/dev/null 2>&1; then
  openclaw hooks enable mf-pin-sender 2>/dev/null || true
  openclaw hooks list 2>/dev/null | grep -i mf-pin || true
fi

echo ""
echo "Próximo: Restart contentor OpenClaw + WhatsApp /new"
echo "Depois: cat ${OPENCLAW_WORKSPACE:-/home/node/.openclaw/workspace}/.mf-inbound-sender"
