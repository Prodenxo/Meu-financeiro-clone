#!/bin/sh
# Baixa NFSe + envia no WhatsApp. Saída curta para o agente.
# Uso: mf-nfse-send.sh TELEFONE_DO_REMETENTE_55 UUID_DA_NOTA
set -e
WS="$(cd "$(dirname "$0")" && pwd)"
PHONE="${1:?phone com DDI}"
NOTA_ID="${2:?UUID da nota}"
TARGET="${3:-$PHONE}"

OUT="$("$WS/mf-nfse.sh" "$PHONE" "$NOTA_ID")" || {
  echo '{"success":false,"step":"mf-nfse.sh","message":"falha ao obter PDF"}'
  exit 1
}
FILE="$(echo "$OUT" | node -e "let j=JSON.parse(require('fs').readFileSync(0,'utf8'));if(!j.file)process.exit(1);process.stdout.write(j.file)")" || {
  echo "$OUT"
  echo '{"success":false,"step":"parse","message":"mf-nfse.sh sem campo file"}'
  exit 1
}
MSG="Segue a NFSe emitida."

if ! openclaw message send --channel whatsapp --target "$TARGET" --media "$FILE" --message "$MSG" 2>/tmp/mf-nfse-send.err; then
  echo "{\"success\":false,\"notaId\":\"$NOTA_ID\",\"file\":\"$FILE\",\"whatsappError\":$(node -e "const fs=require('fs');const t=fs.readFileSync('/tmp/mf-nfse-send.err','utf8').trim().slice(0,300);process.stdout.write(JSON.stringify(t))" 2>/dev/null || echo '\"send failed\"')}"
  exit 1
fi

echo "{\"success\":true,\"notaId\":\"$NOTA_ID\",\"file\":\"$FILE\",\"whatsapp\":\"sent\"}"
