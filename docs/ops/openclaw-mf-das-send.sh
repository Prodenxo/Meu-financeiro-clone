#!/bin/sh
# Baixa DAS + envia no WhatsApp. Saída curta para o agente (evita "couldn't generate a response").
# Uso: mf-das-send.sh 5521996185328 03/2026
set -e
WS="$(cd "$(dirname "$0")" && pwd)"
PHONE="${1:?phone com DDI}"
MES="${2:?MM/YYYY}"
TARGET="${3:-$PHONE}"

OUT="$("$WS/mf-das.sh" "$PHONE" "$MES")" || exit 1
FILE="$(echo "$OUT" | node -e "let j=JSON.parse(require('fs').readFileSync(0,'utf8'));if(!j.file)process.exit(1);process.stdout.write(j.file)")"
MSG="DAS competência $MES"

if ! openclaw message send --channel whatsapp --target "$TARGET" --media "$FILE" --message "$MSG" 2>/tmp/mf-das-send.err; then
  echo "{\"success\":false,\"mes\":\"$MES\",\"file\":\"$FILE\",\"whatsappError\":$(node -e "const fs=require('fs');const t=fs.readFileSync('/tmp/mf-das-send.err','utf8').trim().slice(0,300);process.stdout.write(JSON.stringify(t))" 2>/dev/null || echo '\"send failed\"')}"
  exit 1
fi

echo "{\"success\":true,\"mes\":\"$MES\",\"file\":\"$FILE\",\"whatsapp\":\"sent\"}"
