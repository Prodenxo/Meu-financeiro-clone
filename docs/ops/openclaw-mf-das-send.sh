#!/bin/sh
# Envia PDF DAS no WhatsApp. Tenta Z-API via backend; senão mf-das.sh + openclaw message send.
# Uso: mf-das-send.sh TELEFONE_DO_REMETENTE_55 03/2026
set -e
WS="$(cd "$(dirname "$0")" && pwd)"
PHONE="${1:?phone com DDI 55}"
MES="${2:?MM/YYYY}"
TARGET="${3:-$PHONE}"

API_RAW="$("$WS/mf-curl.sh" "$PHONE" "{\"action\":\"send_das_whatsapp\",\"payload\":{\"mes\":\"$MES\"}}" 2>/dev/null)" || API_RAW=""
if [ -n "$API_RAW" ]; then
  API_OK=$(echo "$API_RAW" | node -e "
let j;
try { j = JSON.parse(require('fs').readFileSync(0, 'utf8')); } catch (e) { process.exit(1); }
const w = (j.data && j.data.whatsappStatus) || '';
if (j.success && (w === 'sent' || /enviado/i.test(String(j.message || '')))) {
  process.stdout.write('yes');
  process.exit(0);
}
process.exit(1);
" 2>/dev/null) || API_OK=""
  if [ "$API_OK" = "yes" ]; then
    echo "$API_RAW"
    exit 0
  fi
fi

OUT="$("$WS/mf-das.sh" "$PHONE" "$MES")" || {
  echo '{"success":false,"step":"mf-das.sh","message":"falha ao obter PDF"}'
  [ -n "$API_RAW" ] && echo "$API_RAW"
  exit 1
}
FILE="$(echo "$OUT" | node -e "let j=JSON.parse(require('fs').readFileSync(0,'utf8'));if(!j.file)process.exit(1);process.stdout.write(j.file)")" || {
  echo "$OUT"
  echo '{"success":false,"step":"parse","message":"mf-das.sh sem campo file"}'
  exit 1
}
MSG="DAS competência $MES"

if ! openclaw message send --channel whatsapp --target "$TARGET" --media "$FILE" --message "$MSG" 2>/tmp/mf-das-send.err; then
  echo "{\"success\":false,\"mes\":\"$MES\",\"file\":\"$FILE\",\"whatsappError\":$(node -e "const fs=require('fs');const t=fs.readFileSync('/tmp/mf-das-send.err','utf8').trim().slice(0,300);process.stdout.write(JSON.stringify(t))" 2>/dev/null || echo '\"send failed\"')}"
  exit 1
fi

ACCOUNT="$(echo "$OUT" | node -e "let j=JSON.parse(require('fs').readFileSync(0,'utf8'));const a=j.dasAccount||{};process.stdout.write(a.displayName||'')" 2>/dev/null || true)"
echo "{\"success\":true,\"mes\":\"$MES\",\"file\":\"$FILE\",\"dasAccount\":\"$ACCOUNT\",\"whatsapp\":\"sent\"}"
